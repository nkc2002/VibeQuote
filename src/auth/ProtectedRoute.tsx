/**
 * Protected Route Component
 *
 * - If loading → show loading screen
 * - If user = null → redirect to Landing + auto-open AuthModal
 * - Else → render children
 */

import { useEffect } from "react";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectPath?: string;
}

const ProtectedRoute = ({ children, redirectPath }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, openAuthModal } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Save current path for redirect after login
      const currentPath = window.location.hash || "#/";

      // Redirect to landing
      window.location.hash = "/";

      // Open auth modal with redirect
      openAuthModal("login", redirectPath || currentPath);
    }
  }, [loading, isAuthenticated, openAuthModal, redirectPath]);

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
