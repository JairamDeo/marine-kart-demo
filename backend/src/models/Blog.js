const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    category: { type: String, default: 'General' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPublished: { type: Boolean, default: false },
    seo: {
      title: String,
      description: String,
      keywords: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);
