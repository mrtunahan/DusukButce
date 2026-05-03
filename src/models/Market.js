const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    vkn: { type: String, default: null },
    known_aliases: { type: [String], default: [] },
    chain_type: {
      type: String,
      enum: ['DISCOUNT', 'SUPERMARKET', 'HYPERMARKET', 'LOCAL'],
      default: 'SUPERMARKET',
    },
  },
  { timestamps: { createdAt: 'created_at' } }
);

marketSchema.index({ vkn: 1 }, { unique: true, sparse: true });
marketSchema.index({ known_aliases: 1 });

module.exports = mongoose.model('Market', marketSchema);
