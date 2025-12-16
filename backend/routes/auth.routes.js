import express from "express";
import {
  googleAuth,
  googleCallback,
  linkedinAuth,
  linkedinCallback,
  facebookAuth, 
  facebookCallback

} from "../controllers/auth.controller.js";
import { authLimiter } from "../middleware/rateLimiters.js";


const router = express.Router();

// Google
router.get("/google", googleAuth);
router.get("/google/callback",authLimiter, googleCallback);

// LinkedIn
router.get("/linkedin", linkedinAuth);
router.get("/linkedin/callback", authLimiter,linkedinCallback);

router.get("/facebook", facebookAuth);
router.get("/facebook/callback", authLimiter,facebookCallback);

export default router;
