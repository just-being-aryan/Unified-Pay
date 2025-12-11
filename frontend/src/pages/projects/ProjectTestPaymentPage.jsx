// src/pages/projects/ProjectTestPaymentPage.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/api/axios";
import Payments from "@/pages/Payments";

export default function ProjectTestPaymentPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/projects/${id}`)
      .then(res => {
        setProject(res.data.data);
      })
      .catch(err => {
        console.error("Failed to load project:", err);
        alert("Unable to load project");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-10 text-center text-gray-600 text-lg">Loading project…</div>;
  }

  if (!project) {
    return (
      <div className="p-10 text-center text-red-600 text-lg">
        Project not found.
      </div>
    );
  }

 
  const enabledGateways = Object.entries(project.gatewayConfigs || {})
    .filter(([_, cfg]) => cfg.enabled)
    .map(([key]) => key);

  return (
    <div className="p-10 max-w-2xl mx-auto">

      <div className="mb-6">
        <Link 
          to={`/projects`}
          className="text-blue-600 hover:underline"
        >
          ← Back to Projects
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
      <p className="text-gray-600 mb-6">
        Test payments for this project using only enabled gateways.
      </p>

      <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-semibold mb-1">Enabled Gateways:</h3>
        {enabledGateways.length === 0 ? (
          <p className="text-red-500">No gateways enabled for this project.</p>
        ) : (
          <ul className="list-disc ml-6">
            {enabledGateways.map(g => (
              <li key={g}>{g.toUpperCase()}</li>
            ))}
          </ul>
        )}
      </div>

    
      <Payments 
        projectId={project._id} 
        allowedGateways={enabledGateways} 
      />

    </div>
  );
}
