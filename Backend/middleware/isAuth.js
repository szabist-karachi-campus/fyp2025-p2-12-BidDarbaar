const jwt = require('jsonwebtoken');
const { AuctionHouse } = require('../models/auctionHouse');
const { AuctionHouseUser } = require('../models/auctionHouse');

exports.isAuctionHouseAuth = async (req, res, next) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];

    try {
      console.log('Token received:', token);
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded payload:', decode);

      const auctionHouse = await AuctionHouse.findById(decode.auctionHouseId);
      let auctionHouseUser;
      if (auctionHouse) {
      } else {
        auctionHouseUser = await AuctionHouseUser.findById(
          decode.auctionHouseId,
        );
        if (!auctionHouseUser) {
          return res
            .status(401)
            .json({ success: false, message: 'Unauthorized acces22s!' });
        }
      }
      req.auctionHouseUser = auctionHouseUser;
      req.auctionHouse = auctionHouse;
      next();
    } catch (error) {
      console.error('Internal Server Error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized access!',
          error: error.message,
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired, please sign in again!',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error!',
        error: error.message,
      });
    }
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized access!' });
  }
};
