import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowRight, Plane, Clock, Calendar, MapPin } from "lucide-react";

// Dữ liệu chuyến bay nội địa Việt Nam
const vietnamFlights = [
  {
    id: "hcm-hanoi",
    route: "TP.HCM - Hà Nội",
    fromCity: "TP. Hồ Chí Minh",
    toCity: "Hà Nội",
    fromCode: "SGN",
    toCode: "HAN",
    price: "1.299.000",
    duration: "2h 15m",
    airline: "Vietnam Airlines",
    date: "Hôm nay",
    image:
      "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?q=80&w=1000",
    description: "Tuyến bay phổ biến nhất Việt Nam",
    isPopular: true,
    discount: 15,
  },
  {
    id: "hanoi-danang",
    route: "Hà Nội - Đà Nẵng",
    fromCity: "Hà Nội",
    toCity: "Đà Nẵng",
    fromCode: "HAN",
    toCode: "DAD",
    price: "899.000",
    duration: "1h 30m",
    airline: "VietJet Air",
    date: "Ngày mai",
    image:
      "https://images.unsplash.com/photo-1559592413-7cec4d0d2d8e?q=80&w=1000",
    description: "Khám phá thành phố biển",
  },
  {
    id: "hcm-danang",
    route: "TP.HCM - Đà Nẵng",
    fromCity: "TP. Hồ Chí Minh",
    toCity: "Đà Nẵng",
    fromCode: "SGN",
    toCode: "DAD",
    price: "1.099.000",
    duration: "1h 25m",
    airline: "Bamboo Airways",
    date: "Thứ 7",
    image:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1000",
    description: "Nghỉ dưỡng cuối tuần",
  },
  {
    id: "hcm-phuquoc",
    route: "TP.HCM - Phú Quốc",
    fromCity: "TP. Hồ Chí Minh",
    toCity: "Phú Quốc",
    fromCode: "SGN",
    toCode: "PQC",
    price: "1.549.000",
    duration: "1h 10m",
    airline: "Vietnam Airlines",
    date: "Chủ nhật",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000",
    description: "Đảo ngọc thiên đường",
  },
  {
    id: "hanoi-nhatrang",
    route: "Hà Nội - Nha Trang",
    fromCity: "Hà Nội",
    toCity: "Nha Trang",
    fromCode: "HAN",
    toCode: "CXR",
    price: "1.399.000",
    duration: "2h 5m",
    airline: "Jetstar Pacific",
    date: "T2 tới",
    image:
      "https://images.unsplash.com/photo-1520637836862-4d197d17c13a?q=80&w=1000",
    description: "Biển xanh cát trắng",
  },
];

