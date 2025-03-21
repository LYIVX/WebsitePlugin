// Rank feature descriptions for tooltips
const featureDescriptions = {
    // Shadow Enchanter features
    "Access to /fly command": "Allows you to fly freely around the server in designated areas. Perfect for building and exploring without obstacles.",
    "3 /sethome locations": "Set up to 3 different teleport locations that you can return to anytime with a simple command.",
    "Colored chat messages": "Make your messages stand out with colorful text in the chat. Choose from a selection of colors to express yourself.",
    "Special chat prefix": "Get a unique prefix before your name in chat that shows your rank status to other players.",
    
    // Void Walker features
    "All Shadow Enchanter features": "Includes all perks from the Shadow Enchanter rank plus additional benefits exclusive to Void Walker.",
    "Access to /enderchest": "Open your enderchest anywhere with a simple command, no need to place an actual enderchest block.",
    "5 /sethome locations": "Set up to 5 different teleport locations across the server for convenient travel.",
    "Custom join messages": "Create personalized messages that display to everyone when you join the server.",
    
    // Ethereal Warden features
    "All Void Walker features": "Includes all perks from the Void Walker rank plus additional benefits exclusive to Ethereal Warden.",
    "Access to /heal and /feed": "Instantly restore your health and hunger with simple commands, no need for food or potions.",
    "7 /sethome locations": "Set up to 7 different teleport locations across the server for convenient travel.",
    "Particle effects": "Display custom particle effects around your character to make you stand out from the crowd.",
    
    // Astral Guardian features
    "All Ethereal Warden features": "Includes all perks from the Ethereal Warden rank plus additional benefits exclusive to Astral Guardians.",
    "Access to /nick": "Change your display name on the server with custom nicknames to create your unique identity.",
    "10 /sethome locations": "Set up to 10 different teleport locations across the server for convenient travel.",
    "Custom particle trails": "Leave beautiful particle effects behind as you walk or fly around the server.",
    
    // Citizen features
    "Create a town": "Found your own settlement in the world with custom borders and protection from outsiders.",
    "Create and join towns": "Found your own settlement or join existing towns built by other players.",
    "Basic town permissions": "Get access to fundamental town management commands and protections.",
    "Town chat access": "Communicate privately with fellow town members through dedicated town chat channels.",
    "Town spawn access": "Teleport directly to your town's spawn point from anywhere on the server.",
    "Claim 5 town plots": "Claim up to 5 protected plots of land for your town to build on safely.",
    "Set 1 town spawn": "Establish a central teleport point for your town that all members can use.",
    
    // Merchant features
    "All Citizen features": "Includes all perks from the Citizen rank plus additional benefits exclusive to Merchant.",
    "2 shop plots": "Claim up to 2 special plots specifically for creating shops to sell your items.",
    "10 town plots": "Expand your town with up to 10 protected land plots for building and development.",
    
    // Councilor features
    "All Merchant features": "Includes all perks from the Merchant rank plus additional benefits exclusive to Councilor.",
    "Create town laws": "Establish custom rules for your town that are enforced by server mechanics.",
    "15 town plots": "Expand your town with up to 15 protected land plots for building and development.",
    "Custom town banner": "Design a unique banner that represents your town and displays on the town info page.",
    
    // Mayor features
    "All Councilor features": "Includes all perks from the Councilor rank plus additional benefits exclusive to Mayor.",
    "Town tax benefits": "Collect taxes from town residents automatically and get special tax reductions.",
    "20 town plots": "Expand your town with up to 20 protected land plots for building and development.",
    "Town teleport points": "Create multiple teleport locations within your town for convenient travel.",
    
    // Governor features
    "All Mayor features": "Includes all perks from the Mayor rank plus additional benefits exclusive to Governor.",
    "Multi-town management": "Manage multiple towns simultaneously with enhanced administrative controls.",
    "25 town plots": "Expand your town with up to 25 protected land plots for building and development.",
    "Regional influence": "Gain influence over the surrounding region beyond your town's borders.",
    "Create nation": "Found your own nation by uniting multiple towns under your leadership.",
    "Nation chat prefix": "Special prefix in the nation chat that identifies you as the Governor.",
    
    // Noble features
    "All Governor features": "Includes all perks from the Governor rank plus additional benefits exclusive to Noble.",
    "Nation particles": "Unique particle effects that show throughout your nation's territory.",
    "Custom spawn": "Design a custom spawn point for your nation with special features.",
    "Advanced nation features": "Access to advanced tools and permissions for running your nation.",
    
    // Duke features
    "All Noble features": "Includes all perks from the Noble rank plus additional benefits exclusive to Duke.",
    "Nation-wide effects": "Apply special effects to all members of your nation.",
    "Custom banner": "Design and display a unique banner that represents your nation.",
    "Nation-wide abilities": "Special abilities that affect all citizens within your nation's borders.",
    
    // King features
    "All Duke features": "Includes all perks from the Duke rank plus additional benefits exclusive to King.",
    "Nation commands": "Access to powerful commands that affect your entire nation.",
    "Custom laws": "Create and enforce special rules within your nation's territory.",
    "Supreme nation control": "Ultimate authority over all aspects of your nation with exclusive permissions.",
    
    // Divine Ruler features
    "All King features": "Includes every benefit from the King rank plus exclusive Divine Ruler perks.",
    "Divine powers": "Access to powerful commands that affect large areas or multiple players at once.",
    "Custom events": "Create and host special events for players on the server with enhanced controls.",
    "Ultimate perks": "Exclusive benefits that aren't available to any other rank, making you truly divine.",
    "Ultimate towny authority": "The highest level of authority in the Towny system with exclusive permissions.",
    
    // Generic features - add more as needed
    "/fly command": "Fly freely around the server in designated areas.",
    "Custom join messages": "Create personalized messages that display when you join the server.",
    "Colored name": "Your name appears in a special color in the chat and player list.",
    "Priority server access": "Skip the queue during high-traffic times and get into the server immediately.",
    "Access to VIP-only areas": "Explore exclusive zones on the server only available to VIP ranks and above.",
    
    // Add missing features from ranks.js
    "Colored chat prefix": "Your name appears with a special colored prefix in chat that indicates your rank status.",
    "/fly command in lobby": "Ability to fly around freely in the server lobby area for easier navigation.",
    "Access to VIP-only areas": "Enter exclusive areas on the server that are only available to VIP rank holders.",
    "2x experience gain": "Earn twice as much XP from all activities compared to regular players.",
    "All VIP features": "Includes all perks from the VIP rank plus additional benefits.",
    "Pet system access": "Create and customize virtual pets that follow you around in the game.",
    "Priority server access": "Get into the server first during high-traffic times when queues may form.",
    "3x experience gain": "Earn three times as much XP from all activities compared to regular players.",
    "All MVP features": "Includes all perks from the MVP rank plus additional benefits.",
    "Particle effects": "Display custom particle effects around your character to make you stand out.",
    "Custom nickname colors": "Choose from a wider selection of colors for your custom nickname.",
    "Access to all mini-games": "Play all mini-games on the server, including those with restricted access.",
    "Priority support": "Get faster responses from server staff when you need assistance.",
    "4x experience gain": "Earn four times as much XP from all activities compared to regular players."
};

