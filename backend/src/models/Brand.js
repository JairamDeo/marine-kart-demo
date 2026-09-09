const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: {
      url: { type: String, required: true },
      public_id: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Brand', brandSchema);
