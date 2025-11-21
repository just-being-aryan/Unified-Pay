import express from "express";
import {
  googleAuth,
  googleCallback,
  linkedinAuth,
  linkedinCallback,
} from "../controllers/auth.controller.js";

const router = express.Router();

// Google
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

// LinkedIn
router.get("/linkedin", linkedinAuth);
router.get("/linkedin/callback", linkedinCallback);

export default router;
