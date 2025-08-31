import { SearchForm } from "@/components/common/search-form";
import { FeaturesSection } from "@/components/section/home/features-section";
import { DestinationSection } from "@/components/section/home/destination-section";
import { ReviewsSection } from "@/components/section/home/reviews-section";
import SuggestionSection from "@/components/section/flight/suggestion-section";
import SEO from "@/components/common/seo";
import ChatbotWidget from "@/components/common/chatbot-widget";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { useNavigate } from "react-router-dom";
import { useSearch } from "@/contexts/search-context";

function HomePage() {
  const navigate = useNavigate();
  const { updateSearchCriteria } = useSearch();

  // Handle search from homepage
  const handleHomeSearch = (criteria) => {
    // Update context with search criteria
    updateSearchCriteria(criteria);

    // Also use URL params as backup
    const params = new URLSearchParams();

    if (criteria.from && typeof criteria.from === "object") {
      params.append(
        "from",
        `${criteria.from.city} (${criteria.from.airportCode})`
      );
    } else if (criteria.from) {
      params.append("from", criteria.from);
    }

    if (criteria.to && typeof criteria.to === "object") {
      params.append("to", `${criteria.to.city} (${criteria.to.airportCode})`);
    } else if (criteria.to) {
      params.append("to", criteria.to);
    }

    if (criteria.departDate) {
      params.append("departDate", criteria.departDate.toISOString());
    }

    if (criteria.returnDate) {
      params.append("returnDate", criteria.returnDate.toISOString());
    }

    params.append("tripType", criteria.tripType || "oneway");
    params.append(
      "passengers",
      JSON.stringify(
        criteria.passengers || { adults: 1, children: 0, infants: 0 }
      )
    );

    // Navigate with query params
    navigate(`/flights?${params.toString()}`);
  };

  // Airlines data
  const airlines = [
    {
      name: "Emirates",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Emirates_logo.svg/2560px-Emirates_logo.svg.png",
      description: "Premium international flights",
    },
    {
      name: "VietJet Air",
      logo: "https://upload.wikimedia.org/wikipedia/commons/8/8d/VietJet_Air_logo.png",
      description: "Budget-friendly domestic & international",
    },
    {
      name: "Vietnam Airlines",
      logo: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b6/Vietnam_Airlines_logo_2015.svg/375px-Vietnam_Airlines_logo_2015.svg.png",
      description: "National flag carrier of Vietnam",
    },
    {
      name: "Qatar Airways",
      logo: "https://upload.wikimedia.org/wikipedia/en/thumb/9/9b/Qatar_Airways_Logo.svg/375px-Qatar_Airways_Logo.svg.png",
      description: "Award-winning airline",
    },
    {
      name: "Singapore Airlines",
      logo: "https://upload.wikimedia.org/wikipedia/en/thumb/6/6b/Singapore_Airlines_Logo_2.svg/330px-Singapore_Airlines_Logo_2.svg.png",
      description: "World's best airline",
    },
    {
      name: "Turkish Airlines",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Turkish_Airlines_logo_2019_compact.svg/2560px-Turkish_Airlines_logo_2019_compact.svg.png",
      description: "Connecting Europe, Asia & Africa",
    },
    {
      name: "Thailand Airlines",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Turkish_Airlines_logo_2019_compact.svg/2560px-Turkish_Airlines_logo_2019_compact.svg.png",
      description: "Connecting Europe, Asia & Africa",
    },
  ];

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
            loop={true}
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
            {airlines.map((airline, index) => (
              <SwiperSlide key={index}>
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
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
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
      <div className="">
        <ChatbotWidget />
      </div>
    </>
  );
}

export default HomePage;
