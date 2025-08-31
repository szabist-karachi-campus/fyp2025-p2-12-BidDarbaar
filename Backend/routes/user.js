const express = require('express');
const multer = require('multer');

const router = express.Router();

const storage = multer.diskStorage({});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb('invalid image file!', false);
  }
};
const uploads = multer({ storage, fileFilter });

const {
  createUser,
  userSignIn,
  verifyOTP,
  resetPassword,
  getUserProfile,
  uploadProfilePicture,
  editUserProfile,
  sendOTP,
  getAllAuctionItems,
  fetchAuctionItem,
  getWonAuctionItems,
  addFavoriteItem,
  getFavoriteItems,
  removeFavoriteItem,
  updateLocation,
} = require('../controllers/user');
const {
  validateUserSignUp,
  userValidation,
  validateUserSignIn,
  editUserProfileValidation,
} = require('../middleware/validation/user');
const paymentHoldController = require('../controllers/paymentHoldController');

router.post('/sign-up', validateUserSignUp, userValidation, createUser);
router.post('/sign-in', validateUserSignIn, userValidation, userSignIn);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', sendOTP);
router.post('/change-password', resetPassword);
router.post('/reset-password', verifyOTP);
router.get('/get-user-profile', getUserProfile);
router.post(
  '/upload-profile-picture',
  uploads.single('profile'),
  uploadProfilePicture,
);
router.post(
  '/edit-user-profile',
  editUserProfileValidation,
  userValidation,
  editUserProfile,
);
router.get('/get-all-auction-items', getAllAuctionItems);
router.get('/get-auction-item', fetchAuctionItem);
router.get('/get-won-auction-item', getWonAuctionItems);
router.post('/toggle-favorite-item', addFavoriteItem);
router.get('/get-favorite-item', getFavoriteItems);
router.post('/update-location', updateLocation);
router.post('/create-payment-hold', paymentHoldController.createPaymentHold);
router.post('/checkout', paymentHoldController.checkOut);
router.get('/isPayable', paymentHoldController.isPayable);

module.exports = router;
