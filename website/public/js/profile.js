// Profile page functionality
async function loadUserData() {
    showLoading();
    try {
        const response = await fetch('/api/user');
        if (!response.ok) {
            throw new Error('Failed to load user data');
        }
        const user = await response.json();
        console.log('Loaded user data:', user);
        
        // Initialize UI with user data
        updateProfileUI(user);
        
        // Load additional data
        if (user.id) {
            await Promise.all([
                loadUserRanks(user.id),
                loadPurchaseHistory(user.id)
            ]);
        }
        
        return user;
    } catch (error) {
        console.error('Failed to load profile data:', error);
        showToast('Failed to load profile data', 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load initial user data
        const user = await loadUserData();
        
        // Initialize settings change listeners - using the custom toggle-changed event
        document.addEventListener('toggle-changed', (event) => {
            if (event.detail.id === 'emailNotifications' || event.detail.id === 'discordNotifications') {
                console.log(`${event.detail.id} changed to: ${event.detail.checked}`);
                saveSettings();
            }
            
            // Handle theme toggle changes
            if (event.detail.id === 'lightThemePreference') {
                console.log(`Theme preference changed to: ${event.detail.checked ? 'light' : 'dark'}`);
                const isLightTheme = event.detail.checked;
                const hasAccentTheme = document.body.classList.contains('accent-theme');
                
                // Apply theme immediately
                if (isLightTheme) {
                    document.body.classList.add('light-theme');
                    localStorage.setItem('theme', 'light');
                } else {
                    document.body.classList.remove('light-theme');
                    localStorage.setItem('theme', 'dark');
                }
                
                saveSettings();
                
                // Show feedback to user with the combined theme state
                showToast(`${isLightTheme ? 'Light' : 'Dark'} ${hasAccentTheme ? 'accent' : 'primary'} theme applied`, 'info');
            }
            
            // Handle accent theme toggle
            if (event.detail.id === 'accentThemePreference') {
                console.log(`Accent theme changed to: ${event.detail.checked ? 'on' : 'off'}`);
                const useAccentTheme = event.detail.checked;
                const isLightTheme = document.body.classList.contains('light-theme');
                
                // Apply accent theme independently of light/dark theme
                if (useAccentTheme) {
                    document.body.classList.add('accent-theme');
                    localStorage.setItem('accent_theme', 'true');
                } else {
                    document.body.classList.remove('accent-theme');
                    localStorage.setItem('accent_theme', 'false');
                }
                
                saveSettings();
                
                // Show feedback to user with the combined theme state
                showToast(`${isLightTheme ? 'Light' : 'Dark'} ${useAccentTheme ? 'accent' : 'primary'} theme applied`, 'info');
            }
        });
        
        // Setup Minecraft username save button
        document.getElementById('saveMinecraftUsername').addEventListener('click', handleSaveUsername);
        
        // Initialize theme toggles with current theme
        initThemeToggles();
        
    } catch (error) {
        console.error('Failed to initialize profile page:', error);
        if (error.message === 'Failed to load user data') {
            window.location.href = '/';
        }
    }
});

