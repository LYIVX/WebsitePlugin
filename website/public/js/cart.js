// Cart functionality for the shop
class ShoppingCart {
    constructor() {
        this.items = [];
        this.loadCart();
        this.updateCartUI();
    }

    // Load cart from localStorage
    loadCart() {
        const savedCart = localStorage.getItem('enderfall_cart');
        if (savedCart) {
            try {
                this.items = JSON.parse(savedCart);
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
        this.items = [];
        this.saveCart();
        this.updateCartUI();
        showToast('Your cart has been cleared', 'info');
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
        
        if (!cartContainer) return;

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
        if (this.items.length === 0) {
            showToast('Your cart is empty', 'warning');
            return;
        }
        
        // Open checkout modal or redirect to checkout page
        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) {
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
            
            checkoutModal.style.display = 'flex';
        } else {
            // Redirect to checkout page if no modal
            window.location.href = '/checkout.html';
        }
    }
}

// Initialize cart when DOM is loaded
let cart;
document.addEventListener('DOMContentLoaded', () => {
    cart = new ShoppingCart();
    
    // Setup checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            cart.checkout();
        });
    }

    // Setup clear cart button
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            cart.clearCart();
        });
    }

    // Setup cart toggle button
    const cartToggleBtn = document.getElementById('cartToggleBtn');
    const cartPanel = document.getElementById('cartPanel');
    
    if (cartToggleBtn && cartPanel) {
        cartToggleBtn.addEventListener('click', () => {
            cartPanel.classList.toggle('cart-open');
        });
    }
});

// Add item to cart function for use in other files
function addToCart(item) {
    if (cart) {
        return cart.addItem(item);
    }
    return false;
} 