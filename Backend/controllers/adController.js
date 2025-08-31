const Ad = require('../models/adSchema');
const Click = require('../models/clickSchema');
const jwt = require('jsonwebtoken');
const auctionHouse = require('../models/auctionHouse');
const Transaction = require('../models/transactionSchema.js');
const User = require('../models/user');
const AuctionItem = require('../models/auctionItem');
const AuctionHouse = require('../models/auctionHouse');
const Wallet = require('../models/wallet');
const AuctionHouseWallet = require('../models/auctionWallet.js');


exports.createAd = async (req, res) => {
  try {
    const { budget, bidAmount, auctionItemId } = req.body;

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
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const auctionHouseId = decoded.auctionHouseId;
    if (!auctionHouseId) {
      return res.status(400).json({ message: 'Auction House ID is required!' });
    }

    const tempAuctionHouse =
      await auctionHouse.AuctionHouse.findById(auctionHouseId);
    let tempAuctionHouseUser;

    if (!tempAuctionHouse) {
      tempAuctionHouseUser =
        await auctionHouse.AuctionHouseUser.findById(auctionHouseId).populate(
          'auctionHouseId',
        );
      if (!tempAuctionHouseUser) {
        return res
          .status(404)
          .json({ message: 'Auction House or User not found' });
      }
      if (tempAuctionHouseUser.auctionHouseId.accountStatus === 'suspended') {
        return res
          .status(403)
          .json({
            message: 'Your account is suspended. Please contact support.',
          });
      }
      if (!['lister', 'admin'].includes(tempAuctionHouseUser.jobTitle)) {
        return res.status(403).json({
          message:
            'Access denied. Only users with job titles "lister" or "admin" can create ads.',
        });
      }
    }

    const auctionItem = await AuctionItem.findById(auctionItemId);
    if (!auctionItem) {
      return res.status(404).json({ message: 'Auction Item not found' });
    }

    const updatedAuctionItem = await AuctionItem.findByIdAndUpdate(
      auctionItemId,
      { $set: { boosted: true } },
      { new: true },
    );

    const ad = new Ad({
      budget,
      bidAmount,
      auctionItemId,
      advertiserId: tempAuctionHouse
        ? auctionHouseId
        : tempAuctionHouseUser.auctionHouseId,
    });
    await ad.save();

    res.status(201).json({
      message: 'Ad created successfully',
      ad,
      auctionItem: updatedAuctionItem,
    });
  } catch (error) {
    console.error('Error creating ad:', error.message);
    res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  }
};

