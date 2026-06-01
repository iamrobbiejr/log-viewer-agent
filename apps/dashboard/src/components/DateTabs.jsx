import { cn } from "../lib/cn";
import { Skeleton } from "./ui/Skeleton";

export default function DateTabs({ dates, selectedDate, onSelectDate, loading }) {
  if (loading) {
    return (
      <div className="flex gap-2 mb-0 border-b border-gray-200">
        <Skeleton className="w-24 h-10 rounded-t-sm rounded-b-none" />
        <Skeleton className="w-24 h-10 rounded-t-sm rounded-b-none" />
        <Skeleton className="w-24 h-10 rounded-t-sm rounded-b-none" />
      </div>
    );
  }

  return (
    <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 mb-0 overflow-x-auto">
      {dates.map((d) => {
        const isActive = selectedDate === d.date;
        return (
          <button
            key={d.date}
            onClick={() => onSelectDate(d.date)}
            className={cn(
              "px-3 py-2 text-sm border-b-2 flex flex-col items-center transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-900 dark:focus-visible:ring-gray-100 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900 rounded-t-sm",
              isActive
                ? "text-gray-900 dark:text-gray-100 border-gray-900 dark:border-gray-100 font-medium"
                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <span>{d.is_today ? "Today" : d.date}</span>
            <span className="text-xs text-gray-400 font-normal">
              {(d.size_bytes / 1024).toFixed(0)} KB
            </span>
          </button>
        );
      })}
    </div>
  );
}
