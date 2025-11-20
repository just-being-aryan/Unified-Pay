// controllers/report.controller.js

import asyncHandler from "express-async-handler";
import Transaction from "../models/transaction.model.js";

/* 
  STATUS REFERENCE:
  - paid → money received
  - failed → no money received
  - refunded → money returned (subtract from total)
*/

/* ---------------------------------------------
   1. OVERALL STATS
---------------------------------------------- */
export const getOverallStats = asyncHandler(async (req, res) => {
  const matchQuery = {};

  if (req.user.role !== "admin") {
    matchQuery.userId = req.user._id;
  }

  const stats = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" }
      }
    }
  ]);

  // Total payments (all)
  const totalPayments = stats.reduce((sum, s) => sum + s.count, 0);

  // Correct revenue calculation:
  const paidAmount =
    stats.find((s) => s._id === "paid")?.totalAmount || 0;

  const refundedAmount =
    stats.find((s) => s._id === "refunded")?.totalAmount || 0;

  const netAmount = paidAmount - refundedAmount; // subtract refunds

  const formatted = {
    totalPayments,
    totalAmount: netAmount,
    byStatus: stats.reduce((acc, cur) => {
      acc[cur._id] = {
        count: cur.count,
        amount: cur.totalAmount
      };
      return acc;
    }, {})
  };

  res.status(200).json({
    success: true,
    message: "Overall stats fetched successfully",
    data: formatted
  });
});

/* ---------------------------------------------
   2. GATEWAY SUMMARY
---------------------------------------------- */
export const getGatewaySummary = asyncHandler(async (req, res) => {
  const matchQuery = {};

  if (req.user.role !== "admin") {
    matchQuery.userId = req.user._id;
  }

  const gatewayStats = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$gateway",

        totalTransactions: { $sum: 1 },

        successCount: {
          $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
        },
        refundedCount: {
          $sum: { $cond: [{ $eq: ["$status", "refunded"] }, 1, 0] }
        },

        totalPaidAmount: {
          $sum: {
            $cond: [
              { $eq: ["$status", "paid"] },
              "$amount",
              0
            ]
          }
        },
        totalRefundAmount: {
          $sum: {
            $cond: [
              { $eq: ["$status", "refunded"] },
              "$amount",
              0
            ]
          }
        }
      }
    },
    {
      $addFields: {
        totalAmount: {
          $subtract: ["$totalPaidAmount", "$totalRefundAmount"]
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    message: "Gateway summary fetched",
    data: gatewayStats
  });
});

/* ---------------------------------------------
   3. REVENUE TREND (last 30 days, only net paid)
---------------------------------------------- */
export const getRevenueTrend = asyncHandler(async (req, res) => {
  const matchQuery = {
    createdAt: {
      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  };

  if (req.user.role !== "admin") {
    matchQuery.userId = req.user._id;
  }

  const trend = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        paidAmount: {
          $sum: {
            $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0]
          }
        },
        refundAmount: {
          $sum: {
            $cond: [{ $eq: ["$status", "refunded"] }, "$amount", 0]
          }
        }
      }
    },
    {
      $addFields: {
        totalAmount: { $subtract: ["$paidAmount", "$refundAmount"] }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    message: "Revenue trend (last 30 days) fetched",
    data: trend
  });
});
