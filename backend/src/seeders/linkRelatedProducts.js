/**
 * Ensure Engine Control Lever Twin exists with related products.
 * Usage: node src/seeders/linkRelatedProducts.js
 */
require('dotenv').config();
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const { generateProductSku } = require('../utils/generateSku');
const { notDeleted } = require('../utils/audit');

const PREVIEW = 'https://placehold.co/600x600/e5e7eb/111111?text=154x154';

async function main() {
  await connectDB();

  const cat = await Category.findOne({ name: /Engine Control/i, ...notDeleted });
  const sub = await Subcategory.findOne({ name: /Engine Control Levers/i, ...notDeleted });
  if (!cat || !sub) {
    throw new Error('Engine Control category/subcategory not found. Run npm run seed:catalog first.');
  }

  const peers = await Product.find({
    subcategory: sub._id,
    isActive: true,
    ...notDeleted,
  })
    .select('_id slug name')
    .limit(12);

  let product = await Product.findOne({ slug: 'engine-control-lever-twin' });
  const relatedIds = peers
    .filter((p) => String(p.slug) !== 'engine-control-lever-twin')
    .slice(0, 6)
    .map((p) => p._id);

  if (!product) {
    const sku = await generateProductSku();
    product = await Product.create({
      name: 'Engine Control Lever Twin',
      slug: 'engine-control-lever-twin',
      sku,
      shortDescription: 'Twin-engine control lever',
      description:
        'Twin-engine control lever with side mount for outboard applications. Browse related control levers and cables below.',
      category: cat._id,
      subcategory: sub._id,
      price: 14500,
      images: [PREVIEW],
      maxOrderQty: 2,
      isFeatured: true,
      isBestSeller: true,
      isActive: true,
      relatedProducts: relatedIds,
      specifications: {
        mode: 'markdown',
        markdown:
          '**Product Id:** ECL-TWIN\n\n**Type:** Twin engine control lever\n\n- Side mount\n- Outboard compatible',
        image: '',
      },
    });
    console.log('Created engine-control-lever-twin with', relatedIds.length, 'related');
  } else {
    product.relatedProducts = relatedIds;
    product.category = cat._id;
    product.subcategory = sub._id;
    product.isActive = true;
    product.isDeleted = false;
    await product.save();
    console.log('Updated engine-control-lever-twin with', relatedIds.length, 'related');
  }

  // Link related within the subcategory (including twin)
  const all = await Product.find({
    subcategory: sub._id,
    isActive: true,
    ...notDeleted,
  }).select('_id');

  for (const p of all) {
    const others = all.filter((x) => String(x._id) !== String(p._id)).slice(0, 6).map((x) => x._id);
    await Product.updateOne({ _id: p._id }, { $set: { relatedProducts: others } });
  }

  console.log('Linked related products for', all.length, 'engine control levers');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
