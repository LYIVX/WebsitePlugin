// Forum functionality
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Ensure database is setup with required functions and columns
        await setupDatabase();
        
        // Initialize UI
        setupEventListeners();
        
        // Load forums on page load
        await loadForums();
        
        // Check auth state for creating forums
        await checkForumAuthState();
    } catch (error) {
        console.error('Error initializing forums page:', error);
        showToast('Failed to initialize forums page', 'error');
    }
});

let currentUser = null;
let currentForumId = null;

// Setup all event listeners
function setupEventListeners() {
    // Create forum button
    const createForumBtn = document.getElementById('createForumBtn');
    if (createForumBtn) {
        createForumBtn.addEventListener('click', openCreateForumModal);
    }
    
    // Close create forum modal
    const closeCreateModal = document.getElementById('closeCreateModal');
    if (closeCreateModal) {
        closeCreateModal.addEventListener('click', () => {
            document.getElementById('createForumModal').style.display = 'none';
        });
    }

    // Cancel button for create forum modal
    const cancelCreateForumBtn = document.getElementById('cancelCreateForum');
    if (cancelCreateForumBtn) {
        cancelCreateForumBtn.addEventListener('click', () => {
            document.getElementById('createForumModal').style.display = 'none';
        });
    }

    // Close edit forum modal
    const closeEditModal = document.getElementById('closeEditModal');
    if (closeEditModal) {
        closeEditModal.addEventListener('click', () => {
            document.getElementById('editForumModal').style.display = 'none';
        });
    }
    
    // Cancel button for edit forum modal
    const cancelEditForumBtn = document.getElementById('cancelEditForum');
    if (cancelEditForumBtn) {
        cancelEditForumBtn.addEventListener('click', () => {
            document.getElementById('editForumModal').style.display = 'none';
        });
    }

    // Create forum form submission
    const createForumForm = document.getElementById('createForumForm');
    if (createForumForm) {
        createForumForm.addEventListener('submit', handleCreateForum);
    }

    // Edit forum form submission
    const editForumForm = document.getElementById('editForumForm');
    if (editForumForm) {
        editForumForm.addEventListener('submit', handleEditForum);
    }

    // Back to forums button
    const backToForumsBtn = document.getElementById('backToForumsBtn');
    if (backToForumsBtn) {
        backToForumsBtn.addEventListener('click', showForumList);
    }

    // Comment form submission
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', handleCreateComment);
    }

    // Category filter change
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', async () => {
            await loadForums(categoryFilter.value);
        });
    }

    // Search input
    const forumSearch = document.getElementById('forumSearch');
    if (forumSearch) {
        let debounceTimeout;
        forumSearch.addEventListener('input', () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(async () => {
                await loadForums(
                    document.getElementById('categoryFilter').value,
                    forumSearch.value
                );
            }, 300);
        });
    }

    // Markdown toggles for Create Forum
    const createMarkdownToggle = document.getElementById('createMarkdownToggle');
    const createMarkdownPreview = document.getElementById('createMarkdownPreview');
    if (createMarkdownToggle) {
        // Listen for the custom toggle-changed event instead of the change event
        document.addEventListener('toggle-changed', function(event) {
            if (event.detail.id === 'createMarkdown') {
                const toolbar = document.getElementById('createMarkdownToolbar');
                const previewContainer = createMarkdownPreview.closest('.markdown-preview-container');
                
                if (event.detail.checked) {
                    toolbar.classList.add('active');
                    toolbar.style.display = 'block';
                    updateMarkdownPreview('createForumContent', 'createMarkdownPreview');
                    // Show preview container and preview
                    if (previewContainer) {
                        previewContainer.style.display = 'block';
                    }
                    if (createMarkdownPreview) {
                        createMarkdownPreview.classList.add('active');
                        createMarkdownPreview.style.display = 'block';
                    }
                } else {
                    toolbar.classList.remove('active');
                    toolbar.style.display = 'none';
                    // Hide preview container and preview
                    if (previewContainer) {
                        previewContainer.style.display = 'none';
                    }
                    if (createMarkdownPreview) {
                        createMarkdownPreview.classList.remove('active');
                        createMarkdownPreview.style.display = 'none';
                    }
                }
            }
        });
    }

    // Markdown toggles for Edit Forum
    const editMarkdownToggle = document.getElementById('editMarkdownToggle');
    const editMarkdownPreview = document.getElementById('editMarkdownPreview');
    if (editMarkdownToggle) {
        // Listen for the custom toggle-changed event instead of the change event
        document.addEventListener('toggle-changed', function(event) {
            if (event.detail.id === 'editMarkdown') {
                const toolbar = document.getElementById('editMarkdownToolbar');
                const previewContainer = editMarkdownPreview.closest('.markdown-preview-container');
                
                if (event.detail.checked) {
                    toolbar.classList.add('active');
                    toolbar.style.display = 'block';
                    updateMarkdownPreview('editForumContent', 'editMarkdownPreview');
                    // Show preview container and preview
                    if (previewContainer) {
                        previewContainer.style.display = 'block';
                    }
                    if (editMarkdownPreview) {
                        editMarkdownPreview.classList.add('active');
                        editMarkdownPreview.style.display = 'block';
                    }
                } else {
                    toolbar.classList.remove('active');
                    toolbar.style.display = 'none';
                    // Hide preview container and preview
                    if (previewContainer) {
                        previewContainer.style.display = 'none';
                    }
                    if (editMarkdownPreview) {
                        editMarkdownPreview.classList.remove('active');
                        editMarkdownPreview.style.display = 'none';
                    }
                }
            }
        });
    }

    // Live preview for Create Forum
    const createForumContent = document.getElementById('createForumContent');
    if (createForumContent) {
        createForumContent.addEventListener('input', function() {
            if (getToggleState('createMarkdown')) {
                updateMarkdownPreview('createForumContent', 'createMarkdownPreview');
            }
        });
    }

    // Live preview for Edit Forum
    const editForumContent = document.getElementById('editForumContent');
    if (editForumContent) {
        editForumContent.addEventListener('input', function() {
            if (getToggleState('editMarkdown')) {
                updateMarkdownPreview('editForumContent', 'editMarkdownPreview');
            }
        });
    }

    // Markdown formatting buttons for Create Forum
    setupMarkdownButtons('createMarkdownToolbar', 'createForumContent');

    // Markdown formatting buttons for Edit Forum
    setupMarkdownButtons('editMarkdownToolbar', 'editForumContent');

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        const createModal = document.getElementById('createForumModal');
        const editModal = document.getElementById('editForumModal');
        
        if (event.target === createModal) {
            createModal.style.display = 'none';
        }
        
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
    });
}

// Update markdown preview as user types
function updateMarkdownPreview(textareaId, previewId) {
    const textarea = document.getElementById(textareaId);
    const preview = document.getElementById(previewId);
    
    if (!textarea || !preview) return;
    
    // Convert markdown to HTML
    const content = textarea.value;
    const html = marked.parse(content);
    
    // Update preview
    preview.innerHTML = html;
    
    // Apply syntax highlighting to code blocks
    if (window.Prism) {
        Prism.highlightAllUnder(preview);
        makeCodeBlocksCollapsible(preview);
    }
}

// Apply syntax highlighting to forum content when viewing
function applyCodeHighlighting() {
    // Apply to forum content when viewing a forum
    const forumContent = document.querySelector('.forum-content');
    if (forumContent && window.Prism) {
        Prism.highlightAllUnder(forumContent);
        makeCodeBlocksCollapsible(forumContent);
    }
    
    // Apply to comments
    const comments = document.querySelectorAll('.comment-content');
    if (comments && comments.length > 0 && window.Prism) {
        comments.forEach(comment => {
            Prism.highlightAllUnder(comment);
            makeCodeBlocksCollapsible(comment);
        });
    }
}

// Make code blocks collapsible if they have more than 5 lines
function makeCodeBlocksCollapsible(container) {
    const preElements = container.querySelectorAll('pre');
    
    preElements.forEach(pre => {
        // Count the number of lines in the code block
        const codeElement = pre.querySelector('code');
        if (!codeElement) return;
        
        const lines = codeElement.innerText.split('\n');
        if (lines.length > 5) {
            // Add collapsible class to pre element
            pre.classList.add('collapsible');
            
            // Create toggle button
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'code-toggle-btn';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Show more';
            toggleBtn.setAttribute('aria-label', 'Expand code block');
            
            // Add toggle functionality
            toggleBtn.addEventListener('click', function() {
                const isExpanded = pre.classList.toggle('expanded');
                if (isExpanded) {
                    toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Show less';
                    toggleBtn.setAttribute('aria-label', 'Collapse code block');
                } else {
                    toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Show more';
                    toggleBtn.setAttribute('aria-label', 'Expand code block');
                }
            });
            
            // Append button to pre element
            pre.appendChild(toggleBtn);
        }
    });
}

