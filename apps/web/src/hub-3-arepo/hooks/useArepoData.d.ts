export interface ArepoData {
  [key: string]: unknown;
}

declare function useArepoData(): ArepoData;
export default useArepoData;

// Cross-reference engine hook
export interface CrossReferenceResult {
  matches: Array<{
    id: string;
    score: number;
    data: unknown;
  }>;
  total: number;
  query: string;
  queryHistory: Array<{
    id: string;
    query: string;
    timestamp: string;
    results: number;
  }>;
}

export function useCrossReferenceEngine(query?: string): CrossReferenceResult;
