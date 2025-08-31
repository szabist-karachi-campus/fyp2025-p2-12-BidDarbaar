const mongoose = require('mongoose');
const auctionItem = require('./auctionItem');

const adSchema = new mongoose.Schema({
  auctionItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionItem',
    required: true,
  },
  advertiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionHouse',
    required: true,
  },
  budget: { type: Number, required: true }, 
  bidAmount: { type: Number, required: true }, 
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
});

module.exports = mongoose.model('Ad', adSchema);
