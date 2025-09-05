import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import {
  ChevronLeft,
  ChevronRight,
  Plane,
  Star,
  Tag,
  Calendar,
  MapPin,
} from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useState, useEffect } from "react";
import { dealApi } from "@/apis/deal-api";
import { Link } from "react-router-dom";

// Format currency function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date function
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function DealsSection() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        const response = await dealApi.getActiveDeals({ size: 50 }); // Tăng size để có nhiều data hơn
        if (response.success) {
          // Lọc chỉ lấy những deal có tuyến bay cụ thể
          const dealsWithRoutes = (
            response.data.content ||
            response.data ||
            []
          ).filter(
            (deal) => deal.departureAirportName && deal.arrivalAirportName
          );
          setDeals(dealsWithRoutes);
        } else {
          setError(response.message || "Không thể tải dữ liệu ưu đãi");
        }
      } catch (err) {
        console.error("Error fetching deals:", err);
        setError("Lỗi kết nối mạng");
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  if (loading) {
    return (
      <section className="pb-8 pt-28 max-w-7xl mx-auto px-4 sm:px-20 lg:px-20">
        <div className="mt-24">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Ưu Đãi Chuyến Bay Hot
            </h2>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Đang tải ưu đãi...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="pb-8 pt-28 max-w-7xl mx-auto px-4 sm:px-20 lg:px-20">
        <div className="mt-24">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Ưu Đãi Chuyến Bay Hot
            </h2>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="text-red-500 text-center">
              <p className="text-lg font-semibold">Không thể tải ưu đãi</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!deals || deals.length === 0) {
    return (
      <section className="pb-8 pt-28 max-w-7xl mx-auto px-4 sm:px-20 lg:px-20">
        <div className="mt-24">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Ưu Đãi Chuyến Bay Hot
            </h2>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500 text-center">
              <p className="text-lg font-semibold">Không có ưu đãi nào</p>
              <p className="text-sm mt-2">Vui lòng quay lại sau</p>
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="pb-8 pt-28 max-w-7xl mx-auto px-4 sm:px-20 lg:px-20">
      <div className="mt-24">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Ưu Đãi Chuyến Bay Hot
          </h2>
          <Link
            to="/deals"
            className="text-gray-600 hover:text-blue-600 cursor-pointer"
          >
            Xem tất cả
          </Link>
        </div>

        <div className="relative">
          {/* Navigation Buttons */}
          <div className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 shadow-lg rounded-full p-3 cursor-pointer hover:bg-blue-50 transition-colors">
            <ChevronLeft className="w-6 h-6 text-blue-600" />
          </div>
          <div className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 cursor-pointer hover:bg-blue-50 transition-colors">
            <ChevronRight className="w-6 h-6 text-blue-600" />
          </div>

          <Swiper
            modules={[Navigation, Autoplay, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            navigation={{
              prevEl: ".swiper-button-prev-custom",
              nextEl: ".swiper-button-next-custom",
            }}
            pagination={{
              clickable: true,
              bulletClass: "swiper-pagination-bullet !bg-blue-500",
              bulletActiveClass: "swiper-pagination-bullet-active !bg-blue-600",
            }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="px-12 bg-none"
          >
            {deals.map((deal) => (
              <SwiperSlide key={deal.dealId}>
                <div className="relative shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-visible ticket-card ">
                  <div className="bg-white dark:bg-gray-300 rounded-t-[2rem] rounded-b-[2rem] overflow-hidden relative">
                    {/* Side notches */}
                    <div className="absolute left-0 top-1/2 w-6 h-6 bg-gray-50 dark:bg-gray-700 rounded-full transform -translate-x-3 -translate-y-1/2 z-20"></div>
                    <div className="absolute right-0 top-1/2 w-6 h-6  dark:bg-gray-700 rounded-full transform translate-x-3 -translate-y-1/2 z-20"></div>

                    {/* Discount Badge */}
                    <div className="absolute top-4 left-4 z-30">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        -{deal.discountPercentage}%
                      </span>
                    </div>

                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-white rounded-lg p-2 flex items-center justify-center">
                            {deal.thumbnail ? (
                              <img
                                src={deal.thumbnail}
                                alt={deal.title}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Tag className="w-6 h-6 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{deal.title}</h3>
                            <div className="flex items-center space-x-1">
                              <Tag className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm font-mono bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                {deal.dealCode}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm opacity-90">
                            Còn {deal.remainingUsage} lượt
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deal Info */}
                    <div className="p-6">
                      {/* Route */}
                      {deal.departureAirportName && deal.arrivalAirportName && (
                        <div className="flex items-center justify-center mb-8">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">
                              {deal.departureAirportCode}
                            </div>
                            <div className="text-sm text-gray-500">
                              {deal.departureAirportName}
                            </div>
                          </div>
                          <div className="flex-1 flex items-center justify-center mx-4 relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full h-0.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400"></div>
                            </div>
                            <div className="w-3 h-3 bg-blue-500 rounded-full z-10 absolute left-0"></div>
                            <div className="bg-white border-2 border-blue-500 rounded-full p-2 z-10 shadow-sm">
                              <Plane className="w-4 h-4 text-blue-500 transform rotate-45" />
                            </div>
                            <div className="w-3 h-3 bg-blue-500 rounded-full z-10 absolute right-0"></div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">
                              {deal.arrivalAirportCode}
                            </div>
                            <div className="text-sm text-gray-500">
                              {deal.arrivalAirportName}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Divider */}
                      <div className="border-t-2 border-dashed border-gray-300 my-4 mx-6 relative">
                        <div className="absolute left-0 top-0 w-4 h-4 bg-gray-50 rounded-full transform -translate-x-8 -translate-y-2"></div>
                        <div className="absolute right-0 top-0 w-4 h-4 bg-gray-50 rounded-full transform translate-x-8 -translate-y-2"></div>
                      </div>

                      {/* Deal Details */}
                      <div className="pt-4">
                        <div className="space-y-3 mb-4">
                          {deal.minimumOrderAmount && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                Đơn tối thiểu:
                              </span>
                              <span className="font-semibold">
                                {formatCurrency(deal.minimumOrderAmount)}
                              </span>
                            </div>
                          )}
                          {deal.maxDiscountAmount && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                Giảm tối đa:
                              </span>
                              <span className="font-semibold text-red-600">
                                {formatCurrency(deal.maxDiscountAmount)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Hết hạn:
                            </span>
                            <span className="font-semibold text-orange-600">
                              {formatDate(deal.validTo)}
                            </span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex items-center justify-center">
                          <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                            Sao chép mã: {deal.dealCode}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
