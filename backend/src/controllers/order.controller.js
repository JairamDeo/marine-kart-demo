const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { asyncHandler, generateOrderNumber } = require('../utils/helpers');
const {
  stampFromUser,
  withCreateAudit,
  applyUpdateAudit,
} = require('../utils/audit');
const {
  getAllowedAdminStatuses,
  validateAdminStatusChange,
  canCustomerCancel,
} = require('../utils/orderStatus');
const {
  normalizeQuotationPayload,
  validateQuotationForSend,
  seedQuotationItemsFromOrder,
  enrichOrderItemsWithCategories,
} = require('../utils/quotation');
const { sendMail, sendMailToAdmins } = require('../utils/mail');
const {
  adminNewOrderEmail,
  customerOrderStatusEmail,
  customerQuotationSentEmail,
} = require('../utils/emailTemplates');
const { sendPushToAdmins, sendPushToUser } = require('../utils/push');
const {
  formatWhen,
  statusLabel,
  customerDisplayName,
} = require('../utils/orderNotify');

function historyEntry({ status, note, actor, role, fromStatus }) {
  return {
    status,
    note: note || '',
    at: new Date(),
    byName: actor?.name || '',
    byEmail: actor?.email || '',
    byMobile: actor?.mobile || '',
    byUserId: actor?.userId || null,
    byRole: role || '',
    fromStatus: fromStatus || '',
  };
}

function actorRoleLabel(user) {
  const role = user?.role === 'dealer' ? 'corporate' : user?.role || 'customer';
  return role;
}

function cancelledBySnapshot(user, role, note = '') {
  const actor = stampFromUser(user);
  return {
    userId: actor.userId,
    name: actor.name,
    email: actor.email,
    mobile: actor.mobile,
    role: role || actorRoleLabel(user),
    at: new Date(),
    note: note || '',
  };
}

async function buildCartPricing(user) {
  const cart = await Cart.findOne({ user: user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    return { cart: null, items: [], subtotal: 0 };
  }

  const multiplier = user.priceMultiplier ?? 1;
  const items = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive || product.isDeleted) {
      const err = new Error('A product in cart is unavailable.');
      err.statusCode = 400;
      throw err;
    }

    if (product.stockStatus === 'out_of_stock') {
      const err = new Error(`"${product.name}" is currently out of stock.`);
      err.statusCode = 400;
      throw err;
    }

    const unit =
      Math.round((Number(product.salePrice) || Number(product.price) || 0) * multiplier * 100) /
      100;
    const totalPrice = unit * item.quantity;
    subtotal += totalPrice;

    items.push({
      product: product._id,
      name: product.name,
      sku: product.sku,
      quantity: item.quantity,
      unitPrice: unit,
      totalPrice,
    });
  }

  return { cart, items, subtotal };
}

function parsePagination(query, { defaultLimit = 10, maxLimit = 50 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

exports.placeOrder = asyncHandler(async (req, res) => {
  const { billingAddress, shippingAddress, paymentMethod = 'cod', notes } = req.body;

  let pricing;
  try {
    pricing = await buildCartPricing(req.user);
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }

  const { cart, items, subtotal } = pricing;
  if (!cart || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty.' });
  }

  const discount = 0;
  const shippingCost = 0;
  const total = Math.max(subtotal - discount + shippingCost, 0);

  const actor = stampFromUser(req.user);
  const order = await Order.create(
    withCreateAudit(
      {
        orderNumber: generateOrderNumber(),
        user: req.user._id,
        items,
        billingAddress,
        shippingAddress: shippingAddress || billingAddress,
        subtotal,
        discount,
        shippingCost,
        total,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        orderStatus: 'enquiry_received',
        quotation: { status: 'none', items: [], courierCharges: 0, gstPercent: 0 },
        notes,
        statusHistory: [
          historyEntry({
            status: 'enquiry_received',
            note: 'Enquiry submitted',
            actor,
            role: req.user.role || 'customer',
            fromStatus: '',
          }),
        ],
      },
      req.user
    )
  );

  cart.items = [];
  await cart.save();

  // Notify admin (email + short push) — do not block the response
  setImmediate(async () => {
    try {
      const when = formatWhen(order.createdAt || new Date());
      const customer = {
        name: customerDisplayName(req.user, order.billingAddress),
        email: req.user.email,
        phone: order.billingAddress?.phone || req.user.phone || '',
      };

      const mail = adminNewOrderEmail({ order, customer, when });
      await sendMailToAdmins({
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });

      await sendPushToAdmins({
        title: 'New enquiry',
        body: `${order.orderNumber} · ${customer.name} · ${when}`,
        url: '/admin/orders',
        tag: `order-${order.orderNumber}`,
      });
    } catch (err) {
      console.error('[order] admin notify failed:', err.message);
    }
  });

  res.status(201).json({ success: true, data: { order } });
});

exports.getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { user: req.user._id };

  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.search) {
    const q = String(req.query.search).trim();
    if (q) filter.orderNumber = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) {
      const to = new Date(req.query.to);
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    amount_desc: { total: -1 },
    amount_asc: { total: 1 },
  };
  const sort = sortMap[req.query.sort] || sortMap.newest;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    },
  });
});

