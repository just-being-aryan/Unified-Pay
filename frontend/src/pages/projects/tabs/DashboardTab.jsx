// src/pages/projects/tabs/DashboardTab.jsx
export default function DashboardTab({ stats }) {
  if (!stats) return <p>No stats available.</p>;

  const items = [
    { label: "Total Revenue", value: "₹" + stats.totalAmount },
    { label: "Transactions", value: stats.totalPayments },
    { label: "Success", value: stats.byStatus?.paid?.count || 0 },
    { label: "Failed", value: stats.byStatus?.failed?.count || 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {items.map((item, i) => (
        <div key={i} className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-gray-500">{item.label}</p>
          <p className="text-2xl font-bold mt-2">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
