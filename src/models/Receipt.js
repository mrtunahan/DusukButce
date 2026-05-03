const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    market_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Market', default: null },
    purchase_date: { type: Date, default: null },
    total_amount: { type: mongoose.Decimal128, default: null },
    currency: { type: String, default: 'TRY' },
    image_key: { type: String, required: true },
    raw_ocr_text: { type: String, default: null },
    qr_payload: { type: String, default: null },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'DONE', 'FAILED'],
      default: 'PENDING',
    },
    ocr_confidence: { type: Number, default: null },
    image_phash: { type: String, default: null },
    processing_method: {
      type: String,
      enum: ['QR_ONLY', 'OCR_ONLY', 'QR_PLUS_OCR', 'OCR_PLUS_LLM'],
      default: null,
    },
    error_log: { type: [String], default: [] },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

receiptSchema.index({ user_id: 1, purchase_date: -1 });
receiptSchema.index({ image_phash: 1 }, { unique: true, sparse: true });
receiptSchema.index({ status: 1, created_at: 1 });

module.exports = mongoose.model('Receipt', receiptSchema);
