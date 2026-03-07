import { useState, useEffect, useCallback, useRef } from 'react';
import { SpatialData, SpatialEvent } from '../types/spatial';

interface Use{{DataType}}Options {
  matchId: string;
  round: number;
  pollInterval?: number;
  enabled?: boolean;
}

interface Use{{DataType}}Result {
  data: SpatialData | null;
  events: SpatialEvent[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * use{{DataType}} - Custom hook for spatial data fetching
 * 
 * @example
 * const { data, events, isLoading } = use{{DataType}}({
 *   matchId: 'match-123',
 *   round: 1,
 *   pollInterval: 5000
 * });
 */
export const use{{DataType}} = ({
  matchId,
  round,
  pollInterval,
  enabled = true,
}: Use{{DataType}}Options): Use{{DataType}}Result => {
  const [data, setData] = useState<SpatialData | null>(null);
  const [events, setEvents] = useState<SpatialEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!matchId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/matches/${matchId}/rounds/${round}/{{endpoint}}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setData(result.data);
      setEvents(result.events || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [matchId, round, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling
  useEffect(() => {
    if (pollInterval && enabled) {
      intervalRef.current = setInterval(fetchData, pollInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, pollInterval, enabled]);

  return {
    data,
    events,
    isLoading,
    error,
    refetch: fetchData,
  };
};

export default use{{DataType}};
