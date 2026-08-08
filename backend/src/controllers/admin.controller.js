const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const { asyncHandler, slugify } = require('../utils/helpers');
const {
  withCreateAudit,
  applyUpdateAudit,
  notDeleted,
} = require('../utils/audit');
const { generateProductSku } = require('../utils/generateSku');

exports.getDashboard = asyncHandler(async (req, res) => {
  const [
    totalOrders,
    pendingOrders,
    completedOrders,
    processingOrders,
    cancelledOrders,
    registeredCustomers,
    dealers,
    products,
    categories,
    allOrders,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: 'pending' }),
    Order.countDocuments({ orderStatus: 'delivered' }),
    Order.countDocuments({
      orderStatus: { $in: ['quotation_sent', 'confirmed', 'shipped'] },
    }),
    Order.countDocuments({ orderStatus: 'cancelled' }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: { $in: ['corporate', 'dealer'] } }),
    Product.countDocuments(),
    Category.countDocuments(),
    Order.find().select('total orderStatus paymentStatus createdAt').sort('createdAt'),
  ]);

  const totalSales = allOrders
    .filter((o) => o.paymentStatus === 'paid' || o.orderStatus === 'delivered')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Last 6 months revenue bars
  const monthLabels = [];
  const monthSales = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = d.toLocaleString('en-US', { month: 'short' });
    monthLabels.push(label);
    const sum = allOrders
      .filter((o) => {
        const t = new Date(o.createdAt);
        return t >= d && t < end;
      })
      .reduce((s, o) => s + (o.total || 0), 0);
    monthSales.push(sum);
  }

  const salesTrend = monthLabels.map((month, i) => ({
    month,
    sales: monthSales[i],
    orders: allOrders.filter((o) => {
      const t = new Date(o.createdAt);
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const end = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
      return t >= d && t < end;
    }).length,
  }));

  const orderStatusChart = [
    { name: 'Pending', value: pendingOrders },
    { name: 'In Progress', value: processingOrders },
    { name: 'Delivered', value: completedOrders },
    { name: 'Cancelled', value: cancelledOrders },
  ];

  res.json({
    success: true,
    data: {
      overview: {
        totalOrders,
        totalSales,
        pendingOrders,
        completedOrders,
        processingOrders,
        cancelledOrders,
        registeredCustomers,
        dealers,
        products,
        categories,
      },
      charts: {
        salesTrend,
        orderStatusChart,
      },
    },
  });
});

exports.bulkUpsertProducts = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.products) ? req.body.products : [];
  if (!items.length) {
    return res.status(400).json({ success: false, message: 'No products provided.' });
  }

  let created = 0;
  let updated = 0;
  const errors = [];

  for (const raw of items) {
    try {
      const name = String(raw.name || '').trim();
      if (!name) {
        errors.push({ name: raw.name, message: 'Name is required.' });
        continue;
      }

      const category =
        raw.category || raw.categoryid || raw.categoryId || null;
      if (!category) {
        errors.push({ name, message: 'Category is required.' });
        continue;
      }

      const parseSpecs = (rawSpecs) => {
        if (Array.isArray(rawSpecs)) {
          return rawSpecs
            .map((s) => ({
              key: String(s.key || s.name || '').trim(),
              value: String(s.value ?? '').trim(),
            }))
            .filter((s) => s.key);
        }
        const text = String(rawSpecs || '').trim();
        if (!text) return [];
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) return parseSpecs(parsed);
        } catch {
          /* pipe format: Part Number:MK-L1042|Step:2|Length:600mm */
        }
        return text
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
      };

      const maxRaw = raw.maxOrderQty ?? raw.maxorderqty ?? raw.max_order_qty ?? raw.maxqty;
      const maxOrderQty =
        maxRaw === '' || maxRaw == null ? 0 : Math.max(0, Math.floor(Number(maxRaw) || 0));

      const payload = {
        name,
        shortDescription: raw.shortDescription || raw.shortdescription || raw.short_description || '',
        description: raw.description || '',
        specifications: parseSpecs(
          raw.specifications || raw.specification || raw.specs || ''
        ),
        maxOrderQty,
        price: Number(raw.price) || 0,
        salePrice:
          raw.salePrice != null || raw.saleprice != null
            ? Number(raw.salePrice ?? raw.saleprice)
            : null,
        images: Array.isArray(raw.images) ? raw.images : raw.image ? [raw.image] : [],
        isFeatured: Boolean(raw.isFeatured || raw.isfeatured),
        isBestSeller: Boolean(raw.isBestSeller || raw.isbestseller),
        isNewArrival: Boolean(raw.isNewArrival || raw.isnewarrival),
        isActive: String(raw.isActive ?? raw.isactive ?? 'true').toLowerCase() !== 'false',
        category,
      };

      if (raw.subcategory || raw.subcategoryid) {
        payload.subcategory = raw.subcategory || raw.subcategoryid;
      }

      // Match existing by name + category (SKU is auto-generated, not in CSV)
      const existing = await Product.findOne({ name, category: payload.category, ...notDeleted });
      if (existing) {
        Object.assign(existing, payload);
        applyUpdateAudit(existing, req.user, 'bulk_update');
        await existing.save();
        updated += 1;
      } else {
        payload.sku = await generateProductSku();
        payload.slug = raw.slug
          ? slugify(raw.slug)
          : slugify(`${name}-${payload.sku.replace(/[^a-zA-Z0-9]+/g, '-')}`);
        await Product.create(withCreateAudit(payload, req.user));
        created += 1;
      }
    } catch (err) {
      errors.push({ name: raw.name, message: err.message });
    }
  }

  res.json({ success: true, data: { created, updated, errors } });
});

