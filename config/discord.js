module.exports = {
  clientId: process.env.DISCORD_CLIENT_ID || '1423655964090962084',  // aici clientul tău real
  clientSecret: process.env.DISCORD_CLIENT_SECRET || 'YuAKaUXeoY1Ybe_SC2NB-3leNCgKaUqI',
  redirectUri: process.env.DISCORD_REDIRECT_URI || 'https://pula-two.vercel.app/auth/discord/callback',
  authUrl: 'https://discord.com/api/oauth2/authorize',
  tokenUrl: 'https://discord.com/api/oauth2/token',
  userUrl: 'https://discord.com/api/users/@me',
  scopes: ['identify', 'email']
};

