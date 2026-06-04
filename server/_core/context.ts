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

  // 1. BLINDAGEM: Tenta ler a sessão. Se der erro (cookie corrompido), APAGA o cookie.
  try {
    const session = await sdk.authenticateRequest(req);
    // Só aceita se a sessão for válida e tiver um openId real
    if (session && session.openId) {
      user = session as User;
    } else {
      res.clearCookie("app_session_id");
    }
  } catch (error) {
    // Se o sistema do Manus falhar ao ler o cookie, jogamos ele no lixo
    res.clearCookie("app_session_id");
    user = null;
  }

  // 2. Pega a sessão de Admin
  try {
    const adminSessionCookie = req.cookies?.adminSession;
    if (adminSessionCookie) {
      const sessionData = Buffer.from(adminSessionCookie, "base64").toString("utf-8");
      adminSession = JSON.parse(sessionData);
    }
  } catch (e) { 
    res.clearCookie("adminSession");
    adminSession = null; 
  }

 return {
    req: opts.req,
    res: opts.res,
    // FATO TÉCNICO: Se for Admin, injetamos um openId falso para o servidor de imagens não crashar
    user: adminSession ? { ...adminSession, openId: `admin_${adminSession.id}` } as any : user,
    adminSession,
  };
}
