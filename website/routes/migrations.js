const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Add markdown column to forums table
router.post('/add-markdown-column', async (req, res) => {
  try {
    // Use Supabase's RPC to execute raw SQL
    const { data, error } = await supabase.rpc('add_markdown_column');
    
    if (error) {
      throw error;
    }
    
    res.json({ success: true, message: 'Markdown column added successfully' });
  } catch (error) {
    console.error('Error running migration:', error);
    res.status(500).json({ error: 'Failed to run migration' });
  }
});

// Add summary column to forums table
router.post('/add-summary-column', async (req, res) => {
  try {
    // Use Supabase's RPC to execute raw SQL
    const { data, error } = await supabase.rpc('add_summary_column');
    
    if (error) {
      throw error;
    }
    
    res.json({ success: true, message: 'Summary column added successfully' });
  } catch (error) {
    console.error('Error running migration:', error);
    res.status(500).json({ error: 'Failed to run migration' });
  }
});

module.exports = router; 