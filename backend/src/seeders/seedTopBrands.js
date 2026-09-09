require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const connectDB = require('../config/db');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const seedTopBrands = async () => {
  try {
    await connectDB();
    console.log('Connected to DB');

    const topBrandsDir = path.join(__dirname, '../../../topbrands');
    if (!fs.existsSync(topBrandsDir)) {
      console.log('No topbrands folder found.');
      process.exit(0);
    }

    const files = fs.readdirSync(topBrandsDir).filter((file) => file.match(/\.(png|jpe?g|webp|svg)$/i));

    if (files.length === 0) {
      console.log('No images found in topbrands folder.');
      process.exit(0);
    }

    // Clear existing brands
    await Brand.deleteMany();
    console.log('Cleared existing brands.');

    for (const file of files) {
      const filePath = path.join(topBrandsDir, file);
      const brandName = path.parse(file).name;

      console.log(`Uploading ${brandName}...`);
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'marinekart/brands',
        width: 400,
        crop: 'limit',
      });

      await Brand.create({
        name: brandName,
        image: {
          url: result.secure_url,
          public_id: result.public_id,
        },
      });
      console.log(`Saved ${brandName} to DB.`);
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed', err);
    process.exit(1);
  }
};

seedTopBrands();
