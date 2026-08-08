const { asyncHandler } = require('../utils/helpers');
const { uploadBuffer, uploadSingle, uploadMany } = require('../utils/cloudinaryUpload');
const { configured, FOLDERS, resolveFolder } = require('../config/cloudinary');

const ALLOWED = new Set(Object.keys(FOLDERS));

/**
 * POST /api/admin/uploads
 * multipart: image (or images[]) + section=products|categories|accounts|banners|other
 */
exports.uploadImages = asyncHandler(async (req, res) => {
  if (!configured) {
    return res.status(503).json({
      success: false,
      message:
        'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to backend/.env',
    });
  }

  const section = String(req.body.section || req.query.section || 'other').toLowerCase();
  if (!ALLOWED.has(section)) {
    return res.status(400).json({
      success: false,
      message: `Invalid section. Use one of: ${[...ALLOWED].join(', ')}`,
    });
  }

  const files = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...req.files);

  if (!files.length) {
    return res.status(400).json({ success: false, message: 'No image file uploaded.' });
  }

  const uploaded = [];
  for (const file of files) {
    const result = await uploadBuffer(file.buffer, { section });
    uploaded.push(result);
  }

  res.status(201).json({
    success: true,
    data: {
      folder: resolveFolder(section),
      images: uploaded,
      url: uploaded[0]?.url,
    },
  });
});

exports.uploadSingleMw = uploadSingle('image');
exports.uploadManyMw = uploadMany('images', 5);
