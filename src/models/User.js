const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    preferences: {
      favorite_categories: { type: [String], default: [] },
      notification_enabled: { type: Boolean, default: true },
      inflation_alert_threshold: { type: Number, default: 0.1 },
    },
    refresh_token_hash: { type: String, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
