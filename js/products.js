/**
 * URBAN EDGE — Dynamic Products & Configuration Data Engine
 * Every page load live-reads configuration.json (with cache-busting).
 * Media paths, categories, products, counts, hero banners, and brand info are 100% dynamic.
 */

// Helper to escape HTML characters in untrusted strings
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Indian Rupee formatting
function formatPrice(amount) {
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  return '₹' + num.toLocaleString('en-IN');
}

// Discount percentage calculator
function calculateDiscount(original, discounted) {
  const orig = Number(original);
  const disc = Number(discounted);
  if (!orig || !disc || orig <= disc) return 0;
  return Math.round(((orig - disc) / orig) * 100);
}

// Dynamic Media Path Resolver:
// Inspects whatever rawPath is currently in configuration.json,
// resolves relative/absolute paths, and provides fallback resolution.
function resolveMediaUrl(rawPath) {
  if (!rawPath) return { src: '', fallback: '', altFallback: '' };
  const trimmed = String(rawPath).trim();
  if (!trimmed) return { src: '', fallback: '', altFallback: '' };

  const filename = trimmed.includes('/') ? trimmed.split('/').pop().split('?')[0] : trimmed.split('?')[0];

  const mediaBaseUrl = (window.ProductStore && window.ProductStore.config && window.ProductStore.config.github && window.ProductStore.config.github.mediaBaseUrl)
    ? window.ProductStore.config.github.mediaBaseUrl.replace(/\/$/, '')
    : 'https://raw.githubusercontent.com/Noblecompute/customapp-bandhan/main/media';

  // 1. If it's a full remote URL (HTTP/HTTPS)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return {
      src: trimmed,
      fallback: `./media/${filename}`,
      altFallback: `${mediaBaseUrl}/${filename}`
    };
  }

  // 2. If it's a relative path starting with ./ or media/
  if (trimmed.startsWith('./') || trimmed.startsWith('media/')) {
    const clean = trimmed.startsWith('./') ? trimmed : `./${trimmed}`;
    return {
      src: clean,
      fallback: `${mediaBaseUrl}/${filename}`,
      altFallback: `./media/${filename}`
    };
  }

  // 3. Bare filename e.g. "photo.webp" or "apparel.jpg"
  return {
    src: `./media/${trimmed}`,
    fallback: `${mediaBaseUrl}/${trimmed}`,
    altFallback: trimmed
  };
}

// Helper to generate dynamic <img> tag with automatic multi-tier fallback
function renderImgTag(rawUrl, alt = '', className = '', loading = 'lazy') {
  const media = resolveMediaUrl(rawUrl);
  if (!media.src) {
    return `<div class="${escapeHtml(className)} placeholder-media" style="background: var(--color-soft-neutral); display: flex; align-items: center; justify-content: center;"><span style="font-size: 0.75rem; color: var(--color-charcoal-muted);">No image</span></div>`;
  }

  return `<img 
    src="${escapeHtml(media.src)}" 
    alt="${escapeHtml(alt)}" 
    class="${escapeHtml(className)}" 
    loading="${loading}"
    onerror="if(!this.dataset.fallbackTried){ this.dataset.fallbackTried='1'; this.src='${escapeHtml(media.fallback)}'; } else if(!this.dataset.altTried && '${escapeHtml(media.altFallback)}'){ this.dataset.altTried='1'; this.src='${escapeHtml(media.altFallback)}'; }"
  />`;
}

// Extract product name if missing in raw data
function deriveProductName(rawProduct) {
  if (rawProduct.name && rawProduct.name.trim()) {
    return rawProduct.name.trim();
  }
  if (rawProduct.description) {
    const firstSentence = rawProduct.description.split('.')[0].trim();
    if (firstSentence.length > 0 && firstSentence.length <= 50) {
      return firstSentence;
    }
    const match = firstSentence.match(/^(.*?)(?:,|\.|\bwith\b|\bfeaturing\b)/i);
    if (match && match[1] && match[1].trim().length > 3) {
      return match[1].trim();
    }
  }
  const cat = (rawProduct.category && rawProduct.category.trim()) 
    ? rawProduct.category.charAt(0).toUpperCase() + rawProduct.category.slice(1).toLowerCase() 
    : 'Style';
  return `Contemporary ${cat}`;
}

