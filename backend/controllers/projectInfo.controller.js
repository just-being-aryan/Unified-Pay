// backend/controllers/projectInfo.controller.js
import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";
import Project from "../models/project.model.js";
import Transaction from "../models/transaction.model.js";

const validateOwnership = async (projectId, user) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  if (user.role !== "admin" && project.owner.toString() !== user._id.toString()) {
    throw new ApiError(403, "Not allowed to access this project");
  }

  return project;
};


export const getProjectStats = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  await validateOwnership(projectId, req.user);

 
  const totalTx = await Transaction.countDocuments({ projectId });

  const successTx = await Transaction.countDocuments({
    projectId,
    status: { $regex: /^(paid|completed|success|captured)$/i },
  });

  const failedTx = await Transaction.countDocuments({
    projectId,
    status: { $regex: /^(failed|cancelled|error)$/i },
  });

  const totalAmountAgg = await Transaction.aggregate([
    {
      $match: {
        projectId,
        status: { $regex: /^(paid|completed|success|captured)$/i },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalAmount = totalAmountAgg[0]?.total || 0;

  
  const now = new Date();
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));

  const last7 = await Transaction.aggregate([
    {
      $match: {
        projectId,
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
  ]);

  // Zero-fill last 7 days
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

  return res.json({
    success: true,
    data: {
      totalTransactions: totalTx,
      successful: successTx,
      failed: failedTx,
      totalAmount,
      trend7Days,
    },
  });
});


export const getProjectTransactions = asyncHandler(async (req, res) => {
  const { id } = req.params;

 
  await validateOwnership(id, req.user);

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const filter = { projectId: id };

  
  if (req.query.status && req.query.status !== "all") {
    
    const status = String(req.query.status).trim();
    filter.status = { $regex: new RegExp(`^${status}$`, "i") };
  }

 
  if (req.query.gateway && req.query.gateway !== "all") {
    const gw = String(req.query.gateway).trim();
    filter.gateway = { $regex: new RegExp(`^${gw}$`, "i") };
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
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});


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


export const deleteProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  await validateOwnership(projectId, req.user);

 
  await Transaction.deleteMany({ projectId });

  // delete a project
  await Project.findByIdAndDelete(projectId);

  return res.json({
    success: true,
    message: "Project deleted successfully",
  });
});


export const getProjectFull = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const project = await validateOwnership(projectId, req.user);

  const now = new Date();
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));

  
  const [
    totalTx,
    successTx,
    failedTx,
    totalAmountAgg,
    last7,
    txs,
  ] = await Promise.all([
    Transaction.countDocuments({ projectId }),

    Transaction.countDocuments({
      projectId,
      status: { $regex: /^(paid|completed|success|captured)$/i },
    }),

    Transaction.countDocuments({
      projectId,
      status: { $regex: /^(failed|cancelled|error)$/i },
    }),

    Transaction.aggregate([
      {
        $match: {
          projectId,
          status: { $regex: /^(paid|completed|success|captured)$/i },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),

    Transaction.aggregate([
      {
        $match: {
          projectId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Transaction.find({ projectId })
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  // Zero-fill trend7Days
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

