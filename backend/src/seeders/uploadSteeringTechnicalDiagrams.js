/**
 * Upload technical-diagram PNGs from:
 *   Steering Catalog (Technical Diagram)/{subfolder}/{partNumber}.png
 *
 * APPENDS to matching products by part number (productId / name).
 * Never replaces existing gallery images.
 *
 * Usage (from backend/):
 *   node src/seeders/uploadSteeringTechnicalDiagrams.js
 *   node src/seeders/uploadSteeringTechnicalDiagrams.js --dry-run
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { uploadBuffer } = require('../utils/cloudinaryUpload');
const { notDeleted } = require('../utils/audit');

const ROOT = path.join(__dirname, '../../../Steering Catalog (Technical Diagram)');
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;
const PLACEHOLDER_RE = /product-placeholder|specification-placeholder/i;

function normalizeId(id) {
  return String(id || '')
    .trim()
    .toUpperCase()
    .replace(/_/g, '/')
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '/');
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
  // MKHS ↔ MMHS catalog aliases
  if (/^MKHS-/i.test(key)) keys.push(key.replace(/^MKHS-/i, 'MMHS-'));
  if (/^MMHS-/i.test(key)) keys.push(key.replace(/^MMHS-/i, 'MKHS-'));
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

/**
 * Exact part-number match first.
 * Base keys like MKTMS-1.3 (no length suffix) can match all MKTMS-1.3-* products.
 */
function findProductsForKey(rawKey, index) {
  const n = normalizeId(rawKey);

  for (const cand of candidateKeys(n)) {
    if (index.exact.has(cand)) return index.exact.get(cand);
  }

  // Base diagram without trailing length (e.g. MKTMS-1.3.png → all MKTMS-1.3-*)
  const hasLengthSuffix = /-\d{1,3}$/.test(n);
  if (!hasLengthSuffix) {
    return index.all.filter((p) => {
      const id = normalizeId(p.productId || p.name);
      return id === n || id.startsWith(`${n}-`);
    });
  }

  return [];
}

