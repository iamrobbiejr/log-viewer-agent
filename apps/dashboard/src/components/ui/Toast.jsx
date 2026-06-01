import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../lib/cn";

const ToastContext = createContext(null);

const iconMap = {
  success: <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />,
  error: <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />,
  info: <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />,
};

const progressColorMap = {
  success: "bg-green-600",
  error: "bg-red-600",
  warning: "bg-yellow-600",
  info: "bg-blue-600",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => {
      const newToasts = [{ ...toast, id }, ...prev];
      return newToasts.slice(0, 3); // Max 3 toasts
    });

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

function Toast({ toast, onClose }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const duration = 4000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 10);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-sm p-3 min-w-64 max-w-sm flex items-start gap-3 relative overflow-hidden group">
      {iconMap[toast.type || "info"]}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 break-words">{toast.description}</p>
        )}
      </div>

      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
        aria-label="Close"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div
        className={cn("absolute bottom-0 left-0 h-0.5", progressColorMap[toast.type || "info"])}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
