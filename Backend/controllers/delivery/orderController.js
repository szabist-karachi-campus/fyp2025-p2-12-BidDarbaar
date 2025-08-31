const Order = require('../../models/delivery/Order');
const auctionHouse = require('../../models/auctionHouse');
const DeliveryAgent = require('../../models/delivery/DeliveryAgent');
const User = require('../../models/user');
const jwt = require('jsonwebtoken');
exports.createOrder = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const { userId, auctionItem, location } = req.body;

  if (!authHeader)
    return res
      .status(401)
      .json({ success: false, message: 'Authorization header required' });

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const auctionHouseId = decoded.auctionHouseId;

  if (!auctionHouseId) {
    return res
      .status(400)
      .json({ success: false, message: 'Auction House ID is required!' });
  }

  const tempAuctionHouse =
    await auctionHouse.AuctionHouse.findById(auctionHouseId);
  let tempAuctionHouseUser;

  if (!tempAuctionHouse) {
    tempAuctionHouseUser =
      await auctionHouse.AuctionHouseUser.findById(auctionHouseId);
    if (!tempAuctionHouseUser) {
      return res.status(404).json({ message: 'Auction House not found' });
    }
    if (tempAuctionHouseUser.jobTitle !== 'admin') {
      return res
        .status(403)
        .json({ message: 'You are not authorized to create an order' });
    }
  }

  try {
    if (!userId || !auctionItem || !location) {
      return res
        .status(400)
        .json({ message: 'User Id, Auction Item and location are required' });
    }
    const existingOrder = await Order.findOne({ auctionItem });
    if (existingOrder) {
      return res
        .status(400)
        .json({ message: 'Order already exists for this auction item' });
    }
    const order = await Order.create({
      userId,
      auctionHouseId: tempAuctionHouse
        ? tempAuctionHouse._id
        : tempAuctionHouseUser.auctionHouseId._id,
      auctionItem,
      location: location,
    });
    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignAgent = async (req, res) => {
  const { orderId, agentId } = req.body;
  const authHeader = req.headers['authorization'];
  if (!authHeader)
    return res
      .status(401)
      .json({ success: false, message: 'Authorization header required' });

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const auctionHouseId = decoded.auctionHouseId;
  let id;
  if (!auctionHouseId) {
    return res
      .status(400)
      .json({ success: false, message: 'Auction House ID is required!' });
  }

  const tempAuctionHouse =
    await auctionHouse.AuctionHouse.findById(auctionHouseId);
  let tempAuctionHouseUser;
  if (!tempAuctionHouse) {
    tempAuctionHouseUser =
      await auctionHouse.AuctionHouseUser.findById(auctionHouseId);
    if (!tempAuctionHouseUser) {
      return res.status(404).json({ message: 'Auction House not found' });
    }
    if (tempAuctionHouseUser.jobTitle !== 'admin') {
      return res
        .status(403)
        .json({
          message: 'You are not authorized to assign agent to an order',
        });
    }
    id = tempAuctionHouseUser.auctionHouseId;
  }
  id = tempAuctionHouse._id;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('tempAuctionHouseUser', id);
    console.log('agentId', agentId);
    const agent = await DeliveryAgent.findById(agentId);
    console.log('agent', agent);

    if (!agent) {
      return res.status(400).json({ message: 'Agent not found' });
    }
    if (!agent.isAvailable) {
      return res.status(400).json({ message: 'Agent is not available' });
    }
    console.log(agent.auctionHouseId, id);
    if (agent.auctionHouseId.toString() !== id.toString()) {
      return res
        .status(400)
        .json({ message: 'Agent does not belong to this auction house' });
    }

    order.assignedAgent = agentId;
    order.status = 'assigned';
    await order.save();

    agent.isAvailable = false;
    await agent.save();

    return res.status(201).json({
      success: true,
      message: 'Agent assigned successfully',
      order,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderId, status } = req.body;
  const authHeader = req.headers['authorization'];

  if (!authHeader)
    return res
      .status(401)
      .json({ success: false, message: 'Authorization header required' });

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const auctionHouseId = decoded.auctionHouseId;

  if (!auctionHouseId) {
    return res
      .status(400)
      .json({ success: false, message: 'Auction House ID is required!' });
  }


  const tempAuctionHouse =
    await auctionHouse.AuctionHouse.findById(auctionHouseId);
  let tempAuctionHouseUser;

  if (!tempAuctionHouse) {
    tempAuctionHouseUser =
      await auctionHouse.AuctionHouseUser.findById(auctionHouseId);
    if (!tempAuctionHouseUser) {
      return res.status(404).json({ message: 'Auction House not found' });
    }
    if (tempAuctionHouseUser.jobTitle !== 'admin') {
      return res
        .status(403)
        .json({ message: 'You are not authorized to update an order' });
    }
  }
  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    await order.save();

    if (status === 'delivered') {
      await DeliveryAgent.findByIdAndUpdate(order.assignedAgent, {
        isAvailable: true,
      });
    }

    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrder = async (req, res) => {
 





  const authHeader = req.headers['authorization'];
  const itemId = req.headers['id'];
  if (!itemId) {
    return res.status(400).json({ message: 'Item ID is required' });
  }
   

  if (!authHeader)
    return res
      .status(401)
      .json({ success: false, message: 'Authorization header required' });

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId;
  const user = await User.findById(userId);
  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: 'User ID is required!' });
  }
  const order = await Order.findOne({ auctionItem: itemId, userId: userId }).populate("auctionHouseId").populate("userId");
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  return res.status(200).json({
    success: true,
    message: 'Order fetched successfully',
    order,
  });
};

