import { Button } from "./ui/Button";

export default function Pagination({ currentPage, totalPages, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center py-3">
      <div className="text-xs text-gray-400 dark:text-gray-500">
        Page {currentPage} of {totalPages}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500">
        {pageSize} per page
      </div>
    </div>
  );
}
