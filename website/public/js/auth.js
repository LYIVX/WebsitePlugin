// Store current page URL before login
function storeCurrentPage() {
    // Don't store login or profile pages
    const currentPath = window.location.pathname;
    
    // Skip storing certain pages
    if (currentPath.includes('/login') || currentPath.includes('/profile')) {
        return null;
    }
    
    // Store the current page's path (not the full URL with domain)
    // This helps prevent cross-domain redirects
    const pathname = window.location.pathname + window.location.search;
    console.log('Storing current path:', pathname);
    localStorage.setItem('previousPage', pathname);
    return pathname;
}

// Handle login button click
function handleLoginClick(e) {
    if (e) e.preventDefault();
    
    // Store current page before redirecting to login
    const returnPage = storeCurrentPage();
    
    // Always use the current domain's auth URL
    console.log('[AUTH] Starting login flow with current domain');
    
    // Construct auth URL
    let authUrl = '/auth/discord';
    if (returnPage) {
        authUrl += `?return_url=${encodeURIComponent(returnPage)}`;
    }
    
    // Force window location to current domain + auth URL
    // This ensures we don't switch domains when starting auth
    const currentDomain = window.location.origin;
    const fullAuthUrl = `${currentDomain}${authUrl}`;
    
    console.log('[AUTH] Redirecting to auth URL on current domain:', fullAuthUrl);
    window.location.href = fullAuthUrl;
}

// Check if we should redirect to previous page after login
function checkRedirectAfterLogin() {
    // Check for query parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login') === 'success';
    const returnUrl = urlParams.get('return_url');
    
    console.log('Login redirect check:', { 
        loginSuccess, 
        returnUrl, 
        path: window.location.pathname
    });
    
    // If we have a return URL in the query parameters and we just logged in, use that
    if (loginSuccess && returnUrl) {
        // Convert to a relative path if it's a full URL
        let relativePath = returnUrl;
        try {
            const url = new URL(returnUrl);
            relativePath = url.pathname + url.search + url.hash;
        } catch (e) {
            // It's already a relative path
        }
        
        console.log('Redirecting to return URL:', relativePath);
        // Add a slight delay to ensure this executes after page loads
        setTimeout(() => {
            window.location.href = relativePath;
        }, 100);
        return true;
    }
    
    // Fallback to localStorage method
    // Only run this on the profile page
    if (window.location.pathname.includes('/profile')) {
        const previousPage = localStorage.getItem('previousPage');
        
        // If there's a stored page and we just logged in, redirect
        if (previousPage && loginSuccess) {
            console.log('Redirecting to previous page:', previousPage);
            localStorage.removeItem('previousPage'); // Clear it
            // Add a slight delay to ensure this executes after page loads
            setTimeout(() => {
                window.location.href = previousPage;
            }, 100);
            return true;
        }
    }
    return false;
}

// Add login detection to any page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth.js loaded. Checking for login redirect...');
    console.log('Current URL:', window.location.href);
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    console.log('Login param:', urlParams.get('login'));
    console.log('Return URL param:', urlParams.get('return_url'));
    
    // Check localStorage
    console.log('Stored previous page:', localStorage.getItem('previousPage'));
    
    // Check for login redirect first - prioritize this check
    if (checkRedirectAfterLogin()) {
        console.log('Redirecting after login...');
        return; // Stop if we're redirecting
    }
    
    // Handle return URL parameter on login page
    if (window.location.pathname.includes('/login')) {
        const returnUrlParam = urlParams.get('return_url');
        if (returnUrlParam) {
            console.log('Found return_url parameter on login page:', returnUrlParam);
            localStorage.setItem('return_after_login', returnUrlParam);
            console.log('Stored return URL for after login');
        }
    }
    
    // Check for redirect after successful login on the login success page
    if (window.location.pathname.includes('/login/success') || 
        (window.location.pathname.includes('/profile') && urlParams.get('login') === 'success')) {
        
        // First check for stored return URL from login page
        const returnAfterLogin = localStorage.getItem('return_after_login');
        if (returnAfterLogin) {
            console.log('Found stored return URL from login page:', returnAfterLogin);
            localStorage.removeItem('return_after_login'); // Clear it
            window.location.href = returnAfterLogin;
            return;
        }
        
        // Then check localStorage for previous page
        const previousPage = localStorage.getItem('previousPage');
        if (previousPage) {
            console.log('Redirecting to previous page after login:', previousPage);
            localStorage.removeItem('previousPage');
            window.location.href = previousPage;
            return;
        }
    }
    
    // Add event listeners to login buttons
    const loginButtons = document.querySelectorAll('.login-button, .auth-button');
    console.log(`Found ${loginButtons.length} login buttons`);
    loginButtons.forEach(button => {
        button.addEventListener('click', handleLoginClick);
    });
    
    // Add event listeners to login links in forums
    const loginLinks = document.querySelectorAll('.login-prompt a');
    console.log(`Found ${loginLinks.length} login links`);
    loginLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            handleLoginClick();
        });
    });
});

// Debug auth function - add to the bottom of the file
async function debugAuth() {
    try {
        console.log("=== CLIENT AUTH DEBUG ===");
        console.log("Local storage auth check:", localStorage.getItem('auth') === 'true');
        console.log("Document cookie exists:", document.cookie.length > 0);
        console.log("Raw cookies:", document.cookie);
        
        // Check server-side auth
        const response = await fetch('/debug-session', {
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log("=== SERVER AUTH DEBUG ===");
            console.log("Server says authenticated:", data.isAuthenticated);
            console.log("Session exists:", data.sessionExists);
            console.log("Session cookie exists:", data.sessionCookie);
            console.log("User data:", data.user);
            
            if (!data.isAuthenticated && data.sessionExists) {
                console.log("ISSUE DETECTED: Session exists but not authenticated");
            }
            if (data.isAuthenticated && !data.user) {
                console.log("ISSUE DETECTED: Authenticated but no user data");
            }
            if (localStorage.getItem('auth') === 'true' && !data.isAuthenticated) {
                console.log("ISSUE DETECTED: Client thinks logged in but server says no");
                // Force refresh auth state
                localStorage.removeItem('auth');
                console.log("Cleared local auth state");
            }
            
            return data;
        } else {
            console.error("Failed to get auth debug info from server");
            return null;
        }
    } catch (error) {
        console.error("Error in auth debugging:", error);
        return null;
    }
}

// Make function available globally
window.debugAuth = debugAuth;

// Auto-run on page load to diagnose issues
document.addEventListener('DOMContentLoaded', () => {
    // Call with delay to ensure page is fully loaded
    setTimeout(debugAuth, 1000);
}); 