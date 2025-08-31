const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AuctionHouse = require('../models/auctionHouse');
const AuctionHouseWallet = require('../models/auctionWallet');
const User = require('../models/user');
const Wallet = require('../models/wallet');
const jwt = require('jsonwebtoken');
const axios = require('axios');

exports.createAuctionPaymentIntent = async (req, res) => {
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
  const decodedAuctionHouseId = decoded.auctionHouseId;
  if (!decodedAuctionHouseId) {
    return res
      .status(400)
      .json({ success: false, message: 'Auction House ID is required!' });
  }
  const tempAuctionHouse = await AuctionHouse.AuctionHouse.findById(
    decodedAuctionHouseId,
  );
  if (!tempAuctionHouse) {
    return res.status(404).json({ message: 'AuctionHouse not found' });
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
        AuctionHouse: decodedAuctionHouseId,
      },
    });
    console.log('Payment Intent created:', paymentIntent);
    return res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).send('Server error');
  }
};

exports.updateAuctionWallet = async (req, res) => {
  const { amount, auctionHouseId } = req.body;

  if (!auctionHouseId) {
    return res
      .status(400)
      .json({ success: false, message: 'Auction House ID is required!' });
  }
  const tempAuctionHouse =
    await AuctionHouse.AuctionHouse.findById(auctionHouseId);
  if (!tempAuctionHouse) {
    return res.status(404).json({ message: 'Auction House not found' });
  }
  try {
    const wallet = await AuctionHouseWallet.findOne({
      AuctionHouse: auctionHouseId,
    });

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

exports.getAuctionWallet = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const decodedAuctionHouseId = decoded.auctionHouseId;
  if (!decodedAuctionHouseId) {
    return res
      .status(400)
      .json({ success: false, message: 'Auction House ID is required!' });
  }
  const tempAuctionHouse = await AuctionHouse.AuctionHouse.findById(
    decodedAuctionHouseId,
  );
  if (!tempAuctionHouse) {
    return res.status(404).json({ message: 'Auction House not found' });
  }
  try {
    const wallet = await AuctionHouseWallet.findOne({
      AuctionHouse: decodedAuctionHouseId,
    });

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



exports.ConnectStripe = async (req, res) => {
  const authHeader = req.headers['authorization'];
  console.log("authHeader", authHeader)
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: 'Authorization header required' });
  }
  const token = authHeader.split(' ')[1];
  console.log("token", token)
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const decodedAuctionHouseId = decoded.auctionHouseId;
  console.log("decodedAuctionHouseId", decodedAuctionHouseId)
  if (!decodedAuctionHouseId) {
    return res
      .status(400)
      .json({ success: false, message: 'Auction House ID is required!' });
  }
  const auctionHouse = await AuctionHouse.AuctionHouse.findById(decodedAuctionHouseId);
  if (!auctionHouse) {
    return res.status(404).json({ message: 'Auction House not found' });
  }
  try {
    const account = await stripe.accounts.create({
      type: "express",
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    });

    await AuctionHouse.AuctionHouse.findByIdAndUpdate(auctionHouse.id, {
      stripeConnectedId: account.id,
    },{
      new: true,
      runValidators: true,
    });

    
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "http://localhost:8000/reauth", 
      return_url: "http://localhost:8000/complete",
      type: "account_onboarding",
    });
    return res.status(200).json({
      success: true,
      message: "Connecting Stripe account initiated",
      url: accountLink.url,
    });
  } catch (error) {
    console.error("❌ Error in Connect:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while connecting Stripe",
      error: error.message,
    });
  }
};






exports.WithdrawVendorMoney = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authorization header required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const decodedAuctionHouseId = decoded.auctionHouseId;
    if (!decodedAuctionHouseId) {
      return res.status(400).json({ success: false, message: 'Auction House ID is required!' });
    }

    const auctionHouse = await AuctionHouse.AuctionHouse.findById(decodedAuctionHouseId);
    if (!auctionHouse) {
      return res.status(404).json({ message: 'Auction House not found' });
    }

    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
        error: "Invalid amount",
      });
    }

    const wallet = await AuctionHouseWallet.findOne({ AuctionHouse: auctionHouse.id });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
        error: "Insufficient balance",
      });
    }

    const connectedAccountId = auctionHouse.stripeConnectedId;
    if (!connectedAccountId) {
      return res.status(400).json({
        success: false,
        message: "Auction House is not connected to Stripe",
        error: "Auction House is not connected to Stripe",
      });
    }

    const conversionUrl = `https://api.exchangerate.host/convert?access_key=ff32f68fffdce8d9ce7f706544685960&from=PKR&to=USD&amount=${amount}`;
    const convertRes = await axios.get(conversionUrl);
    console.log("convertRes", convertRes.data);
    const convertData = convertRes.data;
     if (!convertData.success || !convertData.result) {
      return res.status(400).json({
        success: false,
        message: "Failed to fetch exchange rate",
        error: "Currency conversion failed",
      });
    }

    const amountInUSD = parseFloat(convertData.result.toFixed(2));
    const amountInCents = Math.round(amountInUSD * 100);


    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: "usd",
      destination: connectedAccountId,
      description: `Withdrawal for auction house ${auctionHouse.id}`,
    });

    wallet.balance -= amount;
    await wallet.save();

    return res.status(200).json({
      success: true,
      message: "Withdrawal successful",
      transfer,
    });

  } catch (error) {
    console.error("Withdrawal error:", error.message);
    return res.status(400).json({
      success: false,
      message: "Error occurred while withdrawing money",
      error: error.message,
    });
  }
};