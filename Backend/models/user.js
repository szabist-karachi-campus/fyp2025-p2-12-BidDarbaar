const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    deviceToken: {
      type: String,
    },
    avatar: {
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
    password: { type: String, required: true },
    verified: {
      type: Boolean,
      default: false,
      required: true,
    },

    wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
    bids: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuctionItem' },
        bidAmount: Number,
        bidTime: Date,
      },
    ],

    superAdmin: {
      type: Boolean,
      default: false,
    },
    favoriteItems: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuctionItem' },
      },
    ],
    wonItems: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuctionItem' },
        winDate: Date,
        status: {
          type: String,
          enum: ['pending', 'delivered','canceled'],
          default: 'pending',
        },
      },
    ],
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
  },

  { timestamps: true },
);

userSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    bcrypt.hash(this.password, 8, (err, hash) => {
      if (err) return next(err);

      this.password = hash;

      next();
    });
  }
});

userSchema.methods.comparePassword = async function (password) {
  if (!password) throw new Error('Password is missing, can not compare');
  try {
    const result = await bcrypt.compare(password, this.password);
    return result;
  } catch (error) {
    console.log('error inside comparePassword method', error.message);
  }
};

userSchema.statics.isThisEmailInUse = async function (email) {
  if (!email) throw new Error('Invalid email');
  try {
    const user = await this.findOne({ email });
    if (user) return false;

    return true;
  } catch (err) {
    console.log('error inside isThisEmailInUse method', err.message);
    return false;
  }
};

userSchema.statics.isThisPhoneInUse = async function (phoneNumber) {
  if (!phoneNumber) throw new Error('Invalid Phone Number');
  try {
    const user = await this.findOne({ phoneNumber });
    if (user) return false;

    return true;
  } catch (err) {
    console.log('error inside isThisPhoneInUse method', err.message);
    return false;
  }
};

module.exports = mongoose.model('User', userSchema);
