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

  console.log("🔍 paymentInitiateState INPUT:", {
    gateway,
    amount,
    currency,
    customer,
    redirect,
    meta,
    config,
    userId,
  });

  if (!gateway || !amount || !customer || !customer.email) {
    throw new ApiError(400, "Missing required payment fields");
  }

  if (!userId) {
    throw new ApiError(400, "userId is required for transaction creation");
  }

  // For PayU, we require full customer info
  if (gateway.toLowerCase() === "payu") {
    if (!customer.name || !customer.email || !customer.phone) {
      throw new ApiError(
        400,
        `Missing required customer details for PayU. ` +
          `name: ${customer.name || "missing"}, ` +
          `email: ${customer.email || "missing"}, ` +
          `phone: ${customer.phone || "missing"}`
      );
    }
  }

  const { ok, adapter } = gatewayFactory(gateway);
  if (!ok || !adapter) {
    throw new ApiError(400, "Unsupported gateway");
  }

  console.log("✅ Gateway adapter loaded:", gateway);

  // Always create NEW transaction
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

  console.log("✅ Transaction created:", transaction._id);

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
    meta: {
      productInfo: meta.description || meta.productInfo || "Product Purchase",
      ...meta,
    },
    config: config || {},
  };

  console.log("🔍 Adapter Input:", adapterInput);

  const result = await adapter.initiatePayment(adapterInput);

  console.log("🔍 Gateway response:", result);

  if (!result.ok) {
    console.error("❌ Gateway Error:", result);

    transaction.status = "failed";
    transaction.failureReason = result.message || "Gateway initiation failed";
    await transaction.save();

    throw new ApiError(500, result.message || "Gateway initiate error");
  }

  // Store gateway order id
  if (result.data?.orderId) {
    transaction.gatewayOrderId = result.data.orderId;
  } else if (result.data?.gatewayOrderId) {
    transaction.gatewayOrderId = result.data.gatewayOrderId;
  } else if (result.data?.params?.txnid) {
    transaction.gatewayOrderId = result.data.params.txnid;
  } else {
    // Fallback: use our own transaction id
    transaction.gatewayOrderId = transaction._id.toString();
  }

  await transaction.save();

  console.log(
    "✅ Payment initiated successfully with transaction ID:",
    transaction._id
  );

  return {
    success: true,
    message: "Payment initiation successful",
    transactionId: transaction._id,
    ...result.data,
  };
};