// Normalize raw product object from JSON
function normalizeProduct(raw) {
  const price = Number(raw.price) || 0;
  const discountPrice = Number(raw.discount_price) || price;
  const effectivePrice = (discountPrice > 0 && discountPrice < price) ? discountPrice : price;
  const discountPercent = calculateDiscount(price, effectivePrice);
  
  const rawPhotos = Array.isArray(raw.photos) && raw.photos.length > 0 
    ? raw.photos 
    : [];

  return {
    id: String(raw.id || Math.floor(Math.random() * 1000000)),
    name: deriveProductName(raw),
    category: (raw.category && raw.category.trim()) ? raw.category.trim() : 'COLLECTION',
    price: price,
    discount_price: discountPrice,
    effective_price: effectivePrice,
    discount_percent: discountPercent,
    description: raw.description || 'Premium crafted contemporary apparel designed for comfort and modern style.',
    photos: rawPhotos,
    primary_image: rawPhotos[0] || '',
    secondary_image: rawPhotos[1] || rawPhotos[0] || '',
    sizes: (Array.isArray(raw.sizes) && raw.sizes.length > 0) ? raw.sizes : ['S', 'M', 'L', 'XL', 'XXL'],
    is_category_cover: Boolean(raw.is_category_cover),
    is_new: Boolean(raw.is_new_arrival),
    is_showcase: Boolean(raw.is_showcase),
    is_enabled: raw.is_enabled !== false
  };
}

