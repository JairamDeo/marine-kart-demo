const { v2: cloudinary } = require('cloudinary');
const env = require('./env');

const configured = Boolean(
  env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret
);

if (configured) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
}

/**
 * Folder map under parent "marinekart"
 * marinekart/products
 * marinekart/categories
 * marinekart/accounts
 * marinekart/banners
 * marinekart/other
 */
const FOLDERS = {
  products: 'marinekart/products',
  categories: 'marinekart/categories',
  accounts: 'marinekart/accounts',
  banners: 'marinekart/banners',
  other: 'marinekart/other',
  enquiries: 'marinekart/enquiries',
};

function resolveFolder(section = 'other') {
  const key = String(section || 'other').toLowerCase();
  return FOLDERS[key] || FOLDERS.other;
}

module.exports = {
  cloudinary,
  configured,
  FOLDERS,
  resolveFolder,
};
