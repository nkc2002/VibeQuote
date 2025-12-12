/**
 * Protected Route Component
 *
 * - If loading → show loading screen
 * - If user = null → redirect to Landing
 * - Else → render children
 */

import { useEffect } from "react";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to landing page only (don't auto-open modal)
      window.location.hash = "/";
    }
  }, [loading, isAuthenticated]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - don't render protected content
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated - render children
  return <>{children}</>;
};

export default ProtectedRoute;
