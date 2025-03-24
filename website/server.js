require('dotenv').config();
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const commentsRouter = require('./routes/comments');
const fs = require('fs');

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

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - important for proper HTTPS detection behind proxies like Vercel
app.set('trust proxy', 1);

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
const allowedOrigins = [
    'http://localhost:3000',
    'https://enderfall.co.uk',
    'https://www.enderfall.co.uk'
];

// CORS configuration
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('[CORS] Allowing request with no origin');
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('[CORS] Allowing origin:', origin);
            callback(null, true);
        } else {
            console.log('[CORS] Blocked request from origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie']
}));

// Add cookie parser before session middleware
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.json());
app.use(express.static('public'));

// Setup session middleware
const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    proxy: true,
    name: 'enderfall.sid',
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
        httpOnly: true,
        path: '/'
    }
};

// In production, set the domain and other production-specific settings
if (process.env.NODE_ENV === 'production') {
    sessionConfig.cookie.domain = '.enderfall.co.uk';
    sessionConfig.cookie.secure = true;
    console.log('[SESSION] Using production settings:', {
        domain: sessionConfig.cookie.domain,
        secure: sessionConfig.cookie.secure,
        sameSite: sessionConfig.cookie.sameSite,
        maxAge: sessionConfig.cookie.maxAge
    });
}

// Initialize session middleware
app.use(session(sessionConfig));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Add session check middleware
app.use((req, res, next) => {
    // Check if the session exists but user is not set
    if (req.session && !req.session.passport && req.cookies['enderfall.sid']) {
        console.log('[SESSION] Found session cookie but no user:', {
            sessionID: req.sessionID,
            hasCookie: !!req.cookies['enderfall.sid']
        });
    }
    next();
});

// Mount routers
app.use('/api/comments', commentsRouter(supabase));

// Passport configuration
passport.serializeUser((user, done) => {
    console.log('[PASSPORT] Serializing user:', user.username);
    done(null, {
        id: user.id,
        discord_id: user.discord_id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        discriminator: user.discriminator
    });
});

passport.deserializeUser((user, done) => {
    console.log('[PASSPORT] Deserializing user:', user.username);
    done(null, user);
});

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

// Discord callback handler
app.get('/auth/discord/callback', (req, res, next) => {
    console.log('[AUTH] ====== DISCORD CALLBACK RECEIVED ======');
    console.log('[AUTH] Query params:', req.query);
    console.log('[AUTH] Headers:', {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer
    });
    
    // Handle Discord errors
    if (req.query.error) {
        console.error('[AUTH] Discord error:', {
            error: req.query.error,
            description: req.query.error_description
        });
        return res.redirect('/?auth_error=' + encodeURIComponent(req.query.error_description || 'Authentication failed'));
    }
    
    // Authenticate with custom error handling
    passport.authenticate('discord', (err, user, info) => {
        if (err) {
            console.error('[AUTH] Authentication error:', err);
            if (err.code === 'invalid_client') {
                console.error('[AUTH] Invalid client credentials. Please check DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET');
            }
            return res.redirect('/?auth_error=' + encodeURIComponent('Authentication failed: ' + (err.message || 'Unknown error')));
        }
        
        if (!user) {
            console.error('[AUTH] No user returned from Discord');
            return res.redirect('/?auth_error=' + encodeURIComponent('No user data received'));
        }
        
        // Log in the user
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.error('[AUTH] Login error:', loginErr);
                return res.redirect('/?auth_error=' + encodeURIComponent('Login failed'));
            }
            
            // Regenerate session to prevent session fixation
            req.session.regenerate((regenerateErr) => {
                if (regenerateErr) {
                    console.error('[AUTH] Session regeneration error:', regenerateErr);
                    return res.redirect('/?auth_error=' + encodeURIComponent('Session error'));
                }
                
                // Set user data in new session
                req.session.user = user;
                req.session.isAuthenticated = true;
                
                // Save session explicitly
                req.session.save((saveErr) => {
                    if (saveErr) {
                        console.error('[AUTH] Session save error:', saveErr);
                        return res.redirect('/?auth_error=' + encodeURIComponent('Session save failed'));
                    }
                    
                    console.log('[AUTH] Authentication successful for user:', user.username);
                    console.log('[AUTH] Session ID:', req.sessionID);
                    console.log('[AUTH] Cookie settings:', {
                        domain: req.session.cookie.domain,
                        path: req.session.cookie.path,
                        secure: req.session.cookie.secure,
                        httpOnly: req.session.cookie.httpOnly,
                        sameSite: req.session.cookie.sameSite
                    });
                    
                    // Get return URL from session
                    const returnTo = req.session.returnTo || '/';
                    delete req.session.returnTo;
                    
                    // Redirect to the return URL
                    console.log('[AUTH] Redirecting to:', returnTo);
                    res.redirect(returnTo);
                });
            });
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
        console.error('Error linking Minecraft account:', error);
        res.status(500).json({ error: 'Failed to link Minecraft account' });
    }
});

