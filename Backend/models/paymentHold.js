const mongoose = require('mongoose');

const paymentHoldSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    auctionHouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuctionHouse',
      required: true,
    },
    auctionItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuctionItem',
      required: true,
    },
    amountHeld: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'PKR',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'refunded', 'released'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('PaymentHold', paymentHoldSchema);
