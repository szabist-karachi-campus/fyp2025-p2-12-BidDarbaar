const PaymentHold = require('../models/paymentHold');
const User = require('../models/user');
const AuctionHouse = require('../models/auctionHouse');
const AuctionItem = require('../models/auctionItem');
const jwt = require('jsonwebtoken');

const Wallet = require('../models/wallet');
const Order = require('../models/delivery/Order');

exports.createPaymentHold = async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header required' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'Token missing' });
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
  const userId = decoded.userId;
  if (!userId) {
    return res.status(400).json({ message: 'User ID not found in token' });
  }
  const { auctionHouseId, auctionItemId, amountHeld } = req.body;

  if (!userId || !auctionHouseId || !auctionItemId || !amountHeld) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Check if user, auction house, and auction item exist
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const auctionHouse =
      await AuctionHouse.AuctionHouse.findById(auctionHouseId);
    if (!auctionHouse)
      return res.status(404).json({ message: 'Auction House not found' });

    const auctionItem = await AuctionItem.findById(auctionItemId);
    if (!auctionItem)
      return res.status(404).json({ message: 'Auction Item not found' });

    // Check if a hold already exists for this user and item
    const existingHold = await PaymentHold.findOne({
      userId,
      auctionItemId,
      status: 'pending',
    });

    if (existingHold) {
      return res
        .status(409)
        .json({ message: 'A pending hold already exists for this item.' });
    }

    const newHold = new PaymentHold({
      userId,
      auctionHouseId,
      auctionItemId,
      amountHeld,
      status: 'pending',
    });

    await newHold.save();
    const userWallet = await Wallet.findByIdAndUpdate(
      user.wallet,
      {
        $inc: { balance: -amountHeld },
      },
      { new: true },
    );
    if (!userWallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    return res.status(201).json({
      message: 'Payment hold created successfully',
      hold: newHold,
    });
  } catch (error) {
    console.error('Error creating payment hold:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    console.log('authHeader', authHeader);
    console.log('body', req.body);
    const { itemid, location } = req.body;
    if (!itemid) {
      return res.status(400).json({ message: 'Item ID is required' });
    }
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header required' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(403).json({ message: 'Token missing' });
    }
    let decoded;

    decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    const item = await AuctionItem.findById(itemid);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    console.log('body2', req.body);

    const hold = await PaymentHold.findOne({
      auctionItemId: itemid,
      userId: userId,
    });
    if (!hold) {
      return res.status(404).send('Payment hold not found');
    }
    const amountToPay = item.currentBid - hold.amountHeld;
    if (amountToPay <= 0) {
      return res.status(400).json({ message: 'Invalid amount to pay' });
    }
    const wallet = await Wallet.findOneAndUpdate(
      { user: userId },
      { $inc: { balance: -amountToPay } },
      { new: true },
    );

    if (!wallet) {
      return res.status(404).send('Wallet not found');
    }
    const updatedHold = await PaymentHold.findByIdAndUpdate(
      hold._id,
      { status: 'completed', amountHeld: item.currentBid },
      { new: true },
    );

    if (!updatedHold) {
      return res.status(404).send('Payment hold not found');
    }
    console.log('Payment hold updated:', item);
    const order = await Order.create({
      userId,
      auctionHouseId: item.auctionHouseId,
      auctionItem: itemid,
      location,
      amount: item.currentBid,
    });
    console.log('✅ Wallet updated:', wallet);
    console.log('✅ Payment hold updated:', updatedHold);
    console.log('✅ Order created:', order);
    return res.status(200).json({
      message: 'Payment hold completed successfully',
      hold: updatedHold,
      wallet,
    });
  } catch (error) {
    console.error('Error in checkout:', error);
    return res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  }
};

exports.isPayable = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const auctionItemId = req.headers.id;
    console.log('auctionItemId', auctionItemId);
    console.log('authHeader', authHeader);
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header required' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(403).json({ message: 'Token missing' });
    }
    let decoded;
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    if (!auctionItemId) {
      return res.status(400).json({ message: 'Auction Item ID is required' });
    }
    const paymentHold = await PaymentHold.findOne({ auctionItemId, userId });
    if (!paymentHold) {
      return res.status(404).json({ message: 'Payment hold not found' });
    }
    const payable = paymentHold.status === 'completed' ? false : true;
    return res.status(200).json({
      message: 'Payment hold found',
      payable,
    });
  } catch (error) {
    console.error('Error checking payment hold:', error);
    return res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  }
};
