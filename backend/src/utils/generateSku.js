const Product = require('../models/Product');

/**
 * Auto product code: prd-mm/yy-0001
 * Example: prd-08/26-0001
 */
async function generateProductSku(session) {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const prefix = `prd-${mm}/${yy}-`;
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const query = Product.findOne({ sku: new RegExp(`^${escaped}`) })
    .sort({ sku: -1 })
    .select('sku')
    .lean();
  if (session) query.session(session);

  const latest = await query;
  let seq = 1;
  if (latest?.sku) {
    const tail = latest.sku.slice(prefix.length);
    const n = parseInt(tail, 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

module.exports = { generateProductSku };
