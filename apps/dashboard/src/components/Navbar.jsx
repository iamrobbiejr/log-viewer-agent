import { Link, useLocation } from "react-router-dom";
import { RefreshCw, Moon, Sun } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMachines } from "../api/logApi";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { cn } from "../lib/cn";

export default function Navbar() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const isLogsPage = location.pathname.includes('/logs');
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const { data, isFetching } = useQuery({
    queryKey: ['machines'],
    queryFn: fetchMachines,
    staleTime: 60000, // Increased to 1 minute to prevent overwhelming backend
  });

  const summary = data?.data?.summary ?? { online: 0, total: 0 };

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 h-12 flex items-center transition-colors duration-200">
      <div className="container mx-auto px-6 max-w-6xl flex justify-between items-center w-full">
        {/* Left Side */}
        <div className="flex items-baseline gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <img src="https://i.postimg.cc/SN4R6HBX/light-logo.png" alt="Log Viewer Agent" className="h-8 block dark:hidden" />
            <img src="https://i.postimg.cc/GhRtF6WH/main-logo.png" alt="Log Viewer Agent" className="h-8 hidden dark:block" />
          </Link>
          {!isLogsPage && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              {summary.online} / {summary.total} online
            </span>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3 text-sm font-medium mr-2">
              <span className="text-gray-500 dark:text-gray-400 hidden md:inline">Hi, {user.name}</span>
              <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Home</Link>

              {user.role === 'admin' && (
                <>
                  <Link to="/admin" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">Admin</Link>
                  <Link to="/admin/settings" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">Settings</Link>
                </>
              )}
              <Link to="/admin/machines" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">Machines</Link>

              <Link to="/profile" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Profile</Link>
              <button onClick={logout} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors">Logout</button>
            </div>
          )}

          <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-800 pl-4">
            {isFetching && (
              <span className="text-xs text-gray-400">
                Updating...
              </span>
            )}
            <button
              onClick={handleRefresh}
              className={cn(
                "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:ring-offset-1 dark:focus:ring-offset-gray-950 rounded-sm p-1 transition-colors",
                isFetching && "animate-spin text-gray-900 dark:text-gray-100"
              )}
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={toggleTheme}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:ring-offset-1 dark:focus:ring-offset-gray-950 rounded-sm p-1 transition-colors ml-1"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