exports.getMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  res.json({ success: true, data: { order } });
});

exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  if (!canCustomerCancel(order.orderStatus)) {
    return res.status(400).json({
      success: false,
      message:
        order.orderStatus === 'cancelled'
          ? 'Order is already cancelled.'
          : 'You cannot reject this order at its current status.',
    });
  }

  const reason = String(req.body.reason || req.body.note || '').trim();
  if (reason.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a reason for rejecting this order (at least 3 characters).',
    });
  }

  const fromStatus = order.orderStatus;
  const role = actorRoleLabel(req.user);
  const actor = stampFromUser(req.user);
  const note = `Rejected by ${role === 'corporate' ? 'corporate customer' : 'customer'}: ${reason}`;

  order.orderStatus = 'cancelled';
  order.cancelledBy = cancelledBySnapshot(req.user, role, note);
  order.statusHistory.push(
    historyEntry({
      status: 'cancelled',
      note,
      actor,
      role,
      fromStatus,
    })
  );
  applyUpdateAudit(order, req.user, 'status_change', `Rejected (was ${fromStatus})`);
  await order.save();

  res.json({ success: true, data: { order } });
});

exports.adminListOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.search) {
    const q = String(req.query.search).trim();
    if (q) {
      const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapeRx(q), 'i');
      const userOr = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
        { companyName: regex },
      ];
      const parts = q.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        userOr.push({
          $and: [
            { firstName: new RegExp(escapeRx(parts[0]), 'i') },
            { lastName: new RegExp(escapeRx(parts.slice(1).join(' ')), 'i') },
          ],
        });
      }
      const matchedUsers = await User.find({ $or: userOr }).select('_id').lean();
      filter.$or = [
        { orderNumber: regex },
        { 'shippingAddress.fullName': regex },
        { 'shippingAddress.phone': regex },
        { 'billingAddress.fullName': regex },
        { 'billingAddress.phone': regex },
        { user: { $in: matchedUsers.map((u) => u._id) } },
      ];
    }
  }
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) {
      const to = new Date(req.query.to);
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }

  const customerType = String(req.query.customerType || '').trim().toLowerCase();
  if (customerType === 'customer' || customerType === 'corporate') {
    const roleQuery =
      customerType === 'customer'
        ? { role: 'customer' }
        : { role: { $in: ['corporate', 'dealer'] } };
    const typeUsers = await User.find(roleQuery).select('_id').lean();
    filter.user = { $in: typeUsers.map((u) => u._id) };
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    amount_desc: { total: -1 },
    amount_asc: { total: 1 },
  };
  const sort = sortMap[req.query.sort] || sortMap.newest;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'firstName lastName email phone role companyName')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    },
  });
});

exports.adminGetOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'firstName lastName email phone role companyName'
  );
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  const allowed = getAllowedAdminStatuses(order.orderStatus, {
    quotationSent: order.quotation?.status === 'sent',
  });
  res.json({
    success: true,
    data: {
      order,
      workflow: {
        nextStatus: allowed.next,
        canCancel: allowed.canCancel,
        allowedStatuses: allowed.options,
        quotationRequired: Boolean(allowed.quotationRequired),
      },
    },
  });
});

