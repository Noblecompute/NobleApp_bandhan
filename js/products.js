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
// Prioritizes local ./media assets (instant, zero CORS, works offline & on GitHub Pages),
// with multi-tier remote and cross-extension (.jpg, .webp, .png) fallbacks.
function resolveMediaUrl(rawPath) {
  if (!rawPath) return { src: '', fallback: '', altFallback: '', extFallback: '' };
  const trimmed = String(rawPath).trim();
  if (!trimmed) return { src: '', fallback: '', altFallback: '', extFallback: '' };

  const filename = trimmed.includes('/') ? trimmed.split('/').pop().split('?')[0] : trimmed.split('?')[0];
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const ext = (filename.includes('.') ? filename.split('.').pop() : '').toLowerCase();
  const altExt = (ext === 'jpg' || ext === 'jpeg') ? 'webp' : (ext === 'webp' ? 'jpg' : 'png');
  const altFilename = `${nameWithoutExt}.${altExt}`;

  const mediaBaseUrl = (window.ProductStore && window.ProductStore.config && window.ProductStore.config.github && window.ProductStore.config.github.mediaBaseUrl)
    ? window.ProductStore.config.github.mediaBaseUrl.replace(/\/$/, '')
    : 'https://raw.githubusercontent.com/Noblecompute/NobleApp_bandhan/main/media';

  const isProjectMedia = trimmed.includes('githubusercontent.com') || 
                         trimmed.includes('/media/') || 
                         trimmed.startsWith('./media/') || 
                         trimmed.startsWith('media/') || 
                         /^file\d+\.(jpg|jpeg|webp|png)$/i.test(filename) ||
                         !trimmed.startsWith('http');

  if (!isProjectMedia) {
    // Pure external CDN link
    return {
      src: trimmed,
      fallback: `./media/${filename}`,
      altFallback: `./media/${altFilename}`,
      extFallback: ''
    };
  }

  // Project media asset:
  // Primary src is local relative path `./media/${filename}` (instant loading, zero CORS issues, works offline & deployed)
  return {
    src: `./media/${filename}`,
    fallback: trimmed.startsWith('http') ? trimmed : `${mediaBaseUrl}/${filename}`,
    altFallback: `./media/${altFilename}`,
    extFallback: `${mediaBaseUrl}/${altFilename}`
  };
}

// Fallback handler for responsive <picture> elements:
// When an <img> inside a <picture> fails, removes dead <source> siblings so img.src takes visual effect!
function handlePictureFallback(img, desktopFallback, mobileFallback) {
  if (!img) return;
  const pic = img.closest('picture');
  if (pic) {
    pic.querySelectorAll('source').forEach(s => s.remove());
  }
  if (!img.dataset.fallbackTried) {
    img.dataset.fallbackTried = '1';
    img.src = desktopFallback || mobileFallback || '';
  } else if (!img.dataset.altTried && mobileFallback && mobileFallback !== desktopFallback) {
    img.dataset.altTried = '1';
    img.src = mobileFallback;
  }
}

// Resolves responsive desktop and mobile media with mutual cross-fallback:
// "for topic also have two diffrent option desktop and mobile here for diffrent devices use diffrent photos but if anyone is empty use avaialbe photo from any desktop or mobile for other to same for all"
function resolveResponsiveMedia(item, defaultAlt = '') {
  if (!item) return null;

  // Extract raw candidate paths
  const rawDesktop = (item.desktop_image || item.image || item.topic_image || '').trim();
  const rawMobile = (item.mobile_image || '').trim();

  // If one is empty, use the available photo from the other
  const finalDesktopPath = rawDesktop || rawMobile;
  const finalMobilePath = rawMobile || rawDesktop;

  if (!finalDesktopPath && !finalMobilePath) {
    return null;
  }

  const desktopMedia = resolveMediaUrl(finalDesktopPath);
  const mobileMedia = resolveMediaUrl(finalMobilePath);

  const desktopFitMode = item.desktop_fit_mode || item.fit_mode || 'contain';
  const mobileFitMode = item.mobile_fit_mode || item.fit_mode || 'contain';
  const viewMode = item.view_mode || 'auto';

  return {
    desktop: desktopMedia,
    mobile: mobileMedia,
    desktopFitMode,
    mobileFitMode,
    viewMode,
    alt: item.topic_name || item.name || item.title || defaultAlt || 'Fashion Media'
  };
}