// Call this when a forum or comments are loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize forum page
    setupEventListeners();
    applyCodeHighlighting();
    
    // Call the initForumView function to set up collapsible code blocks
    initForumView();
    
    // Configure Prism.js
    if (window.Prism) {
        Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/';
        
        // Force highlighting all code blocks on page load
        setTimeout(() => {
            console.log('Applying initial syntax highlighting');
            Prism.highlightAll();
            
            // Also force it again after a small delay to ensure it gets applied
            setTimeout(() => {
                console.log('Re-applying syntax highlighting');
                Prism.highlightAll();
            }, 1000);
        }, 500);
    }
    
    // Check URL parameters for forum ID
    const urlParams = new URLSearchParams(window.location.search);
    const forumId = urlParams.get('id');
    
    if (forumId) {
        viewForum(forumId);
    } else {
        loadForums();
    }
});

// Insert code block with language selection
function insertCodeBlock(textareaId) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;
    
    // Get the parent markdown toolbar
    const toolbarId = textareaId === 'createForumContent' ? 'createMarkdownToolbar' : 'editMarkdownToolbar';
    const toolbar = document.getElementById(toolbarId);
    if (!toolbar) return;
    
    // Check if language selector already exists
    const existingSelector = document.querySelector('.language-selector-toolbar');
    if (existingSelector) {
        existingSelector.remove();
    }
    
    // Show language selection toolbar
    const languages = ['javascript', 'html', 'css', 'java', 'python', 'php', 'c', 'cpp', 'csharp', 'ruby', 'bash', 'json', 'typescript', 'sql', 'yaml', 'markdown'];
    
    // Create toolbar for language selection
    const languageToolbar = document.createElement('div');
    languageToolbar.className = 'language-selector-toolbar';
    languageToolbar.style.display = 'flex';
    languageToolbar.style.flexWrap = 'wrap';
    languageToolbar.style.padding = '5px';
    languageToolbar.style.marginTop = '5px';
    languageToolbar.style.backgroundColor = 'rgba(20, 23, 34, 0.8)';
    languageToolbar.style.borderRadius = '4px';
    languageToolbar.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    
    // Add title
    const title = document.createElement('div');
    title.textContent = 'Select a language:';
    title.style.width = '100%';
    title.style.margin = '1rem';
    title.style.fontWeight = 'bold';
    title.style.color = '#fff';
    languageToolbar.appendChild(title);
    
    // Add language options
    languages.forEach(lang => {
        const langBtn = document.createElement('button');
        langBtn.textContent = lang;
        langBtn.className = 'universal-btn secondary';
        langBtn.style.margin = '3px';
        langBtn.style.display = 'inline-block';
        langBtn.style.padding = '5px 10px';
        langBtn.style.fontSize = '0.8rem';
        
        langBtn.addEventListener('click', () => {
            // Get cursor position
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            
            // Insert code block with selected language
            const selectedText = textarea.value.substring(start, end);
            
            // Check if the selected text already has code block markers or is inside a code block
            const hasCodeMarkers = selectedText.startsWith('```') && selectedText.endsWith('```');
            
            // Check if we're inside a code block already
            const textBefore = textarea.value.substring(0, start);
            
            // Count backtick groups before cursor - if odd, we're inside a code block
            const codeMarkersBefore = (textBefore.match(/```/g) || []).length;
            const insideCodeBlock = codeMarkersBefore % 2 !== 0;
            
            let codeBlock;
            if (hasCodeMarkers || insideCodeBlock) {
                // Already has code markers or is within code markers, just insert the text
                codeBlock = selectedText;
            } else {
                codeBlock = selectedText.trim() ? 
                    "```" + lang + "\n" + selectedText + "\n```" : 
                    "```" + lang + "\nYour code here\n```";
            }
            
            // Insert at cursor position
            textarea.value = textarea.value.substring(0, start) + codeBlock + textarea.value.substring(end);
            
            // Update the preview
            const previewId = textareaId === 'createForumContent' ? 'createMarkdownPreview' : 'editMarkdownPreview';
            updateMarkdownPreview(textareaId, previewId);
            
            // Remove language selector toolbar
            languageToolbar.remove();
            
            // Position cursor inside the code block if there was no selected text and we're not inside a code block
            if (!selectedText.trim() && !insideCodeBlock && !hasCodeMarkers) {
                const newPosition = start + lang.length + 4 + 1; // 4 for ```\n and 1 for the offset
                textarea.setSelectionRange(newPosition, newPosition);
            } else {
                // Otherwise, position cursor after the inserted text
                const newPosition = start + codeBlock.length;
                textarea.setSelectionRange(newPosition, newPosition);
            }
            
            // Focus back on textarea
            textarea.focus();
        });
        
        languageToolbar.appendChild(langBtn);
    });
    
    // Insert the language selector toolbar after the main toolbar
    toolbar.parentNode.insertBefore(languageToolbar, toolbar.nextSibling);
}

// Setup markdown formatting buttons
function setupMarkdownButtons(toolbarId, textareaId) {
    const toolbar = document.getElementById(toolbarId);
    const textarea = document.getElementById(textareaId);
    const markdownToggle = document.getElementById(textareaId === 'createForumContent' ? 'createMarkdownToggle' : 'editMarkdownToggle');
    
    if (!toolbar || !textarea || !markdownToggle) return;
    
    // Show/hide Markdown toolbar based on toggle
    markdownToggle.addEventListener('change', function() {
        toolbar.style.display = this.checked ? 'block' : 'none';
        
        // Show/hide preview
        const previewContainer = textarea.closest('.forum-content').nextElementSibling.querySelector('.markdown-preview-container');
        const preview = document.getElementById(textareaId === 'createForumContent' ? 'createMarkdownPreview' : 'editMarkdownPreview');
        
        if (previewContainer && preview) {
            previewContainer.style.display = this.checked ? 'block' : 'none';
            preview.style.display = this.checked ? 'block' : 'none';
            
            // Update preview if toggle is enabled
            if (this.checked) {
                updateMarkdownPreview(textareaId, preview.id);
            }
        }
    });
    
    // Add click event to toolbar buttons
    toolbar.querySelectorAll('.md-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tag = button.getAttribute('data-md-tag');
            insertMarkdownTag(tag, textarea, textareaId);
        });
    });
}

// Insert markdown tags based on button clicked
function insertMarkdownTag(tag, textarea, textareaId) {
    if (!textarea) return;
    
    // Get cursor position
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let replacement = '';
    
    switch (tag) {
        case 'h1':
            replacement = `# ${selectedText}`;
            break;
        case 'h2':
            replacement = `## ${selectedText}`;
            break;
        case 'h3':
            replacement = `### ${selectedText}`;
            break;
        case 'bold':
            replacement = `**${selectedText}**`;
            break;
        case 'italic':
            replacement = `*${selectedText}*`;
            break;
        case 'underline':
            replacement = `++${selectedText}++`;
            break;
        case 'align-left':
            replacement = `<div data-alignment="left">\n${selectedText}\n</div>`;
            break;
        case 'align-center':
            replacement = `<div data-alignment="center">\n${selectedText}\n</div>`;
            break;
        case 'align-right':
            replacement = `<div data-alignment="right">\n${selectedText}\n</div>`;
            break;
        case 'link':
            const linkText = selectedText || 'Link Text';
            replacement = `[${linkText}](https://example.com)`;
            break;
        case 'image':
            replacement = `![${selectedText || 'Image Alt Text'}](https://example.com/image.jpg)`;
            break;
        case 'line':
            replacement = `\n---\n`;
            break;
        case 'code':
            // Clean up any existing language selector before creating a new one
            const existingSelector = document.querySelector('.language-selector-toolbar');
            if (existingSelector) {
                existingSelector.remove();
            }
            // Call our code block insertion function
            insertCodeBlock(textareaId);
            return; // Early return as we handle this separately
        case 'list-ul':
            replacement = selectedText.split('\n').map(line => `- ${line}`).join('\n');
            break;
        case 'list-ol':
            replacement = selectedText.split('\n').map((line, i) => `${i+1}. ${line}`).join('\n');
            break;
        case 'quote':
            replacement = selectedText.split('\n').map(line => `> ${line}`).join('\n');
            break;
    }
    
    // Replace the selected text with the formatted text
    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    
    // Update the live preview if markdown is enabled
    if (document.getElementById(textareaId === 'createForumContent' ? 'createMarkdownToggle' : 'editMarkdownToggle').checked) {
        updateMarkdownPreview(textareaId, textareaId === 'createForumContent' ? 'createMarkdownPreview' : 'editMarkdownPreview');
    }
    
    // Set the cursor position after the inserted text
    textarea.focus();
    const newPosition = start + replacement.length;
    textarea.selectionStart = newPosition;
    textarea.selectionEnd = newPosition;
}

