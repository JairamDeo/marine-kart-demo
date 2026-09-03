/**
 * Restore previous Cloudinary product images (from earlier seed folders)
 * and MERGE them with the current MARINEKART catalog images already in DB.
 *
 * Does NOT delete anything on Cloudinary — only updates product.images /
 * imagePublicIds so both old + new appear in the gallery.
 *
 * Old folders scanned:
 *   marinekart/products/ss-fittings
 *   marinekart/products/electrical-accessories
 *   marinekart/products/steering-control
 *
 * Usage:
 *   node src/seeders/mergeRestorePreviousProductImages.js --dry-run
 *   node src/seeders/mergeRestorePreviousProductImages.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { cloudinary, configured } = require('../config/cloudinary');
const { notDeleted } = require('../utils/audit');

const OLD_PREFIXES = [
  'marinekart/products/ss-fittings',
  'marinekart/products/electrical-accessories',
  'marinekart/products/steering-control',
];

const PLACEHOLDER_RE = /product-placeholder|specification-placeholder/i;

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

function parsePublicIdKey(publicId) {
  const base = String(publicId || '').split('/').pop() || '';
  // MK-004-01-main, MK-004-01-td1, MK11206-BRASS-main
  const key = base.replace(/-(main|td\d+)$/i, '');
  const slot = (base.match(/-(main|td\d+)$/i) || [])[1] || 'main';
  return { key, slot: slot.toLowerCase(), publicId: String(publicId) };
}

function slotOrder(slot) {
  if (slot === 'main') return 0;
  const n = Number(String(slot).replace(/^td/i, '')) || 99;
  return n;
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

async function listAllResources(prefix) {
  const all = [];
  let nextCursor;
  do {
    const res = await cloudinary.api.resources({
      type: 'upload',
      prefix,
      max_results: 500,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    });
    all.push(...(res.resources || []));
    nextCursor = res.next_cursor;
  } while (nextCursor);
  return all;
}

function isPlaceholder(url) {
  return !url || PLACEHOLDER_RE.test(String(url));
}

function mergeUnique(primary, secondary) {
  const seen = new Set();
  const urls = [];
  const publicIds = [];

  const push = (url, publicId) => {
    if (!url || isPlaceholder(url)) return;
    const key = publicId || url;
    if (seen.has(key) || seen.has(url)) return;
    seen.add(key);
    seen.add(url);
    urls.push(url);
    publicIds.push(publicId || '');
  };

  for (const item of primary) push(item.url, item.publicId);
  for (const item of secondary) push(item.url, item.publicId);

  return { urls, publicIds };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  if (!configured) throw new Error('Cloudinary not configured');

  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({ ...notDeleted }).select(
    '_id productId name images imagePublicIds'
  );
  console.log(`Products in DB: ${products.length}`);
  console.log(dryRun ? 'DRY RUN — no DB writes\n' : 'LIVE — will update products\n');

  const index = buildProductIndex(products);
  /** productId string → [{url, publicId, slot}] */
  const oldByProduct = new Map();

  for (const prefix of OLD_PREFIXES) {
    console.log(`Listing Cloudinary: ${prefix} …`);
    const resources = await listAllResources(prefix);
    console.log(`  found ${resources.length} assets`);

    // Group by image key, sort main then td1..
    const byKey = new Map();
    for (const r of resources) {
      const { key, slot, publicId } = parsePublicIdKey(r.public_id);
      if (!key) continue;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push({
        url: r.secure_url,
        publicId,
        slot,
      });
    }

    for (const [key, items] of byKey) {
      items.sort((a, b) => slotOrder(a.slot) - slotOrder(b.slot));
      const targets = findProductsForKey(key, index);
      if (!targets.length) continue;

      for (const p of targets) {
        const id = String(p._id);
        const prev = oldByProduct.get(id) || [];
        // Prefer richer gallery if multiple keys match
        if (items.length >= prev.length) {
          oldByProduct.set(id, items);
        }
      }
    }
  }

  console.log(`\nProducts with recoverable old images: ${oldByProduct.size}`);

  let updated = 0;
  let unchanged = 0;
  let samples = 0;

  for (const product of products) {
    const id = String(product._id);
    const oldItems = oldByProduct.get(id);
    if (!oldItems?.length) {
      unchanged += 1;
      continue;
    }

    const currentItems = (product.images || [])
      .map((url, i) => ({
        url,
        publicId: (product.imagePublicIds || [])[i] || '',
      }))
      .filter((x) => !isPlaceholder(x.url));

    // Old restored first, then keep current (new MARINEKART) images
    const merged = mergeUnique(oldItems, currentItems);

    const same =
      merged.urls.length === currentItems.length &&
      merged.urls.every((u, i) => u === currentItems[i]?.url);

    if (same) {
      unchanged += 1;
      continue;
    }

    if (samples < 12) {
      console.log(
        `  ${product.productId || product.name}: ${currentItems.length} → ${merged.urls.length} images`
      );
      samples += 1;
    }

    if (!dryRun) {
      product.images = merged.urls;
      product.imagePublicIds = merged.publicIds;
      await product.save();
    }
    updated += 1;
  }

  console.log(
    `\nDone.\n` +
      `  Products merged (old + current): ${updated}\n` +
      `  Products unchanged: ${unchanged}\n` +
      (dryRun ? '  (dry run — re-run without --dry-run to apply)\n' : '')
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
