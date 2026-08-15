/**
 * Remove obsolete annualVolume field from User documents.
 * Usage: node src/seeders/migrateRemoveAnnualVolume.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }
  await mongoose.connect(uri);

  const result = await mongoose.connection.db.collection('users').updateMany(
    { annualVolume: { $exists: true } },
    { $unset: { annualVolume: '' } }
  );

  console.log(`Removed annualVolume from ${result.modifiedCount} user(s)`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
