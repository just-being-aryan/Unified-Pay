import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";

import { paymentInitiateState } from "../states/paymentInitiateState.js";
import { paymentVerifyState } from "../states/paymentVerifyState.js";
import { paymentRefundState } from "../states/paymentRefundState.js";

import { logGatewayResponse } from "../utils/logGatewayResponse.js";
import Transaction from "../models/transaction.model.js";



// ======================================================
// INITIATE PAYMENT
// ======================================================
export const initiatePayment = asyncHandler(async (req, res) => {
  console.log("🔍 Controller - Full request body:", JSON.stringify(req.body, null, 2));

  const { gateway, amount, currency, customer, redirect, meta } = req.body;

  console.log("🔍 Controller - Extracted values:", {
    gateway,
    amount,
    currency,
    hasCustomer: !!customer,
    customer,
    hasRedirect: !!redirect,
    redirect,
    meta,
    userId: req.user?._id,
  });

  if (!gateway || !amount || !customer || !customer.email) {
    throw new ApiError(400, "Missing required payment fields");
  }

  // 🔥 UPDATED: Dynamic gateway config instead of PayU-only config
  let gatewayConfig = {};

  if (gateway.toLowerCase() === "payu") {
    gatewayConfig = {
      key: process.env.PAYU_MERCHANT_KEY,
      salt: process.env.PAYU_MERCHANT_SALT,
      baseUrl: process.env.PAYU_BASE_URL,
    };
  }

  if (gateway.toLowerCase() === "cashfree") {
    gatewayConfig = {
      appId: process.env.CASHFREE_APP_ID,
      secretKey: process.env.CASHFREE_SECRET_KEY,
      baseUrl: process.env.CASHFREE_BASE_URL,
    };
  }

  console.log("🔍 Controller - Gateway Config:", gatewayConfig); // ← UPDATED

  // 🔥 PASSES correct config per gateway
  const result = await paymentInitiateState({
    gateway,
    amount,
    currency,
    customer,
    redirect,
    meta,
    config: gatewayConfig, // ← UPDATED
    userId: req.user._id,
  });

  await logGatewayResponse({
    gateway,
    type: "initiation",
    requestPayload: { amount, currency, customer, redirect, meta },
    responsePayload: result,
    statusCode: 200,
    message: `Payment initiation completed for ${gateway}`,
  });

  return res.status(200).json({
    success: true,
    message: "Payment Initiated Successfully",
    data: result,
  });
});



// ======================================================
// VERIFY PAYMENT (callback URL)
// ======================================================
export const verifyPayment = asyncHandler(async (req, res) => {
  const gateway = req.params.gateway?.toLowerCase();
  const callbackPayload = req.body || req.query;

  if (!gateway) throw new ApiError(400, "Gateway is required");

  // 🔥 UPDATED: Dynamic config injection here too
  let verifyConfig = {};

  if (gateway === "payu") {
    verifyConfig = {
      key: process.env.PAYU_MERCHANT_KEY,
      salt: process.env.PAYU_MERCHANT_SALT,
    };
  }

  if (gateway === "cashfree") {
    verifyConfig = {
      appId: process.env.CASHFREE_APP_ID,
      secretKey: process.env.CASHFREE_SECRET_KEY,
    };
  }

  const result = await paymentVerifyState(gateway, callbackPayload, verifyConfig);

  console.log("🔴 Callback Payload:", callbackPayload);
  console.log("🔴 Verify State Result:", result);

  await logGatewayResponse({
    gateway,
    type: "verification",
    requestPayload: callbackPayload,
    responsePayload: result,
    statusCode: 200,
    message: `Verification processed for ${gateway}`,
  });

  // FRONTEND BASE URL
  const frontendBase = process.env.FRONTEND_URL;

  const txnid = callbackPayload.txnid || callbackPayload.order_id;

  const redirectTo =
    result.status === "paid"
      ? `${frontendBase}/payments/success?txnid=${txnid}`
      : `${frontendBase}/payments/failure?txnid=${txnid}`;

  return res.redirect(redirectTo);
});



// ======================================================
// REFUND PAYMENT
// ======================================================
export const refundPayment = asyncHandler(async (req, res) => {
  const { transactionId, amount, reason, config } = req.body;

  if (!transactionId) throw new ApiError(400, "transactionId is required");

  const result = await paymentRefundState(transactionId, amount, reason, config);

  const gateway = result.gateway || "unknown";

  await logGatewayResponse({
    gateway,
    type: "refund",
    requestPayload: { transactionId, amount, reason },
    responsePayload: result,
    statusCode: 200,
    message: `Refund processed for ${gateway}`,
  });

  return res.status(200).json({
    success: true,
    message: "Refund processed",
    data: result,
  });
});



// ======================================================
// GET TRANSACTION (FOR SUCCESS PAGE)
// ======================================================
export const getTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const isMongoId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);

  let transaction;

  if (isMongoId) {
    transaction = await Transaction.findById(id);
  } else {
    transaction = await Transaction.findOne({ gatewayOrderId: id });
  }

  if (!transaction) throw new ApiError(404, "Transaction not found");

  res.status(200).json({
    success: true,
    transaction,
  });
});