app.delete('/api/user/minecraft', isAuthenticated, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({ minecraft_username: null })
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error unlinking Minecraft account:', error);
        res.status(500).json({ error: 'Failed to unlink Minecraft account' });
    }
});

app.patch('/api/user/preferences', isAuthenticated, async (req, res) => {
    try {
        const { email_notifications, discord_notifications } = req.body;
        
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

        // Prepare updates
        const updates = {
            updated_at: new Date()
        };
        
        if (typeof email_notifications === 'boolean') {
            updates.email_notifications = email_notifications;
        }
        if (typeof discord_notifications === 'boolean') {
            updates.discord_notifications = discord_notifications;
        }

        // Update the user's preferences
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('discord_id', req.user.discord_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating preferences:', error);
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
        console.error('Error updating preferences:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

app.post('/api/purchase', isAuthenticated, async (req, res) => {
    const { rankName, price } = req.body;
    const userId = req.user.id;

    try {
        // Create purchase record in Supabase
        const { data, error } = await supabase
            .from('purchases')
            .insert([{
                user_id: userId,
                rank_name: rankName,
                price: price,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;

        // Here you would typically:
        // 1. Process payment
        // 2. Update Discord roles
        // 3. Update Minecraft permissions

        res.json(data);
    } catch (error) {
        console.error('Purchase error:', error);
        res.status(500).json({ error: 'Failed to process purchase' });
    }
});

// Purchase routes
app.post('/api/purchase/rank', isAuthenticated, async (req, res) => {
    try {
        const { rankId, price } = req.body;

        // Validate rank exists
        const rankConfig = getRankConfig(rankId);
        if (!rankConfig) {
            return res.status(400).json({ error: 'Invalid rank selection' });
        }

        // Validate price matches
        if (rankConfig.price !== price) {
            return res.status(400).json({ error: 'Invalid price' });
        }

        // Create purchase record
        const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .insert({
                user_id: req.user.id,
                rank_name: rankConfig.name,
                price: price,
                status: 'pending'
            })
            .select()
            .single();

        if (purchaseError) throw purchaseError;

        // In a real implementation, we would:
        // 1. Create a payment session with Stripe/PayPal
        // 2. Return the session URL for client-side redirect
        // 3. Handle webhook for payment confirmation
        // 4. Update purchase status and apply rank

        // For now, simulate successful purchase
        const { error: rankError } = await supabase
            .from('user_ranks')
            .insert({
                user_id: req.user.id,
                name: rankConfig.name,
                description: rankConfig.description,
                features: rankConfig.features,
                expires_at: null
            });

        if (rankError) throw rankError;

        const { error: updateError } = await supabase
            .from('purchases')
            .update({ status: 'completed' })
            .eq('id', purchase.id);

        if (updateError) throw updateError;

        res.json({ success: true });
    } catch (error) {
        console.error('Error processing purchase:', error);
        res.status(500).json({ error: 'Failed to process purchase' });
    }
});

app.post('/api/purchase/upgrade', isAuthenticated, async (req, res) => {
    try {
        const { upgradeId, price } = req.body;

        // Validate upgrade exists and user has required rank
        const upgradeConfig = getUpgradeConfig(upgradeId);
        if (!upgradeConfig) {
            return res.status(400).json({ error: 'Invalid upgrade selection' });
        }

        // Check if user has the required rank
        const { data: currentRank, error: rankError } = await supabase
            .from('user_ranks')
            .select('name')
            .eq('user_id', req.user.id)
            .eq('name', upgradeConfig.from)
            .single();

        if (rankError || !currentRank) {
            return res.status(400).json({ error: 'You do not have the required rank for this upgrade' });
        }

        // Validate price matches
        if (upgradeConfig.price !== price) {
            return res.status(400).json({ error: 'Invalid price' });
        }

        // Create purchase record
        const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .insert({
                user_id: req.user.id,
                rank_name: upgradeConfig.to,
                price: price,
                status: 'pending'
            })
            .select()
            .single();

        if (purchaseError) throw purchaseError;

        // For now, simulate successful purchase
        const { error: deleteError } = await supabase
            .from('user_ranks')
            .delete()
            .eq('user_id', req.user.id)
            .eq('name', upgradeConfig.from);

        if (deleteError) throw deleteError;

        const { error: rankError2 } = await supabase
            .from('user_ranks')
            .insert({
                user_id: req.user.id,
                name: upgradeConfig.to,
                description: upgradeConfig.description,
                features: upgradeConfig.features,
                expires_at: null
            });

        if (rankError2) throw rankError2;

        const { error: updateError } = await supabase
            .from('purchases')
            .update({ status: 'completed' })
            .eq('id', purchase.id);

        if (updateError) throw updateError;

        res.json({ success: true });
    } catch (error) {
        console.error('Error processing upgrade:', error);
        res.status(500).json({ error: 'Failed to process upgrade' });
    }
});

// Rank configuration helpers
function getRankConfig(rankId) {
    const ranks = {
        // Serverwide Ranks
        'shadow-enchanter': {
            name: 'Shadow Enchanter',
            price: 9.99,
            description: 'A mystical rank with basic flying abilities',
            features: ['/fly', '3 /sethome', 'colored chat', 'special prefix']
        },
        'void-walker': {
            name: 'Void Walker',
            price: 19.99,
            description: 'Master of the void with enhanced storage',
            features: ['/enderchest', '5 /sethome', 'custom join messages']
        },
        'ethereal-warden': {
            name: 'Ethereal Warden',
            price: 29.99,
            description: 'Guardian of the realm with healing powers',
            features: ['/heal', '/feed', '7 /sethome', 'particle effects']
        },
        'astral-guardian': {
            name: 'Astral Guardian',
            price: 39.99,
            description: 'Supreme cosmic being with ultimate abilities',
            features: ['/nick', '10 /sethome', 'custom particle trails']
        },
        // Towny Ranks
        'citizen': {
            name: 'Citizen',
            price: 4.99,
            description: 'Basic towny privileges',
            features: ['Create town', '5 plots', '1 spawn']
        },
        'merchant': {
            name: 'Merchant',
            price: 9.99,
            description: 'Enhanced trading capabilities',
            features: ['2 shops', '10 plots']
        },
        'councilor': {
            name: 'Councilor',
            price: 14.99,
            description: 'Town management abilities',
            features: ['5 shops', 'town chat colors']
        },
        'mayor': {
            name: 'Mayor',
            price: 19.99,
            description: 'Full town control',
            features: ['multiple spawns', 'welcome message']
        },
        'governor': {
            name: 'Governor',
            price: 24.99,
            description: 'Nation creation privileges',
            features: ['create nation', 'nation chat prefix']
        },
        'noble': {
            name: 'Noble',
            price: 29.99,
            description: 'Advanced nation features',
            features: ['nation particles', 'custom spawn']
        },
        'duke': {
            name: 'Duke',
            price: 34.99,
            description: 'Nation-wide abilities',
            features: ['nation-wide effects', 'custom banner']
        },
        'king': {
            name: 'King',
            price: 39.99,
            description: 'Supreme nation control',
            features: ['nation commands', 'custom laws']
        },
        'divine-ruler': {
            name: 'Divine Ruler',
            price: 44.99,
            description: 'Ultimate towny authority',
            features: ['divine powers', 'custom events']
        }
    };

    return ranks[rankId];
}

function getUpgradeConfig(upgradeId) {
    const upgrades = {
        // Serverwide Upgrades
        'shadow-to-void': {
            from: 'Shadow Enchanter',
            to: 'Void Walker',
            price: 4.99,
            description: 'Upgrade to Void Walker rank',
            features: ['/enderchest', '5 /sethome', 'custom join messages']
        },
        'void-to-ethereal': {
            from: 'Void Walker',
            to: 'Ethereal Warden',
            price: 4.99,
            description: 'Upgrade to Ethereal Warden rank',
            features: ['/heal', '/feed', '7 /sethome', 'particle effects']
        },
        'ethereal-to-astral': {
            from: 'Ethereal Warden',
            to: 'Astral Guardian',
            price: 4.99,
            description: 'Upgrade to Astral Guardian rank',
            features: ['/nick', '10 /sethome', 'custom particle trails']
        },
        // Towny Upgrades
        'citizen-to-merchant': {
            from: 'Citizen',
            to: 'Merchant',
            price: 4.99,
            description: 'Upgrade to Merchant rank',
            features: ['2 shops', '10 plots']
        },
        'merchant-to-councilor': {
            from: 'Merchant',
            to: 'Councilor',
            price: 4.99,
            description: 'Upgrade to Councilor rank',
            features: ['5 shops', 'town chat colors']
        },
        'councilor-to-mayor': {
            from: 'Councilor',
            to: 'Mayor',
            price: 4.99,
            description: 'Upgrade to Mayor rank',
            features: ['multiple spawns', 'welcome message']
        },
        'mayor-to-governor': {
            from: 'Mayor',
            to: 'Governor',
            price: 4.99,
            description: 'Upgrade to Governor rank',
            features: ['create nation', 'nation chat prefix']
        },
        'governor-to-noble': {
            from: 'Governor',
            to: 'Noble',
            price: 4.99,
            description: 'Upgrade to Noble rank',
            features: ['nation particles', 'custom spawn']
        },
        'noble-to-duke': {
            from: 'Noble',
            to: 'Duke',
            price: 4.99,
            description: 'Upgrade to Duke rank',
            features: ['nation-wide effects', 'custom banner']
        },
        'duke-to-king': {
            from: 'Duke',
            to: 'King',
            price: 4.99,
            description: 'Upgrade to King rank',
            features: ['nation commands', 'custom laws']
        },
        'king-to-divine': {
            from: 'King',
            to: 'Divine Ruler',
            price: 4.99,
            description: 'Upgrade to Divine Ruler rank',
            features: ['divine powers', 'custom events']
        }
    };

    return upgrades[upgradeId];
}

// Get forum user by username
app.get('/api/forum-user', async (req, res) => {
    try {
        const { username } = req.query;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        
        console.log('Looking up forum user ID for username:', username);
        
        // Get forum user ID
        const { data, error } = await supabase
            .from('forum_users')
            .select('id')
            .eq('username', username)
            .single();
        
        if (error) {
            console.error('Error fetching forum user:', error);
            return res.status(404).json({ error: 'Forum user not found' });
        }
        
        console.log('Found forum user ID:', data.id);
        res.json({ id: String(data.id) });
    } catch (error) {
        console.error('Error processing forum user request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Status/health check endpoint
app.get('/api/status', (req, res) => {
    const baseUrl = getBaseUrl(req);
    res.json({
        status: 'online',
        environment: process.env.NODE_ENV,
        baseUrl: baseUrl,
        callbackUrl: `${baseUrl}/auth/discord/callback`,
        host: req.headers.host,
        vercelUrl: process.env.VERCEL_URL || 'not set',
        request: {
            protocol: req.protocol,
            originalUrl: req.originalUrl,
            hostname: req.hostname,
            path: req.path,
            referer: req.headers.referer || 'none'
        }
    });
});

// Debug route for Discord configuration
app.get('/debug-auth', (req, res) => {
    const baseUrl = getBaseUrl(req);
    const productionUrl = 'https://enderfall.co.uk';
    const wwwProductionUrl = 'https://www.enderfall.co.uk';
    const localUrl = 'http://localhost:3000';
    
    res.json({
        discordClientId: process.env.DISCORD_CLIENT_ID,
        configuredRedirectUri: process.env.DISCORD_REDIRECT_URI,
        dynamicRedirectUri: `${baseUrl}/auth/discord/callback`,
        allRequiredRedirectUris: [
            `${localUrl}/auth/discord/callback`,
            `${productionUrl}/auth/discord/callback`,
            `${wwwProductionUrl}/auth/discord/callback`
        ],
        currentEnvironment: {
            host: req.headers.host,
            environment: process.env.NODE_ENV,
            baseUrl: baseUrl
        },
        auth: {
            isAuthenticated: req.isAuthenticated(),
            sessionExists: !!req.session,
            sessionId: req.sessionID
        }
    });
});

// Add this endpoint after your existing debug endpoint
app.get('/debug-redirect', (req, res) => {
    // Get the exact callback URL that would be used for Discord
    const baseUrl = getBaseUrl(req);
    const callbackUrl = `${baseUrl}/auth/discord/callback`;
    
    // List all required redirect URIs
    const requiredRedirects = [
        'http://localhost:3000/auth/discord/callback',
        'https://enderfall.co.uk/auth/discord/callback',
        'https://www.enderfall.co.uk/auth/discord/callback'
    ];
    
    // Create a test authorization URL
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}`;
    
    // Return detailed information
    res.send(`
    <html>
        <head>
            <title>OAuth Debug</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; }
                pre { background: #f4f4f4; padding: 10px; overflow: auto; }
                .url { word-break: break-all; }
                .important { color: #d00; font-weight: bold; }
                .code-block { background: #f8f8f8; border-left: 3px solid #2196F3; padding: 15px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <h1>OAuth Redirect Debug</h1>
            <h2>Your Environment:</h2>
            <ul>
                <li><strong>Host:</strong> ${req.headers.host}</li>
                <li><strong>Protocol:</strong> ${req.protocol}</li>
                <li><strong>Base URL:</strong> ${baseUrl}</li>
                <li><strong>NODE_ENV:</strong> ${process.env.NODE_ENV || 'not set'}</li>
            </ul>
            
            <h2>Dynamic Callback URL:</h2>
            <pre class="url">${callbackUrl}</pre>
            
            <div class="code-block">
                <h2 class="important">IMPORTANT: Add ALL these URLs to Discord Developer Portal</h2>
                <p>You must add <strong>all three</strong> of these URLs to your Discord application:</p>
                <ul>
                    ${requiredRedirects.map(url => `<li><pre class="url">${url}</pre></li>`).join('')}
                </ul>
            </div>
            
            <h2>Full Authorization URL (encoded):</h2>
            <pre class="url">${authUrl}</pre>
            
            <h2>What to check:</h2>
            <ol>
                <li>Go to <a href="https://discord.com/developers/applications" target="_blank">Discord Developer Portal</a></li>
                <li>Select your application (ID: ${process.env.DISCORD_CLIENT_ID})</li>
                <li>Go to OAuth2 → Redirects</li>
                <li>Add <strong>ALL THREE</strong> callback URLs shown above</li>
                <li>Save Changes</li>
            </ol>
            
            <h3>Common Issues:</h3>
            <ul>
                <li>Missing the "Save Changes" button at the bottom of the page</li>
                <li>Not adding all three required URLs</li>
                <li>Extra or missing slashes</li>
                <li>Incorrect protocol (http vs https)</li>
                <li>Spaces or special characters</li>
            </ul>
            
            <h2>Test Your Configuration:</h2>
            <p><a href="/auth/discord">Try authenticating now</a></p>
        </body>
    </html>
    `);
});

// Debug session/auth status endpoint
app.get('/debug-session', (req, res) => {
    res.json({
        isAuthenticated: req.isAuthenticated(),
        sessionExists: !!req.session,
        sessionID: req.sessionID,
        sessionCookie: req.headers.cookie ? true : false,
        user: req.user ? {
            id: req.user.id,
            username: req.user.username,
            discord_id: req.user.discord_id
        } : null,
        cookies: req.headers.cookie,
        headers: {
            host: req.headers.host,
            referer: req.headers.referer,
            'user-agent': req.headers['user-agent']
        }
    });
});

// Error logging endpoint
app.post('/api/log-error', (req, res) => {
    console.error('[ERROR] Client-side error:', JSON.stringify(req.body, null, 2));
    res.json({ success: true });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route for all other requests to serve index.html
app.get('*', (req, res) => {
    // API routes should 404 if they haven't been matched by now
    if (req.path.startsWith('/api/')) {
        console.error(`[404] API route not found: ${req.path}`);
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // For all other routes, send the index.html file
    console.log(`[ROUTE] Serving index.html for path: ${req.path}`);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Test cookie storage route
app.get('/test-cookie', (req, res) => {
    // Set a test cookie
    res.cookie('test_cookie', 'cookie_value', {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: false, // Make it readable by client-side JS
        secure: process.env.NODE_ENV === 'production' ? 'auto' : false,
        domain: process.env.NODE_ENV === 'production' ? '.enderfall.co.uk' : undefined,
        path: '/',
        sameSite: 'lax'
    });
    
    // Count session views
    req.session.views = (req.session.views || 0) + 1;
    
    res.send(`
    <html>
        <head>
            <title>Cookie Test</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                pre { background: #f4f4f4; padding: 10px; }
                .success { color: green; }
                .error { color: red; }
            </style>
        </head>
        <body>
            <h1>Cookie Test Page</h1>
            <p>This page tests whether cookies are being properly set and stored.</p>
            
            <h2>Session Status:</h2>
            <pre>Session ID: ${req.sessionID}
Views: ${req.session.views}
Authenticated: ${req.isAuthenticated()}</pre>
            
            <h2>Cookie Test:</h2>
            <p>A test cookie named 'test_cookie' has been set. You should see it in your browser's developer tools.</p>
            
            <h2>All Cookies:</h2>
            <pre>${req.headers.cookie || 'No cookies found'}</pre>
            
            <h2>Environment:</h2>
            <pre>NODE_ENV: ${process.env.NODE_ENV || 'not set'}
Protocol: ${req.protocol}
Secure: ${req.secure ? 'Yes' : 'No'}
Headers:
  x-forwarded-proto: ${req.headers['x-forwarded-proto'] || 'not set'}
  host: ${req.headers.host || 'not set'}</pre>
            
            <script>
                // Check for client-side readable cookies
                function checkCookies() {
                    const testCookie = document.cookie.includes('test_cookie');
                    const result = document.getElementById('cookie-result');
                    
                    if (testCookie) {
                        result.textContent = 'Test cookie found! Cookie storage is working correctly.';
                        result.className = 'success';
                    } else {
                        result.textContent = 'Test cookie NOT found. There may be an issue with cookie storage.';
                        result.className = 'error';
                    }
                    
                    document.getElementById('all-cookies').textContent = document.cookie;
                }
                
                // Run after a short delay to ensure cookie is set
                setTimeout(checkCookies, 500);
            </script>
            
            <h2>Client-Side Cookie Check:</h2>
            <p id="cookie-result">Checking...</p>
            
            <h3>All Client-Side Readable Cookies:</h3>
            <pre id="all-cookies">Loading...</pre>
            
            <h2>Next Steps:</h2>
            <ul>
                <li><a href="/auth/discord">Try logging in</a></li>
                <li><a href="/debug-session">View detailed session debug</a></li>
                <li><a href="/">Return to home page</a></li>
            </ul>
        </body>
    </html>
    `);
});

// Add session debugging middleware
app.use((req, res, next) => {
    const requestPath = req.path;
    // Only log auth-related requests
    if (requestPath.includes('/auth/') || requestPath.includes('/api/user')) {
        console.log('[DEBUG] Request:', {
            path: requestPath,
            method: req.method,
            isAuthenticated: req.isAuthenticated(),
            sessionID: req.sessionID,
            hasSession: !!req.session,
            cookies: req.headers.cookie ? 'present' : 'none'
        });
    }
    next();
});

// Session check endpoint
app.get('/api/session-check', (req, res) => {
    const sessionInfo = {
        hasSession: !!req.session,
        sessionID: req.sessionID,
        isAuthenticated: req.isAuthenticated(),
        user: req.user,
        sessionCookie: req.headers.cookie,
        sessionData: req.session,
        headers: {
            host: req.headers.host,
            'x-forwarded-proto': req.headers['x-forwarded-proto'],
            'x-forwarded-for': req.headers['x-forwarded-for']
        }
    };
    
    console.log('[SESSION] Check requested:', {
        hasSession: sessionInfo.hasSession,
        isAuthenticated: sessionInfo.isAuthenticated,
        sessionID: sessionInfo.sessionID,
        hasCookie: !!sessionInfo.sessionCookie
    });
    
    res.json(sessionInfo);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
