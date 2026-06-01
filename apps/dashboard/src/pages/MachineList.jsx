import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchMachines } from '../api/logApi';
import CategoryGroup from '../components/CategoryGroup';
import MachineCardSkeleton from '../components/MachineCardSkeleton';
import Navbar from '../components/Navbar';

export default function MachineList() {
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['machines'],
    queryFn: fetchMachines,
  });

  const handleSelectMachine = (machine) => {
    navigate(`/machines/${machine.id}/logs`);
  };

  const machinesData = data?.data;
  const summary = machinesData?.summary ?? { online: 0, offline: 0, total: 0 };
  const grouped = machinesData?.grouped ?? [];

  return (
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Terminals
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {summary.total} terminals across {grouped.length} groups
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((groupKey) => (
              <section key={groupKey}>
                <div className="flex items-center gap-3 mb-4 w-full">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ml-2" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(cardKey => (
                    <MachineCardSkeleton key={cardKey} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-20">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-sm p-6 text-center max-w-md">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Connection Error</p>
              <p className="text-xs text-red-500 dark:text-red-300 mt-1">{error.message}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map((group) => (
              <CategoryGroup
                key={group.category}
                group={group}
                onSelectMachine={handleSelectMachine}
              />
            ))}
            {grouped.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-10">No terminals found.</p>
            )}
          </div>
        )}
      </div>
  );
}
