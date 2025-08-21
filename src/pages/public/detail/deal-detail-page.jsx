import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Copy,
  Check,
  Clock,
  AlertCircle,
  Gift,
  Users,
  Calendar,
  MapPin,
  Plane,
  Star,
  Shield,
  Info,
} from "lucide-react";

// Mock data chi tiết cho deal
const dealDetails = {
  summer2025: {
    id: "summer2025",
    title: "🌞 SUMMER SALE 2025",
    subtitle: "Ưu đãi hè sôi động",
    description:
      "Chào đón mùa hè với những chuyến bay giá rẻ đến các điểm đến nổi tiếng. Giảm đến 40% cho tất cả chuyến bay nội địa, áp dụng cho tất cả hạng ghế.",
    discount: "40%",
    code: "SUMMER40",
    validFrom: "2025-06-01",
    validUntil: "2025-09-30",
    minSpend: 2000000,
    maxDiscount: 1000000,
    usageLimit: 1000,
    usedCount: 234,
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200",
    type: "percentage",

    // Điều kiện áp dụng
    conditions: [
      "Áp dụng cho tất cả chuyến bay nội địa",
      "Đặt vé trước 48h so với giờ khởi hành",
      "Áp dụng cho tất cả hạng ghế: Economy, Business",
      "Không áp dụng đồng thời với chương trình khuyến mãi khác",
      "Mỗi khách hàng chỉ sử dụng 1 lần trong thời gian khuyến mãi",
    ],

    // Quy định
    policies: [
      "Mã giảm giá có hiệu lực từ 01/06/2025 đến 30/09/2025",
      "Giảm giá tối đa 1.000.000đ cho mỗi đơn hàng",
      "Chỉ áp dụng cho đơn hàng có giá trị từ 2.000.000đ trở lên",
      "Không hoàn lại dưới mọi hình thức khi đã sử dụng",
      "AirSky có quyền thay đổi điều khoản mà không cần báo trước",
    ],

    // Hướng dẫn sử dụng
    instructions: [
      "Chọn chuyến bay và điền thông tin hành khách",
      "Tại trang thanh toán, nhập mã 'SUMMER40' vào ô mã giảm giá",
      "Kiểm tra số tiền được giảm và hoàn tất thanh toán",
      "Nhận vé điện tử qua email sau khi thanh toán thành công",
    ],

    // Điểm đến áp dụng
    applicableRoutes: [
      "TP.HCM ↔ Hà Nội",
      "TP.HCM ↔ Đà Nẵng",
      "Hà Nội ↔ Đà Nẵng",
      "TP.HCM ↔ Phú Quốc",
      "Hà Nội ↔ Nha Trang",
      "Và tất cả tuyến nội địa khác",
    ],
  },

  weekend2025: {
    id: "weekend2025",
    title: "🎉 WEEKEND GETAWAY",
    subtitle: "Nghỉ dưỡng cuối tuần",
    description:
      "Tận hưởng những chuyến đi cuối tuần thú vị với ưu đãi đặc biệt 25% dành riêng cho các chuyến bay Thứ 7 và Chủ nhật.",
    discount: "25%",
    code: "WEEKEND25",
    validFrom: "2025-01-01",
    validUntil: "2025-12-31",
    minSpend: 1500000,
    maxDiscount: 500000,
    usageLimit: 2000,
    usedCount: 456,
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200",
    type: "percentage",

    conditions: [
      "Chỉ áp dụng cho chuyến bay khởi hành Thứ 7, Chủ nhật",
      "Đặt vé trước 24h so với giờ khởi hành",
      "Áp dụng cho hạng ghế Economy",
      "Mỗi tài khoản sử dụng tối đa 2 lần/tháng",
    ],

    policies: [
      "Có hiệu lực cả năm 2025",
      "Giảm giá tối đa 500.000đ cho mỗi đơn hàng",
      "Áp dụng cho đơn hàng từ 1.500.000đ",
      "Không áp dụng trong các ngày lễ, Tết",
    ],

    instructions: [
      "Chọn chuyến bay cuối tuần (T7, CN)",
      "Nhập mã 'WEEKEND25' khi thanh toán",
      "Kiểm tra và xác nhận đơn hàng",
      "Nhận vé và tận hưởng chuyến đi",
    ],

    applicableRoutes: [
      "Tất cả tuyến nội địa",
      "Ưu tiên các tuyến du lịch",
      "Không áp dụng cho chuyến bay quốc tế",
    ],
  },
};

