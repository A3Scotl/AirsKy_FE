import { SearchForm } from "@/components/common/search-form";
import { FeaturesSection } from "@/components/section/home/features-section";
import { DestinationSection } from "@/components/section/home/destination-section";
import { ReviewsSection } from "@/components/section/home/reviews-section";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

function HomePage() {
  // Airlines data
  const airlines = [
    {
      name: "Emirates",
      logo: "https://logos-world.net/wp-content/uploads/2020/03/Emirates-Logo.png",
      description: "Premium international flights",
    },
    {
      name: "VietJet Air",
      logo: "https://logos-world.net/wp-content/uploads/2021/02/VietJet-Air-Logo.png",
      description: "Budget-friendly domestic & international",
    },
    {
      name: "Vietnam Airlines",
      logo: "https://logos-world.net/wp-content/uploads/2021/02/Vietnam-Airlines-Logo.png",
      description: "National flag carrier of Vietnam",
    },
    {
      name: "Qatar Airways",
      logo: "https://logos-world.net/wp-content/uploads/2020/03/Qatar-Airways-Logo.png",
      description: "Award-winning airline",
    },
    {
      name: "Singapore Airlines",
      logo: "https://logos-world.net/wp-content/uploads/2020/03/Singapore-Airlines-Logo.png",
      description: "World's best airline",
    },
    {
      name: "Turkish Airlines",
      logo: "https://logos-world.net/wp-content/uploads/2020/03/Turkish-Airlines-Logo.png",
      description: "Connecting Europe, Asia & Africa",
    },
    {
      name: "Thailand Airlines",
      logo: "https://logos-world.net/wp-content/uploads/2020/03/Turkish-Airlines-Logo.png",
      description: "Connecting Europe, Asia & Africa",
    },
  ];

  return (
    <div className="bg-white overflow-hidden">
      {/* Hero Section with Search Form */}
      <section className="relative bg-gradient-to-br from-[#2563eb] to-[#1e40af] text-white min-h-[90vh] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://plus.unsplash.com/premium_photo-1661962354730-cda54fa4f9f1?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
          }}
        ></div>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Find Your Perfect Flight
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-4">
              Compare and book flights at unbeatable prices with trusted
              airlines worldwide
            </p>
          </div>

          <SearchForm />
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-blue-100 to-white">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-2">Trusted by Top Airlines</h3>
          <p className="">
            Partner with leading airlines for your perfect journey
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
              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl hover:bg-white transition-all duration-300 group cursor-pointer">
                <div className="text-center">
                  <img
                    src={airline.logo}
                    alt={airline.name}
                    className="h-12 w-auto mx-auto mb-3 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Destinations Section */}
      <DestinationSection />

      {/* Reviews Section */}
      <ReviewsSection />
    </div>
  );
}

export default HomePage;
