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

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [gatewaySummary, setGatewaySummary] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendError, setTrendError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, gatewayRes] = await Promise.all([
          api.get("/api/reports/overall"),
          api.get("/api/reports/gateway-summary"),
        ]);

        setStats(statsRes.data.data);
        setGatewaySummary(gatewayRes.data.data);

        if (user.role === "admin") {
          try {
            const trendRes = await api.get("/api/reports/revenue-trend");
            setRevenueTrend(trendRes.data.data);
          } catch (err) {
            setTrendError("Revenue trend only available for admins.");
            console.log(err)
          }
        }
      } catch (err) {
        console.error("Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user.role]);

  if (loading) return <div className="p-10 text-center text-lg">Loading dashboard...</div>;

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* KPI Cards */}
      <StatsCards stats={stats} />

      {/* Gateway Summary */}
      <GatewaySummaryTable data={gatewaySummary} />

      {/* Revenue Trend (Admin only) */}
      {user.role === "admin" && (
        <RevenueTrendChart data={revenueTrend} error={trendError} />
      )}
    </div>
  );
}

/* ------------------------------ */
/* COMPONENT: KPI CARDS           */
/* ------------------------------ */

function StatsCards({ stats }) {
  const statuses = stats?.byStatus || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

      <Card title="Total Payments" value={stats.totalPayments} />
      <Card title="Total Volume" value={"₹" + stats.totalAmount} />

      <Card title="Successful" value={statuses.paid?.count || 0} />
      <Card title="Failed" value={statuses.failed?.count || 0} />
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

/* ------------------------------ */
/* COMPONENT: GATEWAY SUMMARY     */
/* ------------------------------ */

function GatewaySummaryTable({ data }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Gateway Summary</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2">Gateway</th>
              <th className="py-2">Total Txns</th>
              <th className="py-2">Success</th>
              <th className="py-2">Failed</th>
              <th className="py-2">Refunded</th>
              <th className="py-2">Amount</th>
            </tr>
          </thead>

          <tbody>
            {data.map((gw, index) => (
              <tr key={index} className="border-b">
                <td className="py-2 capitalize">{gw._id}</td>
                <td className="py-2">{gw.totalTransactions}</td>
                <td className="py-2">{gw.successCount}</td>
                <td className="py-2">{gw.failedCount}</td>
                <td className="py-2">{gw.refundedCount}</td>
                <td className="py-2">₹{gw.totalAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------ */
/* COMPONENT: REVENUE TREND       */
/* ------------------------------ */

function RevenueTrendChart({ data, error }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Revenue Trend (Last 30 Days)</h2>

      {error && <p className="text-red-500">{error}</p>}

      {data.length === 0 ? (
        <p className="text-gray-500">No revenue recorded in last 30 days.</p>
      ) : (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Line type="monotone" dataKey="totalAmount" stroke="#2563eb" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
