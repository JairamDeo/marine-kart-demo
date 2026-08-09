const Product = require('../models/Product');
const { asyncHandler, slugify } = require('../utils/helpers');
const {
  stampFromUser,
  withCreateAudit,
  applyUpdateAudit,
  applyDeleteAudit,
  notDeleted,
} = require('../utils/audit');
const { generateProductSku } = require('../utils/generateSku');
const { buildProductSearchFilter } = require('../utils/productSearch');

const mapProducts = (products, user) => products.map((p) => p.toPublicJSON(user));

const STRIP_ON_WRITE = ['sku', 'stock', 'stockStatus', 'lowStockThreshold', 'actionHistory', 'createdBy', 'isDeleted', 'deletedAt'];

function prepareProductPayload(body) {
  const payload = { ...body };
  STRIP_ON_WRITE.forEach((k) => delete payload[k]);
  delete payload.updatedBy;
  if (Object.prototype.hasOwnProperty.call(body, 'specifications')) {
    payload.specifications = Product.sanitizeSpecificationsInput(body.specifications);
  }
  return payload;
}

exports.getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    subcategory,
    search,
    featured,
    bestSeller,
    newArrival,
    sort = '-createdAt',
  } = req.query;

  const filter = { isActive: true, ...notDeleted };
  if (category) filter.category = category;
  if (subcategory) filter.subcategory = subcategory;
  if (featured === 'true') filter.isFeatured = true;
  if (bestSeller === 'true') filter.isBestSeller = true;
  if (newArrival === 'true') filter.isNewArrival = true;

  const searchFilter = buildProductSearchFilter(search);
  if (searchFilter) Object.assign(filter, searchFilter);

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 12));
  const skip = (pageNum - 1) * limitNum;

  // Whitelist sort to avoid injection / invalid paths
  const allowedSort = new Set([
    'createdAt',
    '-createdAt',
    'name',
    '-name',
    'price',
    '-price',
  ]);
  const sortKey = allowedSort.has(String(sort)) ? String(sort) : '-createdAt';

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .sort(sortKey)
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      products: mapProducts(products, req.user),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.max(1, Math.ceil(total / limitNum) || 1),
      },
    },
  });
});

exports.getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true, ...notDeleted })
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .populate('relatedProducts');

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  let relatedDocs = (product.relatedProducts || []).filter(
    (p) => p && p.isActive !== false && p.isDeleted !== true
  );

  // If none linked manually, pull related items from same subcategory / category
  if (!relatedDocs.length) {
    const filter = {
      _id: { $ne: product._id },
      isActive: true,
      ...notDeleted,
    };
    if (product.subcategory) {
      filter.subcategory = product.subcategory._id || product.subcategory;
    } else if (product.category) {
      filter.category = product.category._id || product.category;
    }

    relatedDocs = await Product.find(filter)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .sort('-isBestSeller -isFeatured -createdAt')
      .limit(8);
  }

  // Still empty? fall back to same category
  if (!relatedDocs.length && product.category) {
    relatedDocs = await Product.find({
      _id: { $ne: product._id },
      category: product.category._id || product.category,
      isActive: true,
      ...notDeleted,
    })
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .sort('-isBestSeller -isFeatured -createdAt')
      .limit(8);
  }

  const related = relatedDocs.map((p) =>
    typeof p.toPublicJSON === 'function' ? p.toPublicJSON(req.user) : p
  );

  res.json({
    success: true,
    data: {
      product: { ...product.toPublicJSON(req.user), relatedProducts: related },
    },
  });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const payload = prepareProductPayload(req.body);

  payload.sku = await generateProductSku();
  if (!payload.slug && payload.name) {
    payload.slug = slugify(`${payload.name}-${payload.sku.replace(/[^a-zA-Z0-9]+/g, '-')}`);
  }

  const product = await Product.create(withCreateAudit(payload, req.user));

  res.status(201).json({ success: true, data: { product } });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, ...notDeleted });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const payload = prepareProductPayload(req.body);

  Object.assign(product, payload);
  applyUpdateAudit(product, req.user, 'update');
  await product.save();

  res.json({ success: true, data: { product } });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, ...notDeleted });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  applyDeleteAudit(product, req.user);
  await product.save();
  res.json({ success: true, message: 'Product deleted.' });
});

exports.adminListProducts = asyncHandler(async (req, res) => {
  const products = await Product.find(notDeleted)
    .populate('category', 'name')
    .populate('subcategory', 'name')
    .sort('-createdAt');
  res.json({ success: true, data: { products } });
});
