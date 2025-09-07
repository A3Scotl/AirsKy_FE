"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import FlightRouteMap from "@/components/common/flight-route-map";
import {
  Clock,
  Plane,
  MapPin,
  Calendar,
  Luggage,
  Star,
  AlertCircle,
  ArrowRight,
  Check,
  Wifi,
  Monitor,
  Utensils,
  Zap,
  Package,
  Headphones,
  Bed,
  Map,
} from "lucide-react";

// Helper function to normalize flight data
const normalizeFlightData = (flight) => {
  return {
    airline: flight.airline?.airlineName || "N/A",
    flightNumber: flight.flightNumber || "N/A",
    airlineLogo: flight.airline?.thumbnail || "N/A",
    departure: {
      city:
        flight.departureAirport?.cityNames?.[0] ||
        flight.departureAirport?.airportName ||
        "N/A",
      airportName: flight.departureAirport?.airportName || "N/A",
      code: flight.departureAirport?.airportCode || "N/A",
      time: flight.departureTime
        ? new Date(flight.departureTime).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "N/A",
      date: flight.departureTime
        ? new Date(flight.departureTime).toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : new Date().toLocaleDateString("vi-VN"),
    },
    arrival: {
      city:
        flight.arrivalAirport?.cityNames?.[0] ||
        flight.arrivalAirport?.airportName ||
        "N/A",
      airportName: flight.arrivalAirport?.airportName || "N/A",
      code: flight.arrivalAirport?.airportCode || "N/A",
      time: flight.arrivalTime
        ? new Date(flight.arrivalTime).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "N/A",
      date: flight.arrivalTime
        ? new Date(flight.arrivalTime).toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : new Date().toLocaleDateString("vi-VN"),
    },
    duration: flight.duration
      ? `${Math.floor(flight.duration / 60)}h ${flight.duration % 60}m`
      : "N/A",
    stops: flight.stops || "N/A",
    aircraft: flight.aircraft || "N/A",
    price: flight.basePrice || flight.priceNumeric || flight.price || 0,
    id: flight.flightId || flight.id || Date.now().toString(),
    status: flight.status || "N/A",
    availableSeats: flight.availableSeats || 0,
    totalSeats: flight.totalSeats || 0,
    gate: flight.gate || "N/A",
    terminal: flight.terminal || "N/A",
    type: flight.type || "N/A",
    businessName: flight.businessName || "N/A",
  };
};

// Helper function to format stops display
const formatStops = (stops) => {
  if (!stops) return "N/A";

  // Handle different formats of stops
  if (typeof stops === "string") {
    if (
      stops.toLowerCase() === "non_stop" ||
      stops.toLowerCase() === "bay thẳng"
    ) {
      return "Bay thẳng";
    }
    return stops;
  }

  // Handle array format
  if (Array.isArray(stops)) {
    if (stops.length === 0) return "Bay thẳng";
    return `${stops.length} điểm dừng`;
  }

  // Handle number format
  if (typeof stops === "number") {
    if (stops === 0) return "Bay thẳng";
    return `${stops} điểm dừng`;
  }

  return stops;
};

const FlightDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // Get flight ID from URL
  const [selectedFare, setSelectedFare] = useState(null);
  const [flightData, setFlightData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get flight data from location state or fetch from API
  useEffect(() => {
    const getFlightData = async () => {
      try {
        setLoading(true);

        // First try to get data from location state
        if (location.state && location.state.flight) {
          const flight = location.state.flight;

          // Transform flight data to match expected structure
          const transformedFlight = normalizeFlightData(flight);

          setFlightData(transformedFlight);
          setLoading(false);
          return;
        }

        // If no state data, try to fetch from API using flight ID
        if (id) {
          console.log("Fetching flight data from API with ID:", id);
          // Here you would call your flight API to get flight details by ID
          // For now, we'll show an error message
          console.error(
            "Flight data not found in state and API call not implemented"
          );
          setLoading(false);
          return;
        }

        // If no ID and no state data, show error
        console.error("No flight ID or flight data provided");
        setLoading(false);
      } catch (error) {
        console.error("Error loading flight data:", error);
        setLoading(false);
      }
    };

    getFlightData();
  }, [location.state, id]);

  const flightInfo = flightData || {};

  // Optimized fare classes with Vietnamese content
  const fareClasses = [
    {
      id: "economy",
      type: "Phổ thông",
      price: 299,
      originalPrice: 350,
      features: [
        { included: true, text: "Đồ dùng cá nhân" },
        { included: true, text: "Hành lý xách tay (7kg)" },
        { included: false, text: "Hành lý ký gửi" },
        { included: true, text: "Chọn chỗ ngồi tiêu chuẩn" },
        { included: true, text: "Giải trí trên máy bay" },
        { included: false, text: "Dịch vụ ăn uống" },
      ],
      availability: "Còn 9 chỗ",
      popular: false,
    },
    {
      id: "premium",
      type: "Phổ thông cao cấp",
      price: 499,
      originalPrice: 580,
      features: [
        { included: true, text: "Đồ dùng cá nhân" },
        { included: true, text: "Hành lý xách tay (10kg)" },
        { included: true, text: "1 hành lý ký gửi (23kg)" },
        { included: true, text: "Ghế ngồi rộng rãi" },
        { included: true, text: "Ưu tiên lên máy bay" },
        { included: true, text: "Dịch vụ ăn uống nâng cao" },
      ],
      availability: "Còn 6 chỗ",
      popular: true,
    },
    {
      id: "business",
      type: "Thương gia",
      price: 1299,
      originalPrice: 1499,
      features: [
        { included: true, text: "Đồ dùng cá nhân" },
        { included: true, text: "2 hành lý xách tay (15kg)" },
        { included: true, text: "2 hành lý ký gửi (32kg mỗi kiện)" },
        { included: true, text: "Ghế nằm phẳng" },
        { included: true, text: "Phòng chờ VIP" },
        { included: true, text: "Ẩm thực cao cấp" },
        { included: true, text: "Dịch vụ riêng biệt" },
      ],
      availability: "Còn 4 chỗ",
      popular: false,
    },
  ];

  const handleSelectFare = (fareId) => setSelectedFare(fareId);

  const handleProceedToBooking = (fareId) => {
    if (!flightData) {
      console.error("No flight data available");
      return;
    }

    const selectedFareData = fareClasses.find((fare) => fare.id === fareId);
    if (!selectedFareData) {
      console.error("Selected fare not found");
      return;
    }

    // Prepare flight data for booking
    const bookingFlightData = {
      ...flightData,
      selectedFare: selectedFareData,
      fareId: fareId,
    };

    // Store in localStorage and navigate
    localStorage.setItem("selectedFlight", JSON.stringify(bookingFlightData));
    localStorage.setItem("selectedFare", JSON.stringify(selectedFareData));

    // Navigate with state as backup
    navigate("/booking-stepper", { state: { flightData: bookingFlightData } });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount); // Display as-is since prices are already in VND
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700">
      {/* Loading State */}
      {loading && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Đang tải thông tin chuyến bay...
            </h3>
            <p className="text-sm text-gray-600">Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      )}

      {/* No Flight Data State */}
      {!loading && !flightData && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Không tìm thấy thông tin chuyến bay
            </h3>
            <p className="text-gray-600 mb-4">
              Thông tin chuyến bay không khả dụng hoặc đã bị xóa.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Quay lại trang chủ
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && flightData && (
        <>
          {/* Hero Section */}
          <div
            className="h-80 bg-cover bg-center relative pt-12"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80')",
            }}
          >
            <div className="absolute inset-0 bg-black/80 "></div>
            <div className="relative z-10 h-full flex items-center justify-center text-white">
              <div className="text-center max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-center flex-wrap gap-4 mb-4">
                  <img
                    src={flightData.airlineLogo || "N/A"}
                    alt={flightData.airline}
                    className="w-12 h-12 rounded bg-white p-1"
                  />
                  <h1 className="text-4xl font-bold">
                    {flightData.departure?.city || flightData.from} →{" "}
                    {flightData.arrival?.city || flightData.to}
                  </h1>
                </div>
                <p className="text-xl mb-2">
                  {flightData.airline} Chuyến bay{" "}
                  {flightData.flightNumber || "VN7210"}
                </p>
                <div className="flex items-center justify-center gap-8 text-lg">
                  <span>
                    {flightData.departure?.time || flightData.departureTime} -{" "}
                    {flightData.arrival?.time || flightData.arrivalTime}
                  </span>
                  <span>•</span>
                  <span>{flightData.duration || "N/A"}</span>
                  <span>•</span>
                  <span>{formatStops(flightData.stops) || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto py-8 px-4">
            {/* Flight Summary Card */}
            <Card className="mb-8 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="w-6 h-6 text-blue-600" />
                  Thông tin chuyến bay
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                    <MapPin className="w-8 h-8 mb-3 text-blue-600" />
                    <h3 className="font-semibold text-lg">Khởi hành</h3>
                    <p className="font-bold">
                      {flightData.departure?.city || flightData.from} (
                      {flightData.departure?.code || flightData.fromCode})
                    </p>
                    <p className="text-sm text-gray-600">
                      {flightData.departure?.time || flightData.departureTime},{" "}
                      {flightData.departure?.date || flightData.departureDate}
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                    <Plane className="w-8 h-8 mb-3 text-blue-600" />
                    <h3 className="font-semibold text-lg">
                      Chi tiết chuyến bay
                    </h3>
                    <p className="font-bold">
                      {flightData.duration || "N/A"} •{" "}
                      {formatStops(flightData.stops) || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Máy bay: {flightData.aircraft || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                    <MapPin className="w-8 h-8 mb-3 text-blue-600" />
                    <h3 className="font-semibold text-lg">Đến nơi</h3>
                    <p className="font-bold">
                      {flightData.arrival?.city || flightData.to} (
                      {flightData.arrival?.code || flightData.toCode})
                    </p>
                    <p className="text-sm text-gray-600">
                      {flightData.arrival?.time || flightData.arrivalTime},{" "}
                      {flightData.arrival?.date || flightData.arrivalDate}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fare Selection Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
                Chọn loại vé phù hợp
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Lựa chọn hạng ghế phù hợp với nhu cầu du lịch của bạn
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {fareClasses.map((fare) => (
                  <div
                    key={fare.id}
                    className={`border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedFare === fare.id
                        ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-gray-300"
                        : "hover:border-blue-300 hover:shadow-md"
                    } ${
                      fare.popular
                        ? "border-blue-200 bg-blue-50 relative dark:bg-gray-100"
                        : "border-gray-200"
                    }`}
                    onClick={() => handleSelectFare(fare.id)}
                  >
                    {fare.popular && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1">
                        Phổ biến nhất
                      </Badge>
                    )}

                    <div className="p-6">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {fare.type}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {fare.availability}
                        </Badge>
                      </div>

                      <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <span className="text-3xl font-bold text-blue-600">
                            {formatCurrency(fare.price)}
                          </span>
                          <span className="text-lg text-gray-500 line-through">
                            {formatCurrency(fare.originalPrice)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">mỗi người</p>
                      </div>

                      <div className="space-y-3 mb-6">
                        {fare.features.slice(0, 4).map((feature, idx) => (
                          <div key={idx} className="flex items-center text-sm">
                            <span
                              className={`mr-3 ${
                                feature.included
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {feature.included ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                "✗"
                              )}
                            </span>
                            <span
                              className={
                                feature.included
                                  ? "text-gray-700 dark:text-gray-900"
                                  : "text-gray-500"
                              }
                            >
                              {feature.text}
                            </span>
                          </div>
                        ))}
                        {fare.features.length > 4 && (
                          <p className="text-xs text-gray-500 pl-7">
                            +{fare.features.length - 4} quyền lợi khác
                          </p>
                        )}
                      </div>

                      {selectedFare === fare.id ? (
                        <div className="space-y-3">
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProceedToBooking(fare.id);
                            }}
                          >
                            Tiếp tục đặt vé{" "}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                          <p className="text-xs text-center text-green-600 font-medium">
                            ✓ {fare.type} đã chọn
                          </p>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Chọn {fare.type}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedFare && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {fareClasses.find((f) => f.id === selectedFare)?.type}{" "}
                        đã chọn
                      </p>
                      <p className="text-xs text-green-600">
                        Tổng cộng:{" "}
                        {formatCurrency(
                          fareClasses.find((f) => f.id === selectedFare)?.price
                        )}{" "}
                        mỗi người
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleProceedToBooking(selectedFare)}
                    >
                      Đặt ngay <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Flight Information Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-600">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-50 dark:bg-gray-300 rounded-t-lg border-b">
                  <TabsTrigger value="details" className="text-sm">
                    Chi tiết chuyến bay
                  </TabsTrigger>
                  <TabsTrigger
                    value="route-map"
                    className="text-sm flex items-center"
                  >
                    <Map className="w-4 h-4 mr-1" />
                    Bản đồ tuyến bay
                  </TabsTrigger>
                  <TabsTrigger value="policies" className="text-sm">
                    Chính sách
                  </TabsTrigger>
                  <TabsTrigger value="amenities" className="text-sm">
                    Tiện ích
                  </TabsTrigger>
                </TabsList>

                <div className="p-6">
                  <TabsContent value="details" className="mt-0">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                          Lịch trình chuyến bay
                        </h3>
                        <div className="relative">
                          <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200"></div>

                          <div className="flex items-start space-x-4 mb-8">
                            <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center relative z-10">
                              <Plane className="w-8 h-8 text-blue-600" />
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  Khởi hành
                                </h4>
                                <Badge
                                  variant="outline"
                                  className="text-green-600 border-green-600"
                                >
                                  Đúng giờ
                                </Badge>
                              </div>
                              <p className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                                {flightData?.departure?.time || "05:05"}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400">
                                {flightData?.departure?.date ||
                                  "15 tháng 8, 2025"}
                              </p>
                              <p className="text-lg font-medium text-gray-800 mt-1 dark:text-gray-300">
                                {flightData?.departure?.city ||
                                  "TP. Hồ Chí Minh"}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Terminal 4, Cổng A12
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 mb-8 ml-8">
                            <div className="flex-grow border-l-2 border-dashed border-gray-300 pl-4">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">
                                    Thời gian bay
                                  </span>
                                  <span className="font-semibold text-gray-900">
                                    {flightData.duration}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-sm text-gray-600">
                                    Máy bay
                                  </span>
                                  <span className="font-semibold text-gray-900">
                                    {flightData.aircraft}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center relative z-10">
                              <MapPin className="w-8 h-8 text-green-600" />
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  Đến nơi
                                </h4>
                                <Badge
                                  variant="outline"
                                  className="text-green-600 border-green-600"
                                >
                                  Đúng giờ
                                </Badge>
                              </div>
                              <p className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                                {flightData?.arrival?.time || "07:10"}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400">
                                {flightData?.arrival?.date ||
                                  "15 tháng 8, 2025"}
                              </p>
                              <p className="text-lg font-medium text-gray-800 mt-1 dark:text-gray-300">
                                {flightData?.arrival?.city || "Hà Nội"}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Terminal 7, Cổng B15
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Thông tin chuyến bay
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-white">
                                Số hiệu:
                              </span>
                              <span className="font-medium">
                                {flightData.flightNumber}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-white">
                                Loại máy bay:
                              </span>
                              <span className="font-medium">
                                {flightData.aircraft}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-white">
                                Khoảng cách:
                              </span>
                              <span className="font-medium">2,475 dặm</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-white">
                                Vận hành bởi:
                              </span>
                              <span className="font-medium">
                                {flightData.airline}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Thông tin làm thủ tục
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-white">
                                Check-in online:
                              </span>
                              <span className="font-medium">
                                24h trước giờ bay
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-white">
                                Check-in sân bay:
                              </span>
                              <span className="font-medium">
                                2h trước giờ bay
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-white">
                                Lên máy bay:
                              </span>
                              <span className="font-medium">
                                30p trước giờ bay
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-white ">
                                Đóng cổng:
                              </span>
                              <span className="font-medium">
                                10p trước giờ bay
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="route-map" className="mt-0">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center dark:text-white">
                          Bản đồ tuyến bay trực quan
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Xem đường bay từ{" "}
                          {flightData.departure?.city || flightData.from} đến{" "}
                          {flightData.arrival?.city || flightData.to} trên bản
                          đồ với khoảng cách và thông tin chi tiết của chuyến
                          bay{" "}
                          <span className="font-semibold text-green-500">
                            {flightData.flightNumber || "N/A"}{" "}
                          </span>
                          .
                        </p>

                        {/* Flight Route Map */}
                        <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                          <FlightRouteMap
                            flightInfo={flightData}
                            height="500px"
                            showFlightPath={true}
                            showAirportInfo={true}
                            className="w-full"
                          />
                        </div>

                        {/* Additional flight route information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                              <h4 className="font-semibold text-green-800">
                                Sân bay khởi hành
                              </h4>
                            </div>
                            <p className="text-sm font-medium text-gray-800">
                              {flightData.departure?.city || flightData.from} (
                              {flightData.departure?.code ||
                                flightData.fromCode}
                              )
                            </p>
                            <p className="text-xs text-gray-600">
                              Khởi hành:{" "}
                              {flightData.departure?.time ||
                                flightData.departureTime}{" "}
                              •{" "}
                              {flightData.departure?.date ||
                                flightData.departureDate}
                            </p>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <Plane className="w-4 h-4 text-blue-600 mr-2" />
                              <h4 className="font-semibold text-blue-800">
                                Thông tin chuyến bay
                              </h4>
                            </div>
                            <p className="text-sm font-medium text-gray-800">
                              {flightData.flightNumber || "N/A"} •{" "}
                              {flightData.aircraft || "N/A"}
                            </p>
                            <p className="text-xs text-gray-600">
                              Thời gian bay: {flightData.duration || "N/A"} •{" "}
                              {formatStops(flightData.stops)}
                            </p>
                          </div>

                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                              <h4 className="font-semibold text-red-800">
                                Sân bay đến
                              </h4>
                            </div>
                            <p className="text-sm font-medium text-gray-800">
                              {flightData.arrival?.city || flightData.to} (
                              {flightData.arrival?.code || flightData.toCode})
                            </p>
                            <p className="text-xs text-gray-600">
                              Đến nơi:{" "}
                              {flightData.arrival?.time ||
                                flightData.arrivalTime}{" "}
                              •{" "}
                              {flightData.arrival?.date ||
                                flightData.arrivalDate}
                            </p>
                          </div>
                        </div>

                        {/* Map features info */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-2">
                            Tính năng bản đồ:
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Check className="w-4 h-4 text-green-500 mr-2" />
                              <span>Zoom và pan tương tác</span>
                            </div>
                            <div className="flex items-center">
                              <Check className="w-4 h-4 text-green-500 mr-2" />
                              <span>Đường bay thực tế</span>
                            </div>
                            <div className="flex items-center">
                              <Check className="w-4 h-4 text-green-500 mr-2" />
                              <span>Thông tin sân bay chi tiết</span>
                            </div>
                            <div className="flex items-center">
                              <Check className="w-4 h-4 text-green-500 mr-2" />
                              <span>Khoảng cách chính xác</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="policies" className="mt-0">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                          Chính sách hành lý
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <Package className="w-5 h-5 text-blue-600 mr-2" />
                              <h4 className="font-semibold">
                                Hành lý xách tay
                              </h4>
                            </div>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                              <li>• Trọng lượng tối đa: 7kg</li>
                              <li>• Kích thước tối đa: 56 x 36 x 23 cm</li>
                              <li>• 1 kiện bao gồm trong tất cả vé</li>
                              <li>• Phải vừa ngăn hành lý trên đầu</li>
                            </ul>
                          </div>

                          <div className="border rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <Luggage className="w-5 h-5 text-blue-600 mr-2" />
                              <h4 className="font-semibold">Hành lý ký gửi</h4>
                            </div>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                              <li>• Phổ thông: 1 x 23kg bao gồm</li>
                              <li>• Thương gia: 2 x 32kg bao gồm</li>
                              <li>• Kích thước tối đa: 158cm tổng</li>
                              <li>• Có thể mua thêm hành lý</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                          Hủy & Thay đổi
                        </h3>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center mb-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                            <h4 className="font-semibold text-yellow-800">
                              Thông báo quan trọng
                            </h4>
                          </div>
                          <p className="text-sm text-yellow-700">
                            Điều kiện vé thay đổi theo loại vé. Vui lòng xem quy
                            định cụ thể trước khi đặt.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">
                              Phổ thông cơ bản
                            </h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                              <li>• Không được thay đổi</li>
                              <li>• Không hoàn tiền</li>
                              <li>• Không chuyển nhượng</li>
                            </ul>
                          </div>

                          <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">
                              Phổ thông tiêu chuẩn
                            </h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                              <li>
                                • Thay đổi: phí 3.600.000₫ + chênh lệch giá vé
                              </li>
                              <li>• Hủy: phí 4.800.000₫</li>
                              <li>• Hủy miễn phí trong 24h</li>
                            </ul>
                          </div>

                          <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">Thương gia</h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                              <li>
                                • Thay đổi miễn phí (áp dụng chênh lệch giá)
                              </li>
                              <li>• Hủy miễn phí đến 2h trước</li>
                              <li>• Hoàn tiền đầy đủ trong 24h</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="amenities" className="mt-0">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                          Dịch vụ trên chuyến bay
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[
                            {
                              icon: Wifi,
                              title: "Wi-Fi miễn phí",
                              desc: "Internet tốc độ cao miễn phí",
                            },
                            {
                              icon: Monitor,
                              title: "Giải trí",
                              desc: "Màn hình cá nhân với 1000+ lựa chọn",
                            },
                            {
                              icon: Utensils,
                              title: "Ẩm thực",
                              desc: "Bữa ăn cao cấp và đồ uống hảo hạng",
                            },
                            {
                              icon: Headphones,
                              title: "Âm thanh cao cấp",
                              desc: "Tai nghe chống ồn được cung cấp",
                            },
                            {
                              icon: Bed,
                              title: "Thoải mái",
                              desc: "Gối đầu điều chỉnh và chăn",
                            },
                            {
                              icon: Zap,
                              title: "Ổ cắm điện",
                              desc: "Cổng USB và điện tại mỗi ghế",
                            },
                          ].map((amenity, idx) => (
                            <div
                              key={idx}
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center mb-2">
                                <amenity.icon className="w-6 h-6 text-blue-600 mr-3" />
                                <h4 className="font-semibold">
                                  {amenity.title}
                                </h4>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {amenity.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                          Cấu hình ghế ngồi
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold mb-3 dark:text-gray-900">
                                Hạng phổ thông
                              </h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Khoảng cách ghế: 31-32 inch</li>
                                <li>• Độ rộng ghế: 17-18 inch</li>
                                <li>• Cấu hình 3-3-3</li>
                                <li>• Gối đầu điều chỉnh</li>
                              </ul>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-3 dark:text-gray-900">
                                Hạng thương gia
                              </h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Khoảng cách ghế: 60+ inch</li>
                                <li>• Độ rộng ghế: 21 inch</li>
                                <li>• Cấu hình 2-2-2</li>
                                <li>• Ghế nằm phẳng</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FlightDetail;
