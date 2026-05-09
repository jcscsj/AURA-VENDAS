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
  let user: User | null = null;
  let adminSession: any = null;

  // 1. Pega a sessão básica (Cookie)
  const session = await sdk.authenticateRequest(opts.req).catch(() => null);

  // 2. FATO TÉCNICO: Se houver sessão, checamos se o usuário ainda existe no banco
  if (session?.openId) {
    const dbUser = await db.getUserByOpenId(session.openId);
    if (dbUser) {
      user = dbUser; // Usuário válido
    } else {
      // Se não existe no banco, limpamos o cookie para deslogar o cara na hora!
      opts.res.clearCookie("app_session_id");
      user = null;
    }
  }

  // Check for admin session
  try {
    const adminSessionCookie = opts.req.cookies?.adminSession;
    if (adminSessionCookie) {
      adminSession = JSON.parse(Buffer.from(adminSessionCookie, "base64").toString("utf-8"));
    }
  } catch (e) { adminSession = null; }

  return {
    req: opts.req,
    res: opts.res,
    user: adminSession || user,
    adminSession,
  };
}
