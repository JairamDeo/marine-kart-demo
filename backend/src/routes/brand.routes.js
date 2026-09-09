const express = require('express');
const brandController = require('../controllers/brand.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', brandController.getBrands);

router.use(protect, authorize('admin'));

router.post('/', brandController.addBrand);
router.delete('/:id', brandController.deleteBrand);
router.put('/settings', brandController.updateSettings);

module.exports = router;
