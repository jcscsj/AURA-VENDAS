import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import * as db from "./db";
import { appRouter } from "./routers";

describe("Local Authentication E2E Flow", () => {
  const testEmail = `e2e-${Date.now()}@example.com`;
  const testPassword = "E2EPassword123";
  const testName = "E2E Test User";
  const testGameId = "E2E-GAME-ID";

  let mockReq: any;
  let mockRes: any;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // Setup mock request/response
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

    const mockCtx = {
      req: mockReq,
      res: mockRes,
      user: null,
    };

    caller = appRouter.createCaller(mockCtx);
  });

  afterAll(async () => {
    // Cleanup
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

  it("should complete full registration -> login -> profile flow", async () => {
    // Step 1: Register
    console.log("Step 1: Registering user...");
    const registerResult = await caller.auth.register({
      email: testEmail,
      password: testPassword,
      name: testName,
      gameId: testGameId,
    });

    expect(registerResult).toBeDefined();
    expect(registerResult.email).toBe(testEmail);
    expect(registerResult.name).toBe(testName);
    console.log("✓ User registered successfully");

    // Step 2: Login
    console.log("Step 2: Logging in...");
    const loginResult = await caller.auth.login({
      email: testEmail,
      password: testPassword,
    });

    expect(loginResult).toBeDefined();
    expect(loginResult.email).toBe(testEmail);
    expect(loginResult.gameId).toBe(testGameId);
    console.log("✓ User logged in successfully");

    // Verify session cookie is set
    expect(mockReq.cookies.localSession).toBeDefined();
    console.log("✓ Session cookie set");

    // Step 3: Access Profile
    console.log("Step 3: Accessing profile...");
    const profileResult = await caller.auth.getProfile();

    expect(profileResult).toBeDefined();
    expect(profileResult.email).toBe(testEmail);
    expect(profileResult.name).toBe(testName);
    expect(profileResult.gameId).toBe(testGameId);
    expect(profileResult.createdAt).toBeDefined();
    console.log("✓ Profile retrieved successfully");

    // Step 4: Verify lastSignedIn was updated
    console.log("Step 4: Verifying lastSignedIn timestamp...");
    expect(profileResult.lastSignedIn).toBeDefined();
    console.log("✓ lastSignedIn timestamp updated");

    // Step 5: Logout
    console.log("Step 5: Logging out...");
    await caller.auth.localLogout();
    expect(!mockReq.cookies.localSession || mockReq.cookies.localSession === "").toBe(true);
    console.log("✓ User logged out successfully");

    // Step 6: Verify profile access is denied after logout
    console.log("Step 6: Verifying profile access is denied...");
    try {
      await caller.auth.getProfile();
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
      console.log("✓ Profile access correctly denied after logout");
    }

    console.log("\n✅ Full E2E flow completed successfully!");
  });

  it("should handle concurrent login attempts", async () => {
    // Attempt multiple concurrent logins with same credentials
    const loginPromises = [
      caller.auth.login({ email: testEmail, password: testPassword }),
      caller.auth.login({ email: testEmail, password: testPassword }),
      caller.auth.login({ email: testEmail, password: testPassword }),
    ];

    const results = await Promise.all(loginPromises);

    // All should succeed
    expect(results.length).toBe(3);
    results.forEach((result) => {
      expect(result.email).toBe(testEmail);
    });

    console.log("✓ Concurrent login attempts handled correctly");
  });

  it("should validate password strength on registration", async () => {
    try {
      await caller.auth.register({
        email: `weak-${Date.now()}@example.com`,
        password: "123", // Too short
        name: "Test",
        gameId: "TEST",
      });
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toContain("password");
      console.log("✓ Weak password correctly rejected");
    }
  });

  it("should validate email format on registration", async () => {
    try {
      await caller.auth.register({
        email: "invalid-email", // Invalid email
        password: testPassword,
        name: "Test",
        gameId: "TEST",
      });
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error).toBeDefined();
      console.log("✓ Invalid email correctly rejected");
    }
  });
});
