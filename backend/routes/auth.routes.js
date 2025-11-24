import express from "express";
import {
  googleAuth,
  googleCallback,
  linkedinAuth,
  linkedinCallback,
  facebookAuth, 
  facebookCallback

} from "../controllers/auth.controller.js";


const router = express.Router();

// Google
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

// LinkedIn
router.get("/linkedin", linkedinAuth);
router.get("/linkedin/callback", linkedinCallback);

router.get("/facebook", facebookAuth);
router.get("/facebook/callback", facebookCallback);

export default router;
