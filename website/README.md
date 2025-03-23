# Minecraft Rank Shop with Discord Authentication

A modern web application for purchasing Minecraft ranks with Discord authentication integration.

## Setup Instructions

1. **Discord Application Setup**
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to the "OAuth2" section
   - Add redirect URL: `http://localhost:3000/auth/discord/callback`
   - Copy the Client ID and Client Secret

2. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Fill in the following variables:
     ```
     DISCORD_CLIENT_ID=your_discord_client_id
     DISCORD_CLIENT_SECRET=your_discord_client_secret
     DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_anon_key
     SESSION_SECRET=random_string_here
     ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Database Setup**
   Required Supabase tables:
   ```sql
   -- Users table
   create table users (
     id uuid default uuid_generate_v4() primary key,
     discord_id text unique not null,
     username text not null,
     email text,
     avatar text,
     access_token text,
     refresh_token text,
     created_at timestamp with time zone default timezone('utc'::text, now()),
     updated_at timestamp with time zone default timezone('utc'::text, now())
   );

   -- Purchases table
   create table purchases (
     id uuid default uuid_generate_v4() primary key,
     user_id uuid references users(id),
     rank_name text not null,
     price decimal not null,
     status text not null,
     created_at timestamp with time zone default timezone('utc'::text, now()),
     updated_at timestamp with time zone default timezone('utc'::text, now())
   );
   ```

5. **Start the Server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## Features

- Discord OAuth2 authentication
- Secure session management
- Real-time rank filtering and search
- Multiple payment method support
- Responsive design
- Toast notifications
- Profile management

## Security Notes

- Never commit your `.env` file
- Use secure session secrets in production
- Keep Discord credentials confidential
- Implement rate limiting in production
- Use HTTPS in production

## Development

The project uses:
- Express.js for the backend
- Passport.js for authentication
- Supabase for database
- Modern ES6+ JavaScript
- CSS3 with custom properties and animations
