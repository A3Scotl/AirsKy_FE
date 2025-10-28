"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plane,
  Clock,
  Users,
  PlaneTakeoff,
  PlaneLanding,
  ChevronRight,
  ArrowRightLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrencyVND } from "@/utils/currency-utils";

const combineRoundTripClasses = (outboundClasses, inboundClasses) => {
  if (!outboundClasses && !inboundClasses) return [];
  if (!outboundClasses) return inboundClasses;
  if (!inboundClasses) return outboundClasses;

  const combinedClasses = {};

  outboundClasses.forEach((cls) => {
    const key = cls.travelClass?.classId || cls.travelClass?.className;
    combinedClasses[key] = {
      ...cls,
      direction: "outbound",
      combinedPrice: cls.customPrice || 0,
    };
  });

  inboundClasses.forEach((cls) => {
    const key = cls.travelClass?.classId || cls.travelClass?.className;
    const existing = combinedClasses[key];

    if (existing) {
      existing.combinedPrice =
        (existing.customPrice || 0) + (cls.customPrice || 0);
      existing.inboundPrice = cls.customPrice;
      existing.availableSeats = Math.min(
        existing.availableSeats,
        cls.availableSeats
      );
    } else {
      combinedClasses[key] = {
        ...cls,
        direction: "inbound",
        combinedPrice: cls.customPrice || 0,
      };
    }
  });

  return Object.values(combinedClasses);
};

const getLowestPriceFromClasses = (flightTravelClasses) => {
  if (!flightTravelClasses || flightTravelClasses.length === 0) {
    return null;
  }

  const prices = flightTravelClasses
    .map((cls) => cls.customPrice)
    .filter((price) => price != null && price > 0);

  return prices.length > 0 ? Math.min(...prices) : null;
};

