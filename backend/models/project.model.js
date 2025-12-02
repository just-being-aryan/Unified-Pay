import mongoose from "mongoose";
import crypto from "crypto";

const gatewayConfigSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    // stores gateway specific credentials here (string values), not the raw names
    config: { type: Object, default: {} },
  },
  { _id: false }
);

const apiKeySchema = new mongoose.Schema(
  {
    keyId: { type: String, required: true },
    secret: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    label: { type: String, default: "default" },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    environment: { type: String, enum: ["test", "live"], default: "test" },

    callbacks: {
      successUrl: { type: String, default: "" },
      failureUrl: { type: String, default: "" },
      webhookUrl: { type: String, default: "" },
    },

    apiKeys: { type: [apiKeySchema], default: [] },

   
    gatewayConfigs: {
      type: Map,
      of: gatewayConfigSchema,
      default: {},
    },

    
    isActive: { type: Boolean, default: true },
    settings: { type: Object, default: {} },
  },
  { timestamps: true }
);

projectSchema.statics.generateKeyPair = function () {
  const keyId = "pk_" + crypto.randomBytes(8).toString("hex");
  const secret = "sk_" + crypto.randomBytes(24).toString("hex");
  return { keyId, secret };
};

const Project = mongoose.model("Project", projectSchema);
export default Project;
