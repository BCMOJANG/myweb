// ===== BCMOJANG Website - Dynamic Data Loader =====

// Global data store
let siteData = null;

// Load data from JSON file
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Failed to load data');
        siteData = await response.json();
        return siteData;
    } catch (error) {
        console.error('Error loading data:', error);
        return null;
    }
}

// Format number with Chinese units
function formatNumber(num) {
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
}

// Generate video card HTML
function createVideoCard(video) {
    return `
        <article class="video-card" data-category="${video.category}">
            <a href="https://www.bilibili.com/video/${video.id}" class="card-link" target="_blank">
                <div class="card-thumbnail">
                    <img src="${video.thumbnail}@640w_360h_1c" 
                         alt="${video.title}" loading="lazy">
                    <div class="card-play">▶</div>
                    <div class="card-duration">${video.duration}</div>
                    <div class="card-views">${video.views}</div>
                </div>
                <div class="card-body">
                    <div class="card-category">${getCategoryName(video.category)}</div>
                    <h3 class="card-title">${video.title}</h3>
                    <p class="card-excerpt">${video.excerpt}</p>
                    <div class="card-meta">
                        <span>${video.date}</span>
                        <span>·</span>
                        <span>${video.views} 次观看</span>
                    </div>
                </div>
            </a>
        </article>
    `;
}

// Generate review card HTML
function createReviewCard(review) {
    const featuredClass = review.featured ? ' featured' : '';
    const badgeHTML = review.badge ? `<div class="review-badge">${review.badge}</div>` : '';
    const highlightsHTML = review.highlights ? `
        <div class="review-highlights">
            <div class="highlight">
                <span class="highlight-label">阅读量</span>
                <span class="highlight-value">${review.highlights.views}</span>
            </div>
            <div class="highlight">
                <span class="highlight-label">收藏</span>
                <span class="highlight-value">${review.highlights.favorites}</span>
            </div>
            <div class="highlight">
                <span class="highlight-label">点赞</span>
                <span class="highlight-value">${review.highlights.likes}</span>
            </div>
        </div>
    ` : '';

    return `
        <article class="review-card${featuredClass}">
            <a href="${review.url}" class="review-link-wrapper" target="_blank">
                <div class="review-thumbnail">
                    <img src="${review.thumbnail}@800w_450h_1c" 
                         alt="${review.title}" loading="lazy">
                    ${badgeHTML}
                    <div class="review-read-time">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                        </svg>
                        ${review.read_time}
                    </div>
                </div>
                <div class="review-body">
                    <div class="review-tags">
                        ${review.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <h3 class="review-title">${review.title}</h3>
                    <p class="review-excerpt">${review.excerpt}</p>
                    ${highlightsHTML}
                    <span class="review-link">
                        ${review.type === 'article' ? '阅读完整教程' : '查看详细教程'}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                    </span>
                </div>
            </a>
        </article>
    `;
}

// Generate recommendation card HTML
function createRecCard(rec) {
    return `
        <a href="https://www.bilibili.com/video/${rec.video_id}" class="rec-card" data-price="${rec.price}" target="_blank">
            <div class="rec-rank">#${rec.rank}</div>
            <div class="rec-image">
                <img src="${rec.image}" alt="${rec.title}" loading="lazy">
            </div>
            <div class="rec-body">
                <div class="rec-category">${rec.category}</div>
                <h3 class="rec-title">${rec.title}</h3>
                <p class="rec-reason">${rec.reason}</p>
                <div class="rec-price">¥${rec.price.toLocaleString()}</div>
                <div class="rec-verdict">
                    <span class="verdict-label">推荐指数</span>
                    <span class="verdict-score">${rec.score}</span>
                </div>
            </div>
        </a>
    `;
}

// Get category display name
function getCategoryName(categoryId) {
    const category = siteData.categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
}

