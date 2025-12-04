// src/pages/projects/tabs/RefundsTab.jsx
import { useEffect, useState } from "react";
import api from "@/api/axios";

export default function RefundsTab({ projectId }) {
  const [refunds, setRefunds] = useState([]);

  const load = async () => {
    try {
      const res = await api.get(`/api/projects/${projectId}/refunds`);
      setRefunds(res.data.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    load();
  }, [projectId]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Refund History</h2>

      <div className="bg-white p-5 rounded-xl shadow-sm border">
        {refunds.length === 0 ? (
          <p className="text-gray-500">No refunds yet.</p>
        ) : (
          refunds.map((r) => (
            <div key={r._id} className="p-3 border-b">
              <p>Amount: ₹{r.amount}</p>
              <p>Status: {r.status}</p>
              <p>Txn: {r.transactionId}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
