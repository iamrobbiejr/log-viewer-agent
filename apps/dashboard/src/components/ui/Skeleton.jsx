import { cn } from "../../lib/cn";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-sm bg-gray-200 dark:bg-gray-800", className)}
      {...props}
    />
  );
}
