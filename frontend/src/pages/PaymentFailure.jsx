import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

export default function PaymentFailure() {
  const [params] = useSearchParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  const txnid = params.get("txnid");
  const amountFromQuery = params.get("amount");

  useEffect(() => {
    if (!txnid) return;

    async function fetchTransaction() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/payments/transaction/${txnid}`,
          { withCredentials: true }
        );

        setTransaction(res.data.transaction);
      } catch (err) {
        console.error("Error fetching failed transaction:", err);
        setTransaction(null);
      } finally {
        setLoading(false);
      }
    }

    fetchTransaction();
  }, [txnid]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-xl mx-auto mt-24 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold text-red-600">Payment Failed</h1>

      <p className="mt-4 text-gray-700">
        Your payment could not be completed.
      </p>

      <div className="mt-4 space-y-2 text-gray-800">

        <p>
          <strong>Order ID:</strong> {txnid}
        </p>

        <p>
          <strong>Amount:</strong> ₹
          {transaction?.amount || amountFromQuery || "N/A"}
        </p>

        {transaction?.failureReason && (
          <p>
            <strong>Reason:</strong> {transaction.failureReason}
          </p>
        )}

        <p>
          <strong>Status:</strong>{" "}
          {transaction?.status || "failed"}
        </p>

        {transaction?.verifiedAt && (
          <p>
            <strong>Verified At:</strong>{" "}
            {new Date(transaction.verifiedAt).toLocaleString()}
          </p>
        )}
      </div>

      <button
        onClick={() => (window.location.href = "/dashboard")}
        className="mt-6 px-5 py-2 bg-blue-600 text-white rounded"
      >
        Return to Dashboard
      </button>
    </div>
  );
}
