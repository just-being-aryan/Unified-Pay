// backend/controllers/project.controller.js
import asyncHandler from "express-async-handler";
import Project from "../models/project.model.js";
import ApiError from "../utils/apiError.js";
import { encryptVal } from "../utils/encryption.js";

/* -----------------------------------------------------------
   CREATE PROJECT
------------------------------------------------------------*/
export const createProject = asyncHandler(async (req, res) => {
  const { name, description, callbacks, gateways } = req.body;

  if (!name) throw new ApiError(400, "Missing required fields: name");

  const normalizedGateways = {};

  if (gateways && typeof gateways === "object") {
    for (const [rawKey, val] of Object.entries(gateways)) {
      const key = rawKey.toLowerCase().trim();
      if (!val || typeof val !== "object") continue;

      const enabled = !!val.enabled;
      const cfg = val.fields || {};
      let normalizedConfig = {};
      let mode = "live";

      switch (key) {
        case "payu":
          normalizedConfig = {
            merchantKey: cfg.PAYU_MERCHANT_KEY || "",
            merchantSalt: cfg.PAYU_MERCHANT_SALT || "",
            baseUrl: cfg.PAYU_BASE_URL || "",
          };
          break;

        case "cashfree":
          normalizedConfig = {
            clientId: cfg.CASHFREE_APP_ID || "",
            clientSecret: cfg.CASHFREE_SECRET_KEY || "",
            baseUrl: cfg.CASHFREE_BASE_URL || "",
          };
          break;

        case "razorpay":
          normalizedConfig = {
            keyId: cfg.RAZORPAY_TEST_API_KEY || "",
            keySecret: cfg.RAZORPAY_TEST_API_SECRET || "",
          };
          break;

        case "paypal":
          normalizedConfig = {
            clientId: cfg.PAYPAL_CLIENT_ID || "",
            secret: cfg.PAYPAL_SECRET || "",
            baseUrl: cfg.PAYPAL_BASE_URL || "",
          };
          break;

        case "paytm":
          normalizedConfig = {
            mid: cfg.PAYTM_MID || "",
            merchantKey: cfg.PAYTM_MERCHANT_KEY || "",
            website: cfg.PAYTM_MERCHANT_WEBSITE || "",
            industry: cfg.PAYTM_MERCHANT_INDUSTRY || "",
            channelId: cfg.PAYTM_CHANNEL_ID || "",
          };
          break;

        default:
          normalizedConfig = { ...cfg };
      }

      const encryptedConfig = {};
      for (const [k, v] of Object.entries(normalizedConfig)) {
        encryptedConfig[k] = !v ? null : encryptVal(v);
      }

      normalizedGateways[key] = {
        enabled,
        config: encryptedConfig,
        schema: Object.keys(normalizedConfig),
        mode,
      };
    }
  }

  const pair = Project.generateKeyPair();

  const newProject = await Project.create({
    name,
    description: description || "",
    owner: req.user._id,
    callbacks: callbacks || {},
    apiKeys: [
      { keyId: pair.keyId, secret: pair.secret, label: "default" },
    ],
    gatewayConfigs: new Map(Object.entries(normalizedGateways)),
  });

  return res.status(201).json({
    success: true,
    data: {
      project: newProject,
      apiKey: pair.keyId,
      apiSecret: pair.secret,
    },
  });
});

/* -----------------------------------------------------------
   GET PROJECT
------------------------------------------------------------*/
export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) throw new ApiError(404, "Project not found");
  if (req.user.role !== "admin" && project.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied");
  }

  return res.status(200).json({ success: true, data: project });
});

/* -----------------------------------------------------------
   LIST USER PROJECTS
------------------------------------------------------------*/
export const listProjects = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { owner: req.user._id };
  const projects = await Project.find(filter).sort({ createdAt: -1 });

  return res.status(200).json({ success: true, data: projects });
});