// Check if user is authenticated for forum creation/commenting
async function checkForumAuthState() {
    try {
        console.log('Checking auth state...');
        const response = await fetch('/api/user', {
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        console.log('Auth check response status:', response.status);
        
        if (response.ok) {
            const userData = await response.json();
            console.log('Raw user data from API:', userData);
            
            // Store both user IDs for comparison - this is crucial
            // The auth system uses Discord IDs, but forum posts use forum_users IDs
            currentUser = {
                ...userData,
                discord_id: userData.discord_id,
                forumUserId: null  // This will be set when user interacts with forums
            };
            
            // Log user ID for debugging type issues
            console.log('Current user details for permission checks:', {
                id: currentUser.id,
                discord_id: currentUser.discord_id,
                username: currentUser.username
            });
            
            // Now fetch the forum_users ID for this Discord user
            try {
                const forumUserResponse = await fetch(`/api/forum-user?username=${encodeURIComponent(currentUser.username)}`, {
                    credentials: 'include'
                });
                
                if (forumUserResponse.ok) {
                    const forumUserData = await forumUserResponse.json();
                    if (forumUserData && forumUserData.id) {
                        currentUser.forumUserId = String(forumUserData.id);
                        console.log('Forum user ID retrieved:', currentUser.forumUserId);
                    }
                }
            } catch (forumUserError) {
                console.error('Error fetching forum user ID:', forumUserError);
            }
            
            // Enable creation and commenting if authenticated
            const createForumBtn = document.getElementById('createForumBtn');
            const loginPrompt = document.getElementById('loginPrompt');
            const commentForm = document.getElementById('commentForm');
            
            if (createForumBtn) createForumBtn.disabled = false;
            if (loginPrompt) loginPrompt.style.display = 'none';
            if (commentForm) commentForm.style.display = 'block';
        } else {
            console.log('User not authenticated, response status:', response.status);
            const responseText = await response.text();
            console.log('Auth response text:', responseText);
            currentUser = null;
            
            // Disable creation and commenting if not authenticated
            const createForumBtn = document.getElementById('createForumBtn');
            const loginPrompt = document.getElementById('loginPrompt');
            const commentForm = document.getElementById('commentForm');
            
            if (createForumBtn) createForumBtn.disabled = true;
            if (loginPrompt) loginPrompt.style.display = 'block';
            if (commentForm) commentForm.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking auth state for forums:', error);
        showToast('Failed to check authentication status', 'error');
    }
}

// Load forums from the server
async function loadForums(category = 'all', searchQuery = '') {
    try {
        showLoading();
        
        let url = '/api/forums';
        const params = new URLSearchParams();
        
        if (category && category !== 'all') {
            params.append('category', category);
        }
        
        if (searchQuery) {
            params.append('search', searchQuery);
        }
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to load forums');
        }
        
        const forums = await response.json();
        
        // Log summary data from all forums to verify it's being received
        console.log('Forums loaded with summaries:', forums.map(forum => ({
            id: forum.id,
            title: forum.title,
            summary: forum.summary,
            hasSummary: !!forum.summary
        })));
        
        renderForumList(forums);
    } catch (error) {
        console.error('Error loading forums:', error);
        showToast('Failed to load forums', 'error');
    } finally {
        hideLoading();
    }
}

// Render the forum list
function renderForumList(forums) {
    const forumList = document.getElementById('forumList');
    const emptyState = document.getElementById('emptyForumState');
    
    // Clear current list
    forumList.innerHTML = '';
    
    if (forums.length === 0) {
        if (emptyState) {
            emptyState.style.display = 'flex';
        }
        return;
    }
    
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Add each forum to the list
    forums.forEach(forum => {
        const forumItem = document.createElement('div');
        forumItem.className = 'forum-item';
        forumItem.dataset.id = forum.id;
        
        // Format date
        const createdDate = new Date(forum.created_at);
        const formattedDate = createdDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Use summary if available, otherwise truncate content
        let previewText = '';
        if (forum.summary) {
            previewText = forum.summary;
        } else {
            // Fallback to content truncation
            previewText = forum.content.length > 150
                ? forum.content.substring(0, 150) + '...'
                : forum.content;
        }

        // Process preview content based on markdown setting
        let processedPreview;
        if (forum.markdown) {
            // Strip markdown syntax for preview
            processedPreview = stripMarkdown(previewText);
        } else {
            // Use regular text for non-markdown content
            processedPreview = escapeHtml(previewText);
        }
        
        // Get avatar URL
        let avatarUrl = '/assets/default-avatar.png';
        if (forum.discord_id && forum.avatar) {
            // Handle Discord avatar format
            const isAnimated = forum.avatar.startsWith('a_');
            const ext = isAnimated ? 'gif' : 'png';
            avatarUrl = `https://cdn.discordapp.com/avatars/${forum.discord_id}/${forum.avatar}.${ext}?size=128`;
            console.log('Forum author avatar URL:', avatarUrl);
        }
        
        forumItem.innerHTML = `
            <div class="forum-item-content">
                <div class="forum-item-title">${escapeHtml(forum.title)}</div>
                <div class="forum-item-meta">
                    <span class="forum-category ${forum.category}">${getCategoryName(forum.category)}</span>
                    <span class="forum-author">
                        <div class="user-avatar">
                            <img src="${avatarUrl}" alt="${escapeHtml(forum.username)}" 
                                 onerror="this.onerror=null; this.src='/assets/default-avatar.png';"
                                 loading="lazy">
                        </div>
                        <span class="username">${escapeHtml(forum.username)}</span>
                    </span>
                    <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                    ${forum.markdown ? '<span class="markdown-indicator"><i class="fas fa-markdown"></i> Markdown</span>' : ''}
                </div>
                <div class="forum-item-preview">${processedPreview}</div>
            </div>
            <div class="forum-stats">
                <div class="forum-stat">
                    <div class="forum-stat-value">${forum.views || 0}</div>
                    <div class="forum-stat-label">Views</div>
                </div>
                <div class="forum-stat">
                    <div class="forum-stat-value">${forum.comment_count || 0}</div>
                    <div class="forum-stat-label">Comments</div>
                </div>
            </div>
        `;
        
        // Add click event to view forum
        forumItem.addEventListener('click', () => {
            viewForum(forum.id);
        });
        
        forumList.appendChild(forumItem);
    });
}

// Open the create forum modal
function openCreateForumModal() {
    if (!currentUser) {
        showToast('Please login to create a discussion', 'warning');
        return;
    }
    
    // Reset form
    document.getElementById('createForumForm').reset();
    
    // Update the username in the preview
    const usernameDisplay = document.querySelector('#createForumModal .forum-meta span:first-child');
    if (usernameDisplay && currentUser.username) {
        usernameDisplay.innerHTML = `<i class="fas fa-user"></i> ${escapeHtml(currentUser.username)}`;
    }
    
    // Reset category badge
    const categoryBadge = document.getElementById('createCategoryBadge');
    if (categoryBadge) {
        categoryBadge.textContent = '';
        categoryBadge.className = 'forum-category';
    }
    
    // Reset markdown toggle and hide preview by default
    const markdownToggle = document.getElementById('createMarkdownToggle');
    if (markdownToggle) {
        markdownToggle.checked = false;
    }
    
    const markdownToolbar = document.getElementById('createMarkdownToolbar');
    if (markdownToolbar) {
        markdownToolbar.classList.remove('active');
        markdownToolbar.style.display = 'none';
    }
    
    const markdownPreview = document.getElementById('createMarkdownPreview');
    if (markdownPreview) {
        markdownPreview.classList.remove('active');
        markdownPreview.style.display = 'none';
        markdownPreview.innerHTML = '<div class="placeholder-text">Your formatted content will appear here as you type.</div>';
        
        // Hide the preview container
        const previewContainer = markdownPreview.closest('.markdown-preview-container');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
    }
    
    // Display the modal
    document.getElementById('createForumModal').style.display = 'block';
    
    // Focus the title input
    setTimeout(() => {
        document.getElementById('createForumTitle').focus();
    }, 100);
}

// Handle creating a new forum
async function handleCreateForum(event) {
    event.preventDefault();
    
    try {
        showLoading();
        
        const title = document.getElementById('createForumTitle').value;
        const summary = document.getElementById('createForumSummary').value;
        const content = document.getElementById('createForumContent').value;
        const category = document.getElementById('forumCategory').value;
        const useMarkdown = document.getElementById('createMarkdownToggle').checked;
        
        if (!title || !content || !category) {
            showToast('Please fill all required fields', 'error');
            return;
        }
        
        const forumData = {
            title: title,
            summary: summary,
            content: content,
            category: category,
            markdown: useMarkdown
        };
        
        console.log('Submitting forum data with summary:', forumData);
        
        const response = await fetch('/api/forums', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(forumData),
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to create forum');
        }
        
        const result = await response.json();
        console.log('Created forum response:', result);
        
        // Close modal and reset form
        document.getElementById('createForumModal').style.display = 'none';
        document.getElementById('createForumForm').reset();
        document.getElementById('createMarkdownToggle').checked = false;
        document.getElementById('createMarkdownToolbar').classList.remove('active');
        
        // Load the newly created forum
        await viewForum(result.id);
        
        showToast('Forum created successfully', 'success');
    } catch (error) {
        console.error('Error creating forum:', error);
        showToast('Failed to create forum', 'error');
    } finally {
        hideLoading();
    }
}

// View a specific forum
async function viewForum(forumId) {
    try {
        showLoading();
        
        // Store the current forum ID
        currentForumId = forumId;
        console.log('Set current forum ID:', currentForumId);
        
        // Get forum details
        const forumResponse = await fetch(`/api/forums/${forumId}`);
        
        if (!forumResponse.ok) {
            throw new Error('Failed to fetch forum details');
        }
        
        const forum = await forumResponse.json();
        console.log('Received forum data:', {
            id: forum.id,
            title: forum.title,
            summary: forum.summary, // Log to verify summary is loaded
            contentStart: forum.content?.substring(0, 50) + '...'
        });
        
        // Get forum comments
        const commentsResponse = await fetch(`/api/forums/${forumId}/comments`);
        
        if (!commentsResponse.ok) {
            throw new Error('Failed to fetch forum comments');
        }
        
        const comments = await commentsResponse.json();
        
        // Show forum view, hide forum list
        document.getElementById('forumListSection').style.display = 'none';
        document.getElementById('forumViewSection').style.display = 'block';
        
        // Render the forum
        renderForumView(forum, comments);
    } catch (error) {
        console.error('Error viewing forum:', error);
        showToast('Failed to load forum', 'error');
    } finally {
        hideLoading();
    }
}

// Function to render markdown content
function renderMarkdown(text) {
    if (!text) return '';
    
    // Save alignment divs for post-processing
    const alignmentDivs = [];
    text = text.replace(/<div data-alignment="(left|center|right)">\n([\s\S]*?)\n<\/div>/g, function(match, alignment, content) {
        const id = 'align-' + alignmentDivs.length;
        alignmentDivs.push({id, alignment, content});
        return `<div id="${id}"></div>`;
    });
    
    // Replace headings
    text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    text = text.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    
    // Replace bold and italic
    // First, handle bold with double asterisks or underscores
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Then, handle italic with single asterisks or underscores
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Handle underline with double plus signs
    text = text.replace(/\+\+([^+]+)\+\+/g, '<u>$1</u>');
    
    // Replace horizontal lines
    text = text.replace(/^---+$/gm, '<hr class="markdown-hr">');
    
    // Replace images (must be done before links to avoid interference)
    text = text.replace(/!\[(.*?)\]\((.*?)(?:\s+["']?width=(\d+)%?["']?)?\)/g, function(match, alt, url, width) {
        // Make sure URL is properly encoded
        const encodedUrl = url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const style = width ? ` style="width: ${width}%;"` : '';
        return `<img src="${encodedUrl}" alt="${alt || ''}" class="markdown-image resizable"${style}>`;
    });
    
    // Replace links
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Replace code blocks
    text = text.replace(/```(\w*)\s*([\s\S]*?)```/g, function(match, language, code) {
        // Clean the code to prevent HTML injection but preserve line breaks
        const cleanCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Count lines to determine if it should be collapsible
        const lineCount = cleanCode.split('\n').length;
        const collapsibleClass = lineCount > 5 ? ' collapsible' : '';
        
        // Add language class if specified
        const languageClass = language ? ` class="language-${language}${collapsibleClass}"` : ` class="${collapsibleClass}"`;
        
        // Wrap the code in special line markers
        const processedCode = cleanCode.split('\n').map(line => {
            return `<span class="token-line">${line}</span>`;
        }).join('\n');
        
        let result = `<pre${languageClass}><code${languageClass}>${processedCode}</code></pre>`;
        
        // If collapsible, add class but NOT the button (button is added by makeCodeBlocksCollapsible)
        if (lineCount > 5) {
            result = result.replace('<pre', '<pre class="collapsible"');
        }
        
        return result;
    });
    
    // Replace inline code
    text = text.replace(/`([^`]+)`/g, function(match, code) {
        // Clean the code to prevent HTML injection
        const cleanCode = code.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return `<code>${cleanCode}</code>`;
    });
    
    // Replace unordered lists
    const ulRegex = /^- (.+)$/gm;
    if (ulRegex.test(text)) {
        let inList = false;
        const lines = text.split('\n');
        
        text = lines.map(line => {
            if (line.match(ulRegex)) {
                const listItem = line.replace(ulRegex, '<li>$1</li>');
                if (!inList) {
                    inList = true;
                    return '<ul>' + listItem;
                }
                return listItem;
            } else if (inList) {
                inList = false;
                return '</ul>\n' + line;
            } else {
                return line;
            }
        }).join('\n');
        
        // Close any open lists at the end
        if (inList) {
            text += '\n</ul>';
        }
    }
    
    // Replace ordered lists
    const olRegex = /^\d+\. (.+)$/gm;
    if (olRegex.test(text)) {
        let inList = false;
        const lines = text.split('\n');
        
        text = lines.map(line => {
            if (line.match(olRegex)) {
                const listItem = line.replace(olRegex, '<li>$1</li>');
                if (!inList) {
                    inList = true;
                    return '<ol>' + listItem;
                }
                return listItem;
            } else if (inList) {
                inList = false;
                return '</ol>\n' + line;
            } else {
                return line;
            }
        }).join('\n');
        
        // Close any open lists at the end
        if (inList) {
            text += '\n</ol>';
        }
    }
    
    // Replace quotes
    const quoteRegex = /^> (.+)$/gm;
    if (quoteRegex.test(text)) {
        let inQuote = false;
        const lines = text.split('\n');
        
        text = lines.map(line => {
            if (line.match(quoteRegex)) {
                const quoteContent = line.replace(quoteRegex, '$1');
                if (!inQuote) {
                    inQuote = true;
                    return '<blockquote>' + quoteContent;
                }
                return quoteContent + '<br>';
            } else if (inQuote) {
                inQuote = false;
                return '</blockquote>\n' + line;
            } else {
                return line;
            }
        }).join('\n');
        
        // Close any open quotes at the end
        if (inQuote) {
            text += '\n</blockquote>';
        }
    }
    
    // Replace paragraphs (lines with content that aren't inside HTML tags)
    const paragraphs = text.split('\n\n');
    text = paragraphs.map(para => {
        if (para.trim() && 
            !para.trim().startsWith('<') && 
            !para.trim().startsWith('</')) {
            return `<p>${para}</p>`;
        }
        return para;
    }).join('\n\n');
    
    // Replace line breaks not in HTML tags with <br>
    text = text.replace(/\n(?!<)/g, '<br>');
    
    // Now restore alignment divs with proper styling
    alignmentDivs.forEach(({id, alignment, content}) => {
        // Process the content with markdown rendering
        const processedContent = renderMarkdown(content);
        // Replace the placeholder with the styled alignment div
        text = text.replace(
            new RegExp(`<div id="${id}"></div>`, 'g'),
            `<div style="text-align: ${alignment};">${processedContent}</div>`
        );
    });
    
    return text;
}

// Render the forum view
function renderForumView(forum, comments) {
    // Update the DOM with forum data
    document.getElementById('forumTitle').textContent = forum.title;
    
    // Determine author display name
    let authorName = 'Anonymous';
    if (forum.username) {
        authorName = forum.username;
    } else if (forum.author && forum.author.username) {
        authorName = forum.author.username;
    }
    
    // Set author and date information
    document.getElementById('forumAuthor').innerHTML = `<i class="fas fa-user"></i> ${escapeHtml(authorName)}`;
    
    // Format date
    const createdDate = new Date(forum.created_at);
    document.getElementById('forumDate').innerHTML = `<i class="fas fa-calendar"></i> ${createdDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`;
    
    // Set views count
    document.getElementById('forumViews').innerHTML = `<i class="fas fa-eye"></i> ${forum.views || 0} views`;
    
    // Set content
    const contentElement = document.getElementById('forumContent');
    
    // Check if markdown is enabled for this forum
    if (forum.markdown) {
        // Render markdown content
        contentElement.innerHTML = renderMarkdown(forum.content);
        contentElement.classList.add('markdown-content');
    } else {
        // Render regular content with HTML escaping and line breaks
        contentElement.innerHTML = escapeHtml(forum.content).replace(/\n/g, '<br>');
        contentElement.classList.remove('markdown-content');
    }
    
    // Apply syntax highlighting to code blocks
    if (window.Prism) {
        console.log('Applying Prism.js highlighting to forum content');
        setTimeout(() => {
            Prism.highlightAllUnder(contentElement);
            // Apply collapsible code blocks
            makeCodeBlocksCollapsible(contentElement);
        }, 0);
    }
    
    // Show edit/delete buttons if user is the author
    const forumActions = document.getElementById('forumActions');
    const forumActionsBottom = document.getElementById('forumActionsBottom');
    
    // Clear previous action buttons
    const actionsRight = forumActions.querySelector('.forum-actions-right');
    if (actionsRight) {
        actionsRight.innerHTML = '';
    }
    
    if (forumActionsBottom) {
        forumActionsBottom.innerHTML = '';
    }
    
    // Force string conversion for IDs
    const forumUserIdStr = String(forum.user_id);
    const currentForumUserIdStr = currentUser && currentUser.forumUserId ? String(currentUser.forumUserId) : '';
    
    // Check if current user is the forum owner
    const isForumOwner = currentUser && (
        (currentForumUserIdStr && currentForumUserIdStr === forumUserIdStr) || 
        (forum.username === currentUser.username)
    );
    
    // Admin check (can be expanded)
    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes('admin');
    
    if (isForumOwner || isAdmin) {
        // Create edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'forum-action-btn universal-btn secondary';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        editBtn.addEventListener('click', () => openEditForumModal(forum));
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'forum-action-btn universal-btn danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        deleteBtn.addEventListener('click', () => confirmDeleteForum(forum.id));
        
        // Add to top actions
        if (actionsRight) {
            actionsRight.appendChild(editBtn.cloneNode(true));
            actionsRight.appendChild(deleteBtn.cloneNode(true));
            
            // Re-attach event listeners for cloned buttons
            actionsRight.lastChild.addEventListener('click', () => confirmDeleteForum(forum.id));
            actionsRight.lastChild.previousSibling.addEventListener('click', () => openEditForumModal(forum));
        }
        
        // Add to bottom actions
        if (forumActionsBottom) {
            forumActionsBottom.appendChild(editBtn);
            forumActionsBottom.appendChild(deleteBtn);
        }
    }
    
    // Render comments
    renderComments(comments || []);
    
    // Show the forum view and hide the list
    document.getElementById('forumListSection').style.display = 'none';
    document.getElementById('forumViewSection').style.display = 'block';
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Render comments for a forum
function renderComments(comments) {
    const commentsList = document.getElementById('commentsList');
    commentsList.innerHTML = '';
    
    if (!comments || comments.length === 0) {
        commentsList.innerHTML = '<div class="empty-state"><p>No comments yet. Be the first to comment!</p></div>';
        return;
    }
    
    console.log('Raw comments data (first 3):', JSON.stringify(comments.slice(0, 3)));
    console.log('Comments count:', comments.length);
    console.log('Current user for comment permissions:', currentUser ? { 
        id: currentUser.id,
        username: currentUser.username,
        idType: typeof currentUser.id 
    } : 'Not logged in');
    
    try {
        // Organize comments into a hierarchy
        const commentMap = new Map();
        const topLevelComments = [];
        
        // First, create all comment objects with empty replies arrays
        comments.forEach(comment => {
            if (!comment || !comment.id) {
                console.error('Invalid comment:', comment);
                return;
            }
            commentMap.set(comment.id, { ...comment, replies: [] });
        });
        
        console.log('Comment map created with', commentMap.size, 'entries');
        
        // Then organize into parent-child relationships
        comments.forEach(comment => {
            if (!comment || !comment.id) return;
            
            console.log(`Processing comment ${comment.id}, parent_id:`, comment.parent_id);
            
            // Check if this is a reply
            if (comment.parent_id) {
                const parentComment = commentMap.get(comment.parent_id);
                if (parentComment) {
                    // Add this comment as a reply to its parent
                    parentComment.replies.push(commentMap.get(comment.id));
                    console.log(`Added comment ${comment.id} as reply to ${comment.parent_id}`);
                } else {
                    // If parent doesn't exist (shouldn't happen), show as top level
                    console.warn(`Parent comment ${comment.parent_id} not found for reply ${comment.id}`);
                    topLevelComments.push(commentMap.get(comment.id));
                }
            } else {
                // This is a top-level comment
                topLevelComments.push(commentMap.get(comment.id));
                console.log(`Added comment ${comment.id} as top-level comment`);
            }
        });
        
        console.log(`Organized comments: ${topLevelComments.length} top-level, ${comments.length - topLevelComments.length} replies`);
        console.log('Top-level comments:', topLevelComments.map(c => c.id));
        
        // Log the structure of the first comment with replies if available
        const commentWithReplies = topLevelComments.find(c => c.replies && c.replies.length > 0);
        if (commentWithReplies) {
            console.log('Sample comment with replies:', {
                id: commentWithReplies.id,
                content: commentWithReplies.content.substring(0, 20) + '...',
                replies: commentWithReplies.replies.map(r => r.id)
            });
        }
        
        // Render the comment hierarchy
        topLevelComments.forEach(comment => {
            const commentEl = createCommentElement(comment);
            commentsList.appendChild(commentEl);
        });
        
        // Force display owner controls for comments as a fallback
        setTimeout(forceDisplayOwnerControls, 100);
    } catch (error) {
        console.error('Error rendering comments:', error);
        commentsList.innerHTML = '<div class="empty-state"><p>Error displaying comments. Please try again later.</p></div>';
    }
}

// Handle creating a comment element
function createCommentElement(comment, isReply = false) {
    const commentEl = document.createElement('div');
    commentEl.className = isReply ? 'comment reply' : 'comment';
    commentEl.dataset.commentId = comment.id;
    
    // Format date
    const createdDate = new Date(comment.created_at);
    const formattedDate = createdDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Add (edited) indicator if the comment has been updated
    const isEdited = comment.updated_at && new Date(comment.updated_at) > new Date(comment.created_at);
    const dateDisplay = isEdited ? `${formattedDate} (edited)` : formattedDate;
    
    // Get avatar URL & username - handle different data structures
    let username = 'Anonymous';
    let avatarUrl = '/assets/default-avatar.png';
    let userId = comment.user_id;

    // Log raw comment data for debugging
    console.log('Raw comment data for avatar:', {
        comment_id: comment.id,
        forum_users: comment.forum_users,
        direct_avatar: comment.avatar,
        direct_discord_id: comment.discord_id
    });
    
    // Handle various data structures
    if (comment.username) {
        username = comment.username;
        userId = comment.user_id;
    }
    
    if (comment.forum_users) {
        username = comment.forum_users.username || username;
        avatarUrl = comment.forum_users.avatar || avatarUrl;
        userId = comment.forum_users.id || userId;
    }
    
    // Handle Discord avatar format correctly
    if (comment.discord_id && comment.avatar) {
        // Check if the avatar is animated and use appropriate extension
        const isAnimated = comment.avatar.startsWith('a_');
        const ext = isAnimated ? 'gif' : 'png';
        avatarUrl = `https://cdn.discordapp.com/avatars/${comment.discord_id}/${comment.avatar}.${ext}?size=128`;
    } else if (comment.avatar && !comment.avatar.startsWith('http')) {
        // For legacy avatar paths that aren't full URLs
        avatarUrl = comment.avatar;
    }
    
    // Check if current user is the author
    let isCurrentUserAuthor = false;
    
    const commentUserIdStr = String(userId);
    const currentForumUserIdStr = currentUser && currentUser.forumUserId ? 
        String(currentUser.forumUserId) : '';
    
    if (currentUser && currentForumUserIdStr && (currentForumUserIdStr === commentUserIdStr)) {
        isCurrentUserAuthor = true;
    }
    
    console.log(`Comment ${comment.id} ownership check:`, {
        commentUserIdStr,
        currentForumUserIdStr,
        isMatch: isCurrentUserAuthor,
        username,
        currentUsername: currentUser?.username
    });
    
    // DEBUG: Add custom HTML attributes to help visually debug ownership
    if (currentUser) {
        commentEl.setAttribute('data-current-user-id', currentForumUserIdStr);
        commentEl.setAttribute('data-comment-user-id', commentUserIdStr);
        commentEl.setAttribute('data-is-owner', isCurrentUserAuthor ? 'true' : 'false');
        commentEl.setAttribute('data-username-match', username === currentUser.username ? 'true' : 'false');
    }
    
    // Fallback username match check (in case IDs don't match but usernames do)
    const usernameMatch = currentUser && username === currentUser.username;
    if (usernameMatch && !isCurrentUserAuthor) {
        console.log(`Username match for comment ${comment.id}, enabling ownership via username`);
        isCurrentUserAuthor = true;
        commentEl.setAttribute('data-is-owner', 'true');
        commentEl.setAttribute('data-ownership-via', 'username');
    }
    
    // Show edit and delete buttons if user is the comment author
    const ownerButtons = isCurrentUserAuthor ? `
        <button class="universal-btn secondary small edit-comment-btn" data-comment-id="${comment.id}"><i class="fas fa-edit"></i> Edit</button>
        <button class="universal-btn danger small delete-comment-btn" data-comment-id="${comment.id}"><i class="fas fa-trash"></i> Delete</button>
    ` : '';
    
    // Create comment content
    const commentContent = document.createElement('div');
    commentContent.className = 'comment-content';
    
    // Handle markdown if enabled
    if (comment.markdown) {
        commentContent.innerHTML = renderMarkdown(comment.content);
    } else {
        commentContent.innerHTML = escapeHtml(comment.content).replace(/\n/g, '<br>');
    }
    
    // Apply syntax highlighting to code in comments
    if (window.Prism) {
        console.log('Applying Prism.js highlighting to comment', comment.id);
        setTimeout(() => {
            Prism.highlightAllUnder(commentContent);
        }, 0);
    }
    
    commentEl.appendChild(commentContent);
    
    // Create the comment HTML
    let commentHTML = `
        <div class="comment-header">
            <div class="comment-author">
                <div class="user-avatar">
                    <img src="${avatarUrl}" alt="${escapeHtml(username)}" 
                         onerror="this.onerror=null; this.src='/assets/default-avatar.png';"
                         loading="lazy">
                </div>
                <span class="username">${escapeHtml(username)}</span>
            </div>
            <div class="comment-date">${dateDisplay}</div>
        </div>
        <div class="comment-actions">
            <button class="universal-btn secondary small reply-btn" data-comment-id="${comment.id}"><i class="fas fa-reply"></i> Reply</button>
            ${ownerButtons}
        </div>
        <div class="reply-form-container" id="replyForm-${comment.id}" style="display: none;">
            <textarea class="reply-textarea" placeholder="Write your reply..."></textarea>
            <div class="reply-form-actions">
                <button class="universal-btn secondary small btn-cancel-reply">Cancel</button>
                <button class="universal-btn primary small btn-submit-reply" data-comment-id="${comment.id}">Reply</button>
            </div>
        </div>
        <div class="edit-form-container" id="editForm-${comment.id}" style="display: none;">
            <textarea class="edit-textarea" placeholder="Edit your comment...">${comment.content}</textarea>
            <div class="edit-form-actions">
                <button class="universal-btn secondary small btn-cancel-edit">Cancel</button>
                <button class="universal-btn primary small btn-submit-edit" data-comment-id="${comment.id}">Save</button>
            </div>
        </div>
    `;
    
    // Add the HTML to the element
    commentEl.innerHTML = commentHTML;
    
    // Create a replies container if this comment has replies
    if (comment.replies && comment.replies.length > 0) {
        console.log(`Rendering ${comment.replies.length} replies for comment ${comment.id}`);
        const repliesContainer = document.createElement('div');
        repliesContainer.className = 'replies-container';
        
        // Add each reply to the container
        comment.replies.forEach(reply => {
            const replyEl = createCommentElement(reply, true);
            repliesContainer.appendChild(replyEl);
        });
        
        // Append the replies container to the comment
        commentEl.appendChild(repliesContainer);
    } else {
        // Add an empty replies container for future replies
        const emptyReplies = document.createElement('div');
        emptyReplies.className = 'replies-container';
        commentEl.appendChild(emptyReplies);
    }
    
    // Add event listeners to the buttons immediately
    const replyBtn = commentEl.querySelector(`.reply-btn[data-comment-id="${comment.id}"]`);
    if (replyBtn) {
        replyBtn.addEventListener('click', () => toggleReplyForm(comment.id));
    }
    
    const cancelReplyBtn = commentEl.querySelector('.btn-cancel-reply');
    if (cancelReplyBtn) {
        cancelReplyBtn.addEventListener('click', () => toggleReplyForm(comment.id, false));
    }
    
    const submitReplyBtn = commentEl.querySelector(`.btn-submit-reply[data-comment-id="${comment.id}"]`);
    if (submitReplyBtn) {
        submitReplyBtn.addEventListener('click', () => submitReply(comment.id));
    }
    
    // Edit button
    const editBtn = commentEl.querySelector(`.edit-comment-btn[data-comment-id="${comment.id}"]`);
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            console.log(`Edit button clicked for comment ${comment.id}`);
            toggleEditForm(comment.id);
        });
    }
    
    const cancelEditBtn = commentEl.querySelector('.btn-cancel-edit');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => toggleEditForm(comment.id, false));
    }
    
    const submitEditBtn = commentEl.querySelector(`.btn-submit-edit[data-comment-id="${comment.id}"]`);
    if (submitEditBtn) {
        submitEditBtn.addEventListener('click', () => submitEditComment(comment.id));
    }
    
    // Delete button
    const deleteBtn = commentEl.querySelector(`.delete-comment-btn[data-comment-id="${comment.id}"]`);
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            console.log(`Delete button clicked for comment ${comment.id}`);
            confirmDeleteComment(comment.id);
        });
    }
    
    return commentEl;
}

