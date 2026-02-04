// =============================================== 
// CART MANAGEMENT SYSTEM
// =============================================== 

class CartManager {
    constructor() {
        this.cartKey = 'designStudioCart';
        this.guestCartKey = 'designStudioGuestCart';
        this.cart = this.loadCart();
        this.initializeCart();
    }

    // Load cart from localStorage
    loadCart() {
        const user = this.getCurrentUser();
        let cartJson;
        
        if (user) {
            // Load user-specific cart
            const userCartKey = `${this.cartKey}_${user.uid}`;
            cartJson = localStorage.getItem(userCartKey);
            
            // If user has no cart yet, check for guest cart and migrate it
            if (!cartJson) {
                const guestCartJson = localStorage.getItem(this.guestCartKey);
                if (guestCartJson) {
                    // Migrate guest cart to user cart
                    localStorage.setItem(userCartKey, guestCartJson);
                    localStorage.removeItem(this.guestCartKey);
                    cartJson = guestCartJson;
                }
            }
        } else {
            // Load guest cart
            cartJson = localStorage.getItem(this.guestCartKey);
        }
        
        return cartJson ? JSON.parse(cartJson) : [];
    }

    // Save cart to localStorage
    saveCart() {
        const user = this.getCurrentUser();
        let cartKey;
        
        if (user) {
            // Save to user-specific cart
            cartKey = `${this.cartKey}_${user.uid}`;
        } else {
            // Save to guest cart
            cartKey = this.guestCartKey;
        }
        
        localStorage.setItem(cartKey, JSON.stringify(this.cart));
        this.updateCartBadge();
        this.updateCartUI();
    }

    // Get current user from Firebase
getCurrentUser() {
    // Check if Firebase auth is available and user is logged in
    if (window.auth && window.auth.currentUser) {
        const firebaseUser = window.auth.currentUser;
        
        // Use the getOrCreateClientId function from firebase.js
        let clientId;
        if (window.getOrCreateClientId) {
            clientId = window.getOrCreateClientId(firebaseUser.uid);
        } else {
            // Fallback to localStorage
            const storageKey = `clientId_${firebaseUser.uid}`;
            clientId = localStorage.getItem(storageKey);
            if (!clientId) {
                clientId = this.generateClientId();
                localStorage.setItem(storageKey, clientId);
            }
        }
        
        return {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            clientId: clientId
        };
    }
    return null;
}

