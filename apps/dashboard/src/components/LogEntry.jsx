import { memo } from 'react';
import { cn } from '../lib/cn';
import { Badge } from './ui/Badge';

const LEVEL_STYLES = {
  INFO:    { row: 'hover:bg-gray-900',          badge: 'level_INFO',   text: 'text-gray-300'  },
  WARN:    { row: 'bg-yellow-950/20 hover:bg-gray-900', badge: 'level_WARN', text: 'text-yellow-200' },
  WARNING: { row: 'bg-yellow-950/20 hover:bg-gray-900', badge: 'level_WARN', text: 'text-yellow-200' },
  ERROR:   { row: 'bg-red-950/30 hover:bg-gray-900',    badge: 'level_ERROR',  text: 'text-red-300'    },
  DEBUG:   { row: 'hover:bg-gray-900',           badge: 'level_DEBUG',  text: 'text-gray-500'   },
  RAW:     { row: 'hover:bg-gray-900',           badge: 'level_RAW',    text: 'text-gray-600'   },
};

const LogEntry = memo(function LogEntry({ entry }) {
  const style = LEVEL_STYLES[entry.level] ?? LEVEL_STYLES.RAW;

  return (
    <div className={cn("flex px-4 py-0.5 group", style.row)}>
      {/* Line number */}
      <span className="w-12 text-right text-gray-600 select-none flex-shrink-0 pr-3">
        {entry.line_number}
      </span>

      {/* Timestamp */}
      {entry.timestamp && (
        <span className="w-40 text-gray-500 flex-shrink-0 hidden sm:block">
          {entry.timestamp}
        </span>
      )}

      {/* Level badge */}
      <span className="w-14 flex-shrink-0">
        <Badge variant={style.badge} className="bg-transparent border-transparent p-0 flex font-normal">
          {entry.level === 'WARNING' ? 'WARN' : entry.level}
        </Badge>
      </span>

      {/* Message */}
      <span className={cn("flex-1 break-all whitespace-pre-wrap", style.text)}>
        {entry.message}
      </span>
    </div>
  );
});

export default LogEntry;