// Render all dynamic content
function renderContent() {
    if (!siteData) return;

    // Update hero section
    const heroBadge = document.querySelector('.hero-badge');
    const heroTitle = document.querySelector('.hero-title');
    const heroDesc = document.querySelector('.hero-desc');
    const heroThumbnail = document.querySelector('.thumbnail-wrapper img');
    const heroDuration = document.querySelector('.thumbnail-duration');
    const heroLink = document.querySelector('.btn-primary');

    if (heroBadge) heroBadge.textContent = siteData.hero.badge;
    if (heroTitle) {
        heroTitle.innerHTML = `
            <span class="title-line">${siteData.hero.title_line1}</span>
            <span class="title-line accent">${siteData.hero.title_line2}</span>
        `;
    }
    if (heroDesc) heroDesc.textContent = siteData.hero.description;
    if (heroThumbnail) heroThumbnail.src = `${siteData.hero.thumbnail}@960w_540h_1c`;
    if (heroDuration) heroDuration.textContent = siteData.hero.duration;
    if (heroLink) heroLink.href = siteData.hero.video_url;

    // Update hero meta
    const heroMeta = document.querySelector('.hero-meta');
    if (heroMeta) {
        heroMeta.innerHTML = `
            <span class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                ${siteData.hero.duration}
            </span>
            <span class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                ${siteData.hero.views} 次观看
            </span>
            <span class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
                ${siteData.hero.likes} 点赞
            </span>
        `;
    }

    // Update stats
    const statNumbers = document.querySelectorAll('.stat-number');
    const statTargets = [
        siteData.stats.followers,
        siteData.stats.videos,
        siteData.stats.views,
        siteData.stats.likes
    ];
    statNumbers.forEach((stat, index) => {
        if (statTargets[index] !== undefined) {
            stat.dataset.target = statTargets[index];
        }
    });

    // Update filter buttons
    const filtersContainer = document.getElementById('videoFilters');
    if (filtersContainer) {
        filtersContainer.innerHTML = siteData.categories.map(cat => 
            `<button class="filter-btn${cat.id === 'all' ? ' active' : ''}" data-category="${cat.id}">${cat.name}</button>`
        ).join('');
    }

    // Update video grid
    const videoGrid = document.getElementById('videoGrid');
    if (videoGrid) {
        videoGrid.innerHTML = siteData.videos.map(video => createVideoCard(video)).join('');
    }

    // Update reviews grid
    const reviewsGrid = document.querySelector('.reviews-grid');
    if (reviewsGrid) {
        reviewsGrid.innerHTML = siteData.reviews.map(review => createReviewCard(review)).join('');
    }

    // Update recommendations grid
    const recGrid = document.getElementById('recommendationsGrid');
    if (recGrid) {
        recGrid.innerHTML = siteData.recommendations.map(rec => createRecCard(rec)).join('');
    }

    // Update about section
    const aboutTitle = document.querySelector('.about-title');
    const aboutTexts = document.querySelectorAll('.about-text');
    if (aboutTitle) aboutTitle.textContent = siteData.about.title;
    if (aboutTexts.length >= 2) {
        aboutTexts[0].textContent = siteData.about.description[0];
        aboutTexts[1].textContent = siteData.about.description[1];
    }

    // Update avatar
    const avatarImg = document.querySelector('.about-image img');
    if (avatarImg) avatarImg.src = `${siteData.profile.avatar}@600w_600h_1c`;

    // Update stats in about section
    const aboutStats = document.querySelectorAll('.about-stat-num');
    if (aboutStats.length >= 4) {
        aboutStats[0].textContent = siteData.stats.videos;
        aboutStats[1].textContent = siteData.stats.followers;
        aboutStats[2].textContent = formatNumber(siteData.stats.views);
        aboutStats[3].textContent = formatNumber(siteData.stats.likes);
    }

    // Update contact links
    const qqTier = document.querySelector('.tier:first-child .tier-price');
    const githubTier = document.querySelector('.tier:last-child .tier-price');
    if (qqTier) qqTier.textContent = siteData.profile.qq_group;
    if (githubTier) githubTier.textContent = '@' + siteData.profile.bilibili.split('/').pop();

    // Update Bilibili links
    document.querySelectorAll('a[href*="space.bilibili.com"]').forEach(link => {
        if (link.href.includes('1248933612')) {
            // Keep as is, it's already correct
        }
    });

    // Update footer
    const footerTagline = document.querySelector('.footer-tagline');
    if (footerTagline) footerTagline.textContent = siteData.profile.signature;

    // Update page title
    document.title = `${siteData.profile.name} | 科技·无人机·折腾 - 一个鸽子的创作空间`;

    console.log('✅ Content rendered from data.json');
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    renderContent();
    
    // Re-initialize interactive elements after rendering
    initInteractiveElements();
});

// Re-initialize interactive elements after dynamic content load
function initInteractiveElements() {
    // Re-init filter buttons
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

    // Re-init price slider
    const priceSlider = document.getElementById('priceSlider');
    const priceDisplay = document.getElementById('priceDisplay');
    const priceCount = document.getElementById('priceCount');
    const recCards = document.querySelectorAll('.rec-card');

    if (priceSlider) {
        priceSlider.addEventListener('input', () => {
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
        });

        // Trigger initial filter
        priceSlider.dispatchEvent(new Event('input'));
    }

    // Re-init scroll observer
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

    // Re-init cursor hover effect
    if (window.innerWidth > 768) {
        const cursorRing = document.querySelector('.cursor-ring');
        if (cursorRing) {
            const interactiveElements = document.querySelectorAll('a, button, .video-card, .rec-card, .review-card, .filter-btn');
            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
                el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
            });
        }
    }
}
