const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const superAdminSchema = new mongoose.Schema(
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
    email: {
      type: String,
      unique: true,
      required: true,
    },
    superAdmin: {
      type: Boolean,
      default: true,
    },
    password: { type: String, required: true },
  },

  { timestamps: true },
);

superAdminSchema.methods.comparePassword = async function (password) {
  if (!password) throw new Error('Password is missing, can not compare');
  try {
    console.log('Plain Password:', password);
    console.log('Hashed Password in DB:', this.password);

    const result = await bcrypt.compare(password, this.password);
    console.log('Password Match Result:', result);

    return result;
  } catch (error) {
    console.log('error inside comparePassword method', error.message);
    return false;
  }
};

superAdminSchema.statics.isThisEmailInUse = async function (email) {
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

module.exports = mongoose.model('SuperAdmin', superAdminSchema);
