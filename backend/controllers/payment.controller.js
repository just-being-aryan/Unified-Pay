// backend/controllers/payment.controller.js
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
  console.log("🔍 Controller - Body:", JSON.stringify(req.body, null, 2));

  const { gateway, amount, currency, customer, meta } = req.body;

  if (!gateway || !amount || !customer?.email) {
    throw new ApiError(400, "Missing required payment fields");
  }

  const frontendBase = process.env.FRONTEND_URL;
  const backendBase = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;

  let redirectUrls;

  if (gateway.toLowerCase() === "payu") {
    // PayU posts back to backend, then we redirect to frontend
    redirectUrls = {
      successUrl: `${backendBase}/api/payments/callback/payu`,
      failureUrl: `${backendBase}/api/payments/callback/payu`,
      notifyUrl: `${backendBase}/api/payments/callback/payu`,
    };
  } else if (gateway.toLowerCase() === "cashfree") {
    // Cashfree: user → frontend, webhook → backend
    redirectUrls = {
      successUrl: `${frontendBase}/payments/success`,
      failureUrl: `${frontendBase}/payments/failure`,
      notifyUrl: `${backendBase}/api/payments/callback/cashfree`,
    };
  } else {
    // Other gateways can mimic Cashfree pattern
    redirectUrls = {
      successUrl: `${frontendBase}/payments/success`,
      failureUrl: `${frontendBase}/payments/failure`,
      notifyUrl: `${backendBase}/api/payments/callback/${gateway}`,
    };
  }

  console.log("🔥 Using redirect URLs:", redirectUrls);

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

  console.log("🔍 Gateway config loaded:", gatewayConfig);

  const result = await paymentInitiateState({
    gateway,
    amount,
    currency,
    customer,
    redirect: redirectUrls,
    meta,
    config: gatewayConfig,
    userId: req.user._id,
  });

  await logGatewayResponse({
    gateway,
    type: "initiation",
    requestPayload: { amount, currency, customer, redirect: redirectUrls, meta },
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
// VERIFY PAYMENT (BACKEND CALLBACK / WEBHOOK)
// ======================================================
export const verifyPayment = asyncHandler(async (req, res) => {
  const gateway = req.params.gateway?.toLowerCase();
  if (!gateway) throw new ApiError(400, "Gateway missing in callback URL");

  const callbackPayload = req.body || req.query;

  console.log("🔥 CALLBACK BODY:", req.body);
  console.log("🔥 CALLBACK QUERY:", req.query);
  console.log("🔥 CALLBACK HEADERS:", req.headers);
  console.log("🔥 GATEWAY:", gateway);

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
      baseUrl: process.env.CASHFREE_BASE_URL,
    };
  }

  const result = await paymentVerifyState(gateway, callbackPayload, verifyConfig);

  console.log("🔴 Verify State Output:", result);

  await logGatewayResponse({
    gateway,
    type: "verification",
    requestPayload: callbackPayload,
    responsePayload: result,
    statusCode: 200,
    message: `Verification processed for ${gateway}`,
  });

  const frontendBase = process.env.FRONTEND_URL;

  const txnid =
    callbackPayload.txnid ||
    callbackPayload.order_id ||
    callbackPayload.orderId ||
    callbackPayload.data?.link_id ||
    callbackPayload.data?.order?.order_id ||
    result.transactionId;

  const redirectTo =
    result.status === "paid"
      ? `${frontendBase}/payments/success?txnid=${txnid}`
      : `${frontendBase}/payments/failure?txnid=${txnid}`;

  // PayU will follow this redirect. Cashfree will ignore it (webhook only), which is fine.
  return res.redirect(redirectTo);
});

// ======================================================
// REFUND PAYMENT
// ======================================================
export const refundPayment = asyncHandler(async (req, res) => {
  const { transactionId, amount, reason, config } = req.body;

  if (!transactionId) throw new ApiError(400, "transactionId is required");

  const result = await paymentRefundState(transactionId, amount, reason, config);

  await logGatewayResponse({
    gateway: result.gateway || "unknown",
    type: "refund",
    requestPayload: { transactionId, amount, reason },
    responsePayload: result,
    statusCode: 200,
    message: `Refund processed for ${result.gateway || "unknown"}`,
  });

  return res.status(200).json({
    success: true,
    message: "Refund processed",
    data: result,
  });
});

// ======================================================
// GET TRANSACTION (FOR SUCCESS PAGE / DASHBOARD)
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
