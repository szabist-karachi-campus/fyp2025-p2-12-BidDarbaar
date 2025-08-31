const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const auctionHouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    deviceToken: {
      type: String,
    },
    avatar: {
      type: String,
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
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'AuctionHouseWallet' },
    stripeConnectedId:{
    type: String,
    required: false,
  },

    listings: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuctionItem' },
      },
    ],
    boostedListings: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuctionItem' },
      },
    ],
    analytics: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuctionItem' },
        views: Number,
        clicks: Number,
      },
    ],
  },
  { timestamps: true },
);

const auctionHouseUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  deviceToken: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  phoneNumber: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  jobTitle: {
    type: String,
    enum: ['sales', 'lister', 'admin'],
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  auctionHouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionHouse',
    required: true,
  },
  
});

auctionHouseSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    bcrypt.hash(this.password, 8, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  }
});

auctionHouseSchema.methods.comparePassword = async function (password) {
  if (!password) throw new Error('Password is missing, can not compare');
  try {
    const result = await bcrypt.compare(password, this.password);
    return result;
  } catch (error) {
    console.log('error inside comparePassword method', error.message);
  }
};

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
auctionHouseUserSchema.statics.isThisEmailInUse = async function (email) {
  if (!email) throw new Error('Invalid email');
  try {
    const auctionHouseUser = await this.findOne({ email });
    if (auctionHouseUser) return false;

    return true;
  } catch (err) {
    console.log('error inside isThisEmailInUse method', err.message);
    return false;
  }
};
auctionHouseUserSchema.statics.isThisPhoneNumberInUse = async function (
  phoneNumber,
) {
  if (!phoneNumber) throw new Error('Invalid phone number');
  try {
    const auctionHouseUser = await this.findOne({ phoneNumber });
    if (auctionHouseUser) return false;

    return true;
  } catch (err) {
    console.log('error inside isThisPhoneNumberInUse method', err.message);
    return false;
  }
};
auctionHouseUserSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    bcrypt.hash(this.password, 8, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  }
});

auctionHouseUserSchema.methods.comparePassword = async function (password) {
  if (!password) throw new Error('Password is missing, can not compare');
  try {
    const result = await bcrypt.compare(password, this.password);
    return result;
  } catch (error) {
    console.log('error inside comparePassword method', error.message);
  }
};

module.exports = {
  AuctionHouse: mongoose.model('AuctionHouse', auctionHouseSchema),
  AuctionHouseUser: mongoose.model('AuctionHouseUser', auctionHouseUserSchema),
};
