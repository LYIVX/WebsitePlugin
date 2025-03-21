/**
 * Universal Button Utility
 * This utility makes it easy to create consistent buttons across the website.
 */

const UniversalButtonUtil = {
    /**
     * Creates a button element with consistent styling
     * @param {Object} options - Button configuration
     * @param {string} options.text - Button text
     * @param {string} [options.type='primary'] - Button type (primary, secondary, danger)
     * @param {string} [options.icon=''] - FontAwesome icon class (e.g., 'fas fa-edit')
     * @param {string} [options.size='medium'] - Button size (small, medium, large)
     * @param {boolean} [options.disabled=false] - Whether the button is disabled
     * @param {boolean} [options.fullWidth=false] - Whether the button should be full width
     * @param {function} [options.onClick] - Click event handler
     * @return {HTMLButtonElement} The created button element
     */
    createButton(options) {
        const {
            text,
            type = 'primary',
            icon = '',
            size = 'medium',
            disabled = false,
            fullWidth = false,
            onClick
        } = options;

        // Create button element
        const button = document.createElement('button');
        button.className = `universal-btn ${type} ${size}`;
        
        if (fullWidth) {
            button.classList.add('full-width');
        }
        
        if (disabled) {
            button.disabled = true;
        }
        
        // Add icon if provided
        if (icon) {
            const iconElement = document.createElement('i');
            iconElement.className = icon;
            button.appendChild(iconElement);
        }
        
        // Add text
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        button.appendChild(textSpan);
        
        // Add click event handler if provided
        if (onClick && typeof onClick === 'function') {
            button.addEventListener('click', onClick);
        }
        
        return button;
    },
    
    /**
     * Creates a link button with consistent styling
     * @param {Object} options - Button configuration
     * @param {string} options.text - Button text
     * @param {string} options.href - Link URL
     * @param {string} [options.type='primary'] - Button type (primary, secondary, danger)
     * @param {string} [options.icon=''] - FontAwesome icon class (e.g., 'fas fa-edit')
     * @param {string} [options.size='medium'] - Button size (small, medium, large)
     * @param {boolean} [options.disabled=false] - Whether the button is disabled
     * @param {boolean} [options.fullWidth=false] - Whether the button should be full width
     * @param {string} [options.target=''] - Link target (e.g., '_blank')
     * @return {HTMLAnchorElement} The created link button element
     */
    createLinkButton(options) {
        const {
            text,
            href,
            type = 'primary',
            icon = '',
            size = 'medium',
            disabled = false,
            fullWidth = false,
            target = ''
        } = options;

        // Create link element
        const link = document.createElement('a');
        link.className = `universal-btn ${type} ${size}`;
        link.href = disabled ? 'javascript:void(0);' : href;
        
        if (target) {
            link.target = target;
        }
        
        if (fullWidth) {
            link.classList.add('full-width');
        }
        
        if (disabled) {
            link.classList.add('disabled');
            link.style.pointerEvents = 'none';
            link.style.opacity = '0.5';
        }
        
        // Add icon if provided
        if (icon) {
            const iconElement = document.createElement('i');
            iconElement.className = icon;
            link.appendChild(iconElement);
        }
        
        // Add text
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        link.appendChild(textSpan);
        
        return link;
    },
    
    /**
     * Updates an existing button's properties
     * @param {HTMLButtonElement|HTMLAnchorElement} buttonElement - The button to update
     * @param {Object} options - Button configuration
     */
    updateButton(buttonElement, options) {
        const {
            text,
            type,
            icon,
            size,
            disabled,
            fullWidth,
            onClick
        } = options;
        
        // Update class if type or size is provided
        if (type) {
            buttonElement.classList.remove('primary', 'secondary', 'danger');
            buttonElement.classList.add(type);
        }
        
        if (size) {
            buttonElement.classList.remove('small', 'medium', 'large');
            buttonElement.classList.add(size);
        }
        
        // Update disabled state if provided
        if (typeof disabled === 'boolean') {
            if (buttonElement instanceof HTMLButtonElement) {
                buttonElement.disabled = disabled;
            } else if (buttonElement instanceof HTMLAnchorElement) {
                if (disabled) {
                    buttonElement.classList.add('disabled');
                    buttonElement.style.pointerEvents = 'none';
                    buttonElement.style.opacity = '0.5';
                    buttonElement.href = 'javascript:void(0);';
                } else {
                    buttonElement.classList.remove('disabled');
                    buttonElement.style.pointerEvents = '';
                    buttonElement.style.opacity = '';
                    // Can't restore original href - must be set explicitly
                }
            }
        }
        
        // Update full width if provided
        if (typeof fullWidth === 'boolean') {
            if (fullWidth) {
                buttonElement.classList.add('full-width');
            } else {
                buttonElement.classList.remove('full-width');
            }
        }
        
        // Update text if provided
        if (text) {
            // Find or create text span
            let textSpan = buttonElement.querySelector('span');
            if (!textSpan) {
                textSpan = document.createElement('span');
                buttonElement.appendChild(textSpan);
            }
            textSpan.textContent = text;
        }
        
        // Update icon if provided
        if (icon !== undefined) {
            // Remove existing icon
            const existingIcon = buttonElement.querySelector('i');
            if (existingIcon) {
                buttonElement.removeChild(existingIcon);
            }
            
            // Add new icon if not empty
            if (icon) {
                const iconElement = document.createElement('i');
                iconElement.className = icon;
                buttonElement.insertBefore(iconElement, buttonElement.firstChild);
            }
        }
        
        // Update click handler if provided
        if (onClick && typeof onClick === 'function') {
            // We can't easily remove old handlers, so we just add the new one
            buttonElement.addEventListener('click', onClick);
        }
    }
};

// Export the utility if using ES modules
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = UniversalButtonUtil;
} 