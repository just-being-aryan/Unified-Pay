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


  if (!gateway || !amount || !customer || !customer.email) {
    throw new ApiError(400, "Missing required payment fields");
  }

  if (!userId) {
    throw new ApiError(400, "userId is required for transaction creation");
  }

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


  const result = await adapter.initiatePayment(adapterInput);


  if (!result.ok) {

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
    
    transaction.gatewayOrderId = transaction._id.toString();
  }

  await transaction.save();

  return {
    success: true,
    message: "Payment initiation successful",
    transactionId: transaction._id,
    ...result.data,
  };
};
