// Shared functionality across all pages
document.addEventListener('DOMContentLoaded', async () => {
    // Load navigation
    try {
        const navResponse = await fetch('/components/nav.html');
        if (!navResponse.ok) throw new Error('Failed to load navigation');
        const navHtml = await navResponse.text();
        document.body.insertAdjacentHTML('afterbegin', navHtml);
        
        // Add has-navbar class to body when navbar is present
        if (document.querySelector('.navbar')) {
            document.body.classList.add('has-navbar');
        }

        // Initialize mobile menu toggle
        initMobileMenu();

        // Load footer
        const footerResponse = await fetch('/components/footer.html');
        if (!footerResponse.ok) throw new Error('Failed to load footer');
        const footerHtml = await footerResponse.text();
        document.body.insertAdjacentHTML('beforeend', footerHtml);

        // Set active nav link
        const currentPage = window.location.pathname.split('/').pop().split('.')[0] || 'home';
        document.querySelector(`[data-page="${currentPage}"]`)?.classList.add('active');
        document.querySelector(`.footer-link[data-page="${currentPage}"]`)?.classList.add('active');
        if (currentPage === 'home') {
            document.querySelector(`.footer-link[href="/"]`)?.classList.add('active');
        }

        // Setup logout button
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }

        // Initialize auth state
        await checkAuthState();
    } catch (error) {
        handleError(error, 'Failed to initialize page');
    }
});

