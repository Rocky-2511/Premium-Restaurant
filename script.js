// 1. LENIS SCROLLING
try {
    let lenis;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
    }
} catch(e) { console.warn(e); }

// 2. PRELOADER & GSAP (Safe Fallback)
try {
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        if(preloader) {
            setTimeout(() => { preloader.classList.add('hidden'); }, 500);
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
    });
} catch(e) { console.warn(e); }

// 3. CART SYSTEM (Crash Proof)
try {
    let cart = JSON.parse(localStorage.getItem('restaurantCart')) || [];
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');

    function toggleCart() {
        if(cartSidebar) cartSidebar.classList.toggle('open');
        if(cartOverlay) cartOverlay.classList.toggle('open');
    }

    document.getElementById('cartBtn')?.addEventListener('click', toggleCart);
    document.getElementById('closeCart')?.addEventListener('click', toggleCart);
    cartOverlay?.addEventListener('click', toggleCart);

    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id, name = e.target.dataset.name, price = parseFloat(e.target.dataset.price);
            cart.push({ id, name, price });
            localStorage.setItem('restaurantCart', JSON.stringify(cart));
            updateCartDisplay();
            toggleCart(); 
        });
    });

    function updateCartDisplay() {
        const container = document.getElementById('cartItems');
        if(!container) return;
        container.innerHTML = '';
        let total = 0;
        cart.forEach((item, index) => {
            total += item.price;
            container.innerHTML += `<div class="cart-item"><div style="color: white;"><h4 style="margin-bottom:5px;">${item.name}</h4><span style="color:#D4AF37;">$${item.price.toFixed(2)}</span></div><button style="color:#ff4444; border:none; background:none; cursor:pointer;" onclick="removeFromCart(${index})">Remove</button></div>`;
        });
        if(document.getElementById('cartCount')) document.getElementById('cartCount').innerText = cart.length;
        if(document.getElementById('cartTotal')) document.getElementById('cartTotal').innerText = total.toFixed(2);
    }
    
    window.removeFromCart = function(index) { 
        cart.splice(index, 1); 
        localStorage.setItem('restaurantCart', JSON.stringify(cart)); 
        updateCartDisplay(); 
    };
    updateCartDisplay();
} catch(e) { console.warn("Cart Error", e); }

// 4. MOBILE MENU FIX
try {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMobileMenu = document.getElementById('closeMobileMenu');
    
    if(hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.add('open');
            document.body.style.overflow = 'hidden'; // Stop scroll
        });
    }
    if(closeMobileMenu && mobileMenu) {
        closeMobileMenu.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            document.body.style.overflow = ''; // Start scroll
        });
    }
} catch(e) { console.warn("Mobile Menu Error", e); }

// 5. GOOGLE AR & 3D VIEWER (Fully functional)
try {
    document.addEventListener('DOMContentLoaded', () => {
        const arViewer = document.getElementById('arViewer');
        const modal3d = document.getElementById('modal3d');
        const modalTitle = document.getElementById('modalTitle');
        const closeModal = document.getElementById('closeModal');

        if(arViewer && modal3d) {
            document.querySelectorAll('.card-img[data-model]').forEach(img => {
                img.addEventListener('click', () => {
                    const modelUrl = img.getAttribute('data-model');
                    const title = img.getAttribute('data-title');
                    
                    arViewer.src = modelUrl; // Load live URL
                    if(modalTitle) modalTitle.innerText = title;
                    
                    modal3d.classList.add('open');
                    document.body.style.overflow = 'hidden'; // Stop background scroll
                });
            });

            const close3DModal = () => {
                modal3d.classList.remove('open');
                document.body.style.overflow = '';
                setTimeout(() => { arViewer.src = ""; }, 300); // Clear memory
            };

            if(closeModal) closeModal.addEventListener('click', close3DModal);
        }
    });
} catch(e) { console.warn("3D Viewer Error", e); }