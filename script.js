// --- 1. LENIS SMOOTH SCROLLING ---
let lenis;
if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
}

// --- 2. PRELOADER & GSAP ANIMATIONS ---
document.addEventListener('DOMContentLoaded', () => {
    
    // The Preloader Logic
    const preloader = document.getElementById('preloader');
    
    // Wait for window load (ensures images are ready)
    window.addEventListener('load', () => {
        if(preloader) {
            // Give it a tiny delay so the gold line animation finishes
            setTimeout(() => {
                preloader.classList.add('hidden');
                initPageAnimations();
            }, 800);
        } else {
            initPageAnimations(); // Fallback if no preloader
        }
    });

    function initPageAnimations() {
        if (typeof gsap === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        // Hero Text Reveal
        gsap.fromTo('.gsap-reveal', 
            { y: 60, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 1.5, stagger: 0.2, ease: 'power4.out' }
        );

        // Regular Fade Ins
        gsap.utils.toArray('.gsap-fade').forEach(element => {
            gsap.fromTo(element, 
                { y: 50, opacity: 0 },
                { scrollTrigger: { trigger: element, start: 'top 85%' }, y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }
            );
        });

        // Image Parallax Effect (The $10k touch)
        gsap.utils.toArray('.img-block img').forEach(img => {
            gsap.to(img, {
                yPercent: 20, // Moves image down as you scroll
                ease: "none",
                scrollTrigger: {
                    trigger: img.parentElement,
                    start: "top bottom", 
                    end: "bottom top",
                    scrub: true
                }
            });
        });

        // Hero Parallax
        if(document.querySelector('.hero-bg')) {
            gsap.to('.hero-bg', {
                yPercent: 30,
                ease: "none",
                scrollTrigger: { trigger: '.hero', start: "top top", end: "bottom top", scrub: true }
            });
        }
    }

    // Hide Navbar on Scroll Down, Show on Scroll Up
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll <= 0) navbar.classList.remove('hide');
        else if (currentScroll > lastScroll && currentScroll > 100) navbar.classList.add('hide');
        else navbar.classList.remove('hide');
        lastScroll = currentScroll;
    });

    if (document.getElementById('canvasContainer')) init3D();
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

