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
      // Decodificamos o redirectUri que o frontend enviou via 'state'
      const redirectUri = Buffer.from(state, 'base64').toString('utf-8');
      
      // 1. Troca o código pelo Token do Discord
      const accessToken = await getDiscordAccessToken(code, redirectUri);
      
      // 2. Pega os dados do usuário no Discord
      const discordUser = await getDiscordUser(accessToken);

      // 3. Formata o ID e Nome para o padrão da loja
      const openId = `discord_${discordUser.id}`;
      const userName = discordUser.global_name || discordUser.username;

      // FATO TÉCNICO: Montamos a URL da foto oficial do Discord
      const avatarUrl = discordUser.avatar 
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${Number(discordUser.id) % 5}.png`;

      // FATO TÉCNICO: Log de segurança para você ver no Render se o ID chegou
      console.log(`[AUTH] Tentando salvar usuário: ${userName} | ID: ${discordUser.id}`);

      // 4. Salva ou atualiza no banco de dados TiDB
      await db.upsertUser({
        openId,
        name: userName,
        email: discordUser.email || null,
        loginMethod: "discord",
        discordId: discordUser.id,
        profilePicture: avatarUrl, // ADICIONAMOS A FOTO AQUI
        lastSignedIn: new Date(),
      });

      // 5. Cria a sessão oficial do site (usando o SDK do Manus para compatibilidade)
      const sessionToken = await sdk.createSessionToken(openId, {
        name: userName,
        expiresInMs: ONE_YEAR_MS,
      });

      // 6. Seta o Cookie e manda o jogador de volta pra loja
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // FATO TÉCNICO: Decodificamos o 'state' (que é a URL de onde o usuário veio)
      // Se por algum motivo o state estiver bugado, ele volta para a Home "/" por segurança.
      let redirectUri = "/";
      try {
        if (state) {
          redirectUri = Buffer.from(state, 'base64').toString('utf-8');
        }
      } catch (e) {
        console.error("[OAuth] Erro ao decodificar o state, voltando para a home.");
      }

      // Agora ele redireciona para a página exata (Ex: /checkout)
      res.redirect(302, redirectUri);

    } catch (error) {
      console.error("[Discord OAuth] Erro no login:", error);
      res.status(500).json({ 
        error: "Falha ao logar com Discord", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
}
