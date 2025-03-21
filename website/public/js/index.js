document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize any home page functionality here
        console.log('Home page initialized');
        
        // Setup copy IP button
        setupCopyIpButton();
        
        // Load featured ranks
        loadFeaturedRanks();

        // Setup avatar preview
        setupAvatarPreview();
        
        // Update payment goal
        updatePaymentGoal();
        
        // Setup sidebar scroll behavior
        setupSidebarScroll();
        
        // Adjust grid spacing on the home page
        adjustHomePageGridSpacing();
    } catch (error) {
        console.error('Error initializing home page:', error);
    }
});

// Setup copy IP button functionality
function setupCopyIpButton() {
    const copyIpBtn = document.getElementById('copyIpBtn');
    if (copyIpBtn) {
        copyIpBtn.addEventListener('click', () => {
            const serverIp = 'play.enderfall.com';
            
            // Copy to clipboard
            navigator.clipboard.writeText(serverIp)
                .then(() => {
                    // Show success message
                    const originalText = copyIpBtn.textContent;
                    copyIpBtn.textContent = 'IP Copied!';
                    copyIpBtn.classList.add('copied');
                    
                    // Reset button text after 2 seconds
                    setTimeout(() => {
                        copyIpBtn.textContent = originalText;
                        copyIpBtn.classList.remove('copied');
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy IP: ', err);
                    
                    // Fallback for browsers that don't support clipboard API
                    fallbackCopyTextToClipboard(serverIp);
                });
        });
    }
}

// Load featured ranks from the same data source as the shop
function loadFeaturedRanks() {
    // Featured ranks data (same as in tab-bar.js)
    const featuredRanks = [
        // First serverwide rank
        {
            name: 'Shadow Enchanter',
            price: 9.99,
            icon: 'fa-hat-wizard',
            features: [
                'Access to /fly command',
                '3 /sethome locations',
                'Colored chat messages',
                'Special chat prefix'
            ],
            category: 'Serverwide',
            position: 'Starter'
        },
        // Last serverwide rank
        {
            name: 'Astral Guardian',
            price: 39.99,
            icon: 'fa-sun',
            features: [
                'All Ethereal Warden features',
                'Access to /nick',
                '10 /sethome locations',
                'Custom particle trails'
            ],
            category: 'Serverwide',
            position: 'Ultimate'
        },
        // First towny rank
        {
            name: 'Citizen',
            price: 4.99,
            icon: 'fa-user',
            features: [
                'Create and join towns',
                'Basic town permissions',
                'Town chat access',
                'Town spawn access'
            ],
            category: 'Towny',
            position: 'Starter'
        },
        // Last towny rank
        {
            name: 'Divine Ruler',
            price: 44.99,
            icon: 'fa-crown',
            features: [
                'All King features',
                'Divine powers',
                'Custom events',
                'Ultimate perks'
            ],
            category: 'Towny',
            position: 'Ultimate'
        }
    ];

    // Get the container element
    const featuredRanksContainer = document.querySelector('.rank-grid.home-rank-grid');
    if (!featuredRanksContainer) return;
    
    // Clear the container
    featuredRanksContainer.innerHTML = '';
    
    // Check if on mobile
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        featuredRanksContainer.classList.add('rank-grid-mobile');
    }
    
    // Add each rank card
    featuredRanks.forEach(rank => {
        const rankCard = document.createElement('div');
        rankCard.className = `rank-card ${formatClassName(rank.name)}`;

        // Create mobile-optimized layout for features
        const featuresList = rank.features.map(feature => {
            const iconClass = getFeatureIcon(feature);
            return `<li><i class="fas ${iconClass}"></i> <span class="feature-text">${feature}</span></li>`;
        }).join('');

        rankCard.innerHTML = `
            <div class="rank-header">
                <i class="fas ${rank.icon}"></i>
                <h3>${rank.name}</h3>
                <div class="rank-price">£${rank.price.toFixed(2)}</div>
            </div>
            <div class="rank-info">
                <div class="rank-category">${rank.category} Rank</div>
                <div class="rank-position">${rank.position} Tier</div>
                <ul class="rank-features">
                    ${featuresList}
                </ul>
                <button class="universal-btn secondary" onclick="window.location.href='/shop.html'">Purchase</button>
            </div>
        `;

        featuredRanksContainer.appendChild(rankCard);
    });
    
    // Add feature tooltips for mobile
    if (isMobile) {
        const featureItems = featuredRanksContainer.querySelectorAll('.rank-features li');
        featureItems.forEach(item => {
            item.addEventListener('click', function() {
                // Remove active class from all items
                featureItems.forEach(i => i.classList.remove('active'));
                // Add active class to clicked item
                this.classList.add('active');
            });
        });
    }
    
    // Add resize listener for responsive adjustments
    window.addEventListener('resize', () => {
        const isMobileNow = window.innerWidth <= 768;
        if (isMobileNow) {
            featuredRanksContainer.classList.add('rank-grid-mobile');
        } else {
            featuredRanksContainer.classList.remove('rank-grid-mobile');
        }
    });
    
    // Dispatch event to notify that ranks have been loaded
    document.dispatchEvent(new CustomEvent('ranksLoaded'));
}

// Helper function to format class names
function formatClassName(name) {
    return name.toLowerCase().replace(/\s+/g, '-');
}

// Fallback copy to clipboard method for older browsers
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea out of viewport
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        const copyIpBtn = document.getElementById('copyIpBtn');
        
        if (successful && copyIpBtn) {
            const originalText = copyIpBtn.textContent;
            copyIpBtn.textContent = 'IP Copied!';
            copyIpBtn.classList.add('copied');
            
            // Reset button text after 2 seconds
            setTimeout(() => {
                copyIpBtn.textContent = originalText;
                copyIpBtn.classList.remove('copied');
            }, 2000);
        }
    } catch (err) {
        console.error('Fallback: Could not copy text: ', err);
    }
    
    document.body.removeChild(textArea);
}

