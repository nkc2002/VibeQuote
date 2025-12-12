/**
 * Dashboard Page Component - Premium UI
 *
 * Features:
 * - Glassmorphism cards with blur backdrop
 * - Floating navbar with backdrop-blur
 * - Gradient mesh background
 * - Micro-animations on interactions
 * - Premium typography and spacing
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth";
import { videosApi, VideoRecord } from "../api";
import VideoCard from "./VideoCard";
import SettingsPanel from "./SettingsPanel";

// SVG Icons as components for cleaner code
const PlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
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
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const VideoIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
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
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const CalendarIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
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
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const DownloadIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
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
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const SparklesIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
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
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [favoriteTemplate, setFavoriteTemplate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load videos from MongoDB via API
  const loadVideos = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch videos and stats from API
      const [videosResponse, statsResponse] = await Promise.all([
        videosApi.list(),
        videosApi.stats(),
      ]);

      if (videosResponse.data?.data) {
        setVideos(videosResponse.data.data);
      }

      if (statsResponse.data?.data) {
        setTodayCount(statsResponse.data.data.today || 0);
        setDownloadCount(statsResponse.data.data.downloadCount || 0);
        setFavoriteTemplate(statsResponse.data.data.favoriteTemplate || null);
      }
    } catch (error) {
      console.error("Failed to load videos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // Handle video download - regenerate and download using saved style
  const handleDownload = async (video: VideoRecord): Promise<void> => {
    try {
      // Use saved style parameters for identical regeneration
      const canvasW = video.canvasWidth || 1080;
      const canvasH = video.canvasHeight || 1920;
      const fontSize = video.fontSize || 48;
      const fontFamily = (video.fontFamily || "Inter").split(",")[0].trim();
      const textColor = video.textColor || "#FFFFFF";
      const boxOpacity = video.boxOpacity ?? 0.3;

      // Convert hex color to rgba
      const hexToRgba = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
          return `rgba(${parseInt(result[1], 16)},${parseInt(
            result[2],
            16
          )},${parseInt(result[3], 16)},1)`;
        }
        return "rgba(255,255,255,1)";
      };

      // Build render payload using saved style parameters
      const renderPayload = {
        quote: video.quoteText,
        wrappedText:
          video.quoteText +
          (video.authorText ? `\n\n— ${video.authorText}` : ""),
        canvasWidth: canvasW,
        canvasHeight: canvasH,
        fontFamily: fontFamily,
        fontSize: fontSize,
        fontColor: hexToRgba(textColor),
        textAlign: "center" as const,
        textBox: {
          x: canvasW / 2,
          y: video.templateId === "center" ? canvasH / 2 : canvasH * 0.75,
        },
        backgroundImageUrl: video.thumbnail,
        backgroundBrightness: 1 - boxOpacity,
        backgroundBlur: 0,
        gradientOverlay: {
          enabled: boxOpacity > 0,
          direction: "top-bottom" as const,
          startColor: `rgba(0,0,0,${boxOpacity})`,
          endColor: `rgba(0,0,0,${boxOpacity * 0.5})`,
        },
        animation: {
          type: "subtle-zoom" as const,
          zoomStart: 1.05,
          zoomEnd: 1.0,
          fadeText: true,
          fadeDuration: 0.8,
        },
        duration: 6,
      };

      const response = await fetch("/api/render-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(renderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate video");
      }

      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vibequote-${video.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      // Track download and refresh stats
      await videosApi.incrementDownload(video.id);
      setDownloadCount((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to download video:", error);
      alert(
        error instanceof Error ? error.message : "Có lỗi xảy ra khi tải video"
      );
      throw error;
    }
  };

  const handleDelete = async (video: VideoRecord) => {
    try {
      await videosApi.delete(video.id);
      await loadVideos();
    } catch (error) {
      console.error("Failed to delete video:", error);
      alert("Không thể xóa video. Vui lòng thử lại.");
    }
  };

  // Use user.name if available, fallback to email username
  const userName = user?.name || user?.email?.split("@")[0] || "bạn";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative">
      {/* Decorative gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-cta-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-gradient-to-br from-cta-400/10 to-primary-400/10 rounded-full blur-3xl" />
      </div>

      {/* Floating Navbar removed - using unified Header from App.tsx */}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Welcome section */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 mb-2">
            Xin chào, {userName}
          </h1>
          <p className="text-slate-600 text-lg">
            Quản lý và tạo video quote của bạn
          </p>
        </div>

        {/* Stats cards - Glassmorphism */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
          <div
            className="group bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-5 sm:p-6 
                        shadow-lg shadow-slate-900/5 hover:shadow-xl hover:shadow-primary-500/10 
                        hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 
                            flex items-center justify-center shadow-lg shadow-primary-500/30"
              >
                <VideoIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 mb-1">
              {videos.length}
            </p>
            <p className="text-sm text-slate-500 font-medium">Tổng video</p>
          </div>

          <div
            className="group bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-5 sm:p-6 
                        shadow-lg shadow-slate-900/5 hover:shadow-xl hover:shadow-cta-500/10 
                        hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-cta-500 to-cta-600 
                            flex items-center justify-center shadow-lg shadow-cta-500/30"
              >
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 mb-1">
              {todayCount}
            </p>
            <p className="text-sm text-slate-500 font-medium">Hôm nay</p>
          </div>

          <div
            className="group bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-5 sm:p-6 
                        shadow-lg shadow-slate-900/5 hover:shadow-xl hover:shadow-blue-500/10 
                        hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 
                            flex items-center justify-center shadow-lg shadow-blue-500/30"
              >
                <DownloadIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 mb-1">
              {downloadCount}
            </p>
            <p className="text-sm text-slate-500 font-medium">Đã tải xuống</p>
          </div>

          <div
            className="group bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-5 sm:p-6 
                        shadow-lg shadow-slate-900/5 hover:shadow-xl hover:shadow-green-500/10 
                        hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 
                            flex items-center justify-center shadow-lg shadow-green-500/30"
              >
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 mb-1 truncate">
              {favoriteTemplate || "—"}
            </p>
            <p className="text-sm text-slate-500 font-medium">
              Template yêu thích
            </p>
          </div>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900">
            Video của tôi
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              {videos.length} video
            </span>
          </div>
        </div>

        {/* Videos grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary-200 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="mt-4 text-slate-500 font-medium">Đang tải...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-3xl p-12 text-center shadow-lg">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
              <VideoIcon className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">
              Chưa có video nào
            </h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Bắt đầu tạo video quote đầu tiên của bạn và chia sẻ với mọi người!
            </p>
            <a
              href="#/editor"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary-500 to-cta-500 
                       text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25
                       hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 
                       transition-all duration-300 cursor-pointer"
            >
              <PlusIcon className="w-5 h-5" />
              Tạo video đầu tiên
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Mobile FAB */}
        <a
          href="#/editor"
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary-500 to-cta-500 
                   text-white rounded-2xl shadow-xl shadow-primary-500/30 flex items-center justify-center 
                   hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-105
                   active:scale-95 transition-all duration-300 cursor-pointer z-40"
          aria-label="Tạo video mới"
        >
          <PlusIcon className="w-6 h-6" />
        </a>
      </main>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsChange={loadVideos}
      />
    </div>
  );
};

export default DashboardPage;
