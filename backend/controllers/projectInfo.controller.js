// backend/controllers/projectInfo.controller.js
import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";
import Project from "../models/project.model.js";
import Transaction from "../models/transaction.model.js";
import mongoose from "mongoose";

//Validate Ownership

const validateOwnership = async (projectId, user) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  if (user.role !== "admin" && project.owner.toString() !== user._id.toString()) {
    throw new ApiError(403, "Not allowed to access this project");
  }

  return project;
};

//PROJECT STATS

export const getProjectStats = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  await validateOwnership(projectId, req.user);

  const PAID_REGEX = /^(paid|success|succeeded|captured|authorized|completed)$/i;
  const FAILED_REGEX = /^(failed|cancelled|error|declined)$/i;
  const REFUNDED_REGEX = /^(refunded|returned)$/i;

  const pid = new mongoose.Types.ObjectId(projectId);

  const agg = await Transaction.aggregate([
    { $match: { projectId: pid } },

    {
      $facet: {
        counts: [
          {
            $group: {
              _id: null,
              totalTransactions: { $sum: 1 },
              successful: {
                $sum: {
                  $cond: [{ $regexMatch: { input: "$status", regex: PAID_REGEX } }, 1, 0],
                },
              },
              failed: {
                $sum: {
                  $cond: [{ $regexMatch: { input: "$status", regex: FAILED_REGEX } }, 1, 0],
                },
              },
            },
          },
        ],

        paidAmount: [
          { $match: { status: { $regex: PAID_REGEX } } },
          { $group: { _id: null, totalPaid: { $sum: "$amount" } } },
        ],

        refundedAmount: [
          {
            $match: {
              $or: [
                { status: { $regex: REFUNDED_REGEX } },
                { "refunds.0": { $exists: true } },
              ],
            },
          },
          {
            $project: {
              refundSum: {
                $cond: [
                  {
                    $gt: [
                      { $size: { $ifNull: ["$refunds", []] } },
                      0,
                    ],
                  },
                  { $sum: "$refunds.amount" },
                  "$amount",
                ],
              },
            },
          },
          { $group: { _id: null, totalRefunded: { $sum: "$refundSum" } } },
        ],
      },
    },
  ]);

  const counts = agg[0]?.counts?.[0] || {
    totalTransactions: 0,
    successful: 0,
    failed: 0,
  };

  const totalPaid = agg[0]?.paidAmount?.[0]?.totalPaid || 0;
  const totalRefunded = agg[0]?.refundedAmount?.[0]?.totalRefunded || 0;

  return res.json({
    success: true,
    data: {
      totalTransactions: counts.totalTransactions,
      successful: counts.successful,
      failed: counts.failed,
      totalAmount: totalPaid - totalRefunded,
    },
  });
});

//Filter Transactions

export const getProjectTransactions = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await validateOwnership(id, req.user);

  const pid = new mongoose.Types.ObjectId(id);

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { projectId: pid };

  if (req.query.status && req.query.status !== "all") {
    filter.status = { $regex: new RegExp(`^${req.query.status}$`, "i") };
  }

  if (req.query.gateway && req.query.gateway !== "all") {
    filter.gateway = { $regex: new RegExp(`^${req.query.gateway}$`, "i") };
  }

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Transaction.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: items,
    pagination: {
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});


 // GET PROJECT REFUNDS

export const getProjectRefunds = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  await validateOwnership(projectId, req.user);

  const pid = new mongoose.Types.ObjectId(projectId);

  const refunds = await Transaction.find({
    projectId: pid,
    "refunds.0": { $exists: true },
  })
    .select("transactionId amount refunds gateway createdAt")
    .sort({ createdAt: -1 });

  return res.json({ success: true, data: refunds });
});

//DELETE A PROJECT

export const deleteProject = asyncHandler(async (req, res) => {
  const id = req.params.id;
  await validateOwnership(id, req.user);

  const pid = new mongoose.Types.ObjectId(id);

  await Transaction.deleteMany({ projectId: pid });
  await Project.findByIdAndDelete(id);

  return res.json({ success: true, message: "Project deleted successfully" });
});


export const getProjectFull = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const project = await validateOwnership(projectId, req.user);

  const pid = new mongoose.Types.ObjectId(projectId);

  const now = new Date();
  const startDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - 6
  ));

  const [
    totalTx,
    successTx,
    failedTx,
    totalAmountAgg,
    last7,
    txs,
  ] = await Promise.all([
    Transaction.countDocuments({ projectId: pid }),

    Transaction.countDocuments({
      projectId: pid,
      status: { $regex: /^(paid|completed|success|captured)$/i },
    }),

    Transaction.countDocuments({
      projectId: pid,
      status: { $regex: /^(failed|cancelled|error)$/i },
    }),

    Transaction.aggregate([
      {
        $match: {
          projectId: pid,
          status: { $regex: /^(paid|completed|success|captured)$/i },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),

    Transaction.aggregate([
      {
        $match: {
          projectId: pid,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Transaction.find({ projectId: pid })
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  const trend7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);

    const found = last7.find((x) => x._id === iso);

    trend7Days.push({
      _id: iso,
      count: found ? found.count : 0,
      total: found ? found.total : 0,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      project,
      stats: {
        totalTransactions: totalTx,
        successful: successTx,
        failed: failedTx,
        totalAmount: totalAmountAgg[0]?.total || 0,
        trend7Days,
      },
      transactions: txs,
    },
  });
});
