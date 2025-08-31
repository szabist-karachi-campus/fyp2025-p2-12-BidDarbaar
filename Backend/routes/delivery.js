const express = require('express');
const router = express.Router();
const {
  registerAgent,
  listAvailableAgents,
} = require('../controllers/delivery/deliveryAgent');

const {
  createOrder,
  assignAgent,
  updateOrderStatus,
  getOrder,
  getAllOrders,
  getAuctiontOrder,
} = require('../controllers/delivery/orderController');

router.post('/create-order', createOrder);
router.post('/assign-agent', assignAgent);
router.post('/create-agent', registerAgent);
router.get('/available-agents', listAvailableAgents);
router.post('/order-status', updateOrderStatus);
router.get('/get-Order', getOrder);
router.get('/get-Auction-Order', getAuctiontOrder);
router.get('/get-all-orders', getAllOrders);
module.exports = router;
