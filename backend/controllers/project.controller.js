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
    for (const [key, val] of Object.entries(gateways)) {
      const k = String(key).toLowerCase().trim();
      normalizedGateways[k] = {
        enabled: !!val.enabled,
        config: val.config || {},
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
    apiKeys: [{ keyId: pair.keyId, secret: pair.secret, label: "default" }],
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
 * Get a single project (owner or admin)
 */
export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");

  
  if (req.user.role !== "admin" && project.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied");
  }

  return res.status(200).json({ success: true, data: project });
});

/**
 * GET /api/projects
 * List projects for the current user (or admin sees all)
 */
export const listProjects = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role !== "admin") filter.owner = req.user._id;

  const projects = await Project.find(filter).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: projects });
});
