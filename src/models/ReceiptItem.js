const mongoose = require('mongoose');

const receiptItemSchema = new mongoose.Schema(
  {
    receipt_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    raw_name: { type: String, required: true },
    normalized_name: { type: String, default: null },
    unit_price: { type: mongoose.Decimal128, required: true },
    quantity: { type: mongoose.Decimal128, default: 1 },
    line_total: { type: mongoose.Decimal128, required: true },
    kdv_rate: { type: Number, enum: [1, 10, 20], default: 10 },
    match_confidence: { type: Number, default: null },
  },
  { timestamps: { createdAt: 'created_at' } }
);

receiptItemSchema.index({ receipt_id: 1 });
receiptItemSchema.index({ product_id: 1 });

module.exports = mongoose.model('ReceiptItem', receiptItemSchema);
