/**
 * Toast Notification System
 * A reusable component for showing toast notifications with custom console logging
 */

// Make sure the component is loaded
(function() {
    // Add the global toast container CSS if not already present
    if (!document.querySelector('link[href="/components/toast/toast.css"]')) {
        const globalCssLink = document.createElement('link');
        globalCssLink.setAttribute('rel', 'stylesheet');
        globalCssLink.setAttribute('href', '/components/toast/toast.css');
        document.head.appendChild(globalCssLink);
    }

    // Load the component HTML template
    if (!customElements.get('toast-notification')) {
        fetch('/components/toast/toast.html')
            .then(response => response.text())
            .then(html => {
                // Create a temporary container to hold the HTML content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                // Extract the template and append it to the document
                const template = tempDiv.querySelector('#toast-template');
                if (template) {
                    document.body.appendChild(template);
                    
                    // Add the CSS
                    const linkElem = document.createElement('link');
                    linkElem.setAttribute('rel', 'stylesheet');
                    linkElem.setAttribute('href', '/components/toast/toast.css');
                    document.head.appendChild(linkElem);
                }
                
                // Execute the script content to register the custom element
                const scriptContent = tempDiv.querySelector('script').textContent;
                const script = document.createElement('script');
                script.textContent = scriptContent;
                document.body.appendChild(script);
            })
            .catch(error => {
                console.error('Failed to load toast component:', error);
            });
    }
})();

// Toast container
let toastContainer;

/**
 * Initialize the toast container
 * @returns {HTMLElement} - The toast container element
 */
function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
    }
    return toastContainer;
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (info, success, error, warning)
 * @param {number} duration - How long to show the toast in milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
    // Log to console with custom formatting
    const timestamp = new Date().toISOString();
    const logPrefix = `[TOAST][${type.toUpperCase()}][${timestamp}]`;
    
    // Style the console logs based on type
    const logStyles = {
        info: 'color: #3498db; font-weight: bold;',
        success: 'color: #2ecc71; font-weight: bold;',
        error: 'color: #e74c3c; font-weight: bold;',
        warning: 'color: #f39c12; font-weight: bold;'
    };
    
    console.log(`%c${logPrefix} ${message}`, logStyles[type] || logStyles.info);
    
    // Check if the custom element is defined
    if (customElements.get('toast-notification')) {
        // Create the toast element
        const toast = document.createElement('toast-notification');
        toast.message = message;
        toast.type = type;
        
        // Add to the container
        const container = getToastContainer();
        container.appendChild(toast);
        
        // Add show class after a small delay (for animation)
        setTimeout(() => {
            const toastElement = toast.shadowRoot.querySelector('.toast');
            if (toastElement) {
                toastElement.classList.add('show');
            }
        }, 10);
        
        // Remove the toast after duration
        if (duration > 0) {
            setTimeout(() => {
                if (toast.shadowRoot) {
                    const toastElement = toast.shadowRoot.querySelector('.toast');
                    if (toastElement) {
                        toastElement.classList.add('fade-out');
                    }
                }
                
                // Remove from DOM after animation completes
                setTimeout(() => {
                    if (toast && toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, duration);
        }
        
        return toast;
    } else {
        // Fallback to basic toast if the custom element isn't ready yet
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
        icon.style.marginRight = '12px';
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
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'white';
        closeBtn.style.fontSize = '1.2rem';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.opacity = '0.7';
        closeBtn.style.padding = '0';
        closeBtn.style.marginLeft = '10px';
        closeBtn.style.display = 'flex';
        closeBtn.style.alignItems = 'center';
        closeBtn.style.justifyContent = 'center';
        closeBtn.style.height = '24px';
        closeBtn.style.width = '24px';
        
        closeBtn.addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
        
        toast.appendChild(closeBtn);
        
        const container = getToastContainer();
        container.appendChild(toast);
        
        // Show and hide logic
        setTimeout(() => {
            toast.classList.add('show');
            
            if (duration > 0) {
                setTimeout(() => {
                    toast.classList.add('fade-out');
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 300);
                }, duration);
            }
        }, 10);
        
        return toast;
    }
}

// Export function to global scope
window.showToast = showToast; 