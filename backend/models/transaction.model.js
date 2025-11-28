import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    gateway: {
      type: String,
      required: true,
      index: true,
    },

    // 🔥 NEW: store our own reference (string id)
    transactionId: {
      type: String,
      index: true,
      default: "",
    },

    // standard for all gateways
    gatewayOrderId: {
      type: String,
      index: true,
      default: "",
    },

    gatewayPaymentId: {
      type: String,
      index: true,
      default: "",
    },

    // 🔥 NEW: Cashfree-specific (link_id)
    cashfreeLinkId: {
      type: String,
      index: true,
      default: "",
    },

    // 🔥 NEW: Cashfree-specific (CFPay_xxx order_id)
    cashfreeOrderId: {
      type: String,
      index: true,
      default: "",
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "paid",
        "failed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    paymentInfo: {
      type: Object,
      default: {},
    },

    callbackData: {
      type: Object,
      default: {},
    },

    webhookData: {
      type: Object,
      default: {},
    },

    isWebhookReceived: {
      type: Boolean,
      default: false,
    },

    failureReason: {
      type: String,
      default: "",
    },

    initiatedAt: Date,
    verifiedAt: Date,
    refundedAt: Date,
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
