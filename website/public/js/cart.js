// Cart functionality for the shop
class ShoppingCart {
    constructor() {
        this.items = [];
        this.loadCart();
        this.updateCartUI();
        this.setupButtonHandlers();
        this.clearInProgress = false; // Flag to prevent multiple clear operations
    }

    // Load cart from localStorage
    loadCart() {
        const savedCart = localStorage.getItem('enderfall_cart');
        if (savedCart) {
            try {
                this.items = JSON.parse(savedCart);
                console.log('Cart loaded from localStorage:', this.items);
            } catch (e) {
                console.error('Error loading cart:', e);
                this.items = [];
            }
        }
    }

    // Save cart to localStorage
    saveCart() {
        localStorage.setItem('enderfall_cart', JSON.stringify(this.items));
    }

    // Setup button event handlers
    setupButtonHandlers() {
        console.log('Setting up cart button handlers');
        
        // Setup clear cart button - remove existing listeners first
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            // Remove existing click handlers by cloning the button
            const newClearBtn = clearCartBtn.cloneNode(true);
            clearCartBtn.parentNode.replaceChild(newClearBtn, clearCartBtn);
            
            // Add a single new click listener
            newClearBtn.addEventListener('click', () => {
                console.log('Clear cart button clicked from cart instance');
                this.clearCart();
            });
        }

        // Setup checkout button - remove existing listeners first
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            // Remove existing click handlers by cloning the button
            const newCheckoutBtn = checkoutBtn.cloneNode(true);
            checkoutBtn.parentNode.replaceChild(newCheckoutBtn, checkoutBtn);
            
