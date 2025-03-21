// Store current page URL before login
function storeCurrentPage() {
    // Don't store login or profile pages
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/login') && !currentPath.includes('/profile')) {
        const currentPage = window.location.href;
        localStorage.setItem('previousPage', currentPage);
        console.log('Stored previous page:', currentPage);
        return currentPage;
    }
    return null;
}

// Handle login button click
function handleLoginClick(e) {
    if (e) e.preventDefault();
    
    // Store current page before redirecting to login
    const returnPage = storeCurrentPage();
    
    // Redirect to login with return URL parameter if we have one
    if (returnPage) {
        const encodedReturnUrl = encodeURIComponent(returnPage);
        window.location.href = `/login?return_url=${encodedReturnUrl}`;
    } else {
        window.location.href = '/login';
    }
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
        console.log('Redirecting to return URL from query param:', returnUrl);
        // Add a slight delay to ensure this executes after page loads
        setTimeout(() => {
            window.location.href = returnUrl;
        }, 100);
        return true;
    }
    
    // Fallback to localStorage method
    // Only run this on the profile page
    if (window.location.pathname.includes('/profile')) {
        const previousPage = localStorage.getItem('previousPage');
        
        // If there's a stored page and we just logged in, redirect
        if (previousPage && loginSuccess) {
            console.log('Redirecting to previous page from localStorage:', previousPage);
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