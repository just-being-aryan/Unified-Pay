import { useEffect, useState } from "react";
import api from "@/api/axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/context/useAuth";
import { Download, Trash2 } from "lucide-react";

/* SHORT ID FORMATTER */
const shortId = (id) => (id ? id.slice(0, 6) + "..." + id.slice(-4) : "-");

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [gatewaySummary, setGatewaySummary] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);

  const [loading, setLoading] = useState(true);
  const [trendError, setTrendError] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState("payments");
  const [paymentsSubTab, setPaymentsSubTab] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 10;

  /* LOAD DATA */
  const loadData = async () => {
    try {
      const [statsRes, gatewayRes, paymentsRes] = await Promise.all([
        api.get("/api/reports/overall"),
        api.get("/api/reports/gateway-summary"),
        api.get("/api/payments"),
      ]);

      setStats(statsRes.data.data);
      setGatewaySummary(gatewayRes.data.data);
      setTransactions(paymentsRes.data.data);

      if (user.role === "admin") {
        try {
          const trendRes = await api.get("/api/reports/revenue-trend");
          setRevenueTrend(trendRes.data.data);
        } catch (err) {
          console.log(err)
          setTrendError("Revenue trend only available for admins.");
        }
      }
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.role]);

  /* DELETE HANDLER */
  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;

    try {
      await api.delete(`/api/payments/transaction/${id}`);
      await loadData(); // Reload WITHOUT full-page refresh
    } catch (err) {
      console.error("Delete failed", err);
      alert("Could not delete transaction");
    }
  };

  if (loading) return <div className="p-10 text-center text-lg">Loading…</div>;

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / limit);
  const paginatedTxns = transactions.slice((page - 1) * limit, page * limit);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Monitor your payment activities</p>
      </div>

      <StatsCards stats={stats} />

      <MainTabs active={activeTab} setActive={setActiveTab} />

      {/* === PAYMENTS TAB === */}
      {activeTab === "payments" && (
        <>
          <PaymentsTabs
            paymentsSubTab={paymentsSubTab}
            setPaymentsSubTab={setPaymentsSubTab}
          />

          {paymentsSubTab === "all" && (
            <TransactionTable
              data={paginatedTxns}
              page={page}
              totalPages={totalPages}
              setPage={setPage}
              onDelete={handleDelete}
            />
          )}

          {paymentsSubTab === "gateway" && (
            <GatewaySummaryTable data={gatewaySummary} />
          )}
        </>
      )}

      {/* === GATEWAYS TAB === */}
      {activeTab === "gateways" && (
        <GatewaySummaryTable data={gatewaySummary} />
      )}

      {/* === REVENUE TREND (ADMIN ONLY) === */}
      {user.role === "admin" && (
        <RevenueTrendChart data={revenueTrend} error={trendError} />
      )}
    </div>
  );
}

