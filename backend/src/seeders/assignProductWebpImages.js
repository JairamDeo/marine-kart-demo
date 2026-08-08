/**
 * Assign random WebP gallery images to all existing products via Cloudinary.
 * Each product gets up to 4 images (main + thumbnails). Does NOT wipe the DB.
 *
 * Usage: node src/seeders/assignProductWebpImages.js
 */
require('dotenv').config();
const https = require('https');
const http = require('http');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { uploadBuffer } = require('../utils/cloudinaryUpload');

const GALLERY_SIZE = 4;

function fetchBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error(`Too many redirects for ${url}`));
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          'User-Agent': 'MarineKart-ImageSeeder/1.0',
          Accept: 'image/*',
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, url).href;
          return fetchBuffer(next, redirects + 1).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.setTimeout(20000, () => {
      req.destroy(new Error(`Timeout fetching ${url}`));
    });
  });
}

async function uploadRandomWebp(productId, slot) {
  const seed = `mk-g-${productId}-${slot}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const sourceUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/800`;
  const raw = await fetchBuffer(sourceUrl);
  if (!raw?.length) throw new Error('Empty image');
  if (raw.length > 900_000) throw new Error(`Source too large (${raw.length} bytes)`);
  return uploadBuffer(raw, {
    section: 'products',
    publicId: `product-${productId}-g${slot}-${Date.now()}`,
  });
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI missing in backend/.env');
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary env vars missing in backend/.env');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find().select('_id name sku images imagePublicIds');
  console.log(
    `Found ${products.length} products — ensuring ${GALLERY_SIZE} WebP gallery images each…`
  );

  let ok = 0;
  let fail = 0;

  for (const product of products) {
    try {
      const urls = Array.isArray(product.images) ? [...product.images].filter(Boolean) : [];
      const ids = Array.isArray(product.imagePublicIds) ? [...product.imagePublicIds] : [];

      while (urls.length < GALLERY_SIZE) {
        const slot = urls.length;
        const uploaded = await uploadRandomWebp(String(product._id), slot);
        urls.push(uploaded.url);
        ids.push(uploaded.publicId);
        console.log(
          `  + ${product.sku || product.name} image ${urls.length}/${GALLERY_SIZE} (${uploaded.format})`
        );
      }

      product.images = urls.slice(0, GALLERY_SIZE);
      product.imagePublicIds = ids.slice(0, GALLERY_SIZE);
      await product.save();
      ok += 1;
      console.log(`✓ [${ok}/${products.length}] ${product.sku || product.name} — ${product.images.length} images`);
    } catch (err) {
      fail += 1;
      console.error(`✗ ${product.sku || product.name}: ${err.message}`);
    }
  }

  console.log(`\nDone. Updated ${ok}, failed ${fail}.`);
  await mongoose.disconnect();
  process.exit(fail ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
