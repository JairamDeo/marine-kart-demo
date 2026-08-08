const Category = require('../models/Category');
const { asyncHandler, slugify } = require('../utils/helpers');
const {
  withCreateAudit,
  applyUpdateAudit,
  applyDeleteAudit,
  notDeleted,
} = require('../utils/audit');
const { generateCategoryCode } = require('../utils/generateCategoryCode');

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true, parent: null, ...notDeleted })
    .sort('sortOrder name')
    .lean();

  const ids = categories.map((c) => c._id);
  const children = await Category.find({
    isActive: true,
    parent: { $in: ids },
    ...notDeleted,
  })
    .sort('sortOrder name')
    .lean();

  const tree = categories.map((parent) => ({
    ...parent,
    id: parent._id,
    children: children
      .filter((c) => String(c.parent) === String(parent._id))
      .map((c) => ({ ...c, id: c._id })),
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

  const children = await Category.find({
    parent: category._id,
    isActive: true,
    ...notDeleted,
  }).sort('sortOrder name');

  res.json({ success: true, data: { category, children } });
});

/** Create a main category (parent=null). Optional subcategories[] creates children. */
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
        parent: null,
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
    const sub = await Category.create(
      withCreateAudit(
        {
          name: subName,
          code: subCode,
          slug: subSlug,
          parent: category._id,
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

/** Create a single subcategory under an existing category */
exports.createSubcategory = asyncHandler(async (req, res) => {
  const { name, categoryId, description, image, isActive, sortOrder } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, message: 'Subcategory name is required.' });
  }
  if (!categoryId) {
    return res.status(400).json({ success: false, message: 'Parent category is required.' });
  }

  const parent = await Category.findOne({ _id: categoryId, parent: null, ...notDeleted });
  if (!parent) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  const code = await generateCategoryCode('sub');
  const slug = slugify(`${parent.name}-${name}-${code.replace(/[^a-zA-Z0-9]+/g, '-')}`);

  const subcategory = await Category.create(
    withCreateAudit(
      {
        name: String(name).trim(),
        code,
        slug,
        description: description || '',
        image: image || '',
        parent: parent._id,
        isActive: isActive !== false,
        sortOrder: Number(sortOrder) || 0,
      },
      req.user
    )
  );

  const populated = await Category.findById(subcategory._id).populate('parent', 'name code');
  res.status(201).json({ success: true, data: { subcategory: populated } });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const existing = await Category.findOne({ _id: req.params.id, ...notDeleted });
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  const payload = { ...req.body };
  delete payload.code;
  delete payload.slug;
  delete payload.createdBy;
  delete payload.updatedBy;
  delete payload.actionHistory;
  delete payload.isDeleted;
  delete payload.deletedAt;

  if (!existing.parent) {
    payload.parent = null;
  } else if (payload.parent) {
    const parent = await Category.findOne({ _id: payload.parent, parent: null, ...notDeleted });
    if (!parent) {
      return res.status(400).json({ success: false, message: 'Invalid parent category.' });
    }
  }

  if (payload.name && payload.name !== existing.name) {
    const parentId = payload.parent || existing.parent;
    if (parentId) {
      const parentDoc = await Category.findById(parentId);
      payload.slug = slugify(
        `${parentDoc?.name || 'cat'}-${payload.name}-${existing.code || existing._id}`
      );
    } else {
      payload.slug = slugify(`${payload.name}-${existing.code || existing._id}`);
    }
  }

  Object.assign(existing, payload);
  applyUpdateAudit(existing, req.user, 'update');
  await existing.save();

  const category = await Category.findById(existing._id).populate('parent', 'name code');
  res.json({ success: true, data: { category } });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, ...notDeleted });
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  // Soft-delete main category and its subcategories (history kept)
  if (!category.parent) {
    const children = await Category.find({ parent: category._id, ...notDeleted });
    for (const child of children) {
      applyDeleteAudit(child, req.user, `Deleted with parent ${category.name}`);
      await child.save();
    }
  }

  applyDeleteAudit(category, req.user);
  await category.save();
  res.json({ success: true, message: 'Deleted.' });
});

/** Admin: main categories only */
exports.adminListCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ parent: null, ...notDeleted })
    .sort('sortOrder name')
    .lean();
  const ids = categories.map((c) => c._id);
  const children = await Category.find({ parent: { $in: ids }, ...notDeleted })
    .select('name parent code isActive')
    .lean();

  const withSubs = categories.map((c) => ({
    ...c,
    subcategoryCount: children.filter((ch) => String(ch.parent) === String(c._id)).length,
    subcategories: children
      .filter((ch) => String(ch.parent) === String(c._id))
      .map((ch) => ({ _id: ch._id, name: ch.name, code: ch.code, isActive: ch.isActive })),
  }));

  res.json({ success: true, data: { categories: withSubs } });
});

/** Admin: subcategories only (parent set), with category populated */
exports.adminListSubcategories = asyncHandler(async (req, res) => {
  const filter = { parent: { $ne: null }, ...notDeleted };
  if (req.query.category) filter.parent = req.query.category;
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

  const subcategories = await Category.find(filter)
    .populate('parent', 'name code')
    .sort(sort);

  res.json({ success: true, data: { subcategories } });
});
