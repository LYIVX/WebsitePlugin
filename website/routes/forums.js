const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get all forums
router.get('/', async (req, res) => {
  try {
    // Handle search and category filters
    const { category, search } = req.query;
    
    let query = supabase
      .from('forums')
      .select(`
        *,
        forum_users (
          id,
          username,
          avatar,
          discord_id
        ),
        (
          SELECT count(*) 
          FROM comments
          WHERE forums.id = comments.forum_id
        ) as comment_count
      `)
      .order('created_at', { ascending: false });
    
    // Apply category filter if provided
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    // Apply search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Process data for response
    const processedData = data.map(forum => {
      // Format the forum object for the client
      return {
        ...forum,
        username: forum.forum_users?.username || 'Anonymous',
        avatar: forum.forum_users?.avatar || null,
        discord_id: forum.forum_users?.discord_id || null
      };
    });
    
    res.json(processedData);
  } catch (error) {
    console.error('Error fetching forums:', error);
    res.status(500).json({ error: 'Failed to fetch forums' });
  }
});

// Create a new forum
router.post('/', async (req, res) => {
  try {
    // Check authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { title, content, category, summary, markdown } = req.body;
    
    // Validation
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get or create forum_user record
    const username = req.user.username;
    const discord_id = req.user.discord_id;
    const avatar = req.user.avatar;
    
    // Check if user exists
    let { data: userData, error: userError } = await supabase
      .from('forum_users')
      .select('*')
      .eq('username', username)
      .eq('discord_id', discord_id)
      .maybeSingle();
    
    if (userError) {
      throw userError;
    }
    
    let user_id;
    
    if (!userData) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('forum_users')
        .insert({
          username,
          discord_id,
          avatar
        })
        .select()
        .single();
      
      if (createError) {
        throw createError;
      }
      
      user_id = newUser.id;
    } else {
      user_id = userData.id;
    }
    
    // Create new forum post
    const { data, error } = await supabase
      .from('forums')
      .insert({
        title,
        content,
        category,
        user_id,
        summary: summary || null,
        markdown: !!markdown // Ensure boolean
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating forum:', error);
    res.status(500).json({ error: 'Failed to create forum' });
  }
});

// Get single forum by ID with incrementing view counter
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch the forum
    const { data, error } = await supabase
      .from('forums')
      .select(`
        *,
        forum_users (
          id,
          username,
          avatar,
          discord_id
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Forum not found' });
    }
    
    // Increment view counter
    const { error: updateError } = await supabase
      .from('forums')
      .update({ 
        views: (data.views || 0) + 1 
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('Error updating view count:', updateError);
      // Don't fail the request if view count update fails
    }
    
    // Format response data
    const responseData = {
      ...data,
      views: (data.views || 0) + 1, // Include the incremented view count
      author: data.forum_users || null,
      username: data.forum_users?.username || 'Anonymous'
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching forum:', error);
    res.status(500).json({ error: 'Failed to fetch forum' });
  }
});

// Update a forum
router.put('/:id', async (req, res) => {
  try {
    // Check authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { id } = req.params;
    const { title, content, category, summary, markdown } = req.body;
    
    // Validation
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get the current forum to check ownership
    const { data: forum, error: getError } = await supabase
      .from('forums')
      .select('*')
      .eq('id', id)
      .single();
    
    if (getError) {
      throw getError;
    }
    
    if (!forum) {
      return res.status(404).json({ error: 'Forum not found' });
    }
    
    // Get user ID from forum_users
    const { data: userData, error: userError } = await supabase
      .from('forum_users')
      .select('id')
      .eq('username', req.user.username)
      .eq('discord_id', req.user.discord_id)
      .maybeSingle();
    
    if (userError) {
      throw userError;
    }
    
    // Check ownership or admin status
    const isAdmin = req.user.roles?.includes('admin');
    const isOwner = userData && userData.id === forum.user_id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Not authorized to update this forum' });
    }
    
    // Update the forum
    const { data: updatedForum, error: updateError } = await supabase
      .from('forums')
      .update({
        title,
        content,
        category,
        summary: summary || null,
        markdown: !!markdown, // Ensure boolean
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    res.json(updatedForum);
  } catch (error) {
    console.error('Error updating forum:', error);
    res.status(500).json({ error: 'Failed to update forum' });
  }
});

// Delete a forum
router.delete('/:id', async (req, res) => {
  try {
    // Check authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { id } = req.params;
    
    // Get the current forum to check ownership
    const { data: forum, error: getError } = await supabase
      .from('forums')
      .select('*')
      .eq('id', id)
      .single();
    
    if (getError) {
      throw getError;
    }
    
    if (!forum) {
      return res.status(404).json({ error: 'Forum not found' });
    }
    
    // Get user ID from forum_users
    const { data: userData, error: userError } = await supabase
      .from('forum_users')
      .select('id')
      .eq('username', req.user.username)
      .eq('discord_id', req.user.discord_id)
      .maybeSingle();
    
    if (userError) {
      throw userError;
    }
    
    // Check ownership or admin status
    const isAdmin = req.user.roles?.includes('admin');
    const isOwner = userData && userData.id === forum.user_id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Not authorized to delete this forum' });
    }
    
    // Delete all comments for this forum first
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .eq('forum_id', id);
    
    if (commentsError) {
      throw commentsError;
    }
    
    // Delete the forum
    const { error: deleteError } = await supabase
      .from('forums')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      throw deleteError;
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting forum:', error);
    res.status(500).json({ error: 'Failed to delete forum' });
  }
});

// Get comments for a forum
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        forum_users (
          id,
          username,
          avatar,
          discord_id
        )
      `)
      .eq('forum_id', id)
      .order('created_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // Format comments data
    const processedComments = data.map(comment => ({
      ...comment,
      username: comment.forum_users?.username || 'Anonymous',
      avatar: comment.forum_users?.avatar || null,
      discord_id: comment.forum_users?.discord_id || null
    }));
    
    res.json(processedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create comment for a forum
router.post('/:id/comments', async (req, res) => {
  try {
    // Check authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { id } = req.params;
    const { content, parent_id } = req.body;
    
    // Validation
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    // Get or create forum_user record
    const username = req.user.username;
    const discord_id = req.user.discord_id;
    const avatar = req.user.avatar;
    
    // Check if user exists
    let { data: userData, error: userError } = await supabase
      .from('forum_users')
      .select('*')
      .eq('username', username)
      .eq('discord_id', discord_id)
      .maybeSingle();
    
    if (userError) {
      throw userError;
    }
    
    let user_id;
    
    if (!userData) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('forum_users')
        .insert({
          username,
          discord_id,
          avatar
        })
        .select()
        .single();
      
      if (createError) {
        throw createError;
      }
      
      user_id = newUser.id;
    } else {
      user_id = userData.id;
    }
    
    // Create comment
    const { data, error } = await supabase
      .from('comments')
      .insert({
        content,
        forum_id: id,
        user_id,
        parent_id: parent_id || null
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

module.exports = router; 