import express from "express";
import { protect ,isAdmin} from "../middleware/authMiddleware.js";
import { dashboardLimiter } from "../middleware/rateLimiters.js";
import { cache } from "../middleware/cache.js";

import {
  getOverallStats,
  getGatewaySummary,
  getRevenueTrend,
} from "../controllers/report.controller.js";
const router = express.Router();


router.use(protect);



router.get(
  "/overall",
  dashboardLimiter,
  cache((req) => `reports:overall:user:${req.user._id}`),
  getOverallStats
);
router.get(
  "/gateway-summary",
  dashboardLimiter,
  cache((req) => `reports:gateway-summary:user:${req.user._id}`),
  getGatewaySummary
);
router.get("/revenue-trend", dashboardLimiter, isAdmin, getRevenueTrend);


export default router;
