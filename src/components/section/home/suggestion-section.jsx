import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { ArrowRight, Plane, Clock, Calendar, MapPin } from "lucide-react";
import { flightApi } from "@/apis/flight-api";
import { useNavigate } from "react-router-dom";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN").format(price) + "đ";

const FlightCardSkeleton = ({ main }) => {
  return (
    <Card
      className={
        main
          ? "relative overflow-hidden h-full border-0 shadow-xl"
          : "relative overflow-hidden border cursor-pointer"
      }
    >
      <div
        className={
          main
            ? "absolute inset-0 bg-gray-200 animate-pulse"
            : "absolute inset-0 bg-gray-200 animate-pulse opacity-20"
        }
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
          {main && <Skeleton className="h-6 w-24 rounded-full mb-4" />}
          <Skeleton className={main ? "h-8 w-3/4 mb-2" : "h-6 w-full mb-2"} />
          <Skeleton className={main ? "h-6 w-1/2 mb-4" : "h-4 w-3/4 mb-2"} />
          <div className="flex items-center space-x-4 mb-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          {main && <Skeleton className="h-4 w-full mb-2" />}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className={main ? "h-8 w-24 mb-1" : "h-6 w-20 mb-1"} />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className={main ? "h-12 w-32" : "h-8 w-20"} />
        </div>
      </div>
    </Card>
  );
};

const FlightCard = ({ flight, onClick, main }) => {
  const navigate = useNavigate();
  const handleViewFlightDetails = (flight) =>
    navigate("/detail/" + flight.id, {
      state: { flight: flight.originalFlight },
    });

  return (
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
              <div
                className={
                  main
                    ? "text-3xl font-bold text-white"
                    : "text-lg font-bold text-blue-600"
                }
              >
                {formatPrice(flight.priceNumeric.replace(/\./g, ""))}
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
              onClick={() => handleViewFlightDetails(flight)}
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
    </Card>
  );
};

