import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLogsForDate } from '../api/logApi';

const DEFAULT_FILTERS = {
  search:    '',
  level:     '',
  sort:      'desc', // Default to newest first
  page:      1,
  page_size: 500,
};

/**
 * Manages log fetching state including filters, pagination, and loading via React Query.
 */
export function useLogs(machineId, date) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['logs', machineId, date, filters],
    queryFn: () => fetchLogsForDate(machineId, date, filters),
    enabled: !!machineId && !!date,
    keepPreviousData: true,
    staleTime: 60000, // Increased to 1 minute
  });

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value,  // Reset to page 1 on filter change
    }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  return {
    logs: data?.data ?? null,
    filters,
    loading: isLoading || isFetching,
    error: error?.message ?? null,
    updateFilter,
    resetFilters,
    refetch,
  };
}
