// ===== BCMOJANG Website JavaScript =====

document.addEventListener('DOMContentLoaded', () => {
    // ===== Navigation =====
    const nav = document.getElementById('mainNav');
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    // Scroll effect for nav
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });

    // Close mobile menu on link click
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });

    // ===== Smooth Scroll =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ===== Video Category Filters =====
    const filterBtns = document.querySelectorAll('.filter-btn');
    const videoCards = document.querySelectorAll('.video-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.dataset.category;

            // Filter cards with animation
            videoCards.forEach((card, index) => {
                if (category === 'all' || card.dataset.category === category) {
                    card.style.transition = 'opacity 300ms ease, transform 300ms ease';
                    card.style.transitionDelay = `${index * 50}ms`;
                    card.classList.remove('hidden');
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    card.style.transition = 'opacity 200ms ease, transform 200ms ease';
                    card.style.transitionDelay = '0ms';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        card.classList.add('hidden');
                    }, 200);
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
        const value = parseInt(priceSlider.value);
        priceDisplay.textContent = `¥${value.toLocaleString()}`;

        let count = 0;
        recCards.forEach((card, index) => {
            const price = parseInt(card.dataset.price);
            if (price <= value) {
                card.style.transition = 'opacity 300ms ease, transform 300ms ease';
                card.style.transitionDelay = `${count * 50}ms`;
                card.classList.remove('hidden');
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
                count++;
            } else {
                card.style.transition = 'opacity 200ms ease, transform 200ms ease';
                card.style.transitionDelay = '0ms';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    card.classList.add('hidden');
                }, 200);
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
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            statsAnimated = true;

            statNumbers.forEach(stat => {
                const target = parseInt(stat.dataset.target);
                const duration = 2000;
                const start = Date.now();

                function update() {
                    const elapsed = Date.now() - start;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Easing function
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const current = Math.floor(eased * target);

                    if (target >= 10000) {
                        stat.textContent = (current / 10000).toFixed(1) + '万';
                    } else {
                        stat.textContent = current.toLocaleString();
                    }

                    if (progress < 1) {
                        requestAnimationFrame(update);
                    } else {
                        if (target >= 10000) {
                            stat.textContent = (target / 10000).toFixed(1) + '万';
                        } else {
                            stat.textContent = target.toLocaleString();
                        }
                    }
                }

                requestAnimationFrame(update);
            });
        }
    }

    window.addEventListener('scroll', animateStats);
    animateStats();

    // ===== Scroll Reveal Animation =====
    const observerOptions = {
        root: null,
        rootMargin: '0px',
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

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

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
        });

        if (stickyClose) {
            stickyClose.addEventListener('click', () => {
                stickyVideo.classList.remove('visible');
            });
        }
    }

    // ===== Scroll-driven Color Shifts =====
    const sections = document.querySelectorAll('[data-section-color]');
    
    function updateSectionColors() {
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const sectionCenter = rect.top + rect.height / 2;
            const windowCenter = window.innerHeight / 2;
            const distance = Math.abs(sectionCenter - windowCenter);
            const maxDistance = window.innerHeight;
            const opacity = Math.max(0, 1 - distance / maxDistance);

            // Add a subtle glow effect based on section color
            const color = section.dataset.sectionColor;
            let glowColor;
            
            switch (color) {
                case 'red':
                    glowColor = 'rgba(255, 0, 0, ';
                    break;
                case 'blue':
                    glowColor = 'rgba(0, 212, 255, ';
                    break;
                case 'yellow':
                    glowColor = 'rgba(255, 255, 0, ';
                    break;
                default:
                    glowColor = 'rgba(255, 255, 255, ';
            }

            section.style.setProperty('--section-glow', `${glowColor}${opacity * 0.05})`);
        });
    }

    window.addEventListener('scroll', updateSectionColors);
    updateSectionColors();

    // ===== Video Card Hover Preview (Simulated) =====
    videoCards.forEach(card => {
        const thumbnail = card.querySelector('.card-thumbnail img');
        if (!thumbnail) return;

        let hoverTimeout;

        card.addEventListener('mouseenter', () => {
            hoverTimeout = setTimeout(() => {
                thumbnail.style.transform = 'scale(1.08)';
            }, 200);
        });

        card.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimeout);
            thumbnail.style.transform = 'scale(1)';
        });
    });

    // ===== Typewriter Effect for Signature =====
    const typewriterHint = document.getElementById('typewriterHint');
    if (typewriterHint) {
        const phrases = [
            '一个鸽子...',
            '2024差点入选百大up...',
            '大疆无人机玩家...',
            'Minecraft 服务器管理员...',
            '树莓派折腾爱好者...'
        ];
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function typewrite() {
            const currentPhrase = phrases[phraseIndex];

            if (isDeleting) {
                typewriterHint.textContent = currentPhrase.substring(0, charIndex - 1);
                charIndex--;
            } else {
                typewriterHint.textContent = currentPhrase.substring(0, charIndex + 1);
                charIndex++;
            }

            let typeSpeed = isDeleting ? 50 : 100;

            if (!isDeleting && charIndex === currentPhrase.length) {
                typeSpeed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                typeSpeed = 500;
            }

            setTimeout(typewrite, typeSpeed);
        }

        typewrite();
    }

    // ===== Hero Thumbnail Hover Effect =====
    const heroThumbnail = document.getElementById('heroThumbnail');
    if (heroThumbnail) {
        const wrapper = heroThumbnail.querySelector('.thumbnail-wrapper');
        if (wrapper) {
            wrapper.addEventListener('mouseenter', () => {
                wrapper.style.transform = 'scale(1.02)';
                wrapper.style.boxShadow = '0 20px 60px rgba(255, 0, 0, 0.2)';
            });

            wrapper.addEventListener('mouseleave', () => {
                wrapper.style.transform = 'scale(1)';
                wrapper.style.boxShadow = '0 8px 40px rgba(0, 0, 0, 0.5)';
            });
        }
    }

    // ===== Parallax Effect for Hero =====
    const hero = document.getElementById('hero');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const heroHeight = hero.offsetHeight;
            
            if (scrolled < heroHeight) {
                const heroContent = hero.querySelector('.hero-content');
                const heroThumbnail = hero.querySelector('.hero-thumbnail');
                
                if (heroContent) {
                    heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
                    heroContent.style.opacity = 1 - (scrolled / heroHeight) * 0.5;
                }
                
                if (heroThumbnail) {
                    heroThumbnail.style.transform = `translateY(${scrolled * 0.2}px)`;
                }
            }
        });
    }

    // ===== Dynamic Year in Footer =====
    const yearSpan = document.querySelector('.footer-bottom p');
    if (yearSpan) {
        const currentYear = new Date().getFullYear();
        yearSpan.textContent = yearSpan.textContent.replace('2026', currentYear);
    }

    console.log('BCMOJANG 网站加载完成！');
});
