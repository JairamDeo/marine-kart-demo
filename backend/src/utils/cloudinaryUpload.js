const multer = require('multer');
const sharp = require('sharp');
const streamifier = require('streamifier');
const { cloudinary, configured, resolveFolder } = require('../config/cloudinary');

/** Max upload size before conversion (1 MB) */
const MAX_UPLOAD_BYTES = 1 * 1024 * 1024;

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }
    return cb(null, true);
  },
});

/**
 * Convert image buffer to WebP without quality loss (lossless).
 * No resizing / no aggressive compression — keep visual fidelity.
 */
async function convertToWebpAsIs(buffer) {
  return sharp(buffer, { failOn: 'none' })
    .rotate()
    .webp({
      lossless: true,
      effort: 4,
      alphaQuality: 100,
    })
    .toBuffer();
}

/**
 * Upload a buffer to Cloudinary as WebP (already converted).
 * No Cloudinary compression / transformation — store as-is.
 */
async function uploadBuffer(buffer, { section = 'other', publicId, folder, skipSizeLimit = false } = {}) {
  if (!configured) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in backend/.env'
    );
  }

  if (!buffer || !buffer.length) {
    throw new Error('Empty image file.');
  }

  if (!skipSizeLimit && buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error('Image must be 1MB or smaller.');
  }

  // High-fidelity WebP (lossless) — no resize / no quality crush
  const webpBuffer = await convertToWebpAsIs(buffer);
  const targetFolder = folder || resolveFolder(section);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: targetFolder,
        resource_type: 'image',
        format: 'webp',
        overwrite: true,
        unique_filename: !publicId,
        ...(publicId ? { public_id: publicId } : {}),
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
          folder: result.folder || targetFolder,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );
    streamifier.createReadStream(webpBuffer).pipe(stream);
  });
}

async function destroyImage(publicId) {
  if (!configured || !publicId) return null;
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

const uploadSingle = (field = 'image') => memoryUpload.single(field);
const uploadMany = (field = 'images', max = 5) => memoryUpload.array(field, max);

module.exports = {
  MAX_UPLOAD_BYTES,
  convertToWebpAsIs,
  uploadBuffer,
  destroyImage,
  uploadSingle,
  uploadMany,
  memoryUpload,
};
