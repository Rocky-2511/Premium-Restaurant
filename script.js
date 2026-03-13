document.addEventListener("DOMContentLoaded", () => {
    
    // 1. LENIS SMOOTH SCROLLING (With dynamic height fix)
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

        // Force Lenis to recalculate when page dimensions change (prevents freezing)
        new ResizeObserver(() => lenis.resize()).observe(document.body);

        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => { lenis.raf(time * 1000); });
            gsap.ticker.lagSmoothing(0, 0);
        }
    }

    // 2. PRELOADER & GSAP ANIMATIONS
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            setTimeout(() => { preloader.classList.add('hidden'); }, 500);
        });
    }

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        gsap.utils.toArray('.gsap-fade').forEach(element => {
            gsap.fromTo(element, 
                { y: 50, opacity: 0 },
                { scrollTrigger: { trigger: element, start: 'top 85%' }, y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }
            );
        });
    }

    // 3. MOBILE MENU
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMobileMenu = document.getElementById('closeMobileMenu');
    
    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.add('open');
            document.body.style.overflow = 'hidden'; 
        });
    }
    
    if (closeMobileMenu && mobileMenu) {
        closeMobileMenu.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            document.body.style.overflow = ''; 
        });
    }

    // 4. GLOBAL CART SYSTEM
    let cart = JSON.parse(localStorage.getItem('restaurantCart')) || [];
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartItemsContainer = document.getElementById('cartItems');

    function toggleCart(forceState) {
        if (!cartSidebar || !cartOverlay) return;
        const isOpen = cartSidebar.classList.contains('open');
        const newState = forceState !== undefined ? forceState : !isOpen;
        
        if (newState) {
            cartSidebar.classList.add('open');
            cartOverlay.classList.add('open');
            document.body.style.overflow = 'hidden'; 
        } else {
            cartSidebar.classList.remove('open');
            cartOverlay.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    document.getElementById('cartBtn')?.addEventListener('click', () => toggleCart(true));
    document.getElementById('closeCart')?.addEventListener('click', () => toggleCart(false));
    cartOverlay?.addEventListener('click', () => toggleCart(false));

    // Add to Cart Logic
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
            toggleCart(true); 
        });
    });

    function updateCartDisplay() {
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '';
            let total = 0;
            
            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 2rem 0;">Your cart is empty.</p>';
            } else {
                cart.forEach((item, index) => {
                    const itemTotal = item.price * item.quantity;
                    total += itemTotal;
                    
                    const itemEl = document.createElement('div');
                    itemEl.className = 'cart-item';
                    itemEl.innerHTML = `
                        <div style="color: white;">
                            <h4 style="margin-bottom:5px; font-family: var(--font-head); font-size: 1.2rem;">${item.name}</h4>
                            <span style="color: var(--text-muted); font-size: 0.9rem;">$${item.price.toFixed(2)} x ${item.quantity}</span>
                        </div>
                        <button class="remove-item" data-index="${index}" style="color:#ff4444; font-size: 1.5rem; border:none; background:none; cursor:pointer;">&times;</button>
                    `;
                    cartItemsContainer.appendChild(itemEl);
                });
            }
            
            const countEl = document.getElementById('cartCount');
            const totalEl = document.getElementById('cartTotal');
            if (countEl) countEl.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
            if (totalEl) totalEl.innerText = total.toFixed(2);
        }
        updateCheckoutPage();
    }

    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-item')) {
                const index = e.target.getAttribute('data-index');
                cart.splice(index, 1);
                saveCart();
            }
        });
    }

    function saveCart() {
        localStorage.setItem('restaurantCart', JSON.stringify(cart));
        updateCartDisplay();
    }

    // 5. CHECKOUT PAGE CALCULATIONS
    function updateCheckoutPage() {
        const checkoutList = document.getElementById('checkoutItemsList');
        const checkoutSubtotal = document.getElementById('checkoutSubtotal');
        const checkoutTaxes = document.getElementById('checkoutTaxes');
        const checkoutFinalTotal = document.getElementById('checkoutFinalTotal');

        if (checkoutList && checkoutSubtotal && checkoutTaxes && checkoutFinalTotal) {
            checkoutList.innerHTML = '';
            let subtotal = 0;
            
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                const row = document.createElement('div');
                row.className = 'summary-row';
                row.innerHTML = `<span>${item.quantity}x ${item.name}</span><span>$${itemTotal.toFixed(2)}</span>`;
                checkoutList.appendChild(row);
            });
            
            const deliveryFee = 15.00;
            const taxes = subtotal * 0.08; 
            const finalTotal = cart.length > 0 ? (subtotal + deliveryFee + taxes) : 0;
            
            checkoutSubtotal.textContent = subtotal.toFixed(2);
            checkoutTaxes.textContent = taxes.toFixed(2);
            checkoutFinalTotal.textContent = finalTotal.toFixed(2);
        }
    }

    updateCartDisplay();

    // 6. 3D & AR VIEWER
    const arViewer = document.getElementById('arViewer');
    const modal3d = document.getElementById('modal3d');
    const modalTitle = document.getElementById('modalTitle');
    const closeModal = document.getElementById('closeModal');

    if (arViewer && modal3d) {
        document.querySelectorAll('.card-img[data-model]').forEach(img => {
            img.addEventListener('click', () => {
                const modelUrl = img.getAttribute('data-model');
                const title = img.getAttribute('data-title');
                
                arViewer.src = modelUrl; 
                if (modalTitle) modalTitle.innerText = title;
                
                modal3d.classList.add('open');
                document.body.style.overflow = 'hidden'; 
            });
        });

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                modal3d.classList.remove('open');
                document.body.style.overflow = '';
                setTimeout(() => { arViewer.src = ""; }, 300); 
            });
        }
    }
});