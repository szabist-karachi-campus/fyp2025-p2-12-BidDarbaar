const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/user');
const Wallet = require('../models/wallet');
const jwt = require('jsonwebtoken');

exports.createPaymentIntent = async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 13900) {
    return res.status(400).send({ success: false, message: 'Invalid amount' });
  }
  console.info('Received amount:', amount);
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: 'User ID is required!' });
  }
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).send('Invalid amount');
  }
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'pkr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId,
      },
    });
    console.log('Payment Intent created:', paymentIntent);
    return res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).send('Server error');
  }
};

exports.updateWallet = async (req, res) => {
  const { amount, userId } = req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: 'User ID is required!' });
  }
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  try {
    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).send('Wallet not found');
    }

    wallet.balance += amount;
    await wallet.save();

    res.status(200).send('Wallet updated successfully');
  } catch (err) {
    console.error('Error updating wallet:', err);
    res.status(500).send('Server error');
  }
};

exports.getWallet = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: 'User ID is required!' });
  }
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  try {
    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return res
        .status(404)
        .json({ success: false, message: 'Wallet not found' });
    }
    return res.status(200).json({
      success: true,
      wallet,
      message: 'Wallet retrieved!',
    });
  } catch (err) {
    console.error('Error fetching wallet:', err);
    res.status(500).send('Server error');
  }
};



