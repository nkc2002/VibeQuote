/**
 * Authentication Modal
 *
 * Tabs: Login / Register / Forgot Password
 * Uses API client for backend communication.
 */

import { useState, FormEvent, useEffect } from "react";
import { useAuth } from "./AuthContext";

type AuthTab = "login" | "register" | "forgot";

const AuthModal = () => {
  const {
    authModalOpen,
    authModalTab,
    closeAuthModal,
    login,
    register,
    pendingRedirect,
    setPendingRedirect,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>(authModalTab);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");

  // Sync tab with context when modal opens or tab changes
  useEffect(() => {
    if (authModalOpen) {
      setActiveTab(authModalTab);
    }
  }, [authModalOpen, authModalTab]);

  const resetForms = () => {
    setError("");
    setSuccess("");
    setLoginEmail("");
    setLoginPassword("");
    setRememberMe(false);
    setRegName("");
    setRegEmail("");
    setRegPassword("");
    setRegConfirmPassword("");
    setForgotEmail("");
  };

  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab);
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    resetForms();
    closeAuthModal();
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await login(loginEmail, loginPassword, rememberMe);

    setIsSubmitting(false);

    if (result.success) {
      handleClose();
      // Handle redirect after login
      if (pendingRedirect) {
        window.location.hash = pendingRedirect.replace("#", "");
        setPendingRedirect(null);
      }
    } else {
      setError(result.error || "Đăng nhập thất bại");
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (regPassword !== regConfirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (regPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsSubmitting(true);

    const result = await register(regName, regEmail, regPassword);

    setIsSubmitting(false);

    if (result.success) {
      handleClose();
      if (pendingRedirect) {
        window.location.hash = pendingRedirect.replace("#", "");
        setPendingRedirect(null);
      }
    } else {
      setError(result.error || "Đăng ký thất bại");
    }
  };

  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const res = await fetch(`${API_URL}/api/auth/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();
      setSuccess(data.message || "Đã gửi email hướng dẫn");
    } catch {
      setError("Lỗi kết nối, vui lòng thử lại");
    }

    setIsSubmitting(false);
  };

  if (!authModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - pointer-events-none to prevent closing on click */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 
                   rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                     text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-2xl font-heading font-bold text-white text-center">
            {activeTab === "login" && "Đăng nhập"}
            {activeTab === "register" && "Tạo tài khoản"}
            {activeTab === "forgot" && "Quên mật khẩu"}
          </h2>
        </div>

        {/* Tabs */}
        {activeTab !== "forgot" && (
          <div className="flex border-b border-slate-700/50 mx-6">
            <button
              onClick={() => handleTabChange("login")}
              className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer
                ${
                  activeTab === "login"
                    ? "text-primary-400 border-b-2 border-primary-400"
                    : "text-slate-400 hover:text-white"
                }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => handleTabChange("register")}
              className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer
                ${
                  activeTab === "register"
                    ? "text-primary-400 border-b-2 border-primary-400"
                    : "text-slate-400 hover:text-white"
                }`}
            >
              Đăng ký
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg
                           text-white placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg
                           text-white placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 
                             text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-slate-400">
                    Ghi nhớ đăng nhập
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => handleTabChange("forgot")}
                  className="text-sm text-primary-400 hover:text-primary-300 cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-secondary-600 
                         text-white font-semibold rounded-lg
                         hover:from-primary-500 hover:to-secondary-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all cursor-pointer"
              >
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg
                           text-white placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg
                           text-white placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg
                           text-white placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg
                           text-white placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-secondary-600 
                         text-white font-semibold rounded-lg
                         hover:from-primary-500 hover:to-secondary-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all cursor-pointer"
              >
                {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {activeTab === "forgot" && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-sm text-slate-400 mb-4">
                Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật
                khẩu.
              </p>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg
                           text-white placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-secondary-600 
                         text-white font-semibold rounded-lg
                         hover:from-primary-500 hover:to-secondary-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all cursor-pointer"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("login")}
                className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Quay lại đăng nhập
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