exports.bulkUpsertCategories = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.categories) ? req.body.categories : [];
  if (!items.length) {
    return res.status(400).json({ success: false, message: 'No categories provided.' });
  }

  const { generateCategoryCode } = require('../utils/generateCategoryCode');
  let created = 0;
  let updated = 0;
  const errors = [];

  for (const raw of items) {
    try {
      const name = String(raw.name || '').trim();
      if (!name) {
        errors.push({ name: raw.name, message: 'Category name is required.' });
        continue;
      }

      // Bulk import is for main categories only (no parent)
      const slug = raw.slug ? slugify(raw.slug) : slugify(name);
      const existing = await Category.findOne({ slug, parent: null, ...notDeleted });
      if (existing) {
        existing.name = name;
        existing.description = raw.description || existing.description || '';
        existing.image = raw.image || existing.image || '';
        existing.sortOrder = Number(raw.sortOrder) || 0;
        existing.isActive = raw.isActive !== false;
        applyUpdateAudit(existing, req.user, 'bulk_update');
        await existing.save();
        updated += 1;
      } else {
        const code = await generateCategoryCode('cat');
        await Category.create(
          withCreateAudit(
            {
              name,
              code,
              slug: slugify(`${name}-${code.replace(/[^a-zA-Z0-9]+/g, '-')}`),
              description: raw.description || '',
              image: raw.image || '',
              parent: null,
              sortOrder: Number(raw.sortOrder) || 0,
              isActive: raw.isActive !== false,
            },
            req.user
          )
        );
        created += 1;
      }
    } catch (err) {
      errors.push({ name: raw.name, message: err.message });
    }
  }

  res.json({ success: true, data: { created, updated, errors } });
});

exports.bulkUpsertSubcategories = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.subcategories) ? req.body.subcategories : [];
  if (!items.length) {
    return res.status(400).json({ success: false, message: 'No subcategories provided.' });
  }

  const mongoose = require('mongoose');
  const { generateCategoryCode } = require('../utils/generateCategoryCode');
  let created = 0;
  let updated = 0;
  const errors = [];

  for (const raw of items) {
    try {
      const name = String(raw.name || '').trim();
      if (!name) {
        errors.push({ name: raw.name, message: 'Subcategory name is required.' });
        continue;
      }

      const categoryRef = String(
        raw.category || raw.categoryname || raw.categoryid || raw.categoryId || ''
      ).trim();
      if (!categoryRef) {
        errors.push({ name, message: 'Category (name or id) is required.' });
        continue;
      }

      let parent = null;
      if (mongoose.isValidObjectId(categoryRef)) {
        parent = await Category.findOne({ _id: categoryRef, parent: null, ...notDeleted });
      }
      if (!parent) {
        parent = await Category.findOne({
          name: new RegExp(`^${categoryRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
          parent: null,
          ...notDeleted,
        });
      }
      if (!parent) {
        errors.push({ name, message: `Category not found: ${categoryRef}` });
        continue;
      }

      const existing = await Category.findOne({
        name,
        parent: parent._id,
        ...notDeleted,
      });

      if (existing) {
        existing.description = raw.description || existing.description || '';
        existing.sortOrder = Number(raw.sortOrder ?? raw.sortorder) || existing.sortOrder || 0;
        existing.isActive =
          String(raw.isActive ?? raw.isactive ?? 'true').toLowerCase() !== 'false';
        applyUpdateAudit(existing, req.user, 'bulk_update');
        await existing.save();
        updated += 1;
      } else {
        const code = await generateCategoryCode('sub');
        await Category.create(
          withCreateAudit(
            {
              name,
              code,
              slug: slugify(`${parent.name}-${name}-${code.replace(/[^a-zA-Z0-9]+/g, '-')}`),
              description: raw.description || '',
              parent: parent._id,
              sortOrder: Number(raw.sortOrder ?? raw.sortorder) || 0,
              isActive: String(raw.isActive ?? raw.isactive ?? 'true').toLowerCase() !== 'false',
            },
            req.user
          )
        );
        created += 1;
      }
    } catch (err) {
      errors.push({ name: raw.name, message: err.message });
    }
  }

  res.json({ success: true, data: { created, updated, errors } });
});

exports.getCustomers = asyncHandler(async (req, res) => {
  const customers = await User.find({ role: { $in: ['customer', 'corporate', 'dealer'] } })
    .select('-password')
    .sort('-createdAt');
  res.json({ success: true, data: { customers } });
});

exports.updateCustomer = asyncHandler(async (req, res) => {
  const { role, priceMultiplier, isActive } = req.body;
  const customer = await User.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found.' });
  }

  if (role != null) customer.role = role;
  if (priceMultiplier != null) customer.priceMultiplier = priceMultiplier;
  if (isActive != null) customer.isActive = isActive;
  applyUpdateAudit(customer, req.user, 'update');
  await customer.save();

  const safe = customer.toObject();
  delete safe.password;
  res.json({ success: true, data: { customer: safe } });
});

exports.getSalesReport = asyncHandler(async (req, res) => {
  const orders = await Order.find({ paymentStatus: 'paid' }).sort('-createdAt');
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  res.json({
    success: true,
    data: {
      orderCount: orders.length,
      revenue,
      orders,
    },
  });
});
