document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize any home page functionality here
        console.log('Home page initialized');
        
        // Check if components are ready or wait for them
        if (document.querySelector('#rankSlideshow')) {
            console.log('Components already loaded, initializing features');
            initializeHomePageFeatures();
        } else {
            console.log('Waiting for components to load');
            document.addEventListener('components-loaded', function() {
                console.log('Components loaded event received, initializing features');
                setTimeout(initializeHomePageFeatures, 100); // Small delay to ensure DOM is ready
            });
        }
    } catch (error) {
        console.error('Error initializing home page:', error);
    }
});

// Initialize all home page features
function initializeHomePageFeatures() {
    try {
        // Check if slideshow elements exist
        const slideshow = document.getElementById('rankSlideshow');
        const indicators = document.getElementById('slideshowIndicators');
        const prevBtn = document.getElementById('prevRankBtn');
        const nextBtn = document.getElementById('nextRankBtn');
        
        console.log('Slideshow elements found:', {
            slideshow: !!slideshow,
            indicators: !!indicators,
            prevBtn: !!prevBtn,
            nextBtn: !!nextBtn
        });
        
        // Setup copy IP button
        setupCopyIpButton();
        
        // Initialize the ranks slideshow - this is enough to handle the ranks
        initRanksSlideshow();
        
        // Setup avatar preview
        setupAvatarPreview();
        
        // Update payment goal
        updatePaymentGoal();
        
        // Setup sidebar scroll behavior
        setupSidebarScroll();
        
        // Adjust grid spacing on the home page
        adjustHomePageGridSpacing();
    } catch (error) {
        console.error('Error in initializeHomePageFeatures:', error);
    }
}

