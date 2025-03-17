// Initialize home page functionality
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

    // Get the featured ranks container
    const featuredRanksContainer = document.querySelector('.home-rank-grid');
    if (!featuredRanksContainer) return;

    // Clear existing content
    featuredRanksContainer.innerHTML = '';

    // Add each rank card
    featuredRanks.forEach(rank => {
        const rankCard = document.createElement('div');
        rankCard.className = `rank-card ${formatClassName(rank.name)}`;

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
                    ${rank.features.map(feature => `
                        <li><i class="fas fa-check"></i> ${feature}</li>
                    `).join('')}
                </ul>
                <button class="btn btn-primary" onclick="window.location.href='/shop.html'">Purchase</button>
            </div>
        `;

        featuredRanksContainer.appendChild(rankCard);
    });
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
    const avatarPreview = document.getElementById('avatarPreview');
    const previewControls = document.getElementById('previewControls');
    const previewRankSelect = document.getElementById('previewRankSelect');
    
    if (!avatarPreview) return;
    
    // Check if user is logged in and has a linked Minecraft account
    checkLinkedMinecraftAccount();
    
    // Setup rank preview selector
    if (previewRankSelect) {
        previewRankSelect.addEventListener('change', function() {
            updateAvatarPreview(this.value);
        });
    }
}

// Check if the user has a linked Minecraft account
async function checkLinkedMinecraftAccount() {
    const avatarPreview = document.getElementById('avatarPreview');
    const linkAccountBtn = document.getElementById('linkAccountBtn');
    const previewControls = document.getElementById('previewControls');
    const linkInfo = document.querySelector('.link-info');
    
    try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
            const user = await response.json();
            
            if (user && user.minecraft_username) {
                // User has a linked Minecraft account
                if (linkInfo) linkInfo.style.display = 'none';
                if (linkAccountBtn) linkAccountBtn.style.display = 'none';
                if (previewControls) previewControls.style.display = 'block';
                
                // Show the user's Minecraft avatar
                showMinecraftAvatar(user.minecraft_username);
            } else {
                // User is logged in but doesn't have a linked Minecraft account
                if (linkInfo) {
                    linkInfo.textContent = 'Link your Minecraft account in your profile settings to see your avatar here.';
                    linkInfo.style.display = 'block';
                }
                
                if (linkAccountBtn) {
                    linkAccountBtn.textContent = 'Link Minecraft Account';
                    linkAccountBtn.style.display = 'flex';
                    linkAccountBtn.onclick = () => window.location.href = '/profile.html';
                }
                
                if (previewControls) previewControls.style.display = 'none';
            }
        } else {
            // User is not logged in
            if (linkInfo) {
                linkInfo.textContent = 'Login with Discord to view and customize your Minecraft avatar.';
                linkInfo.style.display = 'block';
            }
            
            if (linkAccountBtn) {
                linkAccountBtn.innerHTML = '<i class="fab fa-discord"></i> Login with Discord';
                linkAccountBtn.style.display = 'flex';
                linkAccountBtn.onclick = () => window.location.href = '/api/auth/discord';
            }
            
            if (previewControls) previewControls.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking linked Minecraft account:', error);
    }
}

// Show the user's Minecraft avatar
function showMinecraftAvatar(username = 'MHF_Steve') {
    const avatarPreview = document.getElementById('avatarPreview');
    if (!avatarPreview) return;
    
    // Clear existing content
    avatarPreview.innerHTML = '';
    
    // Create avatar image
    const avatarImg = document.createElement('img');
    avatarImg.id = 'avatarImage';
    avatarImg.src = `https://mc-heads.net/body/${username}/100`;
    avatarImg.alt = `${username}'s Minecraft Avatar`;
    
    // Add to preview
    avatarPreview.appendChild(avatarImg);
    
    // Set initial rank preview
    const previewRankSelect = document.getElementById('previewRankSelect');
    if (previewRankSelect) {
        updateAvatarPreview(previewRankSelect.value);
    }
}

// Update avatar preview with selected rank
function updateAvatarPreview(rankId) {
    const avatarImg = document.getElementById('avatarImage');
    if (!avatarImg) return;
    
    // Remove all existing rank classes
    avatarImg.className = '';
    
    // Add the selected rank class if not 'none'
    if (rankId && rankId !== 'none') {
        avatarImg.classList.add(`rank-${rankId}`);
    }
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
    const sidebar = document.querySelector('.avatar-preview-section');
    const shopContent = document.querySelector('.shop-content');
    const firstTabBar = document.querySelector('.shop-content .tab-bar:first-child');
    const lastTabBar = document.querySelector('.shop-content .tab-bar:last-child');
    
    if (!sidebar || !shopContent || !firstTabBar || !lastTabBar) {
        console.error('Missing required elements for sidebar scroll behavior');
        return;
    }
    
    // Store the last scroll position to prevent unnecessary updates
    let lastScrollY = window.scrollY;
    let ticking = false;
    
    // Function to ensure elements are loaded before positioning
    function ensureInitialPosition() {
        // Force an immediate position update
        updateSidebarPosition();
        
        // Wait a short moment for any dynamic content to settle
        setTimeout(updateSidebarPosition, 100);
        
        // Also update when all resources are loaded
        if (document.readyState === 'complete') {
            updateSidebarPosition();
        } else {
            window.addEventListener('load', updateSidebarPosition);
        }
    }
    
    // Call initial position setup
    ensureInitialPosition();
    
    // Update on scroll with throttling
    window.addEventListener('scroll', () => {
        lastScrollY = window.scrollY;
        if (!ticking) {
            requestAnimationFrame(() => {
                updateSidebarPosition();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Update on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateSidebarPosition();
        }, 100);
    });
    
    function updateSidebarPosition() {
        const sidebar = document.querySelector('.avatar-preview-section');
        const shopContent = document.querySelector('.shop-content');
        const firstTabBar = document.querySelector('.shop-content .tab-bar:first-child');
        const lastTabBar = document.querySelector('.shop-content .tab-bar:last-child');
        const paymentGoal = document.querySelector('.server-payment-goal');
        
        if (!sidebar || !shopContent || !firstTabBar || !lastTabBar) return;
        
        // If on mobile, don't apply fixed positioning
        if (window.innerWidth <= 1024) {
            sidebar.style.position = 'static';
            sidebar.style.width = '100%';
            sidebar.style.maxWidth = '320px';
            sidebar.style.margin = '0 auto';
            return;
        }
        
        // Get the dimensions
        const firstTabBarRect = firstTabBar.getBoundingClientRect();
        const lastTabBarRect = lastTabBar.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const paymentGoalRect = paymentGoal ? paymentGoal.getBoundingClientRect() : lastTabBarRect;
        
        // If the sidebar is taller than the viewport, don't apply fixed positioning
        if (sidebarRect.height > viewportHeight - 20) {
            sidebar.style.position = 'static';
            sidebar.style.width = '100%';
            sidebar.style.maxWidth = '280px';
            sidebar.style.margin = '0 auto';
            return;
        }
        
        // Reset to fixed positioning
        sidebar.style.position = 'fixed';
        sidebar.style.width = '280px';
        sidebar.style.margin = '0';
        
        // Set minimum top position
        const minTopPosition = 80;
        
        // Calculate the bottom boundary including the payment goal section
        const gridBottom = Math.min(paymentGoalRect.bottom, lastTabBarRect.bottom);
        const gridTop = firstTabBarRect.top;
        
        // Calculate position
        let topPosition;
        
        // If we're scrolled to or past the grid's bottom
        if (gridBottom <= viewportHeight) {
            // Lock to grid bottom
            topPosition = gridBottom - sidebarRect.height;
        }
        // If we're at the top of the grid
        else if (gridTop >= minTopPosition) {
            topPosition = gridTop;
        }
        // Default position while scrolling within the grid
        else {
            topPosition = minTopPosition;
        }
        
        // Ensure position stays within grid bounds
        const maxTopPosition = gridBottom - sidebarRect.height;
        topPosition = Math.min(topPosition, maxTopPosition);
        topPosition = Math.max(minTopPosition, topPosition);
        
        // Apply the position
        sidebar.style.top = `${Math.round(topPosition)}px`;
        
        // Adjust right position based on layout width
        if (window.innerWidth > 1400) {
            sidebar.style.right = `calc((100% - 1400px) / 2 + var(--spacing-md))`;
        } else {
            sidebar.style.right = 'var(--spacing-md)';
        }
    }
} 