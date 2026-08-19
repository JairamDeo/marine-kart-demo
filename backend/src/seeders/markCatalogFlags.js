/**
 * Mark existing products as Best Seller / Featured / New Arrival.
 * Does not create products. Usage: node src/seeders/markCatalogFlags.js
 */
require('dotenv').config();
const connectDB = require('../config/db');
const Product = require('../models/Product');
const { notDeleted } = require('../utils/audit');

const TARGET = 25;

function pickUnique(pool, usedIds, need) {
  const picks = [];
  const byCat = new Map();
  for (const p of pool) {
    if (usedIds.has(String(p._id))) continue;
    const key = String(p.category || 'none');
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key).push(p);
  }

  const queues = [...byCat.values()];
  let i = 0;
  while (picks.length < need && queues.some((q) => q.length)) {
    const q = queues[i % queues.length];
    i += 1;
    if (!q.length) continue;
    picks.push(q.shift());
  }

  return picks;
}

async function main() {
  await connectDB();

  const filter = { isActive: true, ...notDeleted };
  const products = await Product.find(filter)
    .select('_id name productId category images isBestSeller isFeatured isNewArrival')
    .sort({ createdAt: -1 })
    .lean();

  console.log('Active products:', products.length);

  const withImages = products.filter((p) => Array.isArray(p.images) && p.images.length);
  const pool = withImages.length >= TARGET * 3 ? withImages : products;

  const used = new Set();
  for (const p of products) {
    if (p.isBestSeller || p.isFeatured || p.isNewArrival) used.add(String(p._id));
  }

  const fields = [
    ['isBestSeller', products.filter((p) => p.isBestSeller)],
    ['isFeatured', products.filter((p) => p.isFeatured)],
    ['isNewArrival', products.filter((p) => p.isNewArrival)],
  ];

  console.log('Before:', {
    isBestSeller: fields[0][1].length,
    isFeatured: fields[1][1].length,
    isNewArrival: fields[2][1].length,
  });

  for (const [field, already] of fields) {
    const need = Math.max(0, TARGET - already.length);
    if (!need) {
      console.log(`${field}: already ${already.length}, skip`);
      continue;
    }
    const picks = pickUnique(pool, used, need);
    if (picks.length < need) {
      throw new Error(`${field}: only picked ${picks.length} of ${need}`);
    }
    await Product.updateMany(
      { _id: { $in: picks.map((p) => p._id) } },
      { $set: { [field]: true } }
    );
    picks.forEach((p) => used.add(String(p._id)));
    console.log(`${field}: added ${picks.length} (now ${already.length + picks.length})`);
  }

  const after = await Product.aggregate([
    { $match: { isActive: true, isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        best: { $sum: { $cond: ['$isBestSeller', 1, 0] } },
        featured: { $sum: { $cond: ['$isFeatured', 1, 0] } },
        neu: { $sum: { $cond: ['$isNewArrival', 1, 0] } },
      },
    },
  ]);
  console.log('After:', after[0]);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
