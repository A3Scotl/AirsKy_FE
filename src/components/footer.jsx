import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";

const footerData = {
  quickTags: [
    "Tìm chuyến bay",
    "Bảo hiểm du lịch",
    "Đặt nhóm",
    "Du lịch doanh nghiệp",
  ],
  customerCare: [
    "Trung tâm trợ giúp",
    "Liên hệ hỗ trợ",
    "Quản lý đặt vé",
    "Chính sách hủy vé",
    "Trạng thái hoàn tiền",
    "Hướng dẫn du lịch",
  ],
  legalPrivacy: [
    "Điều khoản dịch vụ",
    "Chính sách bảo mật",
    "Chính sách cookie",
    "Truy cập cho người khuyết tật",
    "Trung tâm bảo mật",
    "Tuân thủ pháp luật",
  ],
  socialLinks: [
    { Icon: Facebook, color: "hover:text-blue-500" },
    { Icon: Twitter, color: "hover:text-sky-400" },
    { Icon: Instagram, color: "hover:text-pink-500" },
    { Icon: Linkedin, color: "hover:text-blue-600" },
  ],
  contact: [
    { Icon: Mail, text: "support@airsky.com" },
    { Icon: Phone, text: "+84 (38) 532-1560" },
    { Icon: MapPin, text: "123 Nguyễn Huệ, Quận 1, TP.HCM" },
  ],
};

const FooterSection = ({ title, items }) => (
  <div>
    <h3 className="text-xl font-bold mb-6 text-white">{title}</h3>
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item}>
          <a
            href="#"
            className="text-gray-300 hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block"
          >
            {item}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="py-16">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <img
                className="h-16 w-16 object-cover"
                src="https://res.cloudinary.com/dzwjgfd7t/image/upload/v1755141382/flight%20booking/main_logo-removebg_xyofym.png"
                alt="AirSky"
              />
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                AirSky
              </h2>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Đối tác tin cậy cho trải nghiệm đặt vé máy bay liền mạch. Khám phá
              thế giới với sự tự tin, thoải mái và ưu đãi hấp dẫn.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-6 text-white">Về AirSky</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Chúng tôi cách mạng hóa hành trình của bạn với nền tảng đặt vé
                máy bay toàn diện. Từ giá rẻ đến cao cấp, AirSky luôn đồng hành
                cùng bạn trên mọi chuyến đi.
              </p>
              <div className="space-y-3">
                {footerData.contact.map(({ Icon, text }) => (
                  <div key={text} className="flex items-center text-gray-300">
                    <Icon className="w-5 h-5 mr-3 text-blue-400" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <FooterSection title="Thẻ nhanh" items={footerData.quickTags} />
            <FooterSection
              title="Chăm sóc khách hàng"
              items={footerData.customerCare}
            />
            <FooterSection
              title="Pháp lý & Bảo mật"
              items={footerData.legalPrivacy}
            />
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-gray-700/50 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">
              Nhận thông tin mới từ AirSky
            </h3>
            <p className="text-gray-300 mb-8">
              Đăng ký nhận bản tin để nhận ưu đãi độc quyền, mẹo du lịch và cảm
              hứng điểm đến mỗi tuần.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Nhập địa chỉ email của bạn"
                className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 rounded-full border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 rounded-full hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-105">
                Đăng ký
              </button>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-700/50 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 lg:mb-0">
              © 2025 AirSky Đặt vé máy bay. Đã đăng ký bản quyền.
            </p>
            <div className="flex items-center space-x-6">
              <span className="text-gray-400 hidden sm:block">
                Kết nối với chúng tôi:
              </span>
              <div className="flex space-x-4">
                {footerData.socialLinks.map(({ Icon, color }, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className={`text-gray-400 ${color} transition-all duration-200 hover:scale-110 transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
