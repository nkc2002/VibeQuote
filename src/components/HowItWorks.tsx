const steps = [
  {
    number: "01",
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
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
    title: "Nhập nội dung quote",
    description:
      "Gõ hoặc paste câu quote yêu thích của bạn. Thêm tên tác giả nếu muốn.",
  },
  {
    number: "02",
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
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
        />
      </svg>
    ),
    title: "Chọn background style",
    description:
      "Lựa chọn từ 50+ background tuyệt đẹp. Gradient, hình ảnh, hoặc video.",
  },
  {
    number: "03",
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
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    ),
    title: "Tải video về máy",
    description: 'Nhấn "Tạo video" và tải xuống file MP4 chất lượng cao.',
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="section-padding bg-white relative overflow-hidden"
      aria-labelledby="how-it-works-heading"
    >
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-semibold text-secondary-600 bg-secondary-100 rounded-full">
            Cách hoạt động
          </span>
          <h2
            id="how-it-works-heading"
            className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-slate-900 mb-6"
          >
            Chỉ 3 bước đơn giản
          </h2>
          <p className="text-lg text-slate-600">
            Tạo video quote chuyên nghiệp chưa bao giờ dễ dàng đến thế
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line - Desktop */}
          <div
            className="hidden lg:block absolute top-24 left-[16.67%] right-[16.67%] h-1 bg-gradient-to-r from-primary-500 via-cta-500 to-secondary-500 rounded-full"
            aria-hidden="true"
          />

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <article
                key={index}
                className="relative flex flex-col items-center text-center group"
                tabIndex={0}
                aria-labelledby={`step-title-${index}`}
              >
                {/* Step number with icon */}
                <div className="relative mb-8">
                  {/* Glow effect */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-primary-500 to-cta-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"
                    aria-hidden="true"
                  />

                  {/* Circle with icon */}
                  <div
                    className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-cta-500 
                               flex items-center justify-center text-white shadow-xl
                               group-hover:scale-110 transition-transform duration-300"
                  >
                    {step.icon}
                  </div>

                  {/* Step number badge */}
                  <div
                    className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-white shadow-lg 
                               flex items-center justify-center font-heading font-bold text-primary-600 text-sm
                               border-2 border-primary-100"
                  >
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <h3
                  id={`step-title-${index}`}
                  className="font-heading font-bold text-xl text-slate-900 mb-3"
                >
                  {step.title}
                </h3>
                <p className="text-slate-600 leading-relaxed max-w-xs">
                  {step.description}
                </p>

                {/* Arrow for mobile */}
                {index < steps.length - 1 && (
                  <div
                    className="md:hidden mt-8 text-slate-300"
                    aria-hidden="true"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <a
            href="#/editor"
            className="btn-cta group"
            aria-label="Bắt đầu tạo video quote ngay bây giờ"
          >
            <span>Bắt đầu ngay</span>
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
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
