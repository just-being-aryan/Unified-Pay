// backend/jobs/failStaleTransactions.js
import Transaction from "../models/transaction.model.js";

export const failStaleTransactions = async () => {
  const sevenMinutesAgo = new Date(Date.now() - 7 * 60 * 1000);

  const updated = await Transaction.updateMany(
    {
      status: "processing",
      initiatedAt: { $lte: sevenMinutesAgo }
    },
    {
      $set: {
        status: "failed",
        failureReason: "Timeout: No confirmation received from gateway"
      }
    }
  );

  console.log(`Stale payments auto-failed: ${updated.modifiedCount}`);
};
