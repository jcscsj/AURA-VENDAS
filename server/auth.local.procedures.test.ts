import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import * as db from "./db";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

describe("Local Authentication Procedures", () => {
  const testEmail = `test-proc-${Date.now()}@example.com`;
  const testPassword = "TestPassword123";
  const testName = "Test User";
  const testGameId = "GAME123";

  let caller: ReturnType<typeof appRouter.createCaller>;
  let mockReq: any;
  let mockRes: any;

  beforeAll(async () => {
    // Create mock request/response objects
    mockReq = {
      headers: {},
      cookies: {},
    };

    mockRes = {
      setHeader: function (name: string, value: string) {
        if (name === "Set-Cookie") {
          mockReq.cookies.localSession = value.split(";")[0].split("=")[1];
        }
      },
      clearCookie: function () {
        delete mockReq.cookies.localSession;
      },
    };

    // Create router caller with mock context
    const mockCtx = {
      req: mockReq,
      res: mockRes,
      user: null,
    };

    caller = appRouter.createCaller(mockCtx);
  });

  afterAll(async () => {
    // Clean up test account
    const account = await db.getLocalAccountByEmail(testEmail);
    if (account) {
      const dbInstance = await db.getDb();
      if (dbInstance) {
        const { localAccounts } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await dbInstance.delete(localAccounts).where(eq(localAccounts.email, testEmail));
      }
    }
  });

  it("should register a new local account", async () => {
    const result = await caller.auth.register({
      email: testEmail,
      password: testPassword,
      name: testName,
      gameId: testGameId,
    });

    expect(result).toBeDefined();
    expect(result.email).toBe(testEmail);
    expect(result.name).toBe(testName);
  });

  it("should reject duplicate email registration", async () => {
    try {
      await caller.auth.register({
        email: testEmail, // Email já existe
        password: "AnotherPassword123",
        name: "Another User",
        gameId: "GAME456",
      });
      // Se chegou aqui, o teste falha
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe("CONFLICT");
      expect(error.message).toContain("Email já cadastrado");
    }
  });

  it("should login with correct credentials", async () => {
    const result = await caller.auth.login({
      email: testEmail,
      password: testPassword,
    });

    expect(result).toBeDefined();
    expect(result.email).toBe(testEmail);
    expect(result.name).toBe(testName);
    expect(result.gameId).toBe(testGameId);
  });

  it("should reject login with incorrect password", async () => {
    try {
      await caller.auth.login({
        email: testEmail,
        password: "WrongPassword",
      });
      // Se chegou aqui, o teste falha
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toContain("Email ou senha incorretos");
    }
  });

  it("should reject login with non-existent email", async () => {
    try {
      await caller.auth.login({
        email: "nonexistent@example.com",
        password: testPassword,
      });
      // Se chegou aqui, o teste falha
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toContain("Email ou senha incorretos");
    }
  });

  it("should set localSession cookie on login", async () => {
    // Limpar cookie anterior
    delete mockReq.cookies.localSession;

    await caller.auth.login({
      email: testEmail,
      password: testPassword,
    });

    // Verificar se cookie foi definido
    expect(mockReq.cookies.localSession).toBeDefined();
  });

  it("should retrieve profile with valid session", async () => {
    // Primeiro fazer login para definir cookie
    await caller.auth.login({
      email: testEmail,
      password: testPassword,
    });

    // Criar novo caller com o cookie definido
    const mockCtx = {
      req: mockReq,
      res: mockRes,
      user: null,
    };

    const callerWithSession = appRouter.createCaller(mockCtx);

    const profile = await callerWithSession.auth.getProfile();

    expect(profile).toBeDefined();
    expect(profile.email).toBe(testEmail);
    expect(profile.name).toBe(testName);
    expect(profile.gameId).toBe(testGameId);
  });

  it("should reject profile access without session", async () => {
    // Criar novo caller sem cookie
    const mockReqNoSession = {
      headers: {},
      cookies: {},
    };

    const mockResNoSession = {
      setHeader: function () {},
      clearCookie: function () {},
    };

    const mockCtxNoSession = {
      req: mockReqNoSession,
      res: mockResNoSession,
      user: null,
    };

    const callerNoSession = appRouter.createCaller(mockCtxNoSession);

    try {
      await callerNoSession.auth.getProfile();
      // Se chegou aqui, o teste falha
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });

  it("should logout and clear session cookie", async () => {
    // Primeiro fazer login
    await caller.auth.login({
      email: testEmail,
      password: testPassword,
    });

    expect(mockReq.cookies.localSession).toBeDefined();

    // Fazer logout
    await caller.auth.localLogout();

    // Cookie deve ser limpo (vazio ou undefined)
    expect(!mockReq.cookies.localSession || mockReq.cookies.localSession === "").toBe(true);
  });
});
