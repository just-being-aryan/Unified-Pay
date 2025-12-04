// src/pages/projects/tabs/TransactionsTab.jsx
import { useEffect, useState } from "react";
import api from "@/api/axios";

export default function TransactionsTab({ projectId }) {
  const [txns, setTxns] = useState([]);

  const load = async () => {
    try {
      const res = await api.get(`/api/projects/${projectId}/transactions`);
      setTxns(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Transactions</h2>

      <div className="bg-white p-5 rounded-xl shadow-sm border">
        {txns.length === 0 ? (
          <p className="text-gray-500">No transactions yet.</p>
        ) : (
          txns.map((t) => (
            <div
              key={t._id}
              className="p-3 border-b flex justify-between items-center"
            >
              <span>{t.transactionId}</span>
              <span className="capitalize">{t.status}</span>
              <span>₹{t.amount}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
