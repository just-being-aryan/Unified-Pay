import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";

import { paymentInitiateState } from "../states/paymentInitiateState.js";
import { paymentVerifyState } from "../states/paymentVerifyState.js";
import { paymentRefundState } from "../states/paymentRefundState.js";
import { applyProjectGatewayConfig } from "../utils/applyProjectGatewayConfig.js";

import { logGatewayResponse } from "../utils/logGatewayResponse.js";
import Transaction from "../models/transaction.model.js";
import { generateBrandedInvoice } from "../utils/generateBrandedInvoice.js";


export const initiatePayment = asyncHandler(async (req, res) => {
  console.log("\n\n=== INITIATE PAYMENT REQUEST BODY ===");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("======================================\n\n");

  try {
    const { gateway, amount, currency, customer, meta } = req.body;

    if (!gateway || !amount || !customer?.email) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: gateway, amount or customer.email",
      });
    }

    const normalizedCustomer = {
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      ...(customer?.phone ? { phone: customer.phone } : {})
    };

    const rawInput = {
      gateway,
      amount,
      currency,
      customer: normalizedCustomer,
      redirect: {
        successUrl: req.body?.redirect?.successUrl || `${process.env.FRONTEND_URL}/success`,
        failureUrl: req.body?.redirect?.failureUrl || `${process.env.FRONTEND_URL}/failure`,
        notifyUrl: req.body?.redirect?.notifyUrl
      },
      meta: meta || {},
      userId: req.user?._id || req.body.userId,
      config: req.body.config || {},
      projectId: req.body.projectId || null
    };

    const finalInput = await applyProjectGatewayConfig(rawInput);
    const result = await paymentInitiateState(finalInput);

    return res.status(200).json(result);

  } catch (err) {
    console.error("INITIATE PAYMENT ERROR:", err?.response?.data || err?.message || err);
    const payload = {
      success: false,
      message: err.message || "Internal server error"
    };
    if (process.env.NODE_ENV !== "production") {
      payload.raw = err?.response?.data || err;
    }
    return res.status(err.statusCode || 500).json(payload);
  }
});


export const verifyPayment = asyncHandler(async (req, res) => {
  console.log("VERIFY PAYMENT CALLBACK HIT");
  console.log("METHOD:", req.method);
  console.log("GATEWAY:", req.params.gateway);
  console.log("BODY:", req.body);
  console.log("QUERY:", req.query);

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

    if (gateway === "razorpay" && raw.razorpay_order_id) {
      raw.order_id = raw.razorpay_order_id;
    }

    const callbackPayload = raw;

    console.log("=== CALLBACK DEBUG ===");
    console.log("Gateway:", gateway);
    console.log("Callback Payload:", JSON.stringify(callbackPayload, null, 2));
    console.log("=====================");

    const result = await paymentVerifyState(gateway, callbackPayload, {});

    console.log("✅ Verification Result:", result);

    const isAjax = 
  req.headers['content-type']?.includes('application/json') ||
  req.headers['x-requested-with'] === 'XMLHttpRequest';

    if (isAjax) {
      return res.status(200).json({
        ok: true,
        success: true,
        message: "Payment verified",
        data: result.data
      });
    }

    const frontend = process.env.FRONTEND_URL || "http://localhost:5173";

    const successUrl =
      `${frontend}/payments/success?txnid=${encodeURIComponent(result.data.transactionId)}` +
      `&status=${encodeURIComponent(result.data.status)}`;

    const failureUrl =
      `${frontend}/payments/failure?txnid=${encodeURIComponent(result.data.transactionId)}` +
      `&status=${encodeURIComponent(result.data.status)}`;

    if (result.data.status === "paid" || result.data.status === "completed") {
      return res.redirect(successUrl);
    } else {
      return res.redirect(failureUrl);
    }

  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);

    const isAjax = 
      req.headers['content-type']?.includes('application/json') ||
      (req.method === 'POST' && req.body?.razorpay_payment_id);

    if (isAjax) {
      return res.status(err.statusCode || 500).json({
        ok: false,
        success: false,
        message: err.message || "Verification failed"
      });
    }

    const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontendBase}/payments/failure`);
  }
});


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
    message: `Refund processed for ${result.gateway || "unknown"}`
  });

  return res.status(200).json({
    success: true,
    message: "Refund processed",
    data: result
  });
});


export const getTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const isMongoId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);

  let transaction = isMongoId
    ? await Transaction.findById(id)
    : await Transaction.findOne({ gatewayOrderId: id });

  if (!transaction) throw new ApiError(404, "Transaction not found");

  if (req.query.format === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${transaction.transactionId}.pdf`);
    const pdf = generateBrandedInvoice(transaction);
    return pdf.pipe(res);
  }

  res.status(200).json({
    success: true,
    transaction
  });
});


export const getAllPayments = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role !== "admin") {
    filter.userId = req.user._id;
  }

  const payments = await Transaction.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: payments
  });
});


export const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const txn = await Transaction.findById(id);
  if (!txn) throw new ApiError(404, "Transaction not found");

  await Transaction.findByIdAndDelete(id);

  return res.status(200).json({
    success: true,
    message: "Transaction deleted successfully"
  });
});
