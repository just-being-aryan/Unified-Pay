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
  try {
    // console.log("=== INITIATE PAYMENT REQUEST ===");
    // console.log("Headers:", JSON.stringify(req.headers || {}, null, 2));
    // console.log("Body:", JSON.stringify(req.body || {}, null, 2));
    // console.log("================================");

    const { gateway, amount, currency, customer, meta } = req.body;

    
    if (!gateway || !amount || !customer?.email) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: gateway, amount or customer.email",
      });
    }

    
    const result = await paymentInitiateState({
      gateway,
      amount,
      currency,
      customer,
      redirect: {
        successUrl: req.body?.redirect?.successUrl || `${process.env.FRONTEND_BASE}/success`,
        failureUrl: req.body?.redirect?.failureUrl || `${process.env.FRONTEND_BASE}/failure`,
        notifyUrl: req.body?.redirect?.notifyUrl,
      },
      meta: meta || {},
      userId: req.user?.id || req.body.userId,
      config: req.body.config || {},
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("INITIATE PAYMENT ERROR:", err?.response?.data || err?.message || err);
    
    const payload = {
      success: false,
      message: err.message || "Internal server error",
    };
    if (process.env.NODE_ENV !== "production") {
      payload.raw = err?.response?.data || err;
    }
    return res.status(err.statusCode || 500).json(payload);
  }
});

// ======================================================
// VERIFY PAYMENT (BACKEND CALLBACK / WEBHOOK)
// ======================================================
export const verifyPayment = asyncHandler(async (req, res) => {
  try {
    const gateway = req.params.gateway;
  
  let raw = { ...(req.body || {}), ...(req.query || {}) };

  const cashfreeLinkId =
    raw?.data?.order?.order_tags?.link_id ||
    raw?.data?.order?.order_tags?.cf_link_id ||
    null;

  
  if (cashfreeLinkId) {
    raw.ORDERID = cashfreeLinkId;
    raw.orderId = cashfreeLinkId;
    raw.order_id = cashfreeLinkId;

    if (raw.data) raw.data.order_id = cashfreeLinkId;
    if (raw.data?.order) raw.data.order.order_id = cashfreeLinkId;
  }


  const callbackPayload = raw;


    console.log("=== CALLBACK DEBUG ===");
    console.log("Gateway:", gateway);
    console.log("req.body:", req.body);
    console.log("req.query:", req.query);
    console.log("=====================");

    const result = await paymentVerifyState(gateway, callbackPayload, {});

   
    const frontendSuccess = process.env.FRONTEND_BASE || "http://localhost:5173";
    const successUrl = `${frontendSuccess}/payments/success?txnid=${encodeURIComponent(result.data.transactionId)}&status=${encodeURIComponent(result.data.status)}`;
    const failureUrl = `${frontendSuccess}/payments/failure?txnid=${encodeURIComponent(result.data.transactionId)}&status=${encodeURIComponent(result.data.status)}`;

    if (result.data.status === "paid" || result.data.status === "completed") {
      return res.redirect(successUrl);
    } else {
      return res.redirect(failureUrl);
    }
  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    const frontendBase = process.env.FRONTEND_BASE || "http://localhost:5173";
    return res.redirect(`${frontendBase}/payments/failure`);
  }
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
