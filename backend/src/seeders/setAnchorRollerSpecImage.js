/**
 * Set a dummy specification image on all products under
 * Category: SS FIITINGS 316 / Subcategory: ANCHOR ROLLER
 * Does NOT change product gallery images.
 *
 * Usage: node src/seeders/setAnchorRollerSpecImage.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Product = require('../models/Product');

const DUMMY_SPEC_IMAGE = '/images/product-specification-placeholder.webp';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected');

  const category = await Category.findOne({ name: 'SS FIITINGS 316' }).select('_id name');
  if (!category) {
    console.error('Category SS FIITINGS 316 not found.');
    process.exit(1);
  }

  const subcategory = await Subcategory.findOne({
    category: category._id,
    name: 'ANCHOR ROLLER',
  }).select('_id name');
  if (!subcategory) {
    console.error('Subcategory ANCHOR ROLLER not found.');
    process.exit(1);
  }

  const filter = {
    category: category._id,
    subcategory: subcategory._id,
    isDeleted: { $ne: true },
  };

  const result = await Product.updateMany(filter, {
    $set: {
      specifications: {
        mode: 'image',
        markdown: '',
        image: DUMMY_SPEC_IMAGE,
      },
    },
  });

  console.log(
    `Updated specifications only on ${result.modifiedCount} product(s). Gallery images untouched.`
  );
  await mongoose.disconnect();
  console.log('Done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
