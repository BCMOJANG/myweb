// ===== BCMOJANG Website - Premium JavaScript =====

document.addEventListener('DOMContentLoaded', () => {
    // ===== Page Loader =====
    const loader = document.querySelector('.page-loader');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => loader.classList.add('loaded'), 800);
        });
        // Fallback
        setTimeout(() => loader.classList.add('loaded'), 2000);
    }

    // ===== Scroll Progress =====
    const scrollProgress = document.querySelector('.scroll-progress');
    if (scrollProgress) {
        const updateProgress = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? scrollTop / docHeight : 0;
            scrollProgress.style.transform = `scaleX(${progress})`;
        };
        window.addEventListener('scroll', updateProgress, { passive: true });
    }

    // ===== Custom Cursor =====
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');
    
    if (cursorDot && cursorRing && window.innerWidth > 768) {
        let mouseX = 0, mouseY = 0;
        let ringX = 0, ringY = 0;

        const updateCursor = () => {
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top = mouseY + 'px';

            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            cursorRing.style.left = ringX + 'px';
            cursorRing.style.top = ringY + 'px';

            requestAnimationFrame(updateCursor);
        };

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Hover effect for interactive elements
        const interactiveElements = document.querySelectorAll('a, button, .video-card, .rec-card, .review-card, .filter-btn');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
        });

        updateCursor();
    }

    // ===== Navigation =====
    const nav = document.getElementById('mainNav');
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    // Throttled scroll handler
    let ticking = false;
    const handleScroll = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                if (window.scrollY > 50) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Mobile menu toggle
    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });

        document.querySelectorAll('.mobile-link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // ===== Smooth Scroll =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // ===== Video Category Filters =====
    const filterBtns = document.querySelectorAll('.filter-btn');
    const videoCards = document.querySelectorAll('.video-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.dataset.category;

            videoCards.forEach((card, index) => {
                if (category === 'all' || card.dataset.category === category) {
                    card.style.transitionDelay = `${index * 50}ms`;
                    card.classList.remove('hidden');
                    requestAnimationFrame(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0) scale(1)';
                    });
                } else {
                    card.style.transitionDelay = '0ms';
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px) scale(0.95)';
                    setTimeout(() => card.classList.add('hidden'), 300);
                }
            });
        });
    });

    // ===== Price Range Slider =====
    const priceSlider = document.getElementById('priceSlider');
    const priceDisplay = document.getElementById('priceDisplay');
    const priceCount = document.getElementById('priceCount');
    const recCards = document.querySelectorAll('.rec-card');

    function updatePriceFilter() {
        if (!priceSlider) return;
        const value = parseInt(priceSlider.value);
        priceDisplay.textContent = `¥${value.toLocaleString()}`;

        let count = 0;
        recCards.forEach((card, index) => {
            const price = parseInt(card.dataset.price);
            if (price <= value) {
                card.style.transitionDelay = `${count * 60}ms`;
                card.classList.remove('hidden');
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
                count++;
            } else {
                card.style.transitionDelay = '0ms';
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px) scale(0.95)';
                setTimeout(() => card.classList.add('hidden'), 300);
            }
        });

        priceCount.textContent = `${count} 款推荐`;
    }

    if (priceSlider) {
        priceSlider.addEventListener('input', updatePriceFilter);
        updatePriceFilter();
    }

    // ===== Stats Counter Animation =====
    const statNumbers = document.querySelectorAll('.stat-number');
    let statsAnimated = false;

    function animateStats() {
        if (statsAnimated) return;

        const statsSection = document.querySelector('.stats-bar');
        if (!statsSection) return;

        const rect = statsSection.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8 && rect.bottom > 0) {
            statsAnimated = true;

            statNumbers.forEach(stat => {
                const target = parseInt(stat.dataset.target);
                const duration = 2000;
                const start = performance.now();

                function update(currentTime) {
                    const elapsed = currentTime - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 4);
                    const current = Math.floor(eased * target);

                    if (target >= 10000) {
                        stat.textContent = (current / 10000).toFixed(1) + '万';
                    } else {
                        stat.textContent = current.toLocaleString();
                    }

                    if (progress < 1) {
                        requestAnimationFrame(update);
                    } else {
                        stat.textContent = target >= 10000 ? (target / 10000).toFixed(1) + '万' : target.toLocaleString();
                    }
                }

                requestAnimationFrame(update);
            });
        }
    }

    window.addEventListener('scroll', animateStats, { passive: true });
    animateStats();

    // ===== Scroll Reveal Animation =====
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.video-card, .review-card, .rec-card').forEach(card => {
        observer.observe(card);
    });

    // ===== Back to Top Button =====
    const backToTop = document.getElementById('backToTop');

    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }, { passive: true });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== Sticky Video on Scroll =====
    const stickyVideo = document.getElementById('stickyVideo');
    const stickyClose = document.getElementById('stickyClose');
    const reviewsSection = document.getElementById('reviews');

    if (stickyVideo && reviewsSection) {
        window.addEventListener('scroll', () => {
            const rect = reviewsSection.getBoundingClientRect();
            if (rect.top < 0 && rect.bottom > window.innerHeight) {
                stickyVideo.classList.add('visible');
            } else {
                stickyVideo.classList.remove('visible');
            }
        }, { passive: true });

        if (stickyClose) {
            stickyClose.addEventListener('click', () => {
                stickyVideo.classList.remove('visible');
            });
        }

        // Make sticky video clickable
        const stickyPlayer = stickyVideo.querySelector('.sticky-player');
        if (stickyPlayer) {
            stickyPlayer.addEventListener('click', () => {
                window.open('https://www.bilibili.com/video/BV1LQWGzzEFR/', '_blank');
            });
        }
    }

    // ===== Hero Parallax Effect =====
    const hero = document.getElementById('hero');
    if (hero && window.innerWidth > 768) {
        const heroContent = hero.querySelector('.hero-content');
        const heroThumbnail = hero.querySelector('.hero-thumbnail');

        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const heroHeight = hero.offsetHeight;

            if (scrolled < heroHeight) {
                const progress = scrolled / heroHeight;
                if (heroContent) {
                    heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
                    heroContent.style.opacity = 1 - progress * 0.6;
                }
                if (heroThumbnail) {
                    heroThumbnail.style.transform = `translateY(${scrolled * 0.15}px)`;
                }
            }
        }, { passive: true });
    }

    // ===== Card Tilt Effect =====
    if (window.innerWidth > 768) {
        const cards = document.querySelectorAll('.video-card, .rec-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    // ===== Magnetic Buttons =====
    if (window.innerWidth > 768) {
        const magneticBtns = document.querySelectorAll('.btn-primary, .nav-cta');
        magneticBtns.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

    // ===== Text Reveal on Scroll =====
    const revealTexts = document.querySelectorAll('.section-title, .hero-title, .about-title');
    const textObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                textObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    revealTexts.forEach(text => {
        text.style.opacity = '0';
        text.style.transform = 'translateY(30px)';
        text.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        textObserver.observe(text);
    });

    // ===== Dynamic Year =====
    const yearEl = document.querySelector('.footer-bottom p');
    if (yearEl) {
        yearEl.textContent = yearEl.textContent.replace('2026', new Date().getFullYear());
    }

    // ===== Console Message =====
    console.log('%c🚀 BCMOJANG Website', 'font-size: 20px; font-weight: bold; color: #ff2d2d;');
    console.log('%c一个鸽子的折腾日记', 'font-size: 14px; color: #999;');
});
