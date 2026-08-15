/**
 * Generate a clear "Product Specification" WebP placeholder for specs thumbnails.
 * Usage: node src/seeders/createSpecPlaceholderWebp.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const size = 600;
  const outDir = path.join(__dirname, '../../../frontend/public/images');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'product-specification-placeholder.webp');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#eef6fa"/>
      <stop offset="100%" stop-color="#cfe3ee"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="40" y="40" width="520" height="520" rx="32" fill="#ffffff" opacity="0.7"/>
  <rect x="150" y="120" width="300" height="220" rx="16" fill="#ffffff" stroke="#78c6d4" stroke-width="8"/>
  <line x1="190" y1="175" x2="410" y2="175" stroke="#1a4b8c" stroke-width="10" stroke-linecap="round" opacity="0.85"/>
  <line x1="190" y1="215" x2="370" y2="215" stroke="#78c6d4" stroke-width="8" stroke-linecap="round"/>
  <line x1="190" y1="255" x2="400" y2="255" stroke="#78c6d4" stroke-width="8" stroke-linecap="round"/>
  <line x1="190" y1="295" x2="340" y2="295" stroke="#78c6d4" stroke-width="8" stroke-linecap="round"/>
  <text x="300" y="410" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="800" fill="#1a4b8c">Product Specification</text>
  <text x="300" y="448" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="600" fill="#5a7a8c">Dummy specification image</text>
</svg>`;

  await sharp(Buffer.from(svg)).webp({ quality: 92 }).toFile(outFile);
  console.log('Wrote', outFile);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
