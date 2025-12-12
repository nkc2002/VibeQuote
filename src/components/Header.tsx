/**
 * Header Component - Unified Navigation
 *
 * Single source of truth for navigation across:
 * - Home (Landing page)
 * - Template Gallery
 * - Dashboard
 *
 * Fixed heights: Desktop 72px, Tablet 64px, Mobile 56px
 * No layout shift on page change - only content/active state changes.
 */

import { useState, useEffect } from "react";
import { useAuth, UserAvatar } from "../auth";

// Types
type ActivePage =
  | "home"
  | "templates"
  | "dashboard"
  | "editor"
  | "features"
  | "how-it-works"
  | "faq";

interface HeaderProps {
  activePage?: ActivePage;
}

// SVG Icons
const MenuIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const CloseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    className={className}
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
);

const LogoIcon = () => (
  <svg
    className="w-6 h-6 text-white"
    viewBox="0 0 24 24"
    fill="none"
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
);

// Navigation items
const navItems = [
  { id: "home", label: "Trang chủ", href: "#/", scrollTo: null },
  { id: "features", label: "Tính năng", href: null, scrollTo: "features" },
  {
    id: "how-it-works",
    label: "Hướng dẫn",
    href: null,
    scrollTo: "how-it-works",
  },
  { id: "templates", label: "Templates", href: "#/templates", scrollTo: null },
  { id: "faq", label: "FAQ", href: null, scrollTo: "faq" },
] as const;

