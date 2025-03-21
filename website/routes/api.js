// Debug endpoint to get forum user ID
router.get('/debug/forum-user', checkAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Debug: Getting forum user for Discord ID:', userId);
    
    // Get forum_users record for this user
    const { data, error } = await supabase
      .from('forum_users')
      .select('*')
      .eq('discord_id', userId)
      .limit(1);
    
    if (error) {
      console.error('Debug: Error fetching forum user:', error);
      return res.status(500).json({ error: 'Failed to fetch forum user', details: error.message });
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({ 
        error: 'Forum user not found', 
        discord_id: userId
      });
    }
    
    res.json({
      forum_user: data[0],
      discord_id: userId
    });
  } catch (error) {
    console.error('Debug: Error in forum user endpoint:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Admin route to sync Discord IDs between users and forum_users tables
router.get('/admin/sync-discord-ids', async (req, res) => {
  try {
    console.log('Starting Discord ID synchronization...');
    
    // Get all users with their Discord IDs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, discord_id, username')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    
    console.log(`Found ${users.length} users to process`);
    
    const results = {
      total: users.length,
      updated: 0,
      failed: 0,
      notFound: 0,
      details: []
    };
    
    // For each user, try to find and update the corresponding forum_user
    for (const user of users) {
      try {
        // Skip users without Discord ID
        if (!user.discord_id) {
          results.details.push({
            username: user.username,
            status: 'skipped',
            reason: 'No Discord ID'
          });
          continue;
        }
        
        // Find corresponding forum user
        const { data: forumUsers, error: forumUserError } = await supabase
          .from('forum_users')
          .select('id, username')
          .eq('username', user.username)
          .limit(1);
        
        if (forumUserError) {
          console.error(`Error finding forum user for ${user.username}:`, forumUserError);
          results.failed++;
          results.details.push({
            username: user.username,
            status: 'error',
            reason: forumUserError.message
          });
          continue;
        }
        
        if (!forumUsers || forumUsers.length === 0) {
          console.log(`No forum user found for ${user.username}`);
          results.notFound++;
          results.details.push({
            username: user.username,
            status: 'not_found'
          });
          continue;
        }
        
        // Update the forum user with the Discord ID
        const { error: updateError } = await supabase
          .from('forum_users')
          .update({ discord_id: user.discord_id })
          .eq('id', forumUsers[0].id);
        
        if (updateError) {
          console.error(`Error updating forum user ${user.username}:`, updateError);
          results.failed++;
          results.details.push({
            username: user.username,
            status: 'update_failed',
            reason: updateError.message
          });
          continue;
        }
        
        console.log(`Updated Discord ID for forum user ${user.username}`);
        results.updated++;
        results.details.push({
          username: user.username,
          status: 'updated'
        });
      } catch (error) {
        console.error(`Error processing user ${user.username}:`, error);
        results.failed++;
        results.details.push({
          username: user.username,
          status: 'exception',
          reason: error.message
        });
      }
    }
    
    console.log('Discord ID synchronization completed:', results);
    res.json(results);
  } catch (error) {
    console.error('Error in Discord ID sync:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug endpoint to check user IDs
router.get('/debug/check-ids', checkAuth, async (req, res) => {
  try {
    const discordId = req.user.id;
    const username = req.user.username;
    
    console.log('Debug check IDs for:', { discordId, username });
    
    // Get forum user by Discord ID
    const { data: forumUsersByDiscordId, error: discordIdError } = await supabase
      .from('forum_users')
      .select('*')
      .eq('discord_id', discordId);
    
    // Get forum user by username
    const { data: forumUsersByUsername, error: usernameError } = await supabase
      .from('forum_users')
      .select('*')
      .eq('username', username);
    
    // Get all user's comments
    let comments = [];
    if (forumUsersByDiscordId && forumUsersByDiscordId.length > 0) {
      const forumUserId = forumUsersByDiscordId[0].id;
      const { data: userComments } = await supabase
        .from('forum_comments')
        .select('id, content, created_at, updated_at')
        .eq('user_id', forumUserId)
        .limit(5);
      
      if (userComments) {
        comments = userComments;
      }
    }
    
    res.json({
      auth: {
        discordId,
        username
      },
      forumUsersByDiscordId,
      forumUsersByUsername,
      recentComments: comments,
      tips: [
        "If forumUsersByDiscordId is empty, your Discord ID isn't linked to forum_users",
        "If forumUsersByUsername has multiple entries, this can cause ownership conflicts",
        "Try logging out and back in to refresh the association"
      ]
    });
  } catch (error) {
    console.error('Error in debug IDs endpoint:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}); 