module.exports = {
  // ID-ul și secret-ul aplicației tale Discord
  clientId: process.env.DISCORD_CLIENT_ID || '1423655964090962084',
  clientSecret: process.env.DISCORD_CLIENT_SECRET || 'YuAKaUXeoY1Ybe_SC2NB-3leNCgKaUqI',

  // URL-ul de callback al backend-ului tău unde Discord trimite code-ul
  redirectUri: process.env.DISCORD_REDIRECT_URI || 'https://pula-two.vercel.app/auth/discord/callback',

  // Endpoint-uri Discord
  authUrl: 'https://discord.com/api/oauth2/authorize',
  tokenUrl: 'https://discord.com/api/oauth2/token',
  userUrl: 'https://discord.com/api/users/@me',

  // Scopes (date pe care vrem să le luăm)
  scopes: ['identify', 'email']
};
