/**
 * Restore Anchor Roller gallery images from saved Cloudinary public IDs.
 * Keeps dummy specification image only on specifications (does not overwrite gallery).
 *
 * Usage: node src/seeders/restoreAnchorRollerImages.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Product = require('../models/Product');
const { cloudinary, configured } = require('../config/cloudinary');

const DUMMY_SPEC_IMAGE = '/images/product-specification-placeholder.webp';

function urlFromPublicId(publicId) {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: 'image',
    // Serve stored file as-is (no transform)
    fetch_format: 'auto',
  });
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }
  if (!configured) {
    console.error('Cloudinary is not configured');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  const category = await Category.findOne({ name: 'SS FIITINGS 316' });
  const subcategory = await Subcategory.findOne({
    category: category._id,
    name: 'ANCHOR ROLLER',
  });

  const products = await Product.find({
    category: category._id,
    subcategory: subcategory._id,
    isDeleted: { $ne: true },
  });

  console.log(`Restoring ${products.length} product(s)…`);

  let ok = 0;
  for (const product of products) {
    const ids = Array.isArray(product.imagePublicIds)
      ? product.imagePublicIds.filter(Boolean)
      : [];

    if (!ids.length) {
      console.warn(`  ! ${product.productId}: no imagePublicIds — skipped gallery restore`);
    } else {
      product.images = ids.map(urlFromPublicId);
      console.log(`  ✓ ${product.productId}: restored ${product.images.length} image(s)`);
    }

    // Spec image stays optional dummy — never touches gallery
    product.specifications = {
      mode: 'image',
      markdown: '',
      image: DUMMY_SPEC_IMAGE,
    };

    await product.save();
    ok += 1;
  }

  console.log(`Done. Restored ${ok} product(s).`);
  await mongoose.disconnect();
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
