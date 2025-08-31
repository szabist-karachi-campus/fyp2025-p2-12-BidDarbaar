const mongoose = require('mongoose');
const auctionHouse = require('../auctionHouse');

const deliveryAgentSchema = new mongoose.Schema({
  name: String,
  phone: String,
  auctionHouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuctionHouse' },
  isAvailable: { type: Boolean, default: true },
});

module.exports = mongoose.model('DeliveryAgent', deliveryAgentSchema);
