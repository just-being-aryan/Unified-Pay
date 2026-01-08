// backend/states/paymentVerifyState.js
import mongoose from "mongoose";
import ApiError from "../utils/apiError.js";
import gatewayFactory from "../factory/gatewayFactory.js";
import Transaction from "../models/transaction.model.js";

export const paymentVerifyState = async (
  gatewayName,
  callbackPayload,
  config
) => {
  const { ok, adapter } = gatewayFactory(gatewayName);
  if (!ok) throw new ApiError(400, "Unsupported gateway");

  const extractedRef = adapter.extractReference(callbackPayload);
  if (!extractedRef) {
    throw new ApiError(400, "Missing gateway reference");
  }

  const conditions = [
    { gatewayOrderId: extractedRef },
    { gatewayPaymentId: extractedRef },
    { transactionId: extractedRef },
  ];

  if (mongoose.Types.ObjectId.isValid(extractedRef)) {
    conditions.push({ _id: extractedRef });
  }

  const transaction = await Transaction.findOne({ $or: conditions });
  if (!transaction) throw new ApiError(404, "Transaction not found");

  const result = await adapter.verifyPayment({
    callbackPayload,
    config,
  });

  if (!result.ok) {
    throw new ApiError(502, result.message || "Gateway verification failed");
  }

  transaction.status = result.data.status;

  if (result.data.gatewayPaymentId) {
    transaction.gatewayPaymentId = result.data.gatewayPaymentId;
  }

  if (result.data.amount) {
    transaction.amount = result.data.amount;
  }

  transaction.verifiedAt = new Date();
  await transaction.save();

  if (transaction.projectId) {
    const Project = await import("../models/project.model.js").then(m => m.default);
    const project = await Project.findById(transaction.projectId);

    if (project?.gstConfig?.enabled) {
      const { createGSTInvoice, generateSandboxIRN } = await import("../services/gstInvoice.service.js");
      await createGSTInvoice(transaction, project);
      await generateSandboxIRN(transaction);
    }
  }

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
