import express from "express";
import { createProject, getProject, listProjects } from "../controllers/project.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createProject);
router.get("/", protect, listProjects);
router.get("/:id", protect, getProject);

export default router;
