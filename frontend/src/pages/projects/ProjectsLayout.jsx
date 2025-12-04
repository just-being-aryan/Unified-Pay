// src/pages/projects/ProjectsLayout.jsx
import { useState, useEffect } from "react";
import api from "@/api/axios";
import ProjectDashboard from "./ProjectDashboard";
import CreateProjectWizard from "./CreateProjectWizard";

export default function ProjectsLayout({ defaultMode = "dashboard" }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [mode, setMode] = useState(defaultMode);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/api/projects");

        const valid = (res.data.data || []).filter(p => p && p.name);
        setProjects(valid);
      } catch (e) {
        console.error(e);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects]);

  const handleSelectProject = (p) => {
    setSelectedProject(p);
    setMode("dashboard");
  };

  return (
    <div className="flex min-h-screen bg-gray-50 -mt-14">

      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r shadow-sm p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6">Projects</h2>

        <div className="space-y-2 overflow-y-auto">
          {projects.map((p) => (
            <div
              key={p._id}
              onClick={() => handleSelectProject(p)}
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
          onClick={() => {
            setSelectedProject(null);
            setMode("create");
          }}
          className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Create New Project
        </button>
      </div>

      {/* RIGHT PANE */}
      <div className="flex-1 p-10">
        {mode === "create" && <CreateProjectWizard />}
        {mode === "dashboard" && selectedProject && (
          <ProjectDashboard project={selectedProject} />
        )}
        {mode === "dashboard" && !selectedProject && (
          <div className="text-gray-600 text-lg">Select a project to view its dashboard.</div>
        )}
      </div>
    </div>
  );
}