// Function to get appropriate icon based on feature description
function getFeatureIcon(feature) {
    const featureLower = feature.toLowerCase();
    
    // Command related features
    if (featureLower.includes('/fly')) return 'fa-feather-alt';
    else if (featureLower.includes('/sethome') || featureLower.includes('teleport') || featureLower.includes('spawn')) return 'fa-home';
    else if (featureLower.includes('/heal') || featureLower.includes('health')) return 'fa-heart';
    else if (featureLower.includes('/feed') || featureLower.includes('hunger')) return 'fa-utensils';
    else if (featureLower.includes('/enderchest')) return 'fa-box-open';
    else if (featureLower.includes('/nick')) return 'fa-user-edit';
    
    // Chat and appearance related
    else if (featureLower.includes('chat') && featureLower.includes('prefix')) return 'fa-comment-alt';
    else if (featureLower.includes('chat') && featureLower.includes('message')) return 'fa-comments';
    else if (featureLower.includes('color')) return 'fa-palette';
    else if (featureLower.includes('particle')) return 'fa-magic';
    
    // Town and nation related
    else if (featureLower.includes('town') && featureLower.includes('create')) return 'fa-city';
    else if (featureLower.includes('nation') && featureLower.includes('create')) return 'fa-flag';
    else if (featureLower.includes('town') && featureLower.includes('plot')) return 'fa-map-marked-alt';
    else if (featureLower.includes('shop')) return 'fa-store';
    else if (featureLower.includes('banner')) return 'fa-flag-checkered';
    else if (featureLower.includes('law')) return 'fa-gavel';
    else if (featureLower.includes('tax')) return 'fa-coins';
    else if (featureLower.includes('nation-wide') || featureLower.includes('nation wide') || featureLower.includes('nationwide')) return 'fa-broadcast-tower';
    
    // Experience related
    else if (featureLower.includes('experience') || featureLower.includes('xp gain')) return 'fa-star';
    
    // Access related
    else if (featureLower.includes('access') && featureLower.includes('area')) return 'fa-door-open';
    else if (featureLower.includes('priority')) return 'fa-bolt';
    
    // Custom features related
    else if (featureLower.includes('custom') && featureLower.includes('event')) return 'fa-calendar-alt';
    else if (featureLower.includes('custom') && featureLower.includes('join')) return 'fa-sign-in-alt';
    else if (featureLower.includes('pet')) return 'fa-paw';
    else if (featureLower.includes('divine')) return 'fa-sun';
    
    // "All previous features"
    else if (featureLower.includes('all') && featureLower.includes('feature')) return 'fa-layer-group';
    
    // Additional mappings for features that might still have tick icons
    else if (featureLower.includes('mini-game')) return 'fa-gamepad';
    else if (featureLower.includes('support')) return 'fa-headset';
    else if (featureLower.includes('nickname')) return 'fa-signature';
    else if (featureLower.includes('permission')) return 'fa-lock-open';
    else if (featureLower.includes('perk')) return 'fa-gift';
    else if (featureLower.includes('power')) return 'fa-bolt';
    else if (featureLower.includes('ability')) return 'fa-hat-wizard';
    else if (featureLower.includes('effect')) return 'fa-sparkles';
    else if (featureLower.includes('join')) return 'fa-sign-in-alt';
    else if (featureLower.includes('command')) return 'fa-terminal';
    else if (featureLower.includes('manage')) return 'fa-cogs';
    else if (featureLower.includes('control')) return 'fa-sliders-h';
    
    // Default
    return 'fa-gem';
}

