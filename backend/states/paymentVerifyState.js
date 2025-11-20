import mongoose from "mongoose";
import ApiError from "../utils/apiError.js";
import gatewayFactory from "../factory/gatewayFactory.js";
import Transaction from "../models/transaction.model.js";

export const paymentVerifyState = async (gatewayName, callbackPayload, config) => {
  const { ok, adapter } = gatewayFactory(gatewayName);
  if (!ok || !adapter) {
    throw new ApiError(400, "Unsupported gateway");
  }

  // Extract possible transaction references
  let extractedTxnId =
    callbackPayload?.token ||
    callbackPayload?.data?.link_id ||
    callbackPayload?.ORDERID ||
    callbackPayload?.ORDER_ID ||
    callbackPayload?.orderId ||
    callbackPayload?.txnid ||
    callbackPayload?.txnId ||
    callbackPayload?.transactionId ||
    callbackPayload?.order_id ||
    callbackPayload?.data?.order?.order_id ||
    callbackPayload?.data?.order_id ||
    callbackPayload?.gatewayOrderId ||
    null;

  console.log("=== VERIFY STATE DEBUG ===");
  console.log("Gateway:", gatewayName);
  console.log("Extracted TxnId (initial):", extractedTxnId);
  console.log("Callback Payload:", JSON.stringify(callbackPayload, null, 2));
  console.log("==========================");

  // -----------------------------------------------------------
  // 🔥 RAZORPAY FIX: use order_id (which we stored receipt = transactionId)
  // -----------------------------------------------------------
  if (!extractedTxnId && callbackPayload?.razorpay_order_id) {
    console.log("Applying Razorpay fallback: Using razorpay_order_id");
    extractedTxnId = callbackPayload.razorpay_order_id;
  }

  if (!extractedTxnId) {
    throw new ApiError(400, "Missing transaction reference");
  }

  // Build search conditions for Mongo
  const conditions = [
    { gatewayOrderId: extractedTxnId },
    { transactionId: extractedTxnId },
    { gatewayPaymentId: extractedTxnId },
  ];

  // If it's a valid ObjectId, try matching _id
  if (mongoose.Types.ObjectId.isValid(extractedTxnId)) {
    conditions.push({ _id: new mongoose.Types.ObjectId(extractedTxnId) });
  }

  const transaction = await Transaction.findOne({ $or: conditions });
  if (!transaction) {
    console.log("Transaction lookup failed for:", extractedTxnId);
    throw new ApiError(404, "Transaction not found");
  }

  // Call gateway verify
  let result;
  try {
    result = await adapter.verifyPayment({
      callbackPayload,
      config,
    });
  } catch (err) {
    console.error("Gateway verify threw error:", err?.response?.data || err?.message || err);
    throw new ApiError(502, "Gateway verification failed");
  }

  if (!result || !result.ok) {
    console.error("Gateway verify failed:", result?.message || result);
    throw new ApiError(502, result?.message || "Gateway verification failed");
  }

  // Persist normalized result
  transaction.status = result.data.status;

  if (result.data.gatewayPaymentId)
    transaction.gatewayPaymentId = result.data.gatewayPaymentId;

  if (result.data.amount)
    transaction.amount = result.data.amount;

  // If adapter returns the REAL transactionId (PayPal, Razorpay)
  if (result.data.transactionId) {
    transaction.gatewayOrderId = result.data.transactionId;
  }

  transaction.verifiedAt = new Date();

  await transaction.save();

  console.log("Transaction saved:", {
    id: transaction._id.toString(),
    status: transaction.status,
    gatewayOrderId: transaction.gatewayOrderId,
    gatewayPaymentId: transaction.gatewayPaymentId,
    amount: transaction.amount,
  });

  return {
    ok: true,
    message: "Transaction verified",
    data: {
      transactionId: transaction._id.toString(),
      status: transaction.status,
      gatewayPaymentId: transaction.gatewayPaymentId,
    },
  };
};
