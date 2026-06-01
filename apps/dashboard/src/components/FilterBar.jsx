import { Search } from "lucide-react";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";

export default function FilterBar({ filters, onUpdateFilter, onReset, totalEntries, filteredEntries }) {
  const hasFilters = filters.search !== "" || filters.level !== "" || filters.sort !== "desc";

  return (
    <div className="flex gap-2 py-3 border-b border-gray-100 dark:border-gray-800 items-center flex-wrap">
      {/* Search Input */}
      <div className="flex-1 min-w-0">
        <Input
          icon={Search}
          placeholder="Search logs..."
          value={filters.search}
          onChange={(e) => onUpdateFilter("search", e.target.value)}
        />
      </div>

      {/* Level Select */}
      <div className="w-32">
        <Select
          value={filters.level}
          onChange={(e) => onUpdateFilter("level", e.target.value)}
        >
          <option value="">All Levels</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
          <option value="DEBUG">DEBUG</option>
        </Select>
      </div>

      {/* Sort Select */}
      <div className="w-32">
        <Select
          value={filters.sort || "desc"}
          onChange={(e) => onUpdateFilter("sort", e.target.value)}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </Select>
      </div>

      {/* Reset Button */}
      {hasFilters && (
        <Button variant="ghost" onClick={onReset} className="px-2">
          Reset
        </Button>
      )}

      {/* Results Summary */}
      <div className="ml-auto text-xs text-gray-400 dark:text-gray-500">
        {hasFilters && filteredEntries !== undefined
          ? `${filteredEntries} of ${totalEntries} entries`
          : `${totalEntries} entries`}
      </div>
    </div>
  );
}
