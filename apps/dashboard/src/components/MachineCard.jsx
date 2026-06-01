import { cn } from "../lib/cn";
import { Badge } from "./ui/Badge";

export default function MachineCard({ machine, onClick }) {
  const isOnline = machine.online;

  return (
    <div
      onClick={isOnline ? onClick : undefined}
      className={cn(
        "bg-white dark:bg-gray-900 border p-4 rounded-sm transition-colors",
        isOnline
          ? "border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 cursor-pointer focus-within:ring-1 focus-within:ring-gray-900 dark:focus-within:ring-gray-100 focus-within:ring-offset-1 dark:focus-within:ring-offset-gray-900"
          : "border-gray-200 dark:border-gray-800 opacity-60 cursor-not-allowed"
      )}
      tabIndex={isOnline ? 0 : undefined}
      onKeyDown={(e) => {
        if (isOnline && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Top row */}
      <div className="flex items-start gap-2">
        <div className="mt-1 flex-shrink-0 flex items-center justify-center w-3 h-3">
          <div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {machine.terminal_name}
          </p>
        </div>
      </div>

      {/* Middle row */}
      <div className="mt-1 ml-5">
        {machine.location_notes && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {machine.location_notes}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5 truncate">
          {machine.ip}
        </p>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <Badge variant={isOnline ? "success" : "default"}>
          {isOnline ? 'Online' : 'Offline'}
        </Badge>

        {isOnline && machine.agent_version && (
          <span className="text-xs text-gray-300 dark:text-gray-600 font-mono">
            v{machine.agent_version}
          </span>
        )}
      </div>
    </div>
  );
}
