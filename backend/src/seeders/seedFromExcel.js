/**
 * Wipe categories / subcategories / products and seed from DATA FOR PRODUCTS.xlsx.
 *
 * - 6 categories from sheet (exact names)
 * - Subcategories mapped under each category
 * - Products: productId, description, category, subcategory
 * - price / salePrice / specs / maxQty / featured flags left empty (defaults)
 * - isActive: true
 * - Shared placeholder image: /images/product-placeholder.webp
 *
 * Usage: npm run seed:excel
 */
require('dotenv').config();
const path = require('path');
const XLSX = require('xlsx');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Product = require('../models/Product');
const { slugify } = require('../utils/helpers');
const { generateCategoryCode } = require('../utils/generateCategoryCode');

const EXCEL_PATH = path.join(__dirname, '../../../DATA FOR PRODUCTS.xlsx');
const PLACEHOLDER = '/images/product-placeholder.webp';

/** Preferred category sort order (matches catalog lines) */
const CATEGORY_ORDER = [
  'SS FIITINGS 316',
  'Engine Control Cables & Levers',
  'Steering Wheel',
  'Mechanical Steering',
  'Hydraulic Steering',
  'ELECTRICAL ACCESSORIES',
];

function readExcelRows() {
  const wb = XLSX.readFile(EXCEL_PATH);
  const rows = [];
  for (const sheetName of wb.SheetNames) {
    const sheetRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
    for (const r of sheetRows) {
      const productId = String(r['Product Id'] || '').trim();
      const category = String(r.Category || '').trim();
      const subcategory = String(r['Sub-Category'] || '').trim();
      const description = String(r['Product Description'] || '').trim();
      if (!productId || !category) continue;
      rows.push({ productId, category, subcategory, description });
    }
  }
  return rows;
}

async function main() {
  await connectDB();

  const rows = readExcelRows();
  if (!rows.length) {
    throw new Error(`No product rows found in ${EXCEL_PATH}`);
  }

  console.log(`Read ${rows.length} products from Excel`);
  console.log('Clearing categories, subcategories & products...');
  await Product.deleteMany({});
  await Subcategory.deleteMany({});
  await Category.deleteMany({});

  const categoryNames = [...new Set(rows.map((r) => r.category))];
  categoryNames.sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.localeCompare(b);
  });

  if (categoryNames.length !== 6) {
    console.warn(`Expected 6 categories, found ${categoryNames.length}:`, categoryNames);
  }

  const parents = {};
  for (let i = 0; i < categoryNames.length; i++) {
    const name = categoryNames[i];
    const code = await generateCategoryCode('cat');
    parents[name] = await Category.create({
      name,
      code,
      slug: slugify(name),
      sortOrder: i + 1,
      description: '',
      image: PLACEHOLDER,
      isActive: true,
    });
  }

  const subMap = {};
  const subsByCat = {};
  for (const r of rows) {
    if (!r.subcategory) continue;
    if (!subsByCat[r.category]) subsByCat[r.category] = new Set();
    subsByCat[r.category].add(r.subcategory);
  }

  let subCount = 0;
  for (const catName of categoryNames) {
    const subs = [...(subsByCat[catName] || [])];
    for (let j = 0; j < subs.length; j++) {
      const subName = subs[j];
      const key = `${catName}::${subName}`;
      const subCode = await generateCategoryCode('sub');
      subMap[key] = await Subcategory.create({
        name: subName,
        code: subCode,
        slug: slugify(`${catName}-${subName}`),
        category: parents[catName]._id,
        sortOrder: j + 1,
        description: '',
        image: PLACEHOLDER,
        isActive: true,
      });
      subCount += 1;
    }
  }

  console.log(`Categories: ${categoryNames.length}, Subcategories: ${subCount}`);
  console.log('Creating products...');

  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const skuPrefix = `prd-${mm}/${yy}-`;
  let skuSeq = 1;

  const products = [];
  const seenSlugs = new Set();

  for (const r of rows) {
    const catDoc = parents[r.category];
    const subDoc = r.subcategory ? subMap[`${r.category}::${r.subcategory}`] : null;
    if (!catDoc) {
      console.warn('Skip — missing category', r.productId, r.category);
      continue;
    }

    const sku = `${skuPrefix}${String(skuSeq).padStart(4, '0')}`;
    skuSeq += 1;
    let baseSlug = slugify(`${r.productId}-${sku.replace(/[^a-zA-Z0-9]+/g, '-')}`);
    let slug = baseSlug;
    let n = 2;
    while (seenSlugs.has(slug)) {
      slug = `${baseSlug}-${n}`;
      n += 1;
    }
    seenSlugs.add(slug);

    products.push({
      productId: r.productId,
      name: r.productId,
      slug,
      sku,
      shortDescription: '',
      description: r.description,
      specifications: { mode: 'none', markdown: '', image: '' },
      maxOrderQty: 0,
      images: [PLACEHOLDER],
      imagePublicIds: [],
      category: catDoc._id,
      subcategory: subDoc ? subDoc._id : null,
      price: 0,
      salePrice: null,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: false,
      relatedProducts: [],
      isActive: true,
    });
  }

  // insert in batches to avoid huge single write
  const BATCH = 200;
  for (let i = 0; i < products.length; i += BATCH) {
    await Product.insertMany(products.slice(i, i + BATCH));
  }

  console.log(
    `Done.\n` +
      `  Categories: ${categoryNames.length}\n` +
      `  Subcategories: ${subCount}\n` +
      `  Products: ${products.length}\n` +
      `  Placeholder: ${PLACEHOLDER}`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
