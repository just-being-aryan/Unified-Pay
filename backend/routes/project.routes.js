import express from "express";
import { createProject, getProject, listProjects } from "../controllers/project.controller.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  getProjectStats,
  getProjectTransactions,
  getProjectRefunds,
  deleteProject,
  
} from "../controllers/projectInfo.controller.js";
import updateProjectSettings from "../controllers/projectSettings.controller.js";
const router = express.Router();

router.post("/", protect, createProject);
router.get("/", protect, listProjects);
router.get("/:id", protect, getProject);


router.get("/:id/stats", protect, getProjectStats);
router.get("/:id/transactions", protect, getProjectTransactions);
router.get("/:id/refunds", protect, getProjectRefunds);
router.delete("/:id", protect, deleteProject);
router.patch("/:id/settings", protect, updateProjectSettings);


export default router;
