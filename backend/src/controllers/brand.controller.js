const Brand = require('../models/Brand');
const Setting = require('../models/Setting');
const { asyncHandler } = require('../utils/helpers');

// Public
exports.getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find().sort({ createdAt: -1 });
  let speedSetting = await Setting.findOne({ key: 'marquee_speed' });
  const speed = speedSetting ? speedSetting.value : 30; // default 30s

  res.json({ success: true, data: brands, speed });
});

// Admin
exports.addBrand = asyncHandler(async (req, res) => {
  const { name, image } = req.body;
  if (!name || !image) {
    return res.status(400).json({ success: false, message: 'Name and image are required' });
  }

  const brand = await Brand.create({ name, image });
  res.status(201).json({ success: true, data: brand });
});

exports.deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
  
  await brand.deleteOne();
  res.json({ success: true, message: 'Brand deleted' });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const { speed } = req.body;
  if (!speed) return res.status(400).json({ success: false, message: 'Speed is required' });

  let setting = await Setting.findOne({ key: 'marquee_speed' });
  if (!setting) {
    setting = await Setting.create({ key: 'marquee_speed', value: speed });
  } else {
    setting.value = speed;
    await setting.save();
  }

  res.json({ success: true, data: setting.value });
});
