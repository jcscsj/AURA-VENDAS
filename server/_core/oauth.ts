import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { getDiscordAccessToken, getDiscordUser, getDiscordAuthUrl } from "./discordOAuth";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // Discord OAuth callback
  app.get("/api/oauth/discord/callback", async (req: Request, res: Response) => {
    console.log("[Discord OAuth Callback] Query params:", req.query);
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    console.log("[Discord OAuth Callback] Code:", code, "State:", state);

    if (!code || !state) {
      console.log("[Discord OAuth Callback] Missing code or state");
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      // Get the origin from the request header
      const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || "https://loja5m-nzmfpfpc.manus.space";
      const redirectUri = `${origin}/api/oauth/discord/callback`;
      console.log("[Discord OAuth] Origin:", origin);
      console.log("[Discord OAuth] Using redirect URI:", redirectUri);
      console.log("[Discord OAuth] State received:", state);
      
      console.log("[Discord OAuth] Getting access token with code:", code, "redirectUri:", redirectUri);
      const accessToken = await getDiscordAccessToken(code, redirectUri);
      console.log("[Discord OAuth] Got access token");
      const discordUser = await getDiscordUser(accessToken);

      // Create or update user with Discord ID
      const openId = `discord_${discordUser.id}`;
      const userName = `${discordUser.username}#${discordUser.discriminator}`;

      await db.upsertUser({
        openId,
        name: userName,
        email: discordUser.email,
        loginMethod: "discord",
        discordId: discordUser.id,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: userName,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to home page
      const returnPath = getQueryParam(req, "return") || "/";
      res.redirect(302, returnPath);
    } catch (error) {
      console.error("[Discord OAuth] Callback failed with error:", error);
      if (error instanceof Error) {
        console.error("[Discord OAuth] Error message:", error.message);
        console.error("[Discord OAuth] Error stack:", error.stack);
      }
      res.status(500).json({ error: "Discord OAuth callback failed", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Discord login URL endpoint
  app.get("/api/oauth/discord/login", (req: Request, res: Response) => {
    // Get the origin from query parameter (passed from frontend)
    const originParam = req.query.origin as string;
    console.log("[Discord OAuth Login] Origin from query:", originParam);
    console.log("[Discord OAuth Login] req.headers.origin:", req.headers.origin);
    console.log("[Discord OAuth Login] req.headers.referer:", req.headers.referer);
    const origin = originParam || req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || "https://loja5m-nzmfpfpc.manus.space";
    const redirectUri = `${origin}/api/oauth/discord/callback`;
    // Generate a random state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);
    const authUrl = getDiscordAuthUrl(redirectUri, state);
    console.log("[Discord OAuth Login] Final Origin:", origin);
    console.log("[Discord OAuth Login] Redirect URI:", redirectUri);
    console.log("[Discord OAuth Login] Auth URL:", authUrl);
    res.redirect(302, authUrl);
  });
}
