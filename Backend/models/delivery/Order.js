const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
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
    auctionItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuctionItem',
      required: true,
    },
    location: {
      xAxis: {
        type: Number,
        required: true,
      },
      yAxis: {
        type: Number,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled','disput'],
      default: 'pending',
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryAgent',
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Order', orderSchema);
