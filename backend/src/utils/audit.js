/**
 * Reusable actor stamp + append-only action history.
 * createdBy / updatedBy stay as the latest snapshot for quick display.
 * actionHistory keeps every create / update / delete (never overwritten).
 */
const mongoose = require('mongoose');

const actorStampSchema = {
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  mobile: { type: String, default: '' },
  at: { type: Date, default: null },
};

const actionHistoryEntrySchema = {
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'status_change', 'bulk_update', 'bulk_create'],
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  mobile: { type: String, default: '' },
  at: { type: Date, default: Date.now },
  note: { type: String, default: '' },
};

const auditFields = {
  createdBy: { type: actorStampSchema, default: () => ({}) },
  updatedBy: { type: actorStampSchema, default: () => ({}) },
  actionHistory: { type: [actionHistoryEntrySchema], default: [] },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
};

function stampFromUser(user) {
  if (!user) {
    return { userId: null, name: '', email: '', mobile: '', at: new Date() };
  }
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
  return {
    userId: user._id || user.id || null,
    name,
    email: user.email || '',
    mobile: user.phone || '',
    at: new Date(),
  };
}

function auditEntry(user, action, note = '') {
  const stamp = stampFromUser(user);
  return {
    action,
    userId: stamp.userId,
    name: stamp.name,
    email: stamp.email,
    mobile: stamp.mobile,
    at: stamp.at,
    note: note || '',
  };
}

/** Apply create stamps + first history entry onto a plain payload object */
function withCreateAudit(payload, user) {
  const stamp = stampFromUser(user);
  return {
    ...payload,
    createdBy: stamp,
    updatedBy: stamp,
    isDeleted: false,
    deletedAt: null,
    actionHistory: [auditEntry(user, 'create')],
  };
}

/** Append update to an existing mongoose document (mutates doc) */
function applyUpdateAudit(doc, user, action = 'update', note = '') {
  const stamp = stampFromUser(user);
  doc.updatedBy = stamp;
  if (!Array.isArray(doc.actionHistory)) doc.actionHistory = [];
  doc.actionHistory.push(auditEntry(user, action, note));
  return stamp;
}

/** Soft-delete: keep document, append delete to history */
function applyDeleteAudit(doc, user, note = '') {
  applyUpdateAudit(doc, user, 'delete', note);
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  if (doc.schema?.path?.('deletedBy')) {
    doc.deletedBy = stampFromUser(user);
  }
  if (typeof doc.isActive === 'boolean') doc.isActive = false;
  return doc;
}

/** Mongo filter: exclude soft-deleted */
const notDeleted = { isDeleted: { $ne: true } };

module.exports = {
  actorStampSchema,
  actionHistoryEntrySchema,
  auditFields,
  stampFromUser,
  auditEntry,
  withCreateAudit,
  applyUpdateAudit,
  applyDeleteAudit,
  notDeleted,
};