exports.trackClick = async (req, res) => {
  try {
    const { adId } = req.body;
    const userAgent = req.headers['useragent'];
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, message: 'unauthorized access!' });
    }
    const token = authHeader.split(' ')[1];
    if (!token)
      return res.status(403).json({ success: false, message: 'Token missing' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: 'User ID is required!' });
    }
    const tempUser = await User.findById(userId);
    if (!tempUser) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found!' });
    }
    const ad = await Ad.findById(adId);
    if (!ad || !ad.isActive || ad.budget < ad.bidAmount) {
      return res
        .status(400)
        .json({ error: 'Ad is not active or out of budget' });
    }
    const click = new Click({ adId, userId, userAgent });
    await click.save();

    ad.budget -= ad.bidAmount;
    ad.clicks += 1;
    if (ad.budget <= 0) ad.isActive = false;
    await ad.save();

    const transaction = new Transaction({
      advertiserId: ad.advertiserId,
      adId,
      amount: ad.bidAmount,
      transactionType: 'debit',
    });
    await transaction.save();
    const auctionHouse = await AuctionHouse.AuctionHouse.findById(
      ad.advertiserId,
    );
    if (!auctionHouse) {
      return res.status(404).json({ error: 'Auction House not found' });
    }
    const updatedWallet = await AuctionHouseWallet.findByIdAndUpdate(
      auctionHouse.wallet,
      { $inc: { balance: -ad.bidAmount } },
      { new: true, runValidators: true },
    )
    console.info('Updated Auction House Wallet:', updatedWallet);
    res.status(200).json({ message: 'Click tracked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getAdPerformance = async (req, res) => {
  try {
    const adId = req.headers['id'];
    console.log('Request Headers:', req.headers);
    console.log('Ad ID for performance:', adId);
    const ad = await Ad.findById(adId);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });

    const allClicks = await Click.find({ adId });

    const clicks = allClicks.length;

    const spent = ad.bidAmount * clicks;

    const agentCounts = {};
    const clicksCount=allClicks.length;
    allClicks.forEach((click) => {
      const userAgent = click.userAgent;
      if (agentCounts[userAgent]) {
        agentCounts[userAgent]++;
      } else {
        agentCounts[userAgent] = 1;
      }
    });

    const agents = Object.keys(agentCounts).map((userAgent) => ({
      userAgent,
      count: agentCounts[userAgent],
    }));

    return res.status(200).json({
      ad,
      clicks,
      spent,

      agents,
      totalBudget:ad.budget+ad.bidAmount*clicksCount

    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getActiveAds = async (req, res) => {
  try {
    const ads = await Ad.find({ isActive: true })
      .populate({
        path: 'auctionItemId',
        populate: {
          path: 'categories',
          model: 'AuctionCategories',
        },
      })
      .sort({ bidAmount: -1 });

    const filteredAds = ads.filter((ad) => ad.budget >= ad.bidAmount);

    res.status(200).json({ ads: filteredAds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.editAd = async (req, res) => {
  try {
    const { budget, bidAmount, isActive, itemId } = req.body;
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized access!' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(403).json({ success: false, message: 'Token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const auctionHouseId = decoded.auctionHouseId;

    if (!auctionHouseId) {
      return res
        .status(400)
        .json({ success: false, message: 'Auction House ID is required!' });
    }

    const tempAuctionHouse =
      await auctionHouse.AuctionHouse.findById(auctionHouseId);
    if (!tempAuctionHouse) {
      return res.status(404).json({ message: 'Auction House not found' });
    }
    if (tempAuctionHouse.accountStatus === 'suspended') {
      return res
        .status(403)
        .json({
          message: 'Your account is suspended. Please contact support.',
        });
    }

    const ad = await Ad.findOne({ auctionItemId: itemId, isActive: true });
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    if (ad.advertiserId.toString() !== auctionHouseId) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to edit this ad' });
    }

    if (budget !== undefined) {
      ad.budget = budget;
    }
    if (bidAmount !== undefined) {
      ad.bidAmount = bidAmount;
    }
    if (isActive !== undefined) {
      ad.isActive = isActive;
    }

    await ad.save();

    res.status(200).json({
      message: 'Ad updated successfully',
      ad,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.trackView = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized access!' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(403).json({ success: false, message: 'Token missing' });
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
      return res
        .status(404)
        .json({ success: false, message: 'User not found!' });
    }
    const auctionItemId = req.headers['id'];
    if (!auctionItemId) {
      return res
        .status(400)
        .json({ success: false, message: 'ad ID is required' });
    }
    const tempAd = await Ad.findOne({ auctionItemId });
    if (tempAd) {
      const ad = await Ad.findOneAndUpdate(
        {
          auctionItemId: auctionItemId,
          isActive: true,
        },
        { $inc: { views: 1 } },
        { new: true },
      );
    }

    const item = await AuctionItem.findById(auctionItemId);
    if (!item) {
      return res.status(404).json({ error: 'Auction Item not found' });
    }
    if (!item.status === 'active') {
      return res.status(400).json({ error: 'Auction Item is not active' });
    }
    item.views += 1;
    await item.save();

    return res.status(200).json({
      message: 'View tracked successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBidAmount = async (req, res) => {
  try {
    const activeAds = await Ad.find({ isActive: true });

    if (activeAds.length === 0) {
      return res
        .status(200)
        .json({ message: 'No active ads found', highestBid: 0, averageBid: 0 });
    }

    const highestBid = Math.round(
      Math.max(...activeAds.map((ad) => ad.bidAmount)),
    );
    const averageBid = Math.round(
      activeAds.reduce((sum, ad) => sum + ad.bidAmount, 0) / activeAds.length,
    );

    res.status(200).json({
      highestBid,
      averageBid,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.isItemAdActive = async (req, res) => {
  const itemId = req.headers['id'];
  if (!itemId) {
    return res.status(200).json({ isActive: false });
  }
  try {
    const ad = await Ad.findOne({ auctionItemId: itemId, isActive: true });
    if (ad) {
      return res.status(200).json({ isActive: true });
    } else {
      return res.status(200).json({ isActive: false });
    }
  } catch (error) {
    console.error('Error checking ad status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAd = async (req, res) => {
  const itemId = req.headers['id'];
  if (!itemId) {
    return res.status(400).json({ message: 'Item ID is required' });
  }
  try {
    const ad = await Ad.findOne({ auctionItemId: itemId, isActive: true });
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    res.status(200).json({ ad });
  } catch (error) {
    console.error('Error fetching ad:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAuctionHouseActiveAds = async (req, res) => {
  try {
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
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const auctionHouseId = decoded.auctionHouseId;
    if (!auctionHouseId) {
      return res.status(400).json({ message: 'Auction House ID is required!' });
    }

    const tempAuctionHouse =
      await auctionHouse.AuctionHouse.findById(auctionHouseId);
    let tempAuctionHouseUser;

    if (!tempAuctionHouse) {
      tempAuctionHouseUser =
        await auctionHouse.AuctionHouseUser.findById(auctionHouseId);
      if (!tempAuctionHouseUser) {
        return res
          .status(404)
          .json({ message: 'Auction House or User not found' });
      }

      if (!['admin', 'sales'].includes(tempAuctionHouseUser.jobTitle)) {
        return res.status(403).json({
          message:
            'Access denied. Only users with job titles "admin" or "sales" can view active ads.',
        });
      }
    }

    const effectiveAuctionHouseId = tempAuctionHouse
      ? tempAuctionHouse._id
      : tempAuctionHouseUser.auctionHouseId;

    const ads = await Ad.find({
      isActive: true,
      advertiserId: effectiveAuctionHouseId,
    })
      .populate({
        path: 'auctionItemId',
        populate: {
          path: 'categories',
          model: 'AuctionCategories',
        },
      })
      .sort({ bidAmount: -1 });

    return res.status(200).json({ ads });
  } catch (error) {
    console.error('Error fetching active ads:', error.message);
    res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  }
};
