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
}

export function useCrossReferenceEngine(query?: string): CrossReferenceResult;
