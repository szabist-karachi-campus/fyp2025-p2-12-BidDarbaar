const SuperAdmin = require('../models/superAdmin/superAdmin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Ad = require('../models/adSchema');
const expiresIn = '1d';
const AuctionHouseWallet = require('../models/auctionWallet');
const Order = require('../models/delivery/Order');
const AuctionItem = require('../models/auctionItem');
const User = require('../models/user');
const auctionItem = require('../models/auctionItem');

const AuctionHouse = require('../models/auctionHouse');
const DeliveryAgent = require('../models/delivery/DeliveryAgent');
const auctionCategories = require('../models/auctionCategories.js');
const Categories = require('../models/auctionCategories.js');
const WaitingList = require('../models/waitingList.js');

exports.superAdminSignIn = async (req, res) => {
  const { email, password, deviceToken } = req.body;
  const user = await SuperAdmin.findOne({ email });
  console.log('user', password);
  if (!user)
    return res.status(401).json({ success: false, message: 'User not found!' });
  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    return res
      .status(400)
      .json({ success: false, message: 'Invalid password' });
  const token = jwt.sign({ adminId: user._id }, process.env.JWT_SECRET, {
    expiresIn: expiresIn,
  });
  if (deviceToken) {
    const updatedUser = await SuperAdmin.findByIdAndUpdate(
      user._id,
      { deviceToken: deviceToken },
      { new: true },
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'Failed to update user' });
    }
    console.log('Device token updated successfully');
  }
  return res.json({
    success: true,
    user,
    message: 'User signed in!',
    token,
    expiresAt: expiresIn,
  });
};

exports.createSuperAdmin = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'All fields are required!' });
  }
  const existingUser = await SuperAdmin.findOne({ email });
  if (existingUser) {
    return res
      .status(400)
      .json({ success: false, message: 'User already exists!' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new SuperAdmin({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  });
  try {
    await newUser.save();
    return res
      .status(201)
      .json({ success: true, message: 'User created successfully!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllAuctionHouses = async (req, res) => {
  try {
    const auctionHouses = await AuctionHouse.AuctionHouse.find();
    return res.status(200).json({ success: true, auctionHouses });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error });
  }
};

exports.deleteAuctionHouse = async (req, res) => {
  const auctionHouseId = req.body.auctionHouseId;
  console.log('auctionHouseId', auctionHouseId);

  try {
    const auctionHouse =
      await AuctionHouse.AuctionHouse.findById(auctionHouseId);
    if (!auctionHouse) {
      return res
        .status(404)
        .json({ success: false, message: 'Auction house not found' });
    }

    const auctionItems = await AuctionItem.find({ auctionHouseId });
    const auctionItemIds = auctionItems.map((item) => item._id);
    const now = new Date();

    const hasUndeliveredOrders = await Order.exists({
      auctionItemId: { $in: auctionItemIds },
      deliveryStatus: { $ne: 'delivered' },
    });

    const hasActiveAds = await Ad.exists({
      advertiserId: auctionHouseId,
      isActive: true,
    });

    const hasActiveBidding = await AuctionItem.exists({
      auctionHouseId,
      status: 'active',
      BiddingEndTime: { $gt: now },
    });

    const shouldSuspend =
      hasUndeliveredOrders || hasActiveAds || hasActiveBidding;

    if (shouldSuspend) {
      await AuctionHouse.AuctionHouse.findByIdAndUpdate(
        auctionHouseId,
        { accountStatus: 'suspended' },
        { new: true },
      );

      await Ad.updateMany(
        { advertiserId: auctionHouseId, isActive: true },
        { isActive: false },
      );

      await AuctionItem.updateMany(
        {
          auctionHouseId,
          status: 'active',
          BiddingEndTime: { $gt: now },
        },
        {
          $set: {
            BiddingStartTime: null,
            BiddingEndTime: null,
            status: 'suspended',
          },
        },
      );

      return res.status(200).json({
        success: true,
        message:
          'Auction house suspended. Ads deactivated and biddings stopped.',
      });
    }

    await auctionCategories.updateMany(
      { items: { $in: auctionItemIds } },
      { $pull: { items: { $in: auctionItemIds } } },
    );
    await User.updateMany(
      { 'favoriteItems.itemId': { $in: auctionItemIds } },
      { $pull: { favoriteItems: { itemId: { $in: auctionItemIds } } } },
    );

    await User.updateMany(
      { 'wonItems.itemId': { $in: auctionItemIds } },
      { $pull: { wonItems: { itemId: { $in: auctionItemIds } } } },
    );
    await AuctionHouse.AuctionHouseUser.deleteMany({ auctionHouseId });
    await Ad.deleteMany({ advertiserId: auctionHouseId });
    await AuctionHouseWallet.deleteMany({ AuctionHouse: auctionHouseId });
    await AuctionHouse.AuctionHouse.findByIdAndDelete(auctionHouseId);
    await DeliveryAgent.deleteMany({ auctionHouseId });
    await Order.deleteMany({ auctionHouseId });
    return res.status(200).json({
      success: true,
      message: 'Auction house and related data deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting auction house:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res
      .status(200)
      .json({ success: true, message: 'Users fetched successfully', users });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error });
  }
};
exports.getUser = async (req, res) => {
  const userId = req.body.id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }
    return res
      .status(200)
      .json({ success: true, message: 'User fetched successfully', user });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error });
  }
};

