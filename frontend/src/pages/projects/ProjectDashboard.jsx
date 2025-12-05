// src/pages/projects/ProjectDashboard.jsx
import { useEffect, useState } from "react";
import api from "@/api/axios";
import { Trash2 } from "lucide-react";

import DashboardTab from "./tabs/DashboardTab";
import SettingsTab from "./tabs/SettingsTab";
import RefundsTab from "./tabs/RefundsTab";
import TransactionsTab from "./tabs/TransactionsTab";

export default function ProjectDashboard({ project }) {

  
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  if (!project) {
  return <div className="text-gray-600 text-lg p-6">Loading project…</div>;
}


  
  const loadStats = async () => {
    try {
      const res = await api.get(`/api/projects/${project._id}/stats`);
      setStats(res.data.data);
    } catch (err) {
      console.error("Project stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [project._id]);

  
  const handleDeleteProject = async () => {
    if (!confirm("Are you sure you want to permanently delete this project?"))
      return;

    try {
      await api.delete(`/api/projects/${project._id}`);
      window.location.reload(); // Go back to projects list
    } catch (err) {
      console.error(err);
      alert("Could not delete project.");
    }
  };

  if (loading)
    return <div className="text-gray-600 text-lg p-6">Loading project…</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-gray-600">{project.description || "No description"}</p>
        </div>


      <button
        onClick={() => window.location.href = `/projects/${project._id}/test-payment`}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Test Payment
      </button>
  
        <button
          onClick={handleDeleteProject}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          <Trash2 size={18} />
          Delete Project
        </button>

        
      </div>

      <div className="flex gap-4 border-b pb-2">
        {["dashboard", "transactions", "refunds", "settings"].map((tab) => (
          <button
            key={tab}
            className={`capitalize px-4 py-1 border-b-2 ${
              activeTab === tab
                ? "border-black font-semibold"
                : "border-transparent text-gray-500 hover:text-black"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && <DashboardTab stats={stats} />}
      {activeTab === "transactions" && (
        <TransactionsTab projectId={project._id} />
      )}
      {activeTab === "refunds" && <RefundsTab projectId={project._id} />}
      {activeTab === "settings" && <SettingsTab project={project} />}
    </div>
  );
}
