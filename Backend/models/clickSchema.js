const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  adId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clickedAt: { type: Date, default: Date.now },
  userAgent: { type: String },
});

module.exports = mongoose.model('Click', clickSchema);
