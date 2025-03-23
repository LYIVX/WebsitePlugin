const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define local auth middleware instead of importing it
const requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
};

// Initialize router function that accepts supabase client
const initializeRouter = (supabase) => {
    // Create a new comment
    router.post('/', requireAuth, async (req, res) => {
        try {
            const { content, forum_id, parent_id } = req.body;
            const userId = req.user.id;
            
            // Input validation
            if (!content || content.trim() === '') {
                return res.status(400).json({ error: 'Comment content cannot be empty' });
            }
            
            if (!forum_id) {
                return res.status(400).json({ error: 'Forum ID is required' });
            }
            
            // Create the comment
            const commentData = {
                user_id: userId,
                forum_id,
                content: content.trim(),
                parent_id: parent_id || null
            };
            
            const result = await supabase
                .from('forum_comments')
                .insert([commentData])
                .returning('*');
            
            // Return the newly created comment
            const comment = result[0];
            
            res.status(201).json({
                success: true,
                comment
            });
        } catch (error) {
            console.error('Error creating comment:', error);
            res.status(500).json({ error: 'Server error while creating comment' });
        }
    });

    // Edit a comment
    router.put('/:id', async (req, res) => {
        try {
            // Check authentication
            if (!req.isAuthenticated()) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            
            const { id } = req.params;
            const { content, forum_id } = req.body;
            
            // Validation
            if (!content) {
                return res.status(400).json({ error: 'Comment content is required' });
            }
            
            // Get the current comment to check ownership
            const { data: comment, error: getError } = await supabase
                .from('comments')
                .select('*')
                .eq('id', id)
                .single();
            
            if (getError) {
                throw getError;
            }
            
            if (!comment) {
                return res.status(404).json({ error: 'Comment not found' });
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
            const isOwner = userData && userData.id === comment.user_id;
            
            if (!isAdmin && !isOwner) {
                return res.status(403).json({ error: 'Not authorized to update this comment' });
            }
            
            // Update the comment
            const { data: updatedComment, error: updateError } = await supabase
                .from('comments')
                .update({
                    content,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();
            
            if (updateError) {
                throw updateError;
            }
            
            res.json(updatedComment);
        } catch (error) {
            console.error('Error updating comment:', error);
            res.status(500).json({ error: 'Failed to update comment' });
        }
    });

    // Delete a comment
    router.delete('/:id', async (req, res) => {
        try {
            // Check authentication
            if (!req.isAuthenticated()) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            
            const { id } = req.params;
            
            // Get the current comment to check ownership
            const { data: comment, error: getError } = await supabase
                .from('comments')
                .select('*')
                .eq('id', id)
                .single();
            
            if (getError) {
                throw getError;
            }
            
            if (!comment) {
                return res.status(404).json({ error: 'Comment not found' });
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
            const isOwner = userData && userData.id === comment.user_id;
            
            if (!isAdmin && !isOwner) {
                return res.status(403).json({ error: 'Not authorized to delete this comment' });
            }
            
            // Delete all child comments first
            const { error: childDeleteError } = await supabase
                .from('comments')
                .delete()
                .eq('parent_id', id);
            
            if (childDeleteError) {
                throw childDeleteError;
            }
            
            // Delete the comment
            const { error: deleteError } = await supabase
                .from('comments')
                .delete()
                .eq('id', id);
            
            if (deleteError) {
                throw deleteError;
            }
            
            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting comment:', error);
            res.status(500).json({ error: 'Failed to delete comment' });
        }
    });

    return router;
};

module.exports = initializeRouter; 