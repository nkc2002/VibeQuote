import { useState } from "react";

const faqs = [
  {
    question: "VibeQuote có thực sự miễn phí không?",
    answer:
      "Có, VibeQuote hoàn toàn miễn phí! Không có phí ẩn, không cần thẻ tín dụng, và tất cả tính năng đều miễn phí 100%. Chúng tôi tin rằng mọi người đều nên có quyền tạo video quote đẹp mà không cần lo lắng về chi phí.",
  },
  {
    question: "Tôi có cần tạo tài khoản không?",
    answer:
      "Không, bạn không cần tạo tài khoản hay đăng nhập. Chỉ cần truy cập trang web và bắt đầu tạo video ngay lập tức. Quyền riêng tư của bạn được bảo vệ hoàn toàn.",
  },
  {
    question: "Video được tải xuống ở định dạng nào?",
    answer:
      "Video được tải xuống ở định dạng MP4 với chất lượng Full HD (1080p). Đây là định dạng phổ biến nhất, tương thích với hầu hết các thiết bị và nền tảng mạng xã hội.",
  },
  {
    question: "Tôi có thể sử dụng video cho mục đích thương mại không?",
    answer:
      "Có, bạn có thể sử dụng video được tạo cho bất kỳ mục đích nào, bao gồm cả thương mại. Tuy nhiên, nếu sử dụng hình ảnh từ Unsplash, vui lòng tuân thủ giấy phép của họ.",
  },
  {
    question: "Có giới hạn số lượng video tôi có thể tạo không?",
    answer:
      "Không, không có giới hạn! Bạn có thể tạo bao nhiêu video tùy thích. Chúng tôi chỉ yêu cầu sử dụng hợp lý để đảm bảo dịch vụ hoạt động tốt cho tất cả mọi người.",
  },
  {
    question: "Hình ảnh background đến từ đâu?",
    answer:
      "Chúng tôi sử dụng hình ảnh chất lượng cao từ Unsplash - một thư viện ảnh miễn phí với hàng triệu hình ảnh đẹp. Mỗi hình ảnh đều được chọn lọc kỹ càng để phù hợp với video quote.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle(index);
    }
  };

  return (
    <section
      id="faq"
      className="section-padding bg-slate-50 relative overflow-hidden"
      aria-labelledby="faq-heading"
    >
      {/* Background decoration */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-100/30 rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-semibold text-primary-600 bg-primary-100 rounded-full">
            FAQ
          </span>
          <h2
            id="faq-heading"
            className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-slate-900 mb-6"
          >
            Câu hỏi thường gặp
          </h2>
          <p className="text-lg text-slate-600">
            Bạn có thắc mắc? Chúng tôi có câu trả lời.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4" role="list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`rounded-2xl border transition-all duration-300 ${
                  openIndex === index
                    ? "bg-white border-primary-200 shadow-lg"
                    : "bg-white/70 border-slate-200 hover:border-slate-300"
                }`}
                role="listitem"
              >
                <button
                  onClick={() => handleToggle(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer"
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <span className="font-heading font-semibold text-lg text-slate-900 pr-4">
                    {faq.question}
                  </span>
                  <span
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                               transition-all duration-300 ${
                                 openIndex === index
                                   ? "bg-primary-500 text-white rotate-180"
                                   : "bg-slate-100 text-slate-500"
                               }`}
                    aria-hidden="true"
                  >
                    <svg
                      className="w-5 h-5 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </button>

                <div
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    openIndex === index
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 pb-5">
                    <p className="text-slate-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact support */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 mb-4">
            Không tìm thấy câu trả lời bạn cần?
          </p>
          <a
            href="mailto:support@vibequote.com"
            className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors cursor-pointer"
          >
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span>Liên hệ hỗ trợ</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
