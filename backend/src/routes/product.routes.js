const express = require('express');
const productController = require('../controllers/product.controller');
const { protect, optionalAuth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, productController.getProducts);
router.get('/:slug', optionalAuth, productController.getProductBySlug);

router.post('/', protect, authorize('admin'), productController.createProduct);
router.put('/:id', protect, authorize('admin'), productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), productController.deleteProduct);

module.exports = router;
