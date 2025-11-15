import express from "express";
import { protect ,isAdmin} from "../middleware/authMiddleware.js";
import {
  getOverallStats,
  getGatewaySummary,
  getRevenueTrend,
} from "../controllers/report.controller.js";
const router = express.Router();


router.use(protect);



router.get("/overall", protect, getOverallStats);             

router.get("/gateway-summary", protect, getGatewaySummary);  

router.get("/revenue-trend", protect, isAdmin, getRevenueTrend); // only admin

export default router;