// Initialize mobile menu functionality
function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    if (mobileMenuToggle && navbarMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            navbarMenu.classList.toggle('active');
            
            // Change icon based on menu state
            const icon = mobileMenuToggle.querySelector('i');
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
            link.addEventListener('click', () => {
                navbarMenu.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }
}

// Authentication handling
async function checkAuthState() {
    try {
        // Check if user has explicitly logged out
        const loggedOut = localStorage.getItem('logged_out') === 'true';
        
        if (loggedOut) {
            // User has explicitly logged out, keep them logged out
            updateUIForGuest();
            return;
        }
        
        // Otherwise, check with the API
        const response = await fetch('/api/user');
        if (response.ok) {
            const user = await response.json();
            updateUIForUser(user);
        } else {
            updateUIForGuest();
        }
    } catch (error) {
        console.error('Error checking auth state:', error);
        updateUIForGuest();
    }
}

function updateUIForUser(user) {
    // Clear the logged out flag when user is authenticated
    localStorage.removeItem('logged_out');
    
    // Update auth button and user menu
    const authButton = document.querySelector('.auth-button');
    const userMenu = document.querySelector('.user-menu');
    const profileLink = document.querySelector('[data-page="profile"]');
    const footerProfileLink = document.querySelector('#footer-profile-link');
    const userAvatar = document.querySelector('.user-avatar');
    const username = document.querySelector('.username');

    if (authButton) authButton.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (profileLink) profileLink.style.display = 'block';
    if (footerProfileLink) footerProfileLink.style.display = 'block';
    
    if (userAvatar) {
        userAvatar.src = user.avatar 
            ? `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png` 
            : '/images/default-avatar.png';
        userAvatar.alt = user.username;
    }
    if (username) username.textContent = user.username;

    // Remove dropdown functionality
    const dropdown = document.querySelector('.dropdown-content');
    if (dropdown) dropdown.style.display = 'none';
}

function updateUIForGuest() {
    const authButton = document.querySelector('.auth-button');
    const userMenu = document.querySelector('.user-menu');
    const profileLink = document.querySelector('[data-page="profile"]');
    const footerProfileLink = document.querySelector('#footer-profile-link');

    if (authButton) authButton.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (profileLink) profileLink.style.display = 'none';
    if (footerProfileLink) footerProfileLink.style.display = 'none';
    
    // Reset any user-specific UI elements
    const username = document.querySelector('.username');
    const userAvatar = document.querySelector('.user-avatar');
    
    if (username) username.textContent = '';
    if (userAvatar) {
        userAvatar.src = '/images/default-avatar.png';
        userAvatar.alt = 'Guest';
    }
    
    // Reset any page-specific elements that depend on login state
    
    // For shop page
    const linkAccountBtn = document.getElementById('linkAccountBtn');
    const previewControls = document.getElementById('previewControls');
    const avatarPreview = document.getElementById('avatarPreview');
    const linkInfo = document.querySelector('.link-info');
    const avatarPlaceholder = document.querySelector('.avatar-placeholder');
    
    if (linkAccountBtn) {
        linkAccountBtn.style.display = 'flex';
        linkAccountBtn.innerHTML = '<i class="fab fa-discord"></i> Login with Discord';
        linkAccountBtn.onclick = handleAuth;
    }
    
    if (previewControls) previewControls.style.display = 'none';
    
    if (avatarPreview) {
        // Reset avatar preview to placeholder
        avatarPreview.innerHTML = '';
        if (avatarPlaceholder) {
            avatarPlaceholder.style.display = 'flex';
            avatarPreview.appendChild(avatarPlaceholder);
        } else {
            // Create placeholder if it doesn't exist
            const placeholder = document.createElement('div');
            placeholder.className = 'avatar-placeholder';
            placeholder.innerHTML = '<i class="fas fa-user"></i>';
            avatarPreview.appendChild(placeholder);
        }
    }
    
    if (linkInfo) {
        linkInfo.textContent = 'Login with Discord to view and customize your Minecraft avatar.';
        linkInfo.style.display = 'block';
    }
    
    // Hide any user-specific content sections
    const userSpecificContent = document.querySelectorAll('.user-specific-content');
    userSpecificContent.forEach(element => {
        element.style.display = 'none';
    });
    
    // Show any guest-specific content sections
    const guestSpecificContent = document.querySelectorAll('.guest-specific-content');
    guestSpecificContent.forEach(element => {
        element.style.display = 'block';
    });
}

async function handleAuth() {
    showLoading();
    try {
        // Clear the logged out flag when attempting to log in
        localStorage.removeItem('logged_out');
        
        window.location.href = '/auth/discord';
    } catch (error) {
        hideLoading();
        handleError(error, 'Failed to start authentication');
    }
}

async function handleLogout(event) {
    if (event) event.preventDefault();
    showLoading();
    try {
        // In a real implementation, this would call the server to invalidate the session
        // For our demo, we'll just update the UI directly
        
        // Try to call the logout API if it exists
        try {
            const response = await fetch('/auth/logout', { method: 'POST' });
            // If the API call fails, we'll still proceed with the client-side logout
        } catch (error) {
            console.warn('API logout failed, proceeding with client-side logout:', error);
        }
        
        // Set logout flag in localStorage
        localStorage.setItem('logged_out', 'true');
        
        // Update UI for guest state
        updateUIForGuest();
        
        // Clear any stored user data
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        
        // Show success message
        showToast('You have been logged out successfully', 'success');
        
        // Redirect to home page after a short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    } catch (error) {
        hideLoading();
        handleError(error, 'Failed to logout');
    }
}

// Theme handling
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} fade-in`;
    
    const icon = document.createElement('i');
    icon.className = getToastIcon(type);
    toast.appendChild(icon);
    
    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);
    
    const container = document.querySelector('.toast-container') || createToastContainer();
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
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

// Loading indicator
function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'loading-overlay fade-in';
    loader.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.querySelector('.loading-overlay');
    if (loader) {
        loader.classList.remove('fade-in');
        loader.classList.add('fade-out');
        setTimeout(() => loader.remove(), 300);
    }
}

// Error handling
function handleError(error, fallbackMessage = 'An error occurred') {
    console.error(error);
    hideLoading();
    showToast(error.message || fallbackMessage, 'error');
}

// Export shared functions
window.handleAuth = handleAuth;
window.handleLogout = handleLogout;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.handleError = handleError;

// For development/demo purposes only - simulate login
function simulateLogin() {
    // Clear the logged out flag
    localStorage.removeItem('logged_out');
    
    // Create a mock user
    const mockUser = {
        username: 'DemoUser',
        discord_id: '123456789',
        avatar: null,
        minecraft_username: 'DemoPlayer'
    };
    
    // Update UI for the mock user
    updateUIForUser(mockUser);
    
    // Show success message
    showToast('Logged in as DemoUser', 'success');
}

// For development/demo purposes only - expose functions to window
window.simulateLogin = simulateLogin;
