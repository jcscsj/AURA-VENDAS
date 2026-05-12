export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const getLoginUrl = () => {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
  if (!clientId) return "#";

  const apiCallbackUrl = `${window.location.origin}/api/oauth/callback`;

  // FATO TÉCNICO: Se o usuário já está na página de login, o retorno deve ser a HOME "/"
  // Caso contrário, ele volta para onde estava (ex: /checkout)
  const returnTo = window.location.pathname === "/login" 
    ? window.location.origin + "/" 
    : window.location.href;

  const state = btoa(returnTo);

  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", apiCallbackUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify email");
  url.searchParams.set("state", state);

  return url.toString();
};
