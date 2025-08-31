const express = require('express');
const {
  superAdminSignIn,
  createSuperAdmin,
  getAllAuctionHouses,
  deleteAuctionHouse,
  getAllUsers,
  getUser,
  getCategory,
  fetchAuctionItem,
  getSuperAdmin,
  getWaitingList,
  handleAuctionHouseStatus,
} = require('../controllers/superAdminController');
const router = express.Router();
const { isAuth } = require('../middleware/isAdminAuth');
const {
  validateUserSignUp,
  userValidation,
  validateUserSignIn,
} = require('../middleware/validation/superAdmin');
const { editCategory } = require('../controllers/categories');
const { ResolveDispute } = require('../controllers/delivery/orderController');
router.post('/super-admin-login', superAdminSignIn);
router.get('/get-all-auctionHouses', isAuth, getAllAuctionHouses);
router.get('/get-all-users', isAuth, getAllUsers);
router.post('/get-one-user', isAuth, getUser);
router.post(
  '/super-admin-signup',
  validateUserSignUp,
  userValidation,
  isAuth,
  createSuperAdmin,
);
router.post('/delete-auction-house', isAuth, deleteAuctionHouse);
router.get('/get-category', isAuth, getCategory);
router.get('/get-super-item', isAuth, fetchAuctionItem);
router.post('/edit-category', isAuth, editCategory);
router.post('/handleAuctionHouseStatus', isAuth, handleAuctionHouseStatus);
router.get('/get-super-admin', isAuth, getSuperAdmin);
router.get('/get-waiting-list', isAuth, getWaitingList);
router.post("/resolve-dispute",ResolveDispute)
module.exports = router;
