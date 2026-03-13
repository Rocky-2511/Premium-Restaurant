// --- 1. LENIS SMOOTH SCROLLING (Crash-Proof) ---
let lenis;
try {
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
    }
} catch(e) { console.warn("Lenis init failed:", e); }

// --- 2. PRELOADER & GSAP ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        const preloader = document.getElementById('preloader');
        setTimeout(() => {
            if(preloader) {
                preloader.classList.add('hidden');
                preloader.style.pointerEvents = 'none'; // Force unblock screen
            }
            initPageAnimations();
        }, 800);
    } catch(e) { console.warn(e); }

    function initPageAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        gsap.utils.toArray('.gsap-fade').forEach(element => {
            gsap.fromTo(element, 
                { y: 50, opacity: 0 },
                { scrollTrigger: { trigger: element, start: 'top 85%' }, y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }
            );
        });
    }
});

// --- 3. GLOBAL CART SYSTEM (Crash-Proof) ---
let cart = [];
try {
    const savedCart = localStorage.getItem('restaurantCart');
    if (savedCart) cart = JSON.parse(savedCart);
} catch(e) { 
    console.warn("Cart data corrupted. Resetting.");
    localStorage.removeItem('restaurantCart');
}

document.addEventListener('DOMContentLoaded', () => {
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
});

// --- 4. 3D & AR VIEWER (Fixed Logic) ---
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
                
                arViewer.src = modelUrl; 
                
                // Set iOS fallback URL for iPhones (replaces .glb with .usdz automatically if using standard naming)
                arViewer.setAttribute('ios-src', modelUrl.replace('.glb', '.usdz'));
                
                if(modalTitle) modalTitle.innerText = title;
                modal3d.classList.add('open');
                
                // Safe Lenis Stop
                try { if(lenis) lenis.stop(); } catch(e){}
            });
        });

        function close3DModal() {
            modal3d.classList.remove('open');
            setTimeout(() => { arViewer.src = ""; }, 400); 
            try { if(lenis) lenis.start(); } catch(e){}
        }

        closeModal?.addEventListener('click', close3DModal);
        
        // Also close if clicked on the black background
        modal3d.addEventListener('click', (e) => {
            if(e.target === modal3d) close3DModal();
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
        });
    }

    if(closeMobileMenu && mobileMenu) {
        closeMobileMenu.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
        });
    }
});