// Toggle reply form visibility
function toggleReplyForm(commentId, show = true) {
    const replyForm = document.getElementById(`replyForm-${commentId}`);
    if (replyForm) {
        replyForm.style.display = show ? 'block' : 'none';
        if (show) {
            replyForm.querySelector('textarea').focus();
        }
    }
}

// Submit a reply to a comment
async function submitReply(parentId) {
    if (!currentUser) {
        showToast('Please login to reply', 'warning');
        return;
    }
    
    if (!currentForumId) {
        showToast('No forum selected', 'error');
        return;
    }
    
    const replyForm = document.getElementById(`replyForm-${parentId}`);
    if (!replyForm) return;
    
    const textarea = replyForm.querySelector('.reply-textarea');
    if (!textarea) return;
    
    const content = textarea.value.trim();
    
    if (!content) {
        showToast('Please enter a reply', 'warning');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`/api/forums/${currentForumId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                content,
                parent_id: parentId
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create reply');
        }
        
        // Clear the textarea and hide the form
        textarea.value = '';
        toggleReplyForm(parentId, false);
        
        showToast('Reply added successfully', 'success');
        
        // Reload comments
        const commentsResponse = await fetch(`/api/forums/${currentForumId}/comments`);
        if (!commentsResponse.ok) {
            throw new Error('Failed to load comments');
        }
        
        const comments = await commentsResponse.json();
        renderComments(comments);
    } catch (error) {
        console.error('Error creating reply:', error);
        showToast('Failed to add reply', 'error');
    } finally {
        hideLoading();
    }
}

// Handle creating a new comment
async function handleCreateComment(event) {
    event.preventDefault();
    
    if (!currentUser) {
        showToast('Please login to comment', 'warning');
        return;
    }
    
    if (!currentForumId) {
        showToast('No forum selected', 'error');
        return;
    }
    
    const content = document.getElementById('commentContent').value.trim();
    
    if (!content) {
        showToast('Please enter a comment', 'warning');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`/api/forums/${currentForumId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create comment');
        }
        
        document.getElementById('commentContent').value = '';
        showToast('Comment added successfully', 'success');
        
        // Reload comments
        const commentsResponse = await fetch(`/api/forums/${currentForumId}/comments`);
        if (!commentsResponse.ok) {
            throw new Error('Failed to load comments');
        }
        
        const comments = await commentsResponse.json();
        renderComments(comments);
    } catch (error) {
        console.error('Error creating comment:', error);
        showToast('Failed to add comment', 'error');
    } finally {
        hideLoading();
    }
}

