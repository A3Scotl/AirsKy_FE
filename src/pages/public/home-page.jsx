"use client";

import { SearchForm } from "@/components/common/search-form";
import { FeaturesSection } from "@/components/section/home/features-section";
import { DestinationSection } from "@/components/section/home/destination-section";
import SuggestionSection from "@/components/section/home/suggestion-section";
import SEO from "@/components/common/seo";
import ChatbotWidget from "@/components/common/chatbot-widget";
import BlogSection from "@/components/section/home/blog-section";
import FAQSection from "@/components/section/home/faq-section";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Parallax, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "@/styles/swiper-parallax.css";
import { useNavigate } from "react-router-dom";
import { useSearch } from "@/contexts/search-context";
import { useState, useEffect, useCallback } from "react";
import { airlineApi } from "@/apis/airline-api";

// Define hero slide data for better maintainability
const heroSlides = [
  {
    bgImage:
      "https://plus.unsplash.com/premium_photo-1679758629394-606fb157a7cc?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Đặt Vé Máy Bay Cực Dễ Dàng",
    subtitle: "Sắp xếp hành trình của bạn chỉ trong vài phút. Tìm kiếm, so sánh và đặt vé máy bay với giá tốt nhất, mọi lúc, mọi nơi.",
  },
  {
    bgImage:
      "https://plus.unsplash.com/premium_photo-1679758629516-6fe7a51fad5c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D",
    title: "Hành Trình Bất Tận - Vé Máy Bay Trực Tuyến",
    subtitle: "Bắt đầu chuyến phiêu lưu của bạn ngay từ bây giờ. Với giao diện thân thiện, dễ sử dụng, việc đặt vé máy bay chưa bao giờ nhanh chóng và tiện lợi đến thế.",
  },
  {
    bgImage:
      "https://plus.unsplash.com/premium_photo-1661963039521-84141380d85f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDE2fHx8ZW58MHx8fHx8",
    title: "Cổng Kết Nối Bầu Trời",
    subtitle: "Mọi chuyến bay, mọi điểm đến, trong tầm tay bạn. Chúng tôi mang đến cho bạn trải nghiệm đặt vé trực tuyến liền mạch, an toàn và đáng tin cậy.",
  },
];

function HomePage() {
  const navigate = useNavigate();
  const { updateSearchCriteria } = useSearch();

  // Airlines state
  const [airlines, setAirlines] = useState([]);
  const [airlinesLoading, setAirlinesLoading] = useState(true);
  const [airlinesError, setAirlinesError] = useState(null);

  // Memoized function to format date as YYYY-MM-DD
  const formatDate = useCallback((date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Handle search from homepage (optimized with memoized date formatting)
  const handleHomeSearch = useCallback(
    (criteria) => {
      console.log("🏠 Home search criteria:", criteria);

      // Update context with search criteria
      updateSearchCriteria(criteria);

      // Build URL params
      const params = new URLSearchParams();

      // Handle 'from' field
      if (criteria.from) {
        if (
          typeof criteria.from === "object" &&
          criteria.from.city &&
          criteria.from.airportCode
        ) {
          params.append(
            "from",
            `${criteria.from.city} (${criteria.from.airportCode})`
          );
        } else {
          params.append("from", criteria.from);
        }
      }

      // Handle 'to' field
      if (criteria.to) {
        if (
          typeof criteria.to === "object" &&
          criteria.to.city &&
          criteria.to.airportCode
        ) {
          params.append(
            "to",
            `${criteria.to.city} (${criteria.to.airportCode})`
          );
        } else {
          params.append("to", criteria.to);
        }
      }

      // Handle dates
      if (criteria.departDate) {
        params.append("departDate", formatDate(criteria.departDate));
      }
      if (criteria.returnDate) {
        params.append("returnDate", formatDate(criteria.returnDate));
      }

      // Handle trip type and passengers
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
    },
    [navigate, updateSearchCriteria, formatDate]
  );

  // Fetch airlines data (unchanged, but added useCallback for consistency)
  useEffect(() => {
    const fetchAirlines = async () => {
      try {
        setAirlinesLoading(true);
        setAirlinesError(null);

        const result = await airlineApi.getAllAirlines({
          page: 0,
          size: 50,
          sort: "airlineName,asc",
        });

        if (result.success && result.data) {
          const mappedAirlines =
            result.data.content
              ?.filter((airline) => airline.active)
              .map((airline) => ({
                name: airline.airlineName,
                logo: airline.thumbnail || "/default-airline-logo.svg",
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
      <div className="overflow-hidden pt-0">
        {/* Hero Section with Search Form - Fixed Parallax Swiper */}
        <section className="realative text-white min-h-[100vh] overflow-hidden">
          <Swiper
            speed={600}
            parallax={true}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            loop={true}
            modules={[Parallax, Pagination, Navigation, Autoplay]}
            className="hero-swiper"
          >
            {heroSlides.map((slide, index) => (
              <SwiperSlide key={index}>
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${slide.bgImage})`,
                    transform: "translate3d(0, 0, 0)", // Force hardware acceleration
                  }}
                />
                {/* Parallax content overlay */}
                <div className="absolute inset-0 flex top-40 justify-center z-20">
                  <div className="text-center text-white px-4">
                    <h2
                      className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 opacity-90 drop-shadow-lg"
                      data-swiper-parallax="-300"
                    >
                      {slide.title}
                    </h2>
                    <p
                      className="text-lg md:text-xl lg:text-2xl opacity-75 drop-shadow-md"
                      data-swiper-parallax="-200"
                    >
                      {slide.subtitle}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="absolute inset-0 mx-auto px-4 sm:px-6 lg:px-8 top-[45%] w-full z-99">
            <div
              data-swiper-parallax="0"
              className="relative z-10 max-w-6xl mx-auto"
            >
              <div className="search-form-overlay">
                <SearchForm onSearch={handleHomeSearch} />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-t from-blue-100 to-white dark:from-gray-600 dark:to-gray-800 h-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              Được tin cậy bởi các hãng hàng không hàng đầu
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Hợp tác với các hãng hàng không hàng đầu cho hành trình hoàn hảo
              của bạn
            </p>
          </div>

          {airlinesError ? (
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">
                {airlinesError}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <Swiper
              modules={[Autoplay]}
              spaceBetween={30}
              slidesPerView={5}
              loop={airlines.length > 6}
              autoplay={{
                delay: 2000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              breakpoints={{
                320: { slidesPerView: 2 },
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 6 },
              }}
              className="airlines-slider"
            >
              {airlinesLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <SwiperSlide key={`loading-${index}`}>
                      <div className="p-4">
                        <div className="animate-pulse h-16 bg-gray-300 rounded mb-3" />
                        <div className="animate-pulse h-4 bg-gray-300 rounded" />
                      </div>
                    </SwiperSlide>
                  ))
                : airlines.map((airline) => (
                    <SwiperSlide key={airline.airlineId}>
                      <div className="p-4 transition-all duration-300 group cursor-pointer">
                        <div className="text-center">
                          <div className="h-16 flex items-center justify-center mb-3">
                            <img
                              src={airline.logo || "/placeholder.svg"}
                              alt={`${airline.name} logo`}
                              className="h-full w-auto max-w-[120px] object-contain group-hover:scale-110 transition-transform duration-300 filter grayscale hover:grayscale-0"
                              style={{
                                filter:
                                  "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))",
                              }}
                              onError={(e) => {
                                e.target.src = "/abstract-airline-logo.png";
                              }}
                            />
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {airline.name}
                          </h4>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
            </Swiper>
          )}
        </section>

        <DestinationSection />

        <div className="">
          <SuggestionSection />
        </div>

        <FeaturesSection />

        <BlogSection />

        <FAQSection />

        {/* Reviews Section - Commented out as in original */}
        {/* <ReviewsSection /> */}
      </div>

      <ChatbotWidget />
    </>
  );
}

export default HomePage;
