import { useAuth } from "../auth";

const Hero = () => {
  const { isAuthenticated, openAuthModal } = useAuth();

  const handleCreateVideo = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      openAuthModal("login", "#/editor");
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24"
      aria-labelledby="hero-heading"
    >
      {/* Aurora Background */}
      <div
        className="absolute inset-0 aurora-bg opacity-30"
        aria-hidden="true"
      />

      {/* Gradient Orbs */}
      <div
        className="absolute top-20 -left-40 w-96 h-96 bg-primary-400/30 rounded-full blur-3xl animate-pulse-slow"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-20 -right-40 w-96 h-96 bg-cta-400/30 rounded-full blur-3xl animate-pulse-slow"
        style={{ animationDelay: "2s" }}
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary-400/20 rounded-full blur-3xl"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 container-custom text-center px-4 pb-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-sm">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-slate-700">
            100% Miễn phí • Đăng nhập để bắt đầu
          </span>
        </div>

        {/* Main Heading */}
        <h1
          id="hero-heading"
          className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-slate-900 mb-6 leading-tight"
        >
          Create beautiful quote videos
          <span className="block mt-2 gradient-text">— Free</span>
        </h1>

        {/* Subheading */}
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
          Biến những câu quote yêu thích thành video đẹp mắt chỉ trong vài giây.
          Không cần kỹ năng thiết kế.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#/editor"
            onClick={handleCreateVideo}
            className="btn-cta text-lg group"
            aria-label="Tạo video quote miễn phí ngay bây giờ"
          >
            <span>Tạo video miễn phí</span>
            <svg
              className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
          <a
            href="#examples"
            className="btn-secondary"
            aria-label="Xem các ví dụ video quote"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Xem ví dụ
          </a>
        </div>

        {/* Video Preview Mockup */}
        <div className="mt-16 relative max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/20 border border-white/20">
            {/* Browser Chrome */}
            <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div
                  className="w-3 h-3 rounded-full bg-red-500"
                  aria-hidden="true"
                />
                <div
                  className="w-3 h-3 rounded-full bg-yellow-500"
                  aria-hidden="true"
                />
                <div
                  className="w-3 h-3 rounded-full bg-green-500"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 ml-4">
                <div className="bg-slate-700 rounded-lg px-4 py-1.5 text-sm text-slate-400 max-w-md mx-auto">
                  vibequote.com/create
                </div>
              </div>
            </div>

            {/* Video Preview Area */}
            <div className="aspect-video bg-gradient-to-br from-slate-900 via-primary-900 to-cta-900 flex items-center justify-center relative">
              {/* Quote Preview */}
              <div className="text-center p-8 max-w-2xl">
                <svg
                  className="w-12 h-12 mx-auto mb-6 text-white/30"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-2xl md:text-3xl font-heading font-semibold text-white leading-relaxed">
                  "Cuộc sống không phải là chờ đợi cơn bão đi qua, mà là học
                  cách nhảy múa dưới mưa."
                </p>
                <p className="mt-6 text-white/60 text-lg">— Vivian Greene</p>
              </div>

              {/* Animated particles */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                aria-hidden="true"
              >
                <div className="absolute top-10 left-10 w-2 h-2 bg-white/20 rounded-full animate-float" />
                <div
                  className="absolute top-20 right-20 w-3 h-3 bg-primary-400/30 rounded-full animate-float"
                  style={{ animationDelay: "1s" }}
                />
                <div
                  className="absolute bottom-20 left-1/4 w-2 h-2 bg-cta-400/30 rounded-full animate-float"
                  style={{ animationDelay: "2s" }}
                />
                <div
                  className="absolute bottom-10 right-1/3 w-4 h-4 bg-secondary-400/20 rounded-full animate-float"
                  style={{ animationDelay: "3s" }}
                />
              </div>
            </div>
          </div>

          {/* Glow effect behind */}
          <div
            className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 via-cta-500/20 to-secondary-500/20 rounded-3xl blur-2xl -z-10"
            aria-hidden="true"
          />
        </div>

        {/* Stats */}
        <div className="mt-16 pt-12 border-t border-slate-200/50">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 md:gap-16">
            <div className="text-center w-48 flex-none">
              <div className="text-3xl md:text-4xl font-heading font-bold text-slate-900">
                10K+
              </div>
              <div className="text-sm text-slate-500 mt-1">Videos được tạo</div>
            </div>
            <div
              className="hidden sm:block w-px h-12 bg-slate-200"
              aria-hidden="true"
            />
            <div className="text-center w-48 flex-none">
              <div className="text-3xl md:text-4xl font-heading font-bold text-slate-900">
                50+
              </div>
              <div className="text-sm text-slate-500 mt-1">Background đẹp</div>
            </div>
            <div
              className="hidden sm:block w-px h-12 bg-slate-200"
              aria-hidden="true"
            />
            <div className="text-center w-48 flex-none">
              <div className="text-3xl md:text-4xl font-heading font-bold text-slate-900">
                100%
              </div>
              <div className="text-sm text-slate-500 mt-1">Miễn phí</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator - Relative to ensure alignment */}
        <div className="mt-16 flex justify-center animate-bounce">
          <a
            href="#features"
            className="flex flex-col items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Scroll to features section"
          >
            <span className="text-xs font-medium mb-2">Khám phá</span>
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
