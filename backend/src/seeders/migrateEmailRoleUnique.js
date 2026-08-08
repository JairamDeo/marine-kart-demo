/**
 * Storefront emails are unique across normal + corporate (one email = one storefront type).
 * Admin may still use the same email for an admin account.
 *
 * Usage: node src/seeders/migrateEmailRoleUnique.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function dropIfExists(col, name) {
  try {
    await col.dropIndex(name);
    console.log(`Dropped index: ${name}`);
  } catch (err) {
    if (err.code === 27 || /index not found/i.test(err.message)) {
      console.log(`Index not found (ok): ${name}`);
    } else {
      throw err;
    }
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.collection('users');
  const indexes = await col.indexes();
  console.log(
    'Current indexes:',
    indexes.map((i) => i.name).join(', ')
  );

  // Remove old uniqueness strategies
  for (const idx of indexes) {
    if (idx.name === '_id_') continue;
    const keys = Object.keys(idx.key || {});
    if (
      idx.name === 'email_1' ||
      idx.name === 'email_1_role_1' ||
      (keys.length === 1 && keys[0] === 'email' && idx.unique) ||
      (keys.includes('email') && keys.includes('role') && idx.unique)
    ) {
      await dropIfExists(col, idx.name);
    }
  }

  await col.createIndex(
    { email: 1 },
    {
      unique: true,
      name: 'email_1_storefront_unique',
      partialFilterExpression: { role: { $in: ['customer', 'corporate', 'dealer'] } },
    }
  );
  console.log('Created: email_1_storefront_unique');

  await col.createIndex(
    { email: 1 },
    {
      unique: true,
      name: 'email_1_admin_unique',
      partialFilterExpression: { role: 'admin' },
    }
  );
  console.log('Created: email_1_admin_unique');

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
