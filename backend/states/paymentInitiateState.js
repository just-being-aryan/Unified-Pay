// backend/states/paymentInitiateState.js
import Transaction from "../models/transaction.model.js";
import gatewayFactory from "../factory/gatewayFactory.js";
import ApiError from "../utils/apiError.js";

export const paymentInitiateState = async (input) => {
  const {
    gateway,
    projectId,
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


  // -----------------------------
  // CLEAN + SANITIZE CUSTOMER
  // -----------------------------

  const cleanCustomer = {
  name: customer?.name || "",
  email: customer?.email || "",
  phone: customer?.phone || "9999999999", 
};


  // -----------------------------
  // CREATE TRANSACTION RECORD
  // -----------------------------
  const transaction = await Transaction.create({
    userId,
    gateway,
    amount,
    projectId,
    currency,
    status: "pending",

    customer: cleanCustomer,

    meta,
    initiatedAt: new Date(),
    transactionId: null,
  });


  // -----------------------------
  // PREPARE ADAPTER INPUT
  // -----------------------------
  const adapterInput = {
    projectId,
    amount,
    currency,
    transactionId: transaction._id.toString(),

    customer: cleanCustomer,

    redirect: {
      successUrl: redirect?.successUrl || "",
      failureUrl: redirect?.failureUrl || "",
      notifyUrl: redirect?.notifyUrl || redirect?.successUrl || "",
    },

    meta,
    config: config || {},
  };


  console.log("\n--- PAYMENT INIT STATE INPUT ---");
  console.log("GATEWAY:", gateway);
  console.log("PROJECT ID:", projectId);
  console.log("CUSTOMER:", cleanCustomer);
  console.log("CONFIG RECEIVED:", config);
  console.log("-------------------------------\n");


  
  const result = await adapter.initiatePayment(adapterInput);

  if (!result.ok) {
    transaction.status = "failed";
    transaction.failureReason = result.message || "Gateway initiation failed";
    await transaction.save();
    throw new ApiError(500, result.message || "Gateway initiate error");
  }


  // -----------------------------
  // SPECIAL CASE — CASHFREE
  // -----------------------------
  if (gateway === "cashfree") {
    const raw = result.data?.raw || {};

    const linkId =
      raw.link_id ||
      result.data?.gatewayOrderId ||
      "";

    const orderId =
      raw.order_id ||
      raw.cf_order_id ||
      raw.payment?.cf_payment_id ||
      "";

    transaction.cashfreeLinkId = linkId;
    transaction.cashfreeOrderId = orderId;

    transaction.gatewayOrderId = linkId;
  } else {
    transaction.gatewayOrderId =
      result.data?.gatewayOrderId ||
      result.data?.orderId ||
      result.data?.params?.txnid ||
      transaction._id.toString();
  }

  transaction.transactionId = transaction._id.toString();

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
