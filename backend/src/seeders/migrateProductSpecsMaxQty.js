/**
 * Backfill existing products with specifications + maxOrderQty.
 *
 * Usage: node src/seeders/migrateProductSpecsMaxQty.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const DEFAULT_MAX_QTY = 5;

function rowsToSpec(rows) {
  return {
    mode: 'markdown',
    markdown: rows.map((s) => `**${s.key}:** ${s.value}`).join('\n\n'),
    image: '',
  };
}

function specsForProduct(product) {
  const name = String(product.name || '');
  const sku = String(product.sku || '');
  const part = sku || name.split(/\s+/).slice(-1)[0] || 'N/A';

  if (/ladder/i.test(name)) {
    const stepMatch = name.match(/(\d+)\s*step/i);
    const step = stepMatch ? stepMatch[1] : '4';
    return rowsToSpec([
      { key: 'Part Number', value: part.includes('prd-') ? `MK-L${step}042` : part },
      { key: 'Step', value: step },
      { key: 'Length', value: '600mm(23.5")' },
      { key: 'Width', value: '344mm(13.5")' },
      { key: 'Centrum W', value: '255mm(10")' },
    ]);
  }

  if (/steering kit/i.test(name)) {
    const lenMatch = name.match(/(\d+)$/);
    const cable = lenMatch ? `${lenMatch[1]} ft` : '—';
    return rowsToSpec([
      { key: 'Part Number', value: part },
      { key: 'Type', value: 'Mechanical Steering' },
      { key: 'Cable Length', value: cable },
      { key: 'Material', value: 'Marine grade' },
    ]);
  }

  if (/cleat/i.test(name)) {
    const sizeMatch = name.match(/(\d+)\s*inch/i);
    return rowsToSpec([
      { key: 'Part Number', value: part },
      { key: 'Material', value: 'SS 316' },
      { key: 'Size', value: sizeMatch ? `${sizeMatch[1]} inch` : '—' },
      { key: 'Finish', value: 'Polished' },
    ]);
  }

  if (/cable/i.test(name)) {
    const ftMatch = name.match(/(\d+)\s*ft/i);
    return rowsToSpec([
      { key: 'Part Number', value: part },
      { key: 'Length', value: ftMatch ? `${ftMatch[1]} ft` : '—' },
      { key: 'Type', value: 'Push-pull control' },
      { key: 'Fitment', value: 'Universal' },
    ]);
  }

  if (/helm/i.test(name)) {
    return rowsToSpec([
      { key: 'Part Number', value: part },
      { key: 'Type', value: 'Mechanical Helm' },
      { key: 'Mount', value: 'Dash / console' },
      { key: 'Material', value: 'Marine grade alloy' },
    ]);
  }

  if (/hatch/i.test(name)) {
    const mmMatch = name.match(/(\d+)\s*mm/i);
    return rowsToSpec([
      { key: 'Part Number', value: part },
      { key: 'Opening', value: mmMatch ? `${mmMatch[1]}mm` : '—' },
      { key: 'Frame', value: 'SS' },
      { key: 'Seal', value: 'Watertight' },
    ]);
  }

  if (/switch|panel|horn|pump|light|battery/i.test(name)) {
    return rowsToSpec([
      { key: 'Part Number', value: part },
      { key: 'Category', value: 'Electrical' },
      { key: 'Voltage', value: '12V / 24V compatible' },
      { key: 'Use', value: 'Marine' },
    ]);
  }

  return rowsToSpec([
    { key: 'Part Number', value: part },
    { key: 'Brand', value: 'MarineKart' },
    { key: 'Use', value: 'Marine' },
    { key: 'Availability', value: 'In catalog' },
  ]);
}

function maxQtyForProduct(product) {
  const name = String(product.name || '');
  if (/cable|cleat|switch|horn/i.test(name)) return 10;
  if (/ladder|kit|helm|hatch|lever|wheel/i.test(name)) return 3;
  return DEFAULT_MAX_QTY;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI missing');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({ isDeleted: { $ne: true } });
  let specsUpdated = 0;
  let maxUpdated = 0;

  for (const product of products) {
    let changed = false;
    const raw = product.specifications;
    const hasNewSpecs =
      raw &&
      typeof raw === 'object' &&
      !Array.isArray(raw) &&
      ((raw.mode === 'markdown' && raw.markdown) || (raw.mode === 'image' && raw.image));
    const hasLegacyArray = Array.isArray(raw) && raw.length > 0;

    if (!hasNewSpecs) {
      product.specifications = hasLegacyArray
        ? Product.sanitizeSpecificationsInput(raw)
        : specsForProduct(product);
      specsUpdated += 1;
      changed = true;
    }

    const currentMax = Number(product.maxOrderQty);
    if (!Number.isFinite(currentMax) || currentMax <= 0) {
      product.maxOrderQty = maxQtyForProduct(product);
      maxUpdated += 1;
      changed = true;
    }

    if (changed) await product.save();
  }

  console.log(`Products scanned: ${products.length}`);
  console.log(`Specifications filled: ${specsUpdated}`);
  console.log(`maxOrderQty filled: ${maxUpdated}`);
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
