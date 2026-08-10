/**
 * Upload local category product images to Cloudinary (WebP, lossless) and map to products.
 *
 * Folders (project root):
 *   - SS Fittings/
 *   - ELECTRICAL ACCESSORIES/
 *   - Steering & Contro/
 *
 * Naming:
 *   MK-006-01.png      → main image for productId MK-006-01
 *   MK-006-01-TD.png   → thumbnail for same product (max 4 thumbs)
 *   Only *-TD.png      → treat as main
 *   *-XX.png           → shared image for all matching length variants
 *
 * Products without a match keep /images/product-placeholder.webp
 *
 * Usage: npm run seed:images
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { uploadBuffer } = require('../utils/cloudinaryUpload');
const { notDeleted } = require('../utils/audit');

const ROOT = path.join(__dirname, '../../..');
const PLACEHOLDER = '/images/product-placeholder.webp';
const MAX_THUMBS = 4;

const SOURCE_FOLDERS = [
  {
    dir: path.join(ROOT, 'SS Fittings'),
    cloudFolder: 'marinekart/products/ss-fittings',
    label: 'SS Fittings',
  },
  {
    dir: path.join(ROOT, 'ELECTRICAL ACCESSORIES'),
    cloudFolder: 'marinekart/products/electrical-accessories',
    label: 'ELECTRICAL ACCESSORIES',
  },
  {
    dir: path.join(ROOT, 'Steering & Contro'),
    cloudFolder: 'marinekart/products/steering-control',
    label: 'Steering & Contro',
  },
];

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

function parseFileName(file) {
  const base = file.replace(/\.(png|jpe?g|webp)$/i, '');
  const isTd = /-TD$/i.test(base);
  const key = base.replace(/-TD$/i, '');
  return { file, key, isTd };
}

function candidateKeys(key) {
  const keys = [key];
  // MK11206-BRASS → MK11206 Brass
  if (/-BRASS$/i.test(key)) keys.push(key.replace(/-BRASS$/i, ' Brass'));
  if (/-SS$/i.test(key)) keys.push(key.replace(/-SS$/i, ' SS'));
  // MK3-01-001-1 → MK3-01-001
  if (/-\d+$/.test(key) && !/-\d+\.\d+$/.test(key)) {
    keys.push(key.replace(/-\d+$/, ''));
  }
  // MKHS-150 → MMHS-150
  if (/^MKHS-/i.test(key)) keys.push(key.replace(/^MKHS-/i, 'MMHS-'));
  // MKV9202 → try MKV79202 style near-miss not automatic
  return [...new Set(keys.map(normalizeId))];
}

function buildProductIndex(products) {
  const exact = new Map();
  for (const p of products) {
    const n = normalizeId(p.productId);
    if (!n) continue;
    if (!exact.has(n)) exact.set(n, []);
    exact.get(n).push(p);
  }
  return { exact, all: products };
}

function findProductsForKey(rawKey, index) {
  const isXx = /-XX$/i.test(rawKey);
  const baseKey = rawKey.replace(/-XX$/i, '');

  if (isXx) {
    let prefix = normalizeId(baseKey);
    let hits = index.all.filter((p) => {
      const id = normalizeId(p.productId);
      return id === prefix || id.startsWith(`${prefix}-`) || id.startsWith(`${prefix}/`);
    });
    if (!hits.length) {
      // MKSC-1.2 → MKSC (match MKSC-06 … not MKSCL-1)
      const shortened = prefix.replace(/-\d+(?:\.\d+)?$/, '');
      if (shortened && shortened !== prefix) {
        const re = new RegExp(`^${escapeRegex(shortened)}-\\d`);
        hits = index.all.filter((p) => re.test(normalizeId(p.productId)));
      }
    }
    return hits;
  }

  for (const cand of candidateKeys(baseKey)) {
    if (index.exact.has(cand)) return index.exact.get(cand);
  }

  // Shared family image: MKMS-1.2 → MKMS-1.2-06, …
  const n = normalizeId(baseKey);
  const prefixHits = index.all.filter((p) => {
    const id = normalizeId(p.productId);
    return id.startsWith(`${n}-`) || id.startsWith(`${n}/`);
  });
  return prefixHits;
}

function collectFolderGroups(folderCfg) {
  if (!fs.existsSync(folderCfg.dir)) {
    console.warn(`Missing folder: ${folderCfg.dir}`);
    return new Map();
  }
  const files = fs.readdirSync(folderCfg.dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  const groups = new Map();
  for (const file of files) {
    const { key, isTd } = parseFileName(file);
    if (!groups.has(key)) groups.set(key, { main: [], thumbs: [], folderCfg });
    const abs = path.join(folderCfg.dir, file);
    if (isTd) groups.get(key).thumbs.push(abs);
    else groups.get(key).main.push(abs);
  }
  return groups;
}

function galleryPaths(group) {
  let main = group.main[0] || null;
  const extras = [...group.main.slice(1)];
  const thumbs = [...group.thumbs];

  // Only TD → use first TD as main
  if (!main && thumbs.length) {
    main = thumbs.shift();
  }
  if (!main) return [];

  const thumbList = [...thumbs, ...extras].slice(0, MAX_THUMBS);
  return [main, ...thumbList];
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
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('Cloudinary env missing');

  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({ ...notDeleted }).select(
    '_id productId name images imagePublicIds'
  );
  console.log(`Products in DB: ${products.length}`);

  const index = buildProductIndex(products);
  const uploadCache = new Map(); // local path → { url, publicId }
  const galleryByProduct = new Map(); // product _id string → { urls, publicIds }

  let matchedKeys = 0;
  let unmatchedKeys = 0;
  let uploadedFiles = 0;

  for (const folderCfg of SOURCE_FOLDERS) {
    const groups = collectFolderGroups(folderCfg);
    console.log(`\n=== ${folderCfg.label}: ${groups.size} product image keys ===`);

    for (const [key, group] of groups) {
      const targets = findProductsForKey(key, index);
      if (!targets.length) {
        unmatchedKeys += 1;
        console.warn(`  ! no product for image key "${key}"`);
        continue;
      }
      matchedKeys += 1;

      const paths = galleryPaths(group);
      const urls = [];
      const publicIds = [];

      for (let i = 0; i < paths.length; i++) {
        const filePath = paths[i];
        const cacheKey = filePath;
        let uploaded = uploadCache.get(cacheKey);
        if (!uploaded) {
          const safeId = String(key)
            .replace(/[^a-zA-Z0-9._-]+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 80);
          const slot = i === 0 ? 'main' : `td${i}`;
          try {
            uploaded = await uploadLocalFile(
              filePath,
              folderCfg.cloudFolder,
              `${safeId}-${slot}`
            );
            uploadCache.set(cacheKey, uploaded);
            uploadedFiles += 1;
            console.log(
              `  ↑ ${path.basename(filePath)} → ${uploaded.format} (${uploaded.bytes}b)`
            );
          } catch (err) {
            console.error(`  ✗ upload failed ${path.basename(filePath)}: ${err.message}`);
            continue;
          }
        }
        urls.push(uploaded.url);
        publicIds.push(uploaded.publicId);
      }

      if (!urls.length) continue;

      for (const p of targets) {
        const id = String(p._id);
        // Prefer richer gallery if product matched by multiple keys
        const prev = galleryByProduct.get(id);
        if (!prev || urls.length >= prev.urls.length) {
          galleryByProduct.set(id, { urls, publicIds });
        }
      }
    }
  }

  console.log(`\nUpdating products with Cloudinary galleries…`);
  let updated = 0;
  let placeholders = 0;

  for (const product of products) {
    const hit = galleryByProduct.get(String(product._id));
    if (hit?.urls?.length) {
      product.images = hit.urls;
      product.imagePublicIds = hit.publicIds;
      updated += 1;
    } else {
      product.images = [PLACEHOLDER];
      product.imagePublicIds = [];
      placeholders += 1;
    }
    await product.save();
  }

  console.log(
    `\nDone.\n` +
      `  Image keys matched: ${matchedKeys}\n` +
      `  Image keys unmatched: ${unmatchedKeys}\n` +
      `  Files uploaded: ${uploadedFiles}\n` +
      `  Products with photos: ${updated}\n` +
      `  Products with placeholder: ${placeholders}`
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