const SuggestionSection = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);

  const navigate = useNavigate();
  const handleViewAllFlights = () => navigate("/flights");

  useEffect(() => {
    const fetchDomesticFlights = async () => {
      try {
        setLoading(true);
        const response = await flightApi.findDomesticFlights("Việt Nam", {
          page: 0,
          size: 50, // Lấy nhiều hơn để có thể filter
        });

        if (response.success && response.data) {
          // Lọc chỉ lấy chuyến bay có thời gian khởi hành cách hiện tại ít nhất 4 tiếng
          const now = new Date();
          const minBookingLeadTime = 4 * 60 * 60 * 1000; // 4 tiếng

          const activeFlights = response.data.content
            .filter((flight) => {
              try {
                // Xử lý departureTime - có thể là ISO string hoặc date + time
                let departureDateTime;
                if (
                  flight.departureTime &&
                  flight.departureTime.includes("T")
                ) {
                  // ISO string format: "2025-10-31T06:00:00"
                  departureDateTime = new Date(flight.departureTime);
                } else if (flight.departureDate && flight.departureTime) {
                  // Legacy format: separate date and time
                  departureDateTime = new Date(
                    `${flight.departureDate} ${flight.departureTime}`
                  );
                } else {
                  return false; // Invalid datetime format
                }

                // Chỉ lấy chuyến bay có thời gian khởi hành cách hiện tại ít nhất 4 tiếng
                const isValidTime =
                  departureDateTime.getTime() - now.getTime() >=
                  minBookingLeadTime;

                return isValidTime;
              } catch (error) {
                return false;
              }
            })
            .slice(0, 5); // Chỉ lấy tối đa 5 chuyến bay đầu tiên

          // Map API response to component format
          const mappedFlights = activeFlights.map((flight, index) => ({
            id:
              flight.flight?.flightId?.toString() ||
              flight.flightId?.toString() ||
              index.toString(),
            route: `${
              flight.departureAirport?.airportCode || flight.fromCode || "UNK"
            } - ${
              flight.arrivalAirport?.airportCode || flight.toCode || "UNK"
            }`,
            from:
              flight.departureAirport?.cityNames?.[0] ||
              flight.departureAirport?.airportName ||
              flight.from ||
              "Unknown",
            to:
              flight.arrivalAirport?.cityNames?.[0] ||
              flight.arrivalAirport?.airportName ||
              flight.to ||
              "Unknown",
            fromCode:
              flight.departureAirport?.airportCode || flight.fromCode || "UNK",
            toCode:
              flight.arrivalAirport?.airportCode || flight.toCode || "UNK",
            priceNumeric: (() => {
              // Get lowest price from flightTravelClasses
              if (
                flight.flightTravelClasses &&
                flight.flightTravelClasses.length > 0
              ) {
                const prices = flight.flightTravelClasses
                  .map((tc) => tc.price || tc.basePrice || 0)
                  .filter((price) => price > 0);
                return prices.length > 0 ? Math.min(...prices).toString() : "0";
              }
              // Fallback to flight basePrice
              return (
                flight.basePrice ||
                flight.flight?.basePrice ||
                flight.priceNumeric ||
                0
              ).toString();
            })(),
            duration:
              flight.flight?.duration || flight.duration
                ? `${Math.floor(
                    (flight.flight?.duration || flight.duration) / 60
                  )}h ${(flight.flight?.duration || flight.duration) % 60}m`
                : "0h 0m",
            airline:
              flight.airline?.airlineName ||
              flight.airlineName ||
              "Unknown Airline",
            date:
              flight.flight?.departureTime || flight.departureTime
                ? new Date(
                    flight.flight?.departureTime || flight.departureTime
                  ).toLocaleDateString("vi-VN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })
                : "N/A",
            image:
              "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YWlycGxhbmV8ZW58MHx8MHx8fDA%3D",
            description: `Chuyến bay ${
              flight.flight?.flightNumber || flight.flightNumber || "N/A"
            } từ ${
              flight.departureAirport?.airportCode || flight.fromCode || "UNK"
            } đến ${
              flight.arrivalAirport?.airportCode || flight.toCode || "UNK"
            }`,
            isPopular: index === 0,
            availableSeats:
              flight.flight?.availableSeats || flight.availableSeats || 0,
            status: flight.flight?.status || flight.status || "ON_TIME",
            originalFlight: flight, // Store original flight data for detail page
          }));

          setFlights(mappedFlights);
        } else {
          setError(response.message || "Không thể tải dữ liệu chuyến bay");
        }
      } catch (err) {
        setError("Có lỗi xảy ra khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchDomesticFlights();
  }, []);

  if (loading) {
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
              <FlightCardSkeleton main />
            </div>
            {[0, 1].map((col) => (
              <div className="flex flex-col gap-4" key={col}>
                {[0, 1].map((row) => (
                  <FlightCardSkeleton key={row} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto py-16 bg-gradient-to-b from-blue-50 via-white to-indigo-50 dark:from-gray-500 dark:via-gray-900 dark:to-gray-700">
        <div className="container mx-auto px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Chuyến Bay Nội Địa
            </h2>
            <p className="text-lg text-red-600 dark:text-red-400 max-w-2xl mx-auto">
              {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const mainFlight = flights.length > 0 ? flights[0] : null;
  const smallFlights = flights.slice(1, 5);

  return (
    <section className="mx-auto py-12 sm:py-16 bg-gradient-to-b from-blue-50 via-white to-indigo-50 dark:from-gray-500 dark:via-gray-900 dark:to-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Chuyến Bay Nội Địa
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Khám phá Việt Nam với những tuyến bay phổ biến và giá vé tốt nhất
          </p>
        </div>
        {flights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="md:col-span-2 lg:col-span-2">
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
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Không có chuyến bay nào được tìm thấy.
            </p>
          </div>
        )}

        {flights.length > 0 ? (
          <div className="text-center">
            <Button
              size="lg"
              variant="outline"
              className="bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-300 text-blue-600 font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
              onClick={handleViewAllFlights}
            >
              <Plane className="w-5 h-5 mr-2" />
              Xem tất cả
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export { SuggestionSection };
export default SuggestionSection;
