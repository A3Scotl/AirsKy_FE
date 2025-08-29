import { useState, useEffect } from "react";
import SEO from "@/components/common/seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
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
import { dealApi } from "@/apis/deal-api";

import { Autoplay } from "swiper/modules";
import "swiper/css";

const DealsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // Có thể mở rộng nếu API có category
  const [sortBy, setSortBy] = useState("discount"); // Các tùy chọn: discount, expiry, usage
  const [currentPage, setCurrentPage] = useState(1);

  const [flightDeals, setFlightDeals] = useState([]);
  const [featuredDeals, setFeaturedDeals] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [flightLoading, setFlightLoading] = useState(true);

  const itemsPerPage = 8;

  useEffect(() => {
    const fetchFlightDeals = async () => {
      setFlightLoading(true);
      const res = await dealApi.getActiveDeals({
        page: 0,
        size: 100,
        sort: "createdAt,desc",
      });
      if (res.success && res.data && res.data.content) {
        const deals = res.data.content;
        setFlightDeals(deals);

        // Lọc 3 voucher
        const sortedForFeatured = [...deals].sort((a, b) => {
          const dateDiff = new Date(a.validTo) - new Date(b.validTo);
          if (dateDiff !== 0) return dateDiff; // Ưu tiên ngày hết hạn gần nhất
          return a.remainingUsage - b.remainingUsage; // Sau đó lượt sử dụng còn lại thấp nhất
        });
        setFeaturedDeals(sortedForFeatured.slice(0, 3));
      } else {
        setFlightDeals([]);
        setFeaturedDeals([]);
      }
      setFlightLoading(false);
    };
    fetchFlightDeals();
  }, []);

  useEffect(() => {
    // Áp dụng filter và sort cho toàn bộ deals
    let filtered = flightDeals.filter((deal) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        deal.title.toLowerCase().includes(searchLower) ||
        deal.dealCode.toLowerCase().includes(searchLower) ||
        deal.description.toLowerCase().includes(searchLower)
      );
    });

    // Nếu có filterType khác "all", có thể mở rộng (giả sử API có category, hiện tại bỏ qua)
    if (filterType !== "all") {
      // filtered = filtered.filter(deal => deal.category === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "discount") {
        return b.discountPercentage - a.discountPercentage; // Giảm dần
      } else if (sortBy === "expiry") {
        return new Date(a.validTo) - new Date(b.validTo); // Gần hết hạn trước
      } else if (sortBy === "usage") {
        return a.remainingUsage - b.remainingUsage; // Remaining thấp trước (used nhiều)
      }
      return 0;
    });

    setFilteredDeals(filtered);
    setCurrentPage(1); // Reset page khi filter/sort thay đổi
  }, [flightDeals, searchTerm, filterType, sortBy]);

  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDeals = filteredDeals.slice(
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
    return diffDays > 0 ? diffDays : 0;
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
            {/* <div className="max-w-md relative flex w-full items-center">
              <input
                type="text"
                placeholder="Tìm kiếm mã giảm giá..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 py-3 rounded-xl border-0 bg-gray-50/55 text-white placeholder-gray-500 focus:ring-4 focus:ring-white/20 pr-12"
              />
              <Search className="text-white w-8 h-8 rounded-full absolute right-2 cursor-pointer" />
            </div> */}
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-6xl py-16">
          {/* Featured Deals Section - Sử dụng 3 deals filtered đặc biệt */}
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
              {flightLoading ? (
                <div className="col-span-3 text-center py-12 text-gray-500">
                  Đang tải ưu đãi...
                </div>
              ) : featuredDeals.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-gray-500">
                  Không có ưu đãi nào
                </div>
              ) : (
                featuredDeals.map((deal, index) => (
                  <Card
                    key={deal.dealId}
                    className={`relative overflow-hidden group hover:shadow-2xl transition-all duration-500 ${
                      index === 0 ? "lg:col-span-2 lg:row-span-2" : ""
                    }`}
                  >
                    {/* Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${deal.thumbnail})` }}
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
                            <Badge
                              variant="outline"
                              className="bg-white/20 text-white border-white/30"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              Còn {getDaysRemaining(deal.validTo)} ngày
                            </Badge>
                          </div>
                          <div className="bg-yellow-400 text-black px-3 py-1 rounded-full font-bold text-lg">
                            -{deal.discountPercentage}%
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
                              {deal.dealCode}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(deal.dealCode)}
                            className="text-white/80 hover:text-white text-sm underline"
                          >
                            Sao chép
                          </button>
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="flex items-center justify-between">
                        <div className="text-white/80 text-sm">
                          Áp dụng đơn từ{" "}
                          {deal.minimumOrderAmount
                            ? formatPrice(deal.minimumOrderAmount)
                            : "-"}
                        </div>
                        <Link to={`/deals/${deal.dealId}`}>
                          <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                            Chi tiết
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* All Discount Codes Modal Section - Sử dụng toàn bộ flightDeals */}
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

              <Sheet>
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
                      {flightDeals.map((deal) => (
                        <Card
                          key={deal.dealId}
                          className="p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-mono font-bold">
                              {deal.dealCode}
                            </div>
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                            >
                              -{deal.discountPercentage}%
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-2 text-sm">
                            {deal.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Hết hạn: {formatDate(deal.validTo)}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(deal.dealCode)}
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

            {/* Quick preview of discount codes - Sử dụng Swiper với toàn bộ flightDeals */}
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
              {flightDeals.map((deal, index) => (
                <SwiperSlide
                  key={index}
                  className="p-4 hover:shadow-md transition-shadow border-1 border-gray-200 rounded-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-mono font-bold">
                      {deal.dealCode}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600"
                    >
                      -{deal.discountPercentage}%
                    </Badge>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2 text-sm">
                    {deal.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-300">
                      Hết hạn: {formatDate(deal.validTo)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(deal.dealCode)}
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

          {/* Flight Deals Section - Sử dụng paginated filteredDeals */}
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

              <div className="flex gap-2 flex-wrap">
                {/* Filter Controls - Bổ sung phần lọc */}
                <section className="mb-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <label className="text-gray-700 dark:text-gray-300 font-medium">
                        Sắp xếp theo:
                      </label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-48 h-10 bg-white dark:bg-gray-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discount">
                            Giảm giá cao nhất
                          </SelectItem>
                          <SelectItem value="expiry">
                            Hết hạn sớm nhất
                          </SelectItem>
                          <SelectItem value="usage">
                            Sử dụng nhiều nhất
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Nếu API có category, có thể thêm filterType select ở đây */}
                  </div>
                </section>
                <Link to="/flights">
                  <Button variant="outline" className="font-semibold">
                    Xem thêm
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {flightLoading ? (
                <div className="col-span-4 text-center py-12 text-gray-500">
                  Đang tải ưu đãi chuyến bay...
                </div>
              ) : paginatedDeals.length === 0 ? (
                <div className="col-span-4 text-center py-12 text-gray-500">
                  Không có ưu đãi chuyến bay nào
                </div>
              ) : (
                paginatedDeals.map((deal) => (
                  <Card
                    key={deal.dealId}
                    className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 shadow-lg"
                    style={{
                      backgroundImage: `url(${deal.thumbnail})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      minHeight: 350, // hoặc chiều cao bạn muốn
                    }}
                  >
                    <div className="absolute inset-0 bg-black/70 bg-opacity-40 z-9"></div>
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full font-bold text-xs z-10">
                      -{deal.discountPercentage}%
                    </div>
                    <div className="absolute bottom-0 left-0 w-full z-99">
                      {/* Discount Badge */}

                      <div className="p-4">
                        {/* Route */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">
                              {deal.departureAirportCode || "FRO"}
                            </div>
                          </div>
                          <div className="flex-1 mx-3 relative">
                            <div className="h-px bg-gray-300"></div>
                            <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 bg-white rounded-full dark:bg-gray-900" />
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">
                              {deal.arrivalAirportCode || "TO"}
                            </div>
                          </div>
                        </div>
                        <div className="text-center text-gray-600 mb-3 text-sm">
                          {deal.departureAirportName && deal.arrivalAirportName
                            ? `${deal.departureAirportName || "FRO"} → ${
                                deal.arrivalAirportName || "TO"
                              }`
                            : ""}
                        </div>

                        {/* Deal Info */}
                        <div className="bg-yellow-50/60 rounded-lg p-2 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-yellow-800">
                              Mã: {deal.dealCode}
                            </span>
                            <span className="text-yellow-600">
                              {deal.remainingUsage !== undefined
                                ? `Còn ${deal.remainingUsage} lượt`
                                : null}
                            </span>
                          </div>
                          <div className="text-xs text-yellow-600 mt-1">
                            Hết hạn:{" "}
                            {deal.validTo ? formatDate(deal.validTo) : "-"}
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2">
                          Đặt ngay với giá ưu đãi
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 mt-8">
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
