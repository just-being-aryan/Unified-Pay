import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    gateway: {
      type: String,
      required: true,
    },

    transactionId: { type: String, default: "" },
    gatewayOrderId: { type: String, default: "" },
    gatewayPaymentId: { type: String, default: "" },
    cashfreeLinkId: { type: String, default: "" },
    cashfreeOrderId: { type: String, default: "" },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    customer: {
      name: String,
      email: String,
      phone: String,
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
    },
  },
  { timestamps: true }
);

// ---------------------------------------------
//           ONLY THESE INDEXES. NO OTHERS.
// ---------------------------------------------
transactionSchema.index({ projectId: 1 });
transactionSchema.index({ projectId: 1, status: 1 });
transactionSchema.index({ projectId: 1, createdAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