// Create tooltip element
function createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'feature-tooltip';
    document.body.appendChild(tooltip);
    return tooltip;
}

// Initialize tooltips
function initializeTooltips() {
    // Create the tooltip element
    const tooltip = createTooltip();
    
    // Find all rank feature items
    const featureItems = document.querySelectorAll('.rank-features li');
    
    featureItems.forEach(item => {
        // Get the feature text (without the icon)
        const featureText = item.textContent.trim();
        
        // Add data attribute to store the original feature text
        item.setAttribute('data-feature', featureText);
        
        // Add event listeners for mouse interactions
        item.addEventListener('mouseenter', (e) => showTooltip(e, item, tooltip));
        item.addEventListener('mouseleave', () => hideTooltip(tooltip));
        
        // For touch devices
        item.addEventListener('touchstart', (e) => {
            e.preventDefault();
            showTooltip(e, item, tooltip);
            
            // Hide tooltip when touching elsewhere
            const hideOnTouch = (e) => {
                if (!item.contains(e.target)) {
                    hideTooltip(tooltip);
                    document.removeEventListener('touchstart', hideOnTouch);
                }
            };
            
            document.addEventListener('touchstart', hideOnTouch);
        });
    });
}

// Show tooltip with description
function showTooltip(event, item, tooltip) {
    const featureText = item.getAttribute('data-feature');
    // Provide generic description if specific one is not available
    let description = featureDescriptions[featureText];
    
    if (!description) {
        // Generate a reasonable default description based on the feature name
        const featureName = featureText.toLowerCase();
        if (featureName.includes("access")) {
            description = `Gain special access to ${featureName.replace("access to", "").trim()} functionality on the server.`;
        } else if (featureName.includes("custom")) {
            description = `Customize your ${featureName.replace("custom", "").trim()} with unique options only available to this rank.`;
        } else if (featureName.includes("all")) {
            const previousRank = featureName.replace("all", "").replace("features", "").trim();
            description = `Includes all the benefits from the ${previousRank} rank plus additional perks.`;
        } else {
            description = `Special perk that enhances your gameplay experience with additional capabilities.`;
        }
    }
    
    // Set tooltip content
    tooltip.innerHTML = `
        <div class="feature-tooltip-title">${featureText}</div>
        <div>${description}</div>
    `;
    
    // Position the tooltip
    positionTooltip(event, item, tooltip);
    
    // Make tooltip visible
    tooltip.classList.add('visible');
}

// Position tooltip near the feature but ensure it's visible in viewport
function positionTooltip(event, item, tooltip) {
    const rect = item.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // On mobile, position below the item
        tooltip.style.top = `${rect.bottom}px`;
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.width = `${rect.width}px`;
    } else {
        // Calculate position to keep tooltip in viewport
        let left = rect.right + 10;
        let top = rect.top;
        
        // Check if tooltip would go off right edge
        if (left + 300 > window.innerWidth) {
            left = rect.left - 310; // Position to the left of the item
            
            // If that would go off left edge, position below
            if (left < 10) {
                left = Math.max(10, rect.left);
                top = rect.bottom + 10;
            }
        }
        
        // Check if tooltip would go off bottom edge
        const tooltipHeight = tooltip.offsetHeight || 150; // Estimate if not yet visible
        if (top + tooltipHeight > window.innerHeight) {
            top = Math.max(10, window.innerHeight - tooltipHeight - 10);
        }
        
        // Set position
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }
}

// Hide tooltip
function hideTooltip(tooltip) {
    tooltip.classList.remove('visible');
}

// Initialize tooltips when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeTooltips);

// Re-initialize tooltips when ranks are loaded dynamically
document.addEventListener('ranksLoaded', initializeTooltips); 