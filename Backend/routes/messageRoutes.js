const express = require('express');
const Router = express.Router();
const messageController = require('../controllers/messageController');

Router.post('/send-message', messageController.sendMessage);
Router.get('/threads', messageController.getAllThreads);
Router.get('/thread/:itemId', messageController.getThreadByItemId);

module.exports = Router;
