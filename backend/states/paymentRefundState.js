import Transaction from "../models/transaction.model.js";
import gatewayFactory from "../factory/gatewayFactory.js";
import ApiError from "../utils/apiError.js";

export const paymentRefundState = async (transactionId, amount, reason, config) => {
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  if (transaction.status !== "paid") {
    throw new ApiError(400, "Refund can only be initiated for successful payments");
  }

  const gatewayName = transaction.gateway;
  const gatewayPaymentId = transaction.gatewayPaymentId;

  //select gateway
  const { ok, adapter } = gatewayFactory(gatewayName);

  if (!ok || !adapter) {
    throw new ApiError(400, "Unsupported gateway");
  }

  // Call adapter refund logic
  const result = await adapter.refundPayment({
    gatewayPaymentId,
    amount,
    reason,
    config
  });

  if (!result.ok) {
    throw new ApiError(500, result.message || "Refund failed");
  }

  // Update transaction status
  transaction.status = "refunded";
  transaction.refundInfo = result.data;
  transaction.refundedAt = new Date();  
  await transaction.save();

  return {
    success: true,
    message: "Refund processed",
    refund: result.data,
  };
};