// Setup avatar preview functionality
function setupAvatarPreview() {
    const linkAccountBtn = document.getElementById('linkAccountBtn');
    const previewControls = document.getElementById('previewControls');
    const previewRankSelect = document.getElementById('previewRankSelect');
    const avatarPreview = document.getElementById('avatarPreview');
    const linkInfo = document.querySelector('.link-info');
    const avatarPlaceholder = document.querySelector('.avatar-placeholder');

    console.log('Setting up avatar preview');

    if (!avatarPreview) return;

    // Initialize the rank select dropdown
    if (previewRankSelect) {
        // Preview rank select change handler
        previewRankSelect.addEventListener('change', (event) => {
            console.log('Rank select changed to:', event.target.value);
            updateAvatarPreview(event.target.value);
        });
    }

    // Wait a short delay to ensure auth state is initialized
    setTimeout(() => {
        // Check if user is logged out explicitly
        const loggedOut = localStorage.getItem('logged_out') === 'true';
        if (loggedOut) {
            // User is explicitly logged out, show login UI
            if (linkAccountBtn) {
                linkAccountBtn.style.display = 'flex';
                linkAccountBtn.innerHTML = '<i class="fab fa-discord"></i> Login with Discord';
                linkAccountBtn.onclick = () => window.location.href = '/api/auth/discord';
            }
            if (linkInfo) {
                linkInfo.textContent = 'Login with Discord to view and customize your Minecraft avatar.';
                linkInfo.style.display = 'block';
            }
            if (previewControls) previewControls.style.display = 'none';
            return;
        }

        // Check if we have a user menu (indicating logged in state)
        const userMenu = document.querySelector('.user-menu');
        const isUserMenuVisible = userMenu && 
            (window.getComputedStyle(userMenu).display !== 'none' ||
             userMenu.offsetParent !== null);

        if (isUserMenuVisible) {
            // User is logged in, fetch their data from the API
            fetch('/api/user')
                .then(response => response.json())
                .then(userData => {
                    if (userData.minecraft_username) {
                        // User has a linked Minecraft account, show the avatar
                        showMinecraftAvatar(userData.minecraft_username);
                        if (previewControls) previewControls.style.display = 'block';
                        if (linkAccountBtn) linkAccountBtn.style.display = 'none';
                        if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
                        if (linkInfo) linkInfo.style.display = 'none';
                    } else {
                        // User is logged in but doesn't have a linked Minecraft account
                        if (linkAccountBtn) {
                            linkAccountBtn.style.display = 'flex';
                            linkAccountBtn.innerHTML = '<i class="fas fa-link"></i> Link Minecraft Account';
                            linkAccountBtn.onclick = () => {
                                window.location.href = '/profile.html?tab=settings&action=link-minecraft';
                            };
                        }
                        if (linkInfo) {
                            linkInfo.textContent = 'Link your Minecraft account in your profile settings to see your avatar here.';
                            linkInfo.style.display = 'block';
                        }
                        if (previewControls) previewControls.style.display = 'none';
                    }
                })
                .catch(error => {
                    console.error('Error fetching user data:', error);
                    // Show error state
                    if (linkAccountBtn) {
                        linkAccountBtn.style.display = 'flex';
                        linkAccountBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error Loading Data';
                    }
                    if (linkInfo) {
                        linkInfo.textContent = 'There was an error loading your profile data. Please try again later.';
                        linkInfo.style.display = 'block';
                    }
                    if (previewControls) previewControls.style.display = 'none';
                });
        } else {
            console.log('User appears to be logged out');
            // User is not logged in with Discord
            if (linkAccountBtn) {
                linkAccountBtn.style.display = 'flex';
                linkAccountBtn.innerHTML = '<i class="fab fa-discord"></i> Login with Discord';
                linkAccountBtn.onclick = () => window.location.href = '/api/auth/discord';
            }
            if (linkInfo) {
                linkInfo.textContent = 'Login with Discord to view and customize your Minecraft avatar.';
                linkInfo.style.display = 'block';
            }
            if (previewControls) previewControls.style.display = 'none';
        }
    }, 500); // Add delay to ensure DOM is fully loaded
}

