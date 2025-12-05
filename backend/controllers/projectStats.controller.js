// backend/controllers/projectStats.controller.js

export const getProjectStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const match = { projectId: id };

  const stats = await Transaction.aggregate([
    { $match: match },

    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        successful: {
          $sum: {
            $cond: [
              { $in: ["$status", ["paid", "completed", "success"]] },
              1,
              0,
            ],
          },
        },
        failed: {
          $sum: {
            $cond: [
              { $in: ["$status", ["failed", "cancelled"]] },
              1,
              0,
            ],
          },
        },
        totalAmount: {
          $sum: {
            $cond: [
              { $in: ["$status", ["paid", "completed", "success"]] },
              "$amount",
              0,
            ],
          },
        },
      },
    },
  ]);

  return res.status(200).json({
    success: true,
    data: stats[0] || {
      totalTransactions: 0,
      successful: 0,
      failed: 0,
      totalAmount: 0,
    },
  });
});
