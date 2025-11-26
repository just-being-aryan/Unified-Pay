// backend/states/paymentInitiateState.js
import Transaction from "../models/transaction.model.js";
import gatewayFactory from "../factory/gatewayFactory.js";
import ApiError from "../utils/apiError.js";

export const paymentInitiateState = async (input) => {
  const {
    gateway,
    amount,
    currency = "INR",
    customer,
    redirect,
    meta = {},
    userId,
    config,
  } = input;

  if (!gateway || !amount || !customer?.email) {
    throw new ApiError(400, "Missing required payment fields");
  }

  if (!userId) {
    throw new ApiError(400, "userId is required for transaction creation");
  }

  const { ok, adapter } = gatewayFactory(gateway);
  if (!ok) throw new ApiError(400, "Unsupported gateway");

  // Create DB transaction
  const transaction = await Transaction.create({
    userId,
    gateway,
    amount,
    currency,
    status: "pending",
    customerEmail: customer.email,
    customerPhone: customer.phone || null,
    customerName: customer.name || null,
    meta,
    initiatedAt: new Date(),
  });

  // Prepare standardized adapter input
  const adapterInput = {
    amount,
    currency,
    transactionId: transaction._id.toString(),
    customer: {
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
    },
    redirect: {
      successUrl: redirect?.successUrl || "",
      failureUrl: redirect?.failureUrl || "",
      notifyUrl: redirect?.notifyUrl || redirect?.successUrl || "",
    },
    meta,
    config: config || {},
  };

  // Adapter handles everything gateway-specific
  const result = await adapter.initiatePayment(adapterInput);

  if (!result.ok) {
    transaction.status = "failed";
    transaction.failureReason = result.message || "Gateway initiation failed";
    await transaction.save();
    throw new ApiError(500, result.message || "Gateway initiate error");
  }

  // Save gateway’s order reference
  transaction.gatewayOrderId =
    result.data?.gatewayOrderId ||
    result.data?.orderId ||
    result.data?.params?.txnid ||
    transaction._id.toString();

  await transaction.save();

  return {
    ok: true,
    success: true,
    message: "Payment initiation successful",
    data: {
      transactionId: transaction._id.toString(),
      ...result.data,
    },
  };
};