/* -------------------------------------------------- */
/* MAIN TABS */
/* -------------------------------------------------- */
function MainTabs({ active, setActive }) {
  const tabs = ["payments", "refunds", "gateways", "settings"];

  return (
    <div className="flex gap-4 border-b pb-2 text-sm">
      {tabs.map((t) => (
        <button
          key={t}
          className={`px-4 py-1 rounded-md capitalize ${
            active === t
              ? "bg-[#3F00FF] text-white"
              : "text-gray-600 hover:text-black"
          }`}
          onClick={() => setActive(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------- */
/* PAYMENTS SUB-TABS */
/* -------------------------------------------------- */
function PaymentsTabs({ paymentsSubTab, setPaymentsSubTab }) {
  return (
    <div className="flex gap-4 text-sm mt-3">
      <button
        className={`px-4 py-1 rounded-md ${
          paymentsSubTab === "all"
            ? "bg-[#3F00FF] text-white"
            : "text-gray-600 hover:text-black"
        }`}
        onClick={() => setPaymentsSubTab("all")}
      >
        All Transactions
      </button>

      <button
        className={`px-4 py-1 rounded-md ${
          paymentsSubTab === "gateway"
            ? "bg-[#3F00FF] text-white"
            : "text-gray-600 hover:text-black"
        }`}
        onClick={() => setPaymentsSubTab("gateway")}
      >
        Gateway-wise
      </button>
    </div>
  );
}

/* -------------------------------------------------- */
/* KPI CARDS */
/* -------------------------------------------------- */
function StatsCards({ stats }) {
  if (!stats) return null;

  const statuses = stats.byStatus || {};

  const cardItems = [
    { title: "Total Revenue", value: "₹" + stats.totalAmount },
    { title: "Transactions", value: stats.totalPayments },
    { title: "Success", value: statuses.paid?.count || 0 },
    { title: "Failed", value: statuses.failed?.count || 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {cardItems.map((c, idx) => (
        <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-gray-500">{c.title}</p>
          <p className="text-2xl font-bold mt-2">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------- */
/* TRANSACTION TABLE */
/* -------------------------------------------------- */
function TransactionTable({ data, page, totalPages, setPage, onDelete }) {
  const getStatusColor = (s) => {
    if (s === "paid") return "text-[#3F00FF] bg-[#eee8ff]";
    if (s === "failed") return "text-red-600 bg-red-100";
    return "text-gray-700 bg-gray-200";
  };

  const handleInvoiceDownload = async (txnId) => {
    try {
      const res = await api.get(
        `/api/payments/transaction/${txnId}?format=pdf`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${txnId}.pdf`;
      a.click();
    } catch (err) {
      console.error("Invoice download failed:", err);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border mt-4">
      <h2 className="text-lg font-bold mb-3">All Transactions</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-separate border-spacing-y-1">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="text-gray-600">
              <th className="py-2 px-3">Txn ID</th>
              <th className="px-3">Gateway Payment</th>
              <th className="px-3">Gateway</th>
              <th className="px-3">Amount</th>
              <th className="px-3">Status</th>
              <th className="px-3">Date</th>
              <th className="px-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {data.map((tx) => (
              <tr
                key={tx._id}
                className="hover:bg-gray-50 transition rounded-lg"
              >
                <td className="py-2 px-3 font-medium">
                  {shortId(tx.transactionId)}
                </td>
                <td className="px-3">{shortId(tx.gatewayPaymentId)}</td>
                <td className="px-3 capitalize">{tx.gateway}</td>
                <td className="px-3">₹{tx.amount}</td>
                <td className="px-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      tx.status
                    )}`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="px-3">
                  {new Date(tx.createdAt).toLocaleString()}
                </td>

                {/* ACTIONS */}
                <td className="px-3 flex items-center gap-3">
                  {/* DOWNLOAD INVOICE */}
                  <button
                    onClick={() => handleInvoiceDownload(tx._id)}
                    className="p-1 hover:bg-gray-200 rounded-md"
                  >
                    <Download size={16} />
                  </button>

                  {/* DELETE BUTTON (real button, not hyperlink) */}
                  <button
                    onClick={() => onDelete(tx._id)}
                    className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    <span className="text-xs">Delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-40"
        >
          Prev
        </button>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* GATEWAY SUMMARY TABLE */
/* -------------------------------------------------- */
function GatewaySummaryTable({ data }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border mt-4">
      <h2 className="text-lg font-bold mb-3">Gateway Summary</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-600">
              <th className="py-2 px-3">Gateway</th>
              <th className="px-3">Total</th>
              <th className="px-3">Success</th>
              <th className="px-3">Failed</th>
              <th className="px-3">Refunded</th>
              <th className="px-3">Amount</th>
            </tr>
          </thead>

          <tbody>
            {data.map((gw, index) => (
              <tr key={index} className="border-b">
                <td className="py-2 px-3 capitalize">{gw._id}</td>
                <td className="px-3">{gw.totalTransactions}</td>
                <td className="px-3">{gw.successCount}</td>
                <td className="px-3">{gw.failedCount}</td>
                <td className="px-3">{gw.refundedCount}</td>
                <td className="px-3">₹{gw.totalAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* REVENUE TREND CHART */
/* -------------------------------------------------- */
function RevenueTrendChart({ data, error }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border">
      <h2 className="text-lg font-bold mb-3">Revenue Trend (Last 30 Days)</h2>

      {error && <p className="text-red-500">{error}</p>}

      {data.length === 0 ? (
        <p className="text-gray-500">No revenue recorded.</p>
      ) : (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="_id" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="totalAmount"
                stroke="#3F00FF"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
