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

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let adminSession: any = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Check for admin session
  try {
    const adminSessionCookie = opts.req.cookies?.adminSession;
    if (adminSessionCookie) {
      const sessionData = Buffer.from(adminSessionCookie, "base64").toString("utf-8");
      adminSession = JSON.parse(sessionData);
    }
  } catch (error) {
    // Invalid admin session, ignore
    adminSession = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user: adminSession || user,
    adminSession,
  };
}
