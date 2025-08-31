const User = require('../../models/user');
const jwt = require('jsonwebtoken');

const AuctionItem = require('../../models/auctionItem');
const { isValidObjectId } = require('mongoose');
const PaymentHold = require('../../models/paymentHold');
const Wallet = require('../../models/wallet');
const { sendUserNotification } = require('../../utils/notifications');
exports.updateBid = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const { auctionItemId, bidAmount: bidAmountStr } = req.body;

  if (!authHeader) {
    throw new Error('Unauthorized access!');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new Error('Token missing');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }

  const bidderId = decoded.userId;
  if (!bidderId) {
    throw new Error('User ID not found in token');
  }

  const user = await User.findById(bidderId);
  if (!user) {
    throw new Error('User not found');
  }
  if (!auctionItemId || bidAmountStr === undefined) {
    throw new Error('Missing required fields');
  }

  const bidAmount = parseFloat(bidAmountStr);
  if (isNaN(bidAmount)) {
    throw new Error('Invalid bid amount');
  }

  try {
    const auctionItem = await AuctionItem.findById(auctionItemId)
      .populate('currentBidder', 'id')
      .populate('createdBy', 'id');

    if (!auctionItem) {
      throw new Error('Auction item not found');
    }
    console.log('auctionItem', auctionItem.status);
    if (auctionItem.status !== 'active') {
      throw new Error('Auction is not active');
    }

    const now = new Date();
    if (!auctionItem.BiddingStartTime || !auctionItem.BiddingEndTime) {
      throw new Error('Bidding period not configured');
    }

    if (
      now < auctionItem.BiddingStartTime ||
      now > auctionItem.BiddingEndTime
    ) {
      throw new Error('Bidding period has ended');
    }

    const currentBid = auctionItem.currentBid;
    const minBid = currentBid === 0 ? auctionItem.startingBid : currentBid;

    if (bidAmount <= minBid) {
      throw new Error(`Bid must be higher than ${minBid}`);
    }

    if (auctionItem.createdBy?.id.toString() === bidderId.toString()) {
      throw new Error(`You cannot bid on your own auction`);
    }

    const hasUserBidded = auctionItem.bids.some(
      (bid) => bid.bidderId.toString() === bidderId.toString(),
    );

    if (!hasUserBidded) {
      const abc = new PaymentHold({
        userId: bidderId,
        auctionHouseId: auctionItem.auctionHouseId,
        auctionItemId: auctionItemId,
        amountHeld: auctionItem.startingBid * 0.1,
        status: 'pending',
      });

      await abc.save();
      const userWallet = await Wallet.findByIdAndUpdate(
        user.wallet,
        {
          $inc: { balance: -auctionItem.startingBid * 0.1 },
        },
        { new: true },
      );
      if (!userWallet) {
        throw new Error('Wallet not found');
      }
    }

    auctionItem.currentBid = bidAmount;
    auctionItem.currentBidder = bidderId;
    auctionItem.bids.push({
      bidderId,
      bidAmount,
      bidTime: now,
    });
    await auctionItem.save();
    const updatedUser = await User.findByIdAndUpdate(
      bidderId,
      [
        {
          $set: {
            bids: {
              $cond: [
                { $in: [auctionItem._id, '$bids.itemId'] },
                {
                  $map: {
                    input: '$bids',
                    in: {
                      $cond: [
                        { $eq: ['$$this.itemId', auctionItem._id] },
                        {
                          $mergeObjects: [
                            '$$this',
                            { bidAmount: bidAmount, bidTime: now },
                          ],
                        },
                        '$$this',
                      ],
                    },
                  },
                },
                {
                  $concatArrays: [
                    '$bids',
                    [
                      {
                        itemId: auctionItem._id,
                        bidAmount: bidAmount,
                        bidTime: now,
                      },
                    ],
                  ],
                },
              ],
            },
          },
        },
      ],
      { new: true },
    );
    const tempAuctionHouseItem =await AuctionItem.findById(auctionItemId)

let userIds = tempAuctionHouseItem.bids.map(bid => bid.bidderId.toString());

userIds = [...new Set(userIds)];

const currentBidderId = tempAuctionHouseItem.currentBidder?.toString();
userIds = userIds.filter(id => id !== currentBidderId);

    for (const userId of userIds) {
      const user = await User.findById(userId);
      if (user) {
        if(user.deviceToken){
          sendUserNotification(user.deviceToken,"You have been outbid on an auction item", `Your bid of ${bidAmount} has been outbid by another user on the auction item: ${tempAuctionHouseItem.title}`);
        }
      }
    }
    return {
      success: true,
      message: 'Bid placed successfully',
      currentBid: auctionItem.currentBid,
      auctionItemId: auctionItem._id,
    };
  } catch (error) {
    console.error('Error placing bid:', error);
    error.extensions = {
      code: 'BAD_USER_INPUT',
      http: { status: 400 },
    };
    throw error;
  }
};
