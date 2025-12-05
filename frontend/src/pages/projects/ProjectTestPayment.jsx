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

  const enabled = Object.entries(project.gatewayConfigs)
    .filter(([_, val]) => val.enabled)
    .map(([key]) => key);

  return (
    <Payments projectId={projectId} allowedGateways={enabled} />
  );
}
