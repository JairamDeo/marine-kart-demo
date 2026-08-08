const Category = require('../models/Category');

/**
 * Auto category/subcategory code:
 * cat-mm/yy-0001  (main category)
 * sub-mm/yy-0001  (subcategory)
 */
async function generateCategoryCode(kind = 'cat') {
  const prefixKind = kind === 'sub' ? 'sub' : 'cat';
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const prefix = `${prefixKind}-${mm}/${yy}-`;
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const latest = await Category.findOne({ code: new RegExp(`^${escaped}`) })
    .sort({ code: -1 })
    .select('code')
    .lean();

  let seq = 1;
  if (latest?.code) {
    const n = parseInt(latest.code.slice(prefix.length), 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

module.exports = { generateCategoryCode };
