module.exports = {
  // Discord OAuth2 configuration
  clientId: process.env.DISCORD_CLIENT_ID || '1423655964090962084',
  clientSecret: process.env.DISCORD_CLIENT_SECRET || 'sAw2L2Agc9n6b_J0J2Cdlf7hQlCh16cN',
  redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback',
  
  // Discord API endpoints
  authUrl: 'https://discord.com/api/oauth2/authorize',
  tokenUrl: 'https://discord.com/api/oauth2/token',
  userUrl: 'https://discord.com/api/users/@me',
  
  // Scopes for what data we want from Discord
  scopes: ['identify', 'email']
};