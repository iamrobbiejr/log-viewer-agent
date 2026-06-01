import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import MachineList from './pages/MachineList';
import MachineLogs from './pages/MachineLogs';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import MachineManagement from './pages/MachineManagement';
import Navbar from './components/Navbar';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider } from './contexts/ThemeContext';

function Layout({ children }) {
  // Using custom design system Navbar, dropping user info from header as requested
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Layout><MachineList /></Layout>} />
                <Route path="/machines/:machineId/logs" element={<Layout><MachineLogs /></Layout>} />
                <Route path="/profile" element={<Layout><Profile /></Layout>} />
                <Route path="/admin/machines" element={<Layout><MachineManagement /></Layout>} />
              </Route>

              <Route element={<ProtectedRoute requireAdmin={true} />}>
                <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
