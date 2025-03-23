// server.js for Enderfall website
const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Routers
const userRouter = require('./routes/user');
const forumRouter = require('./routes/forums');
const migrationRouter = require('./routes/migrations');
const commentsRouter = require('./routes/comments');
const fs = require('fs');

const app = express();

// Middleware for www to non-www redirect
app.use((req, res, next) => {
  const host = req.hostname;
  // Check if it's the www subdomain
  if (host.startsWith('www.')) {
    const newHost = host.slice(4); // remove 'www.'
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    return res.redirect(301, `${protocol}://${newHost}${req.originalUrl}`);
  }
  next();
});

// Console log the environment for debugging
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

// Set cookie secure flag based on environment
const isProduction = process.env.NODE_ENV === 'production';
const cookieSecure = isProduction;

// Helper function to determine environment
function getBaseUrl(req) {
    // Production environment detection
    if (process.env.NODE_ENV === 'production') {
        // Check if we have a custom host header
        if (req && req.headers && req.headers.host) {
            // Handle both www and non-www versions of the domain
            if (req.headers.host.includes('enderfall.co.uk')) {
                if (req.headers.host.startsWith('www.')) {
                    return 'https://www.enderfall.co.uk';
                } else {
                    return 'https://enderfall.co.uk';
                }
            }
        }
        
        // Default to non-www in production if we couldn't determine from headers
        console.log('[URL] No matching host header found, defaulting to enderfall.co.uk');
        return 'https://enderfall.co.uk';
    }
    
    // Check if running on Vercel preview deployment
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    
    // In development, use localhost
    return 'http://localhost:3000';
}

const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration. Please check your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Test Supabase connection
(async () => {
    try {
        const { data, error } = await supabase.from('users').select('count').single();
        if (error) throw error;
        console.log('Successfully connected to Supabase');
    } catch (error) {
        console.error('Error connecting to Supabase:', error.message);
        process.exit(1);
    }
})();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'https://enderfall.co.uk', 'https://www.enderfall.co.uk'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Setup session middleware
const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days (increased from 24 hours)
        sameSite: 'lax',
        httpOnly: true,
        path: '/'
    }
};

// In production, set the domain to work with both www and non-www
if (process.env.NODE_ENV === 'production') {
    // Use a dot prefix to make the cookie work for all subdomains
    sessionConfig.cookie.domain = '.enderfall.co.uk';
    console.log('[SESSION] Using production cookie domain:', sessionConfig.cookie.domain);
}

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// Mount routers
app.use('/api/comments', commentsRouter(supabase));

// Passport configuration
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const scopes = ['identify', 'email', 'guilds.join'];

// Get the appropriate callback URL based on environment
let callbackURL = process.env.DISCORD_REDIRECT_URI;
if (process.env.NODE_ENV === 'development') {
    callbackURL = 'http://localhost:3000/auth/discord/callback';
    console.log('[AUTH] Using development callback URL:', callbackURL);
} else if (process.env.NODE_ENV === 'production') {
    callbackURL = 'https://enderfall.co.uk/auth/discord/callback';
    console.log('[AUTH] Using production callback URL:', callbackURL);
}

// Discord strategy configuration
passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: callbackURL,
    scope: scopes,
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists in Supabase
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('discord_id', profile.id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching user:', fetchError);
            return done(fetchError, null);
        }

        let user;
        if (!existingUser) {
            // Create new user in Supabase
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([{
                    discord_id: profile.id,
                    username: profile.username,
                    email: profile.email,
                    avatar: profile.avatar,
                    access_token: accessToken,
                    refresh_token: refreshToken
                }])
                .select()
                .single();

            if (insertError) {
                console.error('Error creating user:', insertError);
                return done(insertError, null);
            }
            user = newUser;
        } else {
            // Update existing user
            const { data: updatedUser, error: updateError } = await supabase
                .from('users')
                .update({
                    username: profile.username,
                    email: profile.email,
                    avatar: profile.avatar,
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    updated_at: new Date()
                })
                .eq('discord_id', profile.id)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating user:', updateError);
                return done(updateError, null);
            }
            user = updatedUser;
        }

        // Add additional profile data
        const userProfile = {
            ...user,
            discriminator: profile.discriminator,
            avatar_url: profile.avatar 
                ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                : null
        };

        return done(null, userProfile);
    } catch (error) {
        console.error('Authentication error:', error);
        return done(error, null);
    }
}));

