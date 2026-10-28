const fs = require('fs');
const path = require('path');

// Mock window and browser globals
const globalWindow = {
  location: { pathname: '/index.html', search: '' }
};
global.window = globalWindow;
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Mock fetch for configuration.json
global.fetch = async function(url) {
  const filePath = path.join(__dirname, '../configuration.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return {
    ok: true,
    status: 200,
    json: async () => data
  };
};

// Load products.js
const productsJs = fs.readFileSync(path.join(__dirname, '../js/products.js'), 'utf8');
eval(productsJs);

async function runTests() {
  console.log('--- STARTING CLEAN FASHION UI AUDIT ---');
  
  const store = window.ProductStore;
  const renderCard = window.renderProductCardHtml;

  // 1. Initialize ProductStore
  const initSuccess = await store.init();
  console.log('1. ProductStore.init() success:', initSuccess);

  const products = store.getAll();
  console.log(`2. Total products: ${products.length}`);

  // 3. Test Badges on Product #7 (which has all flags in JSON)
  const prod7 = store.getById('1792752146464');
  const card7Html = renderCard(prod7, false);

  console.log('3. Checking Badges on Product #7 card:');
  const hasShowcaseBadge = card7Html.includes('badge-showcase') || card7Html.includes('SHOWCASE');
  const hasCoverBadge = card7Html.includes('badge-cover') || card7Html.includes('COVER EDIT');
  const hasMixBadge = card7Html.includes('badge-mix');
  
  console.log('   - SHOWCASE badge removed:', !hasShowcaseBadge);
  console.log('   - COVER EDIT badge removed:', !hasCoverBadge);
  console.log('   - Single clean MIX badge present:', hasMixBadge);

  if (hasShowcaseBadge || hasCoverBadge || !hasMixBadge) {
    console.error('FAIL: Product card badges are still cluttered or showing internal flags.');
    process.exit(1);
  }

  // Count how many badge spans exist in card7Html
  const badgeMatches = card7Html.match(/<span class="badge-/g) || [];
  console.log(`   - Total badges rendered on card: ${badgeMatches.length} (expected 1)`);
  if (badgeMatches.length !== 1) {
    console.error(`FAIL: Expected exactly 1 badge, got ${badgeMatches.length}`);
    process.exit(1);
  }

  // 4. Test Category Cover in Front still works
  console.log('4. Verifying category cover is still sorted to index 0 (in front):');
  ['DATE READY', 'CONCERT FITS'].forEach(cat => {
    const items = store.filterAndSort({ category: cat });
    console.log(`   - '${cat}' first item cover status:`, items[0].is_category_cover);
    if (!items[0].is_category_cover) {
      console.error(`FAIL: Cover item is not at index 0 for ${cat}`);
      process.exit(1);
    }
  });

  // 5. Test Showcase photos still work
  const showcasePhotos = store.getShowcasePhotos();
  console.log(`5. Showcase photos extracted: ${showcasePhotos.length} photos`);
  if (showcasePhotos.length === 0) {
    console.error('FAIL: Showcase photos array is empty.');
    process.exit(1);
  }

  console.log('\n>>> ALL CLEAN FASHION UI AUDITS PASSED! <<<');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
