/**
 * Main App Component with Auth Integration
 *
 * Routing:
 * - /dashboard → ProtectedRoute
 * - /editor → ProtectedRoute
 * - /templates → Public
 * - / → Landing (public)
 */

import { useState, useEffect } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Gallery from "./components/Gallery";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import { EditorPage } from "./editor";
import { TemplateGalleryPage } from "./templates";
import { DashboardPage } from "./dashboard";
import { AuthProvider, AuthModal, ProtectedRoute } from "./auth";

type PageType = "landing" | "editor" | "templates" | "dashboard";

function AppContent() {
  // Simple hash-based routing
  const [currentPage, setCurrentPage] = useState<PageType>(() => {
    const hash = window.location.hash;
    if (hash === "#/editor") return "editor";
    if (hash === "#/templates") return "templates";
    if (hash === "#/dashboard") return "dashboard";
    return "landing";
  });

  // Animation key to force re-trigger animation on page change
  const [animationKey, setAnimationKey] = useState(0);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      let newPage: PageType = "landing";
      if (hash === "#/editor") {
        newPage = "editor";
      } else if (hash === "#/templates") {
        newPage = "templates";
      } else if (hash === "#/dashboard") {
        newPage = "dashboard";
      }
      setCurrentPage(newPage);
      setAnimationKey((prev) => prev + 1); // Increment to force re-mount
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Editor page (Protected) - No header, full screen editor
  if (currentPage === "editor") {
    return (
      <ProtectedRoute redirectPath="#/editor">
        <EditorPage />
      </ProtectedRoute>
    );
  }

  // Dashboard page (Protected) - With unified header
  if (currentPage === "dashboard") {
    return (
      <ProtectedRoute redirectPath="#/dashboard">
        <>
          <Header activePage="dashboard" />
          <div
            key={`dashboard-${animationKey}`}
            className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 page-transition"
          >
            <DashboardPage />
          </div>
        </>
      </ProtectedRoute>
    );
  }

  // Template Gallery page (Public) - With unified header
  if (currentPage === "templates") {
    return (
      <>
        <Header activePage="templates" />
        <div
          key={`templates-${animationKey}`}
          className="min-h-screen bg-white page-transition"
        >
          <TemplateGalleryPage />
        </div>
      </>
    );
  }

  // Landing page (Public) - With unified header
  return (
    <>
      <Header activePage="home" />
      <div
        key={`landing-${animationKey}`}
        className="min-h-screen bg-white font-body page-transition"
      >
        {/* Skip to main content link for accessibility */}
        <a
          href="#hero"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                     bg-primary-600 text-white px-4 py-2 rounded-lg z-50"
        >
          Skip to main content
        </a>

        <main id="main-content">
          <Hero />
          <Features />
          <HowItWorks />
          <Gallery />
          <FAQ />
        </main>

        <Footer />
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <AuthModal />
    </AuthProvider>
  );
}

export default App;
