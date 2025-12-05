// backend/controllers/projectSettings.controller.js
import Project from "../models/project.model.js";
import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";
import { encryptVal } from "../utils/encryption.js";

const updateProjectSettings = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    name,
    description,
    callbacks,
    gateways,
  } = req.body;

  const project = await Project.findById(id);
  if (!project) throw new ApiError(404, "Project not found");

  
  if (name) project.name = name;
  if (description !== undefined) project.description = description;

  
  if (callbacks) {
    project.callbacks = project.callbacks || {};
    project.callbacks.successUrl = callbacks.successUrl ?? project.callbacks.successUrl;
    project.callbacks.failureUrl = callbacks.failureUrl ?? project.callbacks.failureUrl;
    project.callbacks.webhookUrl = callbacks.webhookUrl ?? project.callbacks.webhookUrl;
  }

  
  if (gateways && typeof gateways === "object") {
    project.gatewayConfigs = project.gatewayConfigs || {};

    for (const [gwKey, gwData] of Object.entries(gateways)) {
      if (!gwData) continue;

      const enabled = !!gwData.enabled;
      const incomingConfig = gwData.config || {};

      
      const existing = project.gatewayConfigs[gwKey] || project.gatewayConfigs.get?.(gwKey) || null;

      
      const mergedEncrypted = {};

      
      if (existing && existing.config) {
        for (const [k, enc] of Object.entries(existing.config || {})) {
          mergedEncrypted[k] = enc; 
        }
      }

      
      for (const [k, v] of Object.entries(incomingConfig)) {
        mergedEncrypted[k] = v ? encryptVal(v) : null;
      }

      
      const schemaKeys = Array.from(new Set([
        ...(existing?.schema || []),
        ...Object.keys(incomingConfig || {}),
      ]));

      const newEntry = {
        enabled,
        config: mergedEncrypted,
        schema: schemaKeys,
        mode: "live",
      };

      
      if (project.gatewayConfigs instanceof Map) {
        project.gatewayConfigs.set(gwKey, newEntry);
      } else {
        project.gatewayConfigs[gwKey] = newEntry;
      }
    }
  }

  await project.save();

  return res.status(200).json({
    success: true,
    data: project,
  });
});

export default updateProjectSettings;
