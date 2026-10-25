# URBAN EDGE — Premium Men's Fashion E-Commerce Website

A complete, high-performance, production-ready static men's fashion storefront crafted with semantic **HTML5**, modern **CSS3**, and modular **Vanilla JavaScript**.

Inspired by contemporary Indian menswear brands (such as Powerlook and Zara Men), **URBAN EDGE** delivers a refined, editorial shopping experience centered around tailored macro checks and artisanal linen blends.

---

## 1. Visual Identity & Design System

The storefront embodies an editorial, minimalist, and commercially credible aesthetic:

| Color Token | Hex Code | Purpose & Usage |
| :--- | :--- | :--- |
| **Warm Ivory** | `#F9EBD7` | Primary background, spacious layouts, editorial sections (60%) |
| **Emerald Green** | `#004638` | Branding, navigation accents, primary buttons, headings, trust elements (25%) |
| **Vermilion Red** | `#E34222` | Promotional highlights, sale indicators, key action badges (5%) |
| **Charcoal Black** | `#171717` | High-contrast typography, footer background, primary icons |
| **Pure White** | `#FFFFFF` | Product cards, drawers, modal dialogs, clean content surfaces |
| **Soft Neutral** | `#E9E3D8` | Subtle borders, dividers, chip backgrounds |

