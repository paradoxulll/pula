const SteamAPI = require('steamid');

module.exports = {
  // Steam Web API Key (get from https://steamcommunity.com/dev/apikey)
  apiKey: process.env.STEAM_API_KEY,
  
  // Return URL for Steam authentication
  returnUrl: process.env.STEAM_RETURN_URL,
  
  // Realm (your domain)
  realm: process.env.STEAM_REALM,
  
  // Steam API endpoints
  apiBase: 'https://api.steampowered.com',
  communityBase: 'https://steamcommunity.com',
  
  // Verify SteamID64 format
  isValidSteamID: (steamId) => {
    try {
      const steamID = new SteamAPI(steamId);
      return steamID.isValid();
    } catch (error) {
      return false;
    }
  },
  
  // Get user profile data
  getUserProfile: async (steamId) => {
    if (!process.env.STEAM_API_KEY) {
      throw new Error('Steam API key not configured');
    }
    
    try {
      const response = await fetch(
        `${this.apiBase}/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch Steam user data');
      }
      
      const data = await response.json();
      const player = data.response.players[0];
      
      if (!player) {
        throw new Error('Steam user not found');
      }
      
      return {
        steamId: player.steamid,
        username: player.personaname,
        avatar: player.avatar,
        avatarMedium: player.avatarmedium,
        avatarFull: player.avatarfull,
        profileUrl: player.profileurl,
        country: player.loccountrycode,
        lastLogoff: player.lastlogoff
      };
    } catch (error) {
      console.error('Error fetching Steam profile:', error);
      throw error;
    }
  }
};
