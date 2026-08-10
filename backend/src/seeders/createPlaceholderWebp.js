/**
 * Generate a clearer "Image not found" WebP placeholder (bold visible text).
 * Usage: node src/seeders/createPlaceholderWebp.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const size = 600;
  const outDir = path.join(__dirname, '../../../frontend/public/images');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'product-placeholder.webp');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f2f7fa"/>
      <stop offset="100%" stop-color="#d7e6ee"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="48" y="48" width="504" height="504" rx="28" fill="#ffffff" opacity="0.55"/>
  <circle cx="300" cy="230" r="78" fill="#ffffff"/>
  <circle cx="300" cy="230" r="70" fill="none" stroke="#78c6d4" stroke-width="10"/>
  <path d="M268 230h64M300 198v64" stroke="#1a4b8c" stroke-width="8" stroke-linecap="round" opacity="0.35"/>
  <text x="300" y="360" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700" fill="#1a4b8c">Image not found</text>
  <text x="300" y="398" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="600" fill="#5a7a8c" opacity="0.9">No product photo available</text>
</svg>`;

  await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(outFile);
  console.log('Wrote', outFile);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