// Show Minecraft avatar with the given username
function showMinecraftAvatar(username = 'MHF_Steve') {
    if (!username || username.trim() === '') {
        console.warn('No username provided for Minecraft avatar');
        username = 'MHF_Steve';
    }
    
    console.log('Showing Minecraft avatar for:', username);
    
    const avatarPreview = document.getElementById('avatarPreview');
    if (!avatarPreview) return;
    
    // Clear placeholder
    avatarPreview.innerHTML = '';
    
    // Create name tag
    const nameTag = document.createElement('div');
    nameTag.className = 'minecraft-nametag';
    nameTag.innerHTML = `<span class="username">${username}</span>`;
    nameTag.id = 'minecraftNameTag';
    
    // Create avatar image
    const img = document.createElement('img');
    img.src = `https://mc-heads.net/body/${username}`;
    img.alt = 'Minecraft Avatar';
    img.id = 'avatarImage';
    img.onerror = () => {
        // If the avatar fails to load, use a default avatar
        img.src = 'https://mc-heads.net/body/MHF_Steve';
    };
    
    avatarPreview.appendChild(nameTag);
    avatarPreview.appendChild(img);
    
    // Show the preview controls
    const previewControls = document.getElementById('previewControls');
    if (previewControls) {
        previewControls.style.display = 'block';
    }
    
    // Hide the placeholder and link info
    const avatarPlaceholder = document.querySelector('.avatar-placeholder');
    const linkInfo = document.querySelector('.link-info');
    if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
    if (linkInfo) linkInfo.style.display = 'none';
    
    // Hide the link account button
    const linkAccountBtn = document.getElementById('linkAccountBtn');
    if (linkAccountBtn) linkAccountBtn.style.display = 'none';
    
    // Get the current selected rank from the dropdown
    const previewRankSelect = document.getElementById('previewRankSelect');
    let selectedRank = 'none';
    if (previewRankSelect && previewRankSelect.value) {
        selectedRank = previewRankSelect.value;
    }
    
    // Initialize with the selected rank or no rank
    setTimeout(() => {
        updateAvatarPreview(selectedRank);
    }, 100);
    
    console.log('Minecraft avatar displayed for:', username);
}

