const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const { asyncHandler, slugify } = require('../utils/helpers');
const {
  withCreateAudit,
  applyUpdateAudit,
  applyDeleteAudit,
  notDeleted,
} = require('../utils/audit');
const { generateCategoryCode } = require('../utils/generateCategoryCode');

function mapSubAsChild(sub) {
  return {
    _id: sub._id,
    id: sub._id,
    name: sub.name,
    slug: sub.slug,
    description: sub.description,
    image: sub.image,
    isActive: sub.isActive,
    sortOrder: sub.sortOrder,
  };
}

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true, ...notDeleted })
    .sort('sortOrder name')
    .lean();

  const ids = categories.map((c) => c._id);
  const children = await Subcategory.find({
    isActive: true,
    category: { $in: ids },
    ...notDeleted,
  })
    .sort('sortOrder name')
    .lean();

  const tree = categories.map((cat) => ({
    ...cat,
    id: cat._id,
    children: children
      .filter((c) => String(c.category) === String(cat._id))
      .map(mapSubAsChild),
  }));

  res.json({ success: true, data: { categories: tree } });
});

exports.getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    slug: req.params.slug,
    isActive: true,
    ...notDeleted,
  });
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  const children = await Subcategory.find({
    category: category._id,
    isActive: true,
    ...notDeleted,
  }).sort('sortOrder name');

  res.json({
    success: true,
    data: {
      category,
      children: children.map((c) => mapSubAsChild(c.toObject ? c.toObject() : c)),
    },
  });
});

/** Create a main category. Optional subcategories[] creates Subcategory docs. */
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, isActive, sortOrder, subcategories } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, message: 'Category name is required.' });
  }

  const code = await generateCategoryCode('cat');
  const slugBase = slugify(name);
  let slug = slugBase;
  const clash = await Category.findOne({ slug, ...notDeleted });
  if (clash) slug = slugify(`${name}-${code.replace(/[^a-zA-Z0-9]+/g, '-')}`);

  const category = await Category.create(
    withCreateAudit(
      {
        name: String(name).trim(),
        code,
        slug,
        description: description || '',
        image: image || '',
        isActive: isActive !== false,
        sortOrder: Number(sortOrder) || 0,
      },
      req.user
    )
  );

  const createdSubs = [];
  const names = Array.isArray(subcategories)
    ? subcategories.map((s) => String(s || '').trim()).filter(Boolean)
    : [];

  for (const subName of names) {
    const subCode = await generateCategoryCode('sub');
    const subSlug = slugify(`${name}-${subName}-${subCode.replace(/[^a-zA-Z0-9]+/g, '-')}`);
    const sub = await Subcategory.create(
      withCreateAudit(
        {
          name: subName,
          code: subCode,
          slug: subSlug,
          category: category._id,
          isActive: true,
          sortOrder: createdSubs.length,
        },
        req.user
      )
    );
    createdSubs.push(sub);
  }

  res.status(201).json({
    success: true,
    data: { category, subcategories: createdSubs },
  });
});

/** Create a subcategory mapped to a category ObjectId */
exports.createSubcategory = asyncHandler(async (req, res) => {
  const { name, categoryId, category, description, image, isActive, sortOrder } = req.body;
  const catId = categoryId || category;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, message: 'Subcategory name is required.' });
  }
  if (!catId) {
    return res.status(400).json({ success: false, message: 'Category is required.' });
  }

  const cat = await Category.findOne({ _id: catId, ...notDeleted });
  if (!cat) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  const code = await generateCategoryCode('sub');
  const slug = slugify(`${cat.name}-${name}-${code.replace(/[^a-zA-Z0-9]+/g, '-')}`);

  const subcategory = await Subcategory.create(
    withCreateAudit(
      {
        name: String(name).trim(),
        code,
        slug,
        description: description || '',
        image: image || '',
        category: cat._id,
        isActive: isActive !== false,
        sortOrder: Number(sortOrder) || 0,
      },
      req.user
    )
  );

  const populated = await Subcategory.findById(subcategory._id).populate('category', 'name code');
  res.status(201).json({ success: true, data: { subcategory: populated } });
});

