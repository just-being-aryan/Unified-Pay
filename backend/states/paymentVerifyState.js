import Transaction from "../models/transaction.model.js";
import gatewayFactory from "../factory/gatewayFactory.js";
import ApiError from "../utils/apiError.js";

export const paymentVerifyState = async (gatewayName, callbackPayload, config) => {
  const { ok, adapter } = gatewayFactory(gatewayName);
  if (!ok || !adapter) {
    throw new ApiError(400, "Unsupported gateway");
  }

  const extractedTxnId =
    callbackPayload?.data?.link_id ||
    callbackPayload?.txnid ||
    callbackPayload?.order_id ||
    callbackPayload?.orderId;

  if (!extractedTxnId) {
    throw new ApiError(400, "Missing transaction reference");
  }

  const transaction = await Transaction.findOne({
    gatewayOrderId: extractedTxnId
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  const result = await adapter.verifyPayment({
    callbackPayload,
    config,
  });

  if (!result.ok) {
    transaction.status = "failed";
    transaction.callbackData = callbackPayload;
    await transaction.save();

    return {
      success: false,
      message: result.message,
      status: "failed"
    };
  }

  transaction.status = result.data.status;
  transaction.gatewayPaymentId = result.data.gatewayPaymentId;
  transaction.callbackData = callbackPayload;

  if (result.data.status === "paid") {
    transaction.verifiedAt = new Date();
  }

  await transaction.save();

  return {
    success: true,
    message: "Payment verified",
    status: result.data.status,
    transactionId: transaction._id,
  };
};
