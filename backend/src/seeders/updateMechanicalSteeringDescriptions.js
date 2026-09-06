/**
 * Update product descriptions from:
 *   Marinekart Mechanical Steering (Mechanical Kit).xlsx
 *
 * Matches by Part No. → productId (or name). Updates description + shortDescription only.
 *
 * Usage (from backend/):
 *   node src/seeders/updateMechanicalSteeringDescriptions.js
 */
require('dotenv').config();
const path = require('path');
const XLSX = require('xlsx');
const connectDB = require('../config/db');
const Product = require('../models/Product');

const EXCEL_PATH = path.join(
  __dirname,
  '../../../Marinekart Mechanical Steering (Mechanical Kit).xlsx'
);

function normalizeId(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function readPartDescriptions() {
  const wb = XLSX.readFile(EXCEL_PATH);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const out = [];
  for (const row of rows) {
    const partNo = String(row[1] || '').trim();
    const description = String(row[2] || '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!partNo || !description) continue;
    if (/^part\s*no\.?$/i.test(partNo)) continue;
    // Skip section titles that have no real part number pattern
    if (!/^[A-Z0-9][A-Z0-9._-]+$/i.test(partNo)) continue;

    out.push({
      productId: partNo,
      description,
    });
  }
  return out;
}

async function run() {
  await connectDB();
  const rows = readPartDescriptions();
  console.log(`Excel rows with part + description: ${rows.length}`);

  let updated = 0;
  let missing = 0;
  const missingIds = [];

  for (const row of rows) {
    const idNorm = normalizeId(row.productId);
    // Match productId or name (catalog often stores part number in both)
    const product = await Product.findOne({
      $or: [
        { productId: row.productId },
        { productId: new RegExp(`^${row.productId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        { name: row.productId },
        { name: new RegExp(`^${row.productId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ],
    }).select('_id productId name description shortDescription');

    if (!product) {
      missing += 1;
      missingIds.push(row.productId);
      console.warn(`  ! not found: ${row.productId}`);
      continue;
    }

    product.description = row.description;
    product.shortDescription = row.description;
    await product.save();
    updated += 1;
    console.log(`  ✓ ${product.productId || product.name} ← updated`);
  }

  console.log('\nDone.');
  console.log(`  Updated: ${updated}`);
  console.log(`  Not found: ${missing}`);
  if (missingIds.length) {
    console.log(`  Missing part numbers:\n    ${missingIds.join('\n    ')}`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
