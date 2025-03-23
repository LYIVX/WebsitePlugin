/**
 * Component Loader System
 * Loads HTML components and handles their data attributes
 */
document.addEventListener('DOMContentLoaded', function() {
    // Track when all components are loaded
    let componentsLoading = 0;
    const loadedEvent = new CustomEvent('components-loaded');
    
    // Find all component placeholders and load them
    loadAllComponents();
    
    /**
     * Finds and loads all components in the document
     */
    function loadAllComponents() {
        const components = document.querySelectorAll('[data-component]');
        componentsLoading = components.length;
        
        if (components.length === 0) {
            // No components to load, trigger loaded event
            document.dispatchEvent(loadedEvent);
            return;
        }
        
        components.forEach(loadComponent);
    }
    
    /**
     * Loads a single component
     * @param {HTMLElement} element - The element to load the component into
     */
    function loadComponent(element) {
        const componentName = element.getAttribute('data-component');
        const path = `/components/${componentName}.html`;
        
        // Store the inner content before it gets replaced
        const innerContent = element.innerHTML.trim();
        
        fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load component: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                // Process the HTML template with data attributes
                const processedHtml = processTemplate(html, element, innerContent);
                element.innerHTML = processedHtml;
                
                // After inserting the component, look for nested components
                const nestedComponents = element.querySelectorAll('[data-component]');
                if (nestedComponents.length > 0) {
                    componentsLoading += nestedComponents.length - 1; // Adjust count for nested components
                    nestedComponents.forEach(loadComponent);
                }
                
                // Preserve original ID if element had one
                if (element.id) {
                    const firstChild = element.firstElementChild;
                    if (firstChild && !firstChild.id) {
                        firstChild.id = element.id;
                    }
                }
                
                // Check if all components are loaded
                componentsLoading--;
                if (componentsLoading === 0) {
                    document.dispatchEvent(loadedEvent);
                }
            })
            .catch(error => {
                console.error(`Error loading component ${componentName}:`, error);
                element.innerHTML = `<div class="error">Failed to load component: ${componentName}</div>`;
                
                // Even on error, decrement counter
                componentsLoading--;
                if (componentsLoading === 0) {
                    document.dispatchEvent(loadedEvent);
                }
            });
    }
    
    /**
     * Processes a template with the element's data attributes
     * @param {string} template - The HTML template
     * @param {HTMLElement} element - The element with data attributes
     * @param {string} innerContent - The inner content of the element
     * @returns {string} - The processed HTML
     */
    function processTemplate(template, element, innerContent) {
        // Get all data attributes except data-component
        const attributes = Array.from(element.attributes)
            .filter(attr => attr.name.startsWith('data-') && attr.name !== 'data-component')
            .reduce((acc, attr) => {
                // Remove 'data-' prefix and convert to camelCase
                const key = attr.name.substring(5).replace(/-([a-z])/g, g => g[1].toUpperCase());
                acc[key] = attr.value;
                return acc;
            }, {});
        
        // Add site config to available variables
        if (window.SITE_CONFIG) {
            Object.keys(SITE_CONFIG).forEach(key => {
                if (typeof SITE_CONFIG[key] === 'string' || typeof SITE_CONFIG[key] === 'number') {
                    attributes[`site.${key}`] = SITE_CONFIG[key];
                }
            });
        }
            
        // Replace {{variable}} placeholders with values
        let result = template;
        Object.keys(attributes).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, attributes[key]);
        });
        
        // Handle conditional blocks {{#if variable}}...{{/if}}
        Object.keys(attributes).forEach(key => {
            const ifRegex = new RegExp(`{{#if ${key}}}([\\s\\S]*?){{/if}}`, 'g');
            result = result.replace(ifRegex, (match, content) => {
                return attributes[key] && attributes[key] !== 'false' ? content : '';
            });
        });
        
        // Handle iteration blocks for arrays in config
        if (window.SITE_CONFIG) {
            const iterRegex = /{{#each ([^}]+)}}([\s\S]*?){{\/each}}/g;
            result = result.replace(iterRegex, (match, path, template) => {
                const pathParts = path.split('.');
                let data = SITE_CONFIG;
                
                // Navigate to the correct property
                for (const part of pathParts) {
                    if (data[part] !== undefined) {
                        data = data[part];
                    } else {
                        return ''; // Path not found
                    }
                }
                
                if (!Array.isArray(data)) {
                    return ''; // Not an array
                }
                
                // Generate HTML for each item
                return data.map(item => {
                    let itemHtml = template;
                    
                    // Replace {{item.property}} with actual values
                    Object.keys(item).forEach(key => {
                        const regex = new RegExp(`{{item.${key}}}`, 'g');
                        itemHtml = itemHtml.replace(regex, item[key]);
                    });
                    
                    return itemHtml;
                }).join('');
            });
        }
        
        // Replace any remaining unmatched placeholders
        result = result.replace(/{{\w+}}/g, '');
        result = result.replace(/{{\w+\.\w+}}/g, '');
        
        // Handle any inner content within the element
        if (innerContent) {
            result = result.replace('<!-- CONTENT_PLACEHOLDER -->', innerContent);
        }
        
        return result;
    }
});
