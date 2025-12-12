/**
 * Navbar Component with Auth Integration
 *
 * Navigation: Trang chủ | Tính năng | Hướng dẫn | Templates | FAQ
 * - Guest: Logo + Nav Links + "Đăng nhập" button
 * - Logged in: Logo + Nav Links + "Tạo Video" + "Dashboard" + UserAvatar
 */

import { useState, useEffect } from "react";
import { useAuth, UserAvatar } from "../auth";

const Navbar = () => {
  const { isAuthenticated, loading, openAuthModal } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to section smoothly
  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll to top
  const scrollToTop = () => {
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-4 left-4 right-4 z-50 transition-all duration-300 ease-out rounded-2xl ${
        isScrolled
          ? "bg-white/90 backdrop-blur-xl shadow-lg border border-slate-200/50"
          : "bg-white/70 backdrop-blur-md"
      }`}
      role="banner"
    >
      <nav
        className="container-custom flex items-center justify-between h-16 md:h-18"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            scrollToTop();
          }}
          className="flex items-center gap-2 cursor-pointer"
          aria-label="VibeQuote Home"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cta-500 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8V16M8 12H16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="font-heading font-bold text-xl text-slate-900">
            VibeQuote
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {/* Trang chủ */}
          <button
            onClick={scrollToTop}
            className="text-slate-600 hover:text-primary-600 font-medium transition-colors duration-200 cursor-pointer"
          >
            Trang chủ
          </button>

          {/* Tính năng */}
          <button
            onClick={() => scrollToSection("features")}
            className="text-slate-600 hover:text-primary-600 font-medium transition-colors duration-200 cursor-pointer"
          >
            Tính năng
          </button>

          {/* Hướng dẫn */}
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="text-slate-600 hover:text-primary-600 font-medium transition-colors duration-200 cursor-pointer"
          >
            Hướng dẫn
          </button>

          {/* Templates */}
          <a
            href="#/templates"
            className="text-slate-600 hover:text-primary-600 font-medium transition-colors duration-200 cursor-pointer"
          >
            Templates
          </a>

          {/* FAQ */}
          <button
            onClick={() => scrollToSection("faq")}
            className="text-slate-600 hover:text-primary-600 font-medium transition-colors duration-200 cursor-pointer"
          >
            FAQ
          </button>

          {/* Dashboard - only for authenticated users */}
          {isAuthenticated && (
            <a
              href="#/dashboard"
              className="text-slate-600 hover:text-primary-600 font-medium transition-colors duration-200 cursor-pointer"
            >
              Dashboard
            </a>
          )}
        </div>

        {/* Right side buttons */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            // Loading skeleton
            <div className="w-20 h-10 bg-slate-200 rounded-full animate-pulse" />
          ) : isAuthenticated ? (
            <>
              {/* Create Video button (logged in only) */}
              <a
                href="#/editor"
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white 
                           bg-gradient-to-r from-primary-500 to-cta-500 rounded-full
                           shadow-md shadow-primary-500/20
                           hover:shadow-lg hover:shadow-primary-500/30 hover:scale-[1.02]
                           transition-all duration-200 ease-out cursor-pointer"
              >
                Tạo Video
              </a>
              {/* User Avatar */}
              <UserAvatar />
            </>
          ) : (
            /* Guest: Login button only */
            <button
              onClick={() => openAuthModal("login")}
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold
                        text-primary-600 bg-primary-50 hover:bg-primary-100
                        rounded-full transition-colors duration-200 cursor-pointer"
            >
              Đăng nhập
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          <svg
            className="w-6 h-6 text-slate-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden px-4 pb-4 pt-2 border-t border-slate-100"
          role="menu"
        >
          <div className="flex flex-col gap-2">
            <button
              onClick={scrollToTop}
              className="px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer text-left"
              role="menuitem"
            >
              Trang chủ
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer text-left"
              role="menuitem"
            >
              Tính năng
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer text-left"
              role="menuitem"
            >
              Hướng dẫn
            </button>
            <a
              href="#/templates"
              className="px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
              role="menuitem"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Templates
            </a>
            <button
              onClick={() => scrollToSection("faq")}
              className="px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer text-left"
              role="menuitem"
            >
              FAQ
            </button>

            {isAuthenticated ? (
              <>
                <a
                  href="#/dashboard"
                  className="px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                  role="menuitem"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </a>
                <a
                  href="#/editor"
                  className="mt-2 w-full text-center px-5 py-3 text-sm font-semibold text-white 
                            bg-gradient-to-r from-primary-500 to-cta-500 rounded-xl cursor-pointer"
                  role="menuitem"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tạo Video
                </a>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openAuthModal("login");
                }}
                className="mt-2 w-full text-center px-5 py-3 text-sm font-semibold
                          text-primary-600 bg-primary-50 rounded-xl cursor-pointer"
                role="menuitem"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
