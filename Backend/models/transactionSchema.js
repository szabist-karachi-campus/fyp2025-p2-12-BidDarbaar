const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  advertiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionHouse',
    required: true,
  },
  adId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', required: true },
  amount: { type: Number, required: true },
  transactionType: { type: String, enum: ['debit', 'credit'], required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);