    // Generate client ID
    generateClientId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let clientId = '';
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            clientId += chars[randomIndex];
        }
        return clientId;
    }

    // Migrate guest cart to user cart after login
    migrateGuestCartToUser(userUid) {
        const guestCartJson = localStorage.getItem(this.guestCartKey);
        if (guestCartJson) {
            const userCartKey = `${this.cartKey}_${userUid}`;
            localStorage.setItem(userCartKey, guestCartJson);
            localStorage.removeItem(this.guestCartKey);
            this.cart = JSON.parse(guestCartJson);
            this.updateCartBadge();
            this.updateCartUI();
            return true;
        }
        return false;
    }

    // Clear cart for a specific user
    clearUserCart(userUid) {
        const userCartKey = `${this.cartKey}_${userUid}`;
        localStorage.removeItem(userCartKey);
    }

    // Update cart badge
    updateCartBadge() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Update ONLY cart badges
        const cartBadges = document.querySelectorAll('.badge:not(.wishlist-badge)');
        cartBadges.forEach(badge => {
            if (badge.closest('.cart-icon') || badge.closest('.nav-icon') || 
                (badge.parentElement && badge.parentElement.querySelector('.fa-shopping-cart'))) {
                badge.textContent = totalItems;
                badge.style.display = totalItems > 0 ? 'flex' : 'none';
            }
        });
        
        const desktopCartBadges = document.querySelectorAll('.nav-icons .badge, .cart-icon .badge');
        desktopCartBadges.forEach(badge => {
            if (!badge.classList.contains('wishlist-badge')) {
                badge.textContent = totalItems;
                badge.style.display = totalItems > 0 ? 'flex' : 'none';
            }
        });
    }

    addItem(serviceId, tierName, serviceTitle, price, quantity = 1, details = {}) {
        const priceValue = this.parsePrice(price);
        
        const existingItemIndex = this.cart.findIndex(item => 
            item.serviceId === serviceId && item.tierName === tierName
        );

        if (existingItemIndex > -1) {
            this.cart[existingItemIndex].quantity += quantity;
        } else {
            this.cart.push({
                id: Date.now().toString(),
                serviceId,
                serviceTitle,
                tierName,
                price: priceValue,
                quantity,
                details,
                addedAt: new Date().toISOString()
            });
        }

        this.saveCart();
        this.updateCartBadge();
        return true;
    }

    // Parse price string to number
    parsePrice(priceStr) {
        if (typeof priceStr === 'number') return priceStr;
        
        const match = priceStr.match(/R\s*(\d+(\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
    }

    // Remove item from cart
    removeItem(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartBadge();
    }

    // Update item quantity
    updateQuantity(itemId, quantity) {
        const item = this.cart.find(item => item.id === itemId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveCart();
            this.updateCartBadge();
        }
    }

    // Get cart subtotal
    getSubtotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Get cart total
    getTotal() {
        return this.getSubtotal();
    }

    // Clear entire cart
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartBadge();
    }

    // Check if cart is empty
    isEmpty() {
        return this.cart.length === 0;
    }

    // Create cart item HTML
    createCartItemHTML(item) {
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.dataset.itemId = item.id;

        const tierDisplay = item.tierName.charAt(0).toUpperCase() + item.tierName.slice(1);
        const itemTotal = item.price * item.quantity;

        let detailsHTML = '';
        if (item.details.pages) {
            detailsHTML += `
                <div class="cart-detail-group">
                    <div class="cart-detail-label">Pages</div>
                    <div class="cart-detail-value">${item.details.pages}</div>
                </div>
            `;
        }

        if (item.details.addons && item.details.addons.length > 0) {
            detailsHTML += `
                <div class="cart-detail-group">
                    <div class="cart-detail-label">Addons</div>
                    <div class="cart-detail-value">${item.details.addons.length} selected</div>
                </div>
            `;
        }

        li.innerHTML = `
            <div class="cart-item-header">
                <div class="cart-item-title">${item.serviceTitle}</div>
                <span class="cart-item-tier">${tierDisplay}</span>
                <button class="cart-item-remove" data-item-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="cart-item-details">
                <div class="cart-detail-group">
                    <div class="cart-detail-label">Unit Price</div>
                    <div class="cart-detail-value cart-item-price">R${item.price.toFixed(2)}</div>
                </div>
                ${detailsHTML}
                <div class="cart-detail-group">
                    <div class="cart-detail-label">Quantity</div>
                    <div class="cart-detail-value">${item.quantity}</div>
                </div>
            </div>
            
            <div class="cart-item-footer">
                <div class="cart-quantity-controls">
                    <button class="cart-quantity-btn minus" data-item-id="${item.id}">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="cart-quantity">${item.quantity}</span>
                    <button class="cart-quantity-btn plus" data-item-id="${item.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cart-item-total">R${itemTotal.toFixed(2)}</div>
            </div>
        `;

        return li;
    }

    // Update cart UI
    updateCartUI() {
        const cartItemsList = document.getElementById('cartItemsList');
        const cartEmptyState = document.getElementById('cartEmptyState');
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        const cartFooter = document.getElementById('cartFooter');
        const proceedToConfirmationBtn = document.getElementById('proceedToConfirmation');

        if (this.isEmpty()) {
            if (cartEmptyState) cartEmptyState.style.display = 'block';
            if (cartItemsContainer) cartItemsContainer.style.display = 'none';
            if (cartFooter) cartFooter.style.display = 'none';
        } else {
            if (cartEmptyState) cartEmptyState.style.display = 'none';
            if (cartItemsContainer) cartItemsContainer.style.display = 'block';
            if (cartFooter) cartFooter.style.display = 'block';
            if (proceedToConfirmationBtn) proceedToConfirmationBtn.disabled = false;

            if (cartItemsList) {
                cartItemsList.innerHTML = '';
                this.cart.forEach(item => {
                    cartItemsList.appendChild(this.createCartItemHTML(item));
                });
            }

            const subtotalElement = document.getElementById('cartSubtotal');
            const totalElement = document.getElementById('cartGrandTotal');
            
            if (subtotalElement) subtotalElement.textContent = `R${this.getSubtotal().toFixed(2)}`;
            if (totalElement) totalElement.textContent = `R${this.getTotal().toFixed(2)}`;
        }
    }

    // Create confirmation item HTML
    createConfirmationItemHTML(item) {
        const li = document.createElement('li');
        li.className = 'confirmation-item';

        const tierDisplay = item.tierName.charAt(0).toUpperCase() + item.tierName.slice(1);
        const itemTotal = item.price * item.quantity;

        let detailsHTML = '';
        if (item.details.pages) {
            detailsHTML += `
                <div class="confirmation-detail-group">
                    <div class="confirmation-detail-label">Pages</div>
                    <div class="confirmation-detail-value">${item.details.pages}</div>
                </div>
            `;
        }

        if (item.details.addons && item.details.addons.length > 0) {
            const addonsList = item.details.addons.map(addon => 
                `<div style="margin-bottom: 2px;">• ${addon.name}</div>`
            ).join('');
            
            detailsHTML += `
                <div class="confirmation-detail-group">
                    <div class="confirmation-detail-label">Addons</div>
                    <div class="confirmation-detail-value">
                        <div style="font-size: 13px;">${addonsList}</div>
                    </div>
                </div>
            `;
        }

        li.innerHTML = `
            <div class="confirmation-item-header">
                <div class="confirmation-item-title">${item.serviceTitle}</div>
                <span class="confirmation-item-tier">${tierDisplay}</span>
            </div>
            
            <div class="confirmation-item-details">
                <div class="confirmation-detail-group">
                    <div class="confirmation-detail-label">Unit Price</div>
                    <div class="confirmation-detail-value confirmation-item-price">R${item.price.toFixed(2)}</div>
                </div>
                ${detailsHTML}
                <div class="confirmation-detail-group">
                    <div class="confirmation-detail-label">Quantity</div>
                    <div class="confirmation-detail-value">${item.quantity}</div>
                </div>
            </div>
            
            <div class="confirmation-item-footer">
                <div class="confirmation-quantity">
                    <i class="fas fa-box"></i> Qty: ${item.quantity}
                </div>
                <div class="confirmation-item-total">R${itemTotal.toFixed(2)}</div>
            </div>
        `;

        return li;
    }

    // Update confirmation UI
    updateConfirmationUI() {
        const confirmationItemsList = document.getElementById('confirmationItemsList');
        const subtotal = this.getSubtotal();
        const total = this.getTotal();

        if (confirmationItemsList) {
            confirmationItemsList.innerHTML = '';
            this.cart.forEach(item => {
                confirmationItemsList.appendChild(this.createConfirmationItemHTML(item));
            });
        }

        const subtotalElement = document.getElementById('confirmationSubtotal');
        const totalElement = document.getElementById('confirmationTotal');
        
        if (subtotalElement) subtotalElement.textContent = `R${subtotal.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `R${total.toFixed(2)}`;
    }

    // Initialize cart
    initializeCart() {
        this.updateCartBadge();
        this.updateCartUI();
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.cart-item-remove')) {
                const itemId = e.target.closest('.cart-item-remove').dataset.itemId;
                this.removeItem(itemId);
            }

            if (e.target.closest('.cart-quantity-btn.minus')) {
                const itemId = e.target.closest('.cart-quantity-btn').dataset.itemId;
                const item = this.cart.find(item => item.id === itemId);
                if (item && item.quantity > 1) {
                    this.updateQuantity(itemId, item.quantity - 1);
                }
            }

            if (e.target.closest('.cart-quantity-btn.plus')) {
                const itemId = e.target.closest('.cart-quantity-btn').dataset.itemId;
                const item = this.cart.find(item => item.id === itemId);
                if (item) {
                    this.updateQuantity(itemId, item.quantity + 1);
                }
            }
        });
    }
}

// =============================================== 
// CART POPUP MANAGEMENT
// =============================================== 

class CartPopupManager {
    constructor(cartManager) {
        this.cartManager = cartManager;
        this.cartPopup = document.getElementById('cartPopup');
        this.confirmationPopup = document.getElementById('confirmationPopup');
        this.setupPopupEventListeners();
    }

    // Open cart popup
    openCartPopup() {
        this.cartPopup.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.cartManager.updateCartUI();
    }

    // Close cart popup
    closeCartPopup() {
        this.cartPopup.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Open confirmation popup
    openConfirmationPopup() {
        if (this.cartManager.isEmpty()) {
            this.showToast('Your cart is empty!', 'error');
            return;
        }

        this.closeCartPopup();
        this.confirmationPopup.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        this.cartManager.updateConfirmationUI();
        this.resetFormFields();
    }

    // Close confirmation popup
    closeConfirmationPopup() {
        this.confirmationPopup.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Reset form fields
    resetFormFields() {
        const designDescription = document.getElementById('designDescription');
        const preferredColors = document.getElementById('preferredColors');
        const sketchImageUrl = document.getElementById('sketchImageUrl');
        const urlPreview = document.getElementById('urlPreview');
        
        if (designDescription) designDescription.value = '';
        if (preferredColors) preferredColors.value = '';
        if (sketchImageUrl) sketchImageUrl.value = '';
        if (urlPreview) {
            urlPreview.classList.remove('active');
            urlPreview.innerHTML = '';
        }
    }

    // Show toast notification
    showToast(message, type = 'success') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.custom-toast');
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            background: type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: '9999',
            animation: 'slideInRight 0.3s ease',
            maxWidth: '300px'
        });
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Setup popup event listeners
    setupPopupEventListeners() {
        // Close buttons
        const closeCartBtn = document.getElementById('closeCart');
        const closeConfirmationBtn = document.getElementById('closeConfirmation');
        
        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', () => this.closeCartPopup());
        }
        
        if (closeConfirmationBtn) {
            closeConfirmationBtn.addEventListener('click', () => this.closeConfirmationPopup());
        }

        // Cart popup overlay click
        if (this.cartPopup) {
            this.cartPopup.addEventListener('click', (e) => {
                if (e.target === this.cartPopup) this.closeCartPopup();
            });
        }

        // Confirmation popup overlay click
        if (this.confirmationPopup) {
            this.confirmationPopup.addEventListener('click', (e) => {
                if (e.target === this.confirmationPopup) this.closeConfirmationPopup();
            });
        }

        // Continue shopping button
        const continueShoppingBtn = document.getElementById('continueShopping');
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', () => this.closeCartPopup());
        }

        // Browse services button
        const browseServicesBtn = document.getElementById('cartBrowseServices');
        if (browseServicesBtn) {
            browseServicesBtn.addEventListener('click', () => {
                this.closeCartPopup();
                const servicesSection = document.getElementById('services');
                if (servicesSection) {
                    servicesSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Back to cart button
        const backToCartBtn = document.getElementById('backToCart');
        if (backToCartBtn) {
            backToCartBtn.addEventListener('click', () => {
                this.closeConfirmationPopup();
                this.openCartPopup();
            });
        }

        // Cart icons click
        const cartIcons = document.querySelectorAll('.cart-icon, .nav-icon[href="#"]');
        cartIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCartPopup();
            });
        });

        // Proceed to confirmation button
        const proceedToConfirmationBtn = document.getElementById('proceedToConfirmation');
        if (proceedToConfirmationBtn) {
            proceedToConfirmationBtn.addEventListener('click', () => {
                this.openConfirmationPopup();
            });
        }
    }
}

// =============================================== 
// CHECKOUT & CONFIRMATION
// =============================================== 

class CheckoutManager {
    constructor(cartManager, cartPopupManager) {
        this.cartManager = cartManager;
        this.cartPopupManager = cartPopupManager;
        this.setupCheckoutEventListeners();
    }

    // Setup checkout event listeners
    setupCheckoutEventListeners() {
        // Proceed to checkout button
        const proceedToCheckoutBtn = document.getElementById('proceedToCheckout');
        if (proceedToCheckoutBtn) {
            proceedToCheckoutBtn.addEventListener('click', () => this.handleProceedToCheckout());
        }
    }

    // Handle proceed to checkout
    async handleProceedToCheckout() {
        const designDescription = document.getElementById('designDescription').value.trim();
        
        if (!designDescription) {
            this.cartPopupManager.showToast('Please provide a design description', 'error');
            return;
        }
        
        // Get user data
        const userData = this.getUserData();
        
        if (!userData.currentUser) {
            this.cartPopupManager.showToast('Please login to proceed with checkout', 'error');
            this.cartPopupManager.closeConfirmationPopup();
            
            setTimeout(() => {
                this.openAuthModalForCheckout();
            }, 1500);
            return;
        }
        
        // Create order data
        const sketchImageUrl = document.getElementById('sketchImageUrl')?.value.trim() || '';
        const preferredColors = document.getElementById('preferredColors')?.value.trim() || '';
        
        const orderData = {
            cart: this.cartManager.cart,
            userInput: {
                sketchImageUrl: sketchImageUrl,
                designDescription: designDescription,
                preferredColors: preferredColors
            },
            totals: {
                subtotal: this.cartManager.getSubtotal(),
                total: this.cartManager.getTotal()
            },
            userId: userData.currentUser.uid,
            clientId: userData.clientId,
            userEmail: userData.currentUser.email,
            paymentStatus: 'Pending'
        };
        
        // Save order and redirect to payment
        await this.processOrder(orderData);
    }

    // Get user data
    getUserData() {
        let currentUser = null;
        let clientId = null;
        
        // Check window.auth for Firebase user
        if (window.auth && window.auth.currentUser) {
            currentUser = window.auth.currentUser;
            const storageKey = `clientId_${currentUser.uid}`;
            clientId = localStorage.getItem(storageKey);
            
            if (!clientId) {
                clientId = this.generateClientId();
                localStorage.setItem(storageKey, clientId);
            }
        }
        
        return { currentUser, clientId };
    }

    // Generate client ID
    generateClientId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let clientId = '';
        for (let i = 0; i < 6; i++) {
            clientId += chars[Math.floor(Math.random() * chars.length)];
        }
        return clientId;
    }

    // Open auth modal for checkout
    openAuthModalForCheckout() {
        const desktopAuthOverlay = document.getElementById('desktopAuthOverlay');
        const mobileAuthContainer = document.getElementById('mobileAuthContainer');
        
        if (desktopAuthOverlay && window.innerWidth >= 769) {
            desktopAuthOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else if (mobileAuthContainer) {
            mobileAuthContainer.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Process order 
    async processOrder(orderData) {
        try {
            // Generate order ID
            const orderId = 'ORD-' + Date.now().toString().slice(-8);
            
            // Prepare complete order data
            const completeOrderData = {
                ...orderData,
                orderId: orderId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ozowPaymentLink: null,
                adminNotes: '',
                designStatus: 'Waiting',
                progress: 0,
                estimatedCompletion: null
            };
            
            // Save to Firebase
            let savedToFirebase = false;
            try {
                // Import the helper
                const { saveOrderToFirebase } = await import('./cart-firebase.js');
                savedToFirebase = await saveOrderToFirebase(orderId, completeOrderData);
            } catch (importError) {
                console.warn('Could not import cart-firebase helper:', importError);
            }
            
            // Always save to localStorage
            this.saveOrderToLocalStorage(orderId, completeOrderData);
            
            // Save to localStorage for payment page
            localStorage.setItem('lastOrderId', orderId);
            localStorage.setItem('currentOrder', JSON.stringify(completeOrderData));
            
            // Clear cart
            this.cartManager.clearCart();
            this.cartPopupManager.closeConfirmationPopup();
            this.cartPopupManager.resetFormFields();
            
            // Show success message
            const message = savedToFirebase 
                ? 'Order created successfully! Redirecting to payment...' 
                : 'Order created! Redirecting to payment...';
            this.cartPopupManager.showToast(message, 'success');
            
            // Redirect to payment page
            setTimeout(() => {
                window.location.href = `payment.html?orderId=${orderId}`;
            }, 1500);
            
        } catch (error) {
            console.error('Error creating order:', error);
            this.cartPopupManager.showToast('Error creating order. Please try again.', 'error');
        }
    }

    // Save order to localStorage
    saveOrderToLocalStorage(orderId, orderData) {
        try {
            const orders = JSON.parse(localStorage.getItem('localOrders')) || [];
            
            orders.push({
                ...orderData,
                isLocal: true
            });
            
            localStorage.setItem('localOrders', JSON.stringify(orders));
            console.log('Order saved to localStorage:', orderId);
            
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
}

// =============================================== 
// SERVICE INTEGRATION
// =============================================== 

class ServiceIntegration {
    constructor(cartManager, cartPopupManager) {
        this.cartManager = cartManager;
        this.cartPopupManager = cartPopupManager;
        this.setupServiceEventListeners();
    }

    // Integrate service buttons with cart
    integrateServiceButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.design-btn')) {
                const button = e.target.closest('.design-btn');
                this.handleServiceButtonClick(button);
            }
        });
    }

    // Handle service button click
handleServiceButtonClick(button) {
    const serviceId = button.dataset.service;
    const tierName = button.dataset.tier;
    
    const serviceCard = button.closest('.design-service-card');
    const serviceTitle = serviceCard.querySelector('.design-service-title').textContent;
    
    // Get price from active tier
    let basePrice = this.getServicePrice(serviceCard, tierName, serviceId);
    
    // Get service details
    const details = this.getServiceDetails(serviceCard, serviceId);
    
    // If it's an addon service, calculate total price
    let totalPrice = basePrice;
    if (details.addons && details.addons.length > 0) {
        totalPrice += details.addons.reduce((sum, addon) => sum + addon.price, 0);
    }
    
    // Add to cart
    this.cartManager.addItem(serviceId, tierName, serviceTitle, `R${totalPrice}`, 1, details);
    
    this.cartPopupManager.showToast(`${serviceTitle} (${tierName}) added to cart!`);
    this.cartPopupManager.openCartPopup();
}

    // Get service price
getServicePrice(serviceCard, tierName, serviceId) {
    let price = 0;
    
    // Find the active tier details
    const activeTierDetails = serviceCard.querySelector(`.design-tier-details[data-tier="${tierName}"]`);
    
    if (activeTierDetails) {
        const priceElement = activeTierDetails.querySelector('.design-service-price');
        
        if (priceElement) {
            // Check if there's a discounted price
            const discountedPriceSpan = priceElement.querySelector('.discounted-price');
            if (discountedPriceSpan) {
                // Extract number from discounted price
                const priceMatch = discountedPriceSpan.textContent.match(/R\s*(\d+(\.\d+)?)/);
                price = priceMatch ? parseFloat(priceMatch[1]) : 0;
            } else {
                // Use regular price
                const priceMatch = priceElement.textContent.match(/R\s*(\d+(\.\d+)?)/);
                price = priceMatch ? parseFloat(priceMatch[1]) : 0;
            }
        }
    }
    
    return price;
}

    // Get service details
getServiceDetails(serviceCard, serviceId) {
    const details = {};
    
    // Handle page-based services
    const pageSelect = serviceCard.querySelector('.design-page-quantity');
    if (pageSelect) {
        details.pages = pageSelect.value;
    }
    
    // Handle addons
    const addonCheckboxes = serviceCard.querySelectorAll('.addon-checkbox:checked');
    if (addonCheckboxes.length > 0) {
        details.addons = Array.from(addonCheckboxes).map(cb => {
            const priceText = cb.dataset.price;
            // Ensure price is a number
            const price = parseFloat(priceText) || 0;
            return {
                name: cb.dataset.addon,
                price: price
            };
        });
        
        // Calculate total addons price
        details.addonsTotal = details.addons.reduce((sum, addon) => sum + addon.price, 0);
    }
    
    return details;
}

    // Setup service event listeners
    setupServiceEventListeners() {
        this.integrateServiceButtons();
    }
}

// =============================================== 
// INITIALIZATION
// =============================================== 

// Main initialization function
export function initializeCartSystem() {
    try {
        // Create instances
        const cartManager = new CartManager();
        const cartPopupManager = new CartPopupManager(cartManager);
        const serviceIntegration = new ServiceIntegration(cartManager, cartPopupManager);
        const checkoutManager = new CheckoutManager(cartManager, cartPopupManager);
        
        // Return instances for external access
        return {
            cartManager,
            cartPopupManager,
            serviceIntegration,
            checkoutManager
        };
    } catch (error) {
        console.error('Failed to initialize cart system:', error);
        return null;
    }
}

// Make cart system available globally
window.CartSystem = {
    initializeCartSystem
};