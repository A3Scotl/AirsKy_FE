"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { useState } from "react";

export function ReviewsSection() {
  const customers = [
    {
      name: "Sarah Johnson",
      location: "New York",
      rating: 5,
      text: "Amazing service! Found the perfect flight at an unbeatable price. The booking process was smooth and hassle-free.",
      avatar:
        "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=600&auto=format&fit=crop&q=60",
    },
    {
      name: "Mike Chen",
      location: "San Francisco",
      rating: 5,
      text: "I've used many flight booking sites, but this one stands out. Great deals and excellent customer support when I needed help.",
      avatar:
        "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=600&auto=format&fit=crop&q=60",
    },
    {
      name: "Emma Davis",
      location: "London",
      rating: 5,
      text: "Booked my honeymoon flights here and saved hundreds! The flexible date feature helped me find the best deals.",
      avatar:
        "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=600&auto=format&fit=crop&q=60",
    },
    {
      name: "David Lee",
      location: "Toronto",
      rating: 5,
      text: "Super easy to book and great customer support. Highly recommend!",
      avatar:
        "https://images.unsplash.com/photo-1603415526960-f8f0a1e5ec1b?w=600&auto=format&fit=crop&q=60",
    },
    {
      name: "David Nam",
      location: "Toronto",
      rating: 5,
      text: "Super easy to book and great customer support. Highly recommend!",
      avatar:
        "https://images.unsplash.com/photo-1603415526960-f8f0a1e5ec1b?w=600&auto=format&fit=crop&q=60",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  // Calculate actual center index for centered slides
  const getCenterIndex = (swiperActiveIndex, totalSlides) => {
    // For centered slides, the center slide index is different from swiper.activeIndex
    return swiperActiveIndex;
  };

  return (
    <section className="py-16 bg-[#f9fafb] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#111827] mb-4">
            What Our Customers Say
          </h2>
        </div>

        <Swiper
          modules={[Navigation]}
          navigation={{
            prevEl: ".custom-swiper-button-prev",
            nextEl: ".custom-swiper-button-next",
          }}
          slidesPerView={3}
          centeredSlides={true}
          spaceBetween={30}
          initialSlide={0}
          onSlideChange={(swiper) => {
            // For centered slides, we need to handle the active index differently
            setActiveIndex(swiper.activeIndex);
          }}
          className="!overflow-visible"
          watchSlidesProgress={true}
          breakpoints={{
            320: { slidesPerView: 1, centeredSlides: true },
            768: { slidesPerView: 2, centeredSlides: false },
            1024: { slidesPerView: 3, centeredSlides: true, spaceBetween: 30 },
          }}
        >
          {customers.map((c, index) => (
            <SwiperSlide key={index}>
              <div
                className={`bg-white p-6 rounded-lg shadow-sm transition-all duration-300 ${
                  index === activeIndex
                    ? "scale-105 shadow-lg"
                    : "scale-90 opacity-80"
                }`}
              >
                <div className="flex items-center mb-4">
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-[#111827]">{c.name}</h4>
                    <p className="text-sm text-[#6b7280]">{c.location}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(c.rating)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[#374151]">{c.text}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation Buttons */}
        <div className="custom-swiper-button-prev absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </div>
        <div className="custom-swiper-button-next absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>

      {/* Custom prev/next buttons CSS */}
      <style jsx global>{`
        .custom-swiper-button-prev.swiper-button-disabled,
        .custom-swiper-button-next.swiper-button-disabled {
          opacity: 0.3;
          cursor: not-allowed;
          pointer-events: none;
        }

        .custom-swiper-button-prev:hover:not(.swiper-button-disabled),
        .custom-swiper-button-next:hover:not(.swiper-button-disabled) {
          transform: scale(1.1);
        }
      `}</style>
    </section>
  );
}
