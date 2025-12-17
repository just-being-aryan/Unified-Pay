import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import ProjectDashboard from "./ProjectDashboard";

export default function ProjectsLayout({ children }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);

  const isCreatePage = location.pathname === "/projects/create";

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/api/projects");
        setProjects(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!id || projects.length === 0) return;

    const exists = projects.some((p) => p._id === id);
    if (!exists) {
      navigate(`/projects/${id}`, { replace: true });
    }
  }, [id, projects, navigate]);

  if (isCreatePage) return null;

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-50 -mt-14 overflow-hidden">
      <div className="w-64 bg-white border-r shadow-sm p-6 flex flex-col overflow-y-auto">
        <h2 className="text-xl font-bold mb-6">Projects</h2>

        <div className="space-y-2">
          {projects.map((p) => (
            <div
              key={p._id}
              onClick={() => navigate(`/projects/${p._id}`)}
              className={`p-3 rounded-lg cursor-pointer border ${
                id === p._id
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

      <div className="flex-1 overflow-y-auto p-10">
        {children
          ? children
          : id
          ? <ProjectDashboard key={id} />
          : <div className="text-gray-600 text-lg">Select a project.</div>
        }
      </div>
    </div>
  );
}
