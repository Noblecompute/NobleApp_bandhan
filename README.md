# URBAN EDGE — Premium Dynamic Men's Fashion Storefront

A 100% dynamic, high-performance static men's fashion storefront crafted with semantic **HTML5**, modern **CSS3**, and modular **Vanilla JavaScript**.

**URBAN EDGE** is designed to be completely data-driven from [`configuration.json`](file:///c:/Users/nitikesh/Downloads/static%20websites/customapp-bandhan-main/configuration.json). Whenever you modify product listings, categories, hero slides, announcements, or media paths in `configuration.json`, the website automatically re-indexes, renders, and adjusts without modifying any code.

---

## 1. 100% Dynamic Architecture (Zero Hardcoding)

Every section of the website is built dynamically at runtime:

- **Live Cache-Busted Configuration:** Every page load executes `fetch('configuration.json?t=' + Date.now(), { cache: 'no-store' })`. Edits in `configuration.json` are reflected immediately upon page refresh.
- **Dynamic Media Path Resolution:** Media references can be full HTTP/HTTPS URLs, relative paths (`media/xyz.webp`), or bare filenames (`xyz.webp`). The dynamic resolver automatically adapts and provides multi-tier fallbacks so images never fail.
- **Automatic Product Scaling:** If you have 3 products, it displays 3; if you add 50 products to `subpages`, it renders all 50 in responsive grids. Zero hardcoded product counters.
- **Dynamic Category Navigation:** Navigation items and mobile drawer links are generated directly from `data.categories` and active products in `data.subpages`.
- **Dynamic Filter Controls:**
  - Category filter pills update with live item counts: `"Category Name (X)"`.
  - Price filter dropdown automatically calculates the true minimum and maximum prices in your catalog.
  - Size filter dropdown automatically detects all sizes present across active items.
- **Dynamic Hero Carousel:** Banners, responsive image rendering, and slide indicators are rendered from whatever entries are in `data.hero`.
- **Dynamic Announcement Ticker & Offers:** Built from `data.news`, automatically extracting promo codes (e.g. `FIRST10`, `B2G250`, `B3G500`) for one-click copy and cart discount calculation.
- **Dynamic Corporate Footer:** Address, telephone, email, opening hours, copyright, and verified social media links are rendered directly from `data.footer`.

---

## 2. Directory Structure

```text
customapp-bandhan/
├── index.html               # Main storefront with dynamic mount points
├── product.html             # Dedicated product detail page with dynamic gallery
├── cart.html                # Dedicated shopping bag & order breakdown
├── configuration.json       # The single source of truth for all website data
├── CNAME                    # Custom domain (website.noblecompute.com)
├── README.md                # Documentation and deployment guide
├── css/
│   └── styles.css           # Responsive stylesheet & design system
├── js/
│   ├── products.js          # Live configuration reader, dynamic media resolver & filters
│   ├── cart.js              # Variant-aware cart, dynamic coupon engine & shipping calculator
│   ├── wishlist.js          # Persistent wishlist storage with dynamic media rendering
│   └── app.js               # Dynamic DOM builder (header, hero, pills, offers, footer)
└── media/                   # 41 high-resolution product & banner assets
```

---

## 3. How to Update Website Content

To change anything on the website, simply edit [`configuration.json`](file:///c:/Users/nitikesh/Downloads/static%20websites/customapp-bandhan-main/configuration.json):

1. **Add a New Product:**
   Add a new object inside `"subpages": [ ... ]` with `id`, `name`, `category`, `price`, `discount_price`, `description`, and `photos: ["media/your_image.webp"]`. The website will automatically render the card, add the category to the navigation menu, and recalculate catalog filters.
2. **Remove or Disable a Product:**
   Remove the item from `"subpages"` or set `"is_enabled": false`. The item will immediately disappear from the store.
3. **Change Images / Media:**
   Update the `photos` array or `image` fields. You can specify a local path like `media/new_shirt.webp`, a bare filename, or an external URL like `https://...`.
4. **Add or Modify Banners:**
   Add or edit objects in `"hero": [ ... ]`. The carousel automatically generates the exact number of slides and indicator dots.
5. **Change Promotions or Coupons:**
   Edit `"news": [ ... ]`. Any headline with `Use Code : YOURCODE` will automatically become a copyable badge and an active coupon in the shopping cart.
6. **Update Brand or Contact Info:**
   Update `"brand"` or `"footer"` in `configuration.json` to change the logo, brand name, tagline, address, phone number, or social media links across all pages.

---

## 4. Local Testing & Deployment

### Local Testing
Run a local static server from the repository root:
```bash
npx serve .
# or
python -m http.server 8000
```
Open `http://localhost:3000` or `http://localhost:8000` in your browser.

### GitHub Pages Deployment
1. Commit and push the repository:
   ```bash
   git add .
   git commit -m "Deploy 100% dynamic storefront"
   git push origin main
   ```
2. In GitHub, go to **Settings** > **Pages** > **Deploy from a branch** > branch `main` / root `/ (root)`.
3. The site will deploy instantly to your GitHub Pages or custom domain URL (`website.noblecompute.com`).
