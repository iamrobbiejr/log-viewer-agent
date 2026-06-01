import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAvailableLogs } from '../api/logApi';
import { useLogs } from '../hooks/useLogs';
import LogViewer from '../components/LogViewer';
import DateTabs from '../components/DateTabs';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';

export default function MachineLogs() {
  const { machineId } = useParams();
  const [selectedDate, setDate] = useState(null);

  const {
    data: datesData,
    isLoading: datesLoading,
    isError: datesError,
    error: datesErrorData
  } = useQuery({
    queryKey: ['availableLogs', machineId],
    queryFn: () => fetchAvailableLogs(machineId),
    enabled: !!machineId,
    staleTime: 60000, // Increased to 1 minute to prevent overwhelming backend
  });

  const availableDates = datesData?.data?.available ?? [];

  // Auto-select first date when loaded
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setDate(availableDates[0].date);
    }
  }, [availableDates, selectedDate]);

  const { logs, filters, loading, error, updateFilter, resetFilters } = useLogs(machineId, selectedDate);

  if (datesError) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-sm p-6 text-center max-w-md mx-auto mt-12">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">Connection Error</p>
          <p className="text-xs text-red-500 dark:text-red-300 mt-1">{datesErrorData.message || 'Failed to load dates. Machine may be offline.'}</p>
        </div>
      </div>
    );
  }

  const machineName = logs?.machine ?? machineId;

  return (
    <div className="container mx-auto px-6 py-6 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
        <Link to="/" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Terminals</Link>
        <span>/</span>
        <span className="text-gray-600 dark:text-gray-300">{machineName}</span>
      </nav>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{machineName}</h1>
        {logs?.machine && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            192.168.1.x {/* Note: IP is not provided in logs response, placeholder or omitting is fine based on spec, but let's omit if not available */}
          </p>
        )}
      </div>

      {/* Date Tabs */}
      <DateTabs 
        dates={availableDates}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setDate(date);
          resetFilters();
        }}
        loading={datesLoading}
      />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onUpdateFilter={updateFilter}
        onReset={resetFilters}
        totalEntries={logs?.total_entries ?? 0}
        filteredEntries={logs?.entries?.length}
      />

      {/* Log Viewer */}
      <div className="mt-4">
        <LogViewer
          entries={logs?.entries ?? []}
          loading={loading}
          error={error}
          filename={`${machineId}_${selectedDate}.log`}
        />
      </div>

      {/* Pagination */}
      {logs && logs.total_pages > 1 && (
        <Pagination
          currentPage={filters.page}
          totalPages={logs.total_pages}
          pageSize={filters.page_size}
          onPageChange={(page) => updateFilter('page', page)}
        />
      )}
    </div>
  );
}
