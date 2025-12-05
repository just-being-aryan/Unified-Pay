// src/pages/projects/tabs/DashboardTab.jsx
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function DashboardTab({ stats }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!stats) return;

    const structured = stats.trend7Days.map((d) => ({
      day: `Day ${d._id}`,
      count: d.count,
    }));

    setChartData(structured);
  }, [stats]);

  if (!stats)
    return <div className="p-4 text-gray-500 text-lg">Loading…</div>;

  return (
    <div className="space-y-10">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700">Total Transactions</h2>
          <p className="text-3xl font-bold mt-2">{stats.totalTransactions}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700">Successful</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.successful}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700">Failed</h2>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.failed}</p>
        </div>

      </div>

      {/* Revenue Card */}
      <div className="bg-white p-6 rounded-xl shadow border w-full">
        <h2 className="text-lg font-semibold text-gray-700">Total Revenue</h2>
        <p className="text-4xl font-bold mt-2">₹{stats.totalAmount.toFixed(2)}</p>
      </div>

      {/* 7-Day Trend Chart */}
      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Last 7 Days Activity</h2>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#4F46E5"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
}
