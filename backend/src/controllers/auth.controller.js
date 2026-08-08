const User = require('../models/User');
const env = require('../config/env');
const { signToken } = require('../utils/token');
const { asyncHandler } = require('../utils/helpers');
const { sendMail, sendMailToAdmins } = require('../utils/mail');
const {
  verificationOtpEmail,
  welcomeEmail,
  adminNewUserEmail,
} = require('../utils/emailTemplates');
const {
  generateOtp,
  hashOtp,
  otpExpiresAt,
  isOtpExpired,
  otpMatches,
} = require('../utils/otp');

function splitFullName(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: 'User', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function displayName(user) {
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'there';
}

/** Normalize account type / role hint from client. */
function normalizeAccountType(value) {
  const v = String(value || '').toLowerCase().trim();
  if (v === 'admin') return 'admin';
  if (v === 'corporate' || v === 'dealer') return 'corporate';
  if (v === 'customer' || v === 'normal') return 'customer';
  return '';
}

/** Mongo role filter so corporate matches legacy dealer too. */
function roleFilter(accountType) {
  const type = normalizeAccountType(accountType);
  if (type === 'admin') return { role: 'admin' };
  if (type === 'corporate') return { role: { $in: ['corporate', 'dealer'] } };
  if (type === 'customer') return { role: 'customer' };
  return {};
}

function loginUrlForUser(user) {
  const role = user.role === 'dealer' ? 'corporate' : user.role;
  const base = String(env.frontendUrl || '').replace(/\/$/, '');
  if (role === 'corporate') return `${base}/login?type=corporate`;
  if (role === 'admin') return `${base}/admin/login`;
  return `${base}/login`;
}

async function issueAndSendOtp(user) {
  const code = generateOtp();
  user.emailOtpHash = hashOtp(code);
  user.emailOtpExpires = otpExpiresAt();
  await user.save();

  const mail = verificationOtpEmail({ name: displayName(user), code });
  const result = await sendMail({
    to: user.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
  return result;
}

async function sendPostVerificationEmails(user) {
  const role = user.role === 'dealer' ? 'corporate' : user.role;
  const welcome = welcomeEmail({
    name: displayName(user),
    loginUrl: loginUrlForUser(user),
    accountType: role,
  });
  await sendMail({
    to: user.email,
    subject: welcome.subject,
    html: welcome.html,
    text: welcome.text,
  });

  const adminMail = adminNewUserEmail({ user });
  await sendMailToAdmins({
    subject: adminMail.subject,
    html: adminMail.html,
    text: adminMail.text,
  });
}

exports.register = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const accountType = String(body.accountType || 'customer').toLowerCase();
  const isCorporate = accountType === 'corporate';

  const email = String(body.email || '').trim().toLowerCase();
  const password = body.password;
  const phone = String(body.phone || '').trim();

  if (!email || !password || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Email, mobile and password are required.',
    });
  }

  if (String(password).length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters.',
    });
  }

  const storefrontExists = await User.findOne({
    email,
    role: { $in: ['customer', 'corporate', 'dealer'] },
  });
  if (storefrontExists) {
    const existingType =
      storefrontExists.role === 'corporate' || storefrontExists.role === 'dealer'
        ? 'corporate customer'
        : 'normal customer';
    return res.status(400).json({
      success: false,
      message: `This email is already registered as a ${existingType}. Use a different email for ${
        isCorporate ? 'corporate' : 'normal'
      } registration.`,
    });
  }

  let user;

  if (isCorporate) {
    const companyName = String(body.companyName || '').trim();
    const gstNumber = String(body.gstNumber || '').trim();
    const officeAddress = String(body.officeAddress || body.companyAddress?.line1 || '').trim();
    const city = String(body.city || body.companyAddress?.city || '').trim();
    const state = String(body.state || body.companyAddress?.state || '').trim();
    const postalCode = String(body.postalCode || body.companyAddress?.postalCode || '').trim();
    const contactPersonName = String(body.contactPersonName || '').trim();
    const fullName = String(body.fullName || body.contactPersonName || '').trim();

    if (!companyName || !gstNumber || !officeAddress || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Company name, GST, office address, city, state and pincode are required.',
      });
    }
    if (!contactPersonName && !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Contact person / full name is required.',
      });
    }

    const { firstName, lastName } = splitFullName(fullName || contactPersonName);
    const resolvedName = fullName || contactPersonName || `${firstName} ${lastName}`.trim();

    user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: 'corporate',
      isActive: true,
      emailVerified: false,
      companyName,
      gstNumber,
      annualVolume: String(body.annualVolume || '').trim(),
      designation: String(body.designation || '').trim(),
      companyAddress: {
        line1: officeAddress,
        city,
        state,
        postalCode,
        country: 'India',
      },
      addresses: [
        {
          label: 'Office',
          fullName: resolvedName,
          phone,
          line1: officeAddress,
          line2: '',
          city,
          state,
          postalCode,
          country: 'India',
          isDefault: true,
        },
      ],
      priceMultiplier: 1,
    });
  } else {
    const fullName = String(body.fullName || '').trim();
    let firstName = String(body.firstName || '').trim();
    let lastName = String(body.lastName || '').trim();
    if (fullName) {
      ({ firstName, lastName } = splitFullName(fullName));
    }
    if (!firstName) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    const line1 = String(body.line1 || body.addressLine1 || '').trim();
    const city = String(body.city || '').trim();
    const state = String(body.state || '').trim();
    const postalCode = String(body.postalCode || body.pincode || '').trim();

    if (!line1 || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Address line 1, city, state and pincode are required.',
      });
    }

    user = await User.create({
      firstName,
      lastName: lastName || '-',
      email,
      password,
      phone,
      altPhone: String(body.altPhone || body.alternativeMobile || '').trim(),
      role: 'customer',
      isActive: true,
      emailVerified: false,
      addresses: [
        {
          label: 'Home',
          fullName: fullName || `${firstName} ${lastName}`.trim(),
          phone,
          line1,
          line2: String(body.line2 || body.addressLine2 || '').trim(),
          city,
          state,
          postalCode,
          country: 'India',
          isDefault: true,
        },
      ],
    });
  }

  const mailResult = await issueAndSendOtp(user);
  if (!mailResult.ok && !mailResult.skipped) {
    console.warn('[register] OTP email failed for', email);
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify the code sent to your email.',
    data: {
      needsVerification: true,
      email: user.email,
      accountType: isCorporate ? 'corporate' : 'customer',
    },
  });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || req.body.otp || '').trim();
  const accountType =
    normalizeAccountType(req.body.accountType || req.body.role) || 'customer';

  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
  }

  const user = await User.findOne({ email, ...roleFilter(accountType) }).select(
    '+password +emailOtpHash +emailOtpExpires'
  );
  if (!user) {
    return res.status(404).json({ success: false, message: 'Account not found.' });
  }

  if (user.emailVerified !== false) {
    const token = signToken(user._id);
    return res.json({
      success: true,
      message: 'Email already verified.',
      data: { user: user.toSafeObject(), token },
    });
  }

  if (isOtpExpired(user.emailOtpExpires)) {
    return res.status(400).json({
      success: false,
      message: 'OTP expired. Please resend a new code.',
      data: { code: 'OTP_EXPIRED' },
    });
  }

  if (!otpMatches(code, user.emailOtpHash)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification code.',
      data: { code: 'OTP_INVALID' },
    });
  }

  user.emailVerified = true;
  user.emailOtpHash = '';
  user.emailOtpExpires = null;
  await user.save();

  await sendPostVerificationEmails(user);

  const token = signToken(user._id);
  res.json({
    success: true,
    message: 'Email verified successfully.',
    data: { user: user.toSafeObject(), token },
  });
});

