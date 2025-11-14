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
    config
  } = input;

  console.log("🔍 paymentInitiateState - Input received:", {
    gateway,
    amount,
    currency,
    customer,
    redirect,
    meta,
    userId,
  });

  if (!gateway || !amount || !customer || !customer.email) {
    throw new ApiError(400, "Missing required payment fields");
  }

  if (!userId) {
    throw new ApiError(400, "userId is required for transaction creation");
  }

  // Ensure redirect object exists
  if (!redirect || typeof redirect !== "object") {
    throw new ApiError(400, "Redirect must be an object with successUrl & failureUrl");
  }

 
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

  // Build absolute success/failure URLs
  const buildAbsolute = (url) => {
    if (!url) return "";
    return url.startsWith("http")
      ? url
      : `${FRONTEND_URL}${url.startsWith("/") ? url : "/" + url}`;
  };

  const absoluteSuccessUrl = buildAbsolute(redirect.successUrl);
  const absoluteFailureUrl = buildAbsolute(redirect.failureUrl);

  if (!absoluteSuccessUrl || !absoluteFailureUrl) {
    throw new ApiError(
      400,
      `Redirect URLs invalid. successUrl=${redirect.successUrl}, failureUrl=${redirect.failureUrl}`
    );
  }

  console.log("🔗 Final Redirect URLs:", {
    absoluteSuccessUrl,
    absoluteFailureUrl,
  });

  // Validate customer details
  if (gateway.toLowerCase() === "payu") {
    if (!customer.name || !customer.email || !customer.phone) {
      throw new ApiError(
        400,
        `Missing required customer details: 
        name=${customer.name}, 
        email=${customer.email}, 
        phone=${customer.phone}`
      );
    }
  }

  const { ok, adapter } = gatewayFactory(gateway);

  if (!ok || !adapter) {
    throw new ApiError(400, "Unsupported gateway");
  }

  console.log("✅ Gateway adapter loaded successfully");

  // Create transaction
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

  console.log("✅ Transaction created:", transaction._id.toString());

  const adapterInput = {
    amount,
    currency,
    transactionId: transaction._id.toString(),
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    redirect: {
      successUrl: absoluteSuccessUrl,
      failureUrl: absoluteFailureUrl,
    },
    meta: {
      productInfo: meta.description || meta.productInfo || "Product Purchase",
      ...meta,
    },
    config: config || {},
  };

  // Inject gateway config automatically
  let gatewayConfig = {};

  switch (gateway.toLowerCase()) {
      case "payu":
        gatewayConfig = {
          key: process.env.PAYU_MERCHANT_KEY,
          salt: process.env.PAYU_MERCHANT_SALT,
          baseUrl: process.env.PAYU_BASE_URL,
        };
        break;

      case "cashfree":
        gatewayConfig = {
          appId: process.env.CASHFREE_APP_ID,
          secretKey: process.env.CASHFREE_SECRET_KEY,
          baseUrl: process.env.CASHFREE_BASE_URL,
        };
        break;

      default:
    throw new ApiError(400, "Unsupported gateway");
}

adapterInput.config = gatewayConfig;


  console.log("🔍 Adapter input prepared:", JSON.stringify(adapterInput, null, 2));

  const result = await adapter.initiatePayment(adapterInput);

  console.log("🔍 Gateway response:", JSON.stringify(result, null, 2));

  if (!result.ok) {
    throw new ApiError(500, result.message || "Gateway initiate error");
  }

  if (result.data?.params?.txnid) {
    transaction.gatewayOrderId = result.data.params.txnid;
    await transaction.save();
  }

  return {
    success: true,
    message: "Payment initiation successful",
    transactionId: transaction._id,
    ...result.data,
  };
};