export function FlightCard({
  flight,
  onSelect,
  selected = false,
  showSelectButton = true,
  compact = false,
  selectedFares,
  onSelectFare,
  onProceedToBooking,
}) {
  const navigate = useNavigate();

  const parseDate = (dateString) => {
    if (!dateString) return null;

    try {
      if (dateString instanceof Date) {
        return isNaN(dateString.getTime()) ? null : dateString;
      }

      if (typeof dateString === "string") {
        let date;

        if (dateString.includes("T") && dateString.includes("Z")) {
          date = new Date(dateString);
        } else if (dateString.includes("T") && dateString.includes("+")) {
          date = new Date(dateString);
        } else if (
          dateString.includes("T") &&
          !dateString.includes("Z") &&
          !dateString.includes("+")
        ) {
          date = new Date(dateString);
        } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = new Date(dateString + "T00:00:00Z");
        } else if (dateString.match(/^\d{2}:\d{2}$/)) {
          return null;
        } else {
          date = new Date(dateString);
        }

        return isNaN(date.getTime()) ? null : date;
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  const isItinerary = flight.tripType && flight.legs;

  let flightData;

  if (isItinerary) {
    const itinerary = flight;
    const primaryLeg = itinerary.legs[0];
    const normalizedTripType = (itinerary.tripType || "").toUpperCase();

    if (normalizedTripType === "ROUND_TRIP" && itinerary.legs.length >= 2) {
      const outbound = itinerary.legs[0];
      const inbound = itinerary.legs[1];

      flightData = {
        flightNumber: `${outbound.flightNumber} / ${inbound.flightNumber}`,
        flightId: outbound.flightId || itinerary.itineraryId,
        airline: outbound.airline?.airlineName || "Unknown Airline",
        airlineName: outbound.airline?.airlineName || "Unknown Airline",
        airlineCode: outbound.airline?.airlineCode || "",
        airlineLogo:
          outbound.airline?.thumbnail ||
          "https://via.placeholder.com/40x40?text=Logo",
        thumbnail: outbound.airline?.thumbnail,
        from: outbound.departureAirport?.cityNames?.[0] || "Unknown",
        fromCode: outbound.departureAirport?.airportCode || "UNK",
        to: outbound.arrivalAirport?.cityNames?.[0] || "Unknown",
        toCode: outbound.arrivalAirport?.airportCode || "UNK",
        departureAirport: outbound.departureAirport,
        arrivalAirport: outbound.arrivalAirport,
        departureTime: outbound.departureTime,
        arrivalTime: outbound.arrivalTime,
        duration: outbound.duration,
        type: outbound.type,
        status: outbound.status,
        aircraft:
          outbound.aircraft?.aircraftName || outbound.aircraft || "Boeing 737",
        aircraftInfo:
          typeof outbound.aircraft === "object" && outbound.aircraft !== null
            ? outbound.aircraft
            : outbound.aircraftInfo || null,
        seatLayout:
          outbound.aircraft?.seatLayout ||
          outbound.seatLayout ||
          outbound.aircraftInfo?.seatLayout ||
          "N/A",
        aircraftId:
          outbound.aircraft?.aircraftId ||
          outbound.aircraftId ||
          outbound.aircraftInfo?.aircraftId,
        priceNumeric:
          getLowestPriceFromClasses(
            combineRoundTripClasses(
              outbound.flightTravelClasses,
              inbound.flightTravelClasses
            )
          ) || itinerary.totalPrice,
        basePrice:
          getLowestPriceFromClasses(
            combineRoundTripClasses(
              outbound.flightTravelClasses,
              inbound.flightTravelClasses
            )
          ) || itinerary.totalPrice,
        availableSeats: Math.min(
          outbound.availableSeats || 0,
          inbound.availableSeats || 0
        ),
        totalSeats: Math.min(
          outbound.aircraft?.totalSeats ||
            outbound.totalSeats ||
            outbound.aircraftInfo?.totalSeats ||
            0,
          inbound.aircraft?.totalSeats ||
            inbound.totalSeats ||
            inbound.aircraftInfo?.totalSeats ||
            0
        ),
        stops: outbound.stops,
        stopsList: outbound.stopsList || [],
        gate: outbound.gate,
        terminal: outbound.terminal,
        businessName: outbound.businessName,
        tripType: itinerary.tripType,
        roundTripGroupId: outbound.roundTripGroupId,
        isRoundTripDisplay: true,
        outboundFlight: {
          ...outbound,
          aircraftInfo: outbound.aircraftInfo || outbound.aircraft || null,
          seatLayout:
            outbound.aircraft?.seatLayout ||
            outbound.seatLayout ||
            outbound.aircraftInfo?.seatLayout ||
            "N/A",
          totalSeats:
            outbound.aircraft?.totalSeats ||
            outbound.totalSeats ||
            outbound.aircraftInfo?.totalSeats ||
            0,
          aircraftId:
            outbound.aircraft?.aircraftId ||
            outbound.aircraftId ||
            outbound.aircraftInfo?.aircraftId,
        },
        returnFlight: {
          ...inbound,
          aircraftInfo: inbound.aircraftInfo || inbound.aircraft || null,
          seatLayout:
            inbound.aircraft?.seatLayout ||
            inbound.seatLayout ||
            inbound.aircraftInfo?.seatLayout ||
            "N/A",
          totalSeats:
            inbound.aircraft?.totalSeats ||
            inbound.totalSeats ||
            inbound.aircraftInfo?.totalSeats ||
            0,
          aircraftId:
            inbound.aircraft?.aircraftId ||
            inbound.aircraftId ||
            inbound.aircraftInfo?.aircraftId,
        },
        combinedPrice: itinerary.totalPrice,
        contact: outbound.airline?.contact,
        itineraryId: itinerary.itineraryId,
        flightTravelClasses: combineRoundTripClasses(
          outbound.flightTravelClasses,
          inbound.flightTravelClasses
        ),
      };
    } else {
      const singleFlight = itinerary.legs[0];

      flightData = {
        flightNumber:
          singleFlight.flightNumber || singleFlight.flightId || "N/A",
        flightId: itinerary.itineraryId,
        airline: singleFlight.airline?.airlineName || "Unknown Airline",
        airlineName: singleFlight.airline?.airlineName || "Unknown Airline",
        airlineCode: singleFlight.airline?.airlineCode || "",
        airlineLogo:
          singleFlight.airline?.thumbnail ||
          "https://via.placeholder.com/40x40?text=Logo",
        thumbnail: singleFlight.airline?.thumbnail,
        from: singleFlight.departureAirport?.cityNames?.[0] || "Unknown",
        fromCode: singleFlight.departureAirport?.airportCode || "UNK",
        to: singleFlight.arrivalAirport?.cityNames?.[0] || "Unknown",
        toCode: singleFlight.arrivalAirport?.airportCode || "UNK",
        departureAirport: singleFlight.departureAirport,
        arrivalAirport: singleFlight.arrivalAirport,
        departureTime: singleFlight.departureTime,
        arrivalTime: singleFlight.arrivalTime,
        duration: singleFlight.duration,
        type: singleFlight.type,
        status: singleFlight.status,
        aircraft:
          singleFlight.aircraft?.aircraftName || singleFlight.aircraft || "N/A",
        aircraftInfo:
          typeof singleFlight.aircraft === "object" &&
          singleFlight.aircraft !== null
            ? singleFlight.aircraft
            : singleFlight.aircraftInfo || null,
        seatLayout:
          singleFlight.aircraft?.seatLayout ||
          singleFlight.seatLayout ||
          singleFlight.aircraftInfo?.seatLayout ||
          "N/A",
        aircraftId:
          singleFlight.aircraft?.aircraftId ||
          singleFlight.aircraftId ||
          singleFlight.aircraftInfo?.aircraftId,
        priceNumeric:
          getLowestPriceFromClasses(singleFlight.flightTravelClasses) ||
          singleFlight.basePrice ||
          singleFlight.priceNumeric ||
          0,
        basePrice:
          getLowestPriceFromClasses(singleFlight.flightTravelClasses) ||
          singleFlight.basePrice ||
          singleFlight.priceNumeric ||
          0,
        availableSeats: singleFlight.availableSeats,
        totalSeats:
          singleFlight.aircraft?.totalSeats ||
          singleFlight.totalSeats ||
          singleFlight.aircraftInfo?.totalSeats,
        stops: singleFlight.stops,
        stopsList: singleFlight.stopsList || [],
        gate: singleFlight.gate,
        terminal: singleFlight.terminal,
        businessName: singleFlight.businessName,
        tripType: singleFlight.tripType || singleFlight.type || "ONE_WAY",
        contact: singleFlight.airline?.contact,
        itineraryId: singleFlight.flightId || `oneway-${Date.now()}`,
        flightTravelClasses: singleFlight.flightTravelClasses,
      };
    }
  }

  if (!isItinerary) {
    flightData = {
      flightNumber: flight.flightNumber || "N/A",
      flightId: flight.flightId,
      airline:
        typeof flight.airline === "object" && flight.airline !== null
          ? flight.airline.airlineName || "Unknown Airline"
          : flight.airlineName || flight.airline || "Unknown Airline",
      airlineName:
        flight.airlineName ||
        (typeof flight.airline === "object" && flight.airline?.airlineName) ||
        (typeof flight.airline === "string"
          ? flight.airline
          : "Unknown Airline"),
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
      from: flight.from || "Unknown",
      fromCode: flight.fromCode || "UNK",
      to: flight.to || "Unknown",
      toCode: flight.toCode || "UNK",
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
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      duration: flight.duration || 0,
      type: flight.type || "ONE_WAY",
      status: flight.status || "ON_TIME",
      aircraft:
        typeof flight.aircraft === "object" && flight.aircraft !== null
          ? flight.aircraft.aircraftName || "Boeing 737"
          : flight.aircraft || "Boeing 737",
      aircraftInfo:
        typeof flight.aircraft === "object" && flight.aircraft !== null
          ? flight.aircraft
          : flight.aircraftInfo || null,
      seatLayout:
        flight.aircraft?.seatLayout ||
        flight.seatLayout ||
        flight.aircraftInfo?.seatLayout ||
        "N/A",
      aircraftId:
        flight.aircraft?.aircraftId ||
        flight.aircraftId ||
        flight.aircraftInfo?.aircraftId,
      priceNumeric:
        getLowestPriceFromClasses(flight.flightTravelClasses) ||
        flight.priceNumeric ||
        0,
      basePrice:
        getLowestPriceFromClasses(flight.flightTravelClasses) ||
        flight.priceNumeric ||
        0,
      availableSeats: flight.availableSeats || 100,
      totalSeats:
        flight.aircraft?.totalSeats ||
        flight.totalSeats ||
        flight.aircraftInfo?.totalSeats ||
        "N/A",
      stops: flight.stops || [],
      stopsList: flight.stopsList || [],
      gate: flight.gate,
      terminal: flight.terminal,
      businessName: flight.businessName || "Economy",
      tripType: flight.tripType || flight.type,
      roundTripGroupId: flight.roundTripGroupId,
      isRoundTripDisplay: false,
      outboundFlight: flight.outboundFlight,
      returnFlight: flight.returnFlight,
      combinedPrice: flight.combinedPrice || flight.priceNumeric,
      contact: flight.contact,
      itineraryId:
        flight.flightId || flight.itineraryId || `direct-${Date.now()}`,
      flightTravelClasses: flight.flightTravelClasses,
    };
  }

  const formatTime = (dateString) => {
    if (!dateString) return "--:--";

    try {
      if (typeof dateString === "string" && dateString.match(/^\d{2}:\d{2}$/)) {
        return dateString;
      }

      if (typeof dateString === "string" && dateString.includes("T")) {
        const timeMatch = dateString.match(/T(\d{2}:\d{2})/);
        if (timeMatch) {
          return timeMatch[1];
        }
      }

      const date = parseDate(dateString);
      if (!date) {
        return "--:--";
      }

      const formatted = date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return formatted;
    } catch (error) {
      return "--:--";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = parseDate(dateString);
      if (!date) {
        return "N/A";
      }

      const formatted = date.toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      return formatted;
    } catch (error) {
      return "N/A";
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

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

  const getDirectionBadge = () => {
    if (flight.direction === "outbound") {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Chuyến đi
        </Badge>
      );
    }
    if (flight.direction === "return") {
      return (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200"
        >
          Chuyến về
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card
      className={`w-full transition-all duration-200 hover:shadow-lg ${
        selected
          ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "hover:shadow-md"
      }`}
    >
      <CardContent className="p-3 sm:p-4 md:p-6">
        {/* Header với thông tin cơ bản */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src={flightData.thumbnail || flightData.airlineLogo}
              alt={flightData.airlineName}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded object-contain border-2"
            />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0 flex-1">
              <span className="text-sm font-medium truncate">
                {flightData.airlineName}
              </span>
              {!compact && (
                <span className="text-xs text-gray-500 hidden sm:inline">
                  ({flightData.airlineCode})
                </span>
              )}

              <div className="flex items-center gap-1 sm:gap-2">
                {getDirectionBadge() && (
                  <div className="hidden sm:block">{getDirectionBadge()}</div>
                )}
                <div className="flex items-center gap-1">
                  {!compact && (
                    <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  )}
                  <span className="font-semibold text-sm sm:text-base md:text-lg">
                    {flightData.flightNumber}
                  </span>
                </div>
                {!compact && (
                  <div className="hidden sm:flex sm:gap-2">
                    {getTypeBadge(flightData.type)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-2">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
              {formatCurrencyVND(
                flightData.isMultiCityDisplay
                  ? flightData.totalPrice || flightData.price
                  : flightData.isRoundTripDisplay
                  ? flightData.combinedPrice
                  : flightData.basePrice
              )}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              {flightData.isMultiCityDisplay
                ? `/toàn bộ hành trình`
                : flightData.isRoundTripDisplay
                ? "/cặp vé khứ hồi"
                : "/khách"}
            </div>
          </div>
        </div>

        {/* Thông tin chuyến bay */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4">
          {/* Điểm khởi hành */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <PlaneTakeoff className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2" />
              <span className="font-semibold text-sm sm:text-base md:text-lg">
                {formatTime(flightData.departureTime)}
                {!compact && <> ({formatDate(flightData.departureTime)})</>}
              </span>
            </div>

            <div className="font-medium text-sm sm:text-base">
              {flightData.departureAirport?.airportCode}
            </div>
          </div>

          {/* Thông tin chuyến bay */}
          <div className="text-center flex flex-col items-center justify-center">
            <div className="flex items-center mb-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-1" />
              <span className="text-xs sm:text-sm font-medium">
                {formatDuration(flightData.duration)}
              </span>
            </div>

            <div className="relative w-full max-w-xs">
              <div className="border-t border-gray-300 relative">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>
                </div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>
                </div>
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Plane className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              {Array.isArray(flightData.stopsList) &&
              flightData.stopsList.length > 0
                ? `${flightData.stopsList.length} điểm dừng`
                : "Bay thẳng"}
            </div>

            <div className="text-xs text-gray-600 mt-1">
              {flightData.aircraft?.aircraftName ||
                flightData.aircraft?.aircraftCode}
            </div>
          </div>

          {/* Điểm đến */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <PlaneLanding className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2" />
              <span className="font-semibold text-sm sm:text-base md:text-lg">
                {formatTime(flightData.arrivalTime)}
                {!compact && <> ({formatDate(flightData.arrivalTime)})</>}
              </span>
            </div>

            <div className="font-medium text-sm sm:text-base">
              {flightData.arrivalAirport?.airportCode}
            </div>
          </div>
        </div>

        {/* Thông tin hãng hàng không và chỗ ngồi - Ẩn trong chế độ compact */}
        {!compact && (
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
                    onClick={() => {
                      if (onSelect) {
                        onSelect();
                      } else {
                        navigate(`/detail/${flightData.flightId}`, {
                          state: { flight: flightData },
                        });
                      }
                    }}
                    className="text-white hover:text-gray-900 bg-blue-500 rounded-sm px-6 sm:px-8"
                  >
                    Chi tiết
                  </Button>
                </div>
              )}
            </>
          </div>
        )}

        {/* Hiển thị nút Chi tiết ở cuối trong chế độ compact */}
        {compact && showSelectButton && (
          <div className="flex justify-end mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (onSelect) {
                  onSelect();
                } else {
                  navigate(`/detail/${flightData.flightId}`, {
                    state: { flight: flightData },
                  });
                }
              }}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              Chi tiết
            </Button>
          </div>
        )}

        {/* Round-trip flight details - Ẩn trong chế độ compact */}
        {!compact &&
          flightData.isRoundTripDisplay &&
          flightData.outboundFlight &&
          flightData.returnFlight && (
            <div className="border-t pt-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Outbound flight */}
                <div className="border rounded-lg p-3 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <PlaneTakeoff className="w-4 h-4 text-green-600" />
                      <div className="font-semibold text-green-800">
                        {flightData.outboundFlight.flightNumber ||
                          flightData.outboundFlight.flightId}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-100 text-green-700"
                      >
                        Chuyến đi
                      </Badge>
                    </div>
                    <div className="font-medium text-gray-800">
                      {flightData.outboundFlight.departureAirport?.airportCode}{" "}
                      → {flightData.outboundFlight.arrivalAirport?.airportCode}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="font-medium flex flex-row">
                      {formatDate(flightData.outboundFlight.departureTime)}
                      <div className="flex items-center gap-2 ml-2">
                        {" • "}
                        <span>
                          {formatTime(flightData.outboundFlight.departureTime)}
                        </span>
                        <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                        <span>
                          {formatTime(flightData.outboundFlight.arrivalTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Return flight */}
                <div className="border rounded-lg p-3 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <PlaneLanding className="w-4 h-4 text-red-600" />
                      <div className="font-semibold text-red-800">
                        {flightData.returnFlight.flightNumber ||
                          flightData.returnFlight.flightId}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs bg-red-100 text-red-700"
                      >
                        Chuyến về
                      </Badge>
                    </div>
                    <div className="font-medium text-gray-800">
                      {flightData.returnFlight.departureAirport?.airportCode} →
                      {flightData.returnFlight.arrivalAirport?.airportCode}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="font-medium flex flex-row">
                      {formatDate(flightData.returnFlight.departureTime)}
                      <div className="flex items-center gap-2 ml-2">
                        {" • "}
                        <span>
                          {formatTime(flightData.returnFlight.departureTime)}
                        </span>
                        <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                        <span>
                          {formatTime(flightData.returnFlight.arrivalTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

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
    onClick={() => onSelect(fare.id)}
  >
    {fare.recommended && (
      <Badge className="absolute -top-2 right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
        Khuyến nghị
      </Badge>
    )}

    <div className="mb-4">
      <h4 className="font-bold text-gray-900 text-base md:text-lg mb-1">
        {fare.name}
      </h4>
      <p className="text-xl md:text-2xl font-bold text-blue-600 mb-1">
        {formatCurrencyVND(fare.price)}
      </p>
      {fare.direction && (
        <p className="text-xs text-gray-500 mb-1">
          {fare.direction === "outbound" ? "Chiều đi" : "Chiều về"}
        </p>
      )}
      {fare.originalPrice && fare.originalPrice !== fare.price && (
        <p className="text-sm text-gray-600">
          Đơn giá: {formatCurrencyVND(fare.originalPrice)}
        </p>
      )}
      <p className="text-xs text-gray-500">mỗi hành khách</p>
      {fare.availableSeats && (
        <p className="text-xs text-orange-600 mt-1">
          Còn {fare.availableSeats} ghế trống
        </p>
      )}
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
      onProceedToBooking ? (
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
        <div className="w-full py-2 px-4 bg-green-100 border border-green-300 rounded text-center text-green-800 text-sm font-medium">
          ✓ Đã chọn
        </div>
      )
    ) : (
      <Button
        variant="outline"
        className="w-full border-gray-300 hover:border-blue-400 hover:text-blue-600"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(fare.id);
        }}
      >
        Chọn loại vé này
      </Button>
    )}
  </div>
);

const FareSummary = ({ fare, flight, onProceedToBooking }) => (
  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-green-800">
          {fare.name} đã được chọn
        </p>
        <p className="text-xs text-green-600 mt-1">
          Tổng cộng: {formatCurrencyVND(fare.price)}
        </p>
        {flight?.isRoundTripDisplay && fare.originalPrice && (
          <p className="text-xs text-green-600">
            (Chiều đi: {formatCurrencyVND(fare.originalPrice)} + Chiều về:{" "}
            {formatCurrencyVND(fare.originalPrice)})
          </p>
        )}
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
