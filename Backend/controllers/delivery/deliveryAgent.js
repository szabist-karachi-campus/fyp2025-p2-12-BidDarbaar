const DeliveryAgent = require('../../models/delivery/DeliveryAgent');
const auctionHouse = require('../../models/auctionHouse');
const jwt = require('jsonwebtoken');

exports.registerAgent = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const { name, phone } = req.body;
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
  }
  try {
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }
    const existingAgent = await DeliveryAgent.findOne({ phone });
    if (existingAgent) {
      return res.status(400).json({ message: 'Agent already exists' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  try {
    const agent = new DeliveryAgent({
      name,
      phone,
      auctionHouseId: tempAuctionHouse
        ? tempAuctionHouse._id
        : tempAuctionHouseUser.auctionHouseId._id,
    });
    await agent.save();
    res.status(201).json({ message: 'Agent registered successfully', agent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listAvailableAgents = async (req, res) => {
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
  }
  try {
    const agents = await DeliveryAgent.find({
      isAvailable: true,
      auctionHouseId: tempAuctionHouse
        ? tempAuctionHouse._id
        : tempAuctionHouseUser.auctionHouseId._id,
    });
    console.log('agents', agents);

    if (!agents || agents.length === 0) {
      return res.status(404).json({ message: 'No available agents found',agents });
    }
    res.json({message:"Agents fetched successfully",agents});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
