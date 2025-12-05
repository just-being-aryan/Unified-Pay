// src/pages/projects/tabs/TransactionsTab.jsx
import { useEffect, useState } from "react";
import api from "@/api/axios";
import TransactionViewModal from "./components/TransactionViewModal";

export default function TransactionsTab({ projectId }) {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    status: "all",
    gateway: "all",
  });

  const [selectedTxn, setSelectedTxn] = useState(null);

  const loadTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page,
        limit: 20,
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.gateway !== "all" && { gateway: filters.gateway }),
      });

      const res = await api.get(`/api/projects/${projectId}/transactions?${query}`);

      setTransactions(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      console.error(err);
      alert("Could not load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(1);
  }, [projectId, filters]);

  return (
    <div className="space-y-6">

      {/* Filters */}
      <div className="flex gap-4">
        <select
          className="px-3 py-2 border rounded-lg"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          className="px-3 py-2 border rounded-lg"
          value={filters.gateway}
          onChange={(e) => setFilters({ ...filters, gateway: e.target.value })}
        >
          <option value="all">All Gateways</option>
          <option value="payu">PayU</option>
          <option value="razorpay">Razorpay</option>
          <option value="cashfree">Cashfree</option>
          <option value="paytm">PayTM</option>
          <option value="paypal">PayPal</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow border">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-700 text-sm">
            <tr>
              <th className="p-3">Txn ID</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Gateway</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{t.transactionId}</td>
                  <td className="p-3 font-medium">₹{t.amount}</td>
                  <td className="p-3 capitalize">{t.gateway}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded text-xs bg-gray-200 text-black font-medium">
                      {t.status}
                    </span>


                  </td>
                  <td className="p-3 text-sm text-gray-700">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => setSelectedTxn(t)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-4">
          <button
            disabled={pagination.page === 1}
            onClick={() => loadTransactions(pagination.page - 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => loadTransactions(pagination.page + 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <TransactionViewModal
          txn={selectedTxn}
          onClose={() => setSelectedTxn(null)}
        />
      )}
    </div>
  );
}
