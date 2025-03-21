class TabBar {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container with id "${containerId}" not found`);
        }

        this.options = {
            activeTabClass: options.activeTabClass || 'active',
            defaultTab: options.defaultTab || '',
            onTabChange: options.onTabChange || (() => {})
        };

        // Create tab bar structure
        this.tabBar = document.createElement('div');
        this.tabBar.className = 'tab-bar';
        
        this.tabNav = document.createElement('div');
        this.tabNav.className = 'tab-bar-nav';
        
        this.tabContent = document.createElement('div');
        this.tabContent.className = 'tab-bar-content';

        this.tabBar.appendChild(this.tabNav);
        this.tabBar.appendChild(this.tabContent);
        this.container.appendChild(this.tabBar);

        // Store tabs
        this.tabs = new Map();
        
        // Bind events
        this.handleTabClick = this.handleTabClick.bind(this);
        this.tabNav.addEventListener('click', this.handleTabClick);

        // Add default tabs
        this.addDefaultTabs();
    }

    addDefaultTabs() {
        // Serverwide Ranks
        this.addTab('serverwide', 'Serverwide Ranks', this.generateRankContent([
            {
                name: 'Shadow Enchanter',
                price: 9.99,
                icon: 'fa-hat-wizard',
                features: [
                    'Access to /fly command',
                    '3 /sethome locations',
                    'Colored chat messages',
                    'Special chat prefix'
                ]
            },
            {
                name: 'Void Walker',
                price: 19.99,
                icon: 'fa-ghost',
                features: [
                    'All Shadow Enchanter features',
                    'Access to /enderchest',
                    '5 /sethome locations',
                    'Custom join messages'
                ]
            },
            {
                name: 'Ethereal Warden',
                price: 29.99,
                icon: 'fa-shield-alt',
                features: [
                    'All Void Walker features',
                    'Access to /heal and /feed',
                    '7 /sethome locations',
                    'Particle effects'
                ]
            },
            {
                name: 'Astral Guardian',
                price: 39.99,
                icon: 'fa-sun',
                features: [
                    'All Ethereal Warden features',
                    'Access to /nick',
                    '10 /sethome locations',
                    'Custom particle trails'
                ]
            }
        ]));

        // Serverwide Upgrades
        this.addTab('serverwide-upgrades', 'Serverwide Upgrades', this.generateUpgradeContent([
            {
                from: 'Shadow Enchanter',
                to: 'Void Walker',
                price: 4.99,
                features: [
                    'Access to /enderchest',
                    '+2 /sethome locations',
                    'Custom join messages'
                ]
            },
            {
                from: 'Void Walker',
                to: 'Ethereal Warden',
                price: 4.99,
                features: [
                    'Access to /heal and /feed',
                    '+2 /sethome locations',
                    'Particle effects'
                ]
            },
            {
                from: 'Ethereal Warden',
                to: 'Astral Guardian',
                price: 4.99,
                features: [
                    'Access to /nick',
                    '+3 /sethome locations',
                    'Custom particle trails'
                ]
            }
        ]));

        // Towny Ranks - Updated to include all ranks from CSS
        this.addTab('towny', 'Towny Ranks', this.generateRankContent([
            {
                name: 'Citizen',
                price: 4.99,
                icon: 'fa-home',
                features: [
                    'Create a town',
                    'Claim 5 town plots',
                    'Set 1 town spawn'
                ]
            },
            {
                name: 'Merchant',
                price: 9.99,
                icon: 'fa-store',
                features: [
                    'All Citizen features',
                    '2 shop plots',
                    '10 town plots'
                ]
            },
            {
                name: 'Councilor',
                price: 14.99,
                icon: 'fa-scroll',
                features: [
                    'All Merchant features',
                    'Create town laws',
                    '15 town plots',
                    'Custom town banner'
                ]
            },
            {
                name: 'Mayor',
                price: 19.99,
                icon: 'fa-landmark',
                features: [
                    'All Councilor features',
                    'Town tax benefits',
                    '20 town plots',
                    'Town teleport points'
                ]
            },
            {
                name: 'Governor',
                price: 24.99,
                icon: 'fa-chess-rook',
                features: [
                    'All Mayor features',
                    'Multi-town management',
                    '25 town plots',
                    'Regional influence'
                ]
            },
            {
                name: 'Noble',
                price: 29.99,
                icon: 'fa-crown',
                features: [
                    'All Governor features',
                    'Nation creation',
                    'Nation particles',
                    'Custom spawn'
                ]
            },
            {
                name: 'Duke',
                price: 34.99,
                icon: 'fa-chess-king',
                features: [
                    'All Noble features',
                    'Extended nation borders',
                    'Nation-wide effects',
                    'Royal decrees'
                ]
            },
            {
                name: 'King',
                price: 39.99,
                icon: 'fa-crown',
                features: [
                    'All Duke features',
                    'Kingdom management',
                    'Royal treasury',
                    'Kingdom-wide buffs'
                ]
            },
            {
                name: 'Divine Ruler',
                price: 44.99,
                icon: 'fa-sun',
                features: [
                    'All King features',
                    'Divine powers',
                    'Custom events',
                    'Ultimate authority'
                ]
            }
        ]));

        // Towny Upgrades - Updated to include all upgrade paths
        this.addTab('towny-upgrades', 'Towny Upgrades', this.generateUpgradeContent([
            {
                from: 'Citizen',
                to: 'Merchant',
                price: 4.99,
                features: [
                    '2 shop plots',
                    '+5 town plots',
                    'Enhanced trading'
                ]
            },
            {
                from: 'Merchant',
                to: 'Councilor',
                price: 4.99,
                features: [
                    'Create town laws',
                    '+5 town plots',
                    'Custom town banner'
                ]
            },
            {
                from: 'Councilor',
                to: 'Mayor',
                price: 4.99,
                features: [
                    'Town tax benefits',
                    '+5 town plots',
                    'Town teleport points'
                ]
            },
            {
                from: 'Mayor',
                to: 'Governor',
                price: 4.99,
                features: [
                    'Multi-town management',
                    '+5 town plots',
                    'Regional influence'
                ]
            },
            {
                from: 'Governor',
                to: 'Noble',
                price: 4.99,
                features: [
                    'Nation creation',
                    'Nation particles',
                    'Custom spawn'
                ]
            },
            {
                from: 'Noble',
                to: 'Duke',
                price: 4.99,
                features: [
                    'Extended nation borders',
                    'Nation-wide effects',
                    'Royal decrees'
                ]
            },
            {
                from: 'Duke',
                to: 'King',
                price: 4.99,
                features: [
                    'Kingdom management',
                    'Royal treasury',
                    'Kingdom-wide buffs'
                ]
            },
            {
                from: 'King',
                to: 'Divine Ruler',
                price: 4.99,
                features: [
                    'Divine powers',
                    'Custom events',
                    'Ultimate authority'
                ]
            }
        ]));
    }

    generateRankContent(ranks) {
        const grid = document.createElement('div');
        grid.className = 'rank-grid';
        
        // Add responsive class for small screens
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            grid.classList.add('rank-grid-mobile');
        }
        
        ranks.forEach(rank => {
            const rankId = this.formatId(rank.name);
            const card = document.createElement('div');
            card.className = `rank-card ${this.formatClassName(rank.name)}`;
            
            // Create mobile-optimized layout
            const featuresList = rank.features.map(feature => {
                const iconClass = getFeatureIcon(feature);
                return `<li><i class="fas ${iconClass}"></i> <span class="feature-text">${feature}</span></li>`;
            }).join('');
            
            card.innerHTML = `
                <div class="rank-header">
                    <i class="fas ${rank.icon}"></i>
                    <h3>${rank.name}</h3>
                    <div class="rank-price">£${rank.price.toFixed(2)}</div>
                </div>
                <div class="rank-info">
                    <div class="rank-category">${this.getCategory(rank.name)} Rank</div>
                    <ul class="rank-features">
                        ${featuresList}
                    </ul>
                    <div class="card-button-container">
                        <button class="universal-btn secondary add-to-cart-btn" data-rank-id="${rankId}" data-rank-name="${rank.name}" data-rank-price="${rank.price.toFixed(2)}">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
        
        // Add event listeners for purchase buttons
        setTimeout(() => {
            const purchaseButtons = grid.querySelectorAll('.purchase-btn');
            purchaseButtons.forEach(button => {
                button.addEventListener('click', (event) => {
                    const rankId = event.currentTarget.getAttribute('data-rank-id');
                    const rankName = event.currentTarget.getAttribute('data-rank-name');
                    const rankPrice = parseFloat(event.currentTarget.getAttribute('data-rank-price'));
                    
                    // Call the purchaseRank function from shop.js
                    purchaseRank(rankId, rankPrice);
                });
            });
            
            // Add event listeners for add to cart buttons
            const addToCartButtons = grid.querySelectorAll('.add-to-cart-btn');
            addToCartButtons.forEach(button => {
                button.addEventListener('click', (event) => {
                    const rankId = event.currentTarget.getAttribute('data-rank-id');
                    const rankName = event.currentTarget.getAttribute('data-rank-name');
                    const rankPrice = parseFloat(event.currentTarget.getAttribute('data-rank-price'));
                    
                    // Add to cart
                    if (typeof addToCart === 'function') {
                        addToCart({
                            id: rankId,
                            name: rankName,
                            price: rankPrice,
                            type: 'rank'
                        });
                    } else {
                        console.error('addToCart function not found');
                    }
                });
            });
            
            // Add feature tooltips for mobile
            if (isMobile) {
                const featureItems = grid.querySelectorAll('.rank-features li');
                featureItems.forEach(item => {
                    item.addEventListener('click', function() {
                        // Remove active class from all items
                        featureItems.forEach(i => i.classList.remove('active'));
                        // Add active class to clicked item
                        this.classList.add('active');
                    });
                });
            }
            
            // Dispatch event to notify that ranks have been loaded
            document.dispatchEvent(new CustomEvent('ranksLoaded'));
        }, 0);
        
        // Add resize listener to adjust grid classes
        window.addEventListener('resize', () => {
            const isMobileNow = window.innerWidth <= 768;
            if (isMobileNow) {
                grid.classList.add('rank-grid-mobile');
            } else {
                grid.classList.remove('rank-grid-mobile');
            }
        });
        
        return grid;
    }

    generateUpgradeContent(upgrades) {
        const grid = document.createElement('div');
        grid.className = 'rank-grid';
        
        // Add responsive class for small screens
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            grid.classList.add('rank-grid-mobile');
        }
        
        upgrades.forEach(upgrade => {
            const upgradeId = `${this.formatId(upgrade.from)}-to-${this.formatId(upgrade.to)}`;
            const card = document.createElement('div');
            card.className = `rank-card upgrade ${this.formatClassName(upgrade.from)}-to-${this.formatClassName(upgrade.to)}`;
            
            // Create mobile-optimized layout
            const featuresList = upgrade.features.map(feature => {
                const iconClass = getFeatureIcon(feature);
                return `<li><i class="fas ${iconClass}"></i> <span class="feature-text">${feature}</span></li>`;
            }).join('');
            
            card.innerHTML = `
                <div class="rank-header">
                    <i class="fas fa-arrow-up"></i>
                    <h3>${upgrade.from} ➔ ${upgrade.to}</h3>
                    <div class="rank-price">£${upgrade.price.toFixed(2)}</div>
                </div>
                <div class="rank-info">
                    <div class="rank-category">Rank Upgrade</div>
                    <ul class="rank-features">
                        ${featuresList}
                    </ul>
                    <div class="card-button-container">
                        <button class="universal-btn secondary add-to-cart-btn" data-upgrade-id="${upgradeId}" data-upgrade-name="${upgrade.from} to ${upgrade.to}" data-upgrade-price="${upgrade.price.toFixed(2)}">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
        
        // Add event listeners for purchase buttons
        setTimeout(() => {
            const purchaseButtons = grid.querySelectorAll('.purchase-btn');
            purchaseButtons.forEach(button => {
                button.addEventListener('click', (event) => {
                    const upgradeId = event.currentTarget.getAttribute('data-upgrade-id');
                    const upgradeName = event.currentTarget.getAttribute('data-upgrade-name');
                    const upgradePrice = parseFloat(event.currentTarget.getAttribute('data-upgrade-price'));
                    
                    // Call the purchaseUpgrade function from shop.js
                    purchaseUpgrade(upgradeId, upgradePrice);
                });
            });
            
            // Add event listeners for add to cart buttons
            const addToCartButtons = grid.querySelectorAll('.add-to-cart-btn');
            addToCartButtons.forEach(button => {
                button.addEventListener('click', (event) => {
                    const upgradeId = event.currentTarget.getAttribute('data-upgrade-id');
                    const upgradeName = event.currentTarget.getAttribute('data-upgrade-name');
                    const upgradePrice = parseFloat(event.currentTarget.getAttribute('data-upgrade-price'));
                    
                    // Add upgrade to cart
                    if (typeof addToCart === 'function') {
                        addToCart({
                            id: upgradeId,
                            name: upgradeName,
                            price: upgradePrice,
                            type: 'upgrade'
                        });
                    } else {
                        console.error('addToCart function not found');
                    }
                });
            });
            
            // Add feature tooltips for mobile
            if (isMobile) {
                const featureItems = grid.querySelectorAll('.rank-features li');
                featureItems.forEach(item => {
                    item.addEventListener('click', function() {
                        // Remove active class from all items
                        featureItems.forEach(i => i.classList.remove('active'));
                        // Add active class to clicked item
                        this.classList.add('active');
                    });
                });
            }
        }, 0);
        
        // Add resize listener to adjust grid classes
        window.addEventListener('resize', () => {
            const isMobileNow = window.innerWidth <= 768;
            if (isMobileNow) {
                grid.classList.add('rank-grid-mobile');
            } else {
                grid.classList.remove('rank-grid-mobile');
            }
        });
        
        return grid;
    }

    formatClassName(name) {
        return name.toLowerCase().replace(/\s+/g, '-');
    }

    formatId(name) {
        return name.toLowerCase().replace(/\s+/g, '-');
    }

    addTab(tabId, label, content) {
        // Create tab button
        const tabBtn = document.createElement('button');
        tabBtn.className = 'tab-btn';
        tabBtn.setAttribute('data-tab-id', tabId);
        tabBtn.textContent = label;

        // Create content container
        const contentDiv = document.createElement('div');
        contentDiv.className = 'tab-content';
        contentDiv.setAttribute('data-tab-id', tabId);
        
        // Check if content is a DOM element or a string
        if (content instanceof Node) {
            contentDiv.appendChild(content);
        } else {
            contentDiv.innerHTML = content;
        }
        
        contentDiv.style.display = 'none';

        // Store tab info
        this.tabs.set(tabId, {
            button: tabBtn,
            content: contentDiv
        });

        // Add to DOM
        this.tabNav.appendChild(tabBtn);
        this.tabContent.appendChild(contentDiv);

        // If this is the first tab or matches defaultTab, activate it
        if (this.tabs.size === 1 || tabId === this.options.defaultTab) {
            this.activateTab(tabId);
        }
    }

    activateTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        // Deactivate all tabs
        this.tabs.forEach((t) => {
            t.button.classList.remove(this.options.activeTabClass);
            t.content.style.display = 'none';
        });

        // Activate selected tab
        tab.button.classList.add(this.options.activeTabClass);
        tab.content.style.display = 'block';

        // Call onTabChange callback
        this.options.onTabChange(tabId);
        
        // Dispatch event to reinitialize tooltips for the newly displayed content
        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('ranksLoaded'));
        }, 50);
    }

    handleTabClick(event) {
        const tabBtn = event.target.closest('.tab-btn');
        if (!tabBtn) return;

        const tabId = tabBtn.getAttribute('data-tab-id');
        this.activateTab(tabId);
    }

    // Helper function to get category from rank name
    getCategory(rankName) {
        const serverwideRanks = ['Shadow Enchanter', 'Void Walker', 'Ethereal Warden', 'Astral Guardian'];
        return serverwideRanks.includes(rankName) ? 'Serverwide' : 'Towny';
    }
}
