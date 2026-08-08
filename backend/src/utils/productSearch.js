/**
 * Build an optimized Mongo filter for product search.
 * - Trims + length-caps input
 * - Escapes regex metacharacters
 * - Multi-word AND: every term must match somewhere
 * - Searches name, sku, shortDescription, description
 */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildProductSearchFilter(rawSearch) {
  const q = String(rawSearch || '')
    .trim()
    .slice(0, 80);
  if (!q) return null;

  const terms = q
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 1)
    .slice(0, 6);

  if (!terms.length) return null;

  return {
    $and: terms.map((term) => {
      const rx = new RegExp(escapeRegex(term), 'i');
      return {
        $or: [
          { name: rx },
          { sku: rx },
          { shortDescription: rx },
          { description: rx },
        ],
      };
    }),
  };
}

module.exports = { buildProductSearchFilter, escapeRegex };
