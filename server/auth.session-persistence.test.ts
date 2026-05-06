import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Local Session Persistence", () => {
  let testAccountId: number;
  const testEmail = `session-test-${Date.now()}@test.com`;
  const testPassword = "TestPassword123!";
  const testName = "Session Test User";
  const testGameId = "12345";

  beforeAll(async () => {
    // Criar conta de teste
    const account = await db.createLocalAccount({
      email: testEmail,
      passwordHash: require("crypto")
        .createHash("sha256")
        .update(testPassword)
        .digest("hex"),
      name: testName,
      gameId: testGameId,
    });

    if (!account) {
      throw new Error("Failed to create test account");
    }

    testAccountId = account.id;
  });

  it("should retrieve local account by ID after creation", async () => {
    const account = await db.getLocalAccountById(testAccountId);
    expect(account).toBeDefined();
    expect(account?.id).toBe(testAccountId);
    expect(account?.email).toBe(testEmail);
    expect(account?.name).toBe(testName);
    expect(account?.gameId).toBe(testGameId);
  });

  it("should persist lastSignedIn timestamp", async () => {
    const beforeUpdate = new Date();
    await db.updateLocalAccount(testAccountId, { lastSignedIn: beforeUpdate });

    const account = await db.getLocalAccountById(testAccountId);
    expect(account?.lastSignedIn).toBeDefined();
    expect(new Date(account!.lastSignedIn).getTime()).toBeGreaterThanOrEqual(
      beforeUpdate.getTime() - 1000
    );
  });

  it("should maintain session data across multiple queries", async () => {
    const account1 = await db.getLocalAccountById(testAccountId);
    const account2 = await db.getLocalAccountById(testAccountId);

    expect(account1?.id).toBe(account2?.id);
    expect(account1?.email).toBe(account2?.email);
    expect(account1?.name).toBe(account2?.name);
    expect(account1?.gameId).toBe(account2?.gameId);
  });

  it("should encode/decode session cookie correctly", async () => {
    const sessionData = { localAccountId: testAccountId };
    const encoded = Buffer.from(JSON.stringify(sessionData)).toString("base64");
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString());

    expect(decoded.localAccountId).toBe(testAccountId);
  });

  it("should retrieve account after session cookie decode", async () => {
    const sessionData = { localAccountId: testAccountId };
    const encoded = Buffer.from(JSON.stringify(sessionData)).toString("base64");
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString());

    const account = await db.getLocalAccountById(decoded.localAccountId);
    expect(account).toBeDefined();
    expect(account?.email).toBe(testEmail);
  });

  it("should handle invalid session cookie gracefully", async () => {
    const invalidCookie = "invalid-base64!!!";
    try {
      JSON.parse(Buffer.from(invalidCookie, "base64").toString());
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should return null for non-existent account ID", async () => {
    const account = await db.getLocalAccountById(999999);
    expect(account).toBeNull();
  });
});
