/**
 * URBAN EDGE — Main Application Controller
 * Live-renders 100% of website content from configuration.json.
 * Dynamic header, hero, categories, catalog, filters, editorial, offers, and footer.
 */

// Global Toast Notification Helper
function showToast(message, type = 'emerald') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'vermilion' ? 'toast-vermilion' : ''}`;
  
  const iconSvg = type === 'vermilion' 
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

  toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 300);
  }, 3200);
}

// Global Drawer Controller
function openCartDrawer() {
  closeAllDrawers();
  const drawer = document.getElementById('cartDrawerBackdrop');
  if (drawer) {
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (window.CartStore) window.CartStore.renderDrawer();
  }
}

function openWishlistDrawer() {
  closeAllDrawers();
  const drawer = document.getElementById('wishlistDrawerBackdrop');
  if (drawer) {
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (window.WishlistStore) window.WishlistStore.renderDrawer();
  }
}

function openMobileNav() {
  closeAllDrawers();
  const drawer = document.getElementById('mobileNavBackdrop');
  if (drawer) {
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeAllDrawers() {
  document.querySelectorAll('.drawer-backdrop, .mobile-nav-backdrop, .modal-backdrop').forEach(el => {
    el.classList.remove('open');
  });
  document.body.style.overflow = '';
}

// Copy Code to Clipboard
function copyPromoCode(code) {
  if (!code) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      showToast(`Coupon code ${code} copied to clipboard!`, 'emerald');
    }).catch(() => {
      promptFallbackCopy(code);
    });
  } else {
    promptFallbackCopy(code);
  }
}

function promptFallbackCopy(text) {
  const input = document.createElement('input');
  input.value = text;
  document.body.appendChild(input);
  input.select();
  try {
    document.execCommand('copy');
    showToast(`Coupon code ${text} copied to clipboard!`, 'emerald');
  } catch (err) {
    showToast(`Use coupon code: ${text}`, 'emerald');
  }
  document.body.removeChild(input);
}

// Extract Promo Code from headline
function extractCouponCode(headline) {
  if (!headline) return null;
  const match = headline.match(/code\s*:\s*([A-Z0-9]+)/i);
  return match ? match[1].toUpperCase() : null;
}

// ==========================================================================
// DYNAMIC DOM BUILDERS FROM CONFIGURATION.JSON
// ==========================================================================

// 1. Dynamic Header (Logo, Favicon, Title, Navigation Categories)
function renderDynamicHeader() {
  const brand = window.ProductStore.brand || {};
  const categories = window.ProductStore.categories || [];
  const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || !window.location.pathname.includes('.html');
  const linkPrefix = isHome ? '' : 'index.html';

  // Dynamic Browser Favicon
  const favicon = document.getElementById('siteFavicon');
  if (favicon && brand.brand_logo) {
    favicon.href = resolveMediaUrl(brand.brand_logo).src;
  }

  // Dynamic Page Title
  if (isHome && brand.brand_name) {
    document.title = `${brand.brand_name} — ${brand.brand_tagline || "Premium Men's Fashion"}`;
  }

  // Dynamic Brand Logo & Text in Header
  const brandWrap = document.querySelector('.brand-logo-wrap');
  if (brandWrap) {
    const brandName = escapeHtml(brand.brand_name || 'URBAN EDGE');
    const brandTagline = escapeHtml(brand.brand_tagline || 'Own Your Edge.');
    const logoMedia = resolveMediaUrl(brand.brand_logo);

    brandWrap.innerHTML = `
      ${logoMedia.src ? `
        <img 
          src="${escapeHtml(logoMedia.src)}" 
          alt="${brandName} Logo" 
          class="brand-logo-img" 
          onerror="this.style.display='none'; const fb = this.nextElementSibling; if(fb) fb.style.display='flex';"
        />
      ` : ''}
      <div class="brand-fallback-text" style="${logoMedia.src ? 'display:none;' : 'display:flex;'}">
        <span class="brand-name">${brandName}</span>
        <span class="brand-tagline">${brandTagline}</span>
      </div>
    `;
  }

  // Update Desktop Navigation (Powerlook style: Clean high-level links with Collections dropdown)
  const desktopNav = document.getElementById('desktopNav');
  const allProds = window.ProductStore.products || [];
  const hasNewArrivals = allProds.some(p => p.is_new_arrival || p.is_new);
  const hasMix = allProds.some(p => p.is_mix);

  if (desktopNav) {
    let navHtml = `
      <a href="${linkPrefix}#catalog" class="nav-link active" data-category-filter="all" onclick="if(window.navigateToCategory) window.navigateToCategory(event, 'all');">
        Shop All
      </a>
    `;
    
    if (hasNewArrivals) {
      navHtml += `
        <a href="${linkPrefix}#catalog" class="nav-link nav-link-new" onclick="if(window.filterByFlag) { event.preventDefault(); window.filterByFlag('new'); }">
          New Arrivals
        </a>
      `;
    }

    if (hasMix) {
      navHtml += `
        <a href="${linkPrefix}#catalog" class="nav-link nav-link-mix" onclick="if(window.filterByFlag) { event.preventDefault(); window.filterByFlag('mix'); }">
          The Mix
        </a>
      `;
    }

    // Collections Dropdown (Powerlook style: Clean dropdown showing occasions without cluttering the navbar)
    if (categories.length > 0) {
      navHtml += `
        <div class="nav-dropdown-wrap">
          <a href="${linkPrefix}#catalog" class="nav-link nav-dropdown-trigger" onclick="if(window.navigateToCategory) window.navigateToCategory(event, 'all');">
            Collections
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </a>
          <div class="nav-dropdown-menu">
            ${categories.map(cat => {
              const targetHref = isHome ? '#catalog' : `index.html?category=${encodeURIComponent(cat.name)}#catalog`;
              return `
                <a href="${targetHref}" class="nav-dropdown-link" onclick="if(window.navigateToCategory) window.navigateToCategory(event, '${escapeHtml(cat.name)}');">
                  <span>${escapeHtml(cat.name)}</span>
                  ${cat.count ? `<span class="nav-dropdown-count">${cat.count}</span>` : ''}
                </a>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (window.ProductStore.news && window.ProductStore.news.length > 0) {
      navHtml += `<a href="${linkPrefix}#offers" class="nav-link nav-link-sale">Offers</a>`;
    }

    desktopNav.innerHTML = navHtml;
  }

  // Update Mobile Navigation Menu List
  const mobileList = document.getElementById('mobileMenuList');
  if (mobileList) {
    let mobileHtml = `
      <li class="mobile-menu-item">
        <a href="${linkPrefix}#catalog" data-category-filter="all" onclick="closeAllDrawers(); if(window.navigateToCategory) window.navigateToCategory(event, 'all');">
          Shop All Silhouettes
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </a>
      </li>
    `;

    if (hasNewArrivals) {
      mobileHtml += `
        <li class="mobile-menu-item">
          <a href="${linkPrefix}#catalog" onclick="closeAllDrawers(); if(window.filterByFlag) window.filterByFlag('new');" style="color: var(--color-emerald); font-weight: 700;">
            ✨ New Arrivals
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </li>
      `;
    }

    if (hasMix) {
      mobileHtml += `
        <li class="mobile-menu-item">
          <a href="${linkPrefix}#catalog" onclick="closeAllDrawers(); if(window.filterByFlag) window.filterByFlag('mix');">
            The Mix
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </li>
      `;
    }

    if (categories.length > 0) {
      mobileHtml += `
        <li class="mobile-menu-section-header">Curated Collections</li>
        ${categories.map(cat => {
          const targetHref = isHome ? '#catalog' : `index.html?category=${encodeURIComponent(cat.name)}#catalog`;
          return `
            <li class="mobile-menu-item mobile-menu-subitem">
              <a href="${targetHref}" onclick="closeAllDrawers(); if(window.navigateToCategory) window.navigateToCategory(event, '${escapeHtml(cat.name)}');">
                ${escapeHtml(cat.name)}
                <span style="font-size: 0.75rem; color: var(--color-charcoal-muted);">${cat.count || ''}</span>
              </a>
            </li>
          `;
        }).join('')}
      `;
    }

    if (window.ProductStore.news && window.ProductStore.news.length > 0) {
      mobileHtml += `
        <li class="mobile-menu-item">
          <a href="${linkPrefix}#offers" onclick="closeAllDrawers();" style="color: var(--color-vermilion);">
            Special Offers &amp; Coupons
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </li>
      `;
    }

    mobileList.innerHTML = mobileHtml;
  }

  // Update Mobile Footer Contact
  const mobileFooter = document.getElementById('mobileDrawerFooter');
  if (mobileFooter) {
    const footer = window.ProductStore.footer || {};
    const phone = footer.footer_phone || '+91 9004580603';
    const hours = footer.footer_hours || 'Mon - Sun: 10:00 AM - 06:00 PM';
    mobileFooter.innerHTML = `
      <a href="tel:${phone.replace(/\s+/g, '')}" class="mobile-drawer-phone">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
        Customer Support: ${escapeHtml(phone)}
      </a>
      <div style="font-size: 0.75rem; color: var(--color-charcoal-muted);">${escapeHtml(hours)}</div>
    `;
  }
}

// 2. Dynamic Announcement Bar Ticker
let announcementTimer = null;
function renderDynamicAnnouncementBar() {
  const news = window.ProductStore.news || [];
  const slider = document.getElementById('announcementSlider');
  const bar = document.querySelector('.announcement-bar');
  if (!slider || !bar) return;

  if (news.length === 0) {
    bar.style.display = 'none';
    return;
  }

  bar.style.display = 'flex';
  slider.innerHTML = news.map((item, i) => {
    const headline = item.headline || '';
    const code = extractCouponCode(headline);
    const codeBadge = code 
      ? `<button type="button" class="announcement-code-badge" data-copy-code="${escapeHtml(code)}" title="Click to copy code">CODE: ${escapeHtml(code)}</button>`
      : '';

    return `
      <div class="announcement-item ${i === 0 ? 'active' : ''}">
        <span>${escapeHtml(headline)}</span>
        ${codeBadge}
      </div>
    `;
  }).join('');

  initAnnouncementTicker();
}

function initAnnouncementTicker() {
  const items = document.querySelectorAll('.announcement-item');
  if (items.length <= 1) return;

  let currentIndex = 0;
  if (announcementTimer) clearInterval(announcementTimer);

  function showSlide(index) {
    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
    currentIndex = index;
  }

  function nextSlide() {
    showSlide((currentIndex + 1) % items.length);
  }

  function prevSlide() {
    showSlide((currentIndex - 1 + items.length) % items.length);
  }

  const prevBtn = document.getElementById('announcementPrev');
  const nextBtn = document.getElementById('announcementNext');
  const bar = document.querySelector('.announcement-bar');

  if (prevBtn) prevBtn.onclick = () => { prevSlide(); startTimer(); };
  if (nextBtn) nextBtn.onclick = () => { nextSlide(); startTimer(); };

  function startTimer() {
    if (announcementTimer) clearInterval(announcementTimer);
    announcementTimer = setInterval(nextSlide, 4500);
  }

  if (bar) {
    bar.onmouseenter = () => clearInterval(announcementTimer);
    bar.onmouseleave = startTimer;
  }

  startTimer();
}

// 3. Dynamic Hero Carousel
let heroTimer = null;
function renderDynamicHeroSlider() {
  const heroList = window.ProductStore.hero || [];
  const wrap = document.getElementById('heroSliderWrap');
  const indicatorsBox = document.getElementById('heroIndicators');
  const heroSection = document.querySelector('.hero-section');
  if (!wrap || !heroSection) return;

  if (heroList.length === 0) {
    heroSection.style.display = 'none';
    return;
  }

  heroSection.style.display = 'block';

  wrap.innerHTML = heroList.map((h, i) => {
    const resp = (window.resolveResponsiveMedia && window.resolveResponsiveMedia(h, h.category || 'Contemporary Fashion Campaign')) || {
      desktop: resolveMediaUrl(h.desktop_image || h.image || h.mobile_image),
      mobile: resolveMediaUrl(h.mobile_image || h.desktop_image || h.image)
    };
    const desktopMedia = resp.desktop;
    const mobileMedia = resp.mobile;
    const title = h.title || 'Designed for Every Day.<br />Styled for Every Occasion.';
    const category = h.category || 'Contemporary Fashion';
    const link = h.link || '#catalog';

    return `
      <article class="hero-slide ${i === 0 ? 'active' : ''}">
        <div class="hero-media-wrap fit-desktop-${escapeHtml(h.desktop_fit_mode || 'cover')} fit-mobile-${escapeHtml(h.mobile_fit_mode || 'cover')}">
          <picture class="responsive-picture">
            <source media="(max-width: 768px)" srcset="${escapeHtml(mobileMedia.src)}" />
            <source media="(min-width: 769px)" srcset="${escapeHtml(desktopMedia.src)}" />
            <img 
              src="${escapeHtml(desktopMedia.src)}" 
              alt="${escapeHtml(category)} Campaign" 
              onerror="window.handlePictureFallback && window.handlePictureFallback(this, '${escapeHtml(desktopMedia.fallback)}', '${escapeHtml(mobileMedia.fallback)}')"
            />
          </picture>
          <div class="hero-overlay-gradient"></div>
        </div>
        <div class="container hero-content">
          <span class="hero-pretitle">${escapeHtml(category)}</span>
          <h2 class="hero-title">${title}</h2>
          <p class="hero-description">
            Uncompromising craftsmanship meets relaxed modern tailoring. Discover our handpicked edit of macro checks and artisanal linen blends.
          </p>
          <div class="hero-cta-group">
            <a href="${escapeHtml(link)}" class="btn btn-vermilion">Shop Collection</a>
            <a href="#editorial" class="btn btn-outline-light">Explore Story</a>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Render indicator dots
  if (indicatorsBox) {
    indicatorsBox.innerHTML = heroList.map((_, i) => `
      <button type="button" class="hero-indicator-dot ${i === 0 ? 'active' : ''}" data-slide-index="${i}" aria-label="Go to slide ${i + 1}"></button>
    `).join('');
  }

  initHeroControls();
}

function initHeroControls() {
  const slides = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('.hero-indicator-dot');
  if (slides.length <= 1) return;

  let current = 0;
  if (heroTimer) clearInterval(heroTimer);

  function goToSlide(idx) {
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    indicators.forEach((ind, i) => ind.classList.toggle('active', i === idx));
    current = idx;
  }

  function nextSlide() {
    goToSlide((current + 1) % slides.length);
  }

  function prevSlide() {
    goToSlide((current - 1 + slides.length) % slides.length);
  }

  const prevBtn = document.getElementById('heroPrevBtn');
  const nextBtn = document.getElementById('heroNextBtn');
  const heroSection = document.querySelector('.hero-section');

  if (prevBtn) prevBtn.onclick = () => { prevSlide(); start(); };
  if (nextBtn) nextBtn.onclick = () => { nextSlide(); start(); };

  indicators.forEach(ind => {
    ind.onclick = () => {
      const idx = Number(ind.getAttribute('data-slide-index'));
      goToSlide(idx);
      start();
    };
  });

  function start() {
    if (heroTimer) clearInterval(heroTimer);
    heroTimer = setInterval(nextSlide, 6000);
  }

  if (heroSection) {
    heroSection.onmouseenter = () => clearInterval(heroTimer);
    heroSection.onmouseleave = start;
  }

  start();
}

// 4. Dynamic Categories Discovery Section
function renderDynamicCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid || !window.ProductStore) return;

  const categories = window.ProductStore.categories;
  if (categories.length === 0) {
    const section = document.querySelector('.categories-section');
    if (section) section.style.display = 'none';
    return;
  }

  grid.innerHTML = categories.map(window.renderCategoryCardHtml).join('');
}