exports.getCategory = async (req, res) => {
  const categoryId = req.headers['id'];
  console.log('categoryId', categoryId);

  if (!categoryId) {
    return res
      .status(400)
      .json({ success: false, message: 'Category ID is required' });
  }
  try {
    const category = await Categories.findById(categoryId).populate('items');
    console.log('category', category);
    return res
      .status(200)
      .json({
        success: true,
        message: 'Categories fetched successfully',
        category,
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error?.message,
      stack: error?.stack,
    });
  }
};

exports.fetchAuctionItem = async (req, res) => {
  const itemId = req.headers['itemid'];

  try {
    const auctionItems = await auctionItem.findById(itemId);
    if (!auctionItems) {
      return res.status(404).json({ message: 'Auction Item not found!' });
    }

    return res
      .status(200)
      .json({
        success: true,
        message: 'Auction Item fecthed successfully',
        auctionItems,
      });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch auction items', error: error.message });
  }
};

exports.getSuperAdmin = async (req, res) => {
  try {
    const superAdmin = await SuperAdmin.find();
    if (!superAdmin) {
      return res
        .status(404)
        .json({ success: false, message: 'Super Admin not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Super Admin fetched successfully',
      superAdmin,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error });
  }
};

exports.getWaitingList = async (req, res) => {
  console.log("entered getWaitingList")
  const superAdmin=req.superAdmin
  const waitingList=await WaitingList.find()
  if (!waitingList || waitingList.length === 0) {
    console.log("no users in waiting list")
    return res.status(200).json({ message: 'No users in the waiting list',waitingList});
  }
  console.log("returning waiting list")
  return res.status(200).json({
    success: true,
    message: 'Waiting list fetched successfully',
    waitingList,
    superAdmin,
  });
}
exports.handleAuctionHouseStatus = async (req, res) => {
const { status, email } = req.body;
console.log("req.body", req.body);
  if (!status) {
    return res.json({
      success: false,
      message: "Invalid status, kindly provide valid status",
    });
  }
  if (status !== "APPROVE" && status !== "REJECT") {
    return res.json({
      success: false,
      message: "Invalid status, kindly provide valid status",
    });
  }
  if (!email) {
    return res.json({
      success: false,
      message: "Email is required",
    });
  }
  try {
    const waitingAuctionHouse=await WaitingList.findOne({ email });
    if (!waitingAuctionHouse) {
      return res.status(404).json({
        success: false,
        message: "Auction house not found in waiting list",
      });
    }
    if(status==="APPROVE"){
       const newAuctionHouse = await  AuctionHouse.AuctionHouse.create({
      name: waitingAuctionHouse.name,
      ntn: waitingAuctionHouse.ntn,
      email: waitingAuctionHouse.email,
      location: waitingAuctionHouse.location,
      phoneNumber: waitingAuctionHouse.phoneNumber,
      password: waitingAuctionHouse.password,
      verified:waitingAuctionHouse.verified
    });

    const wallet = await AuctionHouseWallet.create({
  AuctionHouse: newAuctionHouse._id,
});
    const updatedAuctionHouse =
      await AuctionHouse.AuctionHouse.findByIdAndUpdate(
        newAuctionHouse._id,
        { wallet: wallet._id },
        { new: true, runValidators: true },
      );
    if (!updatedAuctionHouse) {
      return res.status(404).json({
        success: false,
        message: "Failed to update auction house with wallet",
      });
    }
    await WaitingList.findOneAndDelete({ email });
    return res.status(200).json({
      success: true,
      message: "Auction house approved and added successfully",
      auctionHouse: updatedAuctionHouse,
    });
    }
    
    if (status === "REJECT") {
      await WaitingList.findOneAndDelete({ email });
      return res.status(200).json({
        success: true,
        message: "Auction house rejected and removed from waiting list",
      });
    }
  } catch (error) {
    console.error("Error handling auction house status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
    
  }
}