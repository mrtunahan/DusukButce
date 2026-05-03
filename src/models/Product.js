const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    canonical_name: { type: String, required: true },
    brand: { type: String, default: null },
    category: { type: String, default: null },
    unit: { type: String, enum: ['L', 'ML', 'KG', 'G', 'ADET', 'PAKET'], default: 'ADET' },
    unit_size: { type: mongoose.Decimal128, default: null },
    tokens: { type: [String], default: [] },
    current_avg_price: { type: mongoose.Decimal128, default: null },
    last_seen_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at' } }
);

productSchema.index({ tokens: 1 });
productSchema.index({ canonical_name: 'text' });
productSchema.index({ brand: 1, category: 1 });

module.exports = mongoose.model('Product', productSchema);
