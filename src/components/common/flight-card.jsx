"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plane,
  Clock,
  MapPin,
  Calendar,
  Users,
  Phone,
  CheckCircle,
  AlertCircle,
  XCircle,
  PlaneTakeoff,
  PlaneLanding,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Component hiển thị thông tin chuyến bay
 * @param {Object} flight - Thông tin chuyến bay
 * @param {Function} onSelect - Callback khi chọn chuyến bay
 * @param {boolean} selected - Có được chọn không
 * @param {boolean} showSelectButton - Hiển thị nút chọn
 */
export function FlightCard({
  flight,
  onSelect,
  selected = false,
  showSelectButton = true,
  // Fare selection props
  expandedFlights,
  selectedFares,
  onToggleDetails,
  onSelectFare,
  onProceedToBooking,
}) {
  const navigate = useNavigate();
  if (!flight) return null;

  // Debug: Log flight data
  console.log("🛫 FlightCard received flight data:", {
    departureTime: flight.departureTime,
    arrivalTime: flight.arrivalTime,
    flightId: flight.flightId,
    flightNumber: flight.flightNumber,
    hasRoundTripPairs: !!flight.roundTripPairs,
    isRoundTrip: flight.isRoundTrip,
    tripType: flight.tripType,
  });

  // Helper function to safely parse date
  const parseDate = (dateString) => {
    if (!dateString) return null;

    try {
      // If it's already a Date object
      if (dateString instanceof Date) {
        return isNaN(dateString.getTime()) ? null : dateString;
      }

      // If it's a string
      if (typeof dateString === "string") {
        let date;

        // Handle different formats
        if (dateString.includes("T") && dateString.includes("Z")) {
          // ISO string with Z timezone
          date = new Date(dateString);
        } else if (dateString.includes("T") && dateString.includes("+")) {
          // ISO string with timezone offset
          date = new Date(dateString);
        } else if (
          dateString.includes("T") &&
          !dateString.includes("Z") &&
          !dateString.includes("+")
        ) {
          // ISO string without timezone (assume local time)
          console.log("📅 Parsing ISO without timezone:", dateString);
          date = new Date(dateString);
          console.log("📅 Parsed result:", date);
        } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Date only
          date = new Date(dateString + "T00:00:00Z");
        } else if (dateString.match(/^\d{2}:\d{2}$/)) {
          // Time only - can't create date
          return null;
        } else {
          // Try parsing as is
          date = new Date(dateString);
        }

        return isNaN(date.getTime()) ? null : date;
      }

      return null;
    } catch (error) {
      console.warn("Error parsing date:", dateString, error);
      return null;
    }
  };

  // Support both detailed and simple flight structures
  const flightData = {
    flightNumber: flight.flightNumber || flight.flightId || "N/A",
    flightId: flight.flightId,

    // Airline info - ensure we always get strings for navigation
    airline:
      typeof flight.airline === "object" && flight.airline !== null
        ? flight.airline.airlineName || "Unknown Airline"
        : flight.airlineName || flight.airline || "Unknown Airline",
    airlineName:
      flight.airlineName ||
      (typeof flight.airline === "object" && flight.airline?.airlineName) ||
      (typeof flight.airline === "string" ? flight.airline : "Unknown Airline"),
    airlineCode:
      flight.airlineCode ||
      (typeof flight.airline === "object" && flight.airline?.airlineCode) ||
      "",
    airlineLogo:
      flight.airlineLogo ||
      flight.thumbnail ||
      flight.airline?.thumbnail ||
      (flight.airlineName
        ? `https://logo.clearbit.com/${flight.airlineName
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[^a-zA-Z0-9]/g, "")}.com`
        : "https://via.placeholder.com/40x40?text=Logo"),
    thumbnail: flight.thumbnail || flight.airline?.thumbnail,

    // Route info
    from: flight.from || "Unknown",
    fromCode: flight.fromCode || "UNK",
    to: flight.to || "Unknown",
    toCode: flight.toCode || "UNK",

    // Airport details
    departureAirport: flight.departureAirport || {
      airportCode: flight.fromCode || "UNK",
      airportName: flight.from || "Unknown",
      cityNames: [flight.from || "Unknown"],
    },
    arrivalAirport: flight.arrivalAirport || {
      airportCode: flight.toCode || "UNK",
      airportName: flight.to || "Unknown",
      cityNames: [flight.to || "Unknown"],
    },

    // Time info - keep original values for formatting functions
    departureTime: flight.departureTime,
    arrivalTime: flight.arrivalTime,

    // Flight details
    duration: flight.duration || 0,
    type: flight.type || "ONE_WAY",
    status: flight.status || "ON_TIME",
    aircraft: flight.aircraft || "Boeing 737",

    // Pricing
    priceNumeric: flight.priceNumeric || flight.basePrice || 0,
    basePrice: flight.basePrice || flight.priceNumeric || 0,

    // Capacity
    availableSeats: flight.availableSeats || 100,
    totalSeats: flight.totalSeats || 200,

    // Additional info
    stops: flight.stops || [],
    gate: flight.gate,
    terminal: flight.terminal,
    businessName: flight.businessName || "Economy",
    tripType: flight.tripType || flight.type,
    roundTripGroupId: flight.roundTripGroupId,

    // Round-trip specific data
    isRoundTripDisplay: false, // Only set to true when roundTripPairs is present
    outboundFlight: flight.outboundFlight,
    returnFlight: flight.returnFlight,
    combinedPrice: flight.combinedPrice || flight.priceNumeric,

    // Contact info
    contact: flight.contact,
  };

  // Handle roundTripPairs data structure
  if (flight.roundTripPairs && flight.roundTripPairs.length > 0) {
    console.log(
      "🔄 FlightCard: Processing roundTripPairs for round trip display"
    );
    const roundTripPair = flight.roundTripPairs[0];
    const outbound = roundTripPair.outbound;
    const inbound = roundTripPair.inbound;

    flightData.isRoundTripDisplay = true;
    flightData.outboundFlight = outbound;
    flightData.returnFlight = inbound;
    flightData.combinedPrice =
      (outbound.basePrice || 0) + (inbound.basePrice || 0);
    flightData.flightNumber = `${outbound.flightNumber} / ${inbound.flightNumber}`;
    flightData.flightId = outbound.flightId; // Use outbound ID as primary
    flightData.airline = outbound.airline;
    flightData.airlineName = outbound.airline?.airlineName || "Unknown Airline";
    flightData.airlineCode = outbound.airline?.airlineCode || "";
    flightData.thumbnail = outbound.airline?.thumbnail;
    flightData.airlineLogo =
      outbound.airline?.thumbnail || flightData.airlineLogo;
    flightData.from = outbound.departureAirport?.cityNames?.[0] || "Unknown";
    flightData.fromCode = outbound.departureAirport?.airportCode || "UNK";
    flightData.to = outbound.arrivalAirport?.cityNames?.[0] || "Unknown";
    flightData.toCode = outbound.arrivalAirport?.airportCode || "UNK";
    flightData.departureAirport = outbound.departureAirport;
    flightData.arrivalAirport = outbound.arrivalAirport;
    flightData.departureTime = outbound.departureTime;
    flightData.arrivalTime = outbound.arrivalTime;
    flightData.duration = outbound.duration;
    flightData.type = outbound.type;
    flightData.status = outbound.status;
    flightData.aircraft = outbound.aircraft;
    flightData.availableSeats = Math.min(
      outbound.availableSeats,
      inbound.availableSeats
    );
    flightData.totalSeats = Math.min(outbound.totalSeats, inbound.totalSeats);
    flightData.stops = outbound.stops;
    flightData.gate = outbound.gate;
    flightData.terminal = outbound.terminal;
    flightData.businessName = outbound.businessName;
    flightData.tripType = outbound.tripType;
    flightData.roundTripGroupId = outbound.roundTripGroupId;
    flightData.contact = outbound.airline?.contact;
  }

  // Format thời gian
  const formatTime = (dateString) => {
    if (!dateString) return "--:--";

    try {
      // Debug logging
      console.log("🎯 Formatting time for:", dateString, typeof dateString);

      // Check if it's already in HH:MM format
      if (typeof dateString === "string" && dateString.match(/^\d{2}:\d{2}$/)) {
        return dateString;
      }

      // Try to extract time directly from ISO string format "2025-09-29T08:00:00"
      if (typeof dateString === "string" && dateString.includes("T")) {
        const timeMatch = dateString.match(/T(\d{2}:\d{2})/);
        if (timeMatch) {
          console.log("✅ Extracted time directly:", timeMatch[1]);
          return timeMatch[1];
        }
      }

      const date = parseDate(dateString);
      if (!date) {
        console.warn(
          "❌ Could not parse date for time formatting:",
          dateString
        );
        return "--:--";
      }

      console.log(
        "✅ Parsed date:",
        date,
        "-> Time:",
        date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      const formatted = date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return formatted;
    } catch (error) {
      console.warn("❌ Error formatting time:", dateString, error);
      return "--:--";
    }
  };

  // Format ngày
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      // console.log("Formatting date for:", dateString, typeof dateString);

      const date = parseDate(dateString);
      if (!date) {
        console.warn("Could not parse date for date formatting:", dateString);
        return "N/A";
      }

      const formatted = date.toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      // console.log("Formatted date result:", formatted);
      return formatted;
    } catch (error) {
      console.warn("Error formatting date:", dateString, error);
      return "N/A";
    }
  };

  // Tính thời gian bay
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format giá
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Type badge
  const getTypeBadge = (type) => {
    switch (type) {
      case "DOMESTIC":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-600">
            Nội địa
          </Badge>
        );
      case "INTERNATIONAL":
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            Quốc tế
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Card
      className={`w-full transition-all duration-200 hover:shadow-lg ${
        selected
          ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "hover:shadow-md"
      }`}
    >
      <CardContent className="p-6">
        {/* Header với thông tin cơ bản */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={flightData.thumbnail || flightData.airlineLogo}
              alt={flightData.airlineName}
              className="w-8 h-8 rounded object-contain border-2"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {flightData.airlineName}
              </span>
              <span className="text-xs text-gray-500">
                ({flightData.airlineCode})
              </span>
              {/* Hiển thị thông tin combination nếu có */}
              {flight.combination && (
                <Badge variant="outline" className="text-xs ml-2">
                  {flight.combination.route}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-lg">
                {flightData.flightNumber}
              </span>
            </div>
            <div className="flex gap-2">{getTypeBadge(flightData.type)}</div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(
                flightData.isRoundTripDisplay
                  ? flightData.combinedPrice
                  : flightData.basePrice
              )}
            </div>
            <div className="text-sm text-gray-500">
              {flightData.isRoundTripDisplay ? "/cặp vé khứ hồi" : "/khách"}
            </div>
          </div>
        </div>

        {/* Thông tin chuyến bay */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {/* Điểm khởi hành */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <PlaneTakeoff className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-semibold text-lg">
                {formatTime(flightData.departureTime)} ({" "}
                {formatDate(flightData.departureTime)})
              </span>
            </div>

            <div className="font-medium">
              {flightData.departureAirport?.airportCode}
            </div>
            <div className="text-sm text-gray-600">
              {flightData.departureAirport?.airportName} (
              {flightData.departureAirport?.cityNames?.[0] || ""})
            </div>
          </div>

          {/* Thông tin chuyến bay */}
          <div className="text-center flex flex-col items-center justify-center">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 text-gray-500 mr-1" />
              <span className="text-sm font-medium">
                {formatDuration(flightData.duration)}
              </span>
            </div>

            <div className="relative w-full max-w-xs">
              <div className="border-t border-gray-300 relative">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Plane className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              {flightData.stops && flightData.stops.length > 0
                ? `${flightData.stops.length} điểm dừng`
                : "Bay thẳng"}
            </div>

            <div className="text-xs text-gray-600 mt-1">
              {flightData.aircraft}
            </div>
          </div>

          {/* Điểm đến */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <PlaneLanding className="w-5 h-5 text-red-600 mr-2" />
              <span className="font-semibold text-lg">
                {formatTime(flightData.arrivalTime)} (
                {formatDate(flightData.arrivalTime)})
              </span>
            </div>

            <div className="font-medium">
              {flightData.arrivalAirport?.airportCode}
            </div>
            <div className="text-sm text-gray-600">
              {flightData.arrivalAirport?.airportName} ({" "}
              {flightData.arrivalAirport?.cityNames?.[0] || ""})
            </div>
          </div>
        </div>

        {/* Thông tin hãng hàng không và chỗ ngồi */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                {flightData.availableSeats}/{flightData.totalSeats} chỗ trống
              </span>
            </div>
          </div>

          <>
            {/* Action buttons */}
            {showSelectButton && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    navigate(`/detail/${flight.id || flight.flightId}`, {
                      state: { flight },
                    })
                  }
                  className="text-white hover:text-gray-900 bg-blue-500 rounded-sm px-8"
                >
                  Chi tiết
                </Button>
              </div>
            )}
          </>
        </div>

        {/* Round-trip flight details */}
        {flightData.isRoundTripDisplay &&
          flightData.outboundFlight &&
          flightData.returnFlight && (
            <div className="border-t pt-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  Khứ hồi
                </Badge>
                <span className="text-sm text-gray-600">
                  Chuyến bay đi và về đã được gộp lại
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Outbound flight */}
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <PlaneTakeoff className="w-4 h-4 text-green-600" />
                    <div>
                      {flightData.outboundFlight.flightNumber ||
                        flightData.outboundFlight.flightId}
                    </div>
                    <span className="font-medium text-sm">(Chuyến đi)</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>
                      {/* show date of outbound flight */}
                      {formatDate(flightData.outboundFlight.departureTime)}
                    </div>

                    <div>
                      {formatTime(flightData.outboundFlight.departureTime)} -{" "}
                      {formatTime(flightData.outboundFlight.arrivalTime)}
                    </div>
                    <div>
                      {flightData.outboundFlight.departureAirport?.airportCode}{" "}
                      → {flightData.outboundFlight.arrivalAirport?.airportCode}
                    </div>
                    <div className="font-medium text-blue-600">
                      {formatPrice(
                        flightData.outboundFlight.basePrice ||
                          flightData.outboundFlight.priceNumeric
                      )}
                    </div>
                  </div>
                </div>

                {/* Return flight */}
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <PlaneLanding className="w-4 h-4 text-red-600" />
                    <div>
                      {flightData.returnFlight.flightNumber ||
                        flightData.returnFlight.flightId}
                    </div>
                    <span className="font-medium text-sm">(Chuyến về)</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>
                      {/* show date of outbound flight */}
                      {formatDate(flightData.returnFlight.departureTime)}
                    </div>

                    <div>
                      {formatTime(flightData.returnFlight.departureTime)} -{" "}
                      {formatTime(flightData.returnFlight.arrivalTime)}
                    </div>
                    <div>
                      {flightData.returnFlight.departureAirport?.airportCode} →{" "}
                      {flightData.returnFlight.arrivalAirport?.airportCode}
                    </div>
                    <div className="font-medium text-blue-600">
                      {formatPrice(
                        flightData.returnFlight.basePrice ||
                          flightData.returnFlight.priceNumeric
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Fare Selection Section */}
        {onToggleDetails && (
          <div className="mt-4">
            <Button
              variant="link"
              className="text-blue-600 p-0 hover:text-blue-800"
              onClick={() => onToggleDetails(flight.id)}
            >
              {expandedFlights?.has(flight.id) ? "Ẩn" : "Chọn vé ngay"}
              <ChevronRight
                className={`w-4 h-4 ml-1 transition-transform ${
                  expandedFlights?.has(flight.id) ? "rotate-90" : ""
                }`}
              />
            </Button>

            {expandedFlights?.has(flight.id) && (
              <div className="mt-4 border-t pt-4 bg-gray-50 dark:bg-gray-800 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-4 rounded-b-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-200">
                  Chọn loại vé phù hợp
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: "basic",
                      name: "Phổ thông cơ bản",
                      price: 1200000,
                      features: [
                        { included: true, text: "Hành lý xách tay" },
                        { included: false, text: "Hành lý ký gửi" },
                        { included: false, text: "Chọn chỗ ngồi" },
                        { included: false, text: "Đổi/hủy vé" },
                      ],
                    },
                    {
                      id: "main",
                      name: "Phổ thông tiêu chuẩn",
                      price: 1800000,
                      recommended: true,
                      features: [
                        { included: true, text: "Hành lý xách tay" },
                        { included: true, text: "1 hành lý ký gửi" },
                        { included: true, text: "Chọn chỗ ngồi trước" },
                        { included: true, text: "Đổi vé (có phí)" },
                      ],
                    },
                    {
                      id: "first",
                      name: "Thương gia",
                      price: 4200000,
                      features: [
                        { included: true, text: "Hành lý xách tay" },
                        { included: true, text: "2 hành lý ký gửi" },
                        { included: true, text: "Chọn chỗ ngồi miễn phí" },
                        { included: true, text: "Đổi/hủy vé miễn phí" },
                        { included: true, text: "Suất ăn cao cấp" },
                      ],
                    },
                  ].map((fare) => (
                    <FareOption
                      key={fare.id}
                      fare={fare}
                      flight={flight}
                      isSelected={selectedFares?.[flight.id] === fare.id}
                      onSelect={onSelectFare}
                      onProceedToBooking={onProceedToBooking}
                    />
                  ))}
                </div>

                {selectedFares?.[flight.id] && (
                  <FareSummary
                    fare={[
                      {
                        id: "basic",
                        name: "Phổ thông cơ bản",
                        price: 1200000,
                      },
                      {
                        id: "main",
                        name: "Phổ thông tiêu chuẩn",
                        price: 1800000,
                      },
                      {
                        id: "first",
                        name: "Thương gia",
                        price: 4200000,
                      },
                    ].find((f) => f.id === selectedFares[flight.id])}
                    onProceedToBooking={() =>
                      onProceedToBooking(flight, selectedFares[flight.id])
                    }
                  />
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component: Fare Option
const FareOption = ({
  fare,
  flight,
  isSelected,
  onSelect,
  onProceedToBooking,
}) => (
  <div
    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
      isSelected
        ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
        : "hover:border-blue-300 hover:shadow-sm"
    } ${
      fare.recommended
        ? "bg-gradient-to-br from-blue-50 to-indigo-50 relative"
        : "bg-white"
    }`}
    onClick={() => onSelect(flight.id, fare.id)}
  >
    {fare.recommended && (
      <Badge className="absolute -top-2 right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
        Khuyến nghị
      </Badge>
    )}

    <div className="mb-4">
      <h4 className="font-bold text-gray-900 text-lg mb-1">{fare.name}</h4>
      <p className="text-2xl font-bold text-blue-600 mb-1">
        {new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(fare.price)}
      </p>
      <p className="text-xs text-gray-500">mỗi hành khách</p>
    </div>

    <div className="space-y-2 mb-4">
      {fare.features.map((feature, idx) => (
        <div key={idx} className="flex items-start text-sm">
          <span
            className={`mr-2 mt-0.5 font-bold ${
              feature.included ? "text-green-500" : "text-red-400"
            }`}
          >
            {feature.included ? "✓" : "✗"}
          </span>
          <span
            className={`${
              feature.included ? "text-gray-700" : "text-gray-500"
            }`}
          >
            {feature.text}
          </span>
        </div>
      ))}
    </div>

    {isSelected ? (
      <Button
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
        onClick={(e) => {
          e.stopPropagation();
          onProceedToBooking(flight, fare.id);
        }}
      >
        Tiếp tục đặt vé
        <Plane className="w-4 h-4 ml-2" />
      </Button>
    ) : (
      <Button
        variant="outline"
        className="w-full border-gray-300 hover:border-blue-400 hover:text-blue-600"
        onClick={(e) => e.stopPropagation()}
      >
        Chọn loại vé này
      </Button>
    )}
  </div>
);

// Component: Fare Summary
const FareSummary = ({ fare, onProceedToBooking }) => (
  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-green-800">
          {fare.name} đã được chọn
        </p>
        <p className="text-xs text-green-600 mt-1">
          Tổng cộng:{" "}
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(fare.price)}
        </p>
      </div>
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white font-semibold"
        onClick={onProceedToBooking}
      >
        Đặt ngay
        <Plane className="w-4 h-4 ml-1" />
      </Button>
    </div>
  </div>
);
