const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="bg-slate-900 text-white relative overflow-hidden"
      role="contentinfo"
    >
      {/* Top gradient border */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-cta-500 to-secondary-500"
        aria-hidden="true"
      />

      {/* CTA Section */}
      <div className="border-b border-slate-800">
        <div className="container-custom py-16 text-center">
          <h2 className="font-heading font-bold text-2xl md:text-3xl lg:text-4xl text-white mb-4">
            Sẵn sàng tạo video quote đẹp?
          </h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Bắt đầu miễn phí ngay hôm nay. Không cần đăng ký, không cần thẻ tín
            dụng.
          </p>
          <a
            href="#/editor"
            className="btn-cta"
            aria-label="Tạo video miễn phí ngay bây giờ"
          >
            <span>Tạo video miễn phí</span>
            <svg
              className="w-5 h-5 ml-2"
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

      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <a
              href="/"
              className="inline-flex items-center gap-2 mb-4 cursor-pointer"
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
              <span className="font-heading font-bold text-xl text-white">
                VibeQuote
              </span>
            </a>
            <p className="text-slate-400 max-w-md mb-6">
              Công cụ tạo video quote miễn phí và đơn giản nhất. Biến những câu
              nói yêu thích thành video đẹp mắt chỉ trong vài giây.
            </p>

            {/* Social links */}
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center 
                          text-slate-400 hover:text-white transition-all cursor-pointer"
                aria-label="Follow us on Twitter"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center 
                          text-slate-400 hover:text-white transition-all cursor-pointer"
                aria-label="Follow us on Facebook"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center 
                          text-slate-400 hover:text-white transition-all cursor-pointer"
                aria-label="Follow us on Instagram"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-heading font-semibold text-white mb-4">
              Sản phẩm
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#features"
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Tính năng
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cách hoạt động
                </a>
              </li>
              <li>
                <a
                  href="#examples"
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Ví dụ
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-white mb-4">
              Pháp lý
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/privacy"
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Điều khoản sử dụng
                </a>
              </li>
              <li>
                <a
                  href="https://unsplash.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  Photos by Unsplash
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
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {currentYear} VibeQuote. All rights reserved.
          </p>
          <p className="text-slate-500 text-sm">Made with ❤️ in Vietnam</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
