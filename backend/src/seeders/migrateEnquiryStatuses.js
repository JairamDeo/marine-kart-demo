/**
 * Migrate legacy order statuses to the enquiry → quotation flow.
 * pending → enquiry_received
 * shipped | delivered → order_received
 *
 * Usage: node src/seeders/migrateEnquiryStatuses.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Order = require('../models/Order');

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }
  await mongoose.connect(uri);

  const pending = await Order.updateMany(
    { orderStatus: 'pending' },
    { $set: { orderStatus: 'enquiry_received' } }
  );
  const received = await Order.updateMany(
    { orderStatus: { $in: ['shipped', 'delivered'] } },
    { $set: { orderStatus: 'order_received' } }
  );

  console.log(`pending → enquiry_received: ${pending.modifiedCount}`);
  console.log(`shipped/delivered → order_received: ${received.modifiedCount}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
