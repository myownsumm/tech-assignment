import { useQuery } from "@tanstack/react-query";

export interface UseCartoSqlResult<T = unknown> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
}

/**
 * Executes a SQL query against CARTO SQL API
 * @param sql - The SQL query to execute
 * @param enabled - Whether to run the query
 */
export function useCartoSql<T = unknown>(
  sql: string | undefined,
  enabled: boolean = true
): UseCartoSqlResult<T> {
  const shouldFetch = enabled && !!sql;

  const { data, isLoading, error } = useQuery({
    queryKey: ["cartoSql", sql],
    queryFn: async () => {
      if (!sql) {
        throw new Error("SQL query is required");
      }

      // Get API token from env
      const accessToken = import.meta.env.VITE_API_ACCESS_TOKEN;
      if (!accessToken) {
        throw new Error("VITE_API_ACCESS_TOKEN is not set");
      }

      // Encode SQL for URL
      const encodedSql = encodeURIComponent(sql);

      // Call CARTO SQL API
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/v3/sql/carto_dw/query?q=${encodedSql}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorText: string;
        try {
          const errorJson = await response.json();
          errorText = JSON.stringify(errorJson, null, 2);
        } catch {
          errorText = await response.text();
        }
        // Include SQL query in error for debugging
        throw new Error(
          `CARTO API error (${response.status}): ${errorText}\n\nSQL Query:\n${sql}`
        );
      }

      const result = await response.json();
      return result as T;
    },
    enabled: shouldFetch,
  });

  return {
    data,
    loading: isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
  };
}
