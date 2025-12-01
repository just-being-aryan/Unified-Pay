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

    
    cashfreeLinkId: {
      type: String,
      index: true,
      default: "",
    },

  
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
    customer: {
      name: { type: String, default: "N/A" },
      email: { type: String, default: "N/A" },
      phone: { type: String, default: "N/A" },
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
