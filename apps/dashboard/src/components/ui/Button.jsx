import { forwardRef } from "react";
import { cn } from "../../lib/cn";

const buttonVariants = {
  primary: "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 focus:ring-gray-900 dark:focus:ring-gray-100",
  secondary: "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-900 dark:focus:ring-gray-100",
  ghost: "bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-900 dark:focus:ring-gray-100",
  danger: "bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800 focus:ring-red-600 dark:focus:ring-red-500",
};

const buttonSizes = {
  default: "h-8 px-4 py-2 text-sm",
  sm: "h-7 px-3 text-xs",
  icon: "h-8 w-8 p-1.5",
};

export const Button = forwardRef(
  ({ className, variant = "secondary", size = "default", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-sm border font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-gray-900 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
