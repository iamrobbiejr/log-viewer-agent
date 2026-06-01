import { FileSearch } from 'lucide-react';
import { useRef, useEffect } from 'react';
import LogEntry from './LogEntry';
import { Skeleton } from './ui/Skeleton';
import LogToolbar from './LogToolbar';

export default function LogViewer({ entries, loading, error, filename }) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when entries load or change
  useEffect(() => {
    if (!loading && entries?.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, loading]);

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-sm overflow-hidden bg-gray-950 flex flex-col h-[calc(100vh-280px)]">
      <LogToolbar filename={filename} lineCount={entries?.length ?? 0} />
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
        {loading ? (
          <div className="py-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex px-4 py-0.5 gap-3 h-5">
                <Skeleton className="w-12 h-3 bg-gray-800" />
                <Skeleton className="w-32 h-3 bg-gray-800 hidden sm:block" />
                <Skeleton className="w-12 h-3 bg-gray-800" />
                <Skeleton className="flex-1 max-w-md h-3 bg-gray-800" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-red-400 text-sm font-mono">⚠ {error}</p>
          </div>
        ) : !entries || entries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <FileSearch className="w-8 h-8 text-gray-700 mb-3" />
            <p className="text-gray-600 text-sm">No log entries found</p>
            <p className="text-xs text-gray-600 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="font-mono text-xs py-2">
            {entries.map((entry, index) => (
              <LogEntry key={`${entry.line_number}-${index}`} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
