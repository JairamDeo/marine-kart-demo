/**
 * Clear dummy placeholder assets from products that already have real photos,
 * and clear gallery entries that are only local placeholder paths.
 *
 * Usage: node src/seeders/clearDummyPlaceholders.js
 */
require('dotenv').config();
const connectDB = require('../config/db');
const Product = require('../models/Product');

const PLACEHOLDER_RE = /product-placeholder|specification-placeholder|placehold\.co|dummy/i;

async function run() {
  await connectDB();

  const products = await Product.find({ isDeleted: { $ne: true } }).select(
    'productId images specifications imagePublicIds'
  );

  let clearedGalleryPlaceholders = 0;
  let clearedDummySpecs = 0;

  for (const p of products) {
    let dirty = false;
    const imgs = Array.isArray(p.images) ? p.images.map((u) => String(u || '').trim()) : [];
    const real = imgs.filter((u) => u && !PLACEHOLDER_RE.test(u));
    const hadPlaceholderOnly = imgs.some((u) => PLACEHOLDER_RE.test(u));

    if (hadPlaceholderOnly || imgs.length !== real.length) {
      p.images = real;
      if (Array.isArray(p.imagePublicIds) && real.length === 0) {
        p.imagePublicIds = [];
      }
      clearedGalleryPlaceholders += 1;
      dirty = true;
    }

    const specImg = String(p.specifications?.image || '');
    if (specImg && PLACEHOLDER_RE.test(specImg)) {
      // Drop dummy spec image — keep real gallery as source of truth
      p.specifications = {
        mode: p.specifications?.markdown ? 'markdown' : 'none',
        markdown: p.specifications?.markdown || '',
        image: '',
      };
      clearedDummySpecs += 1;
      dirty = true;
    }

    if (dirty) await p.save();
  }

  console.log(`Cleared gallery placeholder entries on ${clearedGalleryPlaceholders} product(s).`);
  console.log(`Cleared dummy specification images on ${clearedDummySpecs} product(s).`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