// Open the edit forum modal
function openEditForumModal(forum) {
    if (!currentUser) {
        showToast('Please login to edit a discussion', 'warning');
        return;
    }
    
    document.getElementById('editForumTitle').value = forum.title;
    document.getElementById('editForumSummary').value = forum.summary || '';
    document.getElementById('editForumContent').value = forum.content;
    document.getElementById('editForumCategory').value = forum.category;
    document.getElementById('editForumId').value = forum.id;
    
    // Set markdown toggle based on forum's markdown flag
    const markdownToggle = document.getElementById('editMarkdownToggle');
    
    // Explicitly check if the markdown property exists and is true
    // This ensures backward compatibility with forums created before the markdown column was added
    markdownToggle.checked = forum.markdown === true;
    
    console.log('Forum markdown setting:', forum.markdown, 'Toggle checked:', markdownToggle.checked);
    
    // Show/hide markdown toolbar based on toggle state
    const toolbar = document.getElementById('editMarkdownToolbar');
    const markdownPreview = document.getElementById('editMarkdownPreview');
    const previewContainer = markdownPreview ? markdownPreview.closest('.markdown-preview-container') : null;
    
    if (markdownToggle.checked) {
        toolbar.classList.add('active');
        toolbar.style.display = 'block';
        // Update the preview if markdown is enabled
        updateMarkdownPreview('editForumContent', 'editMarkdownPreview');
        
        // Show the preview and its container
        if (markdownPreview) {
            markdownPreview.classList.add('active');
            markdownPreview.style.display = 'block';
        }
        if (previewContainer) {
            previewContainer.style.display = 'block';
        }
    } else {
        toolbar.classList.remove('active');
        toolbar.style.display = 'none';
        
        // Hide the preview and its container
        if (markdownPreview) {
            markdownPreview.classList.remove('active');
            markdownPreview.style.display = 'none';
        }
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
    }
    
    // Update author display
    if (forum.author) {
        document.getElementById('editForumAuthor').innerHTML = `<i class="fas fa-user"></i> ${escapeHtml(forum.author.username)}`;
    }
    
    // Update category badge
    updateCategoryDisplay(document.getElementById('editForumCategory'), 'editCategoryBadge');
    
    document.getElementById('editForumModal').style.display = 'block';
}

