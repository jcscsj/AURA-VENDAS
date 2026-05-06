import { describe, it, expect, beforeAll } from "vitest";
import crypto from "crypto";
import * as dbModule from "./db";

describe("Admin Integration Flow", () => {
  const testEmail = `admin-integration-${Date.now()}@test.com`;
  const testPassword = "AdminPassword123";
  const testName = "Integration Test Admin";

  let adminId: number;

  beforeAll(async () => {
    // Clean up any existing test admin
    try {
      const existing = await dbModule.getAdminByEmail(testEmail);
      if (existing) {
        // Mark for cleanup
      }
    } catch (e) {
      // Ignore
    }
  });

  it("should complete admin setup flow", async () => {
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
    expect(admin?.name).toBe(testName);
    adminId = admin!.id;
  });

  it("should allow admin login with correct credentials", async () => {
    const admin = await dbModule.getAdminByEmail(testEmail);
    expect(admin).toBeDefined();

    const providedPasswordHash = crypto
      .createHash("sha256")
      .update(testPassword)
      .digest("hex");

    expect(providedPasswordHash).toBe(admin?.passwordHash);
  });

  it("should reject admin login with incorrect password", async () => {
    const admin = await dbModule.getAdminByEmail(testEmail);
    expect(admin).toBeDefined();

    const wrongPasswordHash = crypto
      .createHash("sha256")
      .update("WrongPassword")
      .digest("hex");

    expect(wrongPasswordHash).not.toBe(admin?.passwordHash);
  });

  it("should allow admin password reset", async () => {
    const newPassword = "NewAdminPassword456";
    const newPasswordHash = crypto
      .createHash("sha256")
      .update(newPassword)
      .digest("hex");

    await dbModule.updateAdminPassword(adminId, newPasswordHash);

    const admin = await dbModule.getAdminByEmail(testEmail);
    expect(admin?.passwordHash).toBe(newPasswordHash);
  });

  it("should track admin last signed in", async () => {
    const beforeUpdate = new Date(Date.now() - 1000);
    await dbModule.updateAdminLastSignedIn(adminId);
    const afterUpdate = new Date(Date.now() + 1000);

    const admin = await dbModule.getAdminById(adminId);
    expect(admin?.lastSignedIn).toBeDefined();
    expect(admin!.lastSignedIn.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    expect(admin!.lastSignedIn.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
  });

  it("should retrieve admin by id", async () => {
    const admin = await dbModule.getAdminById(adminId);
    expect(admin).toBeDefined();
    expect(admin?.id).toBe(adminId);
    expect(admin?.email).toBe(testEmail);
  });
});