// 5. Dynamic Catalog Filter Controls (Powerlook style: Clean, minimal tabs without category pill clutter)
let currentCatalogFilter = {
  category: 'all',
  flag: 'all', // 'all' | 'new' | 'mix'
  search: '',
  maxPrice: null,
  size: '',
  sort: 'featured'
};

function renderDynamicCatalogFilters() {
  const pillsBox = document.getElementById('categoryFilterPills');
  if (pillsBox) {
    const products = window.ProductStore.products || [];
    const categories = window.ProductStore.categories || [];
    const newCount = products.filter(p => p.is_new_arrival || p.is_new).length;
    const mixCount = products.filter(p => p.is_mix).length;

    const isAllActive = currentCatalogFilter.category === 'all' && currentCatalogFilter.flag === 'all';
    const isNewActive = currentCatalogFilter.flag === 'new';
    const isMixActive = currentCatalogFilter.flag === 'mix';

    let pillsHtml = `
      <button type="button" class="filter-pill ${isAllActive ? 'active' : ''}" data-category="all" onclick="navigateToCategory(event, 'all')">
        All Products
      </button>
    `;

    // 1. Dynamic New Arrivals Tab
    if (newCount > 0) {
      pillsHtml += `
        <button type="button" class="filter-pill ${isNewActive ? 'active' : ''}" data-flag="new" onclick="filterByFlag('new')">
          New Arrivals
        </button>
      `;
    }

    // 2. Dynamic The Mix Tab (styled identically minimal)
    if (mixCount > 0) {
      pillsHtml += `
        <button type="button" class="filter-pill ${isMixActive ? 'active' : ''}" data-flag="mix" onclick="filterByFlag('mix')">
          The Mix
        </button>
      `;
    }

    // 3. Dynamic Category Tabs (Matching Powerlook Image 2 & 3)
    categories.forEach(cat => {
      const isCatActive = currentCatalogFilter.flag === 'all' && currentCatalogFilter.category.toLowerCase() === cat.name.toLowerCase();
      pillsHtml += `
        <button type="button" class="filter-pill ${isCatActive ? 'active' : ''}" data-category="${escapeHtml(cat.name)}" onclick="navigateToCategory(event, '${escapeHtml(cat.name)}')">
          ${escapeHtml(cat.name)}
        </button>
      `;
    });

    // 4. Powerlook "VIEW ALL" Action Link
    pillsHtml += `
      <a href="#catalog" class="view-all-pill-link" onclick="navigateToCategory(event, 'all'); return false;" aria-label="View all collection products">
        VIEW ALL <span>→</span>
      </a>
    `;

    pillsBox.innerHTML = pillsHtml;
  }

  const priceSelect = document.getElementById('catalogPriceSelect');
  if (priceSelect) {
    const bounds = window.ProductStore.getPriceBounds();
    const mid1 = Math.round(bounds.min + (bounds.max - bounds.min) * 0.4);
    const mid2 = Math.round(bounds.min + (bounds.max - bounds.min) * 0.7);

    priceSelect.innerHTML = `
      <option value="all">Price: All Ranges</option>
      <option value="${mid1}">Under ${formatPrice(mid1)}</option>
      <option value="${mid2}">Under ${formatPrice(mid2)}</option>
      <option value="${bounds.max}">Under ${formatPrice(bounds.max)}</option>
    `;
  }

  const sizeSelect = document.getElementById('catalogSizeSelect');
  if (sizeSelect) {
    const availableSizes = window.ProductStore.getAvailableSizes();
    let sizeOptions = `<option value="all">Size: All</option>`;
    availableSizes.forEach(s => {
      sizeOptions += `<option value="${escapeHtml(s)}">Size ${escapeHtml(s)}</option>`;
    });
    sizeSelect.innerHTML = sizeOptions;
  }
}

