"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { countryService } from "@/services/country-service";
import { flightApi } from "@/apis/flight-api";
import { Loader2 } from "lucide-react";

export function DestinationSection() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDestinations();
  }, []);

  const handleDestinationClick = (destination) => {
    console.log("🚀 Destination clicked:", destination.country);
    console.log("📋 Flights data to send:", destination.flights);
    console.log("🧭 Navigating to: /flights");

    navigate("/flights", {
      state: {
        flightsData: destination.flights,
      },
    });
  };

  const loadDestinations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy danh sách quốc gia đang active từ API
      const countries = await countryService.getActiveCountries();

      // Lọc bỏ Việt Nam (không cắt số lượng)
      const filteredCountries = countries.filter(
        (country) => country.countryName !== "Việt Nam"
      );

      // Gọi API để lấy giá thấp nhất cho mỗi quốc gia
      const destinationsWithPrices = [];

      for (const country of filteredCountries) {
        try {
          const response = await flightApi.findFlightsBetweenCountries(
            "Việt Nam",
            country.countryName
          );

          if (
            response.success &&
            response.data &&
            response.data?.content.length > 0
          ) {
            // Lọc chỉ lấy chuyến bay còn hoạt động (cách hiện tại ít nhất 24 giờ)
            const now = new Date();
            const minBookingLeadTime = 24 * 60 * 60 * 1000; // 24 giờ

            const activeFlights = response.data.content.filter((flight) => {
              try {
                // Xử lý departureTime - có thể là ISO string hoặc date + time
                let departureDateTime;
                if (
                  flight.departureTime &&
                  flight.departureTime.includes("T")
                ) {
                  // ISO string format: "2025-10-31T06:00:00"
                  departureDateTime = new Date(flight.departureTime);
                } else if (flight.departureDate && flight.departureTime) {
                  // Legacy format: separate date and time
                  departureDateTime = new Date(
                    `${flight.departureDate} ${flight.departureTime}`
                  );
                } else {
                  return false; // Invalid datetime format
                }

                // Chỉ lấy chuyến bay có thời gian khởi hành cách hiện tại ít nhất 24 giờ
                return (
                  departureDateTime.getTime() - now.getTime() >=
                  minBookingLeadTime
                );
              } catch (error) {
                console.warn("Error parsing flight datetime:", flight, error);
                return false;
              }
            });

            // Nếu không có chuyến bay hoạt động, bỏ qua quốc gia này
            if (activeFlights.length === 0) {
              continue;
            }

            // ✅ CẬP NHẬT: Lấy giá thấp nhất từ price trong flightTravelClasses
            const flightPrices = activeFlights
              .map((flight) => {
                // Lấy tất cả price từ flightTravelClasses
                const prices =
                  flight.flightTravelClasses?.map(
                    (ftc) => ftc.price || ftc.basePrice
                  ) || [];

                // Trả về giá thấp nhất của chuyến bay này
                return prices.length > 0 ? Math.min(...prices) : Infinity;
              })
              .filter((price) => price !== Infinity && price > 0); // Loại bỏ các chuyến bay không có giá

            // Nếu không có chuyến bay nào có giá, bỏ qua quốc gia này
            if (flightPrices.length === 0) {
              continue;
            }

            // Lấy giá thấp nhất trong tất cả chuyến bay của quốc gia này
            const minPrice = Math.min(...flightPrices);

            // Format giá thành chuỗi VNĐ
            const formattedPrice = new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(minPrice);

            destinationsWithPrices.push({
              id: country.countryId,
              country: country.countryName,
              countryCode: country.countryCode,
              image: country.thumbnail,
              price: formattedPrice,
              flightCount: activeFlights.length, // Số chuyến bay còn hoạt động
              departureAirport: activeFlights[0].departureAirport,
              arrivalAirport: activeFlights[0].arrivalAirport,
              flights: activeFlights, // Chỉ lưu các chuyến bay còn hoạt động
            });

            // Cập nhật state ngay lập tức khi có data cho quốc gia này
            setDestinations([...destinationsWithPrices]);
          }
          // Nếu không có chuyến bay, bỏ qua (không thêm vào danh sách)
        } catch (err) {
          console.error(
            `Error fetching flights for ${country.countryName}:`,
            err
          );
          // Bỏ qua nếu có lỗi
        }
      }
    } catch (err) {
      console.error("Error loading destinations:", err);
      setError("Không thể tải danh sách điểm đến");
    } finally {
      setLoading(false);
    }
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
          {destinations.length > 0 ? (
            destinations.map((destination) => (
              <SwiperSlide key={destination.id || destination.countryCode}>
                <Card
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleDestinationClick(destination)}
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
                    <span>Có {destination.flightCount} chuyến bay</span>
                  </CardContent>
                </Card>
              </SwiperSlide>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Không có chuyến bay nào được tìm thấy.
              </p>
            </div>
          )}
        </Swiper>

        {/* Custom pagination container */}
        <div className="swiper-pagination-custom flex space-x-2 justify-center m-auto mt-6 w-full"></div>
      </div>
    </section>
  );
}
