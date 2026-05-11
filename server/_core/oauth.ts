import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { getDiscordAccessToken, getDiscordUser } from "./discordOAuth";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // ROTA PRINCIPAL DE CALLBACK (A que o frontend usa)
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      return res.status(400).json({ error: "Code and state are required" });
    }

    try {
      // 1. Endereço fixo da API para trocar o token (Obrigatório para o Discord)
      const apiCallbackUrl = `${req.protocol}://${req.get('host')}/api/oauth/callback`;
      
      // 2. Troca o código pelo Token do Discord
      const accessToken = await getDiscordAccessToken(code, apiCallbackUrl);
      
      // 3. Pega os dados do usuário no Discord
      const discordUser = await getDiscordUser(accessToken);

      // 4. Formata e salva no banco
      const openId = `discord_${discordUser.id}`;
      const userName = discordUser.global_name || discordUser.username;

      await db.upsertUser({
        openId,
        name: userName,
        email: discordUser.email || null,
        loginMethod: "discord",
        discordId: discordUser.id,
        profilePicture: discordUser.avatar 
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : null,
        lastSignedIn: new Date(),
      });

      // 5. Cria a sessão
      const sessionToken = await sdk.createSessionToken(openId, {
        name: userName,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // ==========================================
      // LÓGICA DE REDIRECIONAMENTO (Nomes únicos para evitar erro)
      // ==========================================
      let finalTargetUrl = "/"; // Padrão é a home
      try {
        // Decodifica o 'state' vindo do frontend (ex: /checkout)
        finalTargetUrl = Buffer.from(state, 'base64').toString('utf-8');
      } catch (e) {
        console.error("[OAuth] Erro ao ler destino, voltando para a home.");
      }

      // Redireciona para o destino real
      res.redirect(302, finalTargetUrl);

    } catch (error) {
      console.error("[Discord OAuth] Erro no login:", error);
      res.status(500).json({ error: "Falha ao logar" });
    }
  });
