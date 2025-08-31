const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  updateWallet,
  getWallet,
} = require('../controllers/walletpayment');
const {
  createAuctionPaymentIntent,
  updateAuctionWallet,
  getAuctionWallet,
  ConnectStripe,
  WithdrawVendorMoney,
} = require('../controllers/AuctionWalletpayment');

router.post('/create-payment-intent', createPaymentIntent);
router.post('/create-AuctionHouse-payment-intent', createAuctionPaymentIntent);
router.post('/update-wallet', updateWallet);
router.post('/update-AuctionHouse-wallet', updateAuctionWallet);
router.get('/get-user-wallet', getWallet);
router.get('/get-AuctionHouse-wallet', getAuctionWallet);
router.post('/connect-stripe', ConnectStripe);
router.post('/withdraw', WithdrawVendorMoney);


module.exports = router;
