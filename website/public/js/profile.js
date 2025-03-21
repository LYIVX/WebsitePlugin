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
        });
        
        // Setup Minecraft username save button
        document.getElementById('saveMinecraftUsername').addEventListener('click', handleSaveUsername);
        
    } catch (error) {
        console.error('Failed to initialize profile page:', error);
        if (error.message === 'Failed to load user data') {
            window.location.href = '/';
        }
    }
});

function updateProfileUI(user) {
    if (!user) {
        console.error('No user data provided to updateProfileUI');
        return;
    }

    // Update profile header
    const avatar = document.querySelector('.profile-avatar');
    const username = document.querySelector('.profile-username');
    const discordTag = document.querySelector('.profile-discord');
    const minecraftUser = document.querySelector('.profile-minecraft');
    const memberSince = document.querySelector('.member-since');

    // Use the same avatar format as the navbar
    avatar.src = user.avatar_url || '/images/default-avatar.png';
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
        updateProfileUI(user);
        showToast('Minecraft username saved', 'success');
    } catch (error) {
        console.error('Error saving Minecraft username:', error);
        showToast('Failed to save Minecraft username', 'error');
    } finally {
        hideLoading();
    }
}

async function saveSettings() {
    showLoading();

    try {
        const formData = {
            email_notifications: getToggleState('emailNotifications'),
            discord_notifications: getToggleState('discordNotifications')
        };

        const response = await fetch('/api/user/preferences', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to update settings');
        }
        
        const user = await response.json();
        updateProfileUI(user);
        showToast('Settings saved', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Failed to save settings', 'error');
    } finally {
        hideLoading();
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

// Removed functions
// async function loadProfile() { ... }
// async function loadPurchaseHistory() { ... }
// async function loadUserRanks() { ... }
// async function linkMinecraft() { ... }
// async function unlinkMinecraft() { ... }
// async function unlinkDiscord() { ... }
// document.getElementById('emailNotifications')?.addEventListener('change', async (e) => { ... });
// document.getElementById('discordNotifications')?.addEventListener('change', async (e) => { ... });
