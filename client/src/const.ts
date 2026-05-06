export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const getLoginUrl = () => {
  // Pegamos a URL da própria loja como fallback para não quebrar
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || window.location.origin;
  const appId = import.meta.env.VITE_APP_ID || "aura-shop";

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    const redirectUri = `${window.location.origin}/api/oauth/callback`;
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    return url.toString();
  } catch (e) {
    console.error("Erro ao gerar URL de login:", e);
    return "#"; // Retorna um link vazio em vez de quebrar o site
  }
};
