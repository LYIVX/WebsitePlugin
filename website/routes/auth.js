const express = require('express');
const router = express.Router();
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Get the appropriate redirect URI based on environment
const getRedirectUri = () => {
    return process.env.NODE_ENV === 'production' 
        ? process.env.DISCORD_REDIRECT_URI_PROD 
        : process.env.DISCORD_REDIRECT_URI;
};

// Configure Discord strategy
passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: getRedirectUri(),
    scope: ['identify', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    // ... existing strategy code ...
}));

// Discord OAuth callback endpoint
router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/login?error=Authentication%20failed'
}), async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      throw new Error('No code provided');
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.DISCORD_REDIRECT_URI,
      scope: 'identify email'
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token } = tokenResponse.data;

    // Get user info from Discord
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const { id: discordId, username, avatar, email } = userResponse.data;

    // Check if user exists
    let { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', discordId)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking for existing user:', userError);
      throw new Error('Database error checking user');
    }

    let userId;

    if (!existingUser) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          discord_id: discordId,
          username,
          email,
          avatar,
          access_token,
          refresh_token
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        throw new Error('Database error creating user');
      }

      userId = newUser.id;
    } else {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          username,
          email,
          avatar,
          access_token,
          refresh_token,
          updated_at: new Date()
        })
        .eq('discord_id', discordId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        throw new Error('Database error updating user');
      }

      userId = existingUser.id;
    }

    // Always sync forums user - create or update
    // First, check if forum user exists
    let { data: existingForumUser, error: forumUserError } = await supabase
      .from('forum_users')
      .select('*')
      .eq('username', username)
      .single();
    
    // If we got an explicit "no rows" error but not other errors, that's fine
    if (forumUserError && forumUserError.code !== 'PGRST116') {
      console.error('Error checking for existing forum user:', forumUserError);
      throw new Error('Database error checking forum user');
    }

    // Sync forum user
    if (!existingForumUser) {
      // Create new forum user
      const { error: createForumError } = await supabase
        .from('forum_users')
        .insert({
          username,
          email,
          avatar,
          discord_id: discordId
        });

      if (createForumError) {
        console.error('Error creating forum user:', createForumError);
        throw new Error('Database error creating forum user');
      }
    } else {
      // Update existing forum user
      const { error: updateForumError } = await supabase
        .from('forum_users')
        .update({
          email,
          avatar,
          discord_id: discordId,
          updated_at: new Date()
        })
        .eq('username', username);

      if (updateForumError) {
        console.error('Error updating forum user:', updateForumError);
        throw new Error('Database error updating forum user');
      }
    }

    // Create session with JWT
    const token = jwt.sign(
      { id: discordId, username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Set session cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Get redirect URL from query params or use default
    const redirectTo = req.query.redirect_uri || '/';
    res.redirect(redirectTo);
  } catch (error) {
    console.error('Auth error:', error);
    res.redirect('/login?error=Authentication%20failed');
  }
}); 