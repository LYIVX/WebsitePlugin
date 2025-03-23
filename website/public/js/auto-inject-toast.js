/**
 * Auto-inject Toast Notification System
 * This script automatically adds the toast functionality to all pages
 */

(function() {
    // Add the toast unified CSS file if not already present
    if (!document.querySelector('link[href="/components/toast/toast.css"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = '/components/toast/toast.css';
        document.head.appendChild(cssLink);
    }
    
    // Add the toast script to the document if not already present
    if (!document.querySelector('script[src="/components/toast/toast.js"]')) {
        const script = document.createElement('script');
        script.src = '/components/toast/toast.js';
        script.async = true;
        document.head.appendChild(script);
    }
    
    // Add the global toast container to the document if not already present
    if (!document.getElementById('toastContainer')) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Create test function to demonstrate toast on all pages (for development only)
    window.testToast = function(type = 'info') {
        const types = ['info', 'success', 'error', 'warning'];
        const messages = {
            'info': 'This is an information toast message',
            'success': 'Action completed successfully!',
            'error': 'An error occurred during the operation',
            'warning': 'Warning: This action cannot be undone'
        };
        
        // Show toast after script is loaded
        if (window.showToast) {
            window.showToast(messages[type], type);
        } else {
            // If showToast isn't available yet, wait for it
            setTimeout(() => {
                if (window.showToast) {
                    window.showToast(messages[type], type);
                } else {
                    console.error('Toast functionality not available');
                }
            }, 500);
        }
    };
})(); 