const fs = require('fs');
const path = require('path');

// 1. Setup global window/document mock
global.window = global;
global.document = {
  getElementById: (id) => {
    if (id === 'bandhan-embedded-config') {
      return { textContent: fs.readFileSync('configuration.json', 'utf8') };
    }
    return {
      innerHTML: '',
      style: {},
      textContent: '',
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      appendChild: () => {},
      querySelectorAll: () => []
    };
  },
  querySelector: () => ({ style: {}, classList: { add: () => {}, remove: () => {} } }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Global mocks
global.fetch = async () => { throw new Error('Simulated CORS network block under file:// origin'); };

// Load application scripts
eval(fs.readFileSync('js/products.js', 'utf8'));
eval(fs.readFileSync('js/cart.js', 'utf8'));
eval(fs.readFileSync('js/wishlist.js', 'utf8'));
eval(fs.readFileSync('js/app.js', 'utf8'));

async function runVerification() {
  console.log('=== TEST 1: ProductStore.init() Offline / file:// Fallback ===');
  const loaded = await window.ProductStore.init();
  console.log('ProductStore loaded with simulated blocked fetch:', loaded);
  if (!loaded) throw new Error('ProductStore.init() failed on file:// fallback!');
  console.log('[PASS] Products count:', window.ProductStore.products.length);
  console.log('[PASS] Categories count:', window.ProductStore.categories.length);
  console.log('[PASS] Topics count:', window.ProductStore.topics.length);
  console.log('[PASS] Hero slides count:', window.ProductStore.hero.length);

  console.log('\n=== TEST 2: Responsive Topics Cross-Fallback Logic ===');
  // Scenario A: Desktop only
  const topicDesktopOnly = { desktop_image: 'media/file8.jpg', mobile_image: '' };
  const resA = window.resolveResponsiveMedia(topicDesktopOnly);
  console.log('Desktop only -> Desktop:', resA.desktop.src, '| Mobile fallback:', resA.mobile.src);
  if (resA.desktop.src !== './media/file8.jpg' || resA.mobile.src !== './media/file8.jpg') {
    throw new Error('Case A failed!');
  }
  console.log('[PASS] Scenario A passed');

  // Scenario B: Mobile only
  const topicMobileOnly = { desktop_image: '', mobile_image: 'media/file9.jpg' };
  const resB = window.resolveResponsiveMedia(topicMobileOnly);
  console.log('Mobile only -> Mobile:', resB.mobile.src, '| Desktop fallback:', resB.desktop.src);
  if (resB.mobile.src !== './media/file9.jpg' || resB.desktop.src !== './media/file9.jpg') {
    throw new Error('Case B failed!');
  }
  console.log('[PASS] Scenario B passed');

  // Scenario C: Both specified
  const topicBoth = { desktop_image: 'media/file8.jpg', mobile_image: 'media/file9.jpg' };
  const resC = window.resolveResponsiveMedia(topicBoth);
  console.log('Both -> Desktop:', resC.desktop.src, '| Mobile:', resC.mobile.src);
  if (resC.desktop.src !== './media/file8.jpg' || resC.mobile.src !== './media/file9.jpg') {
    throw new Error('Case C failed!');
  }
  console.log('[PASS] Scenario C passed');

  console.log('\n=== TEST 3: Catalog Grid Placement (No Gaps & No Consecutive Topics) ===');
  const mockGrid = { innerHTML: '' };
  global.document.getElementById = (id) => {
    if (id === 'productsGrid') return mockGrid;
    return {
      innerHTML: '',
      style: {},
      textContent: '',
      classList: { add: () => {}, remove: () => {}, toggle: () => {} }
    };
  };

  // Run renderCatalogGrid
  window.renderCatalogGrid();
  const html = mockGrid.innerHTML;
  
  // Count rendered products and topic cards
  const productCardsCount = (html.match(/class="product-card"/g) || []).length;
  const topicCardsCount = (html.match(/class="topic-campaign-card grid-break"/g) || []).length;
  console.log('Rendered product cards:', productCardsCount);
  console.log('Rendered topic break banners:', topicCardsCount);

  if (productCardsCount !== 13) {
    throw new Error(`Expected 13 product cards, got ${productCardsCount}`);
  }
  // With 13 products and interval 4, we expect 3 topic banners (after product 4, 8, 12)
  if (topicCardsCount !== 3) {
    throw new Error(`Expected 3 interspersed topic banners, got ${topicCardsCount}`);
  }
  console.log('[PASS] Interval of 4 correctly interspersed 3 topic banners between complete rows!');

  // Check no two topic banners appear consecutively
  const hasConsecutiveTopics = /topic-campaign-card[\s\S]*?<\/aside>\s*<aside class="topic-campaign-card/.test(html);
  console.log('Has consecutive topics without products between them:', hasConsecutiveTopics);
  if (hasConsecutiveTopics) {
    throw new Error('Topics were rendered in sequence! Rule violated.');
  }
  console.log('[PASS] Zero consecutive topics! Topics only appear cleanly between complete rows.');

  console.log('\n=== TEST 4: Physical Disk Existence of Referenced Media ===');
  const allMedia = fs.readdirSync('media');
  console.log('Total files in media/ folder:', allMedia.length);

  window.ProductStore.topics.forEach((t, i) => {
    const desktopFile = t.responsive.desktop.src.replace('./media/', '');
    const mobileFile = t.responsive.mobile.src.replace('./media/', '');
    const desktopExists = fs.existsSync(path.join('media', desktopFile));
    const mobileExists = fs.existsSync(path.join('media', mobileFile));
    console.log(`Topic ${i + 1}: Desktop file "${desktopFile}" exists: ${desktopExists} | Mobile file "${mobileFile}" exists: ${mobileExists}`);
    if (!desktopExists || !mobileExists) {
      throw new Error(`Topic ${i + 1} media missing on disk!`);
    }
  });

  console.log('\n========================================');
  console.log('ALL VERIFICATION TESTS COMPLETED WITH 100% SUCCESS!');
  console.log('========================================');
}

runVerification().catch(err => {
  console.error('[TEST FAILURE]', err);
  process.exit(1);
});