// Setup copy IP button functionality
function setupCopyIpButton() {
    const copyIpBtn = document.getElementById('copyIpBtn');
    if (copyIpBtn) {
        copyIpBtn.addEventListener('click', () => {
            const serverIp = 'play.enderfall.com';
            
            // Copy to clipboard
            navigator.clipboard.writeText(serverIp)
                .then(() => {
                    // Show success message
                    const originalText = copyIpBtn.textContent;
                    copyIpBtn.textContent = 'IP Copied!';
                    copyIpBtn.classList.add('copied');
                    
                    // Reset button text after 2 seconds
                    setTimeout(() => {
                        copyIpBtn.textContent = originalText;
                        copyIpBtn.classList.remove('copied');
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy IP: ', err);
                    
                    // Fallback for browsers that don't support clipboard API
                    fallbackCopyTextToClipboard(serverIp);
                });
        });
    }
}

// Load featured ranks from the same data source as the shop
function loadFeaturedRanks() {
    console.log('Loading featured ranks...');
    // Featured ranks data (same as in tab-bar.js)
    const featuredRanks = [
        // First serverwide rank
        {
            name: 'Shadow Enchanter',
            price: 9.99,
            icon: 'fa-hat-wizard',
            features: [
                'Access to /fly command',
                '3 /sethome locations',
                'Colored chat messages',
                'Special chat prefix'
            ],
            category: 'Serverwide',
            position: 'Starter'
        },
        // Last serverwide rank
        {
            name: 'Astral Guardian',
            price: 39.99,
            icon: 'fa-sun',
            features: [
                'All Ethereal Warden features',
                'Access to /nick',
                '10 /sethome locations',
                'Custom particle trails'
            ],
            category: 'Serverwide',
            position: 'Ultimate'
        },
        // First towny rank
        {
            name: 'Citizen',
            price: 4.99,
            icon: 'fa-user',
            features: [
                'Create and join towns',
                'Basic town permissions',
                'Town chat access',
                'Town spawn access'
            ],
            category: 'Towny',
            position: 'Starter'
        },
        // Last towny rank
        {
            name: 'Divine Ruler',
            price: 44.99,
            icon: 'fa-crown',
            features: [
                'All King features',
                'Divine powers',
                'Custom events',
                'Ultimate perks'
            ],
            category: 'Towny',
            position: 'Ultimate'
        }
    ];

    // Get the container element
    const featuredRanksContainer = document.getElementById('rankSlideshow');
    if (!featuredRanksContainer) {
        console.error('Featured ranks container not found with ID "rankSlideshow"');
        return;
    }
    
    console.log('Found featured ranks container:', featuredRanksContainer);
    
    // Clear the container
    featuredRanksContainer.innerHTML = '';
    
    // Add each rank slide
    featuredRanks.forEach((rank, index) => {
        const slide = document.createElement('div');
        slide.className = `rank-slide ${index === 0 ? 'active' : ''}`;
        
        // Create mobile-optimized layout for features
        const featuresList = rank.features.map(feature => {
            const iconClass = getFeatureIcon(feature);
            return `<li><i class="fas ${iconClass}"></i> <span class="feature-text">${feature}</span></li>`;
        }).join('');

        slide.innerHTML = `
            <div class="rank-card ${formatClassName(rank.name)}">
                <div class="rank-header">
                    <i class="fas ${rank.icon}"></i>
                    <h3>${rank.name}</h3>
                    <div class="rank-price">£${rank.price.toFixed(2)}</div>
                </div>
                <div class="rank-info">
                    <div class="rank-category">${rank.category} Rank</div>
                    <div class="rank-position">${rank.position} Tier</div>
                    <ul class="rank-features">
                        ${featuresList}
                    </ul>
                    <button class="universal-btn secondary" onclick="window.location.href='/shop.html'">Purchase</button>
                </div>
            </div>
        `;

        featuredRanksContainer.appendChild(slide);
    });
    
    // Create or update indicators
    const indicators = document.getElementById('slideshowIndicators');
    if (indicators) {
        indicators.innerHTML = '';
        featuredRanks.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = `slideshow-indicator ${index === 0 ? 'active' : ''}`;
            indicator.addEventListener('click', () => {
                const slides = featuredRanksContainer.querySelectorAll('.rank-slide');
                
                // Hide all slides and deactivate indicators
                slides.forEach(s => s.classList.remove('active'));
                indicators.querySelectorAll('.slideshow-indicator').forEach(i => i.classList.remove('active'));
                
                // Show selected slide and activate indicator
                slides[index].classList.add('active');
                indicator.classList.add('active');
            });
            
            indicators.appendChild(indicator);
        });
    }
    
    // Setup navigation buttons
    const prevBtn = document.getElementById('prevRankBtn');
    const nextBtn = document.getElementById('nextRankBtn');
    
    if (prevBtn && nextBtn) {
        let currentSlide = 0;
        
        prevBtn.addEventListener('click', () => {
            const slides = featuredRanksContainer.querySelectorAll('.rank-slide');
            const dots = indicators ? indicators.querySelectorAll('.slideshow-indicator') : [];
            
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            
            // Update slides
            slides.forEach(s => s.classList.remove('active'));
            slides[currentSlide].classList.add('active');
            
            // Update indicators
            if (dots.length > 0) {
                dots.forEach(d => d.classList.remove('active'));
                dots[currentSlide].classList.add('active');
            }
        });
        
        nextBtn.addEventListener('click', () => {
            const slides = featuredRanksContainer.querySelectorAll('.rank-slide');
            const dots = indicators ? indicators.querySelectorAll('.slideshow-indicator') : [];
            
            currentSlide = (currentSlide + 1) % slides.length;
            
            // Update slides
            slides.forEach(s => s.classList.remove('active'));
            slides[currentSlide].classList.add('active');
            
            // Update indicators
            if (dots.length > 0) {
                dots.forEach(d => d.classList.remove('active'));
                dots[currentSlide].classList.add('active');
            }
        });
    }
    
    console.log('Featured ranks loaded successfully');
    
    // Dispatch event to notify that ranks have been loaded
    document.dispatchEvent(new CustomEvent('ranksLoaded'));
}

// Helper function to format class names
function formatClassName(name) {
    return name.toLowerCase().replace(/\s+/g, '-');
}

