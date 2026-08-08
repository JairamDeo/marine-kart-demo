const express = require('express');
const contentController = require('../controllers/content.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/banners', contentController.getBanners);
router.get('/pages/:slug', contentController.getPage);
router.post('/contact', contentController.contactSubmit);
router.get('/blogs', contentController.getBlogs);
router.get('/blogs/:slug', contentController.getBlogBySlug);

router.put('/pages', protect, authorize('admin'), contentController.adminUpsertPage);
router.post('/banners', protect, authorize('admin'), contentController.adminCreateBanner);
router.post('/blogs', protect, authorize('admin'), contentController.adminCreateBlog);

module.exports = router;
