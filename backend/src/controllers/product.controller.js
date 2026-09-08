const Product = require('../models/Product');
const { asyncHandler, slugify } = require('../utils/helpers');
const {
  withCreateAudit,
  applyUpdateAudit,
  applyDeleteAudit,
  notDeleted,
} = require('../utils/audit');
const { generateProductSku } = require('../utils/generateSku');
const { buildProductSearchFilter } = require('../utils/productSearch');

const LIST_SELECT =
  'productId name slug shortDescription images category subcategory stockStatus isFeatured isBestSeller isNewArrival isActive isDeleted';

const RELATED_SELECT = LIST_SELECT;

const mapListProducts = (products) => products.map((p) => Product.toListJSON(p));

const STRIP_ON_WRITE = [
  'sku',
  'stock',
  'lowStockThreshold',
  'price',
  'salePrice',
  'maxOrderQty',
  'actionHistory',
  'createdBy',
  'isDeleted',
  'deletedAt',
];

function prepareProductPayload(body) {
  const payload = { ...body };
  STRIP_ON_WRITE.forEach((k) => delete payload[k]);
  delete payload.updatedBy;
  if (Object.prototype.hasOwnProperty.call(body, 'specifications')) {
    payload.specifications = Product.sanitizeSpecificationsInput(body.specifications);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'stockStatus')) {
    const s = String(body.stockStatus || '').toLowerCase();
    payload.stockStatus = s === 'out_of_stock' ? 'out_of_stock' : 'in_stock';
  }
  return payload;
}

function setPublicCache(res, seconds = 60) {
  res.set('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=120`);
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
  ]);
  const sortKey = allowedSort.has(String(sort)) ? String(sort) : '-createdAt';

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select(LIST_SELECT)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .sort(sortKey)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter),
  ]);

  setPublicCache(res, search ? 30 : 60);
  res.json({
    success: true,
    data: {
      products: mapListProducts(products),
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
    .select('-actionHistory -imagePublicIds -seo -createdBy -updatedBy')
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .populate({
      path: 'relatedProducts',
      select: RELATED_SELECT,
      match: { isActive: true, isDeleted: { $ne: true } },
      options: { limit: 8 },
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' },
      ],
    })
    .lean();

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  let relatedDocs = (product.relatedProducts || []).filter(Boolean);

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
      .select(RELATED_SELECT)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .sort('-isBestSeller -isFeatured -createdAt')
      .limit(8)
      .lean();
  }

  // Still empty? fall back to same category
  if (!relatedDocs.length && product.category) {
    relatedDocs = await Product.find({
      _id: { $ne: product._id },
      category: product.category._id || product.category,
      isActive: true,
      ...notDeleted,
    })
      .select(RELATED_SELECT)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .sort('-isBestSeller -isFeatured -createdAt')
      .limit(8)
      .lean();
  }

  const related = mapListProducts(relatedDocs);
  const specs = Product.normalizeSpecifications(product.specifications);
  const PLACEHOLDER_RE = /product-placeholder|specification-placeholder|placehold\.co|dummy/i;
  const images = (Array.isArray(product.images) ? product.images : [])
    .map((u) => String(u || '').trim())
    .filter((u) => u && !PLACEHOLDER_RE.test(u));
  if (specs?.image && PLACEHOLDER_RE.test(String(specs.image))) {
    specs.image = '';
    if (specs.mode === 'image' && !specs.markdown) specs.mode = 'none';
  }
  const stockStatus = product.stockStatus === 'out_of_stock' ? 'out_of_stock' : 'in_stock';

  setPublicCache(res, 60);
  res.json({
    success: true,
    data: {
      product: {
        id: product._id,
        productId: product.productId || '',
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        description: product.description,
        specifications: specs,
        images,
        category: product.category,
        subcategory: product.subcategory,
        stockStatus,
        inStock: stockStatus === 'in_stock',
        isFeatured: product.isFeatured,
        isBestSeller: product.isBestSeller,
        isNewArrival: product.isNewArrival,
        relatedProducts: related,
        priceVisible: false,
        price: null,
        salePrice: null,
        displayPrice: null,
        maxOrderQty: 0,
      },
    },
  });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const payload = prepareProductPayload(req.body);

  const productId = String(payload.productId || '').trim();
  if (productId) {
    payload.productId = productId;
    if (!payload.name) payload.name = productId;
  }
  if (!payload.name) {
    return res.status(400).json({ success: false, message: 'Product Id is required.' });
  }

  payload.sku = await generateProductSku();
  if (!payload.slug) {
    payload.slug = slugify(
      `${payload.productId || payload.name}-${payload.sku.replace(/[^a-zA-Z0-9]+/g, '-')}`
    );
  }
  if (!payload.stockStatus) payload.stockStatus = 'in_stock';
  if (payload.shortDescription == null) payload.shortDescription = '';

  const product = await Product.create(withCreateAudit(payload, req.user));

  res.status(201).json({ success: true, data: { product } });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, ...notDeleted });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const payload = prepareProductPayload(req.body);
  if (Object.prototype.hasOwnProperty.call(payload, 'productId')) {
    const productId = String(payload.productId || '').trim();
    payload.productId = productId;
    if (productId && !payload.name) payload.name = productId;
  }

  Object.assign(product, payload);
  applyUpdateAudit(product, req.user, 'update');
  await product.save();
  // Clear legacy catalog price fields from older documents
  await Product.collection.updateOne(
    { _id: product._id },
    { $unset: { price: '', salePrice: '', maxOrderQty: '' } }
  );

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
    .select('-actionHistory')
    .populate('category', 'name')
    .populate('subcategory', 'name')
    .sort('-createdAt')
    .lean();
  res.json({ success: true, data: { products } });
});
