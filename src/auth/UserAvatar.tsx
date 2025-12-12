/**
 * User Avatar Component
 *
 * Displays initials avatar with dropdown menu.
 */

import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthContext";

const UserAvatar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500
                   flex items-center justify-center cursor-pointer
                   hover:ring-2 hover:ring-primary-400 hover:ring-offset-2 hover:ring-offset-slate-900
                   transition-all"
        aria-label="Menu người dùng"
      >
        <span className="text-white font-bold text-sm">{user.initials}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 py-2 bg-slate-800/95 backdrop-blur-xl
                       border border-slate-700/50 rounded-xl shadow-xl z-50"
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-slate-700/50">
            <p className="font-medium text-white truncate">{user.name}</p>
            <p className="text-sm text-slate-400 truncate">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <a
              href="#/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-slate-700/50
                        hover:text-white transition-colors cursor-pointer"
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
                  strokeWidth={1.5}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </a>

            <a
              href="#/editor"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-slate-700/50
                        hover:text-white transition-colors cursor-pointer"
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
                  strokeWidth={1.5}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Tạo Video
            </a>
          </div>

          {/* Logout */}
          <div className="border-t border-slate-700/50 pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-red-500/10
                        transition-colors cursor-pointer"
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
                  strokeWidth={1.5}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
