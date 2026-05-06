export const getLoginUrl = () => {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
  if (!clientId) return "#"; // Evita o erro de "Invalid URL"

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const discordUrl = new URL("https://discord.com/api/oauth2/authorize");
  discordUrl.searchParams.set("client_id", clientId);
  discordUrl.searchParams.set("redirect_uri", redirectUri);
  discordUrl.searchParams.set("response_type", "code");
  discordUrl.searchParams.set("scope", "identify email");
  discordUrl.searchParams.set("state", state);

  return discordUrl.toString();
};
