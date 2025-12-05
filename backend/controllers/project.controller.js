// backend/controllers/project.controller.js
import asyncHandler from "express-async-handler";
import Project from "../models/project.model.js";
import ApiError from "../utils/apiError.js";
import { encryptVal } from "../utils/encryption.js";

/* -----------------------------------------------------------
   CREATE PROJECT
------------------------------------------------------------*/
export const createProject = asyncHandler(async (req, res) => {
  console.log("\n===== CREATE PROJECT REQUEST BODY =====");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("=======================================\n");

  const { name, description, environment, callbacks, gateways } = req.body;

  if (!name) {
    throw new ApiError(400, "Missing required fields: name ");
  }

  const normalizedGateways = {};

  if (gateways && typeof gateways === "object") {
    for (const [rawKey, val] of Object.entries(gateways)) {
      const key = String(rawKey).toLowerCase().trim();

      if (!val || typeof val !== "object") {
        console.warn(`Skipping gateway '${key}' — invalid structure`);
        continue;
      }

      const enabled = !!val.enabled;
      const cfg = val.fields || {}; // raw fields from frontend

      let normalizedConfig = {};
      let mode = 'live'

      switch (key) {
        /* -----------------------------------------------------------
           PAYU
        ------------------------------------------------------------*/
        case "payu":
          normalizedConfig = {
            merchantKey: cfg.PAYU_MERCHANT_KEY?.trim() || "",
            merchantSalt: cfg.PAYU_MERCHANT_SALT?.trim() || "",
            baseUrl: cfg.PAYU_BASE_URL?.trim() || "",
          };
          break;

        /* -----------------------------------------------------------
           CASHFREE
        ------------------------------------------------------------*/
        case "cashfree":
          normalizedConfig = {
            clientId: cfg.CASHFREE_APP_ID?.trim() || "",
            clientSecret: cfg.CASHFREE_SECRET_KEY?.trim() || "",
            baseUrl: cfg.CASHFREE_BASE_URL?.trim() || "",
          };
          break;

        /* -----------------------------------------------------------
           RAZORPAY
        ------------------------------------------------------------*/
        case "razorpay":
          normalizedConfig = {
            keyId: cfg.RAZORPAY_TEST_API_KEY?.trim() || "",
            keySecret: cfg.RAZORPAY_TEST_API_SECRET?.trim() || "",
          };
          break;

        /* -----------------------------------------------------------
           PAYPAL
        ------------------------------------------------------------*/
        case "paypal":
          normalizedConfig = {
            clientId: cfg.PAYPAL_CLIENT_ID?.trim() || "",
            secret: cfg.PAYPAL_SECRET?.trim() || "",
            baseUrl: cfg.PAYPAL_BASE_URL?.trim() || "",
          };
          break;

        /* -----------------------------------------------------------
           PAYTM
        ------------------------------------------------------------*/
        case "paytm":
          normalizedConfig = {
            mid: cfg.PAYTM_MID?.trim() || "",
            merchantKey: cfg.PAYTM_MERCHANT_KEY?.trim() || "",
            website: cfg.PAYTM_MERCHANT_WEBSITE?.trim() || "",
            industry: cfg.PAYTM_MERCHANT_INDUSTRY?.trim() || "",
            channelId: cfg.PAYTM_CHANNEL_ID?.trim() || "",
          };
          break;

        /* -----------------------------------------------------------
           FALLBACK → stores raw config
        ------------------------------------------------------------*/
        default:
          normalizedConfig = { ...cfg };
      }

      // Encrypt values before storing them
      const encryptedConfig = {};
      for (const [k, v] of Object.entries(normalizedConfig)) {
        encryptedConfig[k] =
          !v || String(v).trim() === "" ? null : encryptVal(v);
      }

      normalizedGateways[key] = {
        enabled,
        config: encryptedConfig,
        schema: Object.keys(normalizedConfig),
        mode,
      };
    }
  }

  console.log("\n===== NORMALIZED GATEWAYS AFTER LOOP =====");
  console.log(JSON.stringify(normalizedGateways, null, 2));
  console.log("==========================================\n");

  const pair = Project.generateKeyPair();

  const newProject = await Project.create({
    name,
    description: description || "",
    owner: req.user._id,
    callbacks: callbacks || {},
    apiKeys: [
      {
        keyId: pair.keyId,
        secret: pair.secret,
        label: "default",
      },
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
   GET SINGLE PROJECT
------------------------------------------------------------*/
export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) throw new ApiError(404, "Project not found");

  if (
    req.user.role !== "admin" &&
    project.owner.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Access denied");
  }

  return res.status(200).json({ success: true, data: project });
});

/* -----------------------------------------------------------
   LIST ALL PROJECTS OF USER
------------------------------------------------------------*/
export const listProjects = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role !== "admin") {
    filter.owner = req.user._id;
  }

  const projects = await Project.find(filter).sort({ createdAt: -1 });

  return res.status(200).json({ success: true, data: projects });
});
