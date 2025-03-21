const express = require('express');
const router = express.Router();

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
    router.put('/:id', requireAuth, async (req, res) => {
        try {
            const commentId = req.params.id;
            const { content, forum_id } = req.body;
            
            // Validate required fields
            if (!content || content.trim() === '') {
                return res.status(400).json({ error: 'Comment content cannot be empty' });
            }
            
            if (!forum_id) {
                return res.status(400).json({ error: 'Forum ID is required' });
            }

            console.log('Edit comment request:', {
                commentId,
                forumId: forum_id,
                content: content ? content.substring(0, 30) + '...' : 'empty'
            });
            
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
            
            // Check if comment exists and belongs to the specified forum
            const { data: comment, error: commentError } = await supabase
                .from('forum_comments')
                .select('user_id, forum_id')
                .eq('id', commentId)
                .single();
            
            if (commentError) {
                console.error('Error fetching comment for editing:', commentError);
                return res.status(404).json({ error: 'Comment not found' });
            }
            
            // Verify the comment belongs to the specified forum
            if (comment.forum_id !== forum_id) {
                return res.status(400).json({ error: 'Comment does not belong to the specified forum' });
            }
            
            // Verify ownership
            if (comment.user_id !== forumUser.id) {
                return res.status(403).json({ error: 'You do not have permission to edit this comment' });
            }

            // Update the comment
            const { data: updatedComment, error: updateError } = await supabase
                .from('forum_comments')
                .update({
                    content: content.trim(),
                    updated_at: new Date()
                })
                .eq('id', commentId)
                .select();
            
            if (updateError) {
                console.error('Error updating comment:', updateError);
                return res.status(500).json({ error: 'Failed to update comment' });
            }
            
            if (!updatedComment || updatedComment.length === 0) {
                return res.status(404).json({ error: 'Comment not found or not updated' });
            }
            
            console.log('Comment updated successfully:', updatedComment[0]);
            res.json({
                success: true,
                comment: updatedComment[0]
            });
        } catch (error) {
            console.error('Error processing edit comment request:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Delete a comment
    router.delete('/:id', requireAuth, async (req, res) => {
        try {
            const commentId = req.params.id;
            const { forum_id } = req.body;
            
            // Validate forum_id
            if (!forum_id) {
                return res.status(400).json({ error: 'Forum ID is required' });
            }
            
            // Get the forum_user_id for the authenticated user - use username just like in forum deletion
            const { data: forumUser, error: forumUserError } = await supabase
                .from('forum_users')
                .select('id')
                .eq('username', req.user.username)
                .maybeSingle();
                
            if (forumUserError || !forumUser) {
                console.error('Error finding forum user:', forumUserError);
                return res.status(404).json({ error: 'Forum user not found' });
            }
            
            // Check if comment exists and belongs to the specified forum
            const { data: comment, error: commentError } = await supabase
                .from('forum_comments')
                .select('user_id, forum_id')
                .eq('id', commentId)
                .single();
            
            if (commentError) {
                console.error('Error fetching comment for deletion:', commentError);
                return res.status(404).json({ error: 'Comment not found' });
            }
            
            // Verify the comment belongs to the specified forum
            if (comment.forum_id !== forum_id) {
                return res.status(400).json({ error: 'Comment does not belong to the specified forum' });
            }
            
            // Verify ownership
            if (comment.user_id !== forumUser.id) {
                return res.status(403).json({ error: 'Not authorized to delete this comment' });
            }
            
            // Delete the comment
            const { error: deleteError } = await supabase
                .from('forum_comments')
                .delete()
                .eq('id', commentId);
            
            if (deleteError) {
                console.error('Error deleting comment:', deleteError);
                return res.status(500).json({ error: 'Failed to delete comment' });
            }
            
            res.json({ message: 'Comment deleted successfully' });
        } catch (error) {
            console.error('Error processing delete comment request:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};

module.exports = initializeRouter; 