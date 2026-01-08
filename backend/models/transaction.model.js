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

    gst: {
      enabled: { type: Boolean, default: false },
      invoiceNumber: { type: String, default: "" },

      taxes: {
        taxableValue: { type: Number, default: 0 },
        cgst: { type: Number, default: 0 },
        sgst: { type: Number, default: 0 },
        igst: { type: Number, default: 0 },
        totalTax: { type: Number, default: 0 },
        grandTotal: { type: Number, default: 0 }
      },

      irn: {
        number: { type: String, default: "" },
        ackNo: { type: String, default: "" },
        ackDate: { type: Date },
        qrCode: { type: String, default: "" },
        status: {
          type: String,
          enum: ["NOT_SUBMITTED", "GENERATED", "FAILED"],
          default: "NOT_SUBMITTED"
        },
        rawResponse: { type: Object, default: {} }
      }
    },

   
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);


transactionSchema.index({ projectId: 1 });
transactionSchema.index({ projectId: 1, status: 1 });
transactionSchema.index({ projectId: 1, createdAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
