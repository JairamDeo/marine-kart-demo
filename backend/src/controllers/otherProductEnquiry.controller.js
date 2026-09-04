const OtherProductEnquiry = require('../models/OtherProductEnquiry');
const { asyncHandler } = require('../utils/helpers');
const { sendMail, sendMailToAdmins } = require('../utils/mail');
const { adminOtherProductEmail, otherProductThankYouEmail } = require('../utils/emailTemplates');
const { uploadBuffer, uploadMany } = require('../utils/cloudinaryUpload');
const { configured } = require('../config/cloudinary');

const MAX_PRODUCTS = 10;
const MAX_IMAGES_PER_PRODUCT = 3;

function normalizeDeliveryAddress(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const addr = {
    fullName: String(raw.fullName || '').trim(),
    phone: String(raw.phone || '').trim(),
    line1: String(raw.line1 || '').trim(),
    line2: String(raw.line2 || '').trim(),
    city: String(raw.city || '').trim(),
    state: String(raw.state || '').trim(),
    postalCode: String(raw.postalCode || '').trim(),
    country: String(raw.country || 'India').trim() || 'India',
  };
  if (!addr.line1) return null;
  return addr;
}

function formatAddressText(addr) {
  if (!addr) return '';
  return [
    addr.fullName,
    addr.phone,
    addr.line1,
    addr.line2,
    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(', '),
    addr.country,
  ]
    .filter(Boolean)
    .join('\n');
}

function normalizeProducts(raw) {
  const list = Array.isArray(raw) ? raw : [];
  return list
    .slice(0, MAX_PRODUCTS)
    .map((row) => {
      const productName = String(row?.productName || row?.name || '').trim();
      const brand = String(row?.brand || '').trim();
      const modelSku = String(row?.modelSku || row?.sku || '').trim();
      const specification = String(row?.specification || row?.description || '').trim();
      const quantity = Math.max(1, Math.floor(Number(row?.quantity) || 1));
      const images = Array.isArray(row?.images)
        ? row.images.map((u) => String(u || '').trim()).filter(Boolean).slice(0, MAX_IMAGES_PER_PRODUCT)
        : [];
      const imagePublicIds = Array.isArray(row?.imagePublicIds)
        ? row.imagePublicIds
            .map((u) => String(u || '').trim())
            .filter(Boolean)
            .slice(0, MAX_IMAGES_PER_PRODUCT)
        : [];
      return { productName, brand, modelSku, specification, quantity, images, imagePublicIds };
    })
    .filter((p) => p.productName && p.specification);
}

exports.createEnquiry = asyncHandler(async (req, res) => {
  let products = normalizeProducts(req.body.products);

  // Legacy single-product payload
  if (!products.length) {
    const productName = String(req.body.productName || '').trim();
    const specification = String(
      req.body.specification || req.body.description || ''
    ).trim();
    if (productName && specification) {
      products = [
        {
          productName,
          brand: String(req.body.brand || '').trim(),
          modelSku: String(req.body.modelSku || '').trim(),
          specification,
          quantity: Math.max(1, Math.floor(Number(req.body.quantity) || 1)),
          images: Array.isArray(req.body.images)
            ? req.body.images.map((u) => String(u || '').trim()).filter(Boolean).slice(0, 5)
            : [],
          imagePublicIds: Array.isArray(req.body.imagePublicIds)
            ? req.body.imagePublicIds
                .map((u) => String(u || '').trim())
                .filter(Boolean)
                .slice(0, 5)
            : [],
        },
      ];
    }
  }

  const deliveryAddress =
    normalizeDeliveryAddress(req.body.deliveryAddress || req.body.billingAddress) ||
    normalizeDeliveryAddress(req.body.address);
  const address =
    formatAddressText(deliveryAddress) || String(req.body.address || '').trim();

  if (!products.length) {
    return res.status(400).json({
      success: false,
      message: 'Add at least one product with name and specification.',
    });
  }
  if (!address) {
    return res.status(400).json({ success: false, message: 'Delivery address is required.' });
  }

  const allImages = products.flatMap((p) => p.images);
  const allPublicIds = products.flatMap((p) => p.imagePublicIds);
  const summaryName =
    products.length === 1
      ? products[0].productName
      : `${products[0].productName} (+${products.length - 1} more)`;
  const totalQty = products.reduce((s, p) => s + p.quantity, 0);
  const summarySpec = products
    .map((p, i) => `${i + 1}. ${p.productName} — ${p.specification}`)
    .join('\n');

  const enquiry = await OtherProductEnquiry.create({
    user: req.user._id,
    products,
    productName: summaryName,
    description: summarySpec,
    quantity: totalQty,
    address,
    deliveryAddress: deliveryAddress || undefined,
    images: allImages,
    imagePublicIds: allPublicIds,
    status: 'new',
  });

  await enquiry.populate('user', 'firstName lastName email phone companyName role');

  const customerName =
    `${enquiry.user?.firstName || ''} ${enquiry.user?.lastName || ''}`.trim() ||
    enquiry.user?.companyName ||
    'Customer';

  const when = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  setImmediate(async () => {
    try {
      const mailPayload = {
        customerName,
        email: enquiry.user?.email || '',
        phone: deliveryAddress?.phone || enquiry.user?.phone || '',
        productName: summaryName,
        products,
        address,
        deliveryAddress,
        imageCount: allImages.length,
        when,
      };
      await sendMailToAdmins(adminOtherProductEmail(mailPayload));
      if (enquiry.user?.email) {
        await sendMail({
          to: enquiry.user.email,
          ...otherProductThankYouEmail({ name: customerName, productName: summaryName }),
        });
      }
    } catch (err) {
      console.error('[other-product] email failed:', err.message);
    }
  });

  res.status(201).json({
    success: true,
    message: 'Your enquiry has been submitted. Our team will contact you soon.',
    data: { enquiry },
  });
});

exports.uploadEnquiryImages = asyncHandler(async (req, res) => {
  if (!configured) {
    return res.status(503).json({
      success: false,
      message: 'Image upload is not available right now. Please try again later.',
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
    const result = await uploadBuffer(file.buffer, { section: 'enquiries' });
    uploaded.push(result);
  }

  res.status(201).json({
    success: true,
    data: {
      images: uploaded,
      url: uploaded[0]?.url,
    },
  });
});

exports.adminListEnquiries = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const status = String(req.query.status || '').trim();
  const filter = {};
  if (['new', 'read', 'closed'].includes(status)) filter.status = status;

  const [items, total] = await Promise.all([
    OtherProductEnquiry.find(filter)
      .populate('user', 'firstName lastName email phone companyName role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    OtherProductEnquiry.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      enquiries: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    },
  });
});

exports.adminGetEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await OtherProductEnquiry.findById(req.params.id)
    .populate('user', 'firstName lastName email phone companyName role')
    .lean();
  if (!enquiry) {
    return res.status(404).json({ success: false, message: 'Enquiry not found.' });
  }
  res.json({ success: true, data: { enquiry } });
});

exports.adminUpdateEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await OtherProductEnquiry.findById(req.params.id);
  if (!enquiry) {
    return res.status(404).json({ success: false, message: 'Enquiry not found.' });
  }
  if (req.body.status && ['new', 'read', 'closed'].includes(req.body.status)) {
    enquiry.status = req.body.status;
  }
  await enquiry.save();
  await enquiry.populate('user', 'firstName lastName email phone companyName role');
  res.json({ success: true, data: { enquiry } });
});

exports.uploadManyMw = uploadMany('images', 15);
