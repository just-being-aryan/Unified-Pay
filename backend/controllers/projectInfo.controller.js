import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";
import Project from "../models/project.model.js";
import Transaction from "../models/transaction.model.js";

// ----------------------------------------
// Helper: verify project ownership
// ----------------------------------------
const verifyAccess = (project, user) => {
  if (!project) throw new ApiError(404, "Project not found");

  // Only admin or owner may access
  if (user.role !== "admin" && project.owner.toString() !== user._id.toString()) {
    throw new ApiError(403, "Access denied");
  }
};

// ==========================================================
// 1. GET PROJECT DASHBOARD STATS
// ==========================================================
export const getProjectStats = asyncHandler(async (req, res) => {
  const projectId = req.params.id;

  const project = await Project.findById(projectId);
  verifyAccess(project, req.user);

  const txns = await Transaction.find({ projectId });

  const totalAmount = txns.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalPayments = txns.length;

  const byStatus = {};
  txns.forEach((t) => {
    if (!byStatus[t.status]) {
      byStatus[t.status] = { count: 0, amount: 0 };
    }
    byStatus[t.status].count++;
    byStatus[t.status].amount += t.amount || 0;
  });

  return res.json({
    success: true,
    data: { totalAmount, totalPayments, byStatus },
  });
});

// ==========================================================
// 2. GET PROJECT TRANSACTIONS
// ==========================================================
export const getProjectTransactions = asyncHandler(async (req, res) => {
  const projectId = req.params.id;

  const project = await Project.findById(projectId);
  verifyAccess(project, req.user);

  const txns = await Transaction.find({ projectId }).sort({ createdAt: -1 });

  return res.json({
    success: true,
    data: txns,
  });
});

// ==========================================================
// 3. GET PROJECT REFUNDS (status === refunded)
// ==========================================================
export const getProjectRefunds = asyncHandler(async (req, res) => {
  const projectId = req.params.id;

  const project = await Project.findById(projectId);
  verifyAccess(project, req.user);

  const refunds = await Transaction.find({
    projectId,
    status: "refunded",
  }).sort({ refundedAt: -1 });

  return res.json({
    success: true,
    data: refunds,
  });
});

// ==========================================================
// 4. DELETE PROJECT + CLEANUP TRANSACTIONS
// ==========================================================
export const deleteProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;

  const project = await Project.findById(projectId);
  verifyAccess(project, req.user);

  // Delete all related transactions
  await Transaction.deleteMany({ projectId });

  await Project.deleteOne({ _id: projectId });

  return res.json({
    success: true,
    message: "Project deleted successfully",
  });
});
