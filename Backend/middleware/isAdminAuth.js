const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/superAdmin/superAdmin');

exports.isAuth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        message: 'Access Unauthorized! No token provided.',
      });
    }

    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access Unauthorized! Invalid token format.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const superAdmin = await SuperAdmin.findById(decoded.adminId);
    if (!superAdmin) {
      return res
        .status(403)
        .json({ success: false, message: 'User not found! Access Forbidden.' });
    }

    req.superAdmin = superAdmin;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid Token!' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session Expired! Please login again.',
      });
    }

    console.error('Authentication Error:', error.message);
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error!' });
  }
};
