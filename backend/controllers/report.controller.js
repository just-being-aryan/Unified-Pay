/*
    Endpoint	                             Purpose                                             Used in Frontend
/api/reports/stats	                        KSPIs (cards)	            “Total Payments”, “Total Volume”, “Success/Fail Counts”
/api/reports/gateway-summary	        Per-gateway analytics	                          “Gateway-wise chart”
/api/reports/revenue-trend	                30-day graph	                           “Revenue trend line chart”

*/


import asyncHandler from "express-async-handler";
import Transaction from "../models/transaction.model.js";
import ApiError from "../utils/apiError.js";


export const getOverallStats = asyncHandler(async (req, res) => {
  const matchQuery = {};

  //1 Admin sees all, normal user sees own data
  if (req.user.role !== "admin") {
    matchQuery.userId = req.user._id;
  }


  const stats = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  const formatted = {
    totalPayments: stats.reduce((a, b) => a + b.count, 0),
    totalAmount: stats.reduce((a, b) => a + b.totalAmount, 0),
    byStatus: stats.reduce((acc, cur) => {
      acc[cur._id] = { count: cur.count, amount: cur.totalAmount };
      return acc;
    }, {}),
  };

  res.status(200).json({
    success: true,
    message: "Overall transaction stats fetched",
    data: formatted,
  });
});


// 2. Gateway-wise summary
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
        totalAmount: { $sum: "$amount" },
        successCount: {
          $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
        },
        refundedCount: {
          $sum: { $cond: [{ $eq: ["$status", "refunded"] }, 1, 0] },
        },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    message: "Gateway summary fetched",
    data: gatewayStats,
  });
});


// 3. Revenue trend (last 30 days)
export const getRevenueTrend = asyncHandler(async (req, res) => {
  const matchQuery = {
    status: "paid",
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  };

  if (req.user.role !== "admin") {
    matchQuery.userId = req.user._id;
  }

  const trend = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    message: "Revenue trend (last 30 days) fetched",
    data: trend,
  });
});
