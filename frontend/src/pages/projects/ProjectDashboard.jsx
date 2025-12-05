// src/pages/projects/ProjectDashboard.jsx
import { useState } from "react";
import { Trash2 } from "lucide-react";
import api from "@/api/axios";
import useProjectFull from "@/hooks/useProjectFull";

import DashboardTab from "./tabs/DashboardTab";
import TransactionsTab from "./tabs/TransactionsTab";
import RefundsTab from "./tabs/RefundsTab";
import SettingsTab from "./tabs/SettingsTab";

export default function ProjectDashboard({ project: initialProject }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const {
    project,
    stats,
    loading
  } = useProjectFull(initialProject._id);

  const handleDeleteProject = async () => {
    if (!confirm("Are you sure you want to permanently delete this project?")) return;
    try {
      await api.delete(`/api/projects/${initialProject._id}`);
      window.location.href = "/projects";
    } catch (err) {
      console.error(err);
      alert("Could not delete project.");
    }
  };

  // 🚀 DO NOT block UI — always render the page instantly
  const currentProject = project || initialProject;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{currentProject.name}</h1>
          <p className="text-gray-600">
            {currentProject.description || "No description"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDeleteProject}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            <Trash2 size={16} />
            Delete Project
          </button>

          <button
            onClick={() =>
              (window.location.href = `/projects/${currentProject._id}/test-payment`)
            }
            className="px-4 py-2 bg-black text-white rounded-lg hover:opacity-90"
          >
            Test Payment
          </button>
        </div>
      </div>

      {/* TABS */}
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

      {/* CONTENT */}
      {activeTab === "dashboard" && (
        <DashboardTab stats={stats} loading={loading} />
      )}

      {activeTab === "transactions" && (
        <TransactionsTab projectId={currentProject._id} />
      )}

      {activeTab === "refunds" && (
        <RefundsTab projectId={currentProject._id} />
      )}

      {activeTab === "settings" && (
        <SettingsTab project={currentProject} />
      )}
    </div>
  );
}