const Header = ({ activePage = "home" }: HeaderProps) => {
  const { isAuthenticated, loading, openAuthModal } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Scroll detection for shadow effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll to section (for landing page anchors)
  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Navigate to page and scroll to top
  const navigateTo = (href: string) => {
    setIsMobileMenuOpen(false);
    window.location.hash = href.replace("#", "");
    // Scroll to top immediately
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  // Check if nav item is active
  const isActive = (itemId: string) => {
    if (itemId === "home" && activePage === "home") return true;
    return itemId === activePage;
  };

  return (
    <>
      {/* Sticky Header with Glassmorphism */}
      <header
        className={`
          fixed top-0 left-0 right-0 z-50
          h-[var(--header-height-mobile)] md:h-[var(--header-height-tablet)] lg:h-[var(--header-height)]
          transition-all duration-300 ease-out
          ${
            isScrolled
              ? "bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-900/5 border-b border-slate-200/50"
              : "bg-white/30 backdrop-blur-md border-b border-white/20"
          }
        `}
        role="banner"
        style={
          {
            "--header-height": "72px",
            "--header-height-tablet": "64px",
            "--header-height-mobile": "56px",
          } as React.CSSProperties
        }
      >
        <nav
          className="h-full px-4 md:px-6 lg:px-8 flex items-center justify-between max-w-7xl mx-auto"
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Left: Logo - Fixed width */}
          <div className="flex-shrink-0 w-[180px] lg:w-[220px]">
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                navigateTo("#/");
              }}
              className="flex items-center gap-2 cursor-pointer"
              aria-label="VibeQuote Home"
            >
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cta-500 flex items-center justify-center flex-shrink-0">
                <LogoIcon />
              </div>
              <span className="font-heading font-bold text-lg lg:text-xl text-slate-900">
                VibeQuote
              </span>
            </a>
          </div>

          {/* Center: Navigation Links - Desktop only */}
          <div className="hidden lg:flex items-center justify-center gap-1 flex-1">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href || "#"}
                onClick={(e) => {
                  e.preventDefault();
                  if (item.scrollTo) {
                    // If on landing page, scroll to section
                    if (
                      activePage === "home" ||
                      activePage === "features" ||
                      activePage === "how-it-works" ||
                      activePage === "faq"
                    ) {
                      scrollToSection(item.scrollTo);
                    } else {
                      // Navigate to home then scroll
                      window.location.hash = "/";
                      setTimeout(() => scrollToSection(item.scrollTo!), 100);
                    }
                  } else if (item.href) {
                    navigateTo(item.href);
                  }
                }}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer
                  ${
                    isActive(item.id)
                      ? "text-primary-600 bg-primary-50"
                      : "text-slate-600 hover:text-primary-600 hover:bg-slate-50"
                  }
                `}
                aria-current={isActive(item.id) ? "page" : undefined}
              >
                {item.label}
              </a>
            ))}

            {/* Dashboard link - only for authenticated */}
            {isAuthenticated && (
              <a
                href="#/dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("#/dashboard");
                }}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer
                  ${
                    activePage === "dashboard"
                      ? "text-primary-600 bg-primary-50"
                      : "text-slate-600 hover:text-primary-600 hover:bg-slate-50"
                  }
                `}
                aria-current={activePage === "dashboard" ? "page" : undefined}
              >
                Dashboard
              </a>
            )}
          </div>

          {/* Right: Actions - Fixed width */}
          <div className="flex items-center justify-end gap-3 w-[180px] lg:w-[220px]">
            {/* Desktop actions */}
            <div className="hidden lg:flex items-center gap-3">
              {loading ? (
                <div className="w-[140px] h-10 bg-slate-200 rounded-full animate-pulse" />
              ) : isAuthenticated ? (
                <>
                  {/* CTA Button - Fixed width */}
                  <a
                    href="#/editor"
                    className="inline-flex items-center justify-center w-[140px] h-10 text-sm font-semibold text-white 
                               bg-gradient-to-r from-primary-500 to-cta-500 rounded-full
                               shadow-md shadow-primary-500/20
                               hover:shadow-lg hover:shadow-primary-500/30
                               transition-shadow duration-200 cursor-pointer"
                  >
                    Tạo Video
                  </a>
                  {/* Avatar - Fixed size */}
                  <div className="w-10 h-10 flex-shrink-0">
                    <UserAvatar />
                  </div>
                </>
              ) : (
                <button
                  onClick={() => openAuthModal("login")}
                  className="inline-flex items-center justify-center w-[140px] h-10 text-sm font-semibold
                            text-primary-600 bg-primary-50 hover:bg-primary-100
                            rounded-full transition-colors duration-200 cursor-pointer"
                >
                  Đăng nhập
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ top: "var(--header-height-mobile)" } as React.CSSProperties}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu panel */}
          <div className="absolute top-0 left-0 right-0 bg-white border-b border-slate-200 shadow-xl">
            <nav className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href || "#"}
                  onClick={(e) => {
                    e.preventDefault();
                    if (item.scrollTo) {
                      if (activePage === "home") {
                        scrollToSection(item.scrollTo);
                      } else {
                        window.location.hash = "/";
                        setTimeout(() => scrollToSection(item.scrollTo!), 100);
                      }
                    } else if (item.href) {
                      navigateTo(item.href);
                    }
                  }}
                  className={`
                    block px-4 py-3 text-base font-medium rounded-xl transition-colors duration-200
                    ${
                      isActive(item.id)
                        ? "text-primary-600 bg-primary-50"
                        : "text-slate-700 hover:bg-slate-50"
                    }
                  `}
                  aria-current={isActive(item.id) ? "page" : undefined}
                >
                  {item.label}
                </a>
              ))}

              {isAuthenticated && (
                <a
                  href="#/dashboard"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo("#/dashboard");
                  }}
                  className={`
                    block px-4 py-3 text-base font-medium rounded-xl transition-colors duration-200
                    ${
                      activePage === "dashboard"
                        ? "text-primary-600 bg-primary-50"
                        : "text-slate-700 hover:bg-slate-50"
                    }
                  `}
                  aria-current={activePage === "dashboard" ? "page" : undefined}
                >
                  Dashboard
                </a>
              )}

              {/* Mobile auth/CTA */}
              <div className="pt-4 border-t border-slate-100">
                {loading ? (
                  <div className="h-12 bg-slate-200 rounded-xl animate-pulse" />
                ) : isAuthenticated ? (
                  <a
                    href="#/editor"
                    className="flex items-center justify-center w-full h-12 text-base font-semibold text-white 
                               bg-gradient-to-r from-primary-500 to-cta-500 rounded-xl
                               shadow-md shadow-primary-500/20 cursor-pointer"
                  >
                    Tạo Video
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openAuthModal("login");
                    }}
                    className="flex items-center justify-center w-full h-12 text-base font-semibold
                              text-primary-600 bg-primary-50 hover:bg-primary-100
                              rounded-xl transition-colors duration-200 cursor-pointer"
                  >
                    Đăng nhập
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div
        className="h-[var(--header-height-mobile)] md:h-[var(--header-height-tablet)] lg:h-[var(--header-height)]"
        style={
          {
            "--header-height": "72px",
            "--header-height-tablet": "64px",
            "--header-height-mobile": "56px",
          } as React.CSSProperties
        }
        aria-hidden="true"
      />
    </>
  );
};

export default Header;