// Filter by Flag (New Arrivals, Mix, Showcase)
function filterByFlag(flagName) {
  currentCatalogFilter.flag = flagName;
  currentCatalogFilter.category = 'all';

  const titleEl = document.getElementById('catalogMainTitle');
  const noticeEl = document.getElementById('catalogActiveFilterNotice');
  if (titleEl) {
    titleEl.textContent = (flagName === 'mix') ? 'THE MIX' : ((flagName === 'new') ? 'NEW ARRIVALS' : 'CURATED EDITS');
  }
  if (noticeEl) {
    if (flagName !== 'all') {
      const label = flagName === 'mix' ? 'The Mix' : 'New Arrivals';
      noticeEl.style.display = 'block';
      noticeEl.innerHTML = `Viewing ${label} • <a href="#catalog" onclick="navigateToCategory(event, 'all')">View All New Arrivals</a>`;
    } else {
      noticeEl.style.display = 'none';
      noticeEl.innerHTML = '';
    }
  }

  renderDynamicCatalogFilters();
  renderCatalogGrid();

  const catalogEl = document.getElementById('catalog');
  if (catalogEl) {
    catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const label = flagName === 'new' ? 'New Arrivals' : (flagName === 'mix' ? 'The Mix' : 'Editorial Showcase');
  if (window.showToast) {
    window.showToast(`Filtered: ${label}`, 'emerald');
  }
}

// Dynamic Category Navigation & Redirection (smooth scroll, filter update, URL state)
function navigateToCategory(event, categoryName) {
  const isHome = window.location.pathname.endsWith('index.html') || 
                 window.location.pathname.endsWith('/') || 
                 !window.location.pathname.includes('.html');

  const targetCategory = (!categoryName || categoryName.toLowerCase() === 'home') ? 'all' : categoryName;

  if (!isHome) {
    window.location.href = `index.html?category=${encodeURIComponent(targetCategory)}#catalog`;
    return;
  }

  if (event && event.preventDefault) {
    event.preventDefault();
  }

  currentCatalogFilter.category = targetCategory;
  currentCatalogFilter.flag = 'all'; // reset flag when category is chosen

  // Update Section Title & Active Filter Notice
  const titleEl = document.getElementById('catalogMainTitle');
  const noticeEl = document.getElementById('catalogActiveFilterNotice');
  if (titleEl) {
    titleEl.textContent = (targetCategory === 'all') ? 'NEW ARRIVALS' : targetCategory.toUpperCase();
  }
  if (noticeEl) {
    if (targetCategory !== 'all') {
      noticeEl.style.display = 'block';
      noticeEl.innerHTML = `Viewing curated ${escapeHtml(targetCategory)} styles • <a href="#catalog" onclick="navigateToCategory(event, 'all')">View All New Arrivals</a>`;
    } else {
      noticeEl.style.display = 'none';
      noticeEl.innerHTML = '';
    }
  }

  // Re-render product grid
  renderDynamicCatalogFilters();
  renderCatalogGrid();

  // Smooth scroll to catalog section
  const catalogEl = document.getElementById('catalog');
  if (catalogEl) {
    catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Update URL history state without reloading
  const newUrl = targetCategory === 'all' 
    ? `${window.location.pathname}#catalog` 
    : `${window.location.pathname}?category=${encodeURIComponent(targetCategory)}#catalog`;
  window.history.pushState({ category: targetCategory }, '', newUrl);

  // User notification feedback
  const displayLabel = targetCategory === 'all' ? 'All Collections' : targetCategory;
  if (window.showToast) {
    window.showToast(`Viewing ${displayLabel}`, 'emerald');
  }
}

// Dynamic Mix Spotlight Section (Dedicated Curated Streetwear Drops)
function renderDynamicMixSpotlight() {
  const grid = document.getElementById('mixProductsGrid');
  if (!grid || !window.ProductStore) return;

  const mixProducts = window.ProductStore.products.filter(p => p.is_mix);
  if (mixProducts.length === 0) {
    const section = document.getElementById('mix');
    if (section) section.style.display = 'none';
    return;
  }

  grid.innerHTML = mixProducts.map(p => {
    const isWishlisted = window.WishlistStore ? window.WishlistStore.has(p.id) : false;
    return window.renderProductCardHtml(p, isWishlisted);
  }).join('');
}

// 6. Dynamic Catalog Product Grid (Clean, luxury fashion presentation without bulky debug banners)
function renderCatalogGrid() {
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('resultsCount');
  if (!grid || !window.ProductStore) return;

  const filtered = window.ProductStore.filterAndSort(currentCatalogFilter);
  const total = window.ProductStore.products.length;

  const isAll = (!currentCatalogFilter.category || currentCatalogFilter.category === 'all');
  const hasFlag = currentCatalogFilter.flag && currentCatalogFilter.flag !== 'all';
  const hasSearch = Boolean(currentCatalogFilter.search && currentCatalogFilter.search.trim().length > 0);

  if (countEl) {
    if (!isAll) {
      countEl.textContent = `Showing ${filtered.length} styles in ${currentCatalogFilter.category}`;
    } else if (hasFlag) {
      const flagLabel = currentCatalogFilter.flag === 'new' ? 'New Arrivals' : 'The Mix';
      countEl.textContent = `Showing ${filtered.length} styles in ${flagLabel}`;
    } else {
      countEl.textContent = `Showing ${filtered.length} of ${total} styles`;
    }
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3 class="empty-state-title">No matching styles found</h3>
        <p class="empty-state-desc">Try clearing filters or search terms to browse the entire collection.</p>
        <button type="button" class="btn btn-primary" onclick="resetCatalogFilters()">Clear All Filters</button>
      </div>
    `;
    return;
  }

  const topics = Array.isArray(window.ProductStore.topics) ? window.ProductStore.topics : [];
  let html = '';

  if (!isAll && !hasSearch) {
    // Category-specific view: Check if there is an editorial topic banner for this category
    const currentCatLower = currentCatalogFilter.category.toLowerCase();
    const matchingTopic = topics.find(t => {
      const target = window.ProductStore.resolveTopicTarget(t);
      return target.toLowerCase() === currentCatLower;
    });

    if (matchingTopic && window.renderTopicBannerHtml) {
      html += window.renderTopicBannerHtml(matchingTopic, 0, 'category-header-banner');
    }

    // Render filtered products (with the designated category cover photo naturally placed at index 0 in front!)
    html += filtered.map(p => {
      const isWishlisted = window.WishlistStore ? window.WishlistStore.has(p.id) : false;
      return window.renderProductCardHtml(p, isWishlisted);
    }).join('');
  } else if (topics.length > 0 && !hasSearch && window.renderTopicBannerHtml) {
    // "All Collections" view: Dynamically intersperse topic banners between complete 4-column product rows.
    // Interval is strictly a multiple of 4 (4 on desktop, 2x2 on mobile) to ensure zero empty grid gaps!
    // And topics only appear between product batches — never two topics in direct sequence!
    const interval = (filtered.length >= 24 && topics.length <= 3) ? 8 : 4;
    let topicIdx = 0;

    for (let i = 0; i < filtered.length; i++) {
      const p = filtered[i];
      const isWishlisted = window.WishlistStore ? window.WishlistStore.has(p.id) : false;
      html += window.renderProductCardHtml(p, isWishlisted);

      // Intersperse topic banner strictly after complete full rows
      if ((i + 1) % interval === 0 && topicIdx < topics.length) {
        html += window.renderTopicBannerHtml(topics[topicIdx], topicIdx, 'grid-break');
        topicIdx++;
      }
    }

    // If filtered catalog was smaller than interval (e.g. 1-3 products) and no topic was shown yet,
    // display at most one elegant closing banner (never multiple stacked in sequence!)
    if (topicIdx === 0 && topics.length > 0) {
      html += window.renderTopicBannerHtml(topics[0], 0, 'grid-break');
    }
  } else {
    // Standard flat products list (for flag filters or search)
    html = filtered.map(p => {
      const isWishlisted = window.WishlistStore ? window.WishlistStore.has(p.id) : false;
      return window.renderProductCardHtml(p, isWishlisted);
    }).join('');
  }

  grid.innerHTML = html;
}

function resetCatalogFilters() {
  currentCatalogFilter = {
    category: 'all',
    flag: 'all',
    search: '',
    maxPrice: null,
    size: '',
    sort: 'featured'
  };

  const searchInput = document.getElementById('inlineCatalogSearch');
  if (searchInput) searchInput.value = '';
  const clearBtn = document.getElementById('clearInlineSearch');
  if (clearBtn) clearBtn.classList.remove('visible');

  const sortSelect = document.getElementById('catalogSortSelect');
  if (sortSelect) sortSelect.value = 'featured';

  const priceSelect = document.getElementById('catalogPriceSelect');
  if (priceSelect) priceSelect.value = 'all';

  const sizeSelect = document.getElementById('catalogSizeSelect');
  if (sizeSelect) sizeSelect.value = 'all';

  renderDynamicCatalogFilters();
  renderCatalogGrid();
}

// 7. Dynamic Lookbook Showcase ("and show case only show photos not details")
function renderDynamicShowcase() {
  const grid = document.getElementById('editorialGrid');
  const section = document.getElementById('editorial');
  if (!grid || !section || !window.ProductStore) return;

  const photos = window.ProductStore.getShowcasePhotos();
  if (!photos || photos.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  // Strictly ONLY PHOTOS, NO DETAILS (no descriptions, no prices, no titles, no add to cart)
  grid.className = 'showcase-photos-only-grid';
  grid.innerHTML = photos.slice(0, 8).map((photoUrl, index) => {
    const imgTag = renderImgTag(photoUrl, `Lookbook Showcase Editorial Photo ${index + 1}`, 'showcase-photo-img');
    return `
      <div class="showcase-photo-tile" onclick="openPhotoLightbox('${escapeHtml(photoUrl)}')">
        <div class="showcase-photo-media">
          ${imgTag}
          <div class="showcase-hover-veil">
            <span class="showcase-zoom-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
              LOOKBOOK VIEW
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Alias to ensure backwards compatibility
function renderDynamicEditorial() {
  renderDynamicShowcase();
}

// Fullscreen Lookbook Lightbox (Clean, minimal viewer for pure photography)
function openPhotoLightbox(photoUrl) {
  let modal = document.getElementById('photoLightboxModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'photoLightboxModal';
    modal.className = 'lightbox-modal';
    modal.innerHTML = `
      <button type="button" class="lightbox-close-btn" onclick="closePhotoLightbox()" aria-label="Close photo preview">✕</button>
      <div class="lightbox-img-wrap" id="lightboxImgWrap"></div>
    `;
    modal.onclick = (e) => {
      if (e.target === modal) closePhotoLightbox();
    };
    document.body.appendChild(modal);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closePhotoLightbox();
      }
    });
  }

  const wrap = document.getElementById('lightboxImgWrap');
  if (wrap) {
    wrap.innerHTML = `<img src="${escapeHtml(photoUrl)}" alt="Lookbook Fullscreen Editorial Preview" />`;
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePhotoLightbox() {
  const modal = document.getElementById('photoLightboxModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// 8. Dynamic Offers Strip
function renderDynamicOffers() {
  const news = window.ProductStore.news || [];
  const grid = document.getElementById('offersGrid');
  const strip = document.getElementById('offers');
  if (!grid || !strip) return;

  if (news.length === 0) {
    strip.style.display = 'none';
    return;
  }

  strip.style.display = 'block';
  grid.innerHTML = news.map(item => {
    const headline = item.headline || '';
    const code = extractCouponCode(headline) || 'SAVE';
    return `
      <div class="offer-card">
        <div class="offer-headline">${escapeHtml(headline)}</div>
        <div class="offer-code-row">
          <span class="offer-code-text">${escapeHtml(code)}</span>
          <button type="button" class="btn-copy-code" data-copy-code="${escapeHtml(code)}">Copy Code</button>
        </div>
      </div>
    `;
  }).join('');
}

// 9. Dynamic Footer (Zero hardcoded address, phone, email, hours, links)
function renderDynamicFooter() {
  const footer = window.ProductStore.footer || {};
  const brand = window.ProductStore.brand || {};
  const categories = window.ProductStore.categories || [];
  const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || !window.location.pathname.includes('.html');
  const linkPrefix = isHome ? '' : 'index.html';

  const company = footer.footer_company || brand.brand_name || 'URBAN EDGE Pvt. Ltd.';
  const tagline = footer.footer_tagline || brand.brand_tagline || 'Own Your Edge.';
  const address = footer.footer_address || 'Lotus Corporate Park, Goregaon, Mumbai, 400063';
  const phone = footer.footer_phone || '+91 9004580603';
  const email = footer.footer_email || 'tambenick25@gmail.com';
  const hours = footer.footer_hours || 'Mon - Sun: 10:00 AM - 06:00 PM';
  const copyright = footer.footer_copyright || `© 2026 ${company}. All rights reserved.`;

  const footerBrand = document.getElementById('footerBrandCol');
  if (footerBrand) {
    footerBrand.innerHTML = `
      <h3 class="footer-brand-name">${escapeHtml(company)}</h3>
      <div class="footer-brand-tagline">${escapeHtml(tagline)}</div>
      <p class="footer-bio">
        Contemporary menswear label focused on premium linen blends, bold macro checks, and versatile silhouettes crafted for every day.
      </p>
      <div class="footer-social-links" id="footerSocialLinks"></div>
    `;
  }

  // Social Links
  const socialBox = document.getElementById('footerSocialLinks');
  if (socialBox && footer.social_links) {
    const s = footer.social_links;
    let socialHtml = '';
    if (s.instagram) socialHtml += `<a href="${escapeHtml(s.instagram)}" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>`;
    if (s.facebook) socialHtml += `<a href="${escapeHtml(s.facebook)}" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="Facebook"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>`;
    if (s.youtube) socialHtml += `<a href="${escapeHtml(s.youtube)}" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="YouTube"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg></a>`;
    if (s.whatsapp) socialHtml += `<a href="${escapeHtml(s.whatsapp)}" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="WhatsApp"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></a>`;
    socialBox.innerHTML = socialHtml;
  }

  // Footer Category Links
  const catLinksBox = document.getElementById('footerCategoryLinks');
  if (catLinksBox) {
    let catLinksHtml = '';
    categories.forEach(cat => {
      const targetHref = isHome ? '#catalog' : `index.html?category=${encodeURIComponent(cat.name)}#catalog`;
      catLinksHtml += `<li><a href="${targetHref}" data-category-filter="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</a></li>`;
    });
    catLinksHtml += `<li><a href="${linkPrefix}#catalog" data-category-filter="all">View All Collections</a></li>`;
    catLinksBox.innerHTML = catLinksHtml;
  }

  // Footer Contact Details
  const contactBox = document.getElementById('footerContactInfo');
  if (contactBox) {
    contactBox.innerHTML = `
      <div class="footer-contact-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        <span>${escapeHtml(address)}</span>
      </div>
      <div class="footer-contact-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
        <a href="tel:${phone.replace(/\s+/g, '')}">${escapeHtml(phone)}</a>
      </div>
      <div class="footer-contact-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
        <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
      </div>
      <div class="footer-contact-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <span>${escapeHtml(hours)}</span>
      </div>
    `;
  }

  // Footer Copyright Notice
  const copyrightBox = document.getElementById('footerCopyrightNotice');
  if (copyrightBox) {
    copyrightBox.textContent = copyright;
  }
}

// ==========================================================================
// MODALS: QUICK VIEW, SIZE GUIDE, CHECKOUT, LIVE SEARCH
// ==========================================================================

let activeQvSelectedSize = 'M';
function openQuickView(productId) {
  const product = window.ProductStore ? window.ProductStore.getById(productId) : null;
  if (!product) return;

  const modalBody = document.getElementById('quickViewModalBody');
  const modalBackdrop = document.getElementById('quickViewBackdrop');
  if (!modalBody || !modalBackdrop) return;

  const safeName = escapeHtml(product.name);
  const safeCat = escapeHtml(product.category);
  const safeDesc = escapeHtml(product.description);
  activeQvSelectedSize = product.sizes[0] || 'M';

  const imgTag = renderImgTag(product.primary_image, safeName, 'qv-main-img');

  modalBody.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem;" class="quickview-grid">
      <div style="position: relative; aspect-ratio: 4/5; background: var(--color-soft-neutral); overflow: hidden; border-radius: 2px;">
        ${imgTag}
        ${product.discount_percent > 0 ? `<span class="badge-discount" style="position: absolute; top: 1rem; left: 1rem;">${product.discount_percent}% OFF</span>` : ''}
      </div>
      <div style="display: flex; flex-direction: column; justify-content: center;">
        <span style="font-size: 0.75rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--color-emerald); margin-bottom: 0.4rem;">${safeCat}</span>
        <h2 style="font-family: var(--font-serif); font-size: 1.6rem; line-height: 1.25; margin-bottom: 0.75rem; color: var(--color-charcoal);">${safeName}</h2>
        <div style="display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 1rem;">
          <span style="font-size: 1.4rem; font-weight: 800; color: var(--color-charcoal);">${formatPrice(product.effective_price)}</span>
          ${product.price > product.effective_price ? `<span style="font-size: 1rem; color: var(--color-charcoal-muted); text-decoration: line-through;">${formatPrice(product.price)}</span>` : ''}
        </div>
        <p style="font-size: 0.875rem; line-height: 1.6; color: var(--color-charcoal-muted); margin-bottom: 1.25rem;">${safeDesc}</p>
        
        <div style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.8125rem; font-weight: 700; text-transform: uppercase;">Select Size</span>
            <button type="button" onclick="openSizeGuideModal()" style="font-size: 0.75rem; color: var(--color-emerald); text-decoration: underline;">Size Guide</button>
          </div>
          <div style="display: flex; gap: 0.5rem;" id="qvSizes">
            ${product.sizes.map(s => `
              <button type="button" class="size-chip ${s === activeQvSelectedSize ? 'selected' : ''}" style="width: 36px; height: 36px; font-size: 0.8125rem;" onclick="selectQvSize(this, '${s}')">${s}</button>
            `).join('')}
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
          <button type="button" class="btn btn-primary" id="qvAddBtn" style="flex: 1;" onclick="handleQvAdd('${product.id}')">
            Add To Bag
          </button>
          <a href="product.html?id=${product.id}" class="btn btn-outline-dark" style="flex: 1;">
            View Full Details
          </a>
        </div>
      </div>
    </div>
  `;

  modalBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function selectQvSize(btn, size) {
  document.querySelectorAll('#qvSizes .size-chip').forEach(el => el.classList.remove('selected'));
  btn.classList.add('selected');
  activeQvSelectedSize = size;
}

function handleQvAdd(productId) {
  if (window.CartStore) {
    window.CartStore.addItem(productId, activeQvSelectedSize, 1);
    closeAllDrawers();
    openCartDrawer();
  }
}

function openSizeGuideModal() {
  const modal = document.getElementById('sizeGuideBackdrop');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function openCheckoutModal() {
  if (!window.CartStore || window.CartStore.items.length === 0) {
    showToast('Your bag is currently empty.', 'vermilion');
    return;
  }
  closeAllDrawers();
  const modal = document.getElementById('checkoutBackdrop');
  if (modal) {
    const summaryBox = document.getElementById('checkoutOrderSummary');
    if (summaryBox) {
      const subtotal = window.CartStore.getSubtotal();
      const discount = window.CartStore.getDiscountAmount();
      const shipping = window.CartStore.getShippingFee();
      const total = window.CartStore.getFinalTotal();
      summaryBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.4rem;">
          <span>Items (${window.CartStore.getTotalCount()} items)</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
        ${discount > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: var(--color-emerald); margin-bottom: 0.4rem;">
            <span>Coupon Discount</span>
            <span>−${formatPrice(discount)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.4rem;">
          <span>Express Delivery</span>
          <span>${shipping === 0 ? '<strong style="color: var(--color-emerald);">FREE</strong>' : formatPrice(shipping)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 800; border-top: 1px solid var(--color-neutral-border); padding-top: 0.6rem; margin-top: 0.5rem; color: var(--color-charcoal);">
          <span>Total Payable</span>
          <span>${formatPrice(total)}</span>
        </div>
      `;
    }
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function openSearchModal() {
  closeAllDrawers();
  const modal = document.getElementById('searchBackdrop');
  const input = document.getElementById('liveSearchInput');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 150);
      handleLiveSearch('');
    }
  }
}

function handleLiveSearch(query) {
  const container = document.getElementById('liveSearchResults');
  if (!container || !window.ProductStore) return;

  const results = window.ProductStore.filterAndSort({ search: query });
  
  if (results.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--color-charcoal-muted);">
        <p style="font-size: 1rem; font-weight: 600; color: var(--color-charcoal);">No products found matching "${escapeHtml(query)}"</p>
        <p style="font-size: 0.85rem; margin-top: 0.5rem;">Try searching for pattern, color or category.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; max-height: 55vh; overflow-y: auto; padding: 0.5rem;">
      ${results.map(p => {
        const imgTag = renderImgTag(p.primary_image, p.name, 'search-thumb-img');
        return `
          <a href="product.html?id=${p.id}" style="display: flex; gap: 0.75rem; background: var(--color-pure-white); border: 1px solid var(--color-neutral-border); padding: 0.5rem; border-radius: 4px; transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--color-emerald)'" onmouseout="this.style.borderColor='var(--color-neutral-border)'">
            <div style="width: 55px; height: 68px; flex-shrink: 0; overflow: hidden; border-radius: 2px;">
              ${imgTag}
            </div>
            <div style="display: flex; flex-direction: column; justify-content: center; overflow: hidden;">
              <span style="font-size: 0.65rem; color: var(--color-emerald); font-weight: 700; text-transform: uppercase;">${escapeHtml(p.category)}</span>
              <span style="font-size: 0.8125rem; font-weight: 600; color: var(--color-charcoal); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(p.name)}</span>
              <span style="font-size: 0.85rem; font-weight: 800; color: var(--color-charcoal); margin-top: 0.2rem;">${formatPrice(p.effective_price)}</span>
            </div>
          </a>
        `;
      }).join('')}
    </div>
  `;
}

// ==========================================================================
// STOREFRONT INITIALIZER
// ==========================================================================

async function initStorefront() {
  const loaded = await window.ProductStore.init();
  if (!loaded) {
    console.error('Failed to initialize ProductStore from configuration.json');
    return;
  }

  window.CartStore.init();
  window.WishlistStore.init();

  // Render 100% Dynamic Sections from configuration.json
  renderDynamicHeader();
  renderDynamicAnnouncementBar();
  renderDynamicHeroSlider();
  renderDynamicCategories();
  renderDynamicCatalogFilters();
  renderCatalogGrid();
  renderDynamicMixSpotlight();
  renderDynamicEditorial();
  renderDynamicOffers();
  renderDynamicFooter();

  // Sticky Header Scroll Effect
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // Global Event Listeners
  initGlobalEvents();
}

// Global Event Listeners Setup
function initGlobalEvents() {
  document.querySelectorAll('[data-close-drawer]').forEach(btn => {
    btn.addEventListener('click', closeAllDrawers);
  });

  document.querySelectorAll('.drawer-backdrop, .mobile-nav-backdrop, .modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) closeAllDrawers();
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllDrawers();
  });

  document.querySelectorAll('[data-open-cart]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openCartDrawer();
    });
  });

  document.querySelectorAll('[data-open-wishlist]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openWishlistDrawer();
    });
  });

  document.querySelectorAll('[data-open-search]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openSearchModal();
    });
  });

  document.querySelectorAll('[data-open-mobile-menu]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openMobileNav();
    });
  });

  // Category Filter Pills Click
  document.addEventListener('click', e => {
    const pill = e.target.closest('.filter-pill');
    if (pill) {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCatalogFilter.category = pill.getAttribute('data-category');
      renderCatalogGrid();
    }
  });

  // Category Cards and Nav Links Click to filter
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-category-filter]');
    if (trigger && !trigger.classList.contains('filter-pill')) {
      const catName = trigger.getAttribute('data-category-filter');
      currentCatalogFilter.category = catName;

      // Update pills active state
      document.querySelectorAll('.filter-pill').forEach(p => {
        const pCat = p.getAttribute('data-category');
        p.classList.toggle('active', pCat.toLowerCase() === catName.toLowerCase());
      });

      // Update nav link active state
      document.querySelectorAll('#desktopNav .nav-link').forEach(l => {
        const lCat = l.getAttribute('data-category-filter');
        if (lCat) {
          l.classList.toggle('active', lCat.toLowerCase() === catName.toLowerCase());
        }
      });

      renderCatalogGrid();
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // Inline Search
  const inlineSearch = document.getElementById('inlineCatalogSearch');
  const clearInlineBtn = document.getElementById('clearInlineSearch');
  if (inlineSearch) {
    inlineSearch.addEventListener('input', e => {
      currentCatalogFilter.search = e.target.value;
      if (clearInlineBtn) {
        clearInlineBtn.classList.toggle('visible', Boolean(e.target.value));
      }
      renderCatalogGrid();
    });
  }
  if (clearInlineBtn) {
    clearInlineBtn.addEventListener('click', () => {
      if (inlineSearch) inlineSearch.value = '';
      currentCatalogFilter.search = '';
      clearInlineBtn.classList.remove('visible');
      renderCatalogGrid();
    });
  }

  // Sort & Secondary Filters
  const sortSelect = document.getElementById('catalogSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      currentCatalogFilter.sort = e.target.value;
      renderCatalogGrid();
    });
  }

  const priceSelect = document.getElementById('catalogPriceSelect');
  if (priceSelect) {
    priceSelect.addEventListener('change', e => {
      const val = e.target.value;
      currentCatalogFilter.maxPrice = (val === 'all') ? null : Number(val);
      renderCatalogGrid();
    });
  }

  const sizeSelect = document.getElementById('catalogSizeSelect');
  if (sizeSelect) {
    sizeSelect.addEventListener('change', e => {
      const val = e.target.value;
      currentCatalogFilter.size = (val === 'all') ? '' : val;
      renderCatalogGrid();
    });
  }

  // Live Search Modal Input
  const liveInput = document.getElementById('liveSearchInput');
  if (liveInput) {
    liveInput.addEventListener('input', e => {
      handleLiveSearch(e.target.value);
    });
  }

  // Product Card Interactions Delegation
  document.addEventListener('click', e => {
    // Wishlist Toggle
    const wishlistBtn = e.target.closest('[data-wishlist-id]');
    if (wishlistBtn) {
      e.preventDefault();
      const pId = wishlistBtn.getAttribute('data-wishlist-id');
      if (window.WishlistStore) {
        window.WishlistStore.toggle(pId);
      }
      return;
    }

    // Size Chip Click on Card
    const sizeChip = e.target.closest('.product-card .size-chip');
    if (sizeChip) {
      e.preventDefault();
      const card = sizeChip.closest('.product-card');
      if (card) {
        card.querySelectorAll('.size-chip').forEach(c => c.classList.remove('selected'));
        sizeChip.classList.add('selected');
        const addBtn = card.querySelector('[data-add-to-cart]');
        if (addBtn) {
          addBtn.setAttribute('data-selected-size', sizeChip.getAttribute('data-size'));
        }
      }
      return;
    }

    // Add to Cart on Card
    const addBtn = e.target.closest('[data-add-to-cart]');
    if (addBtn) {
      e.preventDefault();
      const pId = addBtn.getAttribute('data-add-to-cart');
      const size = addBtn.getAttribute('data-selected-size') || 'M';
      if (window.CartStore) {
        window.CartStore.addItem(pId, size, 1);
        openCartDrawer();
      }
      return;
    }

    // Quick View
    const qvBtn = e.target.closest('[data-quickview-id]');
    if (qvBtn) {
      e.preventDefault();
      const pId = qvBtn.getAttribute('data-quickview-id');
      openQuickView(pId);
      return;
    }

    // Copy Code Buttons
    const copyBtn = e.target.closest('[data-copy-code]');
    if (copyBtn) {
      e.preventDefault();
      const code = copyBtn.getAttribute('data-copy-code');
      copyPromoCode(code);
      return;
    }
  });

  // Newsletter Form Handler
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      if (input && input.value) {
        showToast('Thank you for joining our VIP circle!', 'emerald');
        input.value = '';
      }
    });
  }

  // Demo Checkout Form Handler
  const checkoutForm = document.getElementById('demoCheckoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = checkoutForm.custName.value.trim();
      const phone = checkoutForm.custPhone.value.trim();
      const pin = checkoutForm.custPin.value.trim();

      if (!name || !phone || !pin) {
        showToast('Please fill out all required shipping details.', 'vermilion');
        return;
      }

      const orderNumber = 'UE-' + Math.floor(100000 + Math.random() * 900000);
      const total = window.CartStore ? formatPrice(window.CartStore.getFinalTotal()) : '₹0';

      const modalBody = document.getElementById('checkoutModalBody');
      if (modalBody) {
        modalBody.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1rem;">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--color-emerald-subtle); color: var(--color-emerald); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 style="font-family: var(--font-serif); font-size: 1.75rem; margin-bottom: 0.5rem; color: var(--color-charcoal);">Demo Order Confirmed</h3>
            <p style="font-size: 0.95rem; color: var(--color-charcoal-muted); margin-bottom: 1.25rem;">Order Reference: <strong style="color: var(--color-emerald); font-family: monospace;">#${orderNumber}</strong></p>
            <div style="background: var(--color-warm-ivory); border: 1px solid var(--color-neutral-border); padding: 1.25rem; border-radius: 4px; max-width: 440px; margin: 0 auto 1.75rem; text-align: left; font-size: 0.85rem; line-height: 1.6;">
              <div><strong>Recipient:</strong> ${escapeHtml(name)} (${escapeHtml(phone)})</div>
              <div><strong>PIN Code:</strong> ${escapeHtml(pin)}</div>
              <div><strong>Total Amount:</strong> ${total}</div>
              <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed var(--color-neutral-border); color: var(--color-charcoal-muted); font-size: 0.75rem;">
                * Notice: Static storefront preview mode. In live production, this hands off to payment gateways.
              </div>
            </div>
            <button type="button" class="btn btn-primary" onclick="window.CartStore.clear(); closeAllDrawers();" style="min-width: 200px;">
              Back to Storefront
            </button>
          </div>
        `;
      }
    });
  }

  // Handle URL query parameters (e.g. ?category=DATE+READY or ?category=date-ready)
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('category');
  if (catParam) {
    let matchedCategory = catParam;
    if (window.ProductStore && window.ProductStore.categories) {
      const normalizedParam = catParam.replace(/[-_]/g, ' ').toLowerCase();
      const found = window.ProductStore.categories.find(c => 
        c.name.toLowerCase() === normalizedParam || 
        c.name.toLowerCase() === catParam.toLowerCase()
      );
      if (found) {
        matchedCategory = found.name;
      }
    }
    currentCatalogFilter.category = matchedCategory;
    document.querySelectorAll('.filter-pill').forEach(p => {
      const pillCat = p.getAttribute('data-category');
      if (pillCat) {
        p.classList.toggle('active', pillCat.toLowerCase() === matchedCategory.toLowerCase());
      }
    });
    renderCatalogGrid();
    setTimeout(() => {
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  }
}

// Expose globals
window.navigateToCategory = navigateToCategory;
window.openCartDrawer = openCartDrawer;
window.openWishlistDrawer = openWishlistDrawer;
window.openMobileNav = openMobileNav;
window.closeAllDrawers = closeAllDrawers;
window.copyPromoCode = copyPromoCode;
window.openQuickView = openQuickView;
window.openSizeGuideModal = openSizeGuideModal;
window.openCheckoutModal = openCheckoutModal;
window.openSearchModal = openSearchModal;
window.showToast = showToast;
window.resetCatalogFilters = resetCatalogFilters;
window.initStorefront = initStorefront;
window.renderDynamicHeader = renderDynamicHeader;
window.renderDynamicAnnouncementBar = renderDynamicAnnouncementBar;
window.renderDynamicHeroSlider = renderDynamicHeroSlider;
window.renderDynamicCategories = renderDynamicCategories;
window.renderDynamicCatalogFilters = renderDynamicCatalogFilters;
window.renderCatalogGrid = renderCatalogGrid;
window.renderDynamicMixSpotlight = renderDynamicMixSpotlight;
window.renderDynamicFooter = renderDynamicFooter;
