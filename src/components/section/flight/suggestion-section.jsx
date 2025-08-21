import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowRight, Plane, Clock, Calendar, MapPin } from "lucide-react";

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
      "https://plus.unsplash.com/premium_photo-1691960159290-6f4ace6e6c4c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aGFub2l8ZW58MHx8MHx8fDA%3D",
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
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8JUM0JTkxJUMzJUEwJTIwbiVFMSVCQSVCNW5nfGVufDB8fDB8fHww",
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
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8JUM0JTkxJUMzJUEwJTIwbiVFMSVCQSVCNW5nfGVufDB8fDB8fHww",
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
      "https://images.unsplash.com/photo-1732784258726-23832e93dc59?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fHBoJUMzJUJBJTIwcXUlRTElQkIlOTFjfGVufDB8fDB8fHww",
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
      "https://images.unsplash.com/photo-1654930453993-bf69bbb3a00d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    description: "Biển xanh cát trắng",
  },
];

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN").format(price) + "đ";

const FlightCard = ({ flight, onClick, main }) => (
  <Card
    className={
      main
        ? "relative overflow-hidden h-full group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-xl"
        : "relative overflow-hidden group hover:shadow-lg transition-all duration-300 border hover:border-blue-200 cursor-pointer"
    }
    onClick={onClick}
  >
    <div
      className={
        main
          ? "absolute inset-0 bg-cover bg-center"
          : "absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity"
      }
      style={{ backgroundImage: `url(${flight.image})` }}
    >
      {main && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
      )}
    </div>
    <div
      className={
        main
          ? "relative z-10 p-8 h-full flex flex-col justify-between min-h-[400px]"
          : "relative z-10 p-4"
      }
    >
      <div>
        {main && flight.isPopular && (
          <div className="inline-flex items-center bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
            🔥 Phổ biến nhất
          </div>
        )}
        <div className="flex items-center mb-4">
          <div className="text-center">
            <div
              className={
                main
                  ? "text-3xl font-bold text-white"
                  : "text-lg font-bold text-gray-800 dark:text-white"
              }
            >
              {flight.fromCode}
            </div>
            <div
              className={
                main
                  ? "text-white/80 text-sm"
                  : "text-xs text-gray-500 dark:text-gray-300"
              }
            >
              {flight.fromCity}
            </div>
          </div>
          <div className={main ? "flex-1 mx-6 relative" : ""}>
            {main ? (
              <>
                <div className="h-px bg-white/30"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Plane className="w-8 h-8 text-white rotate-90" />
                </div>
              </>
            ) : (
              <ArrowRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <div className="text-center">
            <div
              className={
                main
                  ? "text-3xl font-bold text-white"
                  : "text-lg font-bold text-gray-800 dark:text-white"
              }
            >
              {flight.toCode}
            </div>
            <div
              className={
                main
                  ? "text-white/80 text-sm"
                  : "text-xs text-gray-500 dark:text-gray-300"
              }
            >
              {flight.toCity}
            </div>
          </div>
        </div>
        <p
          className={
            main
              ? "text-white/90 text-lg mb-6"
              : "text-sm text-gray-600 mb-3 line-clamp-2"
          }
        >
          {flight.description}
        </p>
      </div>
      <div>
        <div
          className={
            main
              ? "grid grid-cols-3 gap-4 mb-6"
              : "grid grid-cols-2 gap-2 mb-3 text-xs text-gray-500"
          }
        >
          <div className={main ? "text-center" : "flex items-center"}>
            <Clock
              className={
                main ? "w-5 h-5 text-white/70 mx-auto mb-1" : "w-3 h-3 mr-1"
              }
            />
            <span className={main ? "text-white text-sm" : ""}>
              {flight.duration}
            </span>
          </div>
          <div className={main ? "text-center" : "flex items-center"}>
            <Calendar
              className={
                main ? "w-5 h-5 text-white/70 mx-auto mb-1" : "w-3 h-3 mr-1"
              }
            />
            <span className={main ? "text-white text-sm" : ""}>
              {flight.date}
            </span>
          </div>
          {main && (
            <div className="text-center">
              <MapPin className="w-5 h-5 text-white/70 mx-auto mb-1" />
              <div className="text-white text-sm">{flight.airline}</div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            {main && flight.discount && (
              <div className="text-white/70 text-sm line-through mb-1">
                {formatPrice(
                  Math.round(parseInt(flight.price.replace(/\./g, "")) * 1.15)
                )}
              </div>
            )}
            <div
              className={
                main
                  ? "text-3xl font-bold text-white"
                  : "text-lg font-bold text-blue-600"
              }
            >
              {formatPrice(flight.price.replace(/\./g, ""))}
            </div>
            <div
              className={
                main ? "text-white/70 text-sm" : "text-xs text-gray-500"
              }
            >
              / người
            </div>
          </div>
          <Button
            size={main ? "lg" : "sm"}
            variant={main ? undefined : "outline"}
            className={
              main
                ? "bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                : "hover:bg-blue-50 hover:border-blue-300 text-blue-600"
            }
          >
            {main ? (
              <>
                Đặt ngay
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>Đặt vé</>
            )}
          </Button>
        </div>
      </div>
    </div>
    {main && flight.discount && (
      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold transform rotate-12">
        -{flight.discount}%
      </div>
    )}
  </Card>
);

const SuggestionSection = () => {
  const [selectedFlight, setSelectedFlight] = useState(null);
  const mainFlight = vietnamFlights[0];
  const smallFlights = vietnamFlights.slice(1, 5);

  return (
    <section className="mx-auto py-16 bg-gradient-to-b from-blue-50 via-white to-indigo-50 dark:from-gray-500 dark:via-gray-900 dark:to-gray-700">
      <div className="container mx-auto px-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Chuyến Bay Nội Địa
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Khám phá Việt Nam với những tuyến bay phổ biến và giá vé tốt nhất
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-2">
            <FlightCard flight={mainFlight} main />
          </div>
          {[0, 1].map((col) => (
            <div className="flex flex-col gap-4" key={col}>
              {smallFlights.slice(col * 2, col * 2 + 2).map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  onClick={() => setSelectedFlight(flight)}
                />
              ))}
            </div>
          ))}
        </div>
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
