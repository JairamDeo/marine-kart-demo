/**
 * Fix gallery order after Steering Catalog (Technical Diagram) upload:
 * - Keep every image (never delete)
 * - Real product photos first (main)
 * - Technical Features / length-specific diagrams last (secondary)
 *
 * Special case: MKTMS-1.3.png was a product photo stored in the diagram folder
 * (Cloudinary: .../MKTMS-1.3-diagram). Promote those ahead of length-specific
 * .../MKTMS-1.3-06-diagram Technical Features sheets.
 *
 * Usage (from backend/):
 *   node src/seeders/fixSteeringDiagramMainImages.js --dry-run
 *   node src/seeders/fixSteeringDiagramMainImages.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { notDeleted } = require('../utils/audit');

function leafPublicId(url, publicId) {
  const raw = String(publicId || url || '');
  const noQuery = raw.split('?')[0];
  const leaf = noQuery.split('/').pop() || '';
  return leaf.replace(/\.(webp|png|jpe?g|gif)$/i, '');
}

/**
 * True technical diagram from that upload
 * (e.g. MKMS-1.2-06-diagram, MKTMS-1.3-14-diagram, MMHS-150-diagram).
 * Not the family product shot MKTMS-1.3-diagram.
 */
function isLengthSpecificDiagram(url, publicId) {
  const s = `${url || ''} ${publicId || ''}`;
  if (!/steering-technical-diagrams/i.test(s)) return false;

  const leaf = leafPublicId(url, publicId);
  if (!/-diagram$/i.test(leaf)) return true;

  const base = leaf.replace(/-diagram$/i, '');
  // Trailing integer segment (06, 150) — not a decimal family id like 1.3
  return /-\d+$/.test(base) && !/\d+\.\d+$/.test(base);
}

/** Product photo that was uploaded into the technical-diagrams folder (e.g. MKTMS-1.3-diagram). */
function isDiagramFolderProductPhoto(url, publicId) {
  const s = `${url || ''} ${publicId || ''}`;
  if (!/steering-technical-diagrams/i.test(s)) return false;
  return !isLengthSpecificDiagram(url, publicId);
}

function rankPair(url, publicId) {
  if (isLengthSpecificDiagram(url, publicId)) return 2; // secondary tech sheets
  if (isDiagramFolderProductPhoto(url, publicId)) return 1; // photo wrongly in diagram folder
  return 0; // normal product photos (steering-control, etc.)
}

function reorderGallery(images, publicIds) {
  const imgs = Array.isArray(images)
    ? images.map((u) => String(u || '').trim()).filter(Boolean)
    : [];
  const ids = Array.isArray(publicIds)
    ? publicIds.map((id) => String(id || '').trim())
    : [];

  const pairs = imgs.map((url, i) => ({
    url,
    publicId: ids[i] || '',
    rank: rankPair(url, ids[i] || ''),
    index: i,
  }));

  const hasTechSheet = pairs.some((p) => p.rank === 2);
  const hasPhoto = pairs.some((p) => p.rank < 2);
  if (!hasTechSheet || !hasPhoto) {
    return { changed: false, images: imgs, publicIds: ids.slice(0, imgs.length) };
  }

  // Stable sort: photos (0) → diagram-folder photos (1) → tech sheets (2)
  const sorted = [...pairs].sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.index - b.index;
  });

  const same = sorted.every((p, i) => p.index === pairs[i].index);
  if (same) {
    return { changed: false, images: imgs, publicIds: ids.slice(0, imgs.length) };
  }

  return {
    changed: true,
    images: sorted.map((p) => p.url),
    publicIds: sorted.map((p) => p.publicId),
    from: pairs.map((p) => p.rank).join(''),
    to: sorted.map((p) => p.rank).join(''),
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');

  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({ ...notDeleted }).select(
    '_id productId name images imagePublicIds'
  );

  let scanned = 0;
  let fixed = 0;
  let alreadyOk = 0;

  for (const product of products) {
    scanned += 1;
    const result = reorderGallery(product.images, product.imagePublicIds);
    if (!result.changed) {
      const hasTech = (product.images || []).some((u, i) =>
        isLengthSpecificDiagram(u, (product.imagePublicIds || [])[i])
      );
      if (hasTech) alreadyOk += 1;
      continue;
    }

    console.log(
      `  ${dryRun ? '[dry] ' : ''}${product.productId || product.name}: ` +
        `order ${result.from} → ${result.to} (0=photo,1=folder-photo,2=tech sheet)`
    );

    if (!dryRun) {
      product.images = result.images;
      product.imagePublicIds = result.publicIds;
      await product.save();
    }
    fixed += 1;
  }

  console.log(
    `\nDone${dryRun ? ' (dry run)' : ''}.\n` +
      `  Scanned: ${scanned}\n` +
      `  Fixed (tech sheet moved off main): ${fixed}\n` +
      `  Already OK: ${alreadyOk}`
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
