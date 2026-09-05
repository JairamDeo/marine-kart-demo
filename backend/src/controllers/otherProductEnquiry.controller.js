const OtherProductEnquiry = require('../models/OtherProductEnquiry');
const Order = require('../models/Order');
const { asyncHandler, generateOrderNumber } = require('../utils/helpers');
const { stampFromUser, withCreateAudit } = require('../utils/audit');
const { sendMail, sendMailToAdmins } = require('../utils/mail');
const {
  adminOtherProductEmail,
  otherProductThankYouEmail,
  adminNewOrderEmail,
} = require('../utils/emailTemplates');
const { uploadBuffer, uploadMany } = require('../utils/cloudinaryUpload');
const { configured } = require('../config/cloudinary');
const { sendPushToAdmins } = require('../utils/push');
const { formatWhen, customerDisplayName } = require('../utils/orderNotify');

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

function productsFromEnquiry(enquiry) {
  if (Array.isArray(enquiry.products) && enquiry.products.length) {
    return enquiry.products.map((p) => ({
      productName: p.productName,
      brand: p.brand || '',
      modelSku: p.modelSku || '',
      specification: p.specification || '',
      quantity: Math.max(1, Number(p.quantity) || 1),
      images: Array.isArray(p.images) ? p.images : [],
      imagePublicIds: Array.isArray(p.imagePublicIds) ? p.imagePublicIds : [],
    }));
  }
  if (enquiry.productName) {
    return [
      {
        productName: enquiry.productName,
        brand: '',
        modelSku: '',
        specification: enquiry.description || '',
        quantity: Math.max(1, Number(enquiry.quantity) || 1),
        images: Array.isArray(enquiry.images) ? enquiry.images : [],
        imagePublicIds: Array.isArray(enquiry.imagePublicIds) ? enquiry.imagePublicIds : [],
      },
    ];
  }
  return [];
}

function orderItemsFromProducts(products) {
  return products.map((p) => ({
    product: null,
    name: p.productName,
    sku: p.modelSku || '',
    categoryName: '',
    subcategoryName: '',
    brand: p.brand || '',
    specification: p.specification || '',
    description: p.specification || '',
    image: (Array.isArray(p.images) && p.images[0]) || '',
    quantity: Math.max(1, Number(p.quantity) || 1),
    unitPrice: 0,
    totalPrice: 0,
  }));
}

function historyEntry({ status, note, actor, role, fromStatus }) {
  return {
    status,
    note: note || '',
    at: new Date(),
    byName: actor?.name || '',
    byEmail: actor?.email || '',
    byMobile: actor?.mobile || '',
    byUserId: actor?.userId || null,
    byRole: role || '',
    fromStatus: fromStatus || '',
  };
}

async function createOrderForOtherProduct({ user, products, deliveryAddress, addressText, notes }) {
  const items = orderItemsFromProducts(products);
  const addr =
    deliveryAddress ||
    ({
      fullName: '',
      phone: '',
      line1: addressText || '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    });

  const actor = stampFromUser(user);
  const order = await Order.create(
    withCreateAudit(
      {
        orderNumber: generateOrderNumber(),
        user: user._id || user,
        source: 'other_product',
        items,
        billingAddress: addr,
        shippingAddress: addr,
        subtotal: 0,
        discount: 0,
        shippingCost: 0,
        total: 0,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        orderStatus: 'enquiry_received',
        quotation: {
          status: 'none',
          items: [],
          courierCharges: 0,
          otherCharges: 0,
          gstPercent: 0,
        },
        notes: notes || 'Product not listed enquiry',
        statusHistory: [
          historyEntry({
            status: 'enquiry_received',
            note: 'Other product enquiry submitted',
            actor,
            role: user.role || 'customer',
            fromStatus: '',
          }),
        ],
      },
      user
    )
  );
  return order;
}

/**
 * Backfill Orders for older Other Product enquiries that predate the order link.
 * Safe to call repeatedly — skips enquiries that already have an order.
 */
async function migrateOrphanOtherProductEnquiries() {
  const orphans = await OtherProductEnquiry.find({
    $or: [{ order: null }, { order: { $exists: false } }],
  })
    .populate('user')
    .limit(200);

  let created = 0;
  for (const enquiry of orphans) {
    if (!enquiry.user) continue;
    const products = productsFromEnquiry(enquiry);
    if (!products.length) continue;
    try {
      const order = await createOrderForOtherProduct({
        user: enquiry.user,
        products,
        deliveryAddress: enquiry.deliveryAddress?.line1
          ? enquiry.deliveryAddress
          : null,
        addressText: enquiry.address,
        notes: `Migrated from other-product enquiry ${enquiry._id}`,
      });
      // Preserve original enquiry time on the order when possible
      if (enquiry.createdAt) {
        order.createdAt = enquiry.createdAt;
        await order.save({ timestamps: false });
      }
      enquiry.order = order._id;
      await enquiry.save();
      created += 1;
    } catch (err) {
      console.error('[other-product] migrate failed:', enquiry._id, err.message);
    }
  }
  return created;
}

exports.migrateOrphanOtherProductEnquiries = migrateOrphanOtherProductEnquiries;

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
  if (
    !deliveryAddress ||
    !String(deliveryAddress.state || '').trim() ||
    !String(deliveryAddress.city || '').trim() ||
    !String(deliveryAddress.postalCode || '').trim() ||
    !String(deliveryAddress.fullName || '').trim() ||
    !String(deliveryAddress.phone || '').trim()
  ) {
    return res.status(400).json({
      success: false,
      message: 'Delivery address is incomplete. Full name, phone, city, state and PIN are required.',
    });
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

  const order = await createOrderForOtherProduct({
    user: req.user,
    products,
    deliveryAddress,
    addressText: address,
    notes: 'Product not listed enquiry',
  });

  const enquiry = await OtherProductEnquiry.create({
    user: req.user._id,
    products,
    productName: summaryName,
    description: summarySpec,
    quantity: totalQty,
    address,
    deliveryAddress: deliveryAddress || undefined,
    order: order._id,
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

      // Same order notify as catalog enquiries (quotation workflow)
      const customer = {
        name: customerDisplayName(req.user, order.billingAddress) || customerName,
        email: req.user.email,
        phone: order.billingAddress?.phone || req.user.phone || '',
      };
      const orderMail = adminNewOrderEmail({
        order,
        customer,
        when: formatWhen(order.createdAt || new Date()),
      });
      await sendMailToAdmins({
        subject: `[Other Product] ${orderMail.subject}`,
        html: orderMail.html,
        text: orderMail.text,
      });

      await sendPushToAdmins({
        title: 'New other-product enquiry',
        body: `${order.orderNumber} · ${customer.name} · ${when}`,
        url: '/admin/other-products',
        tag: `order-${order.orderNumber}`,
      });

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
    data: { enquiry, order },
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
      .populate('order', 'orderNumber orderStatus quotation')
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
    .populate('order')
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
