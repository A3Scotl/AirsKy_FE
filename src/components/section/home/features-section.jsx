export function FeaturesSection() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-3xl font-bold text-center mb-8">
            Tại sao chọn AirsKy?
          </h2>
          <p className="text-lg text-center text-gray-600 mb-12">
            Khám phá những tính năng độc đáo giúp AirsKy trở thành sự lựa chọn
            tốt nhất cho nhu cầu du lịch của bạn
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#eff6ff] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#2563eb]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#111827] dark:text-white mb-2">
              Đảm bảo giá tốt nhất
            </h3>
            <p className="text-sm text-[#6b7280]">
              Tìm thấy giá thấp hơn? Chúng tôi sẽ khớp nó
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#f0fdf4] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#16a34a]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#111827] dark:text-white mb-2">
              Hỗ trợ 24/7
            </h3>
            <p className="text-sm text-[#6b7280]">Dịch vụ khách hàng 24/7</p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#ffedd5] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#ea580c]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 13a2 2 0 002 2h6a2 2 0 002-2L16 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#111827] dark:text-white mb-2">
              Ngày linh hoạt
            </h3>
            <p className="text-sm text-[#6b7280]">
              Dễ dàng thay đổi và hủy chuyến bay
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#f3e8ff] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#9333ea]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#111827] dark:text-white mb-2">
              Đặt chỗ an toàn
            </h3>
            <p className="text-sm text-[#6b7280]">
              Dữ liệu của bạn được bảo vệ an toàn
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
