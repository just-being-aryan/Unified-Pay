import express from "express";
import { protect ,isAdmin} from "../middleware/authMiddleware.js";
import { dashboardLimiter } from "../middleware/rateLimiters.js";
import {
  getOverallStats,
  getGatewaySummary,
  getRevenueTrend,
} from "../controllers/report.controller.js";
const router = express.Router();


router.use(protect);



router.get("/overall", dashboardLimiter, getOverallStats);
router.get("/gateway-summary", dashboardLimiter, getGatewaySummary);
router.get("/revenue-trend", dashboardLimiter, isAdmin, getRevenueTrend);


export default router;
