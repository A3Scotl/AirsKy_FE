"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { countryService } from "@/services/country-service";
import { Loader2 } from "lucide-react";

export function DestinationSection() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDestinations();
  }, []);

  const handleDestinationClick = (countryName) => {
    // Tạo search criteria với from = "Việt Nam", to = country được click
    const searchCriteria = {
      from: "Việt Nam",
      to: countryName,
      tripType: "oneway",
      passengers: { adults: 1, children: 0, infants: 0 },
      searchCombinations: [], // Không cần combinations cho single search
    };

    console.log("🚀 Destination clicked:", countryName);
    console.log("📋 Search criteria to send:", searchCriteria);
    console.log("🧭 Navigating to: /flights");

    // Navigate đến result page với search criteria
    navigate("/flights", {
      state: { searchCriteria },
    });
  };

  const loadDestinations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy danh sách quốc gia đang active từ API
      const countries = await countryService.getActiveCountries();
      console.log("Active countries:", countries);

      // Chuyển đổi dữ liệu quốc gia thành format phù hợp với destination
      const formattedDestinations = countries
        .filter((country) => country.countryName !== "Việt Nam")
        .slice(0, 8)
        .map((country) => ({
          id: country.countryId,
          country: country.countryName,
          countryCode: country.countryCode,
          image: country.thumbnail,
          price: generateRandomPrice(),
        }));

      setDestinations(formattedDestinations);
    } catch (err) {
      console.error("Error loading destinations:", err);
      setError("Không thể tải danh sách điểm đến");
    } finally {
      setLoading(false);
    }
  };

  // Hàm tạo giá ngẫu nhiên cho demo
  const generateRandomPrice = () => {
    const prices = [
      "3.000.000 vnđ",
      "5.000.000 vnđ",
      "8.000.000 vnđ",
      "12.000.000 vnđ",
      "15.000.000 vnđ",
      "18.000.000 vnđ",
      "20.000.000 vnđ",
    ];
    return prices[Math.floor(Math.random() * prices.length)];
  };

  if (loading) {
    return (
      <section className="py-16 bg-[#f9fafb] dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#111827] dark:text-white mb-4">
              Những điểm đến quốc tế phổ biến
            </h2>
            <p className="text-lg text-[#6b7280] max-w-2xl mx-auto">
              Khám phá những địa điểm tuyệt vời trên khắp thế giới với những ưu
              đãi vé máy bay tốt nhất của chúng tôi
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
            <span className="ml-2 text-[#6b7280]">
              Đang tải danh sách điểm đến...
            </span>
          </div>
        </div>
      </section>
    );
  }

  if (error && destinations.length === 0) {
    return (
      <section className="py-16 bg-[#f9fafb] dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#111827] dark:text-white mb-4">
              Những điểm đến quốc tế phổ biến
            </h2>
            <p className="text-lg text-[#6b7280] max-w-2xl mx-auto">
              Khám phá những địa điểm tuyệt vời trên khắp thế giới với những ưu
              đãi vé máy bay tốt nhất của chúng tôi
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadDestinations}
              className="bg-[#2563eb] text-white px-4 py-2 rounded-lg hover:bg-[#1d4ed8] transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-[#f9fafb] dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#111827] dark:text-white mb-4">
            Những điểm đến quốc tế phổ biến
          </h2>
          <p className="text-lg text-[#6b7280] max-w-2xl mx-auto">
            Khám phá những địa điểm tuyệt vời trên khắp thế giới với những ưu
            đãi vé máy bay tốt nhất của chúng tôi
          </p>
        </div>

        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          pagination={{
            clickable: true,
            dynamicBullets: true,
            el: ".swiper-pagination-custom",
          }}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 4 },
          }}
        >
          {destinations.map((destination) => (
            <SwiperSlide key={destination.id || destination.countryCode}>
              <Card
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleDestinationClick(destination.country)}
              >
                <div className="relative">
                  <img
                    src={destination.image}
                    alt={`${destination.country}`}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <div className="absolute top-4 right-4 bg-[#2563eb] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Từ {destination.price}
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-xl font-semibold text-[#111827] dark:text-white mb-1">
                    {destination.country}
                  </p>
                </CardContent>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom pagination container */}
        <div className="swiper-pagination-custom flex space-x-2 justify-center m-auto mt-6 w-full"></div>
      </div>
    </section>
  );
}
