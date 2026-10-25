/**
 * URBAN EDGE — Main Application Controller
 * Orchestrates store initialization, sliders, modals, search, toast notifications, and event delegation.
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
  
  let iconSvg = type === 'vermilion' 
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

// Copy Code to Clipboard with feedback
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

// Quick View Modal
function openQuickView(productId) {
  const product = window.ProductStore ? window.ProductStore.getById(productId) : null;
  if (!product) return;

  const modalBody = document.getElementById('quickViewModalBody');
  const modalBackdrop = document.getElementById('quickViewBackdrop');
  if (!modalBody || !modalBackdrop) return;

  const safeName = escapeHtml(product.name);
  const safeCat = escapeHtml(product.category);
  const safeDesc = escapeHtml(product.description);

  modalBody.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem;" class="quickview-grid">
      <div style="position: relative; aspect-ratio: 4/5; background: var(--color-soft-neutral); overflow: hidden; border-radius: 2px;">
        <img 
          id="qvMainImage" 
          src="${product.primary_image}" 
          alt="${safeName}" 
          style="width: 100%; height: 100%; object-fit: cover;"
          onerror="this.onerror=null; this.src='${getRemoteMediaFallback(product.raw_photos[0])}';"
        />
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
              <button type="button" class="size-chip ${s === 'M' ? 'selected' : ''}" style="width: 36px; height: 36px; font-size: 0.8125rem;" onclick="selectQvSize(this, '${s}')">${s}</button>
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

  // Inject responsive grid style if not already present
  modalBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

let activeQvSelectedSize = 'M';
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

// Size Guide Modal
function openSizeGuideModal() {
  const modal = document.getElementById('sizeGuideBackdrop');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

// Demo Checkout Modal
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

// Live Search Modal
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
        <p style="font-size: 0.85rem; margin-top: 0.5rem;">Try searching for "checks", "linen", "stripe", or browse our categories.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; max-height: 55vh; overflow-y: auto; padding: 0.5rem;">
      ${results.map(p => `
        <a href="product.html?id=${p.id}" style="display: flex; gap: 0.75rem; background: var(--color-pure-white); border: 1px solid var(--color-neutral-border); padding: 0.5rem; border-radius: 4px; transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--color-emerald)'" onmouseout="this.style.borderColor='var(--color-neutral-border)'">
          <img src="${p.primary_image}" alt="${escapeHtml(p.name)}" style="width: 55px; height: 68px; object-fit: cover; border-radius: 2px;" onerror="this.onerror=null; this.src='${getRemoteMediaFallback(p.raw_photos[0])}';" />
          <div style="display: flex; flex-direction: column; justify-content: center; overflow: hidden;">
            <span style="font-size: 0.65rem; color: var(--color-emerald); font-weight: 700; text-transform: uppercase;">${escapeHtml(p.category)}</span>
            <span style="font-size: 0.8125rem; font-weight: 600; color: var(--color-charcoal); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(p.name)}</span>
            <span style="font-size: 0.85rem; font-weight: 800; color: var(--color-charcoal); margin-top: 0.2rem;">${formatPrice(p.effective_price)}</span>
          </div>
        </a>
      `).join('')}
    </div>
  `;
}

// Initializer for Homepage UI
async function initStorefront() {
  // 1. Initialize Stores
  const loaded = await window.ProductStore.init();
  window.CartStore.init();
  window.WishlistStore.init();

  // 2. Sticky Header Scroll Effect
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

  // 3. Announcement Ticker
  initAnnouncementBar();

  // 4. Hero Carousel
  initHeroSlider();

  // 5. Populate Homepage Sections (Categories & Products Grid)
  renderHomepageCategories();
  renderCatalogSection();

  // 6. Global Event Delegation
  initGlobalEvents();
}

// Announcement Bar Animation
function initAnnouncementBar() {
  const items = document.querySelectorAll('.announcement-item');
  if (items.length <= 1) return;

  let currentIndex = 0;
  let timer = null;

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

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(nextSlide, 4500);
  }

  function stopAutoplay() {
    if (timer) clearInterval(timer);
  }

  const prevBtn = document.getElementById('announcementPrev');
  const nextBtn = document.getElementById('announcementNext');
  const bar = document.querySelector('.announcement-bar');

  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startAutoplay(); });

  if (bar) {
    bar.addEventListener('mouseenter', stopAutoplay);
    bar.addEventListener('mouseleave', startAutoplay);
  }

  startAutoplay();
}

// Hero Slider
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('.hero-indicator-dot');
  if (slides.length <= 1) return;

  let current = 0;
  let timer = null;

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

  function start() {
    stop();
    timer = setInterval(nextSlide, 6000);
  }

  function stop() {
    if (timer) clearInterval(timer);
  }

  const prevBtn = document.getElementById('heroPrevBtn');
  const nextBtn = document.getElementById('heroNextBtn');
  const heroSection = document.querySelector('.hero-section');

  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); start(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); start(); });

  indicators.forEach(ind => {
    ind.addEventListener('click', () => {
      const idx = Number(ind.getAttribute('data-slide-index'));
      goToSlide(idx);
      start();
    });
  });

  if (heroSection) {
    heroSection.addEventListener('mouseenter', stop);
    heroSection.addEventListener('mouseleave', start);
  }

  start();
}

// Render Categories Grid on Homepage
function renderHomepageCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid || !window.ProductStore) return;

  const categories = window.ProductStore.categories;
  grid.innerHTML = categories.map(window.renderCategoryCardHtml).join('');
}

// Catalog State & Rendering
let currentCatalogFilter = {
  category: 'all',
  search: '',
  maxPrice: null,
  size: '',
  sort: 'featured'
};

function renderCatalogSection() {
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('resultsCount');
  if (!grid || !window.ProductStore) return;

  const filtered = window.ProductStore.filterAndSort(currentCatalogFilter);

  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${window.ProductStore.products.length} shirts`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3 class="empty-state-title">No matching shirts found</h3>
        <p class="empty-state-desc">Try clearing filters or search terms to browse the entire collection.</p>
        <button type="button" class="btn btn-primary" onclick="resetCatalogFilters()">Clear All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const isWishlisted = window.WishlistStore ? window.WishlistStore.has(p.id) : false;
    return window.renderProductCardHtml(p, isWishlisted);
  }).join('');
}

function resetCatalogFilters() {
  currentCatalogFilter = {
    category: 'all',
    search: '',
    maxPrice: null,
    size: '',
    sort: 'featured'
  };

  // Reset UI elements
  document.querySelectorAll('.filter-pill').forEach(p => {
    p.classList.toggle('active', p.getAttribute('data-category') === 'all');
  });

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

  renderCatalogSection();
}

// Global Event Listeners Setup
function initGlobalEvents() {
  // Drawer close buttons and backdrops
  document.querySelectorAll('[data-close-drawer]').forEach(btn => {
    btn.addEventListener('click', closeAllDrawers);
  });

  document.querySelectorAll('.drawer-backdrop, .mobile-nav-backdrop, .modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) closeAllDrawers();
    });
  });

  // ESC key to close all modals and drawers
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllDrawers();
  });

  // Header Cart and Wishlist toggles
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

  // Category Filter Pills on Homepage
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCatalogFilter.category = pill.getAttribute('data-category');
      renderCatalogSection();
    });
  });

  // Category Cards Click to filter
  document.addEventListener('click', e => {
    const card = e.target.closest('[data-category-filter]');
    if (card) {
      const catName = card.getAttribute('data-category-filter');
      currentCatalogFilter.category = catName;
      // Update pills
      document.querySelectorAll('.filter-pill').forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-category').toLowerCase() === catName.toLowerCase());
      });
      renderCatalogSection();
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
      renderCatalogSection();
    });
  }
  if (clearInlineBtn) {
    clearInlineBtn.addEventListener('click', () => {
      if (inlineSearch) inlineSearch.value = '';
      currentCatalogFilter.search = '';
      clearInlineBtn.classList.remove('visible');
      renderCatalogSection();
    });
  }

  // Sort & Secondary Filters
  const sortSelect = document.getElementById('catalogSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      currentCatalogFilter.sort = e.target.value;
      renderCatalogSection();
    });
  }

  const priceSelect = document.getElementById('catalogPriceSelect');
  if (priceSelect) {
    priceSelect.addEventListener('change', e => {
      const val = e.target.value;
      currentCatalogFilter.maxPrice = (val === 'all') ? null : Number(val);
      renderCatalogSection();
    });
  }

  const sizeSelect = document.getElementById('catalogSizeSelect');
  if (sizeSelect) {
    sizeSelect.addEventListener('change', e => {
      const val = e.target.value;
      currentCatalogFilter.size = (val === 'all') ? '' : val;
      renderCatalogSection();
    });
  }

  // Live Search Modal Input
  const liveInput = document.getElementById('liveSearchInput');
  if (liveInput) {
    liveInput.addEventListener('input', e => {
      handleLiveSearch(e.target.value);
    });
  }

  // Delegate Product Card Interactions (Wishlist, Size chip selection, Add To Cart, Quick View)
  document.addEventListener('click', e => {
    // Wishlist Heart Toggle
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

    // Add to Cart Button on Card
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

    // Quick View Button
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
        showToast(`Thank you for joining URBAN EDGE! Check your inbox soon.`, 'emerald');
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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 style="font-family: var(--font-serif); font-size: 1.75rem; margin-bottom: 0.5rem; color: var(--color-charcoal);">Order Received in Demo Mode</h3>
            <p style="font-size: 0.95rem; color: var(--color-charcoal-muted); margin-bottom: 1.25rem;">Order Reference: <strong style="color: var(--color-emerald); font-family: monospace;">#${orderNumber}</strong></p>
            <div style="background: var(--color-warm-ivory); border: 1px solid var(--color-neutral-border); padding: 1.25rem; border-radius: 4px; max-width: 440px; margin: 0 auto 1.75rem; text-align: left; font-size: 0.85rem; line-height: 1.6;">
              <div><strong>Recipient:</strong> ${escapeHtml(name)} (${escapeHtml(phone)})</div>
              <div><strong>PIN Code:</strong> ${escapeHtml(pin)}</div>
              <div><strong>Total Amount:</strong> ${total}</div>
              <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed var(--color-neutral-border); color: var(--color-charcoal-muted); font-size: 0.75rem;">
                * Notice: This is a static storefront preview. No real funds were transferred and no courier dispatch was booked. In production, this completes via secure payment gateway handoff.
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

  // Handle URL query parameters (e.g. ?category=DATE+READY)
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('category');
  if (catParam) {
    currentCatalogFilter.category = catParam;
    document.querySelectorAll('.filter-pill').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-category').toLowerCase() === catParam.toLowerCase());
    });
    renderCatalogSection();
  }
}

// Expose globals
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
