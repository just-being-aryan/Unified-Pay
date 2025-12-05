import { X } from "lucide-react";

export default function TransactionViewModal({ txn, onClose }) {
  if (!txn) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[420px] relative">

        <button
          className="absolute right-4 top-4 text-gray-600 hover:text-black"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4">Transaction Details</h2>

        <div className="space-y-3 text-sm">
          <p><strong>Txn ID:</strong> {txn.transactionId}</p>
          <p><strong>Amount:</strong> ₹{txn.amount}</p>
          <p><strong>Gateway:</strong> {txn.gateway}</p>
          <p><strong>Status:</strong> {txn.status}</p>
          <p><strong>Date:</strong> {new Date(txn.createdAt).toLocaleString()}</p>

          {txn.customer && (
            <>
              <hr />
              <p className="font-semibold">Customer</p>
              <p><strong>Name:</strong> {txn.customer.name}</p>
              <p><strong>Email:</strong> {txn.customer.email}</p>
              {txn.customer.phone && (
                <p><strong>Phone:</strong> {txn.customer.phone}</p>
              )}
            </>
          )}

          {txn.gatewayOrderId && (
            <>
              <hr />
              <p><strong>Gateway Order ID:</strong> {txn.gatewayOrderId}</p>
            </>
          )}
        </div>

        <div className="mt-6 text-right">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={onClose}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
