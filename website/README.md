# Minecraft Rank Shop with Discord Authentication

A modern web application for purchasing Minecraft ranks with Discord authentication integration.

## Setup Instructions

1. **Discord Application Setup**
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to the "OAuth2" section
   - Add redirect URLs:
     - Development: `http://localhost:3000/auth/discord/callback`
     - Production: `https://enderfall.co.uk/auth/discord/callback`
   - Copy the Client ID and Client Secret

2. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Fill in the following variables:
     ```
     DISCORD_CLIENT_ID=your_discord_client_id
     DISCORD_CLIENT_SECRET=your_discord_client_secret
     DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
     DISCORD_REDIRECT_URI_PROD=https://enderfall.co.uk/auth/discord/callback
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_anon_key
     SESSION_SECRET=random_string_here
     NODE_ENV=development # Change to 'production' for production
     ```

3. **Install Dependencies**
   ```