// Initialize theme toggles based on current theme settings
function initThemeToggles() {
    // Light/Dark theme toggle
    const themeToggle = document.getElementById('lightThemePreference');
    if (themeToggle) {
        // Get current theme from localStorage
        const currentTheme = localStorage.getItem('theme');
        themeToggle.checked = currentTheme === 'light';
        
        // Make sure the theme is applied correctly
        if (currentTheme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }
    
    // Accent theme toggle
    const accentToggle = document.getElementById('accentThemePreference');
    if (accentToggle) {
        // Get current accent theme preference
        const useAccentTheme = localStorage.getItem('accent_theme') === 'true';
        accentToggle.checked = useAccentTheme;
        
        // Apply accent theme if enabled
        if (useAccentTheme) {
            document.body.classList.add('accent-theme');
        } else {
            document.body.classList.remove('accent-theme');
        }
    }
}

function updateProfileUI(user) {
    if (!user) {
        console.error('No user data provided to updateProfileUI');
        return;
    }

    // Update profile header
    const avatar = document.querySelector('.profile-avatar');
    const minecraftAvatar = document.querySelector('.minecraft-avatar');
    const username = document.querySelector('.profile-username');
    const discordTag = document.querySelector('.profile-discord');
    const minecraftUser = document.querySelector('.profile-minecraft');
    const memberSince = document.querySelector('.member-since');

    // Use the same avatar format as the navbar
    avatar.src = user.avatar_url || '/images/default-avatar.png';
    
    // Set Minecraft avatar if username is available
    if (user.minecraft_username) {
        minecraftAvatar.src = `https://mc-heads.net/head/${user.minecraft_username}`;
        minecraftAvatar.style.display = 'block';
    } else {
        minecraftAvatar.style.display = 'none';
    }
    
    username.textContent = user.username || 'Unknown User';
    discordTag.textContent = `Discord: ${user.username}#${user.discriminator || '0000'}`;
    minecraftUser.textContent = user.minecraft_username ? 
        `Minecraft: ${user.minecraft_username}` : 
        'Minecraft account not linked';

    // Format member since date using created_at from Supabase
    if (user.created_at) {
        const memberDate = new Date(user.created_at);
        memberSince.textContent = memberDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    } else {
        memberSince.textContent = 'Unknown';
    }

    // Set form values
    const minecraftInput = document.getElementById('minecraftUsername');
    const emailToggle = document.getElementById('emailNotifications');
    const discordToggle = document.getElementById('discordNotifications');
    
    if (minecraftInput) {
        minecraftInput.value = user.minecraft_username || '';
    }
    
    if (emailToggle) {
        emailToggle.checked = Boolean(user.email_notifications);
    }
    
    if (discordToggle) {
        discordToggle.checked = Boolean(user.discord_notifications);
    }
    
    // No need to set the theme toggle here as we handle it separately in initThemeToggles()
    
    console.log('Updated UI with user data:', {
        minecraft_username: user.minecraft_username,
        email_notifications: user.email_notifications,
        discord_notifications: user.discord_notifications,
        emailToggleState: emailToggle?.checked,
        discordToggleState: discordToggle?.checked
    });
}

async function loadUserRanks(userId) {
    try {
        const response = await fetch(`/api/user/${userId}/ranks`);
        if (!response.ok) throw new Error('Failed to load ranks');
        
        const ranks = await response.json();
        const activeRanksCount = document.querySelector('.active-ranks');
        const ranksList = document.getElementById('activeRanks');
        
        activeRanksCount.textContent = ranks.length;
        
        if (ranks.length === 0) {
            ranksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-crown"></i>
                    <p>No active ranks</p>
                    <a href="/shop.html" class="universal-btn primary">Browse Ranks</a>
                </div>
            `;
            return;
        }

        ranksList.innerHTML = ranks.map(rank => `
            <div class="rank-item ${rank.name.toLowerCase().replace(' ', '-')}">
                <div class="rank-item-header">
                    <i class="fas ${getRankIcon(rank.name)}"></i>
                    <h3>${rank.name}</h3>
                </div>
                <ul class="rank-features">
                    ${rank.features.map(feature => 
                        `<li><i class="fas fa-check"></i> ${feature}</li>`
                    ).join('')}
                </ul>
                ${rank.expires_at ? `
                    <div class="rank-expiry">
                        <i class="fas fa-clock"></i>
                        Expires: ${new Date(rank.expires_at).toLocaleDateString()}
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        handleError(error, 'Failed to load ranks');
    }
}

async function loadPurchaseHistory(userId) {
    try {
        const response = await fetch(`/api/user/${userId}/purchases`);
        if (!response.ok) throw new Error('Failed to load purchase history');
        
        const purchases = await response.json();
        const purchaseCount = document.querySelector('.total-purchases');
        const purchaseHistory = document.getElementById('purchaseHistory');
        
        purchaseCount.textContent = purchases.length;
        
        if (purchases.length === 0) {
            purchaseHistory.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <i class="fas fa-shopping-cart"></i>
                        <p>No purchases yet</p>
                    </td>
                </tr>
            `;
            return;
        }

        purchaseHistory.innerHTML = purchases.map(purchase => {
            // Format date with time
            const purchaseDate = new Date(purchase.created_at);
            const formattedDate = purchaseDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <tr class="purchase-row ${purchase.status.toLowerCase()}">
                    <td>${formattedDate}</td>
                    <td>
                        <span class="rank-name ${purchase.rank_name.toLowerCase().replace(' ', '-')}">
                            ${purchase.rank_name}
                        </span>
                    </td>
                    <td>£${purchase.price.toFixed(2)}</td>
                    <td>
                        <span class="status-badge ${purchase.status.toLowerCase()}">
                            ${getStatusIcon(purchase.status)}
                            ${purchase.status}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        handleError(error, 'Failed to load purchase history');
    }
}

// Handler for saving Minecraft username
async function handleSaveUsername() {
    showLoading();

    const username = document.getElementById('minecraftUsername').value.trim();
    
    if (!username) {
        showToast('Please enter a Minecraft username', 'error');
        hideLoading();
        return;
    }

    try {
        const response = await fetch('/api/user/minecraft', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            throw new Error('Failed to update Minecraft username');
        }
        
        const user = await response.json();
        
        // Update the profile UI with the new user data
        updateProfileUI(user);
        
        // Additionally, immediately update the Minecraft avatar
        const minecraftAvatar = document.querySelector('.minecraft-avatar');
        if (minecraftAvatar && username) {
            minecraftAvatar.src = `https://mc-heads.net/head/${username}`;
            minecraftAvatar.style.display = 'block';
        }
        
        showToast('Minecraft username saved', 'success');
    } catch (error) {
        console.error('Error saving Minecraft username:', error);
        showToast('Failed to save Minecraft username', 'error');
    } finally {
        hideLoading();
    }
}

async function saveSettings() {
    try {
        const emailNotifications = document.getElementById('emailNotifications').checked;
        const discordNotifications = document.getElementById('discordNotifications').checked;
        const themePreference = document.getElementById('lightThemePreference').checked ? 'light' : 'dark';
        const accentThemePreference = document.getElementById('accentThemePreference').checked;
        
        console.log('Saving settings:', {
            emailNotifications,
            discordNotifications,
            themePreference,
            accentThemePreference
        });
        
        // In a real implementation, we would save these to the server
        const response = await fetch('/api/user/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email_notifications: emailNotifications,
                discord_notifications: discordNotifications,
                theme_preference: themePreference,
                accent_theme_preference: accentThemePreference
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save settings');
        }
        
        // We already update the theme in the toggle handler,
        // so no need to do it again here
        
        // Store the theme preferences in localStorage to persist them
        localStorage.setItem('theme', themePreference);
        localStorage.setItem('accent_theme', accentThemePreference.toString());
        
        showToast('Settings saved successfully', 'success');
    } catch (error) {
        console.error('Failed to save settings:', error);
        showToast('Failed to save settings', 'error');
    }
}

// Helper functions
function getRankIcon(rankName) {
    const icons = {
        'Shadow Enchanter': 'fa-hat-wizard',
        'Void Walker': 'fa-ghost',
        'Ethereal Warden': 'fa-shield-alt',
        'Astral Guardian': 'fa-sun',
        'Citizen': 'fa-home',
        'Merchant': 'fa-store',
        'Councilor': 'fa-scroll',
        'Mayor': 'fa-landmark',
        'Governor': 'fa-flag',
        'Noble': 'fa-chess-knight',
        'Duke': 'fa-chess-rook',
        'King': 'fa-crown',
        'Divine Ruler': 'fa-star'
    };
    return icons[rankName] || 'fa-crown';
}

function getStatusIcon(status) {
    const icons = {
        'completed': '<i class="fas fa-check-circle"></i>',
        'pending': '<i class="fas fa-clock"></i>',
        'failed': '<i class="fas fa-times-circle"></i>'
    };
    return icons[status.toLowerCase()] || '';
}

// Toast notification function with close button
function showToast(message, type = 'info') {
    // Import and use the new toast component if it's available
    if (typeof window.showToast === 'function' && window.showToast !== showToast) {
        return window.showToast(message, type);
    }
    
    // Get or create toast container
    const container = document.querySelector('.toast-container') || createToastContainer();
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Create icon element
    const icon = document.createElement('i');
    icon.className = getToastIcon(type);
    toast.appendChild(icon);
    
    // Create message span
    const messageSpan = document.createElement('span');
    messageSpan.className = 'toast-message';
    messageSpan.textContent = message;
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
    
    // Add to container
    container.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
        
        // Auto dismiss after 3 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }, 100);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return 'fas fa-check-circle';
        case 'error': return 'fas fa-times-circle';
        case 'warning': return 'fas fa-exclamation-circle';
        default: return 'fas fa-info-circle';
    }
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Removed functions
// async function loadProfile() { ... }
// async function loadPurchaseHistory() { ... }
// async function loadUserRanks() { ... }
// async function linkMinecraft() { ... }
// async function unlinkMinecraft() { ... }
// async function unlinkDiscord() { ... }
// document.getElementById('emailNotifications')?.addEventListener('change', async (e) => { ... });
// document.getElementById('discordNotifications')?.addEventListener('change', async (e) => { ... });
