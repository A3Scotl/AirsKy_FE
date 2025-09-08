import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQSection = () => {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const faqData = [
    {
      question: "Làm thế nào để đặt vé máy bay trên AirsKy?",
      answer:
        "Để đặt vé máy bay, bạn chỉ cần nhập điểm khởi hành, điểm đến, ngày đi và số lượng hành khách. Hệ thống sẽ hiển thị các chuyến bay phù hợp với giá tốt nhất. Sau khi chọn chuyến bay, bạn điền thông tin cá nhân và thanh toán để hoàn tất đặt vé.",
    },
    {
      question: "Tôi có thể thay đổi hoặc hủy vé máy bay đã đặt không?",
      answer:
        "Có, bạn có thể thay đổi hoặc hủy vé máy bay tùy theo chính sách của từng hãng hàng không. Phí thay đổi/hủy vé sẽ khác nhau tùy theo thời gian thực hiện và hạng vé. Vui lòng kiểm tra chi tiết trong email xác nhận hoặc liên hệ với chúng tôi để được hỗ trợ.",
    },
    {
      question: "AirsKy có hỗ trợ thanh toán bằng những phương thức nào?",
      answer:
        "Chúng tôi hỗ trợ nhiều phương thức thanh toán an toàn bao gồm: thẻ tín dụng/ghi nợ (Visa, Mastercard, JCB), ví điện tử (Momo, ZaloPay, ViettelPay), chuyển khoản ngân hàng, và thanh toán khi nhận vé tại sân bay.",
    },
    {
      question: "Tôi cần chuẩn bị gì khi đi máy bay?",
      answer:
        "Bạn cần mang theo giấy tờ tùy thân (CMND/CCCD hoặc hộ chiếu), vé điện tử hoặc boarding pass, và tuân thủ quy định về hành lý xách tay và ký gửi. Hãy đến sân bay sớm ít nhất 2-3 tiếng cho chuyến bay nội địa và 3-4 tiếng cho chuyến bay quốc tế.",
    },
    {
      question: "Làm thế nào để nhận được giá vé máy bay rẻ nhất?",
      answer:
        "Để có giá vé tốt nhất, bạn nên đặt vé sớm (ít nhất 2-3 tháng trước), theo dõi chương trình khuyến mãi, đặt vé vào các ngày ít nhu cầu đi lại (thứ 3, thứ 4, thứ 6), và linh hoạt về thời gian khởi hành.",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-indigo-500 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-purple-500 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Câu Hỏi Thường Gặp
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Tìm hiểu thêm về dịch vụ đặt vé máy bay và các chính sách của chúng
            tôi
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {openItems.has(index) ? (
                    <ChevronUp className="w-6 h-6 text-blue-600 dark:text-blue-400 transition-transform duration-200" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" />
                  )}
                </div>
              </button>

              {openItems.has(index) && (
                <div className="px-6 pb-5 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed pt-4">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
