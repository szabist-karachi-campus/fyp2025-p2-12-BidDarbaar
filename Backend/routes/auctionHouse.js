const express = require('express');
const Router = express.Router();

const {
  createAuctionHouse,
  auctionHouseSignIn,
  createAuctionHouseUser,
  uploadAuctionHouseProfilePic,
  createAuctionItem,
  uploadAuctionItemPic,
  verifyOTP,
  sendOTP,
  resetPassword,
  auctionHouseUserSignIn,
  updateAuctionItem,
  deleteAuctionItem,
  getAuctionHouseProfile,
  editAuctionHouseProfile,
  fetchAuctionItems,
  fetchAuctionItem,
  getAuctionHouseUsers,
  deleteAuctionHouseUser,
  getAuctionHouseAnalytics,
} = require('../controllers/auctionHouse');
const {
  createCategory,
  deleteCategory,
  getCategories,
} = require('../controllers/categories');
const {
  validateAuctionHouseSignIn,
  validateAuctionHouseSignUp,
  auctionHouseValidation,
  validateAuctionHouseUserSignUp,
  validateAuctionHouseUserSignIn,
} = require('../middleware/validation/auctionHouse');
const multer = require('multer');
const { isAuctionHouseAuth } = require('../middleware/isAuth');
const router = require('./user');

const storage = multer.diskStorage({});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb('invalid image file!', false);
  }
};
const uploads = multer({ storage, fileFilter });
Router.post(
  '/auction-house-sign-up',
  validateAuctionHouseSignUp,
  auctionHouseValidation,
  createAuctionHouse,
);
Router.post(
  '/auction-house-sign-in',
  validateAuctionHouseSignIn,
  auctionHouseValidation,
  auctionHouseSignIn,
);
Router.post(
  '/auction-house-user-sign-up',
  validateAuctionHouseUserSignUp,
  auctionHouseValidation,
  createAuctionHouseUser,
);
Router.post(
  '/auction-house-user-sign-in',
  validateAuctionHouseUserSignIn,
  auctionHouseValidation,
  auctionHouseUserSignIn,
);
Router.post(
  '/upload-auction-house-profile-picture',
  uploads.single('profile'),
  uploadAuctionHouseProfilePic,
);
Router.post('/create-auction-item', createAuctionItem);
Router.post(
  '/upload-auction-item-picture',
  uploads.array('item', 5),
  uploadAuctionItemPic,
);
Router.post('/verify-otp-admin', verifyOTP);
Router.post('/forgot-password-admin', sendOTP);
Router.post('/change-password-admin', resetPassword);
Router.get('/get-auction-house-profile', getAuctionHouseProfile);
Router.get('/get-AuctionHouse-Analytics', getAuctionHouseAnalytics);
Router.post('/edit-auction-house-profile', editAuctionHouseProfile);
Router.put(
  '/auction-item-update/:itemId',
  isAuctionHouseAuth,
  updateAuctionItem,
);
Router.delete(
  '/auction-item-delete/:itemId',
  isAuctionHouseAuth,
  deleteAuctionItem,
);
Router.get(
  '/admin-get-all-auction-items',
  isAuctionHouseAuth,
  fetchAuctionItems,
);
const { isAuth } = require('../middleware/isAdminAuth');

Router.get('/get-auction-item-admin', isAuctionHouseAuth, fetchAuctionItem);
Router.post('/create-category', isAuth, createCategory);
Router.delete('/delete-category', isAuth, deleteCategory);
router.get('/get-categories', getCategories);
router.post('/get-Auction-House-Users', getAuctionHouseUsers);
Router.delete('/delete-Auction-House-User', deleteAuctionHouseUser);

module.exports = Router;
