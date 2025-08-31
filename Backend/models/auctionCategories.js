const mongoose = require('mongoose');

const auctionCategories = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuctionItem',
    },
  ],
});

module.exports = mongoose.model('AuctionCategories', auctionCategories);
