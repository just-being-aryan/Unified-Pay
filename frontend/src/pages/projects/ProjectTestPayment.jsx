import { useEffect, useState } from "react";
import api from "@/api/axios";
import Payments from "@/pages/Payments"; // reuse existing page

export default function ProjectTestPayment({ projectId }) {
  const [project, setProject] = useState(null);

  useEffect(() => {
    api.get(`/api/projects/${projectId}`).then(res => {
      setProject(res.data.data);
    });
  }, [projectId]);

  if (!project) return <div>Loading project...</div>;

  // Normalize gatewayConfigs to plain object
  const gwConfigs = project.gatewayConfigs instanceof Map
    ? Object.fromEntries(project.gatewayConfigs)
    : project.gatewayConfigs || {};

  const enabled = Object.entries(gwConfigs)
    .filter(([_, val]) => val?.enabled)
    .map(([key]) => key);

  return (
    <div className="bg-black text-white min-h-screen p-6">
      <Payments projectId={projectId} allowedGateways={enabled} />
    </div>
  );
}
