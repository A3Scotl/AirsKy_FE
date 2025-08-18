import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import {
  ChevronLeft,
  ChevronRight,
  Plane,
  MapPin,
  Clock,
  Star,
} from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const deals = [
  {
    id: 1,
    airline: "VietJet Air",
    route: "SGN → BKK",
    price: "$68",
    originalPrice: "$99",
    discount: "32%",
    duration: "1h 30m",
    rating: 4.2,
    image:
      "https://logos-world.net/wp-content/uploads/2023/01/VietJet-Air-Logo.png",
    departure: "08:30",
    arrival: "11:00",
    stops: "Direct Flight",
  },
  {
    id: 2,
    airline: "Scoot",
    route: "SGN → SIN",
    price: "$54",
    originalPrice: "$85",
    discount: "37%",
    duration: "1h 45m",
    rating: 4.0,
    image:
      "https://upload.wikimedia.org/wikipedia/en/thumb/6/6b/Scoot_logo.svg/1200px-Scoot_logo.svg.png",
    departure: "14:20",
    arrival: "17:05",
    stops: "Direct Flight",
  },
  {
    id: 3,
    airline: "AirAsia",
    route: "SGN → KUL",
    price: "$60",
    originalPrice: "$92",
    discount: "35%",
    duration: "2h 15m",
    rating: 4.1,
    image:
      "https://logos-world.net/wp-content/uploads/2023/01/AirAsia-Logo.png",
    departure: "10:15",
    arrival: "13:30",
    stops: "Direct Flight",
  },
  {
    id: 4,
    airline: "Vietnam Airlines",
    route: "SGN → HAN",
    price: "$102",
    originalPrice: "$152",
    discount: "33%",
    duration: "2h 10m",
    rating: 4.5,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Vietnam_Airlines_logo.svg/1200px-Vietnam_Airlines_logo.svg.png",
    departure: "06:00",
    arrival: "08:10",
    stops: "Direct Flight",
  },
  {
    id: 5,
    airline: "Bamboo Airways",
    route: "SGN → DAD",
    price: "$89",
    originalPrice: "$133",
    discount: "32%",
    duration: "1h 20m",
    rating: 4.3,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Bamboo_Airways_logo.svg/1200px-Bamboo_Airways_logo.svg.png",
    departure: "16:45",
    arrival: "18:05",
    stops: "Direct Flight",
  },
  {
    id: 6,
    airline: "Jetstar",
    route: "SGN → SYD",
    price: "$216",
    originalPrice: "$322",
    discount: "33%",
    duration: "8h 20m",
    rating: 3.9,
    image:
      "https://logos-world.net/wp-content/uploads/2023/01/Jetstar-Logo.png",
    departure: "23:35",
    arrival: "10:55+1",
    stops: "Direct Flight",
  },
];

export default function DealsSection() {
  return (
    <section className="pb-8 pt-28 max-w-7xl mx-auto px-4 sm:px-20 lg:px-20">
      <div className="mt-24">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Hot Flight Deals
          </h2>
          <a className="text-gray-600">See all</a>
        </div>

        <div className="relative">
          {/* Custom Navigation Buttons */}
          <div className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 cursor-pointer hover:bg-blue-50 transition-colors">
            <ChevronLeft className="w-6 h-6 text-blue-600" />
          </div>
          <div className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 cursor-pointer hover:bg-blue-50 transition-colors">
            <ChevronRight className="w-6 h-6 text-blue-600" />
          </div>

          <Swiper
            modules={[Navigation, Autoplay, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
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
              640: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
            }}
            className="px-12"
          >
            {deals.map((deal) => (
              <SwiperSlide key={deal.id}>
                <div className="relative bg-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-visible border border-gray-100 ticket-card">
                  {/* Ticket shape with rounded ends */}
                  <div className="bg-white rounded-t-[2rem] rounded-b-[2rem] overflow-hidden relative">
                    {/* Side notches */}
                    <div className="absolute left-0 top-1/2 w-6 h-6 bg-gray-50 rounded-full transform -translate-x-3 -translate-y-1/2 z-20"></div>
                    <div className="absolute right-0 top-1/2 w-6 h-6 bg-gray-50 rounded-full transform translate-x-3 -translate-y-1/2 z-20"></div>

                    {/* Discount Badge */}
                    <div className="absolute top-4 left-4 z-30">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        -{deal.discount}
                      </span>
                    </div>

                    {/* Header với logo airline */}
                    <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-white rounded-lg p-2 flex items-center justify-center">
                            <img
                              src={deal.image}
                              alt={deal.airline}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">
                              {deal.airline}
                            </h3>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{deal.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Flight Info */}
                    <div className="p-6">
                      {/* Route with Enhanced Flight Path */}
                      <div className="flex items-center justify-center mb-8">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-800">
                            {deal.route.split(" → ")[0]}
                          </div>
                          <div className="text-sm text-gray-500">
                            {deal.departure}
                          </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center mx-4 relative">
                          {/* Flight Path Line */}
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full h-0.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400"></div>
                          </div>
                          {/* Departure Dot */}
                          <div className="w-3 h-3 bg-blue-500 rounded-full z-10 absolute left-0"></div>
                          {/* Plane Icon */}
                          <div className="bg-white border-2 border-blue-500 rounded-full p-2 z-10 shadow-sm">
                            <Plane className="w-4 h-4 text-blue-500 transform rotate-45" />
                          </div>
                          {/* Arrival Dot */}
                          <div className="w-3 h-3 bg-blue-500 rounded-full z-10 absolute right-0"></div>
                          {/* Flight Duration Label */}
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
                            {deal.duration}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-800">
                            {deal.route.split(" → ")[1]}
                          </div>
                          <div className="text-sm text-gray-500">
                            {deal.arrival}
                          </div>
                        </div>
                      </div>

                      {/* Dashed divider line */}
                      <div className="border-t-2 border-dashed border-gray-300 my-4 mx-6 relative">
                        <div className="absolute left-0 top-0 w-4 h-4 bg-gray-50 rounded-full transform -translate-x-8 -translate-y-2"></div>
                        <div className="absolute right-0 top-0 w-4 h-4 bg-gray-50 rounded-full transform translate-x-8 -translate-y-2"></div>
                      </div>

                      {/* Price */}
                      <div className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-500 line-through">
                              {deal.originalPrice}
                            </div>
                            <div className="text-2xl font-bold text-blue-600">
                              {deal.price}
                            </div>
                            <div className="text-sm text-gray-500">/person</div>
                          </div>
                          <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                            Book Now
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
