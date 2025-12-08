// src/hooks/useProjectFull.js
import useSWR from "swr";
import api from "@/api/axios";

const fetcher = (url) => api.get(url).then(res => res.data.data);

export default function useProjectFull(projectId) {
  const { data, error, isLoading } = useSWR(
    projectId ? `/api/projects/${projectId}/full` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10_000, // prevent duplicate calls
      refreshInterval: 0,        // no auto-refresh
    }
  );

  return {
    project: data?.project || null,
    stats: data?.stats || null,
    transactions: data?.transactions || [],
    loading: isLoading,
    error
  };
}
