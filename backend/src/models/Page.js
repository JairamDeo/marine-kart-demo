const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: ['about-us', 'contact-us', 'faq', 'privacy-policy', 'delivery-information'],
    },
    title: { type: String, required: true },
    content: { type: String, default: '' },
    meta: {
      phone: String,
      email: String,
      address: String,
      hotline: String,
    },
    faqItems: [
      {
        question: String,
        answer: String,
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Page', pageSchema);
