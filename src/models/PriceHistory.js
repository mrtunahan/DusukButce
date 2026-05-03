const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    market_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Market', required: true },
    receipt_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', required: true },
    price: { type: mongoose.Decimal128, required: true },
    observed_at: { type: Date, required: true },
    kdv_rate: { type: Number, enum: [1, 10, 20], default: 10 },
  },
  { timestamps: { createdAt: 'created_at' } }
);

priceHistorySchema.index({ product_id: 1, observed_at: -1 });
priceHistorySchema.index({ product_id: 1, market_id: 1, observed_at: -1 });
priceHistorySchema.index({ market_id: 1, observed_at: -1 });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
