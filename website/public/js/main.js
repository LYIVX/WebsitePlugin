// Authentication state
let isAuthenticated = false;
let currentUser = null;

// Modal handling
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const closeButtons = document.querySelectorAll('.close');
const switchToRegister = document.getElementById('switch-to-register');
const switchToLogin = document.getElementById('switch-to-login');

// Event listeners for modals
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
    });
}

if (registerBtn) {
    registerBtn.addEventListener('click', () => {
        registerModal.style.display = 'block';
    });
}

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        loginModal.style.display = 'none';
        registerModal.style.display = 'none';
    });
});

if (switchToRegister) {
    switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'none';
        registerModal.style.display = 'block';
    });
}

if (switchToLogin) {
    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.style.display = 'none';
        loginModal.style.display = 'block';
    });
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (e.target === registerModal) {
        registerModal.style.display = 'none';
    }
});

// Form handling
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                isAuthenticated = true;
                currentUser = data.user;
                loginModal.style.display = 'none';
                updateAuthUI();
                // Redirect to profile page if login successful
                window.location.href = '/profile.html';
            } else {
                alert('Invalid username or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login');
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                alert('Registration successful! Please log in.');
                registerModal.style.display = 'none';
                loginModal.style.display = 'block';
            } else {
                const error = await response.json();
                alert(error.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred during registration');
        }
    });
}

// Update UI based on auth state
function updateAuthUI() {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;

    if (isAuthenticated && currentUser) {
        authButtons.innerHTML = `
            <button id="logout-btn">Logout</button>
        `;
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.addEventListener('click', handleLogout);
    } else {
        authButtons.innerHTML = `
            <button id="login-btn">Login</button>
            <button id="register-btn">Register</button>
        `;
    }
}

// Handle logout
async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
        });

        if (response.ok) {
            isAuthenticated = false;
            currentUser = null;
            updateAuthUI();
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('An error occurred during logout');
    }
}

// Check auth status on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthStatus();
    updateAuthUI();
});

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            currentUser = await response.json();
            isAuthenticated = true;
        } else {
            isAuthenticated = false;
            currentUser = null;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        isAuthenticated = false;
        currentUser = null;
    }
    updateAuthUI();
}

function handleAuth() {
    if (isAuthenticated) {
        window.location.href = '/profile.html';
    } else {
        const baseUrl = getBaseUrl();
        window.location.href = `${baseUrl}/auth/discord`;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Handle purchase
async function handlePurchase(event) {
    event.preventDefault();

    if (!isAuthenticated) {
        showNotification('Please login with Discord first', 'error');
        setTimeout(() => {
            const baseUrl = getBaseUrl();
            window.location.href = `${baseUrl}/auth/discord`;
        }, 2000);
        return;
    }

    const rankName = document.getElementById('selectedRank').textContent;
    const price = parseFloat(document.getElementById('selectedPrice').textContent);

    try {
        const response = await fetch('/api/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rankName, price })
        });

        if (!response.ok) throw new Error('Purchase failed');

        const result = await response.json();
        showNotification('Purchase successful! Your rank will be applied shortly.', 'success');
        setTimeout(() => {
            closePurchaseModal();
            window.location.href = '/profile.html';
        }, 2000);
    } catch (error) {
        console.error('Purchase error:', error);
        showNotification('Failed to process purchase. Please try again.', 'error');
    }
}