const SuggestionSection = () => {
  const [selectedFlight, setSelectedFlight] = useState(null);

  // Lấy flight chính (ô lớn) và 4 flight phụ (ô nhỏ)
  const mainFlight = vietnamFlights[0]; // TP.HCM - Hà Nội
  const smallFlights = vietnamFlights.slice(1, 5); // 4 chuyến bay còn lại

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  return (
    <section className=" mx-auto py-16 bg-gradient-to-b from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Chuyến Bay Nội Địa
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Khám phá Việt Nam với những tuyến bay phổ biến và giá vé tốt nhất
          </p>
        </div>

        {/* Main Grid Layout - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Ô lớn bên trái - Main Flight (2 columns width) */}
          <div className="lg:col-span-2">
            <Card className="relative overflow-hidden h-full group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-xl">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${mainFlight.image})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
              </div>

              {/* Content */}
              <div className="relative z-10 p-8 h-full flex flex-col justify-between min-h-[400px]">
                {/* Top Section */}
                <div>
                  {/* Popular Badge */}
                  {mainFlight.isPopular && (
                    <div className="inline-flex items-center bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                      🔥 Phổ biến nhất
                    </div>
                  )}

                  {/* Route */}
                  <div className="flex items-center mb-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">
                        {mainFlight.fromCode}
                      </div>
                      <div className="text-white/80 text-sm">
                        {mainFlight.fromCity}
                      </div>
                    </div>
                    <div className="flex-1 mx-6 relative">
                      <div className="h-px bg-white/30"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <Plane className="w-8 h-8 text-white rotate-90" />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">
                        {mainFlight.toCode}
                      </div>
                      <div className="text-white/80 text-sm">
                        {mainFlight.toCity}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/90 text-lg mb-6">
                    {mainFlight.description}
                  </p>
                </div>

                {/* Bottom Section */}
                <div>
                  {/* Flight Info */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <Clock className="w-5 h-5 text-white/70 mx-auto mb-1" />
                      <div className="text-white text-sm">
                        {mainFlight.duration}
                      </div>
                    </div>
                    <div className="text-center">
                      <Calendar className="w-5 h-5 text-white/70 mx-auto mb-1" />
                      <div className="text-white text-sm">
                        {mainFlight.date}
                      </div>
                    </div>
                    <div className="text-center">
                      <MapPin className="w-5 h-5 text-white/70 mx-auto mb-1" />
                      <div className="text-white text-sm">
                        {mainFlight.airline}
                      </div>
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between">
                    <div>
                      {mainFlight.discount && (
                        <div className="text-white/70 text-sm line-through mb-1">
                          {formatPrice(
                            Math.round(
                              parseInt(mainFlight.price.replace(/\./g, "")) *
                                1.15
                            )
                          )}
                        </div>
                      )}
                      <div className="text-3xl font-bold text-white">
                        {formatPrice(mainFlight.price.replace(/\./g, ""))}
                      </div>
                      <div className="text-white/70 text-sm">/ người</div>
                    </div>
                    <Button
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      Đặt ngay
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Discount Badge */}
              {mainFlight.discount && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold transform rotate-12">
                  -{mainFlight.discount}%
                </div>
              )}
            </Card>
          </div>

          {/* 4 ô nhỏ bên phải - 2 cột, mỗi cột 2 hàng */}
          {/* Cột 1 */}
          <div className="flex flex-col gap-4">
            {smallFlights.slice(0, 2).map((flight, index) => (
              <Card
                key={flight.id}
                className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border hover:border-blue-200 cursor-pointer"
                onClick={() => setSelectedFlight(flight)}
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{ backgroundImage: `url(${flight.image})` }}
                ></div>

                {/* Content */}
                <div className="relative z-10 p-4">
                  {/* Route */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">
                        {flight.fromCode}
                      </div>
                      <div className="text-xs text-gray-500">
                        {flight.fromCity}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">
                        {flight.toCode}
                      </div>
                      <div className="text-xs text-gray-500">
                        {flight.toCity}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {flight.description}
                  </p>

                  {/* Flight Info */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {flight.duration}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {flight.date}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatPrice(flight.price.replace(/\./g, ""))}
                      </div>
                      <div className="text-xs text-gray-500">/ người</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-blue-50 hover:border-blue-300 text-blue-600"
                    >
                      Đặt vé
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Cột 2 */}
          <div className="flex flex-col gap-4">
            {smallFlights.slice(2, 4).map((flight, index) => (
              <Card
                key={flight.id}
                className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border hover:border-blue-200 cursor-pointer"
                onClick={() => setSelectedFlight(flight)}
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{ backgroundImage: `url(${flight.image})` }}
                ></div>

                {/* Content */}
                <div className="relative z-10 p-4">
                  {/* Route */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">
                        {flight.fromCode}
                      </div>
                      <div className="text-xs text-gray-500">
                        {flight.fromCity}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">
                        {flight.toCode}
                      </div>
                      <div className="text-xs text-gray-500">
                        {flight.toCity}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {flight.description}
                  </p>

                  {/* Flight Info */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {flight.duration}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {flight.date}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatPrice(flight.price.replace(/\./g, ""))}
                      </div>
                      <div className="text-xs text-gray-500">/ người</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-blue-50 hover:border-blue-300 text-blue-600"
                    >
                      Đặt vé
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            className="bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-300 text-blue-600 font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Plane className="w-5 h-5 mr-2" />
            Xem tất cả
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export { SuggestionSection };
export default SuggestionSection;
