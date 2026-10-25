/**
 * URBAN EDGE — Products & Data Management
 * Handles catalog loading, normalization, filtering, searching, and product card rendering.
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

// Converts any media URL or filename into a robust relative path with fallback
function resolveMediaUrl(url) {
  if (!url) return './media/file1.png';
  if (url.startsWith('./media/') || url.startsWith('media/')) return url;
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return `./media/${filename}`;
}

// Fallback GitHub raw URL if local file is missing
function getRemoteMediaFallback(url) {
  if (!url) return '';
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return `https://raw.githubusercontent.com/Noblecompute/customapp-bandhan/main/media/${filename}`;
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

// Extract product name if missing in raw data
function deriveProductName(rawProduct) {
  if (rawProduct.name && rawProduct.name.trim()) {
    return rawProduct.name.trim();
  }
  if (rawProduct.description) {
    const firstSentence = rawProduct.description.split('.')[0].trim();
    if (firstSentence.toLowerCase().includes('shirt')) {
      // Find something like "Light Blue Linen Blend Shirt featuring..." -> "Light Blue Linen Blend Shirt"
      const match = firstSentence.match(/^(.*?shirt)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }
  return 'Contemporary Linen Shirt';
}

// Normalize raw product object from JSON
function normalizeProduct(raw) {
  const price = Number(raw.price) || 0;
  const discountPrice = Number(raw.discount_price) || price;
  const effectivePrice = (discountPrice > 0 && discountPrice < price) ? discountPrice : price;
  const discountPercent = calculateDiscount(price, effectivePrice);
  
  const photos = Array.isArray(raw.photos) && raw.photos.length > 0 
    ? raw.photos.map(resolveMediaUrl) 
    : ['./media/file8.webp'];

  const rawPhotos = Array.isArray(raw.photos) ? raw.photos : [];

  return {
    id: String(raw.id || Math.floor(Math.random() * 1000000)),
    name: deriveProductName(raw),
    category: (raw.category && raw.category.trim()) ? raw.category.trim() : 'SHIRTS',
    price: price,
    discount_price: discountPrice,
    effective_price: effectivePrice,
    discount_percent: discountPercent,
    description: raw.description || 'Premium crafted contemporary shirt designed for comfort and modern style.',
    photos: photos,
    raw_photos: rawPhotos,
    primary_image: photos[0],
    secondary_image: photos[1] || photos[0],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    is_category_cover: Boolean(raw.is_category_cover),
    is_new: Boolean(raw.is_new_arrival),
    is_showcase: Boolean(raw.is_showcase)
  };
}

// Product Repository State
const ProductStore = {
  products: [],
  categories: [],
  brand: {},
  hero: [],
  news: [],
  footer: {},
  isLoaded: false,

  async init() {
    let rawData = null;
    try {
      const res = await fetch('configuration.json');
      if (res.ok) {
        rawData = await res.json();
      } else {
        throw new Error('HTTP ' + res.status);
      }
    } catch (err) {
      console.warn('Direct fetch of configuration.json failed (likely local file:// protocol or CORS). Using fallback data.', err);
      if (window.STORE_CONFIG_FALLBACK) {
        rawData = window.STORE_CONFIG_FALLBACK;
      }
    }

    if (!rawData || !rawData.data) {
      console.error('Unable to load valid configuration data.');
      return false;
    }

    const d = rawData.data;
    this.brand = d.brand || {};
    this.hero = Array.isArray(d.hero) ? d.hero : [];
    this.news = Array.isArray(d.news) ? d.news : [];
    this.footer = d.footer || {};

    // Process products
    if (Array.isArray(d.subpages)) {
      this.products = d.subpages.map(normalizeProduct);
    }

    // Process categories
    const rawCategories = Array.isArray(d.categories) ? d.categories : [];
    this.categories = rawCategories
      .filter(c => c.category_name && c.category_name.toLowerCase() !== 'home')
      .map(c => {
        // If category image is missing, find first product in this category
        let coverImg = c.category_image ? resolveMediaUrl(c.category_image) : '';
        if (!coverImg) {
          const match = this.products.find(p => p.category.toLowerCase() === c.category_name.toLowerCase());
          if (match && match.primary_image) {
            coverImg = match.primary_image;
          } else {
            coverImg = './media/file31.webp';
          }
        }
        
        const count = this.products.filter(p => p.category.toLowerCase() === c.category_name.toLowerCase()).length;

        return {
          id: c.id,
          name: c.category_name,
          image: coverImg,
          raw_image: c.category_image,
          count: count
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
    if (size) {
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

// UI Component: Product Card HTML Template
function renderProductCardHtml(product, isWishlisted = false) {
  const safeName = escapeHtml(product.name);
  const safeCat = escapeHtml(product.category);
  const safeDesc = escapeHtml(product.description);
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
          <img 
            src="${product.primary_image}" 
            alt="${safeName}" 
            class="product-img-primary" 
            loading="lazy"
            onerror="this.onerror=null; this.src='${getRemoteMediaFallback(product.raw_photos[0])}';"
          />
          <img 
            src="${product.secondary_image}" 
            alt="${safeName} - Alternate View" 
            class="product-img-secondary" 
            loading="lazy"
            onerror="this.onerror=null; this.src='${getRemoteMediaFallback(product.raw_photos[1] || product.raw_photos[0])}';"
          />
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
            <button type="button" class="size-chip ${s === 'M' ? 'selected' : ''}" data-size="${s}" data-product-id="${product.id}">
              ${s}
            </button>
          `).join('')}
        </div>

        <button type="button" class="card-add-btn" data-add-to-cart="${product.id}" data-selected-size="M">
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

// UI Component: Category Discovery Card HTML
function renderCategoryCardHtml(cat) {
  const safeName = escapeHtml(cat.name);
  return `
    <div class="category-card" data-category-filter="${safeName}">
      <div class="category-img-wrap">
        <img 
          src="${cat.image}" 
          alt="${safeName} Collection" 
          loading="lazy"
          onerror="this.onerror=null; this.src='${getRemoteMediaFallback(cat.raw_image)}';"
        />
        <div class="category-card-overlay">
          <div class="category-info">
            <h3 class="category-name">${safeName}</h3>
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

window.ProductStore = ProductStore;
window.renderProductCardHtml = renderProductCardHtml;
window.renderCategoryCardHtml = renderCategoryCardHtml;
window.formatPrice = formatPrice;
window.escapeHtml = escapeHtml;
window.resolveMediaUrl = resolveMediaUrl;
window.getRemoteMediaFallback = getRemoteMediaFallback;
