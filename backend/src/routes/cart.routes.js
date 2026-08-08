const express = require('express');
const cartController = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', cartController.getCart);
router.post('/items', cartController.addToCart);
router.put('/items', cartController.updateCartItem);
router.post('/merge', cartController.mergeCart);
router.delete('/items/:productId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;
