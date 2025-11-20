import mongoose from "mongoose";
import ApiError from "../utils/apiError.js";
import gatewayFactory from "../factory/gatewayFactory.js";
import Transaction from "../models/transaction.model.js";

export const paymentVerifyState = async (gatewayName, callbackPayload, config) => {
  const { ok, adapter } = gatewayFactory(gatewayName);
  if (!ok || !adapter) {
    throw new ApiError(400, "Unsupported gateway");
  }

  // accept many possible keys sent back by gateways (Paytm uses ORDERID / TXNAMOUNT, others use txnid, token, etc.)
  const extractedTxnId =
    callbackPayload?.token || // PayPal returns ?token=ORDER_ID
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
  console.log("Extracted TxnId:", extractedTxnId);
  console.log("Callback Payload:", JSON.stringify(callbackPayload, null, 2));
  console.log("==========================");

  if (!extractedTxnId) {
    throw new ApiError(400, "Missing transaction reference");
  }

  // Build search conditions and only try ObjectId when valid
  const conditions = [
    { gatewayOrderId: extractedTxnId },
    { transactionId: extractedTxnId },
    { gatewayPaymentId: extractedTxnId },
  ];

  if (mongoose.Types.ObjectId.isValid(extractedTxnId)) {
    conditions.push({ _id: new mongoose.Types.ObjectId(extractedTxnId) });
  }

  const transaction = await Transaction.findOne({ $or: conditions });
  if (!transaction) {
    console.log("Transaction lookup failed for:", extractedTxnId);
    throw new ApiError(404, "Transaction not found");
  }

  // call gateway verify safely
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
    // bubble a 502 so caller can see gateway-level failure
    throw new ApiError(502, result?.message || "Gateway verification failed");
  }

  // persist normalized result
  transaction.status = result.data.status;
  if (result.data.gatewayPaymentId) transaction.gatewayPaymentId = result.data.gatewayPaymentId;
  if (result.data.amount) transaction.amount = result.data.amount;
  transaction.verifiedAt = new Date();

  await transaction.save();

  // DEBUG: log saved transaction snapshot so we can see final status stored
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
