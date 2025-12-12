// src/pages/projects/ProjectsLayout.jsx
import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import ProjectDashboard from "./ProjectDashboard";

export default function ProjectsLayout() {
  const { id } = useParams();        // ✅ FIX: param must be "id" not "projectId"
  const location = useLocation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);

  const isCreatePage = location.pathname === "/projects/create";

  // If on create page → do NOT render sidebar layout
  if (isCreatePage) return null;

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

  return (
    <div className="flex min-h-screen bg-gray-50 -mt-14">

      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r shadow-sm p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6">Projects</h2>

        <div className="space-y-2 overflow-y-auto">
          {projects.map((p) => (
            <div
              key={p._id}
              onClick={() => navigate(`/projects/${p._id}`)}
              className={`p-3 rounded-lg cursor-pointer border ${
                p._id === id
                  ? "bg-black text-white border-black"
                  : "bg-gray-100 hover:bg-gray-200 border-gray-200"
              }`}
            >
              {p.name}
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/projects/create")}
          className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Create New Project
        </button>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 p-10">
        {id ? (
          <ProjectDashboard />
        ) : (
          <div className="text-gray-600 text-lg">
            Select a project to open its dashboard.
          </div>
        )}
      </div>
    </div>
  );
}
