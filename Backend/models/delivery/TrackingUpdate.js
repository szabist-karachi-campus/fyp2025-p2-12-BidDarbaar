const mongoose = require('mongoose');

const trackingUpdateSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  status: { type: String, required: true },
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
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TrackingUpdate', trackingUpdateSchema);
