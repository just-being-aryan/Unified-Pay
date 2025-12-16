import express from 'express';
import {
  initiatePayment,
  refundPayment,
  verifyPayment,
  getTransaction,
  getAllPayments,
  deleteTransaction
} from '../controllers/payment.controller.js';
import {
  paymentInitLimiter,
  dashboardLimiter,
} from "../middleware/rateLimiters.js";

import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

//payment initiate
router.post('/initiate', protect, paymentInitLimiter,initiatePayment);

// UNIVERSAL CALLBACK (PayU, Razorpay, Cashfree, etc.)
router.post('/callback/:gateway', verifyPayment);
router.get('/callback/:gateway', verifyPayment);
router.options('/callback/:gateway', (req, res) => res.sendStatus(200));

//refunds
router.post('/refund', protect, isAdmin, refundPayment);

//get transaction info for dashboard
router.get("/", protect,dashboardLimiter,getAllPayments);

//get single transaction
router.get('/transaction/:id', getTransaction);


//Deletr a transaction as admin
router.delete("/transaction/:id", protect, isAdmin, deleteTransaction);



export default router;