exports.adminUpdateOrder = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus, note } = req.body;
  const order = await Order.findById(req.params.id).populate(
    'user',
    'firstName lastName email phone role companyName'
  );
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const actor = stampFromUser(req.user);
  const quotationSent = order.quotation?.status === 'sent';
  let auditNote = '';
  let statusChangedTo = null;

  if (orderStatus && orderStatus !== order.orderStatus) {
    const check = validateAdminStatusChange(order.orderStatus, orderStatus, { quotationSent });
    if (!check.ok) {
      return res.status(400).json({ success: false, message: check.message });
    }
    const fromStatus = order.orderStatus;
    if (check.cancel) {
      const cancelReason = String(note || '').trim();
      if (cancelReason.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'A cancellation reason is required (at least 3 characters).',
        });
      }
      const cancelNote = `Cancelled by admin: ${cancelReason}`;
      order.orderStatus = 'cancelled';
      statusChangedTo = 'cancelled';
      order.cancelledBy = cancelledBySnapshot(req.user, 'admin', cancelNote);
      order.statusHistory.push(
        historyEntry({
          status: 'cancelled',
          note: cancelNote,
          actor,
          role: 'admin',
          fromStatus,
        })
      );
      auditNote = `Status ${fromStatus} → cancelled`;
    } else {
      order.orderStatus = orderStatus;
      statusChangedTo = orderStatus;
      order.statusHistory.push(
        historyEntry({
          status: orderStatus,
          note: note || `Status updated to ${orderStatus}`,
          actor,
          role: 'admin',
          fromStatus,
        })
      );
      auditNote = `Status ${fromStatus} → ${orderStatus}`;
    }
  }

  if (paymentStatus && paymentStatus !== order.paymentStatus) {
    const fromPay = order.paymentStatus;
    order.paymentStatus = paymentStatus;
    auditNote = [auditNote, `Payment ${fromPay} → ${paymentStatus}`].filter(Boolean).join('; ');
  }

  if (auditNote) {
    applyUpdateAudit(order, req.user, 'status_change', note || auditNote);
    await order.save();

    if (statusChangedTo) {
      setImmediate(async () => {
        try {
          const customer = order.user;
          if (!customer) return;
          const when = formatWhen(new Date());
          const label = statusLabel(order.orderStatus, { forCustomer: true });
          const name = customerDisplayName(customer, order.billingAddress);

          if (customer.email) {
            const mail = customerOrderStatusEmail({
              order,
              customerName: name,
              status: label,
              when,
            });
            await sendMail({
              to: customer.email,
              subject: mail.subject,
              html: mail.html,
              text: mail.text,
            });
          }

          await sendPushToUser(customer._id || customer.id, {
            title: 'Order update',
            body: `${order.orderNumber} is now ${label} · ${when}`,
            url: '/account/orders',
            tag: `order-status-${order.orderNumber}`,
          });
        } catch (err) {
          console.error('[order] customer notify failed:', err.message);
        }
      });
    }
  }

  const allowed = getAllowedAdminStatuses(order.orderStatus, {
    quotationSent: order.quotation?.status === 'sent',
  });
  res.json({
    success: true,
    data: {
      order,
      workflow: {
        nextStatus: allowed.next,
        canCancel: allowed.canCancel,
        allowedStatuses: allowed.options,
        quotationRequired: Boolean(allowed.quotationRequired),
      },
    },
  });
});

function quotationWorkflow(order) {
  const allowed = getAllowedAdminStatuses(order.orderStatus, {
    quotationSent: order.quotation?.status === 'sent',
  });
  return {
    nextStatus: allowed.next,
    canCancel: allowed.canCancel,
    allowedStatuses: allowed.options,
    quotationRequired: Boolean(allowed.quotationRequired),
  };
}

exports.getQuotation = asyncHandler(async (req, res) => {
  let order = await Order.findById(req.params.id).populate(
    'user',
    'firstName lastName email phone role companyName'
  );
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  // If user populate failed (deleted account), keep a safe stub so UI can still show contact.
  if (!order.user || typeof order.user !== 'object') {
    order.user = {
      firstName: order.billingAddress?.fullName || order.shippingAddress?.fullName || '',
      lastName: '',
      email: '',
      phone: order.billingAddress?.phone || order.shippingAddress?.phone || '',
    };
  }

  await enrichOrderItemsWithCategories(order);

  let quotation = order.quotation?.toObject?.() || order.quotation || { status: 'none' };
  if (!quotation.items?.length || quotation.status === 'none') {
    quotation = {
      ...quotation,
      status: quotation.status === 'sent' ? 'sent' : quotation.status || 'none',
      items: quotation.items?.length ? quotation.items : seedQuotationItemsFromOrder(order),
      courierCharges: quotation.courierCharges || 0,
      gstPercent: quotation.gstPercent || 0,
    };
  } else {
    // Fill missing category names from enriched order items
    const byProduct = new Map(
      (order.items || []).map((i) => [String(i.product?._id || i.product), i])
    );
    quotation.items = (quotation.items || []).map((qi) => {
      const match = byProduct.get(String(qi.product?._id || qi.product));
      return {
        ...(qi.toObject?.() || qi),
        categoryName: qi.categoryName || match?.categoryName || '',
        subcategoryName: qi.subcategoryName || match?.subcategoryName || '',
      };
    });
  }

  res.json({
    success: true,
    data: {
      order,
      quotation,
      workflow: quotationWorkflow(order),
    },
  });
});

