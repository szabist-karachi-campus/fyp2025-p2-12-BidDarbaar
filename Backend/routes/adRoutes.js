const express = require('express');
const Router = express.Router();
const adController = require('../controllers/adController');

Router.post('/createAd', adController.createAd);
Router.post('/track-click', adController.trackClick);
Router.get('/performance', adController.getAdPerformance);
Router.get('/activeAds', adController.getActiveAds);
Router.post('/editAd', adController.editAd);
Router.post('/trackView', adController.trackView);
Router.get('/bidAmount', adController.getBidAmount);
Router.get('/isItemAdActive', adController.isItemAdActive);
Router.get('/getAd', adController.getAd);
Router.get('/getAuctionHouseAds', adController.getAuctionHouseActiveAds);

module.exports = Router;