// Handle editing a forum
async function handleEditForum(event) {
    event.preventDefault();
    
    try {
        showLoading();
        
        const forumId = document.getElementById('editForumId').value;
        const title = document.getElementById('editForumTitle').value;
        const summary = document.getElementById('editForumSummary').value;
        const content = document.getElementById('editForumContent').value;
        const category = document.getElementById('editForumCategory').value;
        const useMarkdown = document.getElementById('editMarkdownToggle').checked;
        
        if (!title || !content || !category) {
            showToast('Please fill all required fields', 'error');
            return;
        }
        
        const forumData = {
            title: title,
            summary: summary,
            content: content,
            category: category,
            markdown: useMarkdown
        };
        
        console.log('Updating forum data with summary:', forumData);
        
        const response = await fetch(`/api/forums/${forumId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(forumData),
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to update forum');
        }
        
        const result = await response.json();
        console.log('Updated forum response:', result);
        
        // Close modal
        document.getElementById('editForumModal').style.display = 'none';
        
        // Refresh the forum view
        await viewForum(forumId);
        
        showToast('Forum updated successfully', 'success');
    } catch (error) {
        console.error('Error updating forum:', error);
        showToast('Failed to update forum', 'error');
    } finally {
        hideLoading();
    }
}

// Confirm and delete a forum
function confirmDeleteForum(forumId) {
    if (confirm('Are you sure you want to delete this discussion? This action cannot be undone.')) {
        deleteForum(forumId);
    }
}

// Delete a forum
async function deleteForum(forumId) {
    if (!currentUser) {
        showToast('Please login to delete a discussion', 'warning');
        return;
    }
    
    try {
        showLoading();
        console.log(`Attempting to delete forum ${forumId}`);
        
        const response = await fetch(`/api/forums/${forumId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        
        const responseText = await response.text();
        console.log(`Delete forum response status: ${response.status}, body:`, responseText);
        
        if (!response.ok) {
            let errorMessage = 'Failed to delete discussion';
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                console.error('Error parsing error response:', e);
            }
            
            throw new Error(errorMessage);
        }
        
        showToast('Discussion deleted successfully', 'success');
        
        // Go back to forum list
        showForumList();
        await loadForums();
    } catch (error) {
        console.error('Error deleting forum:', error);
        showToast(error.message || 'Failed to delete discussion', 'error');
    } finally {
        hideLoading();
    }
}

// Show the forum list, hide the forum view
function showForumList() {
    document.getElementById('forumListSection').style.display = 'block';
    document.getElementById('forumViewSection').style.display = 'none';
    currentForumId = null;
    
    // Refresh the forum list to see any updates
    loadForums(document.getElementById('categoryFilter').value, document.getElementById('forumSearch').value);
}

// Helper functions
function getCategoryName(category) {
    const categories = {
        'announcements': 'Announcements',
        'discussion': 'Discussion',
        'suggestions': 'Suggestions',
        'help': 'Help & Support',
        'offtopic': 'Off-Topic'
    };
    
    return categories[category] || category;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Setup database functions and schema
async function setupDatabase() {
    try {
        // Run general database setup
        const response = await fetch('/api/setup-database', {
            method: 'POST'
        });
        
        if (!response.ok) {
            console.warn('Database setup may not be complete');
        } else {
            console.log('Database setup complete');
        }
        
        // Add markdown column specifically
        const markdownMigrationResponse = await fetch('/api/migrations/add-markdown-column', {
            method: 'POST'
        });
        
        if (!markdownMigrationResponse.ok) {
            console.warn('Markdown column migration may not be complete');
        } else {
            console.log('Markdown column added successfully');
        }
        
        // Add summary column
        const summaryMigrationResponse = await fetch('/api/migrations/add-summary-column', {
            method: 'POST'
        });
        
        if (!summaryMigrationResponse.ok) {
            console.warn('Summary column migration may not be complete');
        } else {
            console.log('Summary column added successfully');
        }
    } catch (error) {
        console.error('Error during database setup:', error);
    }
}

// Force display owner controls if owner (call after render)
function forceDisplayOwnerControls() {
    // For forum posts - check both attributes and username
    const forumContent = document.getElementById('forumContent');
    const forumAuthorEl = document.getElementById('forumAuthor');
    const forumUsername = forumAuthorEl ? forumAuthorEl.textContent.replace(/^.* /g, '').trim() : '';
    
    // Check forum ownership - either by ID or by username
    const isOwnerById = forumContent && forumContent.getAttribute('data-is-owner') === 'true';
    const isOwnerByUsername = currentUser && forumUsername === currentUser.username;
    
    if (forumContent && (isOwnerById || isOwnerByUsername)) {
        console.log('Checking forum owner controls', { 
            isOwnerById, 
            isOwnerByUsername,
            forumUsername, 
            currentUsername: currentUser?.username 
        });
        
        // Only add to top actions if buttons don't already exist
        const actionsTop = document.getElementById('forumActions');
        const actionsRight = actionsTop.querySelector('.forum-actions-right');
        if (actionsTop && actionsRight && !actionsRight.querySelector('.forum-action-btn')) {
            const forumId = currentForumId;
            const forumUserIdStr = forumContent.getAttribute('data-forum-user-id');
            
            const editButton = document.createElement('button');
            editButton.className = 'universal-btn secondary forum-action-btn';
            editButton.innerHTML = '<i class="fas fa-edit"></i> Edit Forum';
            editButton.addEventListener('click', () => {
                console.log('Edit forum button clicked:', forumId);
                // Create minimal forum object with required properties
                const forum = {
                    id: forumId,
                    user_id: forumUserIdStr,
                    title: document.getElementById('forumTitle').textContent,
                    content: forumContent.textContent,
                    category: 'discussion' // Default if not available
                };
                openEditForumModal(forum);
            });
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'universal-btn danger forum-action-btn';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete Forum';
            deleteButton.addEventListener('click', () => {
                console.log('Delete forum button clicked:', forumId);
                confirmDeleteForum(forumId);
            });
            
            actionsRight.appendChild(editButton);
            actionsRight.appendChild(deleteButton);
        }
    }
    
    // For comments - add edit and delete buttons
    document.querySelectorAll('.comment').forEach(comment => {
        const commentId = comment.dataset.commentId;
        const commentActions = comment.querySelector('.comment-actions');
        const commentAuthorEl = comment.querySelector('.comment-author');
        const commentUsername = commentAuthorEl ? commentAuthorEl.querySelector('.username').textContent.trim() : '';
        
        // Check comment ownership - either by ID or by username
        const isOwnerById = comment.getAttribute('data-is-owner') === 'true';
        const isOwnerByUsername = currentUser && commentUsername === currentUser.username;
        
        if (commentActions && (isOwnerById || isOwnerByUsername)) {
            // Add edit button if it doesn't exist
            if (!commentActions.querySelector('.edit-comment-btn')) {
                console.log('FORCING DISPLAY: Comment edit button for comment', commentId, {
                    isOwnerById,
                    isOwnerByUsername,
                    commentUsername,
                    currentUsername: currentUser?.username
                });
                
                const editButton = document.createElement('button');
                editButton.className = 'edit-comment-btn';
                editButton.dataset.commentId = commentId;
                editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
                editButton.addEventListener('click', () => {
                    console.log(`Edit button clicked for comment ${commentId} (forced)`);
                    toggleEditForm(commentId);
                });
                
                commentActions.appendChild(editButton);
            }
            
            // Add delete button if it doesn't exist
            if (!commentActions.querySelector('.delete-comment-btn')) {
                console.log('FORCING DISPLAY: Comment delete button for comment', commentId);
                
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-comment-btn';
                deleteButton.dataset.commentId = commentId;
                deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete';
                deleteButton.addEventListener('click', () => {
                    console.log(`Delete button clicked for comment ${commentId} (forced)`);
                    confirmDeleteComment(commentId);
                });
                
                commentActions.appendChild(deleteButton);
            }
        }
    });
}

// Loading functions
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('active');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
    }
}