// --- 4. THREE.JS 3D VIEWER (.GLB Loader) ---
function init3D() {
    if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') return;
    const canvasContainer = document.getElementById('canvasContainer');
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    canvasContainer.appendChild(renderer.domElement);

    let controls;
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; controls.dampingFactor = 0.05; controls.autoRotate = true; controls.autoRotateSpeed = 1.0;
    }

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2); dirLight.position.set(5, 10, 7); scene.add(dirLight);
    camera.position.z = 8;
    
    const loader = new THREE.GLTFLoader();
    let currentMesh = null;

    document.querySelectorAll('.card-img[data-model]').forEach(img => {
        img.addEventListener('click', () => {
            const type = img.dataset.model; 
            const modalTitle = document.getElementById('modalTitle');
            if (currentMesh) { scene.remove(currentMesh); currentMesh = null; }
            document.getElementById('modal3d').classList.add('open');
            if(lenis) lenis.stop();
            modalTitle.innerText = `Preparing ${type}...`;

            loader.load(`models/${type}.glb`, 
                function (gltf) {
                    currentMesh = gltf.scene;
                    const box = new THREE.Box3().setFromObject(currentMesh);
                    const size = box.getSize(new THREE.Vector3());
                    const scale = 5 / Math.max(size.x, size.y, size.z); 
                    currentMesh.scale.set(scale, scale, scale);
                    currentMesh.position.sub(new THREE.Box3().setFromObject(currentMesh).getCenter(new THREE.Vector3()));
                    scene.add(currentMesh);
                    modalTitle.innerText = type.charAt(0).toUpperCase() + type.slice(1);
                },
                undefined, function (error) { modalTitle.innerText = `Error loading models/${type}.glb`; }
            );
        });
    });

    document.getElementById('closeModal')?.addEventListener('click', () => {
        document.getElementById('modal3d').classList.remove('open');
        if(lenis) lenis.start();
    });

    function animate3D() { requestAnimationFrame(animate3D); if (controls) controls.update(); renderer.render(scene, camera); }
    animate3D();
}
// --- 5. CUSTOM CURSOR & MAGNETIC BUTTONS (LUXURY UPGRADE) ---
document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    
    // Only run on desktop devices
    if(window.matchMedia("(pointer: fine)").matches && cursor && follower) {
        let posX = 0, posY = 0, mouseX = 0, mouseY = 0;

        // Custom Cursor movement
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX; mouseY = e.clientY;
            // Update dot instantly
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        });

        // Smooth follow for the outer ring
        gsap.ticker.add(() => {
            posX += (mouseX - posX) / 6;
            posY += (mouseY - posY) / 6;
            gsap.set(follower, { left: posX, top: posY });
        });

        // Add hover effects for links, buttons, and images
        const hoverTargets = document.querySelectorAll('a, button, .interactive-img');
        hoverTargets.forEach(target => {
            target.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            target.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });

        // Magnetic Buttons logic
        const magneticElements = document.querySelectorAll('.magnetic');
        magneticElements.forEach(elem => {
            elem.addEventListener('mousemove', (e) => {
                const rect = elem.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                // Pull the button towards the mouse slightly
                gsap.to(elem, { x: x * 0.4, y: y * 0.4, duration: 0.3, ease: 'power2.out' });
            });

            elem.addEventListener('mouseleave', () => {
                // Snap back to original position
                gsap.to(elem, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
            });
        });
    }

    // --- 6. AMBIENT AUDIO CONTROLLER ---
    const audioBtn = document.getElementById('audioToggle');
    const audioTrack = document.getElementById('ambientAudio');
    const soundState = document.getElementById('soundState');

    if(audioBtn && audioTrack) {
        audioTrack.volume = 0.3; // Keep it subtle
        audioBtn.addEventListener('click', () => {
            if (audioTrack.paused) {
                audioTrack.play();
                audioBtn.classList.add('playing');
                soundState.innerText = "On";
            } else {
                audioTrack.pause();
                audioBtn.classList.remove('playing');
                soundState.innerText = "Off";
            }
        });
    }
});
// --- 7. CHECKOUT PAGE LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const checkoutItemsList = document.getElementById('checkoutItemsList');
    
    // Check if we are on the checkout page
    if(checkoutItemsList) {
        let currentCart = JSON.parse(localStorage.getItem('restaurantCart')) || [];
        let subtotal = 0;
        
        // Agar cart khali hai to wapas order page bhej do
        if(currentCart.length === 0) {
            checkoutItemsList.innerHTML = '<p style="color: #ff4444;">Your cart is empty.</p>';
            document.querySelector('.btn-primary').style.display = 'none';
        } else {
            // Render Items
            currentCart.forEach(item => {
                subtotal += item.price;
                checkoutItemsList.innerHTML += `
                    <div class="checkout-item-row">
                        <span>${item.name}</span>
                        <span>$${item.price.toFixed(2)}</span>
                    </div>
                `;
            });

            // Calculate Totals
            const deliveryFee = 15.00;
            const taxes = subtotal * 0.08; // 8% Tax
            const finalTotal = subtotal + deliveryFee + taxes;

            document.getElementById('checkoutSubtotal').innerText = subtotal.toFixed(2);
            document.getElementById('checkoutTaxes').innerText = taxes.toFixed(2);
            document.getElementById('checkoutFinalTotal').innerText = finalTotal.toFixed(2);
        }

        // Handle Fake Order Placement
        const orderForm = document.getElementById('placeOrderForm');
        if(orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // Clear cart
                localStorage.removeItem('restaurantCart');
                cart = []; 
                updateCartDisplay();
                
                // Show Success Message
                orderForm.innerHTML = `
                    <div style="text-align: center; padding: 4rem 0;">
                        <h2 style="color: var(--gold); font-size: 3rem; margin-bottom: 1rem;">Merci.</h2>
                        <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 2rem;">Your order has been placed successfully. The kitchen is preparing your masterpiece.</p>
                        <a href="index.html" class="btn-primary">Return Home</a>
                    </div>
                `;
            });
        }
    }
});