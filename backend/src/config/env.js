require('dotenv').config();

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  /** Comma-separated extra CORS origins (e.g. preview URLs) */
  frontendUrls: process.env.FRONTEND_URLS || process.env.ALLOWED_ORIGINS || '',
  email: process.env.EMAIL || '',
  emailPassword: String(process.env.EMAIL_PASSWORD || '').replace(/\s+/g, ''),
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  vapidSubject: process.env.VAPID_SUBJECT || `mailto:${process.env.EMAIL || 'admin@marinekart.com'}`,
  /**
   * Seed script only (npm run seed). Login always authenticates against the database.
   * Do not put admin credentials in .env for auth — they are unused by login.
   */
  adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@marinekart.com',
  adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
};

const required = ['mongodbUri', 'jwtSecret'];
for (const key of required) {
  if (!env[key]) {
    console.error(`Missing required env: ${key}`);
    process.exit(1);
  }
}

module.exports = env;
