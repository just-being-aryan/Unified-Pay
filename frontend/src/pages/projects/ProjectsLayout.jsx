// src/pages/projects/ProjectsLayout.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "@/api/axios";
import CreateProjectWizard from "./CreateProjectWizard";
import ProjectDashboard from "./ProjectDashboard";

export default function ProjectsLayout({ defaultMode = "dashboard" }) {
  const { projectId } = useParams();         // ⭐ when coming from /dashboard/:projectId
  const [projects, setProjects] = useState([]);
  const [mode, setMode] = useState(defaultMode);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/api/projects");
        const valid = (res.data.data || []).filter((p) => p && p.name);
        setProjects(valid);
      } catch (e) {
        console.error(e);
      }
    };
    fetchProjects();
  }, []);

  // We do NOT track selectedProject anymore except for /projects list UI
  const selectedProject =
    projectId && projects.length
      ? projects.find((p) => p._id === projectId)
      : projects[0];

  return (
    <div className="flex min-h-screen bg-gray-50 -mt-14">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r shadow-sm p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6">Projects</h2>

        <div className="space-y-2 overflow-y-auto">
          {projects.map((p) => (
            <div
              key={p._id}
              onClick={() => (window.location.href = `/dashboard/${p._id}`)}
              className={`p-3 rounded-lg cursor-pointer border ${
                selectedProject?._id === p._id
                  ? "bg-black text-white border-black"
                  : "bg-gray-100 hover:bg-gray-200 border-gray-200"
              }`}
            >
              {p.name}
            </div>
          ))}
        </div>

        <button
          onClick={() => setMode("create")}
          className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Create New Project
        </button>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 p-10">

        {mode === "create" && <CreateProjectWizard />}

        {/* ⭐ If we have a projectId → ALWAYS render ProjectDashboard */}
        {projectId && <ProjectDashboard />}

        {/* ⭐ If no projectId and no create mode → show instructions */}
        {!projectId && mode === "dashboard" && (
          <div className="text-gray-600 text-lg">
            Select a project to open its dashboard.
          </div>
        )}
      </div>
    </div>
  );
}
