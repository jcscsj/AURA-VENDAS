export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const getLoginUrl = () => {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
  if (!clientId) return "#";

  // O "endereço oficial" que o Discord deve chamar para processar o login
  const apiCallbackUrl = `${window.location.origin}/api/oauth/callback`;

  // FATO TÉCNICO: Pegamos a página onde o usuário está agora (Ex: /checkout ou /beneficios)
  // Transformamos essa URL em base64 (state) para o servidor saber para onde devolver o jogador.
  const returnTo = window.location.href;
  const state = btoa(returnTo);

  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", apiCallbackUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify email");
  url.searchParams.set("state", state);

  return url.toString();
};
