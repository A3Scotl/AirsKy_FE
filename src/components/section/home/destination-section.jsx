"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export function DestinationSection() {
  const destinations = [
    {
      city: "Paris",
      country: "France",
      price: "$299",
      image:
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=60",
    },
    {
      city: "Tokyo",
      country: "Japan",
      price: "$599",
      image:
        "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=600&auto=format&fit=crop&q=60",
    },
    {
      city: "New York",
      country: "USA",
      price: "$199",
      image:
        "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?w=600&auto=format&fit=crop&q=60",
    },
    {
      city: "London",
      country: "UK",
      price: "$349",
      image:
        "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=600&auto=format&fit=crop&q=60",
    },
    {
      city: "Vietnam",
      country: "VN",
      price: "$344",
      image:
        "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=600&auto=format&fit=crop&q=60",
    },
  ];

  return (
    <section className="py-16 bg-[#f9fafb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#111827] mb-4">
            Popular Destinations
          </h2>
          <p className="text-lg text-[#6b7280] max-w-2xl mx-auto">
            Discover amazing places around the world with our best flight deals
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
          {destinations.map((destination, index) => (
            <SwiperSlide key={index}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative">
                  <img
                    src={destination.image}
                    alt={`${destination.city}, ${destination.country}`}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-[#2563eb] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    From {destination.price}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-xl font-semibold text-[#111827] mb-1">
                    {destination.city}
                  </h3>
                  <p className="text-[#6b7280]">{destination.country}</p>
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
