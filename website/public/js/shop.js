// Initialize shop functionality
document.addEventListener('DOMContentLoaded', async () => {
    showLoading();
    try {
        // Ensure cart is properly initialized and updated
        if (typeof cart !== 'undefined' && cart) {
            console.log('Shop page: Updating existing cart');
            cart.loadCart(); // Force reload from localStorage
            cart.updateCartUI(); // Update the UI
        } else {
            console.log('Shop page: Cart not available yet, waiting for it to initialize');
            // Will be handled by cart.js initialization
        }
        
        // Listen for the components-loaded event to update cart again
        document.addEventListener('components-loaded', () => {
            console.log('Components loaded, updating cart UI');
            if (typeof cart !== 'undefined' && cart) {
                setTimeout(() => cart.updateCartUI(), 300);
            }
        });
        
        // Initialize tab bar
        const tabBar = new TabBar('shopTabs', {
            defaultTab: 'serverwide',
            onTabChange: (tabId) => {
                console.log(`Tab changed to: ${tabId}`);
            }
        });

        // Setup modal handlers
        setupModalHandlers();
        
        // Update payment goal
        updatePaymentGoal();
        
        // Wait a short delay to ensure auth state is initialized
        setTimeout(() => {
            // Setup avatar preview
            setupAvatarPreview();
            
            // Setup sidebar scroll behavior
            setupShopSidebarScroll();
            
            // Reinitialize mobile menu specifically for shop page
            reinitializeMobileMenu();
        }, 500);
    } catch (error) {
        console.error('Error initializing shop:', error);
        showToast('Error loading shop content. Please refresh the page.', 'error');
    } finally {
        hideLoading();
    }
});

// Modal handlers
function setupModalHandlers() {
    const modals = document.querySelectorAll('.purchase-modal');
    const closeButtons = document.querySelectorAll('.close-btn');
    
    if (closeButtons.length > 0) {
        closeButtons.forEach(btn => {
            btn.onclick = () => {
                modals.forEach(modal => {
                    modal.style.display = 'none';
                });
            };
        });

        // Close modals when clicking outside
        window.onclick = (event) => {
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        };
    }
}

// Avatar preview functionality
function setupAvatarPreview() {
    const linkAccountBtn = document.getElementById('linkAccountBtn');
    const previewControls = document.getElementById('previewControls');
    const previewRankSelect = document.getElementById('previewRankSelect');
    const avatarPreview = document.getElementById('avatarPreview');
    const linkInfo = document.querySelector('.link-info');
    const avatarPlaceholder = document.querySelector('.avatar-placeholder');

    console.log('Setting up avatar preview');

    // Initialize the rank select dropdown
    if (previewRankSelect) {
        // Preview rank select change handler
        previewRankSelect.addEventListener('change', (event) => {
            console.log('Rank select changed to:', event.target.value);
            updateAvatarPreview(event.target.value);
        });
    }

    // Check if user is logged out explicitly
    const loggedOut = localStorage.getItem('logged_out') === 'true';
    if (loggedOut) {
        // User is explicitly logged out, show login UI
        if (linkAccountBtn) {
            linkAccountBtn.style.display = 'flex';
            linkAccountBtn.innerHTML = '<i class="fab fa-discord"></i> Login with Discord';
            linkAccountBtn.onclick = handleAuth;
        }
        if (linkInfo) {
            linkInfo.textContent = 'Login with Discord to view and customize your Minecraft avatar.';
            linkInfo.style.display = 'block';
        }
        if (previewControls) previewControls.style.display = 'none';
        return;
    }

    // Check if user is logged in - use the auth state from the navbar
    const userMenu = document.querySelector('.user-menu');
    const isLoggedIn = userMenu && window.getComputedStyle(userMenu).display === 'flex';

    if (!isLoggedIn) {
        // Double-check with username element
        const usernameElement = document.querySelector('.username');
        if (!usernameElement || !usernameElement.textContent.trim()) {
            // User is not logged in with Discord
            if (linkAccountBtn) {
                linkAccountBtn.style.display = 'flex';
                linkAccountBtn.innerHTML = '<i class="fab fa-discord"></i> Login with Discord';
                linkAccountBtn.onclick = handleAuth;
            }
            if (linkInfo) {
                linkInfo.textContent = 'Login with Discord to view and customize your Minecraft avatar.';
                linkInfo.style.display = 'block';
            }
            if (previewControls) previewControls.style.display = 'none';
            return;
        }
    }

    // At this point, we know the user is logged in
    // Get user data from the API to get their Minecraft username
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
        // For now, we'll use the hardcoded value from the HTML
        const response = await fetch('/api/payment-goal');
        if (response.ok) {
            const data = await response.json();
            const progressFill = document.querySelector('.progress-fill');
            const progressText = document.querySelector('.progress-text');
            
            if (progressFill && progressText && data) {
                const percentage = Math.min(100, Math.max(0, data.percentage));
                progressFill.style.width = `${percentage}%`;
                progressText.textContent = `${percentage}% Complete`;
            }
        }
    } catch (error) {
        console.error('Error updating payment goal:', error);
        // Silently fail - the default values in HTML will be used
    }
}

// Loading overlay functions
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

