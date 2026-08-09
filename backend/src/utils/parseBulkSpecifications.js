const { sanitizeSpecificationsInput } = require('../models/Product');

/**
 * Parse bulk/CSV specifications into { mode, markdown, image }.
 * - Free markdown text in "specifications"
 * - Optional image URL in specificationImage / specImage / specification_image
 * - Legacy pipe format Part Number:X|Step:Y → markdown bullets
 */
function parseBulkSpecifications(rawSpecs, rawImage) {
  const image = String(
    rawImage || ''
  ).trim();

  if (image) {
    return sanitizeSpecificationsInput({ mode: 'image', image, markdown: '' });
  }

  if (rawSpecs == null || rawSpecs === '') {
    return sanitizeSpecificationsInput({ mode: 'none' });
  }

  if (typeof rawSpecs === 'object' && !Array.isArray(rawSpecs)) {
    return sanitizeSpecificationsInput(rawSpecs);
  }

  if (Array.isArray(rawSpecs)) {
    return sanitizeSpecificationsInput(rawSpecs);
  }

  const text = String(rawSpecs).trim();
  if (!text) return sanitizeSpecificationsInput({ mode: 'none' });

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      return sanitizeSpecificationsInput(parsed);
    }
  } catch {
    /* not JSON */
  }

  // Legacy pipe: Key:Value|Key:Value
  if (text.includes('|') && text.includes(':')) {
    const rows = text
      .split('|')
      .map((pair) => {
        const idx = pair.indexOf(':');
        if (idx < 0) return null;
        return {
          key: pair.slice(0, idx).trim(),
          value: pair.slice(idx + 1).trim(),
        };
      })
      .filter(Boolean)
      .filter((s) => s.key);
    if (rows.length) return sanitizeSpecificationsInput(rows);
  }

  return sanitizeSpecificationsInput({ mode: 'markdown', markdown: text });
}

module.exports = { parseBulkSpecifications };
