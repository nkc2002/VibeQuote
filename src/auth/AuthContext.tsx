/**
 * Authentication Context
 *
 * - Automatically calls /api/auth/me on app load
 * - Manages user state, login, register, logout
 * - Provides modal controls for AuthModal
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { authApi, User } from "../api";

// ============================================================
// Types
// ============================================================

interface AuthContextType {
  // User state
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Auth actions
  login: (
    email: string,
    password: string,
    remember?: boolean
  ) => Promise<AuthResult>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<AuthResult>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;

  // Modal controls
  openAuthModal: (tab?: AuthTab, redirectTo?: string) => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalTab: AuthTab;
  pendingRedirect: string | null;
  setPendingRedirect: (path: string | null) => void;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

type AuthTab = "login" | "register" | "forgot";

// ============================================================
// Context
// ============================================================

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================
// Provider
// ============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthTab>("login");
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  /**
   * Fetch current user from /api/auth/me
   * Called automatically on app load
   */
  const fetchMe = useCallback(async () => {
    try {
      const { data, status } = await authApi.me();

      if (status === 200 && data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch user on mount
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  /**
   * Login
   */
  const login = async (
    email: string,
    password: string,
    remember = false
  ): Promise<AuthResult> => {
    const { data, error } = await authApi.login({ email, password, remember });

    if (data?.success && data.user) {
      setUser(data.user);
      return { success: true };
    }

    return {
      success: false,
      error: error?.message || "Đăng nhập thất bại",
    };
  };

  /**
   * Register
   */
  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<AuthResult> => {
    const { data, error } = await authApi.register({ name, email, password });

    if (data?.success && data.user) {
      setUser(data.user);
      return { success: true };
    }

    return {
      success: false,
      error: error?.message || "Đăng ký thất bại",
    };
  };

  /**
   * Logout
   */
  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setPendingRedirect(null);
    setAuthModalOpen(false); // Ensure modal is closed
    // Redirect to landing (use replace to clear history)
    window.location.replace("/#/");
  };

  /**
   * Open auth modal
   */
  const openAuthModal = (tab: AuthTab = "login", redirectTo?: string) => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
    if (redirectTo) {
      setPendingRedirect(redirectTo);
    }
  };

  /**
   * Close auth modal
   */
  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        fetchMe,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        authModalTab,
        pendingRedirect,
        setPendingRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export default AuthContext;