/** Validate + save quotation without sending / without status change to Quotation Sent. */
exports.createQuotation = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'firstName lastName email phone role companyName'
  );
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  if (order.quotation?.status === 'sent') {
    return res.status(400).json({
      success: false,
      message: 'Quotation already sent. It cannot be recreated.',
    });
  }
  if (['cancelled', 'order_received'].includes(order.orderStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot create quotation for this order status.',
    });
  }

  const normalized = normalizeQuotationPayload(req.body, order.items);
  const check = validateQuotationForSend(normalized);
  if (!check.ok) {
    return res.status(400).json({ success: false, message: check.message });
  }

  order.quotation = {
    status: 'draft',
    items: normalized.items,
    courierCharges: normalized.courierCharges,
    gstPercent: normalized.gstPercent,
    itemsSubtotal: normalized.itemsSubtotal,
    discountTotal: normalized.discountTotal,
    taxableAmount: normalized.taxableAmount,
    gstAmount: normalized.gstAmount,
    grandTotal: normalized.grandTotal,
    savedAt: new Date(),
    sentAt: order.quotation?.sentAt || null,
    sentBy: order.quotation?.sentBy || null,
  };
  applyUpdateAudit(order, req.user, 'update', 'Quotation created (not sent)');
  await order.save();

  res.json({
    success: true,
    message: 'Quotation created. Use Create and send to notify the customer.',
    data: { order, quotation: order.quotation, workflow: quotationWorkflow(order) },
  });
});

exports.saveQuotationDraft = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'firstName lastName email phone role companyName'
  );
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  if (order.quotation?.status === 'sent') {
    return res.status(400).json({
      success: false,
      message: 'Quotation already sent. It cannot be edited as a draft.',
    });
  }
  if (['cancelled', 'order_received'].includes(order.orderStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot edit quotation for this order status.',
    });
  }

  const normalized = normalizeQuotationPayload(req.body, order.items);
  order.quotation = {
    status: 'draft',
    items: normalized.items,
    courierCharges: normalized.courierCharges,
    gstPercent: normalized.gstPercent,
    itemsSubtotal: normalized.itemsSubtotal,
    discountTotal: normalized.discountTotal,
    taxableAmount: normalized.taxableAmount,
    gstAmount: normalized.gstAmount,
    grandTotal: normalized.grandTotal,
    savedAt: new Date(),
    sentAt: order.quotation?.sentAt || null,
    sentBy: order.quotation?.sentBy || null,
  };
  applyUpdateAudit(order, req.user, 'update', 'Quotation draft saved');
  await order.save();

  res.json({
    success: true,
    data: { order, quotation: order.quotation, workflow: quotationWorkflow(order) },
  });
});

exports.sendQuotation = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'firstName lastName email phone role companyName'
  );
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  if (order.quotation?.status === 'sent') {
    return res.status(400).json({
      success: false,
      message: 'Quotation has already been sent for this enquiry.',
    });
  }
  if (!['enquiry_received', 'pending'].includes(order.orderStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Quotation can only be sent while the enquiry is in Enquiry Received status.',
    });
  }

  const normalized = normalizeQuotationPayload(req.body, order.items);
  const check = validateQuotationForSend(normalized);
  if (!check.ok) {
    return res.status(400).json({ success: false, message: check.message });
  }

  const actor = stampFromUser(req.user);
  const fromStatus = order.orderStatus;

  order.quotation = {
    status: 'sent',
    items: normalized.items,
    courierCharges: normalized.courierCharges,
    gstPercent: normalized.gstPercent,
    itemsSubtotal: normalized.itemsSubtotal,
    discountTotal: normalized.discountTotal,
    taxableAmount: normalized.taxableAmount,
    gstAmount: normalized.gstAmount,
    grandTotal: normalized.grandTotal,
    savedAt: new Date(),
    sentAt: new Date(),
    sentBy: req.user._id,
  };
  order.subtotal = normalized.itemsSubtotal;
  order.discount = normalized.discountTotal;
  order.shippingCost = normalized.courierCharges;
  order.total = normalized.grandTotal;
  order.orderStatus = 'quotation_sent';
  order.statusHistory.push(
    historyEntry({
      status: 'quotation_sent',
      note: 'Quotation created and sent to customer',
      actor,
      role: 'admin',
      fromStatus,
    })
  );
  applyUpdateAudit(order, req.user, 'status_change', 'Quotation sent');
  await order.save();

  setImmediate(async () => {
    try {
      const customer = order.user;
      if (!customer?.email) {
        console.warn('[order] quotation email skipped — customer has no email', order.orderNumber);
        return;
      }
      const when = formatWhen(new Date());
      const name = customerDisplayName(customer, order.billingAddress);
      const mail = customerQuotationSentEmail({
        order,
        customerName: name,
        when,
      });
      await sendMail({
        to: customer.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
      await sendPushToUser(customer._id || customer.id, {
        title: 'Quotation created',
        body: `${order.orderNumber} · ${when}`,
        url: '/account/orders',
        tag: `order-quote-${order.orderNumber}`,
      });
    } catch (err) {
      console.error('[order] quotation email failed:', err.message);
    }
  });

  res.json({
    success: true,
    data: { order, quotation: order.quotation, workflow: quotationWorkflow(order) },
  });
});
