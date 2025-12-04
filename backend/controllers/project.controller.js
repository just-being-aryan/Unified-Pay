import asyncHandler from "express-async-handler";
import Project from "../models/project.model.js";
import ApiError from "../utils/apiError.js";

/**
 * POST /api/projects
 * Create a new project for logged-in user
 */
export const createProject = asyncHandler(async (req, res) => {
  const { name, description, environment, callbacks, gateways } = req.body;

  if (!name || !environment) {
    throw new ApiError(400, "Missing required fields: name or environment");
  }

  
  const normalizedGateways = {};

  if (gateways && typeof gateways === "object") {
    for (const [rawKey, val] of Object.entries(gateways)) {
      const key = String(rawKey).toLowerCase().trim();

      if (!val || typeof val !== "object") continue;

      const enabled = !!val.enabled;
      const cfg = val.config || {};

      // Mapping correction we implemented earlier:
      let normalizedConfig = {};
      let mode = cfg.mode || environment;

      switch (key) {
        case "payu":
          normalizedConfig = {
            merchantKey: cfg.merchantKey?.trim() || "",
            merchantSalt: cfg.merchantSalt?.trim() || "",
          };
          break;

        case "razorpay":
          normalizedConfig = {
            keyId: cfg.keyId?.trim() || "",
            keySecret: cfg.keySecret?.trim() || "",
          };
          break;

        case "cashfree":
          normalizedConfig = {
            clientId: cfg.clientId?.trim() || "",
            clientSecret: cfg.clientSecret?.trim() || "",
          };
          break;

        default:
          // generic mapping (fallback)
          normalizedConfig = { ...cfg };
      }

      normalizedGateways[key] = {
        enabled,
        credentials: normalizedConfig,
        mode, // store test/live  
      };
    }
  }

  // generate default api key pair
  const pair = Project.generateKeyPair();

  const newProject = await Project.create({
    name,
    description: description || "",
    owner: req.user._id,
    environment,

    callbacks: callbacks || {},

    apiKeys: [
      {
        keyId: pair.keyId,
        secret: pair.secret,
        label: "default",
      },
    ],

    // 🔥 the correct gateway storage format
    gatewayConfigs: normalizedGateways,
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

/**
 * GET /api/projects/:id
 */
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

/**
 * GET /api/projects
 */
export const listProjects = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role !== "admin") filter.owner = req.user._id;

  const projects = await Project.find(filter).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: projects });
});
