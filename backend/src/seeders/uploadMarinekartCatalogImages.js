/**
 * Upload product images from MARINEKART-images/ to Cloudinary and update matching DB products.
 *
 * Folder layout:
 *   MARINEKART-images/{catalog}/{subcategory}/{partNumber}.jpg
 *
 * Matches products by productId (same value as name / part number in catalog).
 * Products WITHOUT a local image are left unchanged.
 *
 * Usage:
 *   npm run seed:marinekart-images           # upload + update
 *   npm run seed:marinekart-images -- --dry-run
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { uploadBuffer } = require('../utils/cloudinaryUpload');
const { notDeleted } = require('../utils/audit');

const ROOT = path.join(__dirname, '../../../MARINEKART-images');
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

function normalizeId(id) {
  return String(id || '')
    .trim()
    .toUpperCase()
    .replace(/_/g, '/')
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '/');
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function candidateKeys(key) {
  const keys = [key];
  if (/-BRASS$/i.test(key)) keys.push(key.replace(/-BRASS$/i, ' Brass'));
  if (/-SS$/i.test(key)) keys.push(key.replace(/-SS$/i, ' SS'));
  if (/-\d+$/.test(key) && !/-\d+\.\d+$/.test(key)) {
    keys.push(key.replace(/-\d+$/, ''));
  }
  if (/^MKHS-/i.test(key)) keys.push(key.replace(/^MKHS-/i, 'MMHS-'));
  return [...new Set(keys.map(normalizeId))];
}

function buildProductIndex(products) {
  const exact = new Map();
  for (const p of products) {
    for (const raw of [p.productId, p.name]) {
      const n = normalizeId(raw);
      if (!n) continue;
      if (!exact.has(n)) exact.set(n, []);
      if (!exact.get(n).some((x) => String(x._id) === String(p._id))) {
        exact.get(n).push(p);
      }
    }
  }
  return { exact, all: products };
}

function findProductsForKey(rawKey, index) {
  const isXx = /-XX$/i.test(rawKey);
  const baseKey = rawKey.replace(/-XX$/i, '');

  if (isXx) {
    let prefix = normalizeId(baseKey);
    let hits = index.all.filter((p) => {
      const id = normalizeId(p.productId || p.name);
      return id === prefix || id.startsWith(`${prefix}-`) || id.startsWith(`${prefix}/`);
    });
    if (!hits.length) {
      const shortened = prefix.replace(/-\d+(?:\.\d+)?$/, '');
      if (shortened && shortened !== prefix) {
        const re = new RegExp(`^${escapeRegex(shortened)}-\\d`);
        hits = index.all.filter((p) => re.test(normalizeId(p.productId || p.name)));
      }
    }
    return hits;
  }

  for (const cand of candidateKeys(baseKey)) {
    if (index.exact.has(cand)) return index.exact.get(cand);
  }

  const n = normalizeId(baseKey);
  return index.all.filter((p) => {
    const id = normalizeId(p.productId || p.name);
    return id.startsWith(`${n}-`) || id.startsWith(`${n}/`);
  });
}

function collectCatalogImages(rootDir) {
  if (!fs.existsSync(rootDir)) {
    throw new Error(`Folder not found: ${rootDir}`);
  }

  const entries = [];
  for (const catalogEntry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!catalogEntry.isDirectory()) continue;
    const catalogPath = path.join(rootDir, catalogEntry.name);
    for (const subEntry of fs.readdirSync(catalogPath, { withFileTypes: true })) {
      if (!subEntry.isDirectory()) continue;
      const subPath = path.join(catalogPath, subEntry.name);
      for (const file of fs.readdirSync(subPath)) {
        if (!IMAGE_RE.test(file)) continue;
        const key = file.replace(IMAGE_RE, '');
        entries.push({
          catalog: catalogEntry.name,
          subcategory: subEntry.name,
          key,
          filePath: path.join(subPath, file),
        });
      }
    }
  }
  return entries;
}

async function uploadLocalFile(filePath, cloudFolder, publicId) {
  const buffer = fs.readFileSync(filePath);
  return uploadBuffer(buffer, {
    folder: cloudFolder,
    publicId,
    skipSizeLimit: true,
  });
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  if (!dryRun && !process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary env missing');
  }

  const files = collectCatalogImages(ROOT);
  console.log(`Found ${files.length} image files under MARINEKART-images/`);

  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({ ...notDeleted }).select(
    '_id productId name images imagePublicIds category subcategory'
  );
  console.log(`Products in DB: ${products.length}`);

  const index = buildProductIndex(products);
  const uploadCache = new Map();
  const galleryByProduct = new Map();

  let matchedFiles = 0;
  let unmatchedFiles = 0;
  let uploadedFiles = 0;
  const unmatchedKeys = [];

  for (const item of files) {
    const targets = findProductsForKey(item.key, index);
    if (!targets.length) {
      unmatchedFiles += 1;
      if (unmatchedKeys.length < 40) unmatchedKeys.push(item.key);
      continue;
    }
    matchedFiles += 1;

    const cloudFolder = `marinekart/products/${slugify(item.catalog)}/${slugify(item.subcategory)}`;
    const safeId = String(item.key)
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);

    let uploaded = uploadCache.get(item.filePath);
    if (!uploaded) {
      if (dryRun) {
        uploaded = { url: `[dry-run] ${item.filePath}`, publicId: `${cloudFolder}/${safeId}` };
      } else {
        try {
          uploaded = await uploadLocalFile(item.filePath, cloudFolder, `${safeId}-main`);
          uploadCache.set(item.filePath, uploaded);
          uploadedFiles += 1;
          console.log(`  ↑ ${item.key} ← ${path.basename(item.filePath)}`);
        } catch (err) {
          console.error(`  ✗ ${item.key}: ${err.message}`);
          continue;
        }
      }
    }

    for (const p of targets) {
      galleryByProduct.set(String(p._id), {
        urls: [uploaded.url],
        publicIds: uploaded.publicId ? [uploaded.publicId] : [],
        key: item.key,
      });
    }
  }

  console.log(`\nMatched files: ${matchedFiles}`);
  console.log(`Unmatched files (no DB product): ${unmatchedFiles}`);
  if (unmatchedKeys.length) {
    console.log(`Sample unmatched keys: ${unmatchedKeys.slice(0, 15).join(', ')}`);
  }
  console.log(`Products to update: ${galleryByProduct.size}`);

  if (dryRun) {
    console.log('\nDry run — no uploads or DB writes.');
    await mongoose.disconnect();
    process.exit(0);
  }

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const hit = galleryByProduct.get(String(product._id));
    if (!hit?.urls?.length) {
      skipped += 1;
      continue;
    }
    product.images = hit.urls;
    product.imagePublicIds = hit.publicIds;
    await product.save();
    updated += 1;
  }

  console.log(
    `\nDone.\n` +
      `  Files uploaded: ${uploadedFiles}\n` +
      `  Products updated: ${updated}\n` +
      `  Products unchanged (no match in folder): ${skipped}`
  );

  await mongoose.disconnect();
  process.exit(0);
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
