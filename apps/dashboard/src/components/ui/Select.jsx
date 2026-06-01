import { forwardRef } from "react";
import { cn } from "../../lib/cn";

export const Select = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "appearance-none block w-full px-3 py-1.5 pr-8",
        "bg-white dark:bg-gray-900",
        "border border-gray-200 dark:border-gray-700",
        "text-gray-900 dark:text-gray-100",
        "rounded-sm text-sm transition-colors",
        "focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";
