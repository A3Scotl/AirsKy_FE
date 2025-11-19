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
import { useCallback, useState, useRef, useEffect } from "react";

// Custom hook for intersection observer (lazy reveal on scroll)
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // One-time trigger
        }
      },
      { threshold: 0.1, ...options }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

// Define hero slide data for better maintainability
const heroSlides = [
  {
    bgImage:
      "https://plus.unsplash.com/premium_photo-1679758629394-606fb157a7cc?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Đặt Vé Máy Bay Cực Dễ Dàng",
    subtitle:
      "Sắp xếp hành trình của bạn chỉ trong vài phút. Tìm kiếm, so sánh và đặt vé máy bay với giá tốt nhất, mọi lúc, mọi nơi.",
  },
  {
    bgImage:
      "https://plus.unsplash.com/premium_photo-1679758629516-6fe7a51fad5c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D",
    title: "Hành Trình Bất Tận - Vé Máy Bay Trực Tuyến",
    subtitle:
      "Bắt đầu chuyến phiêu lưu của bạn ngay từ bây giờ. Với giao diện thân thiện, dễ sử dụng, việc đặt vé máy bay chưa bao giờ nhanh chóng và tiện lợi đến thế.",
  },
  {
    bgImage:
      "https://plus.unsplash.com/premium_photo-1661963039521-84141380d85f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDE2fHx8ZW58MHx8fHx8",
    title: "Cổng Kết Nối Bầu Trời",
    subtitle:
      "Mọi chuyến bay, mọi điểm đến, trong tầm tay bạn. Chúng tôi mang đến cho bạn trải nghiệm đặt vé trực tuyến liền mạch, an toàn và đáng tin cậy.",
  },
];

function HomePage() {
  const navigate = useNavigate();
  const { updateSearchCriteria } = useSearch();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Refs and inView states for sections
  const [destinationRef, destinationInView] = useInView({ threshold: 0.2 });
  const [suggestionRef, suggestionInView] = useInView({ threshold: 0.2 });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.2 });
  const [blogRef, blogInView] = useInView({ threshold: 0.2 });
  const [faqRef, faqInView] = useInView({ threshold: 0.2 });

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
      // Navigate with query params
      navigate(`/flights?${params.toString()}`);
    },
    [navigate, updateSearchCriteria, formatDate]
  );

  return (
    <>
      <SEO
        title="Đặt Vé Máy Bay Online Giá Rẻ - AirSky Việt Nam"
        description="AirSky - Nền tảng đặt vé máy bay trực tuyến hàng đầu Việt Nam. Đặt vé máy bay giá rẻ, so sánh giá vé từ 20+ hãng hàng không. Đảm bảo giá tốt nhất, thanh toán an toàn, hỗ trợ 24/7. Vietnam Airlines, Vietjet, Bamboo Airways."
        keywords="đặt vé máy bay, vé máy bay giá rẻ, vé máy bay online, so sánh giá vé máy bay, AirSky, du lịch Việt Nam, hàng không Việt Nam, Vietnam Airlines, Vietjet, Bamboo Airways, vé máy bay nội địa, vé máy bay quốc tế"
        url="https://airsky.online"
        image="https://airsky.online/images/og-homepage.jpg"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "AirSky",
          url: "https://airsky.online",
          description: "Nền tảng đặt vé máy bay trực tuyến hàng đầu Việt Nam",
          publisher: {
            "@type": "Organization",
            name: "AirSky",
            url: "https://airsky.online",
            logo: {
              "@type": "ImageObject",
              url: "https://airsky.online/images/logo.png",
            },
          },
          potentialAction: {
            "@type": "SearchAction",
            target: "https://airsky.online/flights?from={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <div className="pt-0">
        {/* Hero Section with Search Form - Fixed Parallax Swiper */}
        <section className="relative text-white min-h-[120vh] sm:min-h-[95vh] lg:min-h-[100vh]">
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
            className="hero-swiper h-auto"
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
                <div className="absolute inset-0 flex top-32 sm:top-40 justify-center z-20">
                  <div className="text-center text-white px-4 max-w-4xl mx-auto">
                    <h2
                      className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 sm:mb-4 opacity-90 drop-shadow-lg"
                      data-swiper-parallax="-300"
                    >
                      {slide.title}
                    </h2>
                    <p
                      className="text-sm sm:text-base md:text-lg lg:text-xl opacity-75 drop-shadow-md max-w-2xl mx-auto"
                      data-swiper-parallax="-200"
                    >
                      {slide.subtitle}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="absolute inset-0 mx-auto px-4 sm:px-6 lg:px-8 top-[10%] sm:top-[15%] lg:top-[50%] md:top-[50%] w-full z-[10]">
            <div
              data-swiper-parallax="0"
              className="relative z-[11] max-w-6xl mx-auto"
            >
              <div className="search-form-overlay">
                <SearchForm onSearch={handleHomeSearch} />
              </div>
            </div>
          </div>
        </section>

        <div
          className="mt-12 sm:mt-8 lg:mt-16"
          style={isMobile ? { marginTop: "24rem" } : {}}
          ref={destinationRef}
        >
          <DestinationSection
            className={destinationInView ? "animate-fadeInUp" : "opacity-0"}
          />
        </div>

        <div className="" ref={suggestionRef}>
          <SuggestionSection
            className={suggestionInView ? "animate-fadeInUp" : "opacity-0"}
          />
        </div>

        <div className="" ref={featuresRef}>
          <FeaturesSection
            className={featuresInView ? "animate-fadeInUp" : "opacity-0"}
          />
        </div>

        <div className="" ref={faqRef}>
          <FAQSection
            className={faqInView ? "animate-fadeInUp" : "opacity-0"}
          />
        </div>
        <div className="" ref={blogRef}>
          <BlogSection
            className={blogInView ? "animate-fadeInUp" : "opacity-0"}
          />
        </div>
      </div>

      <ChatbotWidget />
    </>
  );
}

export default HomePage;
