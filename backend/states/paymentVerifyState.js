// backend/states/paymentVerifyState.js
import mongoose from "mongoose";
import ApiError from "../utils/apiError.js";
import gatewayFactory from "../factory/gatewayFactory.js";
import Transaction from "../models/transaction.model.js";

export const paymentVerifyState = async (gatewayName, callbackPayload, config) => {
  const { ok, adapter } = gatewayFactory(gatewayName);
  if (!ok) throw new ApiError(400, "Unsupported gateway");

  // Gateway adapters MUST return `transactionId` in result.data
  // But during callback we must locate the right transaction
  let extractedRef = 
    callbackPayload?.ORDERID ||
    callbackPayload?.orderId ||
    callbackPayload?.order_id ||
    callbackPayload?.txnid ||
    callbackPayload?.transactionId ||
    callbackPayload?.token ||
    callbackPayload?.data?.order_id ||
    callbackPayload?.data?.order?.order_id ||
    callbackPayload?.gatewayOrderId ||
    null;

  console.log("=== VERIFY STATE DEBUG ===");
  console.log("Gateway:", gatewayName);
  console.log("Extracted TxnId (initial):", extractedRef);
  console.log("Callback Payload:", JSON.stringify(callbackPayload, null, 2));
  console.log("==========================");

  if (!extractedRef) {
    throw new ApiError(400, "Missing transaction reference");
  }

  // Search DB in all possible fields
  const conditions = [
    { gatewayOrderId: extractedRef },
    { transactionId: extractedRef },
    { gatewayPaymentId: extractedRef }
  ];

  if (mongoose.Types.ObjectId.isValid(extractedRef)) {
    conditions.push({ _id: extractedRef });
  }

  const transaction = await Transaction.findOne({ $or: conditions });
  if (!transaction) throw new ApiError(404, "Transaction not found");

  // Call adapter verify
  const result = await adapter.verifyPayment({
    callbackPayload,
    config,
  });

  if (!result.ok) {
    throw new ApiError(502, result.message || "Gateway verification failed");
  }

  // Normalize and save
  transaction.status = result.data.status;

  if (result.data.gatewayPaymentId)
    transaction.gatewayPaymentId = result.data.gatewayPaymentId;

  if (result.data.amount)
    transaction.amount = result.data.amount;

  if (result.data.transactionId)
    transaction.gatewayOrderId = result.data.transactionId;

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
