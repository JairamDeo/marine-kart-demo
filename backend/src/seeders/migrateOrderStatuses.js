/**
 * Migrate legacy order statuses:
 * - processing → confirmed (Processing removed from flow)
 *
 * Usage: node src/seeders/migrateOrderStatuses.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const res = await Order.updateMany(
    { orderStatus: 'processing' },
    { $set: { orderStatus: 'confirmed' } }
  );
  console.log(`Migrated processing → confirmed: ${res.modifiedCount} order(s)`);

  // Also rewrite legacy history entries labeled "processing" stay as-is for audit;
  // only current status must match enum.
  const bad = await Order.countDocuments({
    orderStatus: { $nin: ['pending', 'quotation_sent', 'confirmed', 'shipped', 'delivered', 'cancelled'] },
  });
  if (bad) {
    console.warn(`Warning: ${bad} order(s) still have unexpected status values`);
  } else {
    console.log('All order statuses are valid for the new flow.');
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
