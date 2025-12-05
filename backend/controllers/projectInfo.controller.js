// backend/controllers/projectInfo.controller.js
import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";
import Project from "../models/project.model.js";
import Transaction from "../models/transaction.model.js";

/* -----------------------------------------------------------
   INTERNAL: Validate ownership
------------------------------------------------------------*/
const validateOwnership = async (projectId, user) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  if (user.role !== "admin" && project.owner.toString() !== user._id.toString()) {
    throw new ApiError(403, "Not allowed to access this project");
  }

  return project;
};

/* -----------------------------------------------------------
   GET PROJECT STATS
------------------------------------------------------------*/
export const getProjectStats = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  await validateOwnership(projectId, req.user);

  const totalTx = await Transaction.countDocuments({ projectId });

  const successTx = await Transaction.countDocuments({
    projectId,
    status: { $in: ["paid", "completed"] },
  });

  const failedTx = await Transaction.countDocuments({
    projectId,
    status: { $in: ["failed", "cancelled", "error"] },
  });

  const totalAmountAgg = await Transaction.aggregate([
    { $match: { projectId, status: { $in: ["paid", "completed"] } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const totalAmount = totalAmountAgg[0]?.total || 0;

  // Last 7 days trend
  const last7 = await Transaction.aggregate([
    {
      $match: {
        projectId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: { $dayOfMonth: "$createdAt" },
        count: { $sum: 1 },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id": 1 } },
  ]);

  return res.json({
    success: true,
    data: {
      totalTransactions: totalTx,
      successful: successTx,
      failed: failedTx,
      totalAmount,
      trend7Days: last7,
    },
  });
});

/* -----------------------------------------------------------
   GET PROJECT TRANSACTIONS (Paginated)
------------------------------------------------------------*/
export const getProjectTransactions = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const filter = { projectId: id };

  // Status filter
  if (req.query.status && req.query.status !== "all") {
    filter.status = req.query.status;
  }

  // Gateway filter
  if (req.query.gateway && req.query.gateway !== "all") {
    filter.gateway = req.query.gateway;
  }

  const skip = (page - 1) * limit;

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
      totalPages: Math.ceil(total / limit),
    },
  });
});

/* -----------------------------------------------------------
   GET PROJECT REFUNDS
------------------------------------------------------------*/
export const getProjectRefunds = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  await validateOwnership(projectId, req.user);

  const refunds = await Transaction.find({
    projectId,
    "refunds.0": { $exists: true },
  })
    .select("transactionId amount refunds gateway createdAt")
    .sort({ createdAt: -1 });

  return res.json({
    success: true,
    data: refunds,
  });
});

/* -----------------------------------------------------------
   DELETE PROJECT + ALL PROJECT TRANSACTIONS
------------------------------------------------------------*/
export const deleteProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  await validateOwnership(projectId, req.user);

  // Delete all linked transactions
  await Transaction.deleteMany({ projectId });

  // Delete project
  await Project.findByIdAndDelete(projectId);

  return res.json({
    success: true,
    message: "Project deleted successfully",
  });
});