const DealDetailPage = () => {
  const { dealId } = useParams();
  const [deal, setDeal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Simulate API call
    const dealData = dealDetails[dealId];
    if (dealData) {
      setDeal(dealData);
    }
  }, [dealId]);

  const copyToClipboard = async () => {
    if (deal?.code) {
      await navigator.clipboard.writeText(deal.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getDaysRemaining = (validUntil) => {
    const today = new Date();
    const endDate = new Date(validUntil);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUsagePercentage = () => {
    if (!deal) return 0;
    return (deal.usedCount / deal.usageLimit) * 100;
  };

  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Deal không tồn tại
          </h2>
          <Link to="/deals">
            <Button>Quay lại trang ưu đãi</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 ">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${deal.image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
        </div>

        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-5xl font-bold mb-4">{deal.title}</h1>
            <p className="text-xl mb-8 text-blue-100">{deal.subtitle}</p>

            {/* Deal Code Highlight */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 mb-8">
              <div className="text-center">
                <div className="text-sm text-blue-200 mb-2">MÃ GIẢM GIÁ</div>
                <div className="text-4xl font-mono font-bold mb-4 tracking-wider">
                  {deal.code}
                </div>
                <div className="text-6xl font-black text-yellow-400 mb-2">
                  -{deal.discount}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2 mx-auto"
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  <span>{copied ? "Đã sao chép!" : "Sao chép mã"}</span>
                </button>
              </div>
            </div>

            <p className="text-lg leading-relaxed">{deal.description}</p>
          </div>
        </div>
      </section>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-12">
        {/* Tab Navigation */}
        <div className="flex items-center justify-center mb-8 bg-white rounded-xl p-2 shadow-sm max-w-2xl mx-auto">
          {[
            { id: "overview", label: "Tổng quan", icon: Info },
            { id: "conditions", label: "Điều kiện", icon: AlertCircle },
            { id: "policies", label: "Quy định", icon: Shield },
            { id: "guide", label: "Hướng dẫn", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Deal Stats */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    Thông tin ưu đãi
                  </h3>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Giảm giá</div>
                      <div className="text-2xl font-bold text-red-600">
                        {deal.discount}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">
                        Giảm tối đa
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(deal.maxDiscount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">
                        Đơn tối thiểu
                      </div>
                      <div className="text-xl font-semibold">
                        {formatPrice(deal.minSpend)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Thời hạn</div>
                      <div className="text-xl font-semibold">
                        {formatDate(deal.validUntil)}{" "}
                        <Badge
                          variant="outline"
                          className="border-red-500 text-red-500"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Còn {getDaysRemaining(deal.validUntil)} ngày
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                    Tuyến đường áp dụng
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {deal.applicableRoutes.map((route, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg"
                      >
                        <Plane className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium dark:text-gray-700">{route}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Usage Stats */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4">Tình trạng sử dụng</h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Đã sử dụng</span>
                        <span>
                          {deal.usedCount}/{deal.usageLimit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${getUsagePercentage()}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {deal.usageLimit - deal.usedCount}
                      </div>
                      <div className="text-sm text-gray-500">
                        Lượt sử dụng còn lại
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                  <div className="text-center">
                    <Gift className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                    <h3 className="font-bold text-yellow-800 mb-2">
                      Đặt vé ngay!
                    </h3>
                    <p className="text-sm text-yellow-700 mb-4">
                      Ưu đãi có thể kết thúc bất kỳ lúc nào
                    </p>
                    <Link to="/flights">
                      <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                        Tìm chuyến bay
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "conditions" && (
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <AlertCircle className="w-6 h-6 mr-3 text-orange-500" />
                Điều kiện áp dụng
              </h3>

              <div className="space-y-4">
                {deal.conditions.map((condition, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400"
                  >
                    <div className="w-6 h-6 bg-orange-400 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{condition}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "policies" && (
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-blue-500" />
                Quy định & Điều khoản
              </h3>

              <div className="space-y-4">
                {deal.policies.map((policy, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400"
                  >
                    <div className="w-6 h-6 bg-blue-400 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{policy}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "guide" && (
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Users className="w-6 h-6 mr-3 text-green-500" />
                Hướng dẫn sử dụng
              </h3>

              <div className="space-y-6">
                {deal.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center text-lg font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {instruction}
                      </p>
                      {index < deal.instructions.length - 1 && (
                        <div className="w-px h-8 bg-green-200 ml-5 mt-4"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200">
                <div className="text-center">
                  <Check className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h4 className="font-bold text-green-800 mb-2">
                    Sẵn sàng đặt vé?
                  </h4>
                  <p className="text-green-700 mb-4">
                    Nhập mã{" "}
                    <span className="font-mono font-bold bg-white px-2 py-1 rounded">
                      {deal.code}
                    </span>{" "}
                    để nhận ưu đãi
                  </p>
                  <Link to="/flights">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      Bắt đầu đặt vé
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealDetailPage;