// Auth routes
app.get('/auth/discord', (req, res, next) => {
    try {
        // Get current domain
        const baseUrl = getBaseUrl(req);
        const currentDomain = new URL(baseUrl).hostname;
        const dynamicCallbackUrl = `${baseUrl}/auth/discord/callback`;
        console.log('[AUTH] Current domain:', currentDomain);
        
        // Store the origin for use in callback, but ensure it's for the current domain
        const referer = req.headers.referer || '/';
        let returnTo = referer;
        
        // Validate returnTo URL to prevent cross-domain redirects
        // If referer contains a different domain than current request, use homepage
        if (referer.includes('localhost') && !currentDomain.includes('localhost')) {
            console.log('[AUTH] Cross-domain redirect detected (localhost → production). Using homepage.');
            returnTo = '/';
        } else if (!referer.includes('localhost') && currentDomain.includes('localhost')) {
            console.log('[AUTH] Cross-domain redirect detected (production → localhost). Using homepage.');
            returnTo = '/';
        } else if (referer.includes('enderfall.co.uk') && !currentDomain.includes('enderfall.co.uk')) {
            console.log('[AUTH] Cross-domain redirect detected (enderfall → other). Using homepage.');
            returnTo = '/';
        }
        
        req.session.returnTo = returnTo;
        
        console.log('[AUTH] ====== DISCORD AUTH ATTEMPT ======');
        console.log('[AUTH] Headers:', JSON.stringify({
            host: req.headers.host,
            referer: req.headers.referer,
            'user-agent': req.headers['user-agent']
        }));
        console.log('[AUTH] Environment:', process.env.NODE_ENV);
        console.log('[AUTH] Base URL detected as:', baseUrl);
        console.log('[AUTH] Using callback URL:', callbackURL);
        console.log('[AUTH] returnTo set to:', req.session.returnTo);
        console.log('[AUTH] =================================');
        
        // Use the strategy as configured without custom options
        passport.authenticate('discord')(req, res, next);
    } catch (error) {
        console.error('[AUTH] Error during Discord authentication:', error);
        res.redirect('/?auth_error=' + encodeURIComponent('Authentication setup failed: ' + error.message));
    }
});

// Raw callback URL handler for testing
app.get('/auth/discord/callback', (req, res, next) => {
    // Log the raw request details to see exactly what Discord is sending
    console.log('[AUTH] ====== DISCORD CALLBACK RECEIVED ======');
    console.log('[AUTH] Query params:', JSON.stringify(req.query));
    console.log('[AUTH] Headers:', JSON.stringify({
        host: req.headers.host,
        referer: req.headers.referer,
        'user-agent': req.headers['user-agent']
    }));
    console.log('[AUTH] ======================================');
    
    // If there's an error in the query parameters, handle it
    if (req.query.error) {
        console.error('[AUTH] Error from Discord callback:', req.query.error);
        console.error('[AUTH] Error description:', req.query.error_description);
        return res.redirect('/?auth_error=' + encodeURIComponent(`Discord error: ${req.query.error} - ${req.query.error_description || ''}`));
    }
    
    // Continue with normal authentication flow
    next();
}, (req, res, next) => {
    passport.authenticate('discord', (err, user, info) => {
        // Rest of your authentication handler code
        if (err) {
            console.error('[AUTH] Error during authentication:', err);
            return res.redirect('/?auth_error=' + encodeURIComponent('Authentication failed'));
        }
        
        if (!user) {
            console.error('[AUTH] Authentication failed, no user returned');
            return res.redirect('/?auth_error=' + encodeURIComponent('Authentication failed'));
        }
        
        req.logIn(user, (err) => {
            if (err) {
                console.error('[AUTH] Login error:', err);
                return res.redirect('/?auth_error=' + encodeURIComponent('Login failed'));
            }
            
            // Log session info for debugging
            console.log('[AUTH] Session after login:', {
                sessionID: req.sessionID,
                cookieConfig: JSON.stringify(sessionConfig.cookie),
                authenticated: req.isAuthenticated(),
                env: process.env.NODE_ENV,
                hostname: req.hostname,
                protocol: req.protocol,
                hasUser: !!req.user
            });
            
            // Redirect to the original site or default to profile
            let returnTo = req.session.returnTo || '/profile.html';
            delete req.session.returnTo;
            
            // Get current domain
            const baseUrl = getBaseUrl(req);
            const currentDomain = new URL(baseUrl).hostname;
            
            // Validate returnTo URL to prevent cross-domain redirects
            if (returnTo.includes('localhost') && !currentDomain.includes('localhost')) {
                console.log('[AUTH] Preventing redirect to localhost from production');
                returnTo = '/profile.html';
            } else if (returnTo.includes('enderfall.co.uk') && !currentDomain.includes('enderfall.co.uk')) {
                console.log('[AUTH] Preventing redirect to enderfall.co.uk from localhost');
                returnTo = '/profile.html';
            }
            
            console.log('[AUTH] Authentication successful, redirecting to:', returnTo);
            return res.redirect(returnTo);
        });
    })(req, res, next);
});

