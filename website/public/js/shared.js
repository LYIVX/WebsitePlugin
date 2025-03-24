// Shared functionality across all pages
document.addEventListener('DOMContentLoaded', async () => {
    // Load toast auto-injection script
    if (!document.querySelector('script[src="/js/auto-inject-toast.js"]')) {
        const toastScript = document.createElement('script');
        toastScript.src = '/js/auto-inject-toast.js';
        document.head.appendChild(toastScript);
    }
    
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
        
        // Initialize theme toggle
        initThemeToggle();

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
            console.log('Found logout button:', logoutButton.outerHTML);
            logoutButton.style.display = 'flex'; // Make sure it's visible
            logoutButton.addEventListener('click', function(e) {
                console.log('Logout button clicked');
                handleLogout(e);
            });
        } else {
            console.warn('Logout button not found in the DOM');
        }

        // Check for user menu
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            console.log('User menu found:', userMenu.outerHTML);
        } else {
            console.warn('User menu not found in the DOM');
        }

        // Initialize auth state
        await checkAuthState();
    } catch (error) {
        console.error('Failed to initialize shared functionality:', error);
        showToast('Failed to initialize UI', 'error');
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

// Initialize theme toggle functionality
function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        // Check for saved theme preference or use system preference
        const savedTheme = localStorage.getItem('theme');
        const savedAccentTheme = localStorage.getItem('accent_theme') === 'true';
        
        // Apply light/dark theme
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        } else if (savedTheme === 'dark') {
            document.body.classList.remove('light-theme');
        } else {
            // If no saved preference, check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                document.body.classList.add('light-theme');
                localStorage.setItem('theme', 'light');
            } else {
                document.body.classList.remove('light-theme');
                localStorage.setItem('theme', 'dark');
            }
        }
        
        // Apply accent theme if enabled
        if (savedAccentTheme) {
            document.body.classList.add('accent-theme');
        } else {
            document.body.classList.remove('accent-theme');
        }
        
        // Update the toggle button tooltip based on the current theme combination
        updateThemeToggleTooltip(themeToggle);
        
        // Add event listener to toggle theme
        themeToggle.addEventListener('click', () => {
            const isCurrentlyLight = document.body.classList.contains('light-theme');
            const hasAccentTheme = document.body.classList.contains('accent-theme');
            
            // Toggle light/dark theme
            if (isCurrentlyLight) {
                document.body.classList.remove('light-theme');
                localStorage.setItem('theme', 'dark');
                showToast(`Dark ${hasAccentTheme ? 'accent' : 'primary'} theme enabled`, 'info');
            } else {
                document.body.classList.add('light-theme');
                localStorage.setItem('theme', 'light');
                showToast(`Light ${hasAccentTheme ? 'accent' : 'primary'} theme enabled`, 'info');
            }
            
            // Preserve accent theme state when toggling light/dark
            localStorage.setItem('accent_theme', hasAccentTheme.toString());
            
            // Update the toggle button tooltip
            updateThemeToggleTooltip(themeToggle);
        });
    }
}

// Update the theme toggle button tooltip based on current theme combination
function updateThemeToggleTooltip(toggleButton) {
    if (!toggleButton) return;
    
    const isLightTheme = document.body.classList.contains('light-theme');
    const hasAccentTheme = document.body.classList.contains('accent-theme');
    
    // Set the main button tooltip
    if (isLightTheme) {
        toggleButton.title = `Switch to dark ${hasAccentTheme ? 'accent' : 'primary'} theme`;
        toggleButton.setAttribute('aria-label', `Switch to dark ${hasAccentTheme ? 'accent' : 'primary'} theme`);
    } else {
        toggleButton.title = `Switch to light ${hasAccentTheme ? 'accent' : 'primary'} theme`;
        toggleButton.setAttribute('aria-label', `Switch to light ${hasAccentTheme ? 'accent' : 'primary'} theme`);
    }
    
    // Set individual icon tooltips
    const sunIcon = toggleButton.querySelector('.fa-sun');
    const moonIcon = toggleButton.querySelector('.fa-moon');
    
    if (sunIcon) {
        sunIcon.title = `Switch to light ${hasAccentTheme ? 'accent' : 'primary'} theme`;
    }
    
    if (moonIcon) {
        moonIcon.title = `Switch to dark ${hasAccentTheme ? 'accent' : 'primary'} theme`;
    }
}

