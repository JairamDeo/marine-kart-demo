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
const { sendMail, sendMailToAdmins } = require('../utils/mail');
const {
  adminNewOrderEmail,
  customerOrderStatusEmail,
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

    const maxQty = Number(product.maxOrderQty);
    if (Number.isFinite(maxQty) && maxQty > 0 && item.quantity > maxQty) {
      const err = new Error(
        `You can select up to ${Math.floor(maxQty)} of "${product.name}" at a time.`
      );
      err.statusCode = 400;
      throw err;
    }

    const unit =
      Math.round((product.salePrice ?? product.price) * multiplier * 100) / 100;
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
        orderStatus: 'pending',
        notes,
        statusHistory: [
          historyEntry({
            status: 'pending',
            note: 'Order placed',
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
        title: 'New order',
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
          : 'You cannot cancel after the order is shipped or delivered.',
    });
  }

  const fromStatus = order.orderStatus;
  const role = actorRoleLabel(req.user);
  const actor = stampFromUser(req.user);
  const note = `Cancelled by ${role === 'corporate' ? 'corporate customer' : 'customer'}: ${actor.name}`;

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
  applyUpdateAudit(order, req.user, 'status_change', `Cancelled (was ${fromStatus})`);
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
  const allowed = getAllowedAdminStatuses(order.orderStatus);
  res.json({
    success: true,
    data: {
      order,
      workflow: {
        nextStatus: allowed.next,
        canCancel: allowed.canCancel,
        allowedStatuses: allowed.options,
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
  let auditNote = '';
  let statusChangedTo = null;

  if (orderStatus && orderStatus !== order.orderStatus) {
    const check = validateAdminStatusChange(order.orderStatus, orderStatus);
    if (!check.ok) {
      return res.status(400).json({ success: false, message: check.message });
    }
    const fromStatus = order.orderStatus;
    order.orderStatus = orderStatus;
    statusChangedTo = orderStatus;
    if (check.cancel) {
      const cancelNote =
        note ||
        `Cancelled by admin: ${actor.name}${actor.email ? ` (${actor.email})` : ''}`;
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
    } else {
      order.statusHistory.push(
        historyEntry({
          status: orderStatus,
          note: note || `Status updated to ${orderStatus}`,
          actor,
          role: 'admin',
          fromStatus,
        })
      );
    }
    auditNote = `Status ${fromStatus} → ${orderStatus}`;
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
          const label = statusLabel(order.orderStatus);
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

  const allowed = getAllowedAdminStatuses(order.orderStatus);
  res.json({
    success: true,
    data: {
      order,
      workflow: {
        nextStatus: allowed.next,
        canCancel: allowed.canCancel,
        allowedStatuses: allowed.options,
      },
    },
  });
});
