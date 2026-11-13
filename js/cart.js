/**
 * URBAN EDGE — Shopping Bag & Checkout Engine
 * Manages cart state in localStorage with dynamic media resolution and dynamic coupon validation.
 */

const CART_STORAGE_KEY = 'urban_edge_cart_v1';
const FREE_SHIPPING_THRESHOLD = 999;
const STANDARD_SHIPPING_FEE = 99;

const CartStore = {
  items: [],
  appliedCoupon: null,

  init() {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        this.items = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read cart from localStorage', e);
      this.items = [];
    }
    this.updateBadges();
  },

  // 100% Dynamically parses active coupon codes from configuration news headlines
  getAvailableCoupons() {
    const coupons = {};

    if (window.ProductStore && Array.isArray(window.ProductStore.news)) {
      window.ProductStore.news.forEach(n => {
        const h = n.headline || '';
        const match = h.match(/code\s*:\s*([A-Z0-9]+)/i);
        if (match && match[1]) {
          const code = match[1].toUpperCase();
          if (!coupons[code]) {
            const percentMatch = h.match(/(\d+)%/);
            const flatMatch = h.match(/(\d+)\s*(?:rs|inr|off)/i);
            const qtyMatch = h.match(/buy\s*(\d+)/i);

            if (percentMatch) {
              coupons[code] = {
                type: 'percent',
                value: Number(percentMatch[1]),
                minQty: qtyMatch ? Number(qtyMatch[1]) : 1,
                label: `${percentMatch[1]}% OFF`
              };
            } else if (flatMatch) {
              coupons[code] = {
                type: 'fixed',
                value: Number(flatMatch[1]),
                minQty: qtyMatch ? Number(qtyMatch[1]) : 1,
                label: `₹${flatMatch[1]} OFF`
              };
            } else {
              coupons[code] = {
                type: 'percent',
                value: 10,
                minQty: 1,
                label: 'Promotional Discount'
              };
            }
          }
        }
      });
    }

    return coupons;
  },

  save() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.warn('Could not save cart to localStorage', e);
    }
    this.updateBadges();
    this.renderDrawer();
    if (typeof renderCartPage === 'function') {
      renderCartPage();
    }
  },

  addItem(productId, size = 'M', quantity = 1) {
    const product = window.ProductStore ? window.ProductStore.getById(productId) : null;
    if (!product) {
      console.error('Product not found for ID:', productId);
      return false;
    }

    const key = `${productId}-${size}`;
    const existingIndex = this.items.findIndex(i => i.key === key);

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += Number(quantity);
    } else {
      this.items.push({
        key: key,
        id: product.id,
        name: product.name,
        price: product.price,
        effective_price: product.effective_price,
        discount_percent: product.discount_percent,
        size: size,
        image: product.primary_image,
        category: product.category,
        quantity: Number(quantity)
      });
    }

    this.save();
    if (window.showToast) {
      window.showToast(`Added ${product.name} (Size ${size}) to your Bag`, 'emerald');
    }
    this.bumpCartBadge();
    return true;
  },

  updateQuantity(key, newQty) {
    const index = this.items.findIndex(i => i.key === key);
    if (index > -1) {
      const q = Number(newQty);
      if (q <= 0) {
        this.removeItem(key);
      } else {
        this.items[index].quantity = Math.min(q, 10);
        this.save();
      }
    }
  },

  removeItem(key) {
    const item = this.items.find(i => i.key === key);
    this.items = this.items.filter(i => i.key !== key);
    this.save();
    if (item && window.showToast) {
      window.showToast(`Removed ${item.name} from Bag`, 'vermilion');
    }
  },

  clear() {
    this.items = [];
    this.appliedCoupon = null;
    this.save();
  },

  getTotalCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.effective_price * item.quantity), 0);
  },

  getOriginalTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  applyCoupon(code) {
    if (!code) return { success: false, message: 'Please enter a coupon code.' };
    const cleanCode = code.trim().toUpperCase();
    const availableCoupons = this.getAvailableCoupons();
    const coupon = availableCoupons[cleanCode];

    if (!coupon) {
      return { success: false, message: `Coupon "${cleanCode}" is not active or valid.` };
    }

    const totalQty = this.getTotalCount();
    if (coupon.minQty && totalQty < coupon.minQty) {
      return { 
        success: false, 
        message: `Add at least ${coupon.minQty} items to use code ${cleanCode}. Current count: ${totalQty}.` 
      };
    }

    this.appliedCoupon = { code: cleanCode, ...coupon };
    this.renderDrawer();
    if (typeof renderCartPage === 'function') {
      renderCartPage();
    }
    return { success: true, message: `Coupon ${cleanCode} applied! ${coupon.label}` };
  },

  removeCoupon() {
    this.appliedCoupon = null;
    this.renderDrawer();
    if (typeof renderCartPage === 'function') {
      renderCartPage();
    }
  },

  getDiscountAmount() {
    if (!this.appliedCoupon) return 0;
    const subtotal = this.getSubtotal();
    if (this.appliedCoupon.type === 'percent') {
      return Math.round((subtotal * this.appliedCoupon.value) / 100);
    }
    if (this.appliedCoupon.type === 'fixed') {
      return Math.min(this.appliedCoupon.value, subtotal);
    }
    return 0;
  },

  getShippingFee() {
    const subtotal = this.getSubtotal();
    if (subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD) {
      return 0;
    }
    return STANDARD_SHIPPING_FEE;
  },

  getFinalTotal() {
    const subtotal = this.getSubtotal();
    if (subtotal === 0) return 0;
    const discount = this.getDiscountAmount();
    const shipping = this.getShippingFee();
    return Math.max(0, subtotal - discount + shipping);
  },

  updateBadges() {
    const count = this.getTotalCount();
    document.querySelectorAll('.action-badge-cart').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  bumpCartBadge() {
    document.querySelectorAll('.action-badge-cart').forEach(el => {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    });
  },

  renderDrawer() {
    const drawerBody = document.getElementById('cartDrawerBody');
    const drawerFooter = document.getElementById('cartDrawerFooter');
    const drawerShipping = document.getElementById('cartDrawerShipping');
    const drawerCount = document.getElementById('cartDrawerCount');

    if (drawerCount) {
      drawerCount.textContent = `${this.getTotalCount()} items`;
    }

    if (!drawerBody || !drawerFooter) return;

    if (this.items.length === 0) {
      if (drawerShipping) drawerShipping.style.display = 'none';
      drawerBody.innerHTML = `
        <div class="empty-state" style="padding: 3rem 1rem;">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <h4 class="empty-state-title" style="font-size: 1.25rem;">Your Shopping Bag is Empty</h4>
          <p class="empty-state-desc" style="font-size: 0.875rem;">Explore our latest collection of contemporary styles.</p>
          <button type="button" class="btn btn-primary" onclick="window.closeAllDrawers();" style="width: 100%;">
            Start Shopping
          </button>
        </div>
      `;
      drawerFooter.style.display = 'none';
      return;
    }

    // Shipping progress
    if (drawerShipping) {
      drawerShipping.style.display = 'block';
      const subtotal = this.getSubtotal();
      const diff = FREE_SHIPPING_THRESHOLD - subtotal;
      const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

      if (diff <= 0) {
        drawerShipping.innerHTML = `
          <div class="shipping-progress-text" style="color: var(--color-emerald);">
            🎉 You have unlocked <strong>FREE Express Shipping</strong>!
          </div>
          <div class="shipping-progress-track">
            <div class="shipping-progress-fill" style="width: 100%; background-color: var(--color-emerald);"></div>
          </div>
        `;
      } else {
        drawerShipping.innerHTML = `
          <div class="shipping-progress-text">
            Add <strong>${formatPrice(diff)}</strong> more to get <strong>FREE Express Shipping</strong>!
          </div>
          <div class="shipping-progress-track">
            <div class="shipping-progress-fill" style="width: ${progressPercent}%;"></div>
          </div>
        `;
      }
    }

    // Render items with dynamic media rendering
    drawerBody.innerHTML = this.items.map(item => {
      const imgTag = renderImgTag(item.image, item.name);
      return `
        <div class="drawer-item" data-cart-key="${item.key}">
          <div class="drawer-item-img">
            ${imgTag}
          </div>
          <div class="drawer-item-info">
            <button type="button" class="drawer-item-remove-btn" onclick="CartStore.removeItem('${item.key}')" aria-label="Remove ${escapeHtml(item.name)}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div class="drawer-item-title">${escapeHtml(item.name)}</div>
            <div class="drawer-item-meta">Size: <strong>${item.size}</strong></div>
            <div class="drawer-item-price-row">
              <span class="price-current">${formatPrice(item.effective_price)}</span>
              ${item.price > item.effective_price ? `<span class="price-original">${formatPrice(item.price)}</span>` : ''}
            </div>
            <div class="drawer-qty-control">
              <button type="button" class="drawer-qty-btn" onclick="CartStore.updateQuantity('${item.key}', ${item.quantity - 1})" aria-label="Decrease quantity">−</button>
              <span class="drawer-qty-val">${item.quantity}</span>
              <button type="button" class="drawer-qty-btn" onclick="CartStore.updateQuantity('${item.key}', ${item.quantity + 1})" aria-label="Increase quantity">+</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Render footer
    drawerFooter.style.display = 'flex';
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const shipping = this.getShippingFee();
    const total = this.getFinalTotal();

    const couponHtml = this.appliedCoupon
      ? `
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--color-emerald-subtle); padding: 0.4rem 0.75rem; border-radius: 4px; font-size: 0.8125rem;">
          <span style="color: var(--color-emerald-dark); font-weight: 700;">Code: ${this.appliedCoupon.code} (${this.appliedCoupon.label})</span>
          <button type="button" onclick="CartStore.removeCoupon()" style="color: var(--color-vermilion); font-weight: 700; font-size: 0.75rem;">Remove</button>
        </div>
      `
      : `
        <form class="drawer-coupon-row" onsubmit="event.preventDefault(); const res = CartStore.applyCoupon(this.couponCode.value); if(res.success){ showToast(res.message, 'emerald'); } else { showToast(res.message, 'vermilion'); }">
          <input type="text" name="couponCode" placeholder="Enter coupon code" class="drawer-coupon-input" aria-label="Coupon code" />
          <button type="submit" class="drawer-coupon-btn">Apply</button>
        </form>
      `;

    drawerFooter.innerHTML = `
      ${couponHtml}
      <div class="drawer-summary-line">
        <span>Subtotal</span>
        <span>${formatPrice(subtotal)}</span>
      </div>
      ${discount > 0 ? `
        <div class="drawer-summary-line" style="color: var(--color-emerald);">
          <span>Coupon Discount</span>
          <span>−${formatPrice(discount)}</span>
        </div>
      ` : ''}
      <div class="drawer-summary-line">
        <span>Estimated Shipping</span>
        <span>${shipping === 0 ? '<strong style="color: var(--color-emerald);">FREE</strong>' : formatPrice(shipping)}</span>
      </div>
      <div class="drawer-summary-line total">
        <span>Estimated Total</span>
        <span>${formatPrice(total)}</span>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
        <a href="cart.html" class="btn btn-outline-dark" style="flex: 1; padding: 0.75rem;">View Bag</a>
        <button type="button" class="btn btn-vermilion drawer-checkout-btn" style="flex: 1.5; padding: 0.75rem;" onclick="window.openCheckoutModal();">
          Checkout
        </button>
      </div>
    `;
  }
};

window.CartStore = CartStore;