// Authentication handling
async function checkAuthState() {
    try {
        const response = await fetch('/api/session-check', {
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to check auth state');
        }
        
        const sessionInfo = await response.json();
        console.log('[AUTH] Session check result:', sessionInfo);
        
        if (sessionInfo.isAuthenticated && sessionInfo.user) {
            // User is authenticated
            updateUIForAuthenticatedUser(sessionInfo.user);
            return true;
        } else {
            // User is not authenticated
            updateUIForGuest();
            return false;
        }
    } catch (error) {
        console.error('[AUTH] Error checking auth state:', error);
        updateUIForGuest();
        return false;
    }
}

function updateUIForAuthenticatedUser(user) {
    const authButton = document.querySelector('.auth-button');
    const userMenu = document.querySelector('.user-menu');
    const userMenuContainer = document.querySelector('.user-menu-container');
    const profileLink = document.querySelector('[data-page="profile"]');
    const footerProfileLink = document.querySelector('#footer-profile-link');
    const logoutButton = document.getElementById('logoutButton');
    const username = document.querySelector('.username');
    const userAvatar = document.querySelector('.user-avatar');

    if (authButton) authButton.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userMenuContainer) userMenuContainer.style.display = 'block';
    if (profileLink) profileLink.style.display = 'block';
    if (footerProfileLink) footerProfileLink.style.display = 'block';
    if (logoutButton) logoutButton.style.display = 'block';
    
    if (username) username.textContent = user.username;
    if (userAvatar) {
        userAvatar.src = user.avatar_url || '/images/default-avatar.png';
        userAvatar.alt = user.username;
    }
}

function updateUIForGuest() {
    const authButton = document.querySelector('.auth-button');
    const userMenu = document.querySelector('.user-menu');
    const userMenuContainer = document.querySelector('.user-menu-container');
    const profileLink = document.querySelector('[data-page="profile"]');
    const footerProfileLink = document.querySelector('#footer-profile-link');
    const logoutButton = document.getElementById('logoutButton');
    const username = document.querySelector('.username');
    const userAvatar = document.querySelector('.user-avatar');

    if (authButton) authButton.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (userMenuContainer) userMenuContainer.style.display = 'none';
    if (profileLink) profileLink.style.display = 'none';
    if (footerProfileLink) footerProfileLink.style.display = 'none';
    if (logoutButton) logoutButton.style.display = 'none';
    
    if (username) username.textContent = '';
    if (userAvatar) {
        userAvatar.src = '/images/default-avatar.png';
        userAvatar.alt = 'Guest';
    }
}

async function handleAuth() {
    showLoading();
    try {
        // Clear the logged out flag when attempting to log in
        localStorage.removeItem('logged_out');
        
        // Store current page for redirect after login
        const currentPage = window.location.pathname;
        if (currentPage !== '/') {
            localStorage.setItem('returnTo', currentPage);
        }
        
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
        console.log('[AUTH] Logging out...');
        
        // Set logged_out flag to prevent auto-login attempts
        localStorage.setItem('logged_out', 'true');
        
        // Clear any auth-related data
        localStorage.removeItem('auth');
        localStorage.removeItem('username');
        
        // Call the server logout endpoint
        try {
            console.log('[AUTH] Calling server logout endpoint');
            const response = await fetch('/auth/logout', { 
                credentials: 'include'  // Important: include cookies
            });
            console.log('[AUTH] Server logout response:', response.status);
        } catch (error) {
            console.warn('[AUTH] Server logout failed:', error);
        }
        
        // Update UI regardless of server response
        updateUIForGuest();
        
        // Show success message
        showToast('Logged out successfully', 'success');
        
        // Redirect to home page if on a protected page
        const currentPath = window.location.pathname;
        if (currentPath.includes('/profile') || currentPath.includes('/dashboard')) {
            window.location.href = '/';
            return; // Stop execution since we're redirecting
        }
        
        // Refresh the page to ensure all auth-dependent elements update
        window.location.reload();
    } catch (error) {
        console.error('[AUTH] Logout error:', error);
        hideLoading();
        handleError(error, 'Failed to log out');
    }
}

// Theme handling
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Toast notifications
function showToast(message, type = 'info') {
    // Import and use the new toast component if it's available
    if (typeof window.showToast === 'function' && window.showToast !== showToast) {
        return window.showToast(message, type);
    }
    
    // Fallback to the original implementation if the component is not loaded
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = document.createElement('i');
    icon.className = getToastIcon(type);
    toast.appendChild(icon);
    
    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);
    
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
window.simulateLogin = simulateLogin;

// For development/demo purposes only - simulate login
function simulateLogin() {
    console.log('Simulating login...');
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
