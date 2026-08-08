const Banner = require('../models/Banner');
const Page = require('../models/Page');
const Blog = require('../models/Blog');
const { asyncHandler, slugify } = require('../utils/helpers');
const { sendMail, sendMailToAdmins } = require('../utils/mail');
const {
  adminNewEnquiryEmail,
  enquiryThankYouEmail,
} = require('../utils/emailTemplates');

exports.getBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find({ isActive: true }).sort('sortOrder');
  res.json({ success: true, data: { banners } });
});

exports.getPage = asyncHandler(async (req, res) => {
  const page = await Page.findOne({ slug: req.params.slug, isActive: true });
  if (!page) {
    return res.status(404).json({ success: false, message: 'Page not found.' });
  }
  res.json({ success: true, data: { page } });
});

exports.contactSubmit = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const subject = String(req.body.subject || '').trim();
  const message = String(req.body.message || '').trim();

  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, subject and message are required.',
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  const adminMail = adminNewEnquiryEmail({ name, email, subject, message });
  const thankYou = enquiryThankYouEmail({ name });

  const [adminResult, userResult] = await Promise.all([
    sendMailToAdmins({
      subject: adminMail.subject,
      html: adminMail.html,
      text: adminMail.text,
    }),
    sendMail({
      to: email,
      subject: thankYou.subject,
      html: thankYou.html,
      text: thankYou.text,
    }),
  ]);

  if (adminResult.skipped && userResult.skipped) {
    return res.status(503).json({
      success: false,
      message: 'Email service is not configured. Please try again later.',
    });
  }

  res.json({
    success: true,
    message: 'Thank you for your enquiry. We will connect with you shortly.',
  });
});

exports.getBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ isPublished: true }).sort('-createdAt');
  res.json({ success: true, data: { blogs } });
});

exports.getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true });
  if (!blog) {
    return res.status(404).json({ success: false, message: 'Blog not found.' });
  }
  res.json({ success: true, data: { blog } });
});

exports.adminUpsertPage = asyncHandler(async (req, res) => {
  const page = await Page.findOneAndUpdate({ slug: req.body.slug }, req.body, {
    new: true,
    upsert: true,
    runValidators: true,
  });
  res.json({ success: true, data: { page } });
});

exports.adminCreateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);
  res.status(201).json({ success: true, data: { banner } });
});

exports.adminCreateBlog = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.slug && payload.title) payload.slug = slugify(payload.title);
  payload.author = req.user._id;
  const blog = await Blog.create(payload);
  res.status(201).json({ success: true, data: { blog } });
});
