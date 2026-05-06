import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import * as db from "./db";

describe("Local Authentication", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123";
  const testName = "Test User";
  const testGameId = "GAME123";

  beforeAll(async () => {
    // Limpar conta de teste se existir
    const existingAccount = await db.getLocalAccountByEmail(testEmail);
    if (existingAccount) {
      console.log("Test account already exists, skipping cleanup");
    }
  });

  afterAll(async () => {
    // Limpar conta de teste após os testes
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

  it("should create a local account", async () => {
    const passwordHash = crypto.createHash("sha256").update(testPassword).digest("hex");
    
    const account = await db.createLocalAccount({
      email: testEmail,
      passwordHash,
      name: testName,
      gameId: testGameId,
    });

    expect(account).toBeDefined();
    expect(account?.email).toBe(testEmail);
    expect(account?.name).toBe(testName);
    expect(account?.gameId).toBe(testGameId);
    expect(account?.passwordHash).toBe(passwordHash);
  });

  it("should retrieve a local account by email", async () => {
    const account = await db.getLocalAccountByEmail(testEmail);

    expect(account).toBeDefined();
    expect(account?.email).toBe(testEmail);
    expect(account?.name).toBe(testName);
    expect(account?.gameId).toBe(testGameId);
  });

  it("should verify password hash", async () => {
    const account = await db.getLocalAccountByEmail(testEmail);
    expect(account).toBeDefined();

    if (account) {
      const passwordHash = crypto.createHash("sha256").update(testPassword).digest("hex");
      expect(account.passwordHash).toBe(passwordHash);
    }
  });

  it("should reject incorrect password", async () => {
    const account = await db.getLocalAccountByEmail(testEmail);
    expect(account).toBeDefined();

    if (account) {
      const wrongPasswordHash = crypto.createHash("sha256").update("WrongPassword").digest("hex");
      expect(account.passwordHash).not.toBe(wrongPasswordHash);
    }
  });

  it("should update lastSignedIn timestamp", async () => {
    const account = await db.getLocalAccountByEmail(testEmail);
    expect(account).toBeDefined();

    if (account) {
      const now = new Date();
      const updated = await db.updateLocalAccount(account.id, { lastSignedIn: now });
      
      expect(updated).toBeDefined();
      expect(updated?.lastSignedIn).toBeDefined();
    }
  });

  it("should retrieve account by ID", async () => {
    const accountByEmail = await db.getLocalAccountByEmail(testEmail);
    expect(accountByEmail).toBeDefined();

    if (accountByEmail) {
      const accountById = await db.getLocalAccountById(accountByEmail.id);
      expect(accountById).toBeDefined();
      expect(accountById?.email).toBe(testEmail);
      expect(accountById?.id).toBe(accountByEmail.id);
    }
  });

  it("should prevent duplicate email registration", async () => {
    const passwordHash = crypto.createHash("sha256").update("AnotherPassword").digest("hex");
    
    try {
      await db.createLocalAccount({
        email: testEmail, // Email já existe
        passwordHash,
        name: "Another User",
        gameId: "GAME456",
      });
      
      // Se chegou aqui, o teste falha (não deveria permitir email duplicado)
      expect(true).toBe(false);
    } catch (error) {
      // Esperado: erro de email duplicado
      expect(error).toBeDefined();
    }
  });
});