exports.updateSubcategory = asyncHandler(async (req, res) => {
  const existing = await Subcategory.findOne({ _id: req.params.id, ...notDeleted });
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Subcategory not found.' });
  }

  const payload = { ...req.body };
  delete payload.code;
  delete payload.slug;
  delete payload.createdBy;
  delete payload.updatedBy;
  delete payload.deletedBy;
  delete payload.actionHistory;
  delete payload.isDeleted;
  delete payload.deletedAt;

  // Accept categoryId / category / legacy parent from older UI payloads
  const nextCatId = payload.categoryId || payload.category || payload.parent;
  delete payload.categoryId;
  delete payload.parent;
  if (nextCatId) {
    const cat = await Category.findOne({ _id: nextCatId, ...notDeleted });
    if (!cat) {
      return res.status(400).json({ success: false, message: 'Invalid category.' });
    }
    payload.category = cat._id;
  }

  if (payload.name && payload.name !== existing.name) {
    const catId = payload.category || existing.category;
    const catDoc = await Category.findById(catId);
    payload.slug = slugify(
      `${catDoc?.name || 'cat'}-${payload.name}-${existing.code || existing._id}`
    );
  }

  Object.assign(existing, payload);
  applyUpdateAudit(existing, req.user, 'update');
  await existing.save();

  const subcategory = await Subcategory.findById(existing._id).populate('category', 'name code');
  res.json({ success: true, data: { subcategory } });
});

exports.deleteSubcategory = asyncHandler(async (req, res) => {
  const subcategory = await Subcategory.findOne({ _id: req.params.id, ...notDeleted });
  if (!subcategory) {
    return res.status(404).json({ success: false, message: 'Subcategory not found.' });
  }

  applyDeleteAudit(subcategory, req.user);
  await subcategory.save();
  res.json({ success: true, message: 'Deleted.' });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const existing = await Category.findOne({ _id: req.params.id, ...notDeleted });
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  const payload = { ...req.body };
  delete payload.code;
  delete payload.slug;
  delete payload.parent;
  delete payload.createdBy;
  delete payload.updatedBy;
  delete payload.actionHistory;
  delete payload.isDeleted;
  delete payload.deletedAt;

  if (payload.name && payload.name !== existing.name) {
    payload.slug = slugify(`${payload.name}-${existing.code || existing._id}`);
  }

  Object.assign(existing, payload);
  applyUpdateAudit(existing, req.user, 'update');
  await existing.save();

  res.json({ success: true, data: { category: existing } });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, ...notDeleted });
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  const children = await Subcategory.find({ category: category._id, ...notDeleted });
  for (const child of children) {
    applyDeleteAudit(child, req.user, `Deleted with category ${category.name}`);
    await child.save();
  }

  applyDeleteAudit(category, req.user);
  await category.save();
  res.json({ success: true, message: 'Deleted.' });
});

/** Admin: main categories with nested subcategory summaries */
exports.adminListCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find(notDeleted).sort('sortOrder name').lean();
  const ids = categories.map((c) => c._id);
  const children = await Subcategory.find({ category: { $in: ids }, ...notDeleted })
    .select('name category code isActive')
    .lean();

  const withSubs = categories.map((c) => ({
    ...c,
    subcategoryCount: children.filter((ch) => String(ch.category) === String(c._id)).length,
    subcategories: children
      .filter((ch) => String(ch.category) === String(c._id))
      .map((ch) => ({ _id: ch._id, name: ch.name, code: ch.code, isActive: ch.isActive })),
  }));

  res.json({ success: true, data: { categories: withSubs } });
});

/** Admin: subcategories collection, with category populated */
exports.adminListSubcategories = asyncHandler(async (req, res) => {
  const filter = { ...notDeleted };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;

  const sortMap = {
    name_asc: { name: 1 },
    name_desc: { name: -1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    sort_asc: { sortOrder: 1 },
  };
  const sort = sortMap[req.query.sort] || { sortOrder: 1, name: 1 };

  const subcategories = await Subcategory.find(filter)
    .populate('category', 'name code')
    .sort(sort);

  // Keep legacy `parent` alias so older UI code still works
  const mapped = subcategories.map((doc) => {
    const o = doc.toObject();
    o.parent = o.category;
    return o;
  });

  res.json({ success: true, data: { subcategories: mapped } });
});