// Toast notification function
function showToast(message, type = 'info') {
    // Get or create toast container
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Set icon based on type
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    // Create the toast structure with proper elements
    const iconElement = document.createElement('i');
    iconElement.className = `fas ${icon}`;
    toast.appendChild(iconElement);
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    messageSpan.style.flex = '1';
    toast.appendChild(messageSpan);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'toast-close';
    closeBtn.addEventListener('click', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
    toast.appendChild(closeBtn);
    
    toastContainer.appendChild(toast);
    
    // Show the toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Hide after a delay (unless manually closed)
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Confirm deletion of a comment
function confirmDeleteComment(commentId) {
    if (confirm('Are you sure you want to delete this comment?')) {
        deleteComment(commentId);
    }
}

// Delete a comment
async function deleteComment(commentId) {
    console.log(`deleteComment called for comment ${commentId}`);
    if (!currentUser) {
        showToast('Please login to delete a comment', 'warning');
        return;
    }
    
    if (!currentForumId) {
        showToast('No forum selected', 'error');
        return;
    }
    
    try {
        showLoading();
        console.log(`Deleting comment ${commentId} from forum ${currentForumId}`);
        
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                forum_id: currentForumId
            })
        });
        
        console.log(`Delete comment response status: ${response.status}`);
        
        let errorMessage = 'Failed to delete comment';
        try {
            const data = await response.json();
            if (!response.ok) {
                errorMessage = data.error || errorMessage;
                throw new Error(errorMessage);
            }
            
            // Remove the comment from the DOM
            const commentEl = document.querySelector(`.comment[data-comment-id="${commentId}"]`);
            if (commentEl) {
                commentEl.remove();
                console.log(`Removed comment ${commentId} from DOM`);
            } else {
                // Reload comments if we can't find the element
                await reloadComments();
            }
            
            showToast('Comment deleted successfully', 'success');
        } catch (parseError) {
            console.error('Error parsing response:', parseError);
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        showToast(error.message || 'Failed to delete comment', 'error');
    } finally {
        hideLoading();
    }
}

