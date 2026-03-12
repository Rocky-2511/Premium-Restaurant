// --- 1. LENIS SMOOTH SCROLLING ---
let lenis;
if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
}

// --- 2. PRELOADER & GSAP ANIMATIONS ---
document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    
    // Fallback safe preloader removal
    setTimeout(() => {
        if(preloader) preloader.classList.add('hidden');
        initPageAnimations();
    }, 800);

    function initPageAnimations() {
        if (typeof gsap === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        gsap.fromTo('.gsap-reveal', 
            { y: 60, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 1.5, stagger: 0.2, ease: 'power4.out' }
        );

        gsap.utils.toArray('.gsap-fade').forEach(element => {
            gsap.fromTo(element, 
                { y: 50, opacity: 0 },
                { scrollTrigger: { trigger: element, start: 'top 85%' }, y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }
            );
        });

        gsap.utils.toArray('.img-block img').forEach(img => {
            gsap.to(img, {
                yPercent: 20,
                ease: "none",
                scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true }
            });
        });

        if(document.querySelector('.hero-bg')) {
            gsap.to('.hero-bg', { yPercent: 30, ease: "none", scrollTrigger: { trigger: '.hero', start: "top top", end: "bottom top", scrub: true } });
        }
    }

    // Navbar Hide/Show
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    if(navbar) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll <= 0) navbar.classList.remove('hide');
            else if (currentScroll > lastScroll && currentScroll > 100) navbar.classList.add('hide');
            else navbar.classList.remove('hide');
            lastScroll = currentScroll;
        });
    }
});

// --- 3. GLOBAL CART SYSTEM ---
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
        if (typeof gsap !== 'undefined') gsap.fromTo(e.target, {scale: 0.9}, {scale: 1, duration: 0.3, ease: 'back.out(2)'});
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
        container.innerHTML += `<div class="cart-item"><div><h4 style="margin-bottom:5px;">${item.name}</h4><span class="price">$${item.price.toFixed(2)}</span></div><button class="remove-btn" onclick="removeFromCart(${index})">Remove</button></div>`;
    });
    if(document.getElementById('cartCount')) document.getElementById('cartCount').innerText = cart.length;
    if(document.getElementById('cartTotal')) document.getElementById('cartTotal').innerText = total.toFixed(2);
}
window.removeFromCart = function(index) { cart.splice(index, 1); localStorage.setItem('restaurantCart', JSON.stringify(cart)); updateCartDisplay(); }
updateCartDisplay();

// --- 4. REAL-TIME 3D & AR VIEWER (Google Model Viewer) ---
document.addEventListener('DOMContentLoaded', () => {
    const arViewer = document.getElementById('arViewer');
    const modal3d = document.getElementById('modal3d');
    const modalTitle = document.getElementById('modalTitle');
    const closeModal = document.getElementById('closeModal');

    if(arViewer && modal3d) {
        document.querySelectorAll('.card-img[data-model]').forEach(img => {
            img.addEventListener('click', () => {
                const type = img.dataset.model;
                arViewer.src = `models/${type}.glb`; // Load model
                modalTitle.innerText = type.charAt(0).toUpperCase() + type.slice(1);
                modal3d.classList.add('open');
                if(lenis) lenis.stop(); // Pause background scrolling
            });
        });

        closeModal.addEventListener('click', () => {
            modal3d.classList.remove('open');
            setTimeout(() => { arViewer.src = ""; }, 400); // Clear memory after fade out
            if(lenis) lenis.start();
        });
    }
});

// --- 5. MOBILE MENU LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMobileMenu = document.getElementById('closeMobileMenu');
    
    if(hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.add('open');
            document.body.style.overflow = 'hidden';
        });
    }

    if(closeMobileMenu && mobileMenu) {
        closeMobileMenu.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    }
});

// --- 6. CHECKOUT PAGE LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const checkoutItemsList = document.getElementById('checkoutItemsList');
    if(checkoutItemsList) {
        let currentCart = JSON.parse(localStorage.getItem('restaurantCart')) || [];
        let subtotal = 0;
        
        if(currentCart.length === 0) {
            checkoutItemsList.innerHTML = '<p style="color: #ff4444;">Your cart is empty.</p>';
            if(document.querySelector('.btn-primary')) document.querySelector('.btn-primary').style.display = 'none';
        } else {
            currentCart.forEach(item => {
                subtotal += item.price;
                checkoutItemsList.innerHTML += `<div class="checkout-item-row"><span>${item.name}</span><span>$${item.price.toFixed(2)}</span></div>`;
            });

            const deliveryFee = 15.00;
            const taxes = subtotal * 0.08;
            const finalTotal = subtotal + deliveryFee + taxes;

            document.getElementById('checkoutSubtotal').innerText = subtotal.toFixed(2);
            document.getElementById('checkoutTaxes').innerText = taxes.toFixed(2);
            document.getElementById('checkoutFinalTotal').innerText = finalTotal.toFixed(2);
        }

        const orderForm = document.getElementById('placeOrderForm');
        if(orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                localStorage.removeItem('restaurantCart');
                cart = []; updateCartDisplay();
                orderForm.innerHTML = `<div style="text-align: center; padding: 4rem 0;"><h2 style="color: var(--gold); font-size: 3rem; margin-bottom: 1rem;">Merci.</h2><p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 2rem;">Your order has been placed successfully.</p><a href="index.html" class="btn-primary">Return Home</a></div>`;
            });
        }
    }
});

// --- 7. MAGNETIC BUTTONS (Desktop Only) ---
document.addEventListener('DOMContentLoaded', () => {
    if(window.matchMedia("(pointer: fine)").matches) {
        const magneticElements = document.querySelectorAll('.magnetic');
        magneticElements.forEach(elem => {
            elem.addEventListener('mousemove', (e) => {
                const rect = elem.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                if(typeof gsap !== 'undefined') gsap.to(elem, { x: x * 0.4, y: y * 0.4, duration: 0.3, ease: 'power2.out' });
            });
            elem.addEventListener('mouseleave', () => {
                if(typeof gsap !== 'undefined') gsap.to(elem, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
            });
        });
    }
});