// Fallback copy to clipboard method for older browsers
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea out of viewport
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        const copyIpBtn = document.getElementById('copyIpBtn');
        
        if (successful && copyIpBtn) {
            const originalText = copyIpBtn.textContent;
            copyIpBtn.textContent = 'IP Copied!';
            copyIpBtn.classList.add('copied');
            
            // Reset button text after 2 seconds
            setTimeout(() => {
                copyIpBtn.textContent = originalText;
                copyIpBtn.classList.remove('copied');
            }, 2000);
        }
    } catch (err) {
        console.error('Fallback: Could not copy text: ', err);
    }
    
    document.body.removeChild(textArea);
}

// Setup avatar preview functionality
function setupAvatarPreview() {
    const linkAccountBtn = document.getElementById('linkAccountBtn');
    const previewControls = document.getElementById('previewControls');
    const previewRankSelect = document.getElementById('previewRankSelect');
    const avatarPreview = document.getElementById('avatarPreview');
    const linkInfo = document.querySelector('.link-info');
    const avatarPlaceholder = document.querySelector('.avatar-placeholder');

    console.log('Setting up avatar preview');

    if (!avatarPreview) return;

    // Initialize the rank select dropdown
    if (previewRankSelect) {
        // Preview rank select change handler
        previewRankSelect.addEventListener('change', (event) => {
            console.log('Rank select changed to:', event.target.value);
            updateAvatarPreview(event.target.value);
        });
    }

    // Wait a short delay to ensure auth state is initialized
    setTimeout(() => {
        // Check if user is logged out explicitly
        const loggedOut = localStorage.getItem('logged_out') === 'true';
        if (loggedOut) {
            // User is explicitly logged out, show login UI
            if (linkAccountBtn) {
                linkAccountBtn.style.display = 'flex';
                linkAccountBtn.innerHTML = '<i class="fab fa-discord"></i> Login with Discord';
                linkAccountBtn.onclick = () => {
                    const baseUrl = getBaseUrl();
                    window.location.href = `${baseUrl}/auth/discord`;
                };
            }
            if (linkInfo) {
                linkInfo.textContent = 'Login with Discord to view and customize your Minecraft avatar.';
                linkInfo.style.display = 'block';
            }
            if (previewControls) previewControls.style.display = 'none';
            return;
        }

        // Check if we have a user menu (indicating logged in state)
        const userMenu = document.querySelector('.user-menu');
        const isUserMenuVisible = userMenu && 
            (window.getComputedStyle(userMenu).display !== 'none' ||
             userMenu.offsetParent !== null);

        if (isUserMenuVisible) {
            // User is logged in, fetch their data from the API
            fetch('/api/user')
                .then(response => response.json())
                .then(userData => {
                    if (userData.minecraft_username) {
                        // User has a linked Minecraft account, show the avatar
                        showMinecraftAvatar(userData.minecraft_username);
                        if (previewControls) previewControls.style.display = 'block';
                        if (linkAccountBtn) linkAccountBtn.style.display = 'none';
                        if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
                        if (linkInfo) linkInfo.style.display = 'none';
                    } else {
                        // User is logged in but doesn't have a linked Minecraft account
                        if (linkAccountBtn) {
                            linkAccountBtn.style.display = 'flex';
                            linkAccountBtn.innerHTML = '<i class="fas fa-link"></i> Link Minecraft Account';
                            linkAccountBtn.onclick = () => {
                                const baseUrl = getBaseUrl();
                                window.location.href = `${baseUrl}/profile.html?tab=settings&action=link-minecraft`;
                            };
                        }
                        if (linkInfo) {
                            linkInfo.textContent = 'Link your Minecraft account in your profile settings to see your avatar here.';
                            linkInfo.style.display = 'block';
                        }
                        if (previewControls) previewControls.style.display = 'none';
                    }
                })
                .catch(error => {
                    console.error('Error fetching user data:', error);
                    // Show error state
                    if (linkAccountBtn) {
                        linkAccountBtn.style.display = 'flex';
                        linkAccountBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error Loading Data';
                    }
                    if (linkInfo) {
                        linkInfo.textContent = 'There was an error loading your profile data. Please try again later.';
                        linkInfo.style.display = 'block';
                    }
                    if (previewControls) previewControls.style.display = 'none';
                });
        } else {
            console.log('User appears to be logged out');
            // User is not logged in with Discord
            if (linkAccountBtn) {
                linkAccountBtn.style.display = 'flex';
                linkAccountBtn.innerHTML = '<i class="fab fa-discord"></i> Login with Discord';
                linkAccountBtn.onclick = () => {
                    const baseUrl = getBaseUrl();
                    window.location.href = `${baseUrl}/auth/discord`;
                };
            }
            if (linkInfo) {
                linkInfo.textContent = 'Login with Discord to view and customize your Minecraft avatar.';
                linkInfo.style.display = 'block';
            }
            if (previewControls) previewControls.style.display = 'none';
        }
    }, 500); // Add delay to ensure DOM is fully loaded
}

