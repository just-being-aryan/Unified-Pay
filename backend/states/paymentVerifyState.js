import Transaction from "../models/transaction.model.js";
import gatewayFactory from "../factory/gatewayFactory.js";
import ApiError from "../utils/apiError.js";

export const paymentVerifyState = async (gatewayName, callbackPayload, config) => {
  // Load gateway adapter
  const { ok, adapter } = gatewayFactory(gatewayName);

  if (!ok || !adapter) {
    throw new ApiError(400, "Unsupported gateway");
  }

  // Extract txn id from payload
  const txnid = callbackPayload.txnid;

  if (!txnid) {
    throw new ApiError(400, "Missing txnid in callback payload");
  }

  const transaction = await Transaction.findOne({
    $or: [
      { gatewayOrderId: txnid },
      { _id: txnid }
    ]
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  // Call adapter verification logic
  const result = await adapter.verifyPayment({
    callbackPayload,
    config,
  });

  if (!result.ok) {
    // update failed
    transaction.status = "failed";
    transaction.callbackData = callbackPayload;
    await transaction.save();

    return {
      success: false,
      message: result.message,
      status: "failed"
    };
  }

  // Map unified status
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
