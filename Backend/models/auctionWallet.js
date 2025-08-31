const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  AuctionHouse: { type: mongoose.Schema.Types.ObjectId, ref: 'AuctionHouse' },
  balance: { type: Number, default: 0 },
});

const AuctionHouseWallet = mongoose.model('AuctionHouseWallet', WalletSchema);
module.exports = AuctionHouseWallet;
