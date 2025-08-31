const User = require('../models/user');
const SuperAdmin = require('../models/superAdmin/superAdmin');
const { AuctionHouse, AuctionHouseUser } = require('../models/auctionHouse');
const MessageThread = require('../models/message');
const jwt = require('jsonwebtoken');
const { sendUserNotification, sendNotificationToAdminApp } = require('../utils/notifications');
const Order = require('../models/delivery/Order');

const extractSenderFromToken = async (token) => {
  let decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.userId) return { senderId: decoded.userId, senderModel: 'User' };
  if (decoded.adminId) return { senderId: decoded.adminId, senderModel: 'SuperAdmin' };
  if (decoded.auctionHouseId) {
    let id;
const auctionHouse = await AuctionHouse.findById(decoded.auctionHouseId);
    console.log('Decoded Auction House ID:', decoded.auctionHouseId);
    console.log('Auction House:', auctionHouse.id);
    if (!auctionHouse) {
      const auctionHouseUser = await AuctionHouseUser.findById(decoded.auctionHouseId);
      if (!auctionHouseUser) throw new Error('Auction House or User not found');
      id = auctionHouseUser.auctionHouseId;
    } else {
      id = auctionHouse.id;
    }
    console.log('Auction House ID:', id);
    return { senderId: id, senderModel: 'AuctionHouse' }
  };
  throw new Error('Invalid token payload');
};

function getCurrentUserFromToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) throw new Error('Authorization header missing');

  const token = authHeader.split(' ')[1];
  if (!token) throw new Error('Token missing');

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.userId) return { id: decoded.userId, model: 'User' };
  if (decoded.adminId) return { id: decoded.adminId, model: 'SuperAdmin' };
  if (decoded.auctionHouseId) return { id: decoded.auctionHouseId, model: 'AuctionHouse' };

  throw new Error('Invalid token payload');
}

exports.getAllThreads = async (req, res) => {
  try {
    const currentUser = getCurrentUserFromToken(req);

    const threads = await MessageThread.find({
      $or: [
        { initiatorId: currentUser.id, initiatorModel: currentUser.model },
        { receiverId: currentUser.id, receiverModel: currentUser.model },
      ]
    })
      .populate('initiatorId')
      .populate('receiverId')
      .populate('itemId')
      .sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, threads });
  } catch (error) {
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
};

exports.getThreadByItemId = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { with: contextModel } = req.query; 
    const currentUser = getCurrentUserFromToken(req);
 

    if (!contextModel || !['User', 'AuctionHouse', 'SuperAdmin'].includes(contextModel)) {
      return res.status(400).json({ error: 'Invalid or missing `with` context in query params' });
    }

    const thread = await MessageThread.findOne({
      itemId,
      $or: [
        {
          initiatorId: currentUser.id,
          initiatorModel: currentUser.model,
          receiverModel: contextModel,
        },
        {
          receiverId: currentUser.id,
          receiverModel: currentUser.model,
          initiatorModel: contextModel,
        },
      ],
    })
      .populate('itemId')
      .lean();

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found for the specified context' });
    }
    let initiatorInfo = null;
    if (thread.initiatorModel === 'User') {
      initiatorInfo = await User.findById(thread.initiatorId).select('firstName lastName email');
    } else if (thread.initiatorModel === 'SuperAdmin') {
      initiatorInfo = await SuperAdmin.findById(thread.initiatorId).select('firstName lastName email');
    } else if (thread.initiatorModel === 'AuctionHouse') {
      initiatorInfo = await AuctionHouse.findById(thread.initiatorId).select('name email phoneNumber');
    }
    let receiverInfo = null;
    if (thread.receiverModel === 'User') {
      receiverInfo = await User.findById(thread.receiverId).select('firstName lastName email');
    } else if (thread.receiverModel === 'SuperAdmin') {
      receiverInfo = await SuperAdmin.findById(thread.receiverId).select('firstName lastName email');
    } else if (thread.receiverModel === 'AuctionHouse') {
      receiverInfo = await AuctionHouse.findById(thread.receiverId).select('name email phoneNumber');
    }
    const populatedChats = await Promise.all(
      thread.chats.map(async (chat) => {
        let sender = null;
        if (chat.senderModel === 'User') {
          sender = await User.findById(chat.senderId).select('firstName lastName');
        } else if (chat.senderModel === 'SuperAdmin') {
          sender = await SuperAdmin.findById(chat.senderId).select('firstName lastName');
        } else if (chat.senderModel === 'AuctionHouse') {
          sender = await AuctionHouse.findById(chat.senderId).select('name');
        }
        return { ...chat, sender: sender || null };
      })
    );

    return res.status(200).json({
      success: true,
      thread: {
        ...thread,
        chats: populatedChats,
        initiatorInfo,
        receiverInfo,
      },
    });
  } catch (error) {

    return res.status(500).json({ error: 'Server error', details: error.message });
  }
};


exports.sendMessage = async (req, res) => {
  console.log('sendMessage called with body:', req.body);
  const { message, itemId, title, receiverModel, receiverId } = req.body;
  console.log('Parsed body:', {
    message,
    itemId,
    title,
    receiverModel,
    receiverId,
  });
  let receiverIdNormalized=receiverId;
  console.info('Received data:', {
    message,
    itemId,
    title,
    receiverModel,
    receiverId,
  });
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Authorization header required' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Token missing' });
  if (receiverModel === 'SuperAdmin' && !receiverId) {
    const superAdmin = await SuperAdmin.findOne();
    if (!superAdmin) return res.status(404).json({ error: 'SuperAdmin not found' });
    receiverIdNormalized = superAdmin._id;
  }

  let sender;
  try {
    sender = await extractSenderFromToken(token);
  } catch (err) {
    return res.status(403).json({ error: err.message });
  }

  if (!message || !itemId || !title || !receiverModel || !receiverIdNormalized) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if(receiverModel==="SuperAdmin"){
    const order= await Order.findOne({auctionItem:itemId});
    if(order.status!=="disput"){
      await Order.findOneAndUpdate({auctionItem:itemId},{
        status:"disput"
      });

      console.log("Order status updated to dispute for item:", itemId);
    }
  }
  try {
   let thread = await MessageThread.findOne({
  itemId,
  $or: [
    {
      initiatorId: sender.senderId,
      initiatorModel: sender.senderModel,
      receiverId:receiverIdNormalized,
      receiverModel,
    },
    {
      initiatorId: receiverId,
      initiatorModel: receiverModel,
      receiverId: sender.senderId,
      receiverModel: sender.senderModel,
    },
  ],
});

    const newMessage = {
      senderId: sender.senderId,
      senderModel: sender.senderModel,
      message,
      timestamp: new Date(),
    };

    if (thread) {
      thread.chats.push(newMessage);
    } else {
      thread = new MessageThread({
        itemId,
        title,
        initiatorId: sender.senderId,
        initiatorModel: sender.senderModel,
        receiverId:receiverIdNormalized,
        receiverModel,
        chats: [newMessage],
      });
    }

    await thread.save();

    if (receiverModel === 'User') {
      const user = await User.findById(receiverId);
      let auctionHouse;
      if(sender.senderModel!=="SuperAdmin"){
         auctionHouse = await AuctionHouse.findById(sender.senderId);
      }
      if (user?.deviceToken) sendUserNotification(user.deviceToken, `New message received by ${sender.senderModel==="SuperAdmin"? "Bid Darbaar":auctionHouse.name}` , message);
    } else {
      const receiver = receiverModel === 'SuperAdmin' ? await SuperAdmin.findById(receiverIdNormalized) : await AuctionHouse.findById(receiverIdNormalized);
      let senderInfo = null;
      if (sender.senderModel === 'User') {
        senderInfo = await User.findById(sender.senderId).select('firstName lastName email');
        senderInfo= senderInfo.firstName + ' ' + senderInfo.lastName;
      } else if (sender.senderModel === 'SuperAdmin') {
        senderInfo = await SuperAdmin.findById(sender.senderId).select('firstName lastName email');
        senderInfo = senderInfo.firstName + ' ' + senderInfo.lastName;
      } else if (sender.senderModel === 'AuctionHouse') {
        senderInfo = await AuctionHouse.findById(sender.senderId).select('name email phoneNumber');
        senderInfo = senderInfo.name;
      }
      if (receiver?.deviceToken) sendNotificationToAdminApp(receiver.deviceToken, `New message received by ${senderInfo}`, message);
    }

    return res.status(200).json({ success: true, thread });
  } catch (error) {
    console.log('Error in sendMessage:', error.message);  
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
};