### Typography
- **Editorial Headings:** `Playfair Display` & `Cinzel` serif typography with system serif fallbacks (`Georgia`, `Times New Roman`).
- **Body & UI Elements:** `Plus Jakarta Sans` with modern system sans fallbacks (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`).

---

## 2. Key Features & Storefront Architecture

### A. Announcement Ticker
- Slim top banner with automatic rotation every 4.5 seconds.
- Interactive **"Click to Copy Code"** badges for store coupons:
  - `FIRST10` — Flat 10% OFF on 1st Order
  - `B2G250` — ₹250 OFF on 2+ Selected Fits
  - `B3G500` — ₹500 OFF on 3+ Items
- Accessible controls (Previous / Next navigation and hover pause).

### B. Responsive Editorial Hero
- High-fashion campaign slider with `<picture>` elements for responsive desktop (`file2.jpg`, `file4.jpg`, `file6.jpg`) and portrait mobile (`file3.jpg`, `file5.jpg`, `file7.jpg`) banners.
- Clear call-to-actions linking directly to catalog collections with smooth anchor scrolling.
- Accessible slide dots, manual arrows, and auto-advance with reduced-motion support.

### C. Curated Category Discovery
- Visual occasion cards with real imagery (`DATE READY`, `CONCERT FITS`, `LINEN COLLECTION`, `CHAIN TREND`).
- Click-to-filter interaction that updates the catalog and scrolls smoothly into view.

### D. Advanced Product Discovery & Filters
- **Instant Search:** Debounced client-side search across product name, description, category, and ID.
- **Category Filter Pills:** All Shirts, Date Ready, Concert Fits, Linen Collection, Chain Trend.
- **Price Range Filter:** Filter items under ₹1,200, ₹1,500, or ₹1,600.
- **Size Filter:** S, M, L, XL, XXL.
- **Sorting Options:** Featured, Price: Low to High, Price: High to Low, Biggest Discount, Name: A to Z.
- **Live Counter & Reset:** Real-time result counter and quick "Clear All Filters" button.

### E. Product Cards with Interactive Micro-States
- Consistent 4:5 portrait aspect ratio with high-resolution fashion photography.
- **Hover Dual-Image Preview:** Hovering over a card smoothly reveals its secondary gallery photograph.
- **Discount Badges:** Automatically calculated savings percentage (e.g., `20% OFF`, `45% OFF`).
- **In-Card Size Selector:** Select sizes directly on the card before adding to bag.
- **Quick View Modal:** In-depth preview with gallery, size guide trigger, and direct add-to-bag.
- **Wishlist Toggle:** Heart icon with filled visual feedback and LocalStorage persistence.

### F. Dedicated Product Detail Page (`product.html`)
- Static-friendly deep-linking via query parameters (e.g., `product.html?id=1792749834198`).
- High-resolution multi-angle image gallery with thumbnail navigation.
- Size selector with Size Measurement Guide modal (Chest, Length, Shoulder measurements).
- Quantity counter with min/max validation.
- Interactive Indian PIN code delivery estimator.
- Accordion sections detailing Fabric & Craftsmanship, Sizing Notes, and 7-Day Exchange policies.
- Related products section ("Complete The Wardrobe").

### G. Variant-Aware Shopping Bag (`cart.html` & Slide-Over Drawer)
- Available both as an instant slide-over drawer on every page and as a dedicated `cart.html` view.
- **Variant Awareness:** Items in different sizes (e.g., Size M vs Size L of the same shirt) remain distinct entries.
- **Free Shipping Threshold:** Progress bar dynamically showing how much more is needed to reach the ₹999 free express shipping tier.
- **Coupon Engine:** Validates promo codes (`FIRST10`, `B2G250`, `B3G500`) with minimum item quantity checks and real subtotal deductions.
- **Persistent Storage:** Browser `localStorage` retains cart state between sessions.

### H. Demo Checkout Flow
- Indian address form with PIN code and telephone validation.
- Payment method selector: UPI (GPay, PhonePe, Paytm), Credit/Debit Card, and Cash on Delivery (COD).
- Honest, transparent static order confirmation modal clearly detailing that no payment credentials or real bank funds were collected.

---

## 3. Project Directory Structure

```text
customapp-bandhan/
├── index.html               # Main storefront with hero, categories, catalog & editorial
├── product.html             # Dedicated product detail page with multi-angle gallery
├── cart.html                # Dedicated shopping bag & order breakdown page
├── configuration.json       # Official catalog data, branding, announcements & footer
├── CNAME                    # Custom domain (website.noblecompute.com)
├── README.md                # Documentation and deployment guide
├── css/
│   └── styles.css           # Complete responsive stylesheet & design system
├── js/
│   ├── config-fallback.js   # Embedded fallback configuration for file:// previews
│   ├── products.js          # Catalog repository, normalization, filtering & rendering
│   ├── cart.js              # Cart state management, coupons, shipping calculator
│   ├── wishlist.js          # Local wishlist state and drawer controller
│   └── app.js               # Slider, modals, live search, toast & event delegation
└── media/                   # 41 product images, hero banners, and brand assets
    ├── file1.png            # Official brand logo
    ├── file2.jpg - file7.jpg # Desktop & mobile hero banners
    └── file8.webp - file41.webp # Product portrait photographs & category covers
```

---

## 4. Local Testing Instructions

### Option 1: Direct File Preview
Double-click `index.html` or open it in any modern browser (`Chrome`, `Firefox`, `Edge`, `Safari`).
> **Note:** Browsers restrict `fetch()` requests on the `file://` protocol. The storefront includes an automatic fallback to `js/config-fallback.js`, allowing full functionality even when double-clicked offline!

### Option 2: Local HTTP Server (Recommended)
Run a local static server from the project directory:

```bash
# Using Node.js npx:
npx serve .

# Or using Python 3:
python -m http.server 8000

# Or using PHP:
php -S localhost:8000
```
Then navigate to `http://localhost:3000` (or `http://localhost:8000`) in your browser.

---

## 5. GitHub Pages Deployment Guide

The website is engineered for static hosting without server runtimes:

1. **Commit and Push:**
   ```bash
   git add .
   git commit -m "Deploy URBAN EDGE static fashion storefront"
   git push origin main
   ```
2. **Configure GitHub Pages:**
   - In your GitHub repository, navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **Deploy from a branch**.
   - Under **Branch**, select `main` and root folder `/ (root)`.
   - Click **Save**.
3. **Custom Domain:**
   - If using the configured custom domain (`website.noblecompute.com`), ensure the `CNAME` file is present in the repository root and your DNS provider has a CNAME record pointing to `noblecompute.github.io`.

---

## 6. Functional & Quality Assurance Audit

All core e-commerce capabilities were tested and verified against the actual catalog:

| Test Case | Description | Result |
| :--- | :--- | :--- |
| **Catalog Data Ingestion** | Successfully loads and normalizes all 7 products and 6 categories from `configuration.json`. | **PASS** |
| **Missing Field Fallback** | Product ID `1792749954069` had an empty name in JSON; correctly falls back to `"Light Blue Linen Blend Shirt"`. | **PASS** |
| **Media Resolution** | All 41 image references in `media/` mapped with relative paths and remote GitHub raw fallbacks. | **PASS** |
| **Multi-Faceted Search** | Searching for `"linen"` accurately filters down to 4 matching shirts across names and descriptions. | **PASS** |
| **Category Discovery** | Filtering by `"DATE READY"` accurately isolates the 3 matching styles. | **PASS** |
| **Price & Size Filters** | Max price slider and size selectors correctly narrow down the catalog without layout shifts. | **PASS** |
| **Cart Variant Handling** | Adding different sizes (e.g. M and L) creates distinct line items with independent quantities. | **PASS** |
| **Free Shipping Logic** | Orders under ₹999 incur ₹99 delivery; orders ₹999+ unlock free express courier delivery. | **PASS** |
| **Discount Coupons** | Code `FIRST10` deducts 10%; `B2G250` deducts ₹250 on 2+ items; `B3G500` validates 3+ items. | **PASS** |
| **Persistent Storage** | Cart and wishlist state survive browser page reloads via `localStorage`. | **PASS** |
| **Responsive Viewports** | Tested at 360px, 390px, 768px, 1024px, and 1440px with zero horizontal scroll or broken touch targets. | **PASS** |
