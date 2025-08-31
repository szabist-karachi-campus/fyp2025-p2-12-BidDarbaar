const mongoose = require('mongoose');

const auctionHouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
   
   
    ntn: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
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
    phoneNumber: {
      type: String,
      unique: true,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    password: { type: String, required: true },
    createdAt: {
      type: Date,
      default: Date.now,
    },
   
  },
  { timestamps: true },
);



auctionHouseSchema.statics.isThisEmailInUse = async function (email) {
  if (!email) throw new Error('Invalid email');
  try {
    const auctionHouse = await this.findOne({ email });
    if (auctionHouse) return false;

    return true;
  } catch (err) {
    console.log('error inside isThisEmailInUse method', err.message);
    return false;
  }
};

auctionHouseSchema.statics.isThisNtnInUse = async function (ntn) {
  if (!ntn) throw new Error('Invalid NTN');
  try {
    const auctionHouse = await this.findOne({ ntn });
    if (auctionHouse) return false;

    return true;
  } catch (err) {
    console.log('error inside isThisNtnInuse method', err.message);
    return false;
  }
};
auctionHouseSchema.statics.isThisPhoneNumberInUse = async function (
  phoneNumber,
) {
  if (!phoneNumber) throw new Error('Invalid phone number');
  try {
    const auctionHouse = await this.findOne({ phoneNumber });
    if (auctionHouse) return false;

    return true;
  } catch (err) {
    console.log('error inside isThisPhoneNumberInUse method', err.message);
    return false;
  }
};

module.exports = mongoose.model('WaitingAuctionHouse', auctionHouseSchema);
