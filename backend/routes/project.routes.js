import express from "express";
import { createProject, getProject, listProjects } from "../controllers/project.controller.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  getProjectStats,
  getProjectTransactions,
  getProjectRefunds,
  deleteProject,
  getProjectFull
  
} from "../controllers/projectInfo.controller.js";
import updateProjectSettings from "../controllers/projectSettings.controller.js";
import { dashboardLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/", protect, createProject);
router.get("/", protect, listProjects);
router.get("/:id", protect, getProject);
router.get("/:id/full", protect, dashboardLimiter, getProjectFull);
router.get("/:id/stats", protect, dashboardLimiter, getProjectStats);
router.get("/:id/transactions", protect, dashboardLimiter, getProjectTransactions);
router.get("/:id/refunds", protect, dashboardLimiter, getProjectRefunds);
router.delete("/:id", protect, deleteProject);
router.patch("/:id/settings", protect, updateProjectSettings);


export default router;
