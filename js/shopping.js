// API Configuration
const HARDWARE_API_URL = 'http://localhost:8080/store/listHardware'; // Corregida la URL
const STORE_API_URL = 'http://localhost:8080/store';
const USER_API_URL = 'http://localhost:8080/user';

// Global Variables
let hardwareList = [];
let shoppingCart = [];
let currentProductForCart = null;

// DOM Elements
const productsTableBody = document.getElementById('productsTableBody');
const cartTableBody = document.getElementById('cartTableBody');
const totalAmountElement = document.getElementById('totalAmount');
const saleDateInput = document.getElementById('saleDate');
const buyBtn = document.getElementById('buyBtn');
const cancelBtn = document.getElementById('cancelBtn');
const exitBtn = document.getElementById('exitBtn');

// Modals
const quantityModal = document.getElementById('quantityModal');
const confirmModal = document.getElementById('confirmModal');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupNavigation(); // Agregada configuración de navegación
});

// Initialize the application
function initializeApp() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    saleDateInput.value = today;
    
    // Load hardware products
    loadHardwareProducts();
}

// Setup navigation handlers
function setupNavigation() {
    // User Manage navigation
    const userManageLinks = document.querySelectorAll('a[href*="user"], .nav-link[data-page="user"]');
    userManageLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'user.html';
        });
    });
    
    // Hardware Manage navigation
    const hardwareManageLinks = document.querySelectorAll('a[href*="hardware"], .nav-link[data-page="hardware"]');
    hardwareManageLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'hardware.html';
        });
    });
    
    // Exit navigation - ejecuta logout y redirige
    const exitLinks = document.querySelectorAll('a[href*="exit"], .nav-link[data-page="exit"], #exitBtn');
    exitLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            handleExitWithLogout();
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Purchase buttons
    buyBtn.addEventListener('click', showPurchaseConfirmation);
    cancelBtn.addEventListener('click', clearCart);
    
    // Quantity modal
    document.getElementById('decreaseQty').addEventListener('click', decreaseQuantity);
    document.getElementById('increaseQty').addEventListener('click', increaseQuantity);
    document.getElementById('confirmAddToCart').addEventListener('click', addToCart);
    document.getElementById('cancelQuantity').addEventListener('click', closeQuantityModal);
    
    // Confirm modal
    document.getElementById('confirmPurchase').addEventListener('click', completePurchase);
    document.getElementById('cancelPurchase').addEventListener('click', closePurchaseModal);
    
    // Quantity input validation
    document.getElementById('quantityInput').addEventListener('input', validateQuantityInput);
    
    // Click outside modal to close
    quantityModal.addEventListener('click', function(e) {
        if (e.target === quantityModal) {
            closeQuantityModal();
        }
    });
    
    confirmModal.addEventListener('click', function(e) {
        if (e.target === confirmModal) {
            closePurchaseModal();
        }
    });
}

