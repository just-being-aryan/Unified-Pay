
import useSWR from "swr";
import api from "@/api/axios";

const fetcher = (url) => api.get(url).then(res => res.data.data);

export default function useProjectFull(projectId) {
  const { data, error, isLoading } = useSWR(
    projectId ? `/api/projects/${projectId}/full` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10_000, 
      refreshInterval: 0,       
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
