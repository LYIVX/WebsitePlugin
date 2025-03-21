// Shared JavaScript functionality for the website

// Once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load the navigation bar
    loadComponent('/components/nav.html', 'body', 'prepend');
    
    // Load the footer
    loadComponent('/components/footer.html', 'body', 'append');
    
    // Add universal button CSS if not already included
    addUniversalButtonCSS();
    
    // Add universal button script if not already included
    addUniversalButtonScript();
    
    // Initialize any global features
    initializeGlobalFeatures();
});

// Load a component into the specified container
function loadComponent(componentUrl, containerSelector, position = 'append') {
    fetch(componentUrl)
        .then(response => response.text())
        .then(html => {
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = html;
            
            const container = document.querySelector(containerSelector);
            if (container) {
                if (position === 'append') {
                    container.appendChild(tempContainer);
                } else if (position === 'prepend') {
                    container.prepend(tempContainer);
                } else if (position === 'replace') {
                    container.innerHTML = '';
                    container.appendChild(tempContainer);
                }
            }
        })
        .catch(error => {
            console.error(`Failed to load component ${componentUrl}:`, error);
        });
}

// Add universal button CSS if not already included
function addUniversalButtonCSS() {
    // Check if already loaded
    if (document.querySelector('link[href="/css/universal-button.css"]')) {
        return;
    }
    
    // Create link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/universal-button.css';
    
    // Append to document head
    document.head.appendChild(link);
}

// Add universal button script if not already included
function addUniversalButtonScript() {
    // Check if component already loaded
    if (document.querySelector('script[src="/components/button.html"]')) {
        return;
    }
    
    // Create script elements
    const componentScript = document.createElement('script');
    componentScript.src = '/components/button.html';
    
    const utilScript = document.createElement('script');
    utilScript.src = '/js/universal-button.js';
    
    // Append to document body
    document.body.appendChild(componentScript);
    document.body.appendChild(utilScript);
}

// Initialize global features
function initializeGlobalFeatures() {
    // Any global features that should run on all pages
} 