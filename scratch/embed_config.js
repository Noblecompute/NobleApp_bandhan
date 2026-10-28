const fs = require('fs');

const configRaw = fs.readFileSync('configuration.json', 'utf8').trim();
// Validate
JSON.parse(configRaw);

const embeddedScriptTag = `  <!-- Embedded Offline / Local Fallback Configuration (guarantees zero CORS failures when opened via file://) -->\n  <script id="bandhan-embedded-config" type="application/json">\n${configRaw}\n  </script>\n`;

['index.html', 'product.html', 'cart.html'].forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  // Remove any existing bandhan-embedded-config if present
  content = content.replace(/\s*<!-- Embedded Offline[\s\S]*?<\/script>\n/g, '\n');
  content = content.replace(/\s*<script id="bandhan-embedded-config"[\s\S]*?<\/script>\n/g, '\n');
  
  // Insert before <script src="js/products.js"></script>
  if (content.includes('<script src="js/products.js"></script>')) {
    content = content.replace('<script src="js/products.js"></script>', embeddedScriptTag + '  <script src="js/products.js"></script>');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[SUCCESS] Embedded config inserted into ${filePath}`);
  } else {
    console.warn(`[WARNING] <script src="js/products.js"></script> not found in ${filePath}`);
  }
});
