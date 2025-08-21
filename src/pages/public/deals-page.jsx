import { useState, useEffect } from "react";
import SEO from "@/components/common/seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Plane,
  Clock,
  Calendar,
  MapPin,
  Percent,
  Tag,
  Star,
  ArrowRight,
  Filter,
  Search,
  Zap,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

// Mock data cho deals
const featuredDeals = [
  {
    id: "summer2025",
    title: "🌞 SUMMER SALE 2025",
    description: "Giảm đến 40% cho tất cả chuyến bay nội địa",
    discount: "40%",
    code: "SUMMER40",
    validUntil: "2025-09-30",
    minSpend: 2000000,
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200",
    type: "featured",
    isHot: true,
  },
  {
    id: "weekend2025",
    title: "🎉 WEEKEND GETAWAY",
    description: "Ưu đãi cuối tuần - Giảm 25% cho chuyến bay Thứ 7, CN",
    discount: "25%",
    code: "WEEKEND25",
    validUntil: "2025-12-31",
    minSpend: 1500000,
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200",
    type: "weekend",
  },
  {
    id: "student2025",
    title: "🎓 ƯU ĐÃI SINH VIÊN",
    description: "Sinh viên giảm 30% - Cần xuất trình thẻ sinh viên",
    discount: "30%",
    code: "STUDENT30",
    validUntil: "2025-08-31",
    minSpend: 1000000,
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200",
    type: "student",
  },
];

const flightDeals = [
  {
    id: "1",
    route: "TP.HCM → Hà Nội",
    fromCode: "SGN",
    toCode: "HAN",
    originalPrice: 2500000,
    salePrice: 1599000,
    discount: 36,
    airline: "Vietnam Airlines",
    airlineLogo:
      "https://upload.wikimedia.org/wikipedia/en/thumb/b/b6/Vietnam_Airlines_logo_2015.svg/375px-Vietnam_Airlines_logo_2015.svg.png",
    duration: "2h 15m",
    departureDate: "2025-08-25",
    validUntil: "2025-08-30",
    availableSeats: 12,
    dealCode: "FLASH36",
  },
  {
    id: "2",
    route: "Hà Nội → Đà Nẵng",
    fromCode: "HAN",
    toCode: "DAD",
    originalPrice: 1800000,
    salePrice: 999000,
    discount: 44,
    airline: "VietJet Air",
    airlineLogo:
      "https://upload.wikimedia.org/wikipedia/commons/8/8d/VietJet_Air_logo.png",
    duration: "1h 30m",
    departureDate: "2025-08-26",
    validUntil: "2025-08-28",
    availableSeats: 8,
    dealCode: "FLASH44",
  },
  {
    id: "3",
    route: "TP.HCM → Phú Quốc",
    fromCode: "SGN",
    toCode: "PQC",
    originalPrice: 2200000,
    salePrice: 1299000,
    discount: 41,
    airline: "Bamboo Airways",
    airlineLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Bamboo_Airways_logo.svg/375px-Bamboo_Airways_logo.svg.png",
    duration: "1h 10m",
    departureDate: "2025-08-27",
    validUntil: "2025-09-02",
    availableSeats: 15,
    dealCode: "ISLAND41",
  },
  {
    id: "4",
    route: "TP.HCM → Phú Quốc",
    fromCode: "SGN",
    toCode: "PQC",
    originalPrice: 2200000,
    salePrice: 1299000,
    discount: 41,
    airline: "Bamboo Airways",
    airlineLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Bamboo_Airways_logo.svg/375px-Bamboo_Airways_logo.svg.png",
    duration: "1h 10m",
    departureDate: "2025-08-27",
    validUntil: "2025-09-02",
    availableSeats: 15,
    dealCode: "ISLAND41",
  },
  {
    id: "5",
    route: "TP.HCM → Phú Quốc",
    fromCode: "SGN",
    toCode: "PQC",
    originalPrice: 2200000,
    salePrice: 1299000,
    discount: 41,
    airline: "Bamboo Airways",
    airlineLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Bamboo_Airways_logo.svg/375px-Bamboo_Airways_logo.svg.png",
    duration: "1h 10m",
    departureDate: "2025-08-27",
    validUntil: "2025-09-02",
    availableSeats: 15,
    dealCode: "ISLAND41",
  },
  {
    id: "6",
    route: "TP.HCM → Phú Quốc",
    fromCode: "SGN",
    toCode: "PQC",
    originalPrice: 2200000,
    salePrice: 1299000,
    discount: 41,
    airline: "Bamboo Airways",
    airlineLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Bamboo_Airways_logo.svg/375px-Bamboo_Airways_logo.svg.png",
    duration: "1h 10m",
    departureDate: "2025-08-27",
    validUntil: "2025-09-02",
    availableSeats: 15,
    dealCode: "ISLAND41",
  },
  {
    id: "7",
    route: "TP.HCM → Phú Quốc",
    fromCode: "SGN",
    toCode: "PQC",
    originalPrice: 2200000,
    salePrice: 1299000,
    discount: 41,
    airline: "Bamboo Airways",
    airlineLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Bamboo_Airways_logo.svg/375px-Bamboo_Airways_logo.svg.png",
    duration: "1h 10m",
    departureDate: "2025-08-27",
    validUntil: "2025-09-02",
    availableSeats: 15,
    dealCode: "ISLAND41",
  },
  {
    id: "8",
    route: "TP.HCM → Phú Quốc",
    fromCode: "SGN",
    toCode: "PQC",
    originalPrice: 2200000,
    salePrice: 1299000,
    discount: 41,
    airline: "Bamboo Airways",
    airlineLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Bamboo_Airways_logo.svg/375px-Bamboo_Airways_logo.svg.png",
    duration: "1h 10m",
    departureDate: "2025-08-27",
    validUntil: "2025-09-02",
    availableSeats: 15,
    dealCode: "ISLAND41",
  },
  {
    id: "9",
    route: "TP.HCM → Phú Quốc",
    fromCode: "SGN",
    toCode: "PQC",
    originalPrice: 2200000,
    salePrice: 1299000,
    discount: 41,
    airline: "Bamboo Airways",
    airlineLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Bamboo_Airways_logo.svg/375px-Bamboo_Airways_logo.svg.png",
    duration: "1h 10m",
    departureDate: "2025-08-27",
    validUntil: "2025-09-02",
    availableSeats: 15,
    dealCode: "ISLAND41",
  },
];

