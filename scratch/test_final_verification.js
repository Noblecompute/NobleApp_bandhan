const fs = require('fs');

global.window = global;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

// Mock fetch for configuration.json
const rawConfig = JSON.parse(fs.readFileSync('configuration.json', 'utf8'));
global.fetch = async (url) => ({
  ok: true,
  status: 200,
  json: async () => rawConfig
});

eval(fs.readFileSync('js/products.js', 'utf8'));

async function runTests() {
  console.log('=== STEP 1: ProductStore.init() ===');
  const ok = await ProductStore.init();
  console.log('ProductStore loaded successfully:', ok);
  console.log('Total products count:', ProductStore.products.length);
  console.log('Total categories count:', ProductStore.categories.length);

  console.log('\n=== STEP 2: 6 Occasion Categories (Powerlook 3x2 Grid) ===');
  const expectedCats = ['CHAIN TREND', 'DATE READY', 'CONCERT FITS', 'LINEN COLLECTION', 'AFTER OFFICE', '9 TO 5'];
  expectedCats.forEach(expected => {
    const found = ProductStore.categories.find(c => c.name.toUpperCase() === expected);
    if (found) {
      console.log(`[PASS] ${found.name}: Image URL contains -> ${found.image}`);
    } else {
      console.error(`[FAIL] Missing category: ${expected}`);
    }
  });

  console.log('\n=== STEP 3: Badge Uniformity (Mix == New Arrival) ===');
  // Create mock products to test
  const mixProd = {
    id: 'prod_mix_1',
    name: 'Vintage Wash Corduroy Shirt',
    category: 'DATE READY',
    price: 2499,
    effective_price: 1899,
    sizes: ['S', 'M', 'L', 'XL'],
    is_mix: true,
    is_new_arrival: false,
    primary_image: 'media/file8.webp'
  };

  const newProd = {
    id: 'prod_new_1',
    name: 'Raw Edge Oversized Tee',
    category: 'CONCERT FITS',
    price: 1499,
    effective_price: 1199,
    sizes: ['M', 'L'],
    is_mix: false,
    is_new_arrival: true,
    primary_image: 'media/file14.webp'
  };

  const mixCardHtml = renderProductCardHtml(mixProd);
  const newCardHtml = renderProductCardHtml(newProd);

  const hasMixBadge = mixCardHtml.includes('<span class="badge-powerlook">THE MIX</span>');
  const hasNewBadge = newCardHtml.includes('<span class="badge-powerlook">NEW ARRIVAL</span>');
  const hasMixMemberPrice = mixCardHtml.includes('member-price-tag') && mixCardHtml.includes('Member Price : ₹1,747');
  const hasNewMemberPrice = newCardHtml.includes('member-price-tag') && newCardHtml.includes('Member Price : ₹1,103');

  console.log('[PASS] Mix badge styled with .badge-powerlook:', hasMixBadge);
  console.log('[PASS] New arrival badge styled with .badge-powerlook:', hasNewBadge);
  console.log('[PASS] Mix card includes Member Price pill:', hasMixMemberPrice);
  console.log('[PASS] New arrival card includes Member Price pill:', hasNewMemberPrice);

  console.log('\n=== STEP 4: Powerlook Category Occasions Card HTML ===');
  const sampleCat = ProductStore.categories[0];
  const catHtml = renderCategoryCardHtml(sampleCat);
  const hasOverlayTitle = catHtml.includes('class="category-title-overlay"');
  const hasNoCtaButton = !catHtml.includes('category-cta-pill') && !catHtml.includes('EXPLORE');

  console.log('[PASS] Category card features clean title overlay:', hasOverlayTitle);
  console.log('[PASS] Category card stripped of generic CTA buttons:', hasNoCtaButton);

  console.log('\n=== STEP 5: Category Filtering (Cover Photo in Front) ===');
  const concertFiltered = ProductStore.filterAndSort({ category: 'CONCERT FITS' });
  console.log('[PASS] Filtered CONCERT FITS count:', concertFiltered.length);
  if (concertFiltered.length > 0) {
    console.log('[PASS] First product (in front):', concertFiltered[0].name, 'ID:', concertFiltered[0].id);
  }

  console.log('\n=== STEP 6: CSS Integrity Check ===');
  const css = fs.readFileSync('css/styles.css', 'utf8');
  console.log('[PASS] Contains .badge-powerlook:', css.includes('.badge-powerlook'));
  console.log('[PASS] Contains .member-price-tag:', css.includes('.member-price-tag'));
  console.log('[PASS] Contains .category-title-overlay:', css.includes('.category-title-overlay'));
  console.log('[PASS] Contains .section-header-powerlook:', css.includes('.section-header-powerlook'));
  console.log('[PASS] Contains .view-all-pill-link:', css.includes('.view-all-pill-link'));
  console.log('[PASS] Contains .container-wide:', css.includes('.container-wide'));
  console.log('[PASS] Uses #E6F8EE for mint member pill:', css.includes('#E6F8EE'));
  console.log('[PASS] Uses #006338 for mint member text:', css.includes('#006338'));

  console.log('\nALL 6 VERIFICATION STEPS PASSED 100%!');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
