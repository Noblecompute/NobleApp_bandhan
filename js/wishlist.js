/**
 * URBAN EDGE — Wishlist State Management
 * Persistent browser storage for saved items with dynamic media rendering.
 */

const WISHLIST_STORAGE_KEY = 'urban_edge_wishlist_v1';

const WishlistStore = {
  items: [],

  init() {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        this.items = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read wishlist from localStorage', e);
      this.items = [];
    }
    this.updateBadges();
  },

  save() {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.warn('Could not save wishlist to localStorage', e);
    }
    this.updateBadges();
    this.renderDrawer();
    this.syncCardButtons();
  },

  has(productId) {
    return this.items.some(id => String(id) === String(productId));
  },

  toggle(productId) {
    const pId = String(productId);
    const product = window.ProductStore ? window.ProductStore.getById(pId) : null;
    const prodName = product ? product.name : 'Item';

    if (this.has(pId)) {
      this.items = this.items.filter(id => id !== pId);
      this.save();
      if (window.showToast) {
        window.showToast(`Removed ${prodName} from Wishlist`, 'charcoal');
      }
      return false;
    } else {
      this.items.push(pId);
      this.save();
      if (window.showToast) {
        window.showToast(`Saved ${prodName} to Wishlist`, 'vermilion');
      }
      return true;
    }
  },

  remove(productId) {
    const pId = String(productId);
    this.items = this.items.filter(id => id !== pId);
    this.save();
  },

  moveToBag(productId, size = 'M') {
    if (window.CartStore) {
      window.CartStore.addItem(productId, size, 1);
      this.remove(productId);
      if (window.showToast) {
        window.showToast('Moved item from Wishlist to Bag', 'emerald');
      }
    }
  },

  getCount() {
    return this.items.length;
  },

  updateBadges() {
    const count = this.getCount();
    document.querySelectorAll('.action-badge-wishlist').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  syncCardButtons() {
    document.querySelectorAll('[data-wishlist-id]').forEach(btn => {
      const id = btn.getAttribute('data-wishlist-id');
      const isSaved = this.has(id);
      if (isSaved) {
        btn.classList.add('active');
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', '#E34222');
      } else {
        btn.classList.remove('active');
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', 'none');
      }
    });
  },

  renderDrawer() {
    const drawerBody = document.getElementById('wishlistDrawerBody');
    const drawerCount = document.getElementById('wishlistDrawerCount');

    if (drawerCount) {
      drawerCount.textContent = `${this.getCount()} items`;
    }

    if (!drawerBody) return;

    if (this.items.length === 0) {
      drawerBody.innerHTML = `
        <div class="empty-state" style="padding: 3.5rem 1rem;">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <h4 class="empty-state-title" style="font-size: 1.25rem;">Your Wishlist is Empty</h4>
          <p class="empty-state-desc" style="font-size: 0.875rem;">Save your favourite styles here to shop later or check back for offers.</p>
          <button type="button" class="btn btn-primary" onclick="window.closeAllDrawers();" style="width: 100%;">
            Explore Collections
          </button>
        </div>
      `;
      return;
    }

    const savedProducts = this.items
      .map(id => window.ProductStore ? window.ProductStore.getById(id) : null)
      .filter(Boolean);

    drawerBody.innerHTML = savedProducts.map(p => {
      const imgTag = renderImgTag(p.primary_image, p.name);
      return `
        <div class="drawer-item" data-wishlist-item="${p.id}">
          <div class="drawer-item-img">
            ${imgTag}
          </div>
          <div class="drawer-item-info">
            <button type="button" class="drawer-item-remove-btn" onclick="WishlistStore.remove('${p.id}')" aria-label="Remove from wishlist">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div class="drawer-item-title">${escapeHtml(p.name)}</div>
            <div class="drawer-item-meta">${escapeHtml(p.category)}</div>
            <div class="drawer-item-price-row">
              <span class="price-current">${formatPrice(p.effective_price)}</span>
              ${p.price > p.effective_price ? `<span class="price-original">${formatPrice(p.price)}</span>` : ''}
            </div>
            <button type="button" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; margin-top: 0.5rem;" onclick="WishlistStore.moveToBag('${p.id}', '${p.sizes[0] || 'M'}')">
              Move To Bag
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
};

window.WishlistStore = WishlistStore;
