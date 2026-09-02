const express = require('express');
const otherProductController = require('../controllers/otherProductEnquiry.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, otherProductController.createEnquiry);
router.post(
  '/uploads',
  protect,
  otherProductController.uploadManyMw,
  otherProductController.uploadEnquiryImages
);

router.get('/', protect, authorize('admin'), otherProductController.adminListEnquiries);
router.get('/:id', protect, authorize('admin'), otherProductController.adminGetEnquiry);
router.patch('/:id', protect, authorize('admin'), otherProductController.adminUpdateEnquiry);

module.exports = router;