// Mã giảm giá bổ sung cho modal
const allDiscountCodes = [
  {
    id: "first_flight",
    code: "FIRSTFLY",
    discount: "15%",
    description: "Giảm 15% cho khách hàng đặt vé lần đầu",
    validUntil: "2025-12-31",
    category: "new-customer",
  },
  {
    id: "weekend_special",
    code: "WEEKEND25",
    discount: "25%",
    description: "Ưu đãi đặc biệt cuối tuần",
    validUntil: "2025-10-31",
    category: "weekend",
  },
  {
    id: "group_booking",
    code: "GROUP20",
    discount: "20%",
    description: "Đặt từ 5 vé trở lên",
    validUntil: "2025-11-30",
    category: "group",
  },
  {
    id: "early_bird",
    code: "EARLY30",
    discount: "30%",
    description: "Đặt trước 30 ngày",
    validUntil: "2025-12-15",
    category: "early-bird",
  },
  {
    id: "loyalty",
    code: "LOYAL50",
    discount: "50%",
    description: "Dành cho khách hàng thân thiết",
    validUntil: "2025-12-31",
    category: "loyalty",
  },
  {
    id: "holiday",
    code: "HOLIDAY35",
    discount: "35%",
    description: "Ưu đãi lễ tết",
    validUntil: "2025-12-25",
    category: "holiday",
  },
  {
    id: "business",
    code: "BCLASS40",
    discount: "40%",
    description: "Hạng thương gia",
    validUntil: "2025-11-30",
    category: "business",
  },
  {
    id: "domestic",
    code: "VIETNAM25",
    discount: "25%",
    description: "Chuyến bay nội địa",
    validUntil: "2025-10-31",
    category: "domestic",
  },
];

const DealsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("discount");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(flightDeals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFlightDeals = flightDeals.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    // You can add a toast notification here
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

  return (
    <>
      <SEO
        title="Ưu Đãi Bay"
        description="Tìm kiếm và lựa chọn các ưu đãi phù hợp cho từng chuyến bay của bạn."
        keywords="tìm kiếm chuyến bay, so sánh vé máy bay, đặt vé máy bay"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-500 dark:via-gray-600 dark:to-gray-700">
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-b from-purple-200 via-blue-600 to-cyan-600 text-white py-24 pb-8">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container flex px-16 justify-between flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-6">Khuyến Mãi & Ưu Đãi</h1>
              <p className="text-sm mb-8 max-w-3xl mx-auto">
                Khám phá những deal bay tuyệt vời với mã giảm giá độc quyền, ưu
                đãi flash sale và các chương trình khuyến mãi hấp dẫn
              </p>
            </div>

            {/* Search bar */}
            <div className="max-w-md relative flex w-full items-center">
              <input
                type="text"
                placeholder="Tìm kiếm mã giảm giá..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 py-3 rounded-xl border-0 bg-gray-50/55 text-white placeholder-gray-500 focus:ring-4 focus:ring-white/20 pr-12"
              />
              <Search className="text-white w-8 h-8 rounded-full absolute right-2 cursor-pointer" />
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-6xl py-16">
          {/* Featured Deals Section */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  🔥 Ưu Đãi Nổi Bật
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Những mã giảm giá hot nhất không thể bỏ lỡ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featuredDeals.map((deal, index) => (
                <Card
                  key={deal.id}
                  className={`relative overflow-hidden group hover:shadow-2xl transition-all duration-500 ${
                    index === 0 ? "lg:col-span-2 lg:row-span-2" : ""
                  }`}
                >
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${deal.image})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
                  </div>

                  {/* Content */}
                  <div
                    className={`relative z-10 p-6 h-full flex flex-col justify-between ${
                      index === 0 ? "min-h-[320px]" : "min-h-[200px]"
                    }`}
                  >
                    <div>
                      {/* Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {deal.isHot && (
                            <Badge className="bg-red-500 text-white px-3 py-1">
                              🔥 HOT
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="bg-white/20 text-white border-white/30"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            Còn {getDaysRemaining(deal.validUntil)} ngày
                          </Badge>
                        </div>
                        <div className="bg-yellow-400 text-black px-3 py-1 rounded-full font-bold text-lg">
                          -{deal.discount}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3
                        className={`font-bold text-white mb-2 ${
                          index === 0 ? "text-2xl" : "text-lg"
                        }`}
                      >
                        {deal.title}
                      </h3>
                      <p
                        className={`text-white/90 mb-3 ${
                          index === 0 ? "text-base" : "text-sm"
                        }`}
                      >
                        {deal.description}
                      </p>

                      {/* Deal Code */}
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-1 flex items-center space-x-2">
                          <Tag className="w-3 h-3 text-white" />
                          <span className="text-white font-mono font-bold text-sm">
                            {deal.code}
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(deal.code)}
                          className="text-white/80 hover:text-white text-sm underline"
                        >
                          Sao chép
                        </button>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between">
                      <div className="text-white/80 text-sm">
                        Áp dụng đơn từ {formatPrice(deal.minSpend)}
                      </div>
                      <Link to={`/deals/${deal.id}`}>
                        <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                          Chi tiết
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* All Discount Codes Modal Section */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  🎫 Mã Giảm Giá
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Tổng hợp tất cả mã giảm giá hiện có
                </p>
              </div>

              <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="font-semibold">
                    <Eye className="w-4 h-4 mr-2" />
                    Xem tất cả mã
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="right"
                  className="w-full sm:w-[540px] md:w-[720px] lg:w-[900px] xl:w-[1000px] h-screen overflow-y-auto p-0 sm:max-w-none z-9999"
                >
                  <div className="p-6">
                    <SheetHeader className="mb-6">
                      <SheetTitle className="text-2xl font-bold">
                        Tất cả mã giảm giá
                      </SheetTitle>
                      <SheetDescription className="text-gray-600">
                        Danh sách đầy đủ các mã giảm giá hiện có
                      </SheetDescription>
                    </SheetHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {allDiscountCodes.map((code) => (
                        <Card
                          key={code.id}
                          className="p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-mono font-bold">
                              {code.code}
                            </div>
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                            >
                              -{code.discount}
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-2 text-sm">
                            {code.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Hết hạn: {formatDate(code.validUntil)}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(code.code)}
                              className="text-xs"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Sao chép
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Quick preview of discount codes */}
            {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4"> */}
            <Swiper
              modules={[Autoplay]}
              spaceBetween={30}
              slidesPerView={4}
              loop={true}
              autoplay={{
                delay: 2000,
                disableOnInteraction: false,
              }}
              breakpoints={{
                320: { slidesPerView: 2 },
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 4 },
              }}
              className="deals-slider"
            >
              {allDiscountCodes.map((code, index) => (
                <SwiperSlide
                  key={index}
                  className="p-4 hover:shadow-md transition-shadow border-1 border-gray-200 rounded-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-mono font-bold">
                      {code.code}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600"
                    >
                      -{code.discount}
                    </Badge>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2 text-sm">
                    {code.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-300">
                      Hết hạn: {formatDate(code.validUntil)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(code.code)}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Sao chép
                    </Button>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>

          {/* Flight Deals Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  ✈️ Flash Sale Chuyến Bay
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Giá vé ưu đãi có thời hạn - Đặt ngay kẻo lỡ!
                </p>
              </div>

              <Link to="/flights">
                <Button variant="outline" className="font-semibold">
                  Xem thêm
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedFlightDeals.map((deal) => (
                <Card
                  key={deal.id}
                  className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 shadow-lg"
                >
                  {/* Discount Badge */}
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full font-bold text-xs z-10">
                    -{deal.discount}%
                  </div>

                  <div className="p-4">
                    {/* Airline */}
                    <div className="flex items-center space-x-2 mb-3">
                      <img
                        src={deal.airlineLogo}
                        alt={deal.airline}
                        className="w-6 h-6 object-contain"
                      />
                      <span className="font-medium text-gray-700 text-sm dark:text-gray-300">
                        {deal.airline}
                      </span>
                    </div>

                    {/* Route */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800 dark:text-white">
                          {deal.fromCode}
                        </div>
                      </div>
                      <div className="flex-1 mx-3 relative">
                        <div className="h-px bg-gray-300"></div>
                        <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 bg-white dark:bg-gray-900" />
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800 dark:text-white">
                          {deal.toCode}
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-gray-600 mb-3 text-sm">
                      {deal.route}
                    </div>

                    {/* Flight Info */}
                    <div className="grid grid-cols-2 gap-3 mb-3 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {deal.duration}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(deal.departureDate)}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-3">
                      <div className="text-gray-500 text-xs line-through mb-1">
                        {formatPrice(deal.originalPrice)}
                      </div>
                      <div className="text-xl font-bold text-red-600 mb-1">
                        {formatPrice(deal.salePrice)}
                      </div>
                      <div className="text-xs text-gray-500">/ người</div>
                    </div>

                    {/* Deal Info */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-yellow-800">
                          Mã: {deal.dealCode}
                        </span>
                        <span className="text-yellow-600">
                          Còn {deal.availableSeats} chỗ
                        </span>
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">
                        Hết hạn: {formatDate(deal.validUntil)}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2">
                      Đặt ngay với giá ưu đãi
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default DealsPage;
