const mongoose = require('mongoose');

const auctionItemSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    startingBid: Number,
    avatar: [String],
    boosted: { type: Boolean, default: false },
    BiddingStartTime: Date,
    BiddingDate: Date,
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AuctionCategories',
        required: true,
      },
    ],
    views: { type: Number, default: 0 },
    currentBid: { type: Number, default: 0 },
    currentBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bids: [
      {
        bidderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        bidAmount: Number,
        bidTime: Date,
      },
    ],
    auctionHouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuctionHouse',
    },
    BiddingEndTime: Date,
    status: {
      type: String,
      enum: ['active', 'completed', 'suspended'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuctionHouseUser',
    },
  },
  { timestamps: true },
);

auctionItemSchema.path('categories').validate(function (categories) {
  return categories.length <= 5;
}, 'You can select up to 5 categories only.');
module.exports = mongoose.model('AuctionItem', auctionItemSchema);
