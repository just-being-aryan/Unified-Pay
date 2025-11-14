import mongoose from "mongoose";

const gatewayResponseLogSchema = new mongoose.Schema(
  {
    gateway: {
      type: String,
      required: true, 
    },
    type: {
      type: String,
      enum: ["initiation", "verification", "refund", "webhook"],
      required: true,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: false, 
    },
    requestPayload: {
      type: Object,
      default: {},
    },
    responsePayload: {
      type: Object,
      default: {},
    },
    statusCode: {
      type: Number,
      default: 0,
    },
    message: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("GatewayResponseLog", gatewayResponseLogSchema);