// Show Minecraft avatar with the given username
function showMinecraftAvatar(username = 'MHF_Steve') {
    if (!username || username.trim() === '') {
        console.warn('No username provided for Minecraft avatar');
        username = 'MHF_Steve';
    }
    
    console.log('Showing Minecraft avatar for:', username);
    
    const avatarPreview = document.getElementById('avatarPreview');
    if (!avatarPreview) return;
    
    // Clear placeholder
    avatarPreview.innerHTML = '';
    
    // Create name tag
    const nameTag = document.createElement('div');
    nameTag.className = 'minecraft-nametag';
    nameTag.innerHTML = `<span class="username">${username}</span>`;
    nameTag.id = 'minecraftNameTag';
    
    // Create avatar image
    const img = document.createElement('img');
    img.src = `https://mc-heads.net/body/${username}`;
    img.alt = 'Minecraft Avatar';
    img.id = 'avatarImage';
    img.onerror = () => {
        // If the avatar fails to load, use a default avatar
        img.src = 'https://mc-heads.net/body/MHF_Steve';
    };
    
    avatarPreview.appendChild(nameTag);
    avatarPreview.appendChild(img);
    
    // Show the preview controls
    const previewControls = document.getElementById('previewControls');
    if (previewControls) {
        previewControls.style.display = 'block';
    }
    
    // Hide the placeholder and link info
    const avatarPlaceholder = document.querySelector('.avatar-placeholder');
    const linkInfo = document.querySelector('.link-info');
    if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
    if (linkInfo) linkInfo.style.display = 'none';
    
    // Hide the link account button
    const linkAccountBtn = document.getElementById('linkAccountBtn');
    if (linkAccountBtn) linkAccountBtn.style.display = 'none';
    
    // Get the current selected rank from the dropdown
    const previewRankSelect = document.getElementById('previewRankSelect');
    let selectedRank = 'none';
    if (previewRankSelect && previewRankSelect.value) {
        selectedRank = previewRankSelect.value;
    }
    
    // Initialize with the selected rank or no rank
    setTimeout(() => {
        updateAvatarPreview(selectedRank);
    }, 100);
    
    console.log('Minecraft avatar displayed for:', username);
}

// Update avatar preview with selected rank
function updateAvatarPreview(rankId) {
    const avatarImage = document.getElementById('avatarImage');
    const nameTag = document.getElementById('minecraftNameTag');
    if (!avatarImage || !nameTag) return;
    
    console.log('Updating avatar preview with rank:', rankId);
    
    // Get username from the name tag
    let username = 'MHF_Steve';
    if (nameTag && nameTag.querySelector('.username')) {
        username = nameTag.querySelector('.username').textContent;
    }
    
    // Remove all previous rank preview classes
    avatarImage.className = '';
    
    // Reset styles
    
    // Add a class to the avatar based on the rank
    if (rankId !== 'none') {
        // Apply the CSS class for the rank preview
        avatarImage.classList.add(`${rankId}-preview`);
        
        // Get rank colors for direct style application
        const rankColors = {
            'shadow-enchanter': 'var(--rank-shadow)',
            'void-walker': 'var(--rank-void)',
            'ethereal-warden': 'var(--rank-ethereal)',
            'astral-guardian': 'var(--rank-astral)',
            'citizen': 'var(--rank-citizen)',
            'merchant': 'var(--rank-merchant)',
            'councilor': 'var(--rank-councilor)',
            'mayor': 'var(--rank-mayor)',
            'governor': 'var(--rank-governor)',
            'noble': 'var(--rank-noble)',
            'duke': 'var(--rank-duke)',
            'king': 'var(--rank-king)',
            'divine-ruler': 'var(--rank-divine)'
        };
        
        // Apply styles directly to ensure they take effect
        const rankColor = rankColors[rankId];
        if (rankColor) {
            avatarImage.style.boxShadow = `0 0 15px 5px ${rankColor}`;
            avatarImage.style.border = `2px solid ${rankColor}`;
            avatarImage.style.borderRadius = '5px';
        }
    }
    
    // Update name tag with rank prefix
    if (nameTag) {
        if (rankId === 'none') {
            nameTag.innerHTML = `<span class="username">${username}</span>`;
        } else {
            // Get rank display name
            const rankDisplayNames = {
                'shadow-enchanter': 'Shadow',
                'void-walker': 'Void',
                'ethereal-warden': 'Ethereal',
                'astral-guardian': 'Astral',
                'citizen': 'Citizen',
                'merchant': 'Merchant',
                'councilor': 'Councilor',
                'mayor': 'Mayor',
                'governor': 'Governor',
                'noble': 'Noble',
                'duke': 'Duke',
                'king': 'King',
                'divine-ruler': 'Divine'
            };
            
            const rankName = rankDisplayNames[rankId] || rankId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            // Update name tag with rank prefix
            nameTag.innerHTML = `<span class="rank-prefix ${rankId}-prefix">[${rankName}]</span> <span class="username">${username}</span>`;
        }
    }
    
    // Update the dropdown to match the selected rank
    const previewRankSelect = document.getElementById('previewRankSelect');
    if (previewRankSelect && previewRankSelect.value !== rankId) {
        previewRankSelect.value = rankId;
    }
    
    console.log('Avatar preview updated with rank:', rankId);
}

// Update payment goal display
async function updatePaymentGoal() {
    try {
        // In a real implementation, this would fetch the current payment goal from the server
        // For now, we'll use a hardcoded value
        const response = await fetch('/api/payment-goal').catch(() => null);
        
        if (response && response.ok) {
            const data = await response.json();
            const progressFill = document.querySelector('.progress-fill');
            const progressText = document.querySelector('.progress-text');
            
            if (progressFill && progressText && data) {
                const percentage = Math.min(100, Math.max(0, data.percentage));
                progressFill.style.width = `${percentage}%`;
                progressText.textContent = `${percentage}% Complete`;
            }
        } else {
            // Use default values if API is not available
            console.log('Using default payment goal values');
        }
    } catch (error) {
        console.error('Error updating payment goal:', error);
        // Silently fail - the default values in HTML will be used
    }
}

// Setup sidebar scroll behavior
function setupSidebarScroll() {
    console.log('Setting up home page sidebar as static (non-scrolling)');
    
    const sidebar = document.querySelector('.avatar-preview-section');
    
    if (!sidebar) {
        console.error('Missing sidebar element for home page');
        return;
    }
    
    // Set sidebar to be static with appropriate styling
    sidebar.style.position = 'static'; // Static positioning so it scrolls with page
    sidebar.style.width = '100%'; // Full width of its container
    sidebar.style.maxWidth = '280px'; // Match the previous fixed width
    sidebar.style.margin = '0'; // No margin
    sidebar.style.marginTop = '24px'; // Add top margin to fix positioning
    sidebar.style.maxHeight = 'none'; // Remove max height restriction
    sidebar.style.overflowY = 'visible'; // Allow content to determine height
    
    // Remove any fixed positioning styles
    sidebar.style.top = 'auto';
    sidebar.style.right = 'auto';
    
    console.log('Home page sidebar set to static positioning');
}

// Adjust grid spacing on the home page to match the sidebar spacing
function adjustHomePageGridSpacing() {
    // Target all tab-bar sections on the home page
    const tabSections = document.querySelectorAll('.home-page .tab-bar');
    if (!tabSections || tabSections.length === 0) return;
    
    // Add margin to all sections except the first one to create consistent spacing
    for (let i = 1; i < tabSections.length; i++) {
        tabSections[i].style.marginTop = '0px';
    }
    
    // Set consistent gap for grids - using a smaller gap to match the image
    const grids = document.querySelectorAll('.home-page .grid');
    grids.forEach(grid => {
        grid.style.gap = '16px';
    });
    
    // Set gap for featured ranks grid
    const rankGrid = document.querySelector('.home-page .home-rank-grid');
    if (rankGrid) {
        rankGrid.style.gap = '16px';
    }
    
    console.log('Home page grid spacing adjusted');
}

// Initialize the ranks slideshow in the sidebar
function initRanksSlideshow() {
    console.log('initRanksSlideshow started');

    // Featured ranks data - only include first and last ranks from each category
    const featuredRanks = [
        // Shadow Enchanter (First Serverwide Rank)
        {
            name: 'Shadow Enchanter',
            price: 9.99,
            icon: 'fa-hat-wizard',
            features: [
                'Access to /fly command',
                '3 /sethome locations',
                'Colored chat messages',
                'Special chat prefix'
            ],
            category: 'Serverwide',
            position: 'Starter',
            class: 'shadow-enchanter'
        },
        // Astral Guardian (Last Serverwide Rank)
        {
            name: 'Astral Guardian',
            price: 39.99,
            icon: 'fa-sun',
            features: [
                'All Ethereal Warden features',
                'Access to /nick',
                '10 /sethome locations',
                'Custom particle trails'
            ],
            category: 'Serverwide',
            position: 'Ultimate',
            class: 'astral-guardian'
        },
        // Citizen (First Towny Rank)
        {
            name: 'Citizen',
            price: 4.99,
            icon: 'fa-user',
            features: [
                'Create and join towns',
                'Basic town permissions',
                'Town chat access',
                'Town spawn access'
            ],
            category: 'Towny',
            position: 'Starter',
            class: 'citizen'
        },
        // Divine Ruler (Last Towny Rank)
        {
            name: 'Divine Ruler',
            price: 44.99,
            icon: 'fa-crown',
            features: [
                'All King features',
                'Divine powers',
                'Custom events',
                'Ultimate perks'
            ],
            category: 'Towny',
            position: 'Ultimate',
            class: 'divine-ruler'
        }
    ];

    const slideshow = document.getElementById('rankSlideshow');
    console.log('Slideshow element found:', !!slideshow);
    
    const indicators = document.getElementById('slideshowIndicators');
    console.log('Indicators element found:', !!indicators);
    
    const prevBtn = document.getElementById('prevRankBtn');
    console.log('Previous button found:', !!prevBtn);
    
    const nextBtn = document.getElementById('nextRankBtn');
    console.log('Next button found:', !!nextBtn);
    
    if (!slideshow || !indicators || !prevBtn || !nextBtn) {
        console.error('Slideshow elements not found', {
            slideshow: slideshow,
            indicators: indicators,
            prevBtn: prevBtn,
            nextBtn: nextBtn
        });
        return;
    }
    
    // Clear loading state
    console.log('Clearing slideshow contents');
    slideshow.innerHTML = '';
    
    let currentSlide = 0;
    
    // Create slides for each rank
    console.log('Creating slides for ranks');
    featuredRanks.forEach((rank, index) => {
        const slide = document.createElement('div');
        slide.className = `rank-slide ${index === 0 ? 'active' : ''}`;
        
        // Get appropriate feature icons for each feature
        const featuresList = rank.features.map(feature => {
            const iconClass = getFeatureIcon(feature);
            return `<li><i class="fas ${iconClass}"></i> <span class="feature-text">${feature}</span></li>`;
        }).join('');
        
        slide.innerHTML = `
            <div class="rank-card ${rank.class}">
                <div class="rank-header">
                    <i class="fas ${rank.icon}"></i>
                    <h3>${rank.name}</h3>
                    <div class="rank-price">£${rank.price.toFixed(2)}</div>
                </div>
                <div class="rank-info">
                    <div class="rank-category">${rank.category} Rank</div>
                    <div class="rank-position">${rank.position} Tier</div>
                    <ul class="rank-features">
                        ${featuresList}
                    </ul>
                    <div class="card-button-container">
                        <button class="universal-btn primary" onclick="window.location.href='/shop.html'">View Details</button>
                    </div>
                </div>
            </div>
        `;
        
        slideshow.appendChild(slide);
        console.log(`Added slide ${index + 1} for ${rank.name}`);
        
        // Create indicator
        const indicator = document.createElement('div');
        indicator.className = `slideshow-indicator ${index === 0 ? 'active' : ''}`;
        indicator.addEventListener('click', () => {
            goToSlide(index);
        });
        indicators.appendChild(indicator);
    });
    
    console.log('All slides created');
    
    // Function to go to a specific slide
    function goToSlide(slideIndex) {
        const slides = slideshow.querySelectorAll('.rank-slide');
        const dots = indicators.querySelectorAll('.slideshow-indicator');
        
        if (slides.length === 0 || dots.length === 0) return;
        
        // Hide all slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        
        // Deactivate all dots
        dots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        // Show the selected slide and activate dot
        slides[slideIndex].classList.add('active');
        dots[slideIndex].classList.add('active');
        
        currentSlide = slideIndex;
    }
    
    // Next slide function
    function nextSlide() {
        const slides = slideshow.querySelectorAll('.rank-slide');
        if (slides.length === 0) return;
        
        currentSlide = (currentSlide + 1) % slides.length;
        goToSlide(currentSlide);
    }
    
    // Previous slide function
    function prevSlide() {
        const slides = slideshow.querySelectorAll('.rank-slide');
        if (slides.length === 0) return;
        
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        goToSlide(currentSlide);
    }
    
    // Add event listeners
    console.log('Adding button event listeners');
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);
    
    // Auto-advance slides every 5 seconds
    let slideInterval = setInterval(nextSlide, 5000);
    
    // Pause slideshow on hover
    slideshow.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });
    
    // Resume slideshow on mouse leave
    slideshow.addEventListener('mouseleave', () => {
        slideInterval = setInterval(nextSlide, 5000);
    });
    
    console.log('Ranks slideshow initialization complete');
}

