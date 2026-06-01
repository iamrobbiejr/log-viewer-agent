import { forwardRef } from "react";
import { cn } from "../../lib/cn";

export const Input = forwardRef(({ className, icon: Icon, ...props }, ref) => {
  return (
    <div className="relative flex-1 min-w-0">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          "appearance-none block w-full px-3 py-1.5",
          "bg-white dark:bg-gray-900",
          "border border-gray-200 dark:border-gray-700",
          "text-gray-900 dark:text-gray-100",
          "rounded-sm text-sm transition-colors",
          "focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100",
          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
          Icon ? "pl-9" : "px-3",
          className
        )}
        {...props}
      />
    </div>
  );
});
Input.displayName = "Input";
