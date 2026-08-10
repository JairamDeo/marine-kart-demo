/**
 * Assign related category images from a product photo in that category.
 * Uploads a copy into Cloudinary marinekart/categories (WebP).
 *
 * Usage: npm run seed:category-images
 */
require('dotenv').config();
const https = require('https');
const http = require('http');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { uploadBuffer } = require('../utils/cloudinaryUpload');
const { notDeleted } = require('../utils/audit');
const { slugify } = require('../utils/helpers');

function fetchBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error(`Too many redirects for ${url}`));
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          'User-Agent': 'MarineKart-CategoryImageSeeder/1.0',
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
    req.setTimeout(30000, () => {
      req.destroy(new Error(`Timeout fetching ${url}`));
    });
  });
}

function isRealImage(url) {
  const u = String(url || '');
  if (!u) return false;
  if (u.includes('placeholder')) return false;
  if (u.includes('placehold.co')) return false;
  if (u.includes('154x154')) return false;
  return u.startsWith('http');
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('Cloudinary env missing');

  await mongoose.connect(process.env.MONGODB_URI);
  const categories = await Category.find({ ...notDeleted }).sort('sortOrder name');
  console.log(`Categories: ${categories.length}`);

  let ok = 0;
  let fail = 0;

  for (const cat of categories) {
    try {
      const products = await Product.find({
        category: cat._id,
        isActive: true,
        ...notDeleted,
      })
        .select('productId images')
        .limit(40)
        .lean();

      let sourceUrl = null;
      let sourcePid = null;
      for (const p of products) {
        const img = (p.images || []).find(isRealImage);
        if (img) {
          sourceUrl = img;
          sourcePid = p.productId;
          break;
        }
      }

      if (!sourceUrl) {
        console.warn(`  ! ${cat.name}: no related product photo — leave placeholder`);
        cat.image = '/images/product-placeholder.webp';
        await cat.save();
        fail += 1;
        continue;
      }

      const buffer = await fetchBuffer(sourceUrl);
      const publicId = `cat-${slugify(cat.name) || cat._id}`;
      const uploaded = await uploadBuffer(buffer, {
        folder: 'marinekart/categories',
        publicId,
        skipSizeLimit: true,
      });

      cat.image = uploaded.url;
      await cat.save();
      ok += 1;
      console.log(`  ✓ ${cat.name} ← ${sourcePid} (${uploaded.format})`);
    } catch (err) {
      fail += 1;
      console.error(`  ✗ ${cat.name}: ${err.message}`);
    }
  }

  console.log(`\nDone. Updated ${ok}, skipped/failed ${fail}.`);
  await mongoose.disconnect();
  process.exit(fail && !ok ? 1 : 0);
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
