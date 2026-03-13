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
    
    window.addEventListener('load', () => {
        if(preloader) {
            setTimeout(() => { preloader.classList.add('hidden'); initPageAnimations(); }, 800);
        } else { initPageAnimations(); }
    });

    function initPageAnimations() {
        if (typeof gsap === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        gsap.fromTo('.gsap-reveal', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, stagger: 0.2, ease: 'power4.out' });

        gsap.utils.toArray('.gsap-fade').forEach(element => {
            gsap.fromTo(element, { y: 50, opacity: 0 }, { scrollTrigger: { trigger: element, start: 'top 85%' }, y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' });
        });

        gsap.utils.toArray('.img-block img').forEach(img => {
            gsap.to(img, { yPercent: 20, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
        });

        if(document.querySelector('.hero-bg')) {
            gsap.to('.hero-bg', { yPercent: 30, ease: "none", scrollTrigger: { trigger: '.hero', start: "top top", end: "bottom top", scrub: true } });
        }
    }

    // Navbar Hide/Show on Scroll
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll <= 0) navbar.classList.remove('hide');
        else if (currentScroll > lastScroll && currentScroll > 100) navbar.classList.add('hide');
        else navbar.classList.remove('hide');
        lastScroll = currentScroll;
    });

    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if(hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // AR Modal Logic
    initARViewer();
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

// Form handler
document.getElementById('bookingForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('formStatus').innerText = "Request received. We will confirm shortly.";
    e.target.reset();
});

// --- 4. GOOGLE MODEL VIEWER AR LOGIC ---
function initARViewer() {
    const arCards = document.querySelectorAll('.card-img[data-model]');
    const modal = document.getElementById('arModal');
    const modalContainer = document.getElementById('arContainer');
    const closeBtn = document.getElementById('closeArModal');
    
    if(!modal || arCards.length === 0) return;

    arCards.forEach(card => {
        card.addEventListener('click', () => {
            const modelSrc = card.dataset.model;
            const modelTitle = card.dataset.title || "3D Dish";
            
            // Create the model-viewer element dynamically
            modalContainer.innerHTML = `
                <model-viewer 
                    src="models/${modelSrc}.glb" 
                    alt="${modelTitle}" 
                    auto-rotate 
                    camera-controls 
                    ar 
                    ar-modes="webxr scene-viewer quick-look" 
                    shadow-intensity="1"
                    environment-image="neutral"
                    exposure="1.2">
                    <button slot="ar-button" class="ar-button">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                        View on your table
                    </button>
                </model-viewer>
                <div class="ar-instructions">
                    <h3 style="color:var(--gold); font-size:2rem; margin-bottom:10px;">${modelTitle}</h3>
                    <p>Drag to rotate. Scroll to zoom. <br>Tap "View on your table" on mobile for AR.</p>
                </div>
            `;
            
            modal.classList.add('open');
            if(lenis) lenis.stop(); // Stop scroll when modal is open
        });
    });

    closeBtn?.addEventListener('click', () => {
        modal.classList.remove('open');
        setTimeout(() => { modalContainer.innerHTML = ''; }, 400); // clear memory
        if(lenis) lenis.start();
    });
}