// Product Repository State
const ProductStore = {
  config: null,
  products: [],
  categories: [],
  topics: [],
  brand: {},
  hero: [],
  news: [],
  footer: {},
  isLoaded: false,

  async init() {
    let rawConfig = null;
    try {
      // Live fetch with cache-busting timestamp so edits to configuration.json show immediately
      const url = `configuration.json?t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status} when loading configuration.json`);
      rawConfig = await res.json();
    } catch (err) {
      console.error('Failed to live-load configuration.json:', err);
      // Fallback attempt without query param if local server rejected query strings
      try {
        const res2 = await fetch('configuration.json');
        if (res2.ok) rawConfig = await res2.json();
      } catch (err2) {
        console.error('Secondary configuration load also failed:', err2);
      }
    }

    if (!rawConfig || !rawConfig.data) {
      console.error('Unable to parse valid website data from configuration.json.');
      return false;
    }

    this.config = rawConfig;
    const d = rawConfig.data;

    // 1. Dynamic Brand
    this.brand = d.brand || {
      brand_name: 'URBAN EDGE',
      brand_tagline: 'Own Your Edge.',
      brand_logo: ''
    };

    // 2. Dynamic Hero Slides
    this.hero = Array.isArray(d.hero) ? d.hero : [];

    // 3. Dynamic News / Announcements
    this.news = Array.isArray(d.news) ? d.news : [];

    // 4. Dynamic Footer
    this.footer = d.footer || {};

    // 5. Dynamic Products (subpages) - never hardcode counts
    if (Array.isArray(d.subpages)) {
      this.products = d.subpages
        .map(normalizeProduct)
        .filter(p => p.is_enabled); // only active products
    } else {
      this.products = [];
    }

    // 6. Dynamic Categories (from configuration.json + any categories present in products)
    const rawCategories = Array.isArray(d.categories) ? d.categories : [];

    // 7. Dynamic Topics / Thematic Campaigns (from configuration.json)
    this.topics = Array.isArray(d.topics) ? d.topics.map(t => ({
      id: String(t.id || ''),
      name: (t.topic_name || '').trim(),
      image: (t.topic_image || '').trim(),
      category: (t.category || '').trim(),
      link: (t.link || '').trim()
    })).filter(t => t.image) : [];
    
    // Build category map
    const catMap = new Map();
    rawCategories
      .filter(c => c && c.category_name && c.category_name.toLowerCase() !== 'home')
      .forEach(c => {
        catMap.set(c.category_name.toUpperCase(), {
          id: c.id,
          name: c.category_name,
          raw_image: c.category_image || '',
          link: c.link || ''
        });
      });

    // Also include categories derived from products if not already defined
    this.products.forEach(p => {
      const catUpper = p.category.toUpperCase();
      if (!catMap.has(catUpper)) {
        catMap.set(catUpper, {
          id: 'cat_' + catUpper.replace(/\s+/g, '_').toLowerCase(),
          name: p.category,
          raw_image: p.primary_image,
          link: ''
        });
      }
    });

    // Compute live product counts and image covers for each category
    this.categories = Array.from(catMap.values()).map(cat => {
      const matchingProducts = this.products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase());
      let coverImage = cat.raw_image;
      if (!coverImage && matchingProducts.length > 0) {
        coverImage = matchingProducts[0].primary_image;
      }
      return {
        id: cat.id,
        name: cat.name,
        image: coverImage,
        raw_image: cat.raw_image,
        count: matchingProducts.length
      };
    });

    this.isLoaded = true;
    return true;
  },

  getAll() {
    return this.products;
  },

  getById(id) {
    return this.products.find(p => String(p.id) === String(id));
  },

  getByCategory(categoryName) {
    if (!categoryName || categoryName === 'all') return this.products;
    return this.products.filter(p => p.category.toLowerCase() === categoryName.toLowerCase());
  },

  resolveTopicTarget(topic) {
    if (!topic) return 'all';
    const cat = (topic.category || '').trim();
    if (!cat || cat.toLowerCase() === 'home' || cat.toLowerCase() === 'all') {
      return 'all';
    }
    return cat;
  },

  getAvailableSizes() {
    const sizeSet = new Set();
    this.products.forEach(p => {
      p.sizes.forEach(s => sizeSet.add(s));
    });
    const standardOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    const sorted = Array.from(sizeSet).sort((a, b) => {
      const ia = standardOrder.indexOf(a);
      const ib = standardOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      return a.localeCompare(b);
    });
    return sorted.length > 0 ? sorted : ['S', 'M', 'L', 'XL', 'XXL'];
  },

  getPriceBounds() {
    if (this.products.length === 0) return { min: 0, max: 5000 };
    let min = Infinity;
    let max = -Infinity;
    this.products.forEach(p => {
      if (p.effective_price < min) min = p.effective_price;
      if (p.effective_price > max) max = p.effective_price;
    });
    return { min, max };
  },

  filterAndSort({ category = 'all', search = '', maxPrice = null, size = '', sort = 'featured' }) {
    let result = [...this.products];

    // Filter by Category
    if (category && category !== 'all') {
      result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by Search Query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.id.includes(q)
      );
    }

    // Filter by Max Price
    if (maxPrice && !isNaN(maxPrice)) {
      result = result.filter(p => p.effective_price <= Number(maxPrice));
    }

    // Filter by Size
    if (size && size !== 'all') {
      result = result.filter(p => p.sizes.includes(size.toUpperCase()));
    }

    // Sort
    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.effective_price - b.effective_price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.effective_price - a.effective_price);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'discount-desc':
        result.sort((a, b) => b.discount_percent - a.discount_percent);
        break;
      case 'featured':
      default:
        // maintain JSON order
        break;
    }

    return result;
  }
};