// Helper to reload comments
async function reloadComments() {
    if (currentForumId) {
        try {
            const commentsResponse = await fetch(`/api/forums/${currentForumId}/comments`);
            if (commentsResponse.ok) {
                const comments = await commentsResponse.json();
                renderComments(comments);
                console.log('Reloaded all comments');
                return true;
            }
        } catch (error) {
            console.error('Error reloading comments:', error);
        }
    }
    return false;
}

// Update the category badge display based on the selected category
function updateCategoryDisplay(selectElement, badgeId) {
    const categoryBadge = document.getElementById(badgeId);
    if (!categoryBadge) return;
    
    const selectedValue = selectElement.value;
    if (!selectedValue) {
        categoryBadge.textContent = '';
        categoryBadge.className = 'forum-category';
        return;
    }
    
    // Clear any existing classes except forum-category
    categoryBadge.className = 'forum-category';
    // Add the selected category as a class
    categoryBadge.classList.add(selectedValue);
    
    // Set the text based on the selected option's text
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    categoryBadge.textContent = selectedOption.textContent;
}

// Toggle edit form visibility
function toggleEditForm(commentId, show = true) {
    const editForm = document.getElementById(`editForm-${commentId}`);
    if (editForm) {
        editForm.style.display = show ? 'block' : 'none';
        
        // Hide the comment content and actions when editing
        const commentEl = document.querySelector(`.comment[data-comment-id="${commentId}"]`);
        if (commentEl) {
            const content = commentEl.querySelector('.comment-content');
            const actions = commentEl.querySelector('.comment-actions');
            
            if (content) content.style.display = show ? 'none' : 'block';
            if (actions) actions.style.display = show ? 'none' : 'flex';
            
            if (show) {
                editForm.querySelector('textarea').focus();
            }
        }
    }
}

// Submit edited comment
async function submitEditComment(commentId) {
    console.log(`submitEditComment called for comment ${commentId}`);
    if (!currentUser) {
        showToast('Please login to edit a comment', 'warning');
        return;
    }
    
    if (!currentForumId) {
        showToast('No forum selected', 'error');
        return;
    }
    
    const editForm = document.getElementById(`editForm-${commentId}`);
    if (!editForm) return;
    
    const textarea = editForm.querySelector('.edit-textarea');
    if (!textarea) return;
    
    const content = textarea.value.trim();
    
    if (!content) {
        showToast('Comment cannot be empty', 'warning');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ 
                content,
                forum_id: currentForumId
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update comment');
        }
        
        // Hide the edit form
        toggleEditForm(commentId, false);
        
        showToast('Comment updated successfully', 'success');
        
        // Reload comments to refresh the UI
        await reloadComments();
    } catch (error) {
        console.error('Error updating comment:', error);
        showToast(error.message || 'Failed to update comment', 'error');
    } finally {
        hideLoading();
    }
}

// Run the migration to add the markdown column to the forums table
async function addMarkdownColumn() {
    try {
        showLoading();
        const response = await fetch('/api/migrations/add-markdown-column', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to run migration');
        }
        
        const result = await response.json();
        showToast('Markdown column added successfully', 'success');
        
        // Refresh the page to apply changes
        window.location.reload();
    } catch (error) {
        console.error('Error running migration:', error);
        showToast('Failed to run migration', 'error');
    } finally {
        hideLoading();
    }
}

// Strip markdown formatting for preview text
function stripMarkdown(text) {
    if (!text) return '';
    
    // Escape HTML first
    let stripped = escapeHtml(text);
    
    // Handle alignment divs
    stripped = stripped.replace(/<div data-alignment="(left|center|right)">\n([\s\S]*?)\n<\/div>/g, '$2');
    
    // Remove common markdown syntax
    stripped = stripped
        // Headers
        .replace(/#{1,6}\s+/g, '')
        // Bold
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        // Italic
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        // Underline
        .replace(/\+\+([^+]+)\+\+/g, '$1')
        // Links
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        // Lists
        .replace(/^[\*\-]\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '')
        // Code blocks
        .replace(/```.*?\n([\s\S]*?)```/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        // Images
        .replace(/!\[(.*?)\]\(.*?(?:\s+width=\d+%?)?\)/g, '[Image: $1]')
        // Horizontal lines
        .replace(/^---+$/gm, '-------------');
    
    return stripped;
}

// Initialize code highlighting and collapsible blocks for forum view
function initForumView() {
    // Apply syntax highlighting and collapsible code blocks
    applyCodeHighlighting();
}

// Run the migration to add the summary column to the forums table
async function addSummaryColumn() {
    try {
        showLoading();
        const response = await fetch('/api/migrations/add-summary-column', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to run migration');
        }
        
        const result = await response.json();
        showToast('Summary column added successfully', 'success');
        
        // Refresh the page to apply changes
        window.location.reload();
    } catch (error) {
        console.error('Error running migration:', error);
        showToast('Failed to run migration', 'error');
    } finally {
        hideLoading();
    }
}

// Diagnostic function to verify summary field is working with Supabase
async function testSummaryField() {
    try {
        showLoading();
        
        // Step 1: Create a test forum post with a summary
        const testForumData = {
            title: "Summary Test - " + new Date().toISOString(),
            summary: "This is a test summary field - " + new Date().toISOString(),
            content: "This is test content to verify the summary field is working correctly.",
            category: "discussion",
            markdown: false
        };
        
        console.log('Creating test forum with summary:', testForumData);
        
        // Create the forum
        const createResponse = await fetch('/api/forums', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testForumData),
            credentials: 'include'
        });
        
        if (!createResponse.ok) {
            throw new Error('Failed to create test forum');
        }
        
        const createResult = await createResponse.json();
        console.log('Test forum created:', createResult);
        const testForumId = createResult.id;
        
        // Step 2: Retrieve the forum to check if summary was saved
        const getResponse = await fetch(`/api/forums/${testForumId}`);
        
        if (!getResponse.ok) {
            throw new Error('Failed to fetch test forum');
        }
        
        const forum = await getResponse.json();
        console.log('Retrieved test forum:', forum);
        
        // Check if the summary was saved correctly
        const summaryMatches = forum.summary === testForumData.summary;
        console.log(`Summary field test - SAVE: ${summaryMatches ? 'PASS' : 'FAIL'}`);
        console.log(`Expected: "${testForumData.summary}"`);
        console.log(`Actual: "${forum.summary}"`);
        
        // Step 3: Update the forum with a new summary
        const updatedSummary = "Updated summary - " + new Date().toISOString();
        const updateData = {
            ...forum,
            summary: updatedSummary
        };
        
        console.log('Updating test forum with new summary:', updatedSummary);
        
        const updateResponse = await fetch(`/api/forums/${testForumId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData),
            credentials: 'include'
        });
        
        if (!updateResponse.ok) {
            throw new Error('Failed to update test forum');
        }
        
        // Step 4: Retrieve the updated forum
        const getUpdatedResponse = await fetch(`/api/forums/${testForumId}`);
        
        if (!getUpdatedResponse.ok) {
            throw new Error('Failed to fetch updated test forum');
        }
        
        const updatedForum = await getUpdatedResponse.json();
        console.log('Retrieved updated test forum:', updatedForum);
        
        // Check if the summary was updated correctly
        const updateMatches = updatedForum.summary === updatedSummary;
        console.log(`Summary field test - UPDATE: ${updateMatches ? 'PASS' : 'FAIL'}`);
        console.log(`Expected: "${updatedSummary}"`);
        console.log(`Actual: "${updatedForum.summary}"`);
        
        // Step 5: Clean up by deleting the test forum
        const deleteResponse = await fetch(`/api/forums/${testForumId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!deleteResponse.ok) {
            console.warn('Could not delete test forum:', testForumId);
        } else {
            console.log('Test forum deleted successfully');
        }
        
        // Show test results
        if (summaryMatches && updateMatches) {
            showToast('Summary field test: PASSED', 'success');
        } else {
            showToast('Summary field test: FAILED', 'error');
        }
        
        return {
            createSuccess: true,
            readSuccess: summaryMatches,
            updateSuccess: updateMatches,
            deleteSuccess: deleteResponse.ok
        };
    } catch (error) {
        console.error('Error testing summary field:', error);
        showToast('Summary field test: ERROR', 'error');
        return { success: false, error: error.message };
    } finally {
        hideLoading();
    }
}

// Make function available globally for testing from console
window.testSummaryField = testSummaryField;