// Update avatar preview with selected rank
function updateAvatarPreview(rankId) {
    const avatarImage = document.getElementById('avatarImage');
    const nameTag = document.getElementById('minecraftNameTag');
    if (!avatarImage || !nameTag) return;
    
    console.log('Updating avatar preview with rank:', rankId);
    
    // Get username from the name tag
    let username = 'MHF_Steve';
    if (nameTag && nameTag.querySelector('.username')) {
        username = nameTag.querySelector('.username').textContent;
    }
    
    // Remove all previous rank preview classes
    avatarImage.className = '';
    
    // Reset styles
    avatarImage.style.boxShadow = 'none';
    avatarImage.style.border = '2px solid rgba(255, 255, 255, 0.2)';
    avatarImage.style.borderRadius = 'var(--radius-md)';
    
    // Add a class to the avatar based on the rank
    if (rankId !== 'none') {
        // Apply the CSS class for the rank preview
        avatarImage.classList.add(`${rankId}-preview`);
        
        // Get rank colors for direct style application
        const rankColors = {
            'shadow-enchanter': 'var(--rank-shadow)',
            'void-walker': 'var(--rank-void)',
            'ethereal-warden': 'var(--rank-ethereal)',
            'astral-guardian': 'var(--rank-astral)',
            'citizen': 'var(--rank-citizen)',
            'merchant': 'var(--rank-merchant)',
            'councilor': 'var(--rank-councilor)',
            'mayor': 'var(--rank-mayor)',
            'governor': 'var(--rank-governor)',
            'noble': 'var(--rank-noble)',
            'duke': 'var(--rank-duke)',
            'king': 'var(--rank-king)',
            'divine-ruler': 'var(--rank-divine)'
        };
        
        // Apply styles directly to ensure they take effect
        const rankColor = rankColors[rankId];
        if (rankColor) {
            avatarImage.style.boxShadow = `0 0 15px 5px ${rankColor}`;
            avatarImage.style.border = `2px solid ${rankColor}`;
            avatarImage.style.borderRadius = '5px';
        }
    }
    
    // Update name tag with rank prefix
    if (nameTag) {
        if (rankId === 'none') {
            nameTag.innerHTML = `<span class="username">${username}</span>`;
        } else {
            // Get rank display name
            const rankDisplayNames = {
                'shadow-enchanter': 'Shadow',
                'void-walker': 'Void',
                'ethereal-warden': 'Ethereal',
                'astral-guardian': 'Astral',
                'citizen': 'Citizen',
                'merchant': 'Merchant',
                'councilor': 'Councilor',
                'mayor': 'Mayor',
                'governor': 'Governor',
                'noble': 'Noble',
                'duke': 'Duke',
                'king': 'King',
                'divine-ruler': 'Divine'
            };
            
            const rankName = rankDisplayNames[rankId] || rankId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            // Update name tag with rank prefix
            nameTag.innerHTML = `<span class="rank-prefix ${rankId}-prefix">[${rankName}]</span> <span class="username">${username}</span>`;
        }
    }
    
    // Update the dropdown to match the selected rank
    const previewRankSelect = document.getElementById('previewRankSelect');
    if (previewRankSelect && previewRankSelect.value !== rankId) {
        previewRankSelect.value = rankId;
    }
    
    console.log('Avatar preview updated with rank:', rankId);
}

// Update payment goal display
async function updatePaymentGoal() {
    try {
        // In a real implementation, this would fetch the current payment goal from the server
        // For now, we'll use a hardcoded value
        const response = await fetch('/api/payment-goal').catch(() => null);
        
        if (response && response.ok) {
            const data = await response.json();
            const progressFill = document.querySelector('.progress-fill');
            const progressText = document.querySelector('.progress-text');
            
            if (progressFill && progressText && data) {
                const percentage = Math.min(100, Math.max(0, data.percentage));
                progressFill.style.width = `${percentage}%`;
                progressText.textContent = `${percentage}% Complete`;
            }
        } else {
            // Use default values if API is not available
            console.log('Using default payment goal values');
        }
    } catch (error) {
        console.error('Error updating payment goal:', error);
        // Silently fail - the default values in HTML will be used
    }
}

// Setup sidebar scroll behavior
function setupSidebarScroll() {
    console.log('Setting up home page sidebar as static (non-scrolling)');
    
    const sidebar = document.querySelector('.avatar-preview-section');
    
    if (!sidebar) {
        console.error('Missing sidebar element for home page');
        return;
    }
    
    // Set sidebar to be static with appropriate styling
    sidebar.style.position = 'static'; // Static positioning so it scrolls with page
    sidebar.style.width = '100%'; // Full width of its container
    sidebar.style.maxWidth = '280px'; // Match the previous fixed width
    sidebar.style.margin = '0'; // No margin
    sidebar.style.marginTop = '24px'; // Add top margin to fix positioning
    sidebar.style.maxHeight = 'none'; // Remove max height restriction
    sidebar.style.overflowY = 'visible'; // Allow content to determine height
    
    // Remove any fixed positioning styles
    sidebar.style.top = 'auto';
    sidebar.style.right = 'auto';
    
    console.log('Home page sidebar set to static positioning');
}

// Adjust grid spacing on the home page to match the sidebar spacing
function adjustHomePageGridSpacing() {
    // Target all tab-bar sections on the home page
    const tabSections = document.querySelectorAll('.home-page .tab-bar');
    if (!tabSections || tabSections.length === 0) return;
    
    // Add margin to all sections except the first one to create consistent spacing
    for (let i = 1; i < tabSections.length; i++) {
        tabSections[i].style.marginTop = '0px';
    }
    
    // Set consistent gap for grids - using a smaller gap to match the image
    const grids = document.querySelectorAll('.home-page .grid');
    grids.forEach(grid => {
        grid.style.gap = '16px';
    });
    
    // Set gap for featured ranks grid
    const rankGrid = document.querySelector('.home-page .home-rank-grid');
    if (rankGrid) {
        rankGrid.style.gap = '16px';
    }
    
    console.log('Home page grid spacing adjusted');
} 