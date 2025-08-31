const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'senderModel',
    },
    senderModel: {
      type: String,
      required: true,
      enum: ['User', 'SuperAdmin', 'AuctionHouse'],
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const messageThreadSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'AuctionItem',
    },
    title: {
      type: String,
      required: true,
    },
    initiatorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'initiatorModel',
    },
    initiatorModel: {
      type: String,
      required: true,
      enum: ['User', 'SuperAdmin', 'AuctionHouse'],
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'receiverModel',
    },
    receiverModel: {
      type: String,
      required: true,
      enum: ['User', 'SuperAdmin', 'AuctionHouse'],
    },
    chats: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('MessageThread', messageThreadSchema);