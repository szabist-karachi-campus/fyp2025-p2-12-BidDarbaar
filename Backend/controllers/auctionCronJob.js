const cron = require('node-cron');
const AuctionItem = require('../models/auctionItem');
const User = require('../models/user');
const Ad = require('../models/adSchema');
const AuctionHouse = require('../models/auctionHouse');
const Order = require('../models/delivery/Order');
const DeliveryAgent = require('../models/delivery/DeliveryAgent');
const AuctionHouseWallet = require('../models/auctionWallet');
const auctionCategories = require('../models/auctionCategories');
const PaymentHold = require('../models/paymentHold');
const Wallet = require('../models/wallet');

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();

    const endedAuctions = await AuctionItem.find({
      BiddingEndTime: { $lt: now },
      status: 'active',
    });

    for (const auction of endedAuctions) {
      auction.status = 'completed';
      await auction.save();

      if (auction.currentBidder) {
        const user = await User.findById(auction.currentBidder);
        if (user) {
          await User.updateOne(
            { _id: user._id, 'wonItems.itemId': { $ne: auction._id } },
            {
              $addToSet: {
                wonItems: {
                  itemId: auction._id,
                  winDate: now,
                  status: 'pending',
                },
              },
            },
          );
        }
      }

      await Ad.updateMany(
        { auctionItemId: auction._id, isActive: true },
        { $set: { isActive: false } },
      );

      const activeAdsCount = await Ad.countDocuments({
        auctionItemId: auction._id,
        isActive: true,
      });

      if (activeAdsCount === 0) {
        await AuctionItem.findByIdAndUpdate(
          auction._id,
          { $set: { boosted: false } },
          { new: true },
        );
      }
    }

    const activeAds = await Ad.find({ isActive: true });

    for (const ad of activeAds) {
      const totalSpent = ad.clicks * ad.bidAmount;

      if (totalSpent >= ad.budget) {
        ad.isActive = false;
        await ad.save();

        const auctionItem = await AuctionItem.findById(ad.auctionItemId);

        if (auctionItem) {
          const activeAdsForItem = await Ad.countDocuments({
            auctionItemId: ad.auctionItemId,
            isActive: true,
          });

          if (activeAdsForItem === 0) {
            auctionItem.boosted = false;
            await auctionItem.save();
          }
        }
      }
    }

    const suspendedAuctionHouses = await AuctionHouse.AuctionHouse.find({
      accountStatus: 'suspended',
    });

    for (const house of suspendedAuctionHouses) {
      const hasPendingOrders = await Order.exists({
        auctionHouseId: house._id,
        deliveryStatus: { $ne: 'delivered' },
      });

      if (!hasPendingOrders) {
        const auctionItems = await AuctionItem.find({
          auctionHouseId: house._id,
        });
        const auctionItemIds = auctionItems.map((item) => item._id);

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

        await AuctionHouse.AuctionHouseUser.deleteMany({
          auctionHouseId: house._id,
        });
        await Ad.deleteMany({ advertiserId: house._id });
        await AuctionHouseWallet.deleteMany({ AuctionHouse: house._id });
        await AuctionItem.deleteMany({ auctionHouseId: house._id });
        await DeliveryAgent.deleteMany({ auctionHouseId: house._id });
        await Order.deleteMany({ auctionHouseId: house._id });
        await AuctionHouse.AuctionHouse.findByIdAndDelete(house._id);

        console.log(
          `Suspended auction house ${house._id} deleted successfully.`,
        );
      }
    }
        const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const oldDeliveredOrders = await Order.find({
      status: 'delivered',
      updatedAt: { $lt: fifteenDaysAgo },
    });

    oldDeliveredOrders.forEach(async (order) => {
      const auctionitem=await AuctionItem.findById(order.auctionItem._id)
      const user=await User.findById(order.userId._id)
      if (auctionitem) {
        await AuctionHouseWallet.findOneAndUpdate(
          { AuctionHouse: order.auctionHouseId._id },
          { $inc: { balance: +auctionitem.currentBid} },
          { new: true },
        );
        
        await User.updateOne(
          { _id: order.userId, 'wonItems.itemId': order.auctionItem._id },
          {
            $set: {
              'wonItems.$.status': 'delivered',
            },
          },
        );
        const paymentHolds = await PaymentHold.find({
          auctionItemId: order.auctionItem,
          userId: { $ne: auctionitem.currentBidder._id },
        });
        for (const hold of paymentHolds) {
          const user = await User.findById(hold.userId);
          if (user) {
            await User.updateOne(
              { _id: user._id },
              { $inc: { balance: +hold.amountHeld } },
            );
          }
          await PaymentHold.findByIdAndDelete(hold._id);  
          await AuctionItem.findByIdAndUpdate(
            order.auctionItem,
            { $pull: { bids: { userId: hold.userId._id } } },
            { new: true },
          );
        }
        const paymentToRelease=await PaymentHold.findOneAndUpdate(
          {
            

           
              auctionItemId:order.auctionItem._id,
              userId:order.userId._id,
              auctionHouseId:order.auctionHouseId._id
           
          },
          { $set: { status: 'released' } },
          { new: true },
        );
        
      }
      
    });

    const cancelledOrders = await Order.find({
      status: 'cancelled',
    });
    cancelledOrders.forEach(async (order) => {
      const auctionitem=await AuctionItem.findById(order.auctionItem._id)
      if (auctionitem) {
       
        await User.updateOne(
          { _id: order.userId, 'wonItems.itemId': order.auctionItem._id },
          {
            $set: {
              'wonItems.$.status': 'cancelled',
            },
          },
        );
        await Wallet.findOneAndUpdate(
          { user: order.userId },
          { $inc: { balance: +auctionitem.currentBid } },
          { new: true },
        );
      }
    });

console.log('Cron Job Ran Successfully');
    console.log('Cron Job Ran Successfully');
  } catch (error) {
    console.error('Cron Job Error:', error);
  }
});
