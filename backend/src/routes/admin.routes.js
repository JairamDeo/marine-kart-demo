const express = require('express');
const adminController = require('../controllers/admin.controller');
const productController = require('../controllers/product.controller');
const categoryController = require('../controllers/category.controller');
const uploadController = require('../controllers/upload.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', adminController.getDashboard);

router.get('/customers', adminController.getCustomers);
router.patch('/customers/:id', adminController.updateCustomer);
router.post('/customers/:id/approve', adminController.approveUser);
router.post('/customers/:id/reject', adminController.rejectUser);
/** @deprecated — use /customers/:id/approve */
router.post('/approvals/:id/approve', adminController.approveUser);
router.get('/reports/sales', adminController.getSalesReport);

router.get('/products', productController.adminListProducts);
router.post('/products/bulk', adminController.bulkUpsertProducts);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

router.get('/categories', categoryController.adminListCategories);
router.get('/subcategories', categoryController.adminListSubcategories);
router.post('/categories/bulk', adminController.bulkUpsertCategories);
router.post('/subcategories/bulk', adminController.bulkUpsertSubcategories);
router.post('/categories', categoryController.createCategory);
router.post('/subcategories', categoryController.createSubcategory);
router.put('/subcategories/:id', categoryController.updateSubcategory);
router.delete('/subcategories/:id', categoryController.deleteSubcategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Cloudinary uploads → marinekart/<section>
router.post(
  '/uploads',
  uploadController.uploadSingleMw,
  uploadController.uploadImages
);
router.post(
  '/uploads/many',
  uploadController.uploadManyMw,
  uploadController.uploadImages
);

module.exports = router;
