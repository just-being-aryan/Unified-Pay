import express from 'express';
import {
  initiatePayment,
  refundPayment,
  verifyPayment,
  getTransaction
} from '../controllers/payment.controller.js';

import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// INITIATE PAYMENT
router.post('/initiate', protect, initiatePayment);

// UNIVERSAL CALLBACK (PayU, Razorpay, Cashfree, etc.)
router.post('/callback/:gateway', verifyPayment);

// REFUND
router.post('/refund', protect, isAdmin, refundPayment);

// GET TRANSACTION (frontend success page uses this)
router.get('/transaction/:id', getTransaction);

export default router;