            // Add a single new click listener
            newCheckoutBtn.addEventListener('click', () => {
                console.log('Checkout button clicked from cart instance');
                this.checkout();
            });
        }

        // Setup cart toggle button
        const cartToggleBtn = document.getElementById('cartToggleBtn');
        const cartPanel = document.getElementById('cartPanel');
        if (cartToggleBtn && cartPanel) {
            // Remove existing click handlers by cloning the button
            const newToggleBtn = cartToggleBtn.cloneNode(true);
            cartToggleBtn.parentNode.replaceChild(newToggleBtn, cartToggleBtn);
            
            // Add a single new click listener
            newToggleBtn.addEventListener('click', () => {
                cartPanel.classList.toggle('cart-open');
            });
        }
    }

    // Add item to cart
    addItem(item) {
        // Check if item already exists in cart
        const existingItem = this.items.find(i => 
            i.id === item.id && 
            i.type === item.type && 
            i.name === item.name
        );

        if (existingItem) {
            // Show message that item is already in cart
            showToast(`${item.name} is already in your cart`, 'info');
            return false;
        }

        // Add the item
        this.items.push(item);
        this.saveCart();
        this.updateCartUI();
        showToast(`Added ${item.name} to your cart`, 'success');
        return true;
    }

    // Remove item from cart
    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            const removedItem = this.items[index];
            this.items.splice(index, 1);
            this.saveCart();
            this.updateCartUI();
            showToast(`Removed ${removedItem.name} from your cart`, 'info');
            return true;
        }
        return false;
    }

    // Clear all items from cart
    clearCart() {
        // Prevent multiple clear operations
        if (this.clearInProgress) {
            console.log('Clear operation already in progress, ignoring duplicate call');
            return;
        }
        
        this.clearInProgress = true;
        console.log('Clearing cart');
        
        // Only show toast if there were actually items to clear
        const hadItems = this.items.length > 0;
        
        this.items = [];
        this.saveCart();
        this.updateCartUI();
        
        if (hadItems) {
            showToast('Your cart has been cleared', 'info');
        }
        
        // Reset flag after a short delay
        setTimeout(() => {
            this.clearInProgress = false;
        }, 500);
    }

    // Get cart total
    getTotal() {
        return this.items.reduce((total, item) => total + item.price, 0);
    }

    // Update cart UI
    updateCartUI() {
        const cartContainer = document.getElementById('cartContainer');
        const cartBadge = document.getElementById('cartBadge');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        const emptyCartMessage = document.getElementById('emptyCartMessage');
        const checkoutBtn = document.getElementById('checkoutBtn');
        
        if (!cartContainer) {
            console.log('Cart container not found, will try again later');
            // If cart container doesn't exist yet, try again later
            setTimeout(() => this.updateCartUI(), 500);
            return;
        }

        console.log('Updating cart UI with', this.items.length, 'items');

        // Update cart badge
        if (cartBadge) {
            if (this.items.length > 0) {
                cartBadge.textContent = this.items.length;
                cartBadge.style.display = 'flex';
            } else {
                cartBadge.style.display = 'none';
            }
        }

        // Update cart items list
        if (cartItems) {
            cartItems.innerHTML = '';
            
            this.items.forEach((item, index) => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                
                // Get icon based on item type
                let icon = 'fa-crown';
                if (item.type === 'upgrade') {
                    icon = 'fa-arrow-up';
                }
                
                cartItem.innerHTML = `
                    <div class="cart-item-info">
                        <span class="cart-item-name">
                            <i class="fas ${icon}"></i> ${item.name}
                        </span>
                        <span class="cart-item-price">£${item.price.toFixed(2)}</span>
                    </div>
                    <button class="cart-remove-btn" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                cartItems.appendChild(cartItem);
            });
            
            // Add event listeners to remove buttons
            const removeButtons = cartItems.querySelectorAll('.cart-remove-btn');
            removeButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const index = parseInt(e.currentTarget.getAttribute('data-index'));
                    this.removeItem(index);
                });
            });
        }

        // Update cart total
        if (cartTotal) {
            cartTotal.textContent = `£${this.getTotal().toFixed(2)}`;
        }

        // Show/hide empty cart message
        if (emptyCartMessage) {
            emptyCartMessage.style.display = this.items.length === 0 ? 'block' : 'none';
        }

        // Enable/disable checkout button
        if (checkoutBtn) {
            checkoutBtn.disabled = this.items.length === 0;
        }
    }

    // Checkout process
    checkout() {
        console.log('Checkout method called');
        if (this.items.length === 0) {
            showToast('Your cart is empty', 'warning');
            return;
        }
        
        // Open checkout modal or redirect to checkout page
        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) {
            console.log('Preparing checkout modal');
            // Update checkout details in modal
            const checkoutItems = document.getElementById('checkoutItems');
            const checkoutTotal = document.getElementById('checkoutTotal');
            
            if (checkoutItems) {
                checkoutItems.innerHTML = '';
                
                this.items.forEach(item => {
                    const checkoutItem = document.createElement('div');
                    checkoutItem.className = 'checkout-item';
                    
                    checkoutItem.innerHTML = `
                        <span class="checkout-item-name">${item.name}</span>
                        <span class="checkout-item-price">£${item.price.toFixed(2)}</span>
                    `;
                    
                    checkoutItems.appendChild(checkoutItem);
                });
            }
            
            if (checkoutTotal) {
                checkoutTotal.textContent = `£${this.getTotal().toFixed(2)}`;
            }
            
            // Set up the complete purchase button
            const completeBtn = checkoutModal.querySelector('.universal-btn.primary');
            if (completeBtn) {
                // Remove any existing click listeners
                const newBtn = completeBtn.cloneNode(true);
                completeBtn.parentNode.replaceChild(newBtn, completeBtn);
                
                // Add new click listener
                newBtn.addEventListener('click', () => {
                    console.log('Complete purchase button clicked');
                    window.processCheckout();
                });
            }
            
            console.log('Showing checkout modal');
            checkoutModal.style.display = 'flex';
        } else {
            console.warn('Checkout modal not found');
            // Redirect to checkout page if no modal
            window.location.href = '/checkout.html';
        }
    }
}

// Initialize cart as a global variable
let cart;

// Initialize cart immediately when script loads
(function initCart() {
    if (!cart) {
        cart = new ShoppingCart();
        console.log('Cart initialized immediately');
    }
})();

// Also initialize when DOM is loaded (as a backup)
document.addEventListener('DOMContentLoaded', () => {
    if (!cart) {
        cart = new ShoppingCart();
        console.log('Cart initialized on DOMContentLoaded');
    } else {
        // If cart exists but components weren't ready previously, update UI now
        cart.updateCartUI();
        console.log('Cart UI updated on DOMContentLoaded');
    }
});

// For components loaded via AJAX or dynamic injection
window.addEventListener('load', () => {
    if (cart) {
        // Update the cart UI once everything is loaded
        setTimeout(() => {
            cart.updateCartUI();
            console.log('Cart UI updated on window load');
            
            // Ensure event handlers are set up once
            setTimeout(() => {
                cart.setupButtonHandlers();
            }, 300);
        }, 500);
    }
});

// Add item to cart function for use in other files
function addToCart(item) {
    if (cart) {
        return cart.addItem(item);
    }
    return false;
} 