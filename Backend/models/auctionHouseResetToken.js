const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const auctionHouseResetTokenSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'ownerType',
  },
  ownerType: {
    type: String,
    required: true,
    enum: ['AuctionHouseUser', 'AuctionHouse'],
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    expires: 3600,
    default: Date.now,
  },
});

auctionHouseResetTokenSchema.pre('save', async function (next) {
  if (this.isModified('token')) {
    const hash = await bcrypt.hash(this.token, 8);
    this.token = hash;
  }
  next();
});

auctionHouseResetTokenSchema.methods.compareToken = async function (token) {
  if (!token) throw new Error('Password is missing! can not compare');

  try {
    const result = await bcrypt.compare(token, this.token);

    return result;
  } catch (error) {
    console.log('ERROR', error);
  }
};
module.exports = mongoose.model(
  'AuctionHouseResetToken',
  auctionHouseResetTokenSchema,
);