// Purchase handling functions
async function purchaseRank(rankId, price) {
    try {
        showLoading();
        console.log(`Purchasing rank: ${rankId} for £${price}`);
        
        // Get rank name
        const rankElement = document.querySelector(`.rank-card.${rankId} h3`);
        const rankName = rankElement ? rankElement.textContent : rankId;
        
        // Update purchase modal
        const rankNameElement = document.getElementById('rankName');
        const rankPriceElement = document.getElementById('rankPrice');
        
        if (rankNameElement) rankNameElement.textContent = rankName;
        if (rankPriceElement) rankPriceElement.textContent = price.toFixed(2);
        
        // Show purchase modal
        const purchaseModal = document.getElementById('purchaseModal');
        if (purchaseModal) {
            purchaseModal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error processing purchase:', error);
        showToast('Failed to process purchase. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function purchaseUpgrade(upgradeId, price) {
    try {
        showLoading();
        console.log(`Purchasing upgrade: ${upgradeId} for £${price}`);
        
        // Get upgrade name
        const upgradeElement = document.querySelector(`.rank-card.upgrade.${upgradeId} h3`);
        let upgradeName = upgradeElement ? upgradeElement.textContent : upgradeId;
        
        // Update purchase modal
        const rankNameElement = document.getElementById('rankName');
        const rankPriceElement = document.getElementById('rankPrice');
        
        if (rankNameElement) rankNameElement.textContent = upgradeName;
        if (rankPriceElement) rankPriceElement.textContent = price.toFixed(2);
        
        // Show purchase modal
        const purchaseModal = document.getElementById('purchaseModal');
        if (purchaseModal) {
            purchaseModal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error processing upgrade:', error);
        showToast('Failed to process upgrade. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Toast notification system
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Create icon based on toast type
    const icon = document.createElement('i');
    let iconClass = 'fas fa-info-circle';
    
    switch (type) {
        case 'success':
            iconClass = 'fas fa-check-circle';
            break;
        case 'error':
            iconClass = 'fas fa-times-circle';
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-circle';
            break;
    }
    
    icon.className = iconClass;
    toast.appendChild(icon);
    
    // Create message span
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    messageSpan.style.flex = '1';
    toast.appendChild(messageSpan);
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'toast-close';
    closeBtn.addEventListener('click', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
    toast.appendChild(closeBtn);

    container.appendChild(toast);

    // Remove toast after 3 seconds (unless closed manually)
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Confirm individual purchase
async function confirmPurchase() {
    // Close modal
    const purchaseModal = document.getElementById('purchaseModal');
    if (purchaseModal) {
        purchaseModal.style.display = 'none';
    }
    
    // Get purchase details
    const rankName = document.getElementById('rankName')?.textContent || 'Item';
    const rankPrice = document.getElementById('rankPrice')?.textContent || '0.00';
    
    // Simulate API call
    showLoading();
    
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Show success message
        showToast(`Successfully purchased ${rankName}!`, 'success');
        
        // Redirect to profile page after short delay
        setTimeout(() => {
            window.location.href = '/profile.html#purchases';
        }, 1500);
    } catch (error) {
        console.error('Purchase failed:', error);
        showToast('Purchase failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Setup sidebar scroll behavior for the shop page
function setupShopSidebarScroll() {
    console.log('Setting up shop sidebar as static (non-scrolling)');
    
    const sidebar = document.querySelector('.shop-container .avatar-preview-section');
    
    if (!sidebar) {
        console.error('Missing sidebar element for shop page');
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
    
    console.log('Shop sidebar set to static positioning');
}

// Process cart checkout
window.processCheckout = async function() {
    // Close modal
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.style.display = 'none';
    }
    
    if (!cart || cart.items.length === 0) {
        showToast('Your cart is empty', 'warning');
        return;
    }
    
    // Simulate API call
    showLoading();
    
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get cart total
        const total = cart.getTotal();
        
        // Show success message
        showToast(`Successfully purchased items for £${total.toFixed(2)}!`, 'success');
        
        // Clear cart
        cart.clearCart();
        
        // Redirect to profile page after short delay
        setTimeout(() => {
            window.location.href = '/profile.html#purchases';
        }, 1500);
    } catch (error) {
        console.error('Checkout failed:', error);
        showToast('Checkout failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Reinitialize mobile menu specifically for shop page
function reinitializeMobileMenu() {
    // This is a backup in case the menu wasn't properly initialized
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    if (mobileMenuToggle && navbarMenu) {
        // Remove any existing event listeners
        const newToggle = mobileMenuToggle.cloneNode(true);
        mobileMenuToggle.parentNode.replaceChild(newToggle, mobileMenuToggle);
        
        // Add event listener
        newToggle.addEventListener('click', () => {
            navbarMenu.classList.toggle('active');
            
            // Change icon based on menu state
            const icon = newToggle.querySelector('i');
            if (navbarMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Close mobile menu when a link is clicked
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            // Remove existing event listeners
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            
            // Add new event listener
            newLink.addEventListener('click', () => {
                navbarMenu.classList.remove('active');
                const icon = newToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
        
        console.log('Mobile menu reinitialized for shop page');
    } else {
        console.warn('Mobile menu elements not found on shop page');
    }
}