function collectDiagramFiles(rootDir) {
  if (!fs.existsSync(rootDir)) {
    throw new Error(`Folder not found: ${rootDir}`);
  }

  const entries = [];
  for (const subEntry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!subEntry.isDirectory()) continue;
    const subPath = path.join(rootDir, subEntry.name);
    for (const file of fs.readdirSync(subPath)) {
      if (!IMAGE_RE.test(file)) continue;
      const key = file.replace(IMAGE_RE, '');
      entries.push({
        subcategory: subEntry.name,
        key,
        filePath: path.join(subPath, file),
      });
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

function pushGallery(map, productId, item) {
  const id = String(productId);
  if (!map.has(id)) map.set(id, { urls: [], publicIds: [], keys: [] });
  const bucket = map.get(id);
  bucket.urls.push(item.url);
  bucket.publicIds.push(item.publicId || '');
  bucket.keys.push(item.key);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  if (!dryRun && !process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary env missing');
  }

  const files = collectDiagramFiles(ROOT);
  console.log(`Found ${files.length} diagram files under Steering Catalog (Technical Diagram)/`);

  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({ ...notDeleted }).select(
    '_id productId name images imagePublicIds'
  );
  console.log(`Products in DB: ${products.length}`);

  const index = buildProductIndex(products);
  const uploadCache = new Map();
  /** productId → { urls[], publicIds[], keys[] } — accumulates APPEND list */
  const galleryByProduct = new Map();

  let matchedFiles = 0;
  let unmatchedFiles = 0;
  let uploadedFiles = 0;
  const unmatchedKeys = [];

  for (const item of files) {
    const targets = findProductsForKey(item.key, index);
    if (!targets.length) {
      unmatchedFiles += 1;
      unmatchedKeys.push(`${item.subcategory}/${item.key}`);
      continue;
    }
    matchedFiles += 1;

    const cloudFolder = `marinekart/products/steering-technical-diagrams/${slugify(item.subcategory)}`;
    const safeId = String(item.key)
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);

    let uploaded = uploadCache.get(item.filePath);
    if (!uploaded) {
      if (dryRun) {
        uploaded = {
          url: `[dry-run] ${item.filePath}`,
          publicId: `${cloudFolder}/${safeId}-diagram`,
        };
      } else {
        try {
          uploaded = await uploadLocalFile(
            item.filePath,
            cloudFolder,
            `${safeId}-diagram`
          );
          uploadCache.set(item.filePath, uploaded);
          uploadedFiles += 1;
          console.log(
            `  ↑ ${item.key} (${targets.length} product${targets.length > 1 ? 's' : ''}) ← ${path.basename(item.filePath)}`
          );
        } catch (err) {
          console.error(`  ✗ ${item.key}: ${err.message}`);
          continue;
        }
      }
    }

    for (const p of targets) {
      pushGallery(galleryByProduct, p._id, {
        url: uploaded.url,
        publicId: uploaded.publicId,
        key: item.key,
      });
    }
  }

  console.log(`\nMatched files: ${matchedFiles}`);
  console.log(`Unmatched files (no DB product): ${unmatchedFiles}`);
  if (unmatchedKeys.length) {
    console.log(`Unmatched:\n  ${unmatchedKeys.join('\n  ')}`);
  }
  console.log(`Products that will receive append(s): ${galleryByProduct.size}`);

  if (dryRun) {
    let sample = 0;
    for (const [id, hit] of galleryByProduct) {
      if (sample >= 8) break;
      const p = products.find((x) => String(x._id) === id);
      console.log(
        `  [dry] ${p?.productId || id}: keep ${p?.images?.length || 0} existing + append ${hit.urls.length} (${hit.keys.join(', ')})`
      );
      sample += 1;
    }
    console.log('\nDry run — no uploads or DB writes.');
    await mongoose.disconnect();
    process.exit(0);
  }

  let updated = 0;
  let skipped = 0;
  let appendedCount = 0;

  for (const product of products) {
    const hit = galleryByProduct.get(String(product._id));
    if (!hit?.urls?.length) {
      skipped += 1;
      continue;
    }

    const existingUrls = (Array.isArray(product.images) ? product.images : [])
      .map((u) => String(u || '').trim())
      .filter((u) => u && !PLACEHOLDER_RE.test(u));
    const existingIds = (Array.isArray(product.imagePublicIds)
      ? product.imagePublicIds
      : []
    ).filter(Boolean);

    const seen = new Set([...existingUrls, ...existingIds]);
    const urls = [...existingUrls];
    const publicIds = existingIds.slice(0, urls.length);

    /** Length-specific tech sheets (…-06-diagram) stay secondary; base family shots can lead. */
    const isLengthDiagram = (publicId, key) => {
      const leaf = String(publicId || '').split('/').pop() || '';
      const base = leaf.replace(/-diagram$/i, '');
      if (/-\d+$/.test(base) && !/\d+\.\d+$/.test(base)) return true;
      const k = String(key || '');
      return /-\d+$/.test(k) && !/\d+\.\d+$/.test(k);
    };

    const newPhotos = [];
    const newDiagrams = [];

    let added = 0;
    for (let i = 0; i < hit.urls.length; i++) {
      const url = hit.urls[i];
      const publicId = hit.publicIds[i] || '';
      const key = hit.keys[i] || '';
      if (!url) continue;
      if (seen.has(url) || (publicId && seen.has(publicId))) continue;
      // Also skip if same diagram publicId stem already present
      if (
        publicId &&
        [...seen].some(
          (x) =>
            typeof x === 'string' &&
            (x === publicId || x.endsWith(`/${publicId.split('/').pop()}`))
        )
      ) {
        continue;
      }
      seen.add(url);
      if (publicId) seen.add(publicId);
      const item = { url, publicId };
      if (isLengthDiagram(publicId, key)) newDiagrams.push(item);
      else newPhotos.push(item);
      added += 1;
    }

    if (!added) {
      skipped += 1;
      continue;
    }

    // Main = existing photos + new family photos; secondary = tech sheets at end
    const nextUrls = [
      ...urls.filter((_, i) => !isLengthDiagram(publicIds[i], '')),
      ...newPhotos.map((x) => x.url),
      ...urls.filter((_, i) => isLengthDiagram(publicIds[i], '')),
      ...newDiagrams.map((x) => x.url),
    ];
    const nextIds = [
      ...publicIds.filter((id) => !isLengthDiagram(id, '')),
      ...newPhotos.map((x) => x.publicId),
      ...publicIds.filter((id) => isLengthDiagram(id, '')),
      ...newDiagrams.map((x) => x.publicId),
    ];

    product.images = nextUrls;
    product.imagePublicIds = nextIds;
    await product.save();
    updated += 1;
    appendedCount += added;
    console.log(
      `  ✓ ${product.productId || product.name}: ${existingUrls.length} → ${nextUrls.length} (+${added})`
    );
  }

  console.log(
    `\nDone.\n` +
      `  Files uploaded to Cloudinary: ${uploadedFiles}\n` +
      `  Products updated (appended only): ${updated}\n` +
      `  Images appended total: ${appendedCount}\n` +
      `  Products unchanged: ${skipped}`
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
