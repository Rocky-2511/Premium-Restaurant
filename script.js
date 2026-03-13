document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. LENIS SMOOTH SCROLLING
    // ==========================================
    if (typeof Lenis !== 'undefined') {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true
        });
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Sync GSAP with Lenis
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => { lenis.raf(time * 1000); });
            gsap.ticker.lagSmoothing(0, 0);
        }
    }

    // ==========================================
    // 2. GSAP SCROLL ANIMATIONS
    // ==========================================
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        
        gsap.utils.toArray('.gsap-fade').forEach(el => {
            gsap.fromTo(el, 
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 1, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 85%" } }
            );
        });

        gsap.utils.toArray('.gsap-reveal').forEach(el => {
            gsap.fromTo(el, 
                { opacity: 0, y: 50 },
                { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }
            );
        });
    }

    // ==========================================
    // 3. MOBILE MENU TOGGLE
    // ==========================================
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const closeMobileMenu = document.getElementById('closeMobileMenu');
    const mobileMenu = document.getElementById('mobileMenu');

    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => mobileMenu.classList.add('open'));
    }
    if (closeMobileMenu && mobileMenu) {
        closeMobileMenu.addEventListener('click', () => mobileMenu.classList.remove('open'));
    }

    // ==========================================
    // 4. GLOBAL CART SYSTEM (Local Storage)
    // ==========================================
    let cart = JSON.parse(localStorage.getItem('lor_cart')) || [];
    
    const cartBtn = document.getElementById('cartBtn');
    const closeCartBtn = document.getElementById('closeCart');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');

    function toggleCart(forceState) {
        if (!cartSidebar || !cartOverlay) return;
        const isOpen = cartSidebar.classList.contains('open');
        const newState = forceState !== undefined ? forceState : !isOpen;
        
        if (newState) {
            cartSidebar.classList.add('open');
            cartOverlay.classList.add('open');
        } else {
            cartSidebar.classList.remove('open');
            cartOverlay.classList.remove('open');
        }
    }

    if (cartBtn) cartBtn.addEventListener('click', () => toggleCart(true));
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
    if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));

    function updateCartUI() {
        if (cartCount) cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '';
            let total = 0;
            
            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 2rem 0;">Your cart is empty.</p>';
            } else {
                cart.forEach((item, index) => {
                    total += item.price * item.quantity;
                    const itemEl = document.createElement('div');
                    itemEl.className = 'cart-item';
                    itemEl.innerHTML = `
                        <div>
                            <h4 style="font-family: var(--font-head); color: var(--gold); font-size: 1.2rem;">${item.name}</h4>
                            <p style="color: var(--text-muted); font-size: 0.9rem;">$${item.price} x ${item.quantity}</p>
                        </div>
                        <button class="remove-item" data-index="${index}" style="color: red; font-size: 1.5rem;">&times;</button>
                    `;
                    cartItemsContainer.appendChild(itemEl);
                });
            }
            if (cartTotal) cartTotal.textContent = total.toFixed(2);
        }
        
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                cart.splice(index, 1);
                saveCart();
            });
        });
        
        updateCheckoutUI(); // Updates the checkout page if we are on it
    }

    function saveCart() {
        localStorage.setItem('lor_cart', JSON.stringify(cart));
        updateCartUI();
    }

    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const name = e.target.getAttribute('data-name');
            const price = parseFloat(e.target.getAttribute('data-price'));
            
            const existingItem = cart.find(item => item.id === id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ id, name, price, quantity: 1 });
            }
            
            saveCart();
            toggleCart(true); // Pop open the sidebar
        });
    });

    updateCartUI();

    // ==========================================
    // 5. CHECKOUT PAGE LOGIC
    // ==========================================
    function updateCheckoutUI() {
        const checkoutList = document.getElementById('checkoutItemsList');
        const checkoutSubtotal = document.getElementById('checkoutSubtotal');
        const checkoutTaxes = document.getElementById('checkoutTaxes');
        const checkoutFinalTotal = document.getElementById('checkoutFinalTotal');

        if (checkoutList && checkoutSubtotal && checkoutTaxes && checkoutFinalTotal) {
            checkoutList.innerHTML = '';
            let subtotal = 0;
            
            cart.forEach(item => {
                subtotal += item.price * item.quantity;
                const row = document.createElement('div');
                row.className = 'summary-row';
                row.innerHTML = `<span>${item.quantity}x ${item.name}</span><span>$${(item.price * item.quantity).toFixed(2)}</span>`;
                checkoutList.appendChild(row);
            });
            
            const deliveryFee = 15.00;
            const taxes = subtotal * 0.08; // 8% tax
            const finalTotal = cart.length > 0 ? (subtotal + deliveryFee + taxes) : 0;
            
            checkoutSubtotal.textContent = subtotal.toFixed(2);
            checkoutTaxes.textContent = taxes.toFixed(2);
            checkoutFinalTotal.textContent = finalTotal.toFixed(2);
        }
    }

    // ==========================================
    // 6. 3D & AR MODAL LOGIC (Menu Page)
    // ==========================================
    const modal3d = document.getElementById('modal3d');
    const closeModalBtn = document.getElementById('closeModal');
    const arViewer = document.getElementById('arViewer');
    const modalTitle = document.getElementById('modalTitle');

    document.querySelectorAll('.card-img[data-model]').forEach(card => {
        card.addEventListener('click', () => {
            const modelSrc = card.getAttribute('data-model');
            const title = card.getAttribute('data-title');
            
            if (modal3d && arViewer && modalTitle) {
                arViewer.src = modelSrc;
                modalTitle.textContent = title;
                modal3d.classList.add('open');
            }
        });
    });

    if (closeModalBtn && modal3d) {
        closeModalBtn.addEventListener('click', () => {
            modal3d.classList.remove('open');
            if (arViewer) arViewer.src = ""; // Stops the 3D render to save memory
        });
    }

    // ==========================================
    // 7. AUDIO TOGGLE LOGIC (Homepage Only)
    // ==========================================
    const audioToggle = document.getElementById('audioToggle');
    const ambientAudio = document.getElementById('ambientAudio');
    const soundState = document.getElementById('soundState');

    if (audioToggle && ambientAudio && soundState) {
        audioToggle.addEventListener('click', () => {
            if (ambientAudio.paused) {
                ambientAudio.play();
                soundState.textContent = 'On';
            } else {
                ambientAudio.pause();
                soundState.textContent = 'Off';
            }
        });
    }

    // ==========================================
    // 8. MAGNETIC BUTTON HOVER EFFECT
    // ==========================================
    const magnets = document.querySelectorAll('.magnetic');
    magnets.forEach((magnet) => {
        magnet.addEventListener('mousemove', function(e) {
            const position = magnet.getBoundingClientRect();
            const x = e.clientX - position.left - position.width / 2;
            const y = e.clientY - position.top - position.height / 2;
            
            if (typeof gsap !== 'undefined') {
                gsap.to(magnet, { x: x * 0.3, y: y * 0.3, duration: 0.5, ease: "power2.out" });
            }
        });

        magnet.addEventListener('mouseleave', function() {
            if (typeof gsap !== 'undefined') {
                gsap.to(magnet, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
            }
        });
    });
});