import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  const txnid = params.get("txnid");

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
        console.error("Error fetching transaction:", err);
        setTransaction(null);
      } finally {
        setLoading(false);
      }
    }

    fetchTransaction();
  }, [txnid]);

  if (loading) return <div>Loading...</div>;

  if (!transaction) {
    return (
      <div className="max-w-xl mx-auto mt-24 p-6 bg-white shadow rounded">
        <h1 className="text-2xl font-bold text-red-600">Payment Not Found</h1>
        <p className="mt-4">We could not verify your payment.</p>
      </div>
    );
  }

  // 🔥 Compute redirect target based on projectId
  const redirectToDashboard = () => {
    if (transaction.projectId) {
      // Came from ProjectTestPaymentPage.jsx → redirect to specific project's dashboard
      window.location.href = `/dashboard/${transaction.projectId}`;
    } else {
      // Came from generic Payments.jsx page
      window.location.href = `/dashboard`;
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-24 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold text-green-600">Payment Successful</h1>

      <div className="mt-5 space-y-2">
        <p><strong>Payment Status:</strong> {transaction.status}</p>
        <p><strong>Amount:</strong> ₹{transaction.amount}</p>
        <p><strong>Order ID (txnid):</strong> {transaction.gatewayOrderId}</p>
        <p><strong>Payment ID:</strong> {transaction.gatewayPaymentId}</p>

        {transaction.paymentInfo?.product && (
          <p><strong>Product:</strong> {transaction.paymentInfo.product}</p>
        )}

        <p>
          <strong>Verified At:</strong>{" "}
          {transaction.verifiedAt
            ? new Date(transaction.verifiedAt).toLocaleString()
            : "Pending"}
        </p>
      </div>

      {/* 🔥 Updated redirect button */}
      <button
        onClick={redirectToDashboard}
        className="mt-6 px-5 py-2 bg-blue-600 text-white rounded"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
