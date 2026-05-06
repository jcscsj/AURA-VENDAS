import axios from "axios";
import { ENV } from "./env";

const DISCORD_API_BASE = "https://discord.com/api/v10";

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  email: string | null;
  avatar: string | null;
}

export async function getDiscordAccessToken(code: string, redirectUri: string): Promise<string> {
  try {
    console.log("[Discord] Requesting access token with:", {
      client_id: ENV.discordClientId,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });
    const params = new URLSearchParams();
    params.append("client_id", ENV.discordClientId || "");
    params.append("client_secret", ENV.discordClientSecret || "");
    params.append("code", code);
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", redirectUri);
    
    const response = await axios.post(`${DISCORD_API_BASE}/oauth2/token`, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("[Discord] Got access token successfully");
    return response.data.access_token;
  } catch (error: any) {
    console.error("[Discord] Error getting access token:", error);
    if (error.response) {
      console.error("[Discord] Response status:", error.response.status);
      console.error("[Discord] Response data:", error.response.data);
    }
    if (error instanceof Error) {
      console.error("[Discord] Error message:", error.message);
    }
    throw error;
  }
}

export async function getDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await axios.get(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
}

export function getDiscordAuthUrl(redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: ENV.discordClientId || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email",
  });

  if (state) {
    params.set("state", state);
  }

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}