app.get('/auth/logout', (req, res) => {
    console.log('[AUTH] Logout requested');
    
    // If user is authenticated, logout
    if (req.isAuthenticated()) {
        console.log('[AUTH] User was authenticated, destroying session');
        
        // Destroy the session
        req.session.destroy((err) => {
            if (err) {
                console.error('[AUTH] Error destroying session:', err);
            } else {
                console.log('[AUTH] Session successfully destroyed');
            }
            
            // Clear auth cookie explicitly
            res.clearCookie('connect.sid', {
                path: '/',
                domain: process.env.NODE_ENV === 'production' ? '.enderfall.co.uk' : undefined
            });
            
            // Redirect to the referring page or home
            const returnTo = req.headers.referer || '/';
            console.log('[AUTH] Redirecting to:', returnTo);
            res.redirect(returnTo);
        });
    } else {
        console.log('[AUTH] User was not authenticated');
        // Redirect even if not authenticated
        const returnTo = req.headers.referer || '/';
        res.redirect(returnTo);
    }
});

// Auth middleware for protected routes
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
};

// Forum routes
// Get all forums
app.get('/api/forums', async (req, res) => {
    try {
        let query = supabase
            .from('forums')
            .select(`
                id,
                title,
                content,
                summary,
                category,
                views,
                markdown,
                created_at,
                forum_users:user_id (
                    id, 
                    username, 
                    avatar,
                    discord_id
                ),
                comment_count:forum_comments(count)
            `)
            .order('created_at', { ascending: false });

        // Filter by category if provided
        if (req.query.category && req.query.category !== 'all') {
            query = query.eq('category', req.query.category);
        }

        // Search if query provided
        if (req.query.search) {
            query = query.or(`title.ilike.%${req.query.search}%,content.ilike.%${req.query.search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching forums:', error);
            return res.status(500).json({ error: 'Failed to fetch forums' });
        }

        // Format the response
        const forums = data.map(forum => ({
            id: forum.id,
            title: forum.title,
            content: forum.content,
            summary: forum.summary,
            category: forum.category,
            views: forum.views,
            markdown: forum.markdown || false,
            created_at: forum.created_at,
            updated_at: forum.updated_at,
            user_id: forum.forum_users?.id,
            username: forum.forum_users?.username,
            avatar: forum.forum_users?.avatar,
            discord_id: forum.forum_users?.discord_id,
            comment_count: forum.comment_count[0]?.count || 0
        }));

        res.json(forums);
    } catch (error) {
        console.error('Error processing forums request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a specific forum
app.get('/api/forums/:id', async (req, res) => {
    try {
        const forumId = req.params.id;
        
        // First get current views count
        const { data: currentForum, error: getError } = await supabase
            .from('forums')
            .select('views')
            .eq('id', forumId)
            .single();
            
        if (getError) {
            console.error('Error fetching current forum views:', getError);
        } else {
            // Increment view counter with the correct approach
            const currentViews = currentForum.views || 0;
            const { error: updateError } = await supabase
                .from('forums')
                .update({ views: currentViews + 1 })
                .eq('id', forumId);
                
            if (updateError) {
                console.error('Error updating forum views:', updateError);
            }
        }
        
        // Get forum with user info
        const { data, error } = await supabase
            .from('forums')
            .select(`
                id,
                title,
                content,
                summary,
                category,
                views,
                markdown,
                created_at,
                updated_at,
                forum_users:user_id (id, username, avatar)
            `)
            .eq('id', forumId)
            .single();
        
        if (error) {
            console.error('Error fetching forum:', error);
            return res.status(404).json({ error: 'Forum not found' });
        }
        
        // Format the response and convert IDs to strings
        const forum = {
            id: String(data.id),
            title: data.title,
            content: data.content,
            summary: data.summary,
            category: data.category,
            views: data.views,
            markdown: data.markdown || false,
            created_at: data.created_at,
            updated_at: data.updated_at,
            user_id: data.forum_users ? String(data.forum_users.id) : null,
            username: data.forum_users?.username,
            avatar: data.forum_users?.avatar
        };
        
        console.log('Forum data with string IDs:', {
            id: forum.id,
            user_id: forum.user_id,
            idTypes: {
                id: typeof forum.id,
                user_id: typeof forum.user_id
            }
        });
        
        res.json(forum);
    } catch (error) {
        console.error('Error processing forum request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new forum
app.post('/api/forums', isAuthenticated, async (req, res) => {
    try {
        const { title, summary, content, category, markdown } = req.body;
        
        if (!title || !content || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // First, ensure the authenticated user has a forum_users record
        let forumUserId;
        
        // Check if the user already has a forum_users record
        const { data: existingForumUser, error: forumUserError } = await supabase
            .from('forum_users')
            .select('id')
            .eq('username', req.user.username)
            .maybeSingle();
            
        if (forumUserError) {
            console.error('Error checking forum user:', forumUserError);
            return res.status(500).json({ error: 'Failed to verify forum user' });
        }
        
        if (existingForumUser) {
            forumUserId = existingForumUser.id;
            
            // Update the user's avatar and discord_id if they've changed
            await supabase
                .from('forum_users')
                .update({
                    avatar: req.user.avatar,
                    discord_id: req.user.discord_id
                })
                .eq('id', forumUserId);
        } else {
            // Create a new forum_users record
            const { data: newForumUser, error: createForumUserError } = await supabase
                .from('forum_users')
                .insert({
                    username: req.user.username,
                    email: req.user.email,
                    avatar: req.user.avatar,
                    discord_id: req.user.discord_id
                })
                .select('id')
                .single();
                
            if (createForumUserError) {
                console.error('Error creating forum user:', createForumUserError);
                return res.status(500).json({ error: 'Failed to create forum user' });
            }
            
            forumUserId = newForumUser.id;
        }
        
        // Now create the forum with the forum_users id
        const { data, error } = await supabase
            .from('forums')
            .insert([
                {
                    title,
                    summary,
                    content,
                    category,
                    user_id: forumUserId,
                    views: 0,
                    markdown: markdown || false
                }
            ])
            .select()
            .single();
        
        if (error) {
            console.error('Error creating forum:', error);
            return res.status(500).json({ error: 'Failed to create forum' });
        }
        
        res.status(201).json(data);
    } catch (error) {
        console.error('Error processing create forum request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a forum
app.put('/api/forums/:id', isAuthenticated, async (req, res) => {
    try {
        const forumId = req.params.id;
        const { title, summary, content, category, markdown } = req.body;
        
        if (!title || !content || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Get the forum_user_id for the authenticated user
        const { data: forumUser, error: forumUserError } = await supabase
            .from('forum_users')
            .select('id')
            .eq('username', req.user.username)
            .maybeSingle();
            
        if (forumUserError || !forumUser) {
            console.error('Error finding forum user:', forumUserError);
            return res.status(404).json({ error: 'Forum user not found' });
        }
        
        // Check if user is the forum author
        const { data: forum, error: forumError } = await supabase
            .from('forums')
            .select('user_id')
            .eq('id', forumId)
            .single();
        
        if (forumError) {
            console.error('Error fetching forum for update:', forumError);
            return res.status(404).json({ error: 'Forum not found' });
        }
        
        if (forum.user_id !== forumUser.id) {
            return res.status(403).json({ error: 'Not authorized to update this forum' });
        }
        
        // Update the forum
        const { data, error } = await supabase
            .from('forums')
            .update({ title, summary, content, category, markdown })
            .eq('id', forumId)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating forum:', error);
            return res.status(500).json({ error: 'Failed to update forum' });
        }
        
        res.json(data);
    } catch (error) {
        console.error('Error processing update forum request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a forum
app.delete('/api/forums/:id', isAuthenticated, async (req, res) => {
    try {
        const forumId = req.params.id;
        
        // Get the forum_user_id for the authenticated user
        const { data: forumUser, error: forumUserError } = await supabase
            .from('forum_users')
            .select('id')
            .eq('username', req.user.username)
            .maybeSingle();
            
        if (forumUserError || !forumUser) {
            console.error('Error finding forum user:', forumUserError);
            return res.status(404).json({ error: 'Forum user not found' });
        }
        
        // Check if user is the forum author
        const { data: forum, error: forumError } = await supabase
            .from('forums')
            .select('user_id')
            .eq('id', forumId)
            .single();
        
        if (forumError) {
            console.error('Error fetching forum for deletion:', forumError);
            return res.status(404).json({ error: 'Forum not found' });
        }
        
        if (forum.user_id !== forumUser.id) {
            return res.status(403).json({ error: 'Not authorized to delete this forum' });
        }
        
        // Delete all comments first
        const { error: commentsError } = await supabase
            .from('forum_comments')
            .delete()
            .eq('forum_id', forumId);
        
        if (commentsError) {
            console.error('Error deleting forum comments:', commentsError);
            return res.status(500).json({ error: 'Failed to delete forum comments' });
        }
        
        // Then delete the forum
        const { error } = await supabase
            .from('forums')
            .delete()
            .eq('id', forumId);
        
        if (error) {
            console.error('Error deleting forum:', error);
            return res.status(500).json({ error: 'Failed to delete forum' });
        }
        
        res.json({ message: 'Forum deleted successfully' });
    } catch (error) {
        console.error('Error processing delete forum request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get comments for a forum
app.get('/api/forums/:id/comments', async (req, res) => {
    try {
        const forumId = req.params.id;

        console.log('Fetching comments for forum:', forumId);
         
        // Include discord_id and avatar in the forum_users selection
        const { data, error } = await supabase
            .from('forum_comments')
            .select(`
                id,
                content,
                created_at,
                updated_at,
                parent_id,
                forum_users:user_id (
                    id, 
                    username, 
                    avatar,
                    discord_id
                )
            `)
            .eq('forum_id', forumId)
            .order('created_at', { ascending: true });
         
        if (error) {
            console.error('Error fetching comments:', error);
            return res.status(500).json({ error: 'Failed to fetch comments' });
        }
         
        // Format the response and convert all IDs to strings for consistent comparison
        const comments = data.map(comment => {
            console.log('Raw comment data from DB:', {
                id: comment.id,
                forum_users: comment.forum_users,
                parent_id: comment.parent_id || null
            });
             
            return {
                id: String(comment.id),
                content: comment.content,
                created_at: comment.created_at,
                updated_at: comment.updated_at,
                parent_id: comment.parent_id ? String(comment.parent_id) : null,
                user_id: comment.forum_users ? String(comment.forum_users.id) : null,
                username: comment.forum_users?.username,
                avatar: comment.forum_users?.avatar,
                discord_id: comment.forum_users?.discord_id
            };
        });
         
        console.log(`Returning ${comments.length} comments with avatar data`);
        res.json(comments);
    } catch (error) {
        console.error('Error processing comments request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a comment
app.post('/api/forums/:id/comments', isAuthenticated, async (req, res) => {
    try {
        const forumId = req.params.id;
        const { content, parent_id } = req.body;
        
        console.log('Creating comment with parent_id:', parent_id);
        
        if (!content) {
            return res.status(400).json({ error: 'Comment content is required' });
        }
        
        // Check if forum exists
        const { data: forum, error: forumError } = await supabase
            .from('forums')
            .select('id')
            .eq('id', forumId)
            .single();
        
        if (forumError || !forum) {
            return res.status(404).json({ error: 'Forum not found' });
        }
        
        // Get or create forum user
        let forumUserId;
        
        const { data: existingForumUser, error: existingUserError } = await supabase
            .from('forum_users')
            .select('id')
            .eq('username', req.user.username)
            .single();
            
        if (existingUserError) {
            console.error('Error checking forum user:', existingUserError);
            return res.status(500).json({ error: 'Failed to verify forum user' });
        }
        
        if (existingForumUser) {
            forumUserId = existingForumUser.id;
        } else {
            // Create a new forum_users record
            const { data: newForumUser, error: createForumUserError } = await supabase
                .from('forum_users')
                .insert({
                    username: req.user.username,
                    email: req.user.email,
                    avatar: req.user.avatar,
                    discord_id: req.user.discord_id
                })
                .select('id')
                .single();
                
            if (createForumUserError) {
                console.error('Error creating forum user:', createForumUserError);
                return res.status(500).json({ error: 'Failed to create forum user' });
            }
            
            forumUserId = newForumUser.id;
        }
        
        // Prepare comment data
        const commentData = {
            forum_id: forumId,
            user_id: forumUserId,
            content
        };
        
        // Only add parent_id if it exists and is not null/undefined
        if (parent_id) {
            commentData.parent_id = parent_id;
            console.log('Setting parent_id in comment:', parent_id);
        }
        
        // Create the comment
        const { data, error } = await supabase
            .from('forum_comments')
            .insert([commentData])
            .select()
            .single();
        
        if (error) {
            console.error('Error creating comment:', error);
            return res.status(500).json({ error: 'Failed to create comment' });
        }
        
        console.log('Comment created successfully:', data);
        
        res.status(201).json(data);
    } catch (error) {
        console.error('Error processing create comment request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create increment function in database
app.post('/api/setup-forum-functions', async (req, res) => {
    try {
        // Create increment function if it doesn't exist
        const { error } = await supabase.rpc('create_increment_function');
        
        if (error && !error.message.includes('already exists')) {
            console.error('Error creating increment function:', error);
            return res.status(500).json({ error: 'Failed to create increment function' });
        }
        
        res.json({ message: 'Increment function created successfully' });
    } catch (error) {
        console.error('Error setting up forum functions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Setup database functions
app.post('/api/setup-database', async (req, res) => {
    try {
        // Initialize UUID extension
        const { error: extError } = await supabase.rpc('execute_sql', {
            sql_query: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
        });
        
        if (extError) {
            console.error('Error initializing UUID extension:', extError);
            return res.status(500).json({ error: 'Failed to initialize UUID extension' });
        }
        
        // Load the SQL schema
        const schemaPath = path.join(__dirname, 'database', 'init.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute the schema
        const { error: schemaError } = await supabase.rpc('execute_sql', {
            sql_query: schema
        });
        
        if (schemaError) {
            console.error('Error applying schema:', schemaError);
            return res.status(500).json({ error: 'Failed to apply schema' });
        }
        
        // Run the migration to add the markdown column
        const migrationPath = path.join(__dirname, 'database', 'migrations', 'add_markdown_column.sql');
        const migration = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute the migration
        const { error: migrationError } = await supabase.rpc('execute_sql', {
            sql_query: migration
        });
        
        if (migrationError) {
            console.error('Error running migration:', migrationError);
            return res.status(500).json({ error: 'Failed to run migration' });
        }
        
        res.json({ success: true, message: 'Database setup complete' });
    } catch (error) {
        console.error('Error setting up database:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add markdown column to forums table
app.post('/api/migrations/add-markdown-column', async (req, res) => {
    try {
        // Run the migration to add the markdown column
        const migrationPath = path.join(__dirname, 'database', 'migrations', 'add_markdown_column.sql');
        const migration = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute the migration
        const { error: migrationError } = await supabase.rpc('execute_sql', {
            sql_query: migration
        });
        
        if (migrationError) {
            console.error('Error running migration:', migrationError);
            return res.status(500).json({ error: 'Failed to run migration' });
        }
        
        res.json({ success: true, message: 'Markdown column added successfully' });
    } catch (error) {
        console.error('Error adding markdown column:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add summary column migration
app.post('/api/migrations/add-summary-column', async (req, res) => {
    try {
        console.log('Running summary column migration...');
        
        // Check if the column already exists
        const { data: checkResult, error: checkError } = await supabase
            .from('forums')
            .select('summary')
            .limit(1);
            
        // If we can successfully query the column, it exists
        if (!checkError) {
            console.log('Summary column already exists');
            return res.json({ success: true, status: 'Column already exists' });
        }
        
        // Column doesn't exist, add it
        const { error } = await supabase.rpc('execute_sql', { 
            sql_query: 'ALTER TABLE forums ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT NULL' 
        });
        
        if (error) {
            console.error('Error adding summary column:', error);
            return res.status(500).json({ success: false, error: 'Failed to add summary column' });
        }
        
        console.log('Successfully added summary column to forums table');
        return res.json({ success: true, status: 'Column added' });
    } catch (error) {
        console.error('Error in summary column migration:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// API Routes
app.get('/api/user', isAuthenticated, async (req, res) => {
    try {
        // Get complete user data from Supabase
        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('discord_id', req.user.discord_id)
            .single();

        if (error) {
            console.error('Error fetching user data:', error);
            throw error;
        }

        // Combine with Discord data
        const user = {
            ...userData,
            discriminator: req.user.discriminator,
            avatar_url: req.user.avatar 
                ? `https://cdn.discordapp.com/avatars/${req.user.discord_id}/${req.user.avatar}.png`
                : null
        };

        res.json(user);
    } catch (error) {
        console.error('Error getting user data:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});

app.get('/api/user/ranks', isAuthenticated, async (req, res) => {
    try {
        const { data: ranks, error } = await supabase
            .from('user_ranks')
            .select(`
                id,
                name,
                description,
                features,
                expires_at
            `)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json(ranks);
    } catch (error) {
        console.error('Error fetching user ranks:', error);
        res.status(500).json({ error: 'Failed to fetch user ranks' });
    }
});

app.post('/api/user/settings', isAuthenticated, async (req, res) => {
    try {
        const { minecraft_username, email_notifications, discord_notifications } = req.body;
        
        const { data, error } = await supabase
            .from('users')
            .update({
                minecraft_username,
                email_notifications,
                discord_notifications,
                updated_at: new Date()
            })
            .eq('discord_id', req.user.discord_id)
            .select()
            .single();

        if (error) throw error;
        
        // Add additional user data
        const userData = {
            ...data,
            discriminator: req.user.discriminator,
            avatar_url: req.user.avatar 
                ? `https://cdn.discordapp.com/avatars/${req.user.discord_id}/${req.user.avatar}.png`
                : null
        };
        
        res.json(userData);
    } catch (error) {
        console.error('Error updating user settings:', error);
        res.status(500).json({ error: 'Failed to update user settings' });
    }
});

app.get('/api/purchases', isAuthenticated, async (req, res) => {
    try {
        const { data: purchases, error } = await supabase
            .from('purchases')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(purchases || []);
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ error: 'Failed to fetch purchases' });
    }
});

app.post('/api/user/minecraft', isAuthenticated, async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        // First verify the user exists
        const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('discord_id', req.user.discord_id)
            .single();

        if (userError) {
            console.error('Error finding user:', userError);
            return res.status(500).json({ error: 'Failed to verify user' });
        }

        // Update the user's Minecraft username
        const { data, error } = await supabase
            .from('users')
            .update({ 
                minecraft_username: username,
                updated_at: new Date()
            })
            .eq('discord_id', req.user.discord_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating Minecraft username:', error);
            throw error;
        }

        // Add additional user data
        const userData = {
            ...data,
            discriminator: req.user.discriminator,
            avatar_url: req.user.avatar 
                ? `https://cdn.discordapp.com/avatars/${req.user.discord_id}/${req.user.avatar}.png`
                : null
        };
        
        res.json(userData);
    } catch (error) {
        console.error('Error updating Minecraft username:', error);
        res.status(500).json({ error: 'Failed to update Minecraft username' });
    }
});

// Auth status debug page
app.get('/debug-auth-status', (req, res) => {
    // Get the cookie settings
    const cookieSettings = {
        ...sessionConfig.cookie,
        inProduction: process.env.NODE_ENV === 'production',
        domainWithDot: '.enderfall.co.uk',
        domainWithoutDot: 'enderfall.co.uk'
    };

    // Return a nicely formatted HTML page with auth status
    res.send(`
    <html>
        <head>
            <title>Authentication Status</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; }
                pre { background: #f4f4f4; padding: 10px; overflow: auto; }
                .status { font-size: 24px; margin: 20px 0; }
                .authenticated { color: green; }
                .not-authenticated { color: red; }
                .data-section { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 15px 0; }
                .data-section h2 { margin-top: 0; }
                table { width: 100%; border-collapse: collapse; }
                table td, table th { border: 1px solid #ddd; padding: 8px; }
                table tr:nth-child(even) { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>Authentication Status Debug</h1>
            
            <div class="status ${req.isAuthenticated() ? 'authenticated' : 'not-authenticated'}">
                Status: ${req.isAuthenticated() ? 'AUTHENTICATED ✓' : 'NOT AUTHENTICATED ✗'}
            </div>
            
            <div class="data-section">
                <h2>Session Information</h2>
                <table>
                    <tr>
                        <td>Session Exists</td>
                        <td>${!!req.session}</td>
                    </tr>
                    <tr>
                        <td>Session ID</td>
                        <td>${req.sessionID || 'None'}</td>
                    </tr>
                    <tr>
                        <td>Has User Object</td>
                        <td>${!!req.user}</td>
                    </tr>
                    <tr>
                        <td>User ID</td>
                        <td>${req.user ? req.user.id : 'None'}</td>
                    </tr>
                    <tr>
                        <td>Username</td>
                        <td>${req.user ? req.user.username : 'None'}</td>
                    </tr>
                </table>
            </div>
            
            <div class="data-section">
                <h2>Cookie Configuration</h2>
                <table>
                    <tr>
                        <td>Domain</td>
                        <td>${cookieSettings.domain || '(not set - browser default)'}</td>
                    </tr>
                    <tr>
                        <td>Environment</td>
                        <td>${process.env.NODE_ENV || 'development'}</td>
                    </tr>
                    <tr>
                        <td>Secure</td>
                        <td>${cookieSettings.secure}</td>
                    </tr>
                    <tr>
                        <td>HttpOnly</td>
                        <td>${cookieSettings.httpOnly}</td>
                    </tr>
                    <tr>
                        <td>SameSite</td>
                        <td>${cookieSettings.sameSite}</td>
                    </tr>
                    <tr>
                        <td>Max Age</td>
                        <td>${cookieSettings.maxAge / (1000 * 60 * 60 * 24)} days</td>
                    </tr>
                </table>
            </div>
            
            <div class="data-section">
                <h2>Environment Information</h2>
                <table>
                    <tr>
                        <td>Host</td>
                        <td>${req.headers.host}</td>
                    </tr>
                    <tr>
                        <td>Protocol</td>
                        <td>${req.protocol}</td>
                    </tr>
                    <tr>
                        <td>Original URL</td>
                        <td>${req.originalUrl}</td>
                    </tr>
                    <tr>
                        <td>Referer</td>
                        <td>${req.headers.referer || '(none)'}</td>
                    </tr>
                    <tr>
                        <td>User Agent</td>
                        <td>${req.headers['user-agent']}</td>
                    </tr>
                </table>
            </div>
            
            <h2>Request Cookies</h2>
            <pre>${req.headers.cookie || '(no cookies)'}</pre>
            
            <h2>Actions</h2>
            <p><a href="/auth/discord">Login with Discord</a></p>
            <p><a href="/auth/logout">Logout</a></p>
            <p><a href="/">Go to Home Page</a></p>
        </body>
    </html>
    `);
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export the Express app for Vercel
module.exports = app;