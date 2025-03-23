const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get current user
router.get('/', async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      // Return user data
      res.json(req.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Get forum user
router.get('/forum-user', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Query forum_users table
    const { data, error } = await supabase
      .from('forum_users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching forum user:', error);
    res.status(500).json({ error: 'Failed to fetch forum user' });
  }
});

module.exports = router; 