exports.getAllOrders = async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader)
    return res
      .status(401)
      .json({ success: false, message: 'Authorization header required' });

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const auctionHouseId = decoded.auctionHouseId;

  if (!auctionHouseId) {
    return res
      .status(400)
      .json({ success: false, message: 'Auction House ID is required!' });
  }

  const tempAuctionHouse =
    await auctionHouse.AuctionHouse.findById(auctionHouseId);
  let tempAuctionHouseUser;

  if (!tempAuctionHouse) {
    tempAuctionHouseUser =
      await auctionHouse.AuctionHouseUser.findById(auctionHouseId);
    if (!tempAuctionHouseUser) {
      return res.status(404).json({ message: 'Auction House not found' });
    }
    if (tempAuctionHouseUser.jobTitle !== 'admin') {
      return res
        .status(403)
        .json({ message: 'You are not authorized to get all orders' });
    }
  }
  try {
    const orders = await Order.find({
      auctionHouseId: tempAuctionHouse
        ? tempAuctionHouse._id
        : tempAuctionHouseUser.auctionHouseId._id,
    });
    console.log('orders', orders);
    console.log("id",auctionHouseId);
    return res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      orders,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

exports.ResolveDispute = async (req, res) => {
  const { orderId, status } = req.body;
  const updatedOrder= await Order.findByIdAndUpdate(
    orderId,
    { status },
    { new: true }
  );
  if (!updatedOrder) {
    return res.status(404).json({ message: 'Order not found' });
  }
  return res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    order: updatedOrder,
  });
}

exports.getAuctiontOrder = async (req, res) => {
  const isSuperAdmin= req.headers.issuperadmin
  console.log("Parsed body",req.headers)
  
  const authHeader = req.headers['authorization'];
  const itemId = req.headers['id'];
  if (!itemId) {
    return res.status(400).json({ message: 'Item ID is required' });
  }
  if(isSuperAdmin){
    console.log("inside if")
    const order = await Order.findOne({ auctionItem: itemId }).populate("auctionHouseId").populate("userId");
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Order fetched successfully',
      order,
    });
  }

  if (!authHeader)
    return res
      .status(401)
      .json({ success: false, message: 'Authorization header required' });

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const auctionHouseId = decoded.auctionHouseId;
  
      if (!auctionHouseId) {
        return res
          .status(400)
          .json({ success: false, message: 'Auction House ID is required!' });
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
          return res.status(404).json({ message: 'Auction House not found' });
        }
       
      }
  const order = await Order.findOne({ auctionItem: itemId}).populate("userId").populate("auctionHouseId");
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  return res.status(200).json({
    success: true,
    message: 'Order fetched successfully',
    order,
  });
};