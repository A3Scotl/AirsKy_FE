import { SearchForm } from "@/components/common/search-form";
import { FeaturesSection } from "@/components/section/home/features-section";
import { DestinationSection } from "@/components/section/home/destination-section";
import { ReviewsSection } from "@/components/section/home/reviews-section";
import SuggestionSection from "@/components/section/home/suggestion-section";
import SEO from "@/components/common/seo";
import ChatbotWidget from "@/components/common/chatbot-widget";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { useNavigate } from "react-router-dom";
import { useSearch } from "@/contexts/search-context";
import { useState, useEffect } from "react";
import { airlineApi } from "@/apis/airline-api";

function HomePage() {
  const navigate = useNavigate();
  const { updateSearchCriteria } = useSearch();

  // Airlines state
  const [airlines, setAirlines] = useState([]);
  const [airlinesLoading, setAirlinesLoading] = useState(true);
  const [airlinesError, setAirlinesError] = useState(null);

  // Handle search from homepage
  const handleHomeSearch = (criteria) => {
    console.log("🏠 Home search criteria:", criteria);

    // Update context with search criteria (keep original object format)
    updateSearchCriteria(criteria);

    // Also use URL params as backup
    const params = new URLSearchParams();

    if (
      criteria.from &&
      typeof criteria.from === "object" &&
      !Array.isArray(criteria.from) &&
      criteria.from.city &&
      criteria.from.airportCode
    ) {
      params.append(
        "from",
        `${criteria.from.city} (${criteria.from.airportCode})`
      );
    } else if (criteria.from && !Array.isArray(criteria.from)) {
      params.append("from", criteria.from);
    }

    if (
      criteria.to &&
      typeof criteria.to === "object" &&
      !Array.isArray(criteria.to) &&
      criteria.to.city &&
      criteria.to.airportCode
    ) {
      params.append("to", `${criteria.to.city} (${criteria.to.airportCode})`);
    } else if (criteria.to && !Array.isArray(criteria.to)) {
      params.append("to", criteria.to);
    }

    if (criteria.departDate) {
      // Use local date to avoid timezone conversion issues
      const localDate = new Date(criteria.departDate);
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, "0");
      const day = String(localDate.getDate()).padStart(2, "0");
      const localDateString = `${year}-${month}-${day}`;
      params.append("departDate", localDateString);
    }

    if (criteria.returnDate) {
      // Use local date to avoid timezone conversion issues
      const localDate = new Date(criteria.returnDate);
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, "0");
      const day = String(localDate.getDate()).padStart(2, "0");
      const localDateString = `${year}-${month}-${day}`;
      params.append("returnDate", localDateString);
    }

    params.append("tripType", criteria.tripType || "oneway");
    params.append(
      "passengers",
      JSON.stringify(
        criteria.passengers || { adults: 1, children: 0, infants: 0 }
      )
    );

    console.log("🏠 Home search URL params:", params.toString());

    // Navigate with query params
    navigate(`/flights?${params.toString()}`);
  };

  // Fetch airlines data
  useEffect(() => {
    const fetchAirlines = async () => {
      try {
        setAirlinesLoading(true);
        setAirlinesError(null);

        const result = await airlineApi.getAllAirlines({
          page: 0,
          size: 50, // Lấy nhiều airlines để hiển thị
          sort: "airlineName,asc",
        });

        if (result.success && result.data) {
          // Map API response to component format
          const mappedAirlines =
            result.data.content
              ?.filter((airline) => airline.active)
              .map((airline) => ({
                name: airline.airlineName,
                logo: airline.thumbnail || "/default-airline-logo.svg", // Fallback logo
                description: `Mã hãng: ${airline.airlineCode}${
                  airline.contact ? ` - Liên hệ: ${airline.contact}` : ""
                }`,
                airlineId: airline.airlineId,
                airlineCode: airline.airlineCode,
                active: airline.active,
              })) || [];

          setAirlines(mappedAirlines);
        } else {
          setAirlinesError(
            result.message || "Không thể tải danh sách hãng hàng không"
          );
        }
      } catch (error) {
        console.error("Error fetching airlines:", error);
        setAirlinesError("Có lỗi xảy ra khi tải danh sách hãng hàng không");
      } finally {
        setAirlinesLoading(false);
      }
    };

    fetchAirlines();
  }, []);

  return (
    <>
      <SEO
        title="Trang chủ"
        description="AirSky - Nền tảng đặt vé máy bay trực tuyến hàng đầu. Tìm kiếm và so sánh giá vé từ hàng trăm hãng hàng không với giá tốt nhất."
        keywords="đặt vé máy bay, vé máy bay giá rẻ, so sánh giá vé máy bay, du lịch, AirSky"
      />
      <div className="bg-white dark:bg-gray-900 overflow-hidden pt-0">
        {/* Hero Section with Search Form */}
        <section className="relative bg-gradient-to-br from-[#2563eb] to-[#1e40af] text-white min-h-[100vh] flex items-center">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://plus.unsplash.com/premium_photo-1661962354730-cda54fa4f9f1?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          ></div>
          <div className="absolute inset-0 bg-black/60"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Tìm chuyến bay hoàn hảo của bạn
              </h1>
              <p className="text-xl md:text-2xl text-blue-300 max-w-3xl mx-auto mb-4">
                So sánh và đặt vé máy bay với giá không thể tốt hơn từ các hãng
                hàng không uy tín trong nước và trên toàn thế giới
              </p>
            </div>

            <SearchForm onSearch={handleHomeSearch} />
          </div>
        </section>

        <section className="py-16 bg-gradient-to-t from-blue-100 to-white dark:from-gray-600 dark:to-gray-800">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              Được tin cậy bởi các hãng hàng không hàng đầu
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Hợp tác với các hãng hàng không hàng đầu cho hành trình hoàn hảo
              của bạn
            </p>
          </div>

          <Swiper
            modules={[Autoplay]}
            spaceBetween={30}
            slidesPerView={5}
            loop={false} // Disable loop to avoid warning
            autoplay={{
              delay: 2000,
              disableOnInteraction: false,
            }}
            breakpoints={{
              320: { slidesPerView: 2 },
              640: { slidesPerView: 3 },
              768: { slidesPerView: 4 },
              1024: { slidesPerView: 6 },
            }}
            className="airlines-slider"
          >
            {(airlinesLoading ? [] : airlines.length > 0 ? airlines : []).map(
              (airline, index) => (
                <SwiperSlide key={airline.airlineId || index}>
                  <div className="p-4 transition-all duration-300 group cursor-pointer">
                    <div className="text-center">
                      <div className="h-16 flex items-center justify-center mb-3">
                        <img
                          src={airline.logo}
                          alt={airline.name}
                          className="h-full w-auto max-w-[120px] object-contain group-hover:scale-110 transition-transform duration-300 filter grayscale hover:grayscale-0"
                          style={{
                            filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))",
                          }}
                        />
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {airline.name}
                      </h4>
                    </div>
                  </div>
                </SwiperSlide>
              )
            )}
          </Swiper>

          {airlinesError && (
            <div className="text-center mt-4">
              <p className="text-sm text-red-600 dark:text-red-400">
                {airlinesError}
              </p>
            </div>
          )}
        </section>

        {/* Destinations Section */}
        <DestinationSection />

        <div className="">
          <SuggestionSection />
        </div>

        <FeaturesSection />

        {/* Reviews Section */}
        {/* <ReviewsSection /> */}
      </div>

      {/* Chatbot Widget */}
      <div>
        <ChatbotWidget />
      </div>
    </>
  );
}

export default HomePage;