// Renders a semantic responsive <picture> tag with desktop and mobile <source> tags
function renderResponsivePictureTag(responsiveData, imgClassName = '', loading = 'lazy') {
  if (!responsiveData) return '';

  const desktop = responsiveData.desktop;
  const mobile = responsiveData.mobile;
  const alt = escapeHtml(responsiveData.alt || 'Fashion Campaign');
  const safeClass = escapeHtml(imgClassName);

  const onerrorStr = `window.handlePictureFallback && window.handlePictureFallback(this, '${escapeHtml(desktop.fallback)}', '${escapeHtml(mobile.fallback)}')`;

  return `
    <picture class="responsive-picture">
      <source media="(max-width: 768px)" srcset="${escapeHtml(mobile.src)}" />
      <source media="(min-width: 769px)" srcset="${escapeHtml(desktop.src)}" />
      <img 
        src="${escapeHtml(desktop.src)}" 
        alt="${alt}" 
        class="${safeClass}" 
        loading="${loading}"
        onerror="${onerrorStr}"
      />
    </picture>
  `;
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

  const isNewArrival = Boolean(raw.is_new_arrival || raw.is_new);
  const isMix = Boolean(raw.is_mix);
  const isShowcase = Boolean(raw.is_showcase);
  const isCategoryCover = Boolean(raw.is_category_cover);

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
    is_category_cover: isCategoryCover,
    is_new_arrival: isNewArrival,
    is_new: isNewArrival,
    is_mix: isMix,
    is_showcase: isShowcase,
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

    // Stage 1: Live fetch with cache-busting timestamp so user edits to configuration.json show immediately
    try {
      const url = `configuration.json?t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        rawConfig = await res.json();
      }
    } catch (err) {
      // Stage 2: Fallback attempt without query param if local server rejected query strings
      try {
        const res2 = await fetch('configuration.json');
        if (res2.ok) rawConfig = await res2.json();
      } catch (err2) {
        // Continue to offline/DOM fallbacks
      }
    }

    // Stage 3: Embedded DOM script fallback (guarantees zero CORS failures when opened via file:// protocol)
    if (!rawConfig) {
      try {
        const embeddedEl = typeof document !== 'undefined' ? document.getElementById('bandhan-embedded-config') : null;
        if (embeddedEl && embeddedEl.textContent.trim()) {
          rawConfig = JSON.parse(embeddedEl.textContent);
        }
      } catch (errEmbedded) {
        console.warn('Embedded config parse error:', errEmbedded);
      }
    }

    // Stage 4: Global window.BANDHAN_CONFIG variable
    if (!rawConfig && typeof window !== 'undefined' && window.BANDHAN_CONFIG) {
      rawConfig = window.BANDHAN_CONFIG;
    }

    // Stage 5: Remote GitHub Raw live fetch (supports CORS across all origins including file://)
    if (!rawConfig) {
      try {
        const res3 = await fetch('https://raw.githubusercontent.com/Noblecompute/NobleApp_bandhan/main/configuration.json');
        if (res3.ok) rawConfig = await res3.json();
      } catch (errRemote) {
        // Exhausted fallbacks
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
    // "for topic also have two diffrent option desktop and mobile here for diffrent devices use diffrent photos but if anyone is empty use avaialbe photo from any desktop or mobile for other to same for all"
    this.topics = Array.isArray(d.topics) ? d.topics.map(t => {
      const resp = resolveResponsiveMedia(t, t.topic_name || t.category || 'Curated Style Campaign');
      return {
        id: String(t.id || ''),
        name: (t.topic_name || '').trim(),
        image: resp ? resp.desktop.src : (t.desktop_image || t.image || t.topic_image || '').trim(),
        desktop_image: (t.desktop_image || t.image || t.topic_image || '').trim(),
        mobile_image: (t.mobile_image || '').trim(),
        desktop_fit_mode: t.desktop_fit_mode || 'contain',
        mobile_fit_mode: t.mobile_fit_mode || 'contain',
        view_mode: t.view_mode || 'auto',
        category: (t.category || '').trim(),
        link: (t.link || '').trim(),
        responsive: resp
      };
    }).filter(t => t.responsive !== null) : [];
    
    // Build category map
    const catMap = new Map();
    rawCategories
      .filter(c => c && c.category_name && c.category_name.toLowerCase() !== 'home')
      .forEach(c => {
        catMap.set(c.category_name.toUpperCase(), {
          id: c.id,
          name: c.category_name,
          raw_image: c.category_image || '',
          link: c.link || '',
          cover_product_id: c.cover_product_id || null
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
          link: '',
          cover_product_id: null
        });
      }
    });

    // Compute live product counts and image covers for each category
    // "when they click on category and and mentioned photos to in front"
    this.categories = Array.from(catMap.values()).map(cat => {
      const matchingProducts = this.products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase());
      
      // Look for the designated category cover product (is_category_cover: true or matching cover_product_id)
      const coverProd = matchingProducts.find(p => p.is_category_cover || (cat.cover_product_id && String(p.id) === String(cat.cover_product_id))) || matchingProducts[0];

      // Prioritize explicit category image from configuration.json (Powerlook 3x2 grid photography), falling back to product cover
      let coverImage = cat.raw_image || (coverProd ? coverProd.primary_image : '');
      if (!coverImage && matchingProducts.length > 0) {
        coverImage = matchingProducts[0].primary_image;
      }

      return {
        id: cat.id,
        name: cat.name,
        image: coverImage,
        raw_image: cat.raw_image,
        cover_product_id: cat.cover_product_id || (coverProd ? coverProd.id : null),
        cover_product: coverProd || null,
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

  // "and show case only show photos not details"
  // Extracts pure photo URLs prioritizing items marked is_showcase: true
  getShowcasePhotos() {
    const showcaseProducts = this.products.filter(p => p.is_showcase);
    let photos = [];
    if (showcaseProducts.length > 0) {
      showcaseProducts.forEach(p => {
        if (Array.isArray(p.photos) && p.photos.length > 0) {
          p.photos.forEach(photo => {
            if (photo && !photos.includes(photo)) photos.push(photo);
          });
        } else if (p.primary_image && !photos.includes(p.primary_image)) {
          photos.push(p.primary_image);
        }
      });
    }

    // Graceful fallback to all catalog photos if no products marked showcase yet
    if (photos.length === 0) {
      this.products.forEach(p => {
        if (p.primary_image && !photos.includes(p.primary_image)) {
          photos.push(p.primary_image);
        }
        if (p.secondary_image && !photos.includes(p.secondary_image)) {
          photos.push(p.secondary_image);
        }
      });
    }

    return photos;
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

  filterAndSort({ category = 'all', flag = 'all', search = '', maxPrice = null, size = '', sort = 'featured' }) {
    let result = [...this.products];

    // Filter by Category
    if (category && category !== 'all') {
      result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by Flag (new, mix, showcase)
    if (flag && flag !== 'all') {
      if (flag === 'new') {
        result = result.filter(p => p.is_new_arrival || p.is_new);
      } else if (flag === 'mix') {
        result = result.filter(p => p.is_mix);
      } else if (flag === 'showcase') {
        result = result.filter(p => p.is_showcase);
      }
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

    // "when they click on category and and mentioned photos to in front"
    // When a category is actively selected, sort so the category cover product/photo is strictly IN FRONT (index 0)
    if (category && category !== 'all') {
      const catObj = this.categories.find(c => c.name.toLowerCase() === category.toLowerCase());
      const coverId = catObj ? String(catObj.cover_product_id || '') : '';
      result.sort((a, b) => {
        const aIsCover = (a.is_category_cover || (coverId && String(a.id) === coverId)) ? 1 : 0;
        const bIsCover = (b.is_category_cover || (coverId && String(b.id) === coverId)) ? 1 : 0;
        return bIsCover - aIsCover; // 1 before 0 -> cover item is IN FRONT
      });
    }

    return result;
  }
};

// UI Component: Product Card HTML Template (Powerlook authentic styling)
function renderProductCardHtml(product, isWishlisted = false) {
  const safeName = escapeHtml(product.name);
  const safeCat = escapeHtml(product.category);

  // Powerlook minimal badge: "i want like this mix same as new arrival"
  // Both NEW ARRIVAL and THE MIX use the exact same subtle, quiet-luxury dark matte badge
  let badgeHtml = '';
  if (product.is_mix) {
    badgeHtml = `<span class="badge-powerlook">THE MIX</span>`;
  } else if (product.is_new_arrival || product.is_new) {
    badgeHtml = `<span class="badge-powerlook">NEW ARRIVAL</span>`;
  } else if (product.discount_percent > 0) {
    badgeHtml = `<span class="badge-powerlook-discount">${product.discount_percent}% OFF</span>`;
  }

  const wishlistClass = isWishlisted ? 'active' : '';

  const primaryImgTag = renderImgTag(product.primary_image, safeName, 'product-img-primary');
  const secondaryImgTag = renderImgTag(product.secondary_image, `${safeName} - Alternate View`, 'product-img-secondary');

  const defaultSize = product.sizes[0] || 'M';

  // Powerlook dynamic member price (~8% member privilege discount)
  const memberPrice = Math.round(product.effective_price * 0.92);

  return `
    <article class="product-card" data-product-id="${product.id}">
      <div class="product-card-media">
        ${badgeHtml ? `<div class="card-badges">${badgeHtml}</div>` : ''}
        
        <button type="button" class="card-wishlist-btn ${wishlistClass}" data-wishlist-id="${product.id}" aria-label="Save ${safeName} to wishlist">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="${isWishlisted ? '#E34222' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>

        <a href="product.html?id=${product.id}" class="card-media-link" aria-label="View details for ${safeName}">
          ${primaryImgTag}
          ${secondaryImgTag}
        </a>

        <!-- High-Fashion Quick Add Bar on Hover (1-click size add like Powerlook) -->
        <div class="card-quick-sizes-bar">
          <span class="quick-size-label">QUICK ADD</span>
          <div class="quick-size-pills">
            ${product.sizes.map(s => `
              <button type="button" class="quick-size-btn" onclick="event.preventDefault(); event.stopPropagation(); window.CartStore && window.CartStore.addItem('${product.id}', '${s}', 1); window.openCartDrawer && window.openCartDrawer();" title="Add size ${s} to bag">
                ${s}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="product-card-body">
        <h3 class="card-title">
          <a href="product.html?id=${product.id}">${safeName}</a>
        </h3>

        <div class="card-price-row">
          <span class="price-current">${formatPrice(product.effective_price)}</span>
          ${product.price > product.effective_price ? `
            <del class="price-original">${formatPrice(product.price)}</del>
          ` : ''}
        </div>

        <div class="member-price-tag">
          Member Price : ${formatPrice(memberPrice)}
        </div>
      </div>
    </article>
  `;
}

// UI Component: Occasion Category Card HTML (Matching Powerlook Image 1: Clean, full-bleed photo with centered white title)
function renderCategoryCardHtml(cat) {
  const safeName = escapeHtml(cat.name);
  const imgTag = renderImgTag(cat.image, `${safeName} Occasion`);

  return `
    <div class="category-card" data-category-filter="${safeName}" onclick="window.navigateToCategory && window.navigateToCategory(event, '${safeName}')">
      <div class="category-img-wrap">
        ${imgTag}
        <div class="category-card-overlay">
          <h3 class="category-title-overlay">${safeName}</h3>
        </div>
      </div>
    </div>
  `;
}

// UI Component: Thematic Topic Campaign Banner HTML (Responsive Desktop & Mobile support with cross-fallback)
function renderTopicBannerHtml(topic, index = 0, variant = 'grid-break') {
  if (!topic) return '';
  const resp = topic.responsive || resolveResponsiveMedia(topic, topic.name);
  if (!resp) return '';

  const targetCategory = window.ProductStore ? window.ProductStore.resolveTopicTarget(topic) : (topic.category || 'all');
  const safeCat = escapeHtml(targetCategory);
  const safeName = escapeHtml(topic.name || topic.category || 'Curated Style Campaign');

  // Intelligent label: use topic name or category if present; if blank, elegant "EXPLORE COLLECTION"
  const tagText = topic.name && topic.name.trim() 
    ? `EXPLORE ${escapeHtml(topic.name.toUpperCase())}`
    : (topic.category && topic.category.trim()
        ? `SHOP ${escapeHtml(topic.category.toUpperCase())}`
        : (targetCategory.toLowerCase() !== 'all' ? `SHOP ${safeCat.toUpperCase()}` : 'EXPLORE COLLECTION'));

  const linkHref = topic.link && topic.link.trim() 
    ? escapeHtml(topic.link.trim())
    : `index.html?category=${encodeURIComponent(targetCategory)}#catalog`;

  const pictureTag = renderResponsivePictureTag(resp, 'topic-banner-img', 'lazy');
  const fitClass = `fit-desktop-${escapeHtml(resp.desktopFitMode || 'contain')} fit-mobile-${escapeHtml(resp.mobileFitMode || 'contain')}`;

  return `
    <aside class="topic-campaign-card ${escapeHtml(variant)}" data-topic-index="${index}" data-topic-category="${safeCat}">
      <a href="${linkHref}" 
         class="topic-banner-link" 
         onclick="if(!this.href.includes('://')) window.navigateToCategory && window.navigateToCategory(event, '${safeCat}')"
         aria-label="Explore ${safeName}">
        <div class="topic-banner-media ${fitClass}">
          ${pictureTag}
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
window.resolveResponsiveMedia = resolveResponsiveMedia;
window.renderResponsivePictureTag = renderResponsivePictureTag;
window.handlePictureFallback = handlePictureFallback;
window.formatPrice = formatPrice;
window.escapeHtml = escapeHtml;
window.resolveMediaUrl = resolveMediaUrl;
window.renderImgTag = renderImgTag;
