const features = [
  {
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    title: "Nhanh chóng",
    description:
      "Tạo video quote chỉ trong vài giây. Nhập nội dung, chọn style và tải xuống ngay lập tức.",
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-50 to-orange-50",
  },
  {
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
        />
      </svg>
    ),
    title: "Hoàn toàn miễn phí",
    description:
      "Không có phí ẩn, không cần thẻ tín dụng. Tất cả tính năng đều miễn phí 100%.",
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-50 to-teal-50",
  },
  {
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    title: "Bảo mật & Riêng tư",
    description:
      "Đăng nhập an toàn. Videos và dữ liệu của bạn được bảo vệ. Chỉ bạn mới có thể truy cập.",
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-50 to-purple-50",
  },
];

const Features = () => {
  return (
    <section
      id="features"
      className="section-padding bg-slate-50/50 relative overflow-hidden"
      aria-labelledby="features-heading"
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 w-96 h-96 bg-primary-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 bg-cta-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
        aria-hidden="true"
      />

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-semibold text-primary-600 bg-primary-100 rounded-full">
            Tính năng
          </span>
          <h2
            id="features-heading"
            className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-slate-900 mb-6"
          >
            Tại sao chọn VibeQuote?
          </h2>
          <p className="text-lg text-slate-600">
            Công cụ đơn giản nhưng mạnh mẽ giúp bạn tạo video quote chuyên
            nghiệp
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <article
              key={index}
              className="group relative p-8 rounded-3xl bg-white border border-slate-100 shadow-lg 
                         hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
              tabIndex={0}
              aria-labelledby={`feature-title-${index}`}
            >
              {/* Gradient background on hover */}
              <div
                className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.bgGradient} opacity-0 
                           group-hover:opacity-100 transition-opacity duration-300`}
                aria-hidden="true"
              />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                             bg-gradient-to-br ${feature.gradient} text-white shadow-lg mb-6
                             group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>

                {/* Title */}
                <h3
                  id={`feature-title-${index}`}
                  className="font-heading font-bold text-xl text-slate-900 mb-3"
                >
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Learn more link */}
                <div className="mt-6 flex items-center text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Tìm hiểu thêm</span>
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Additional info */}
        <div className="mt-16 text-center">
          <p className="text-slate-500">
            Và còn nhiều tính năng tuyệt vời khác đang chờ bạn khám phá...
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
