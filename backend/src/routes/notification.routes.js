const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/vapid-public-key', notificationController.getVapidPublicKey);
router.post('/subscribe', protect, notificationController.subscribe);
router.post('/unsubscribe', protect, notificationController.unsubscribe);

module.exports = router;
