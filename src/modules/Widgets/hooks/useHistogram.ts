import { useCartoSql } from "./useCartoSql";

export interface HistogramBin {
  bin: number;
  count: number;
}

export interface UseHistogramResult {
  data: HistogramBin[];
  loading: boolean;
  error: Error | null;
}

/**
 * Generates buckets from domain array for histogram query
 * Matches colorBins behavior: domain [a, b, c, d] creates bins:
 * - Bin 0: a to < b
 * - Bin 1: b to < c
 * - Bin 2: c to < d
 * - Bin 3: >= d
 * Note: Values < domain[0] are included in Bin 0 (handled by SQL CASE)
 */
function generateBuckets(domain: number[]): number[][] {
  if (domain.length < 2) return [];
  
  const buckets: number[][] = [];
  
  // Bins: domain[i] to domain[i+1] for i = 0 to domain.length - 2
  for (let i = 0; i < domain.length - 1; i++) {
    buckets.push([domain[i], domain[i + 1]]);
  }
  
  // Last bin: values >= domain[domain.length - 1]
  buckets.push([domain[domain.length - 1], Infinity]);
  
  return buckets;
}

/**
 * Builds SQL query for histogram aggregation
 * Uses BigQuery SQL syntax (CARTO uses BigQuery)
 */
function buildHistogramQuery(
  tableName: string,
  attribute: string,
  buckets: number[][]
): string {
  // Build CASE statement for each bucket
  const caseStatements = buckets
    .map((bucket, index) => {
      const [min, max] = bucket;
      
      if (max === Infinity) {
        // Last bin: >= min
        return `WHEN ${attribute} >= ${min} THEN ${index}`;
      } else {
        // Regular bins: >= min AND < max
        // For the first bin, also include values < min (to match colorBins behavior)
        if (index === 0) {
          return `WHEN ${attribute} < ${max} THEN ${index}`;
        }
        return `WHEN ${attribute} >= ${min} AND ${attribute} < ${max} THEN ${index}`;
      }
    })
    .join(" ");

  // BigQuery requires backticks for table names (project.dataset.table format)
  // Column names don't need quotes unless they're reserved words or have special chars
  const sql = `SELECT
  CASE
    ${caseStatements}
    ELSE ${buckets.length - 1}
  END AS bin_index,
  COUNT(*) AS count
FROM \`${tableName}\`
WHERE ${attribute} IS NOT NULL
GROUP BY 1
ORDER BY 1`;

  return sql;
}

interface CartoSqlResult {
  rows?: Array<{ bin_index: number; count: number }>;
  data?: Array<{ bin_index: number; count: number }>;
}

/**
 * Hook to fetch histogram data from CARTO SQL API using react-query
 * @param tableName - The table name to query
 * @param attribute - The attribute/column name to analyze
 * @param domain - The domain array from color scale config
 * @param enabled - Whether to run the query (should be true when fillMode === 'byValue')
 */
export function useHistogram(
  statsTableName: string | undefined,
  attribute: string | undefined,
  domain: number[] | undefined,
  enabled: boolean = true
): UseHistogramResult {
  const shouldFetch = enabled && !!statsTableName && !!attribute && !!domain && domain.length > 0;

  // Generate buckets from domain
  const buckets = domain && domain.length >= 2 ? generateBuckets(domain) : [];
  
  // Build SQL query
  const sql = shouldFetch && statsTableName && attribute && buckets.length > 0
    ? buildHistogramQuery(statsTableName, attribute, buckets)
    : undefined;

  // Use the generic CARTO SQL hook
  const { data: sqlResult, loading, error } = useCartoSql<CartoSqlResult>(sql, shouldFetch);

  // Transform the result to histogram format
  const histogramData: HistogramBin[] = buckets.map((_, index) => {
    const rows = sqlResult?.rows || sqlResult?.data || [];
    const row = rows.find((r: { bin_index: number }) => r.bin_index === index);
    return {
      bin: index,
      count: row?.count || 0,
    };
  });

  return {
    data: shouldFetch ? histogramData : [],
    loading,
    error,
  };
}
