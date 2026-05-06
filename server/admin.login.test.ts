import { describe, it, expect, beforeAll } from "vitest";
import crypto from "crypto";
import * as dbModule from "./db";

describe("Admin Login", () => {
  const testEmail = `test-admin-${Date.now()}@test.com`;
  const testPassword = "TestPassword123";
  const testName = "Test Admin";

  beforeAll(async () => {
    // Clean up any existing test admin
    try {
      const existing = await dbModule.getAdminByEmail(testEmail);
      if (existing) {
        // Delete if exists
      }
    } catch (e) {
      // Ignore
    }
  });

  it("should create admin with correct password hash", async () => {
    const passwordHash = crypto
      .createHash("sha256")
      .update(testPassword)
      .digest("hex");

    const admin = await dbModule.createAdmin({
      email: testEmail,
      passwordHash,
      name: testName,
    } as any);

    expect(admin).toBeDefined();
    expect(admin?.email).toBe(testEmail);
    expect(admin?.passwordHash).toBe(passwordHash);
  });

  it("should retrieve admin by email", async () => {
    const admin = await dbModule.getAdminByEmail(testEmail);
    expect(admin).toBeDefined();
    expect(admin?.email).toBe(testEmail);
  });

  it("should verify password hash matches", async () => {
    const admin = await dbModule.getAdminByEmail(testEmail);
    expect(admin).toBeDefined();

    const providedPasswordHash = crypto
      .createHash("sha256")
      .update(testPassword)
      .digest("hex");

    expect(providedPasswordHash).toBe(admin?.passwordHash);
  });

  it("should fail with incorrect password", async () => {
    const admin = await dbModule.getAdminByEmail(testEmail);
    expect(admin).toBeDefined();

    const wrongPasswordHash = crypto
      .createHash("sha256")
      .update("WrongPassword123")
      .digest("hex");

    expect(wrongPasswordHash).not.toBe(admin?.passwordHash);
  });
});