exports.resendOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const accountType =
    normalizeAccountType(req.body.accountType || req.body.role) || 'customer';
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const user = await User.findOne({ email, ...roleFilter(accountType) }).select(
    '+emailOtpHash +emailOtpExpires'
  );
  if (!user) {
    return res.status(404).json({ success: false, message: 'Account not found.' });
  }

  if (user.emailVerified !== false) {
    return res.json({ success: true, message: 'Email is already verified. You can sign in.' });
  }

  const mailResult = await issueAndSendOtp(user);
  if (mailResult.skipped) {
    return res.status(503).json({
      success: false,
      message: 'Email service is not configured. Please contact support.',
    });
  }
  if (!mailResult.ok) {
    return res.status(502).json({
      success: false,
      message: 'Could not send verification email. Please try again.',
    });
  }

  res.json({
    success: true,
    message: 'A new verification code has been sent to your email.',
    data: { email: user.email, accountType },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const { password } = req.body;
  const accountType =
    normalizeAccountType(req.body.accountType || req.body.expectedRole || req.body.role) ||
    'customer';

  const user = await User.findOne({ email, ...roleFilter(accountType) }).select(
    '+password +emailOtpHash +emailOtpExpires'
  );
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account is deactivated.' });
  }

  if (user.emailVerified === false) {
    const type = user.role === 'dealer' ? 'corporate' : user.role;
    return res.status(403).json({
      success: false,
      message: 'Account not verified. Please enter the OTP sent to your email.',
      data: {
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
        accountType: type,
        needsVerification: true,
      },
    });
  }

  const token = signToken(user._id);

  res.json({
    success: true,
    message: 'Login successful.',
    data: { user: user.toSafeObject(), token },
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeObject() } });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { firstName, lastName, phone },
    { new: true, runValidators: true }
  );

  res.json({ success: true, data: { user: user.toSafeObject() } });
});

exports.addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const body = req.body || {};

  const address = {
    label: String(body.label || 'Home').trim() || 'Home',
    fullName: String(body.fullName || `${user.firstName} ${user.lastName}`.trim()).trim(),
    phone: String(body.phone || user.phone || '').trim(),
    line1: String(body.line1 || '').trim(),
    line2: String(body.line2 || '').trim(),
    city: String(body.city || '').trim(),
    state: String(body.state || '').trim(),
    postalCode: String(body.postalCode || '').trim(),
    country: String(body.country || 'India').trim() || 'India',
    isDefault: Boolean(body.isDefault),
  };

  if (!address.line1 || !address.city || !address.state || !address.postalCode) {
    return res.status(400).json({
      success: false,
      message: 'Address line 1, city, state and pincode are required.',
    });
  }

  if (address.isDefault || user.addresses.length === 0) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
    address.isDefault = true;
  }

  user.addresses.push(address);
  await user.save();
  res.status(201).json({
    success: true,
    data: { addresses: user.addresses, user: user.toSafeObject() },
  });
});

exports.setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.id);
  if (!address) {
    return res.status(404).json({ success: false, message: 'Address not found.' });
  }
  user.addresses.forEach((a) => {
    a.isDefault = String(a._id) === String(address._id);
  });
  await user.save();
  res.json({ success: true, data: { addresses: user.addresses, user: user.toSafeObject() } });
});
