import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  adminSession?: {
    id: number;
    email: string;
    name: string;
    role: "admin";
  } | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const { req, res } = opts;
  let user: User | null = null;
  let adminSession: any = null;

  // 1. Pega a sessão básica do Cookie (Rápido)
  const session = await sdk.authenticateRequest(req).catch(() => null);
  if (session) {
    user = session as User;
  }

  // 2. Pega a sessão de Admin
  try {
    const adminSessionCookie = req.cookies?.adminSession;
    if (adminSessionCookie) {
      const sessionData = Buffer.from(adminSessionCookie, "base64").toString("utf-8");
      adminSession = JSON.parse(sessionData);
    }
  } catch (e) { 
    adminSession = null; 
  }

  return {
    req,
    res,
    user: adminSession || user,
    adminSession,
  };
}
