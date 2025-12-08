// backend/controllers/projectSettings.controller.js
import Project from "../models/project.model.js";
import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";
import { encryptVal } from "../utils/encryption.js";

const updateProjectSettings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, callbacks, gateways } = req.body;

  console.log(" SETTINGS RECEIVED:", JSON.stringify(req.body, null, 2));

  const project = await Project.findById(id);
  if (!project) throw new ApiError(404, "Project not found");

  if (name) project.name = name;
  if (description !== undefined) project.description = description;

  if (callbacks) {
    project.callbacks.successUrl = callbacks.successUrl ?? project.callbacks.successUrl;
    project.callbacks.failureUrl = callbacks.failureUrl ?? project.callbacks.failureUrl;
    project.callbacks.webhookUrl = callbacks.webhookUrl ?? project.callbacks.webhookUrl;
  }

  
  let existing = {};
  if (project.gatewayConfigs instanceof Map) {
    existing = Object.fromEntries(project.gatewayConfigs);
  } else if (typeof project.gatewayConfigs === "object" && project.gatewayConfigs !== null) {
    existing = { ...project.gatewayConfigs };
  }


  if (gateways && typeof gateways === "object") {
    for (const [gwKey, gwData] of Object.entries(gateways)) {
      if (!gwData) continue;

      const enabled = !!gwData.enabled;

      const encryptedConfig = {};
      for (const [k, v] of Object.entries(gwData.config || {})) {
        encryptedConfig[k] = v ? encryptVal(v) : null;
      }

      existing[gwKey] = {
        enabled,
        config: encryptedConfig,
        schema: Object.keys(gwData.config || {}),
        mode: "live",
      };
    }

    project.gatewayConfigs = existing;
  }

  await project.save();

  return res.status(200).json({
    success: true,
    data: project,
  });
});


export default updateProjectSettings;
