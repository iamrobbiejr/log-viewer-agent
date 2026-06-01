import { cn } from "../../lib/cn";

export function Spinner({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-gray-900",
        className
      )}
      {...props}
    />
  );
}
