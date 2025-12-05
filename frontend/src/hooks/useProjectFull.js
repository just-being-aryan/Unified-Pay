import { useEffect, useState } from "react";
import api from "@/api/axios";

export default function useProjectFull(projectId) {
  const [data, setData] = useState({
    project: null,
    stats: null,
    transactions: [],
    loading: true,
  });

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;

    api.get(`/api/projects/${projectId}/full`).then((res) => {
      if (!isMounted) return;
      const d = res.data.data;
      setData({
        project: d.project,
        stats: d.stats,
        transactions: d.transactions,
        loading: false,
      });
    });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  return data;
}