// UI Component: Product Card HTML Template (Dynamic media resolution & tags)
function renderProductCardHtml(product, isWishlisted = false) {
  const safeName = escapeHtml(product.name);
  const safeCat = escapeHtml(product.category);
  const discountBadge = product.discount_percent > 0 
    ? `<span class="badge-discount">${product.discount_percent}% OFF</span>` 
    : '';
  
  const originalPriceHtml = (product.price > product.effective_price)
    ? `<span class="price-original">${formatPrice(product.price)}</span>`
    : '';

  const savingsHtml = (product.price > product.effective_price)
    ? `<span class="price-saved">Save ${formatPrice(product.price - product.effective_price)}</span>`
    : '';

  const wishlistClass = isWishlisted ? 'active' : '';

  const primaryImgTag = renderImgTag(product.primary_image, safeName, 'product-img-primary');
  const secondaryImgTag = renderImgTag(product.secondary_image, `${safeName} - Alternate View`, 'product-img-secondary');

  const defaultSize = product.sizes[0] || 'M';

  return `
    <article class="product-card" data-product-id="${product.id}">
      <div class="product-card-media">
        <div class="card-badges">
          ${discountBadge}
          <span class="badge-editorial">PREMIUM</span>
        </div>
        
        <button type="button" class="card-wishlist-btn ${wishlistClass}" data-wishlist-id="${product.id}" aria-label="Save ${safeName} to wishlist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? '#E34222' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>

        <a href="product.html?id=${product.id}" class="card-media-link" aria-label="View details for ${safeName}">
          ${primaryImgTag}
          ${secondaryImgTag}
        </a>

        <div class="card-quick-actions">
          <button type="button" class="btn-quick-view" data-quickview-id="${product.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            Quick View
          </button>
        </div>
      </div>

      <div class="product-card-body">
        <span class="card-category">${safeCat}</span>
        <h3 class="card-title">
          <a href="product.html?id=${product.id}">${safeName}</a>
        </h3>

        <div class="card-price-row">
          <span class="price-current">${formatPrice(product.effective_price)}</span>
          ${originalPriceHtml}
          ${savingsHtml}
        </div>

        <div class="card-sizes-row">
          <span class="size-label">Size:</span>
          ${product.sizes.map(s => `
            <button type="button" class="size-chip ${s === defaultSize ? 'selected' : ''}" data-size="${s}" data-product-id="${product.id}">
              ${s}
            </button>
          `).join('')}
        </div>

        <button type="button" class="card-add-btn" data-add-to-cart="${product.id}" data-selected-size="${defaultSize}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          Add To Bag
        </button>
      </div>
    </article>
  `;
}

// UI Component: Category Discovery Card HTML (Dynamic live count and image)
function renderCategoryCardHtml(cat) {
  const safeName = escapeHtml(cat.name);
  const imgTag = renderImgTag(cat.image, `${safeName} Collection`);
  const countText = cat.count === 1 ? '1 Style Available' : `${cat.count} Styles Available`;

  return `
    <div class="category-card" data-category-filter="${safeName}">
      <div class="category-img-wrap">
        ${imgTag}
        <div class="category-card-overlay">
          <div class="category-info">
            <h3 class="category-name">${safeName}</h3>
            <div style="font-size: 0.75rem; color: var(--color-warm-ivory); margin-bottom: 0.35rem; opacity: 0.9;">
              ${countText}
            </div>
            <span class="category-cta-pill">
              Explore Collection
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// UI Component: Thematic Topic Campaign Banner HTML (Dynamic category redirect & image)
function renderTopicBannerHtml(topic, index = 0, variant = 'grid-break') {
  if (!topic || !topic.image) return '';
  const targetCategory = window.ProductStore ? window.ProductStore.resolveTopicTarget(topic) : (topic.category || 'all');
  const safeCat = escapeHtml(targetCategory);
  const safeName = escapeHtml(topic.name || topic.category || 'Curated Style Campaign');
  const tagText = targetCategory.toLowerCase() === 'all' ? 'SHOP ALL STYLES' : `SHOP ${safeCat.toUpperCase()}`;
  const bannerImgTag = renderImgTag(topic.image, safeName, 'topic-banner-img', 'lazy');

  return `
    <aside class="topic-campaign-card ${escapeHtml(variant)}" data-topic-index="${index}" data-topic-category="${safeCat}">
      <a href="index.html?category=${encodeURIComponent(targetCategory)}#catalog" 
         class="topic-banner-link" 
         onclick="window.navigateToCategory && window.navigateToCategory(event, '${safeCat}')"
         aria-label="Explore ${safeName}">
        <div class="topic-banner-media">
          ${bannerImgTag}
          <div class="topic-banner-overlay">
            <span class="topic-category-tag">
              ${tagText}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </span>
          </div>
        </div>
      </a>
    </aside>
  `;
}

window.ProductStore = ProductStore;
window.renderProductCardHtml = renderProductCardHtml;
window.renderCategoryCardHtml = renderCategoryCardHtml;
window.renderTopicBannerHtml = renderTopicBannerHtml;
window.formatPrice = formatPrice;
window.escapeHtml = escapeHtml;
window.resolveMediaUrl = resolveMediaUrl;
window.renderImgTag = renderImgTag;
