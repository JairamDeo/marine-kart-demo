const express = require('express');
const orderController = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, orderController.placeOrder);
router.get('/my', protect, orderController.getMyOrders);
router.get('/my/:id', protect, orderController.getMyOrder);
router.patch('/my/:id/cancel', protect, orderController.cancelOrder);
router.get('/my/:id/quotation/pdf', protect, orderController.downloadMyQuotationPdf);

router.get('/', protect, authorize('admin'), orderController.adminListOrders);
router.get('/:id/quotation', protect, authorize('admin'), orderController.getQuotation);
router.get('/:id/quotation/pdf', protect, authorize('admin'), orderController.downloadAdminQuotationPdf);
router.put('/:id/quotation/draft', protect, authorize('admin'), orderController.saveQuotationDraft);
router.post('/:id/quotation/create', protect, authorize('admin'), orderController.createQuotation);
router.post('/:id/quotation/send', protect, authorize('admin'), orderController.sendQuotation);
router.get('/:id', protect, authorize('admin'), orderController.adminGetOrder);
router.patch('/:id', protect, authorize('admin'), orderController.adminUpdateOrder);

module.exports = router;
