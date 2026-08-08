const express = require('express');
const orderController = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, orderController.placeOrder);
router.get('/my', protect, orderController.getMyOrders);
router.get('/my/:id', protect, orderController.getMyOrder);
router.patch('/my/:id/cancel', protect, orderController.cancelOrder);

router.get('/', protect, authorize('admin'), orderController.adminListOrders);
router.get('/:id', protect, authorize('admin'), orderController.adminGetOrder);
router.patch('/:id', protect, authorize('admin'), orderController.adminUpdateOrder);

module.exports = router;
