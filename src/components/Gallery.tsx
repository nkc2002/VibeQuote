const examples = [
  {
    id: 1,
    quote: "Cuộc sống là những gì xảy ra khi bạn bận rộn lập kế hoạch.",
    author: "John Lennon",
    gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
  },
  {
    id: 2,
    quote: "Hãy là sự thay đổi mà bạn muốn thấy trong thế giới.",
    author: "Mahatma Gandhi",
    gradient: "from-cyan-500 via-blue-500 to-indigo-500",
  },
  {
    id: 3,
    quote: "Thành công không phải là đích đến, mà là hành trình.",
    author: "Zig Ziglar",
    gradient: "from-rose-500 via-pink-500 to-orange-400",
  },
  {
    id: 4,
    quote: "Điều duy nhất chúng ta cần sợ là chính nỗi sợ hãi.",
    author: "Franklin D. Roosevelt",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  {
    id: 5,
    quote: "Tưởng tượng quan trọng hơn kiến thức.",
    author: "Albert Einstein",
    gradient: "from-amber-500 via-orange-500 to-red-500",
  },
  {
    id: 6,
    quote: "Hành động nói to hơn lời nói.",
    author: "Abraham Lincoln",
    gradient: "from-blue-600 via-violet-600 to-purple-600",
  },
];

const Gallery = () => {
  return (
    <section
      id="examples"
      className="section-padding bg-slate-900 relative overflow-hidden"
      aria-labelledby="gallery-heading"
    >
      {/* Background decoration */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)`,
        }}
        aria-hidden="true"
      />

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-semibold text-cta-300 bg-cta-900/50 rounded-full border border-cta-700/50">
            Ví dụ
          </span>
          <h2
            id="gallery-heading"
            className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-white mb-6"
          >
            Video quote mẫu
          </h2>
          <p className="text-lg text-slate-400">
            Khám phá những video quote đẹp được tạo bởi VibeQuote
          </p>
        </div>

        {/* Gallery Grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          role="list"
          aria-label="Video quote examples gallery"
        >
          {examples.map((example) => (
            <article
              key={example.id}
              className="group relative aspect-video rounded-2xl overflow-hidden cursor-pointer
                         shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              tabIndex={0}
              role="listitem"
              aria-label={`Quote by ${example.author}: ${example.quote}`}
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${example.gradient}`}
                aria-hidden="true"
              />

              {/* Quote Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                {/* Quote icon */}
                <svg
                  className="w-8 h-8 text-white/30 mb-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>

                <p className="text-white font-heading font-semibold text-sm sm:text-base leading-relaxed line-clamp-3">
                  "{example.quote}"
                </p>
                <p className="mt-4 text-white/70 text-sm">— {example.author}</p>
              </div>

              {/* Hover overlay with play button */}
              <div
                className="absolute inset-0 bg-black/40 flex items-center justify-center 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-hidden="true"
              >
                <div
                  className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center
                               transform scale-50 group-hover:scale-100 transition-transform duration-300"
                >
                  <svg
                    className="w-8 h-8 text-slate-900 ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* Glass border effect */}
              <div
                className="absolute inset-0 rounded-2xl border border-white/20"
                aria-hidden="true"
              />
            </article>
          ))}
        </div>

        {/* View more */}
        <div className="mt-12 text-center">
          <button
            className="inline-flex items-center gap-2 px-6 py-3 text-white/80 hover:text-white 
                       border border-white/20 hover:border-white/40 rounded-full 
                       transition-all duration-200 cursor-pointer"
            aria-label="Xem thêm các video quote mẫu"
          >
            <span>Xem thêm ví dụ</span>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