// Navigation handler with logout
async function handleExitWithLogout() {
    if (confirm('¿Estás seguro de que quieres salir?')) {
        try {
            showLoading(true);
            
            // Ejecutar logout en el servidor
            const response = await fetch(`${USER_API_URL}/exit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Redirigir independientemente de la respuesta del servidor
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('Error en logout:', error);
            // Redirigir aunque haya error
            window.location.href = 'index.html';
        } finally {
            showLoading(false);
        }
    }
}

// Simple exit handler (fallback)
function handleExit() {
    if (confirm('¿Estás seguro de que quieres salir?')) {
        window.location.href = 'index.html';
    }
}

// Load hardware products from API
async function loadHardwareProducts() {
    try {
        showLoading(true);
        console.log('Cargando hardware desde:', HARDWARE_API_URL);
        
        const response = await fetch(HARDWARE_API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Respuesta del servidor:', response.status, response.statusText);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Endpoint no encontrado. Verifica que el servidor esté corriendo.');
            } else if (response.status === 500) {
                throw new Error('Error interno del servidor');
            } else {
                throw new Error(`Error HTTP: ${response.status}`);
            }
        }
        
        hardwareList = await response.json();
        console.log('Hardware cargado:', hardwareList);
        
        renderProductsTable();
        
    } catch (error) {
        console.error('Error loading hardware products:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showMessage('No se puede conectar al servidor. Verifique que esté ejecutándose en localhost:8080', 'error');
        } else {
            showMessage(error.message || 'Error al cargar los productos de hardware', 'error');
        }
    } finally {
        showLoading(false);
    }
}

// Render products table
function renderProductsTable() {
    if (!productsTableBody) return;
    
    productsTableBody.innerHTML = '';
    
    if (hardwareList.length === 0) {
        productsTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center;">No hay productos disponibles</td>
            </tr>
        `;
        return;
    }
    
    hardwareList.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name || 'N/A'}</td>
            <td><span class="type-badge type-${product.type?.toLowerCase() || 'default'}">${product.type || 'N/A'}</span></td>
            <td>${product.brand || 'N/A'}</td>
            <td class="price-cell">$${formatPrice(product.price)}</td>
            <td>${product.quantity || 0}</td>
            <td>${product.description || 'N/A'}</td>
            <td>
                <button class="btn btn-add" onclick="showQuantityModal(${product.id})" ${product.quantity <= 0 ? 'disabled' : ''}>
                    Add to Cart
                </button>
            </td>
        `;
        productsTableBody.appendChild(row);
    });
}

// Show quantity modal
function showQuantityModal(productId) {
    const product = hardwareList.find(p => p.id === productId);
    if (!product || product.quantity <= 0) {
        showMessage('Producto no disponible', 'error');
        return;
    }
    
    currentProductForCart = product;
    
    // Update modal content
    document.getElementById('availableQuantity').textContent = product.quantity;
    document.getElementById('quantityInput').value = 1;
    document.getElementById('quantityInput').max = product.quantity;
    
    // Update buttons state
    updateQuantityButtons();
    
    quantityModal.style.display = 'flex';
}

// Close quantity modal
function closeQuantityModal() {
    quantityModal.style.display = 'none';
    currentProductForCart = null;
}

// Decrease quantity
function decreaseQuantity() {
    const input = document.getElementById('quantityInput');
    const currentValue = parseInt(input.value);
    if (currentValue > 1) {
        input.value = currentValue - 1;
        updateQuantityButtons();
    }
}

// Increase quantity
function increaseQuantity() {
    const input = document.getElementById('quantityInput');
    const currentValue = parseInt(input.value);
    const maxValue = parseInt(input.max);
    if (currentValue < maxValue) {
        input.value = currentValue + 1;
        updateQuantityButtons();
    }
}

// Validate quantity input
function validateQuantityInput() {
    const input = document.getElementById('quantityInput');
    const value = parseInt(input.value);
    const max = parseInt(input.max);
    
    if (isNaN(value) || value < 1) {
        input.value = 1;
    } else if (value > max) {
        input.value = max;
    }
    
    updateQuantityButtons();
}

// Update quantity buttons state
function updateQuantityButtons() {
    const input = document.getElementById('quantityInput');
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    
    const currentValue = parseInt(input.value);
    const maxValue = parseInt(input.max);
    
    decreaseBtn.disabled = currentValue <= 1;
    increaseBtn.disabled = currentValue >= maxValue;
}

// Add to cart
function addToCart() {
    if (!currentProductForCart) return;
    
    const quantity = parseInt(document.getElementById('quantityInput').value);
    
    // Check if product already exists in cart
    const existingItemIndex = shoppingCart.findIndex(item => item.id === currentProductForCart.id);
    
    if (existingItemIndex !== -1) {
        // Update existing item
        const newQuantity = shoppingCart[existingItemIndex].cartQuantity + quantity;
        if (newQuantity > currentProductForCart.quantity) {
            showMessage(`No hay suficiente stock. Disponible: ${currentProductForCart.quantity}`, 'error');
            return;
        }
        shoppingCart[existingItemIndex].cartQuantity = newQuantity;
    } else {
        // Add new item
        shoppingCart.push({
            ...currentProductForCart,
            cartQuantity: quantity
        });
    }
    
    renderCartTable();
    updateCartTotal();
    closeQuantityModal();
    showMessage(`${currentProductForCart.name} agregado al carrito`, 'success');
}

// Remove from cart
function removeFromCart(productId) {
    shoppingCart = shoppingCart.filter(item => item.id !== productId);
    renderCartTable();
    updateCartTotal();
    showMessage('Producto eliminado del carrito', 'success');
}

// Render cart table
function renderCartTable() {
    if (!cartTableBody) return;
    
    cartTableBody.innerHTML = '';
    
    if (shoppingCart.length === 0) {
        cartTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center;">El carrito está vacío</td>
            </tr>
        `;
        return;
    }
    
    shoppingCart.forEach(item => {
        const subtotal = item.price * item.cartQuantity;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name || 'N/A'}</td>
            <td><span class="type-badge type-${item.type?.toLowerCase() || 'default'}">${item.type || 'N/A'}</span></td>
            <td>${item.brand || 'N/A'}</td>
            <td class="price-cell">$${formatPrice(item.price)}</td>
            <td>${item.cartQuantity}</td>
            <td class="price-cell">$${formatPrice(subtotal)}</td>
            <td>
                <button class="btn btn-remove" onclick="removeFromCart(${item.id})">
                    Remove
                </button>
            </td>
        `;
        cartTableBody.appendChild(row);
    });
}

// Update cart total
function updateCartTotal() {
    const total = shoppingCart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
    if (totalAmountElement) {
        totalAmountElement.textContent = `$${formatPrice(total)}`;
    }
}

// Clear cart
function clearCart() {
    if (shoppingCart.length === 0) {
        showMessage('El carrito ya está vacío', 'error');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        shoppingCart = [];
        renderCartTable();
        updateCartTotal();
        showMessage('Carrito vaciado', 'success');
    }
}

// Show purchase confirmation
function showPurchaseConfirmation() {
    if (shoppingCart.length === 0) {
        showMessage('El carrito está vacío', 'error');
        return;
    }
    
    if (!saleDateInput.value) {
        showMessage('Por favor selecciona una fecha', 'error');
        return;
    }
    
    // Generate purchase summary
    const total = shoppingCart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
    const summaryElement = document.getElementById('purchaseSummary');
    
    let summaryHTML = `
        <p><strong>Fecha:</strong> ${saleDateInput.value}</p>
        <p><strong>Productos:</strong></p>
        <ul style="text-align: left; margin: 0.5rem 0;">
    `;
    
    shoppingCart.forEach(item => {
        summaryHTML += `<li>${item.name} - Cantidad: ${item.cartQuantity} - $${formatPrice(item.price * item.cartQuantity)}</li>`;
    });
    
    summaryHTML += `
        </ul>
        <p><strong>Total: $${formatPrice(total)}</strong></p>
    `;
    
    summaryElement.innerHTML = summaryHTML;
    confirmModal.style.display = 'flex';
}

// Close purchase modal
function closePurchaseModal() {
    confirmModal.style.display = 'none';
}

// Complete purchase
async function completePurchase() {
    try {
        showLoading(true);
        
        // Prepare data for API
        const hardwareIds = shoppingCart.map(item => item.id);
        const quantities = shoppingCart.map(item => item.cartQuantity);
        
        const purchaseData = {
            hardwareId: hardwareIds,
            saleDate: saleDateInput.value,
            quantity: quantities
        };
        
        const response = await fetch(STORE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(purchaseData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Clear cart and close modal
        shoppingCart = [];
        renderCartTable();
        updateCartTotal();
        closePurchaseModal();
        
        // Reload hardware list to update quantities
        await loadHardwareProducts();
        
        showMessage('Compra realizada exitosamente', 'success');
        
    } catch (error) {
        console.error('Error completing purchase:', error);
        showMessage('Error al procesar la compra', 'error');
    } finally {
        showLoading(false);
    }
}

// Utility Functions

// Format price
function formatPrice(price) {
    if (price === null || price === undefined || isNaN(price)) {
        return '0.00';
    }
    return parseFloat(price).toFixed(2);
}

// Show loading overlay
function showLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Show message
function showMessage(text, type = 'success') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    document.body.appendChild(message);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 3000);
}

// Global functions for onclick handlers
window.showQuantityModal = showQuantityModal;
window.removeFromCart = removeFromCart;