// Deklarasikan lenis di cakupan global
let lenis;

document.addEventListener('DOMContentLoaded', () => {
    // --- INISIALISASI LENIS SMOOTH SCROLL OPTIMIZED ---
    lenis = new Lenis({
        duration: 1.0, 
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
        direction: 'vertical',
        smooth: true,
        smoothTouch: false 
    });

    window.lenis = lenis;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;
    let lastScrollY = 0; 

    const cursor = document.getElementById('custom-cursor');
    const bttBtn = document.getElementById('back-to-top');
    const navbar = document.getElementById('main-navbar');

    // SIKLUS RAF UTAMA
    function raf(time) {
        if (lenis) lenis.raf(time);

        if (cursor && cursor.style.display !== 'none') {
            cursorX += (mouseX - cursorX) * 0.15;
            cursorY += (mouseY - cursorY) * 0.15;
            gsap.set(cursor, { x: cursorX, y: cursorY });
        }
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // EVENT SCROLL UTAMA
    lenis.on('scroll', (e) => {
        ScrollTrigger.update();
        if (typeof window.onSmoothScroll === 'function') {
            window.onSmoothScroll(e.progress);
        }

        const currentScrollY = e.scroll;

        if (navbar) {
            if (currentScrollY > lastScrollY && currentScrollY > 80) {
                navbar.classList.add('-translate-y-full');
            } else {
                navbar.classList.remove('-translate-y-full');
            }
        }

        if (bttBtn) {
            if (currentScrollY > window.innerHeight * 0.5) {
                bttBtn.classList.remove('opacity-0', 'pointer-events-none', 'scale-75');
                bttBtn.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
            } else {
                bttBtn.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
                bttBtn.classList.add('opacity-0', 'pointer-events-none', 'scale-75');
            }
        }

        lastScrollY = currentScrollY;
    });

    const loadingScreen = document.getElementById('loading-screen');
    const chooseLightBtn = document.getElementById('choose-light');
    const chooseDarkBtn = document.getElementById('choose-dark');
    const themeToggleBtn = document.getElementById('theme-toggle');

    if (cursor) {
        cursor.style.opacity = '0';
        cursor.style.display = 'none';
    }

    // --- FUNGSI KLIK NAVIGASI YANG AMAN (DISEKUTIF LANGSUNG) ---
    function bindNavigationEvents() {
        const scrollButtons = document.querySelectorAll('[data-target], #back-to-top');
        
        scrollButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                let targetValue = button.getAttribute('data-target') || 'top';
                
                if (targetValue === 'top' || button.id === 'back-to-top') {
                    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
                    return;
                }

                // Pengaman otomatis jika Anda lupa menulis tanda '#' di HTML data-target
                if (!targetValue.startsWith('#') && !targetValue.startsWith('.')) {
                    targetValue = '#' + targetValue;
                }

                const targetElement = document.querySelector(targetValue);
                if (targetElement) {
                    if (lenis) {
                        lenis.scrollTo(targetElement, {
                            offset: -64, 
                            duration: 1.2,
                            immediate: false
                        });
                    } else {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                } else {
                    console.warn(`Elemen target "${targetValue}" tidak ditemukan di HTML.`);
                }
            });
        });
    }

    function selectTheme(mode) {
        if (mode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Panggil fungsi navigasi SEGERA agar tombol langsung bisa diklik
        bindNavigationEvents();

        // Cari fungsi Three.js dengan toleransi nama lama atau nama baru agar tidak crash
        try {
            if (typeof window.initThreeAnimation === 'function') {
                window.initThreeAnimation();
            } else if (typeof initThree === 'function') {
                initThree();
            }
            
            if (typeof window.updateParticleColor === 'function') {
                window.updateParticleColor();
            } else if (typeof updateParticleColor === 'function') {
                updateParticleColor();
            }
        } catch (error) {
            console.error("Three.js memicu error, namun scroll diselamatkan:", error);
        }

        gsap.to(loadingScreen, {
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out',
            onComplete: () => {
                loadingScreen.style.display = 'none';
                document.body.classList.remove('overflow-hidden');
                document.documentElement.classList.remove('overflow-hidden');
                
                ScrollTrigger.refresh();
                if (lenis) lenis.resize();

                if (cursor && window.innerWidth >= 768) {
                    cursor.style.display = 'block';
                    gsap.to(cursor, { opacity: 1, duration: 0.3 });
                }
                startHeroAnimations();
            }
        });
    }

    if (chooseLightBtn) chooseLightBtn.addEventListener('click', () => selectTheme('light'));
    if (chooseDarkBtn) chooseDarkBtn.addEventListener('click', () => selectTheme('dark'));

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            if (typeof window.updateParticleColor === 'function') {
                window.updateParticleColor();
            } else if (typeof updateParticleColor === 'function') {
                updateParticleColor();
            }
        });
    }

    function startHeroAnimations() {
        const tl = gsap.timeline();
        tl.to('#hero-title', { opacity: 1, y: 0, duration: 1, ease: 'power4.out' })
          .to('#hero-desc', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
          .to('#hero-btn', { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.3')
          .onComplete(() => {
              initScrollTriggers();
              setupInteractions(); 
          });
    }

    function initScrollTriggers() {
        gsap.registerPlugin(ScrollTrigger);

        ScrollTrigger.scrollerProxy(document.body, {
            scrollTop(value) {
                if (lenis) {
                    return arguments.length ? lenis.scrollTo(value, {immediate: true}) : lenis.scroll;
                }
                return arguments.length ? window.scrollTo(0, value) : window.scrollY;
            },
            getBoundingClientRect() {
                return {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight};
            }
        });

        gsap.to(['#hero-title', '#hero-desc', '#hero-btn'], {
            scrollTrigger: {
                trigger: 'main',          
                start: 'top top',         
                end: 'bottom center',     
                scrub: true               
            },
            opacity: 0,
            y: -50,                      
            scale: 0.95,                 
            duration: 1
        });

        gsap.fromTo('#about-title', 
            { opacity: 0, y: 40 },
            {
                scrollTrigger: {
                    trigger: '#about',
                    start: 'top 75%',     
                    toggleActions: 'play none none reverse' 
                },
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out'
            }
        );

        ScrollTrigger.refresh();
    }

    // --- LOGIKA HORIZONTAL SLIDER ARCHIVE ---
    const track = document.getElementById('slider-track');
    const nextBtn = document.getElementById('next-slide');
    const prevBtn = document.getElementById('prev-slide');
    
    if (track && nextBtn && prevBtn) {
        let currentIndex = 0;
        const slides = document.querySelectorAll('.slide-page');
        const totalSlides = slides.length;

        window.animateSlideElements = function(index) {
            const activeSlide = slides[index];
            if (!activeSlide) return;

            const num = activeSlide.querySelector('.slide-num');
            const title = activeSlide.querySelector('.slide-title');
            const desc = activeSlide.querySelector('.slide-desc');
            const deco = activeSlide.querySelector('.slide-bg-deco');

            slides.forEach((slide, i) => {
                if (i !== index) {
                    gsap.set(slide.querySelector('.slide-num'), { opacity: 0, y: 20 });
                    gsap.set(slide.querySelector('.slide-title'), { opacity: 0, y: 30 });
                    gsap.set(slide.querySelector('.slide-desc'), { opacity: 0, y: 25 });
                    gsap.set(slide.querySelector('.slide-bg-deco'), { opacity: 0, scale: 0.6 });
                }
            });

            const slideTimeline = gsap.timeline();
            slideTimeline
                .to(num, { opacity: 0.5, y: 0, duration: 0.4 })
                .to(title, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.25')
                .to(desc, { opacity: 0.8, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.35')
                .to(deco, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.5)' }, '-=0.45');
        }

        function updateSlider() {
            const slidePageElem = document.querySelector('.slide-page');
            if(!slidePageElem) return;
            const slideWidth = slidePageElem.clientWidth;
            const gap = 32; 
            const amountToScroll = currentIndex * (slideWidth + gap);
            
            gsap.to(track, {
                x: -amountToScroll,
                duration: 0.7,
                ease: 'power3.out',
                onComplete: () => {
                    animateSlideElements(currentIndex);
                }
            });

            prevBtn.style.opacity = currentIndex === 0 ? '0.3' : '1';
            prevBtn.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
            nextBtn.style.opacity = currentIndex === totalSlides - 1 ? '0.3' : '1';
            nextBtn.style.pointerEvents = currentIndex === totalSlides - 1 ? 'none' : 'auto';
        }

        nextBtn.addEventListener('click', () => {
            if (currentIndex < totalSlides - 1) {
                currentIndex++;
                updateSlider();
            }
        });

        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateSlider();
            }
        });

        updateSlider();
    }

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function setupInteractions() {
        if (!cursor) return;
        const interactiveElements = document.querySelectorAll('a, button, .nav-link, [data-target], #theme-toggle, #prev-slide, #next-slide, .slide-page');
        
        interactiveElements.forEach((elem) => {
            elem.removeEventListener('mouseenter', onMouseEnter);
            elem.removeEventListener('mouseleave', onMouseLeave);
            
            elem.addEventListener('mouseenter', onMouseEnter);
            elem.addEventListener('mouseleave', onMouseLeave);
        });
    }

    function onMouseEnter() {
        const svg = cursor.querySelector('svg');
        if (svg) gsap.to(svg, { scale: 1.3, duration: 0.15 });
    }

    function onMouseLeave() {
        const svg = cursor.querySelector('svg');
        if (svg) gsap.to(svg, { scale: 1, duration: 0.15 });
    }
});