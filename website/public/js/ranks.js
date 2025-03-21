// Sample rank data - in production, this would come from your backend
const ranks = [
    {
        id: 1,
        name: 'VIP',
        price: 9.99,
        color: '#FFC107',
        description: 'Access to basic VIP features and commands',
        features: [
            'Colored chat prefix',
            '/fly command in lobby',
            'Access to VIP-only areas',
            '2x experience gain'
        ],
        icon: 'fa-star'
    },
    {
        id: 2,
        name: 'MVP',
        price: 19.99,
        color: '#2196F3',
        description: 'Enhanced features and exclusive perks',
        features: [
            'All VIP features',
            'Custom join messages',
            'Pet system access',
            'Priority server access',
            '3x experience gain'
        ],
        icon: 'fa-crown'
    },
    {
        id: 3,
        name: 'ELITE',
        price: 29.99,
        color: '#9C27B0',
        description: 'Premium features and maximum benefits',
        features: [
            'All MVP features',
            'Particle effects',
            'Custom nickname colors',
            'Access to all mini-games',
            'Priority support',
            '4x experience gain'
        ],
        icon: 'fa-gem'
    }
];

// Render rank cards
function renderRankCards(container, ranks, showFullDetails = false) {
    container.innerHTML = ranks.map(rank => `
        <div class="rank-card" data-rank-id="${rank.id}">
            <div class="rank-header" style="background-color: ${rank.color}">
                <i class="fas ${rank.icon}"></i>
                <h3>${rank.name}</h3>
            </div>
            <div class="rank-content">
                <p class="rank-description">${rank.description}</p>
                ${showFullDetails ? `
                    <ul class="rank-features">
                        ${rank.features.map(feature => {
                            const iconClass = getFeatureIcon(feature);
                            return `<li><i class="fas ${iconClass}"></i> ${feature}</li>`;
                        }).join('')}
                    </ul>
                ` : ''}
                <div class="rank-price">$${rank.price.toFixed(2)}</div>
                <button class="purchase-btn" onclick="openPurchaseModal(${rank.id})">
                    Purchase
                </button>
            </div>
        </div>
    `).join('');
}

// Initialize rank display
function initializeRanks() {
    // For homepage preview
    const previewContainer = document.querySelector('.rank-preview-container');
    if (previewContainer) {
        // Show only first two ranks in preview
        renderRankCards(previewContainer, ranks.slice(0, 2), false);
    }

    // For shop page
    const shopContainer = document.querySelector('.ranks-container');
    if (shopContainer) {
        renderRankCards(shopContainer, ranks, true);
    }
}

// Search and filter ranks
function searchRanks(query) {
    const filteredRanks = ranks.filter(rank => 
        rank.name.toLowerCase().includes(query.toLowerCase()) ||
        rank.description.toLowerCase().includes(query.toLowerCase())
    );
    const container = document.querySelector('.ranks-container');
    renderRankCards(container, filteredRanks, true);
}

// Sort ranks
function sortRanks(sortType) {
    let sortedRanks = [...ranks];
    switch (sortType) {
        case 'price-asc':
            sortedRanks.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            sortedRanks.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            sortedRanks.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            sortedRanks.sort((a, b) => b.name.localeCompare(a.name));
            break;
    }
    const container = document.querySelector('.ranks-container');
    renderRankCards(container, sortedRanks, true);
}

// Purchase modal handling
function openPurchaseModal(rankId) {
    if (!isLoggedIn) {
        loginModal.style.display = 'block';
        return;
    }

    const rank = ranks.find(r => r.id === rankId);
    const rankModal = document.getElementById('rank-modal');
    const rankDetails = rankModal.querySelector('.rank-details');

    rankDetails.innerHTML = `
        <div class="rank-modal-header" style="background-color: ${rank.color}">
            <i class="fas ${rank.icon}"></i>
            <h2>${rank.name}</h2>
        </div>
        <div class="rank-modal-content">
            <p class="rank-description">${rank.description}</p>
            <ul class="rank-features">
                ${rank.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
            </ul>
            <div class="rank-price">$${rank.price.toFixed(2)}</div>
        </div>
    `;

    rankModal.style.display = 'block';
    
    // Set up checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.onclick = () => processPayment(rankId);
}

// Process payment
async function processPayment(rankId) {
    const rank = ranks.find(r => r.id === rankId);
    const username = document.getElementById('minecraft-username').value;
    const email = document.getElementById('email').value;

    if (!username || !email) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const response = await fetch('/api/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rankId,
                username,
                email,
                price: rank.price
            }),
        });

        if (response.ok) {
            alert(`Successfully purchased ${rank.name} rank! Please wait while we process your purchase.`);
            document.getElementById('rank-modal').style.display = 'none';
        } else {
            const error = await response.json();
            alert(error.message || 'Purchase failed');
        }
    } catch (error) {
        console.error('Purchase error:', error);
        alert('An error occurred during purchase');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeRanks();

    // Search functionality
    const searchInput = document.getElementById('rank-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => searchRanks(e.target.value));
    }

    // Sort functionality
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => sortRanks(e.target.value));
    }

    // Close rank modal
    const rankModal = document.getElementById('rank-modal');
    if (rankModal) {
        const closeBtn = rankModal.querySelector('.close');
        closeBtn.onclick = () => rankModal.style.display = 'none';
        
        window.onclick = (e) => {
            if (e.target === rankModal) {
                rankModal.style.display = 'none';
            }
        };
    }
});