// Helper function to determine the appropriate icon for a feature
function getFeatureIcon(feature) {
    const feature_lower = feature.toLowerCase();
    
    if (feature_lower.includes('fly')) return 'fa-feather-alt';
    if (feature_lower.includes('home')) return 'fa-home';
    if (feature_lower.includes('chat')) return 'fa-comment';
    if (feature_lower.includes('prefix')) return 'fa-tag';
    if (feature_lower.includes('enderchest')) return 'fa-box';
    if (feature_lower.includes('workbench')) return 'fa-tools';
    if (feature_lower.includes('nick')) return 'fa-user-edit';
    if (feature_lower.includes('particle')) return 'fa-magic';
    if (feature_lower.includes('town')) return 'fa-city';
    if (feature_lower.includes('spawn')) return 'fa-map-marker-alt';
    if (feature_lower.includes('create')) return 'fa-plus-circle';
    if (feature_lower.includes('join')) return 'fa-sign-in-alt';
    if (feature_lower.includes('power')) return 'fa-bolt';
    if (feature_lower.includes('event')) return 'fa-calendar-alt';
    if (feature_lower.includes('perk')) return 'fa-gift';
    if (feature_lower.includes('priority')) return 'fa-star';
    if (feature_lower.includes('access')) return 'fa-unlock';
    
    // Default icon
    return 'fa-check-circle';
}

// Toast notification function with close button
function showToast(message, type = 'info') {
    // Import and use the new toast component if it's available
    if (typeof window.showToast === 'function' && window.showToast !== showToast) {
        return window.showToast(message, type);
    }
    
    // Get or create toast container
    const container = document.querySelector('.toast-container') || createToastContainer();
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Create icon element
    const icon = document.createElement('i');
    icon.className = getToastIcon(type);
    toast.appendChild(icon);
    
    // Create message span
    const messageSpan = document.createElement('span');
    messageSpan.className = 'toast-message';
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'toast-close';
    closeBtn.addEventListener('click', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
    toast.appendChild(closeBtn);
    
    // Add to container
    container.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
        
        // Auto dismiss after 3 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
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