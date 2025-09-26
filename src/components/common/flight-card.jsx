"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Route,
  ArrowRightLeft,
  Map,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Helper function to combine travel classes from round trip flights
const combineRoundTripClasses = (outboundClasses, inboundClasses) => {
  if (!outboundClasses && !inboundClasses) return [];
  if (!outboundClasses) return inboundClasses;
  if (!inboundClasses) return outboundClasses;

  // Create an object to store classes by classId for easy lookup
  const combinedClasses = {};

  // Add outbound classes
  outboundClasses.forEach((cls) => {
    const key = cls.travelClass?.classId || cls.travelClass?.className;
    combinedClasses[key] = {
      ...cls,
      direction: "outbound",
      combinedPrice: cls.customPrice || 0,
    };
  });

  // Add or merge inbound classes
  inboundClasses.forEach((cls) => {
    const key = cls.travelClass?.classId || cls.travelClass?.className;
    const existing = combinedClasses[key];

    if (existing) {
      // If class exists in both directions, combine prices
      existing.combinedPrice =
        (existing.customPrice || 0) + (cls.customPrice || 0);
      existing.inboundPrice = cls.customPrice;
      existing.availableSeats = Math.min(
        existing.availableSeats,
        cls.availableSeats
      );
    } else {
      // If class only exists in inbound, add it
      combinedClasses[key] = {
        ...cls,
        direction: "inbound",
        combinedPrice: cls.customPrice || 0,
      };
    }
  });

  return Object.values(combinedClasses);
};

// Helper function to get the lowest price from flight travel classes
const getLowestPriceFromClasses = (flightTravelClasses) => {
  if (!flightTravelClasses || flightTravelClasses.length === 0) {
    return null;
  }

  const prices = flightTravelClasses
    .map((cls) => cls.customPrice)
    .filter((price) => price != null && price > 0);

  return prices.length > 0 ? Math.min(...prices) : null;
};

// Helper function to get representative travel classes for multi-city
const getMultiCityClasses = (legs) => {
  if (!legs || legs.length === 0) return [];

  // For multi-city, we can either:
  // 1. Use classes from the first leg (current approach)
  // 2. Find common classes across all legs
  // 3. Show classes for each leg separately

  // Option 1: Use first leg (simplest)
  return legs[0]?.flightTravelClasses || [];

  // Option 2: Find common classes (more complex but accurate)
  // const allClasses = legs.map(leg => leg.flightTravelClasses || []);
  // return findCommonClasses(allClasses);
};

export function FlightCard({
  flight,
  onSelect,
  selected = false,
  showSelectButton = true,
  compact = false, // New prop for compact mode (for chatbot)
  // Fare selection props
  expandedFlights,
  selectedFares,
  onToggleDetails,
  onSelectFare,
  onProceedToBooking,
}) {
  const navigate = useNavigate();
  const [showMultiCityModal, setShowMultiCityModal] = useState(false);
  const [fareSelectionStep, setFareSelectionStep] = useState("outbound"); // 'outbound' or 'return'

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
          date = new Date(dateString);
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
      return null;
    }
  };

  // Support both detailed and simple flight structures
  // Check if this is an itinerary object (from result-section) or direct flight object
  const isItinerary = flight.tripType && flight.legs;

  let flightData;

  if (isItinerary) {
    // Handle itinerary object from result-section
    const itinerary = flight;
    const primaryLeg = itinerary.legs[0]; // First leg for basic info

    // Normalize tripType to uppercase for consistent comparison
    const normalizedTripType = (itinerary.tripType || "").toUpperCase();

    if (normalizedTripType === "ROUND_TRIP" && itinerary.legs.length >= 2) {
      // ROUND_TRIP: Use outbound flight for primary info
      const outbound = itinerary.legs[0];
      const inbound = itinerary.legs[1];

      flightData = {
        flightNumber: `${outbound.flightNumber} / ${inbound.flightNumber}`,
        flightId: outbound.flightId || itinerary.itineraryId,

        // Airline info
        airline: outbound.airline?.airlineName || "Unknown Airline",
        airlineName: outbound.airline?.airlineName || "Unknown Airline",
        airlineCode: outbound.airline?.airlineCode || "",
        airlineLogo:
          outbound.airline?.thumbnail ||
          "https://via.placeholder.com/40x40?text=Logo",
        thumbnail: outbound.airline?.thumbnail,

        // Route info - for round trip, show outbound route
        from: outbound.departureAirport?.cityNames?.[0] || "Unknown",
        fromCode: outbound.departureAirport?.airportCode || "UNK",
        to: outbound.arrivalAirport?.cityNames?.[0] || "Unknown",
        toCode: outbound.arrivalAirport?.airportCode || "UNK",

        // Airport details
        departureAirport: outbound.departureAirport,
        arrivalAirport: outbound.arrivalAirport,

        // Time info - use outbound times
        departureTime: outbound.departureTime,
        arrivalTime: outbound.arrivalTime,

        // Flight details
        duration: outbound.duration,
        type: outbound.type,
        status: outbound.status,
        aircraft:
          outbound.aircraft?.aircraftName || outbound.aircraft || "Boeing 737",

        // Pricing - use lowest combined price from travel classes if available
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

        // Capacity - use minimum of both flights
        availableSeats: Math.min(
          outbound.availableSeats || 0,
          inbound.availableSeats || 0
        ),
        totalSeats: Math.min(
          outbound.aircraft?.totalSeats || outbound.totalSeats || 0,
          inbound.aircraft?.totalSeats || inbound.totalSeats || 0
        ),

        // Additional info
        stops: outbound.stops,
        stopsList: outbound.stopsList || [],
        gate: outbound.gate,
        terminal: outbound.terminal,
        businessName: outbound.businessName,
        tripType: itinerary.tripType,
        roundTripGroupId: outbound.roundTripGroupId,

        // Round-trip specific data
        isRoundTripDisplay: true,
        outboundFlight: outbound,
        returnFlight: inbound,
        combinedPrice: itinerary.totalPrice,

        // Contact info
        contact: outbound.airline?.contact,

        // Itinerary ID
        itineraryId: itinerary.itineraryId,

        // Travel classes - combine both directions, prefer common classes
        flightTravelClasses: combineRoundTripClasses(
          outbound.flightTravelClasses,
          inbound.flightTravelClasses
        ),
      };
    } else if (normalizedTripType === "MULTI_CITY") {
      // MULTI_CITY: Show summary info
      const firstLeg = itinerary.legs[0];
      const lastLeg = itinerary.legs[itinerary.legs.length - 1];

      flightData = {
        flightNumber: `${itinerary.legs.length} chặng`,
        flightId: firstLeg.flightId || itinerary.itineraryId,

        // Airline info - use first leg
        airline: firstLeg.airline?.airlineName || "Multiple Airlines",
        airlineName: firstLeg.airline?.airlineName || "Multiple Airlines",
        airlineCode: firstLeg.airline?.airlineCode || "",
        airlineLogo:
          firstLeg.airline?.thumbnail ||
          "https://via.placeholder.com/40x40?text=Logo",
        thumbnail: firstLeg.airline?.thumbnail,

        // Route info - show first to last
        from: firstLeg.departureAirport?.cityNames?.[0] || "Unknown",
        fromCode: firstLeg.departureAirport?.airportCode || "UNK",
        to: lastLeg.arrivalAirport?.cityNames?.[0] || "Unknown",
        toCode: lastLeg.arrivalAirport?.airportCode || "UNK",

        // Airport details
        departureAirport: firstLeg.departureAirport,
        arrivalAirport: lastLeg.arrivalAirport,

        // Time info - use first leg departure, last leg arrival
        departureTime: firstLeg.departureTime,
        arrivalTime: lastLeg.arrivalTime,

        // Flight details
        duration: itinerary.totalDuration,
        type: "MULTI_CITY",
        status: "ON_TIME", // Assume on time for multi-city
        aircraft: "Multiple Aircraft",

        // Pricing
        priceNumeric: itinerary.totalPrice,
        basePrice: itinerary.totalPrice,

        // Capacity - use minimum across all legs
        availableSeats: Math.min(
          ...itinerary.legs.map((leg) => leg.availableSeats || 0)
        ),
        totalSeats: Math.min(
          ...itinerary.legs.map(
            (leg) => leg.aircraft?.totalSeats || leg.totalSeats || 0
          )
        ),

        // Additional info
        stops: itinerary.totalStops,
        stopsList: itinerary.legs?.flatMap((leg) => leg.stopsList || []) || [],
        gate: null,
        terminal: null,
        businessName: "Multi-City",
        tripType: itinerary.tripType,

        // Multi-city specific data
        isMultiCityDisplay: true,
        multiCityLegs: itinerary.legs,
        totalLegs: itinerary.legs.length,

        // Contact info
        contact: firstLeg.airline?.contact,

        // Itinerary ID
        itineraryId: itinerary.itineraryId,

        // Travel classes - get representative classes for multi-city
        flightTravelClasses: getMultiCityClasses(itinerary.legs),
      };
    } else {
      // ONE_WAY or default: Use single leg
      const singleFlight = itinerary.legs[0];

      flightData = {
        flightNumber:
          singleFlight.flightNumber || singleFlight.flightId || "N/A",
        flightId: itinerary.itineraryId,

        // Airline info
        airline: singleFlight.airline?.airlineName || "Unknown Airline",
        airlineName: singleFlight.airline?.airlineName || "Unknown Airline",
        airlineCode: singleFlight.airline?.airlineCode || "",
        airlineLogo:
          singleFlight.airline?.thumbnail ||
          "https://via.placeholder.com/40x40?text=Logo",
        thumbnail: singleFlight.airline?.thumbnail,

        // Route info
        from: singleFlight.departureAirport?.cityNames?.[0] || "Unknown",
        fromCode: singleFlight.departureAirport?.airportCode || "UNK",
        to: singleFlight.arrivalAirport?.cityNames?.[0] || "Unknown",
        toCode: singleFlight.arrivalAirport?.airportCode || "UNK",

        // Airport details
        departureAirport: singleFlight.departureAirport,
        arrivalAirport: singleFlight.arrivalAirport,

        // Time info
        departureTime: singleFlight.departureTime,
        arrivalTime: singleFlight.arrivalTime,

        // Flight details
        duration: singleFlight.duration,
        type: singleFlight.type,
        status: singleFlight.status,
        aircraft:
          singleFlight.aircraft?.aircraftName ||
          singleFlight.aircraft ||
          "Boeing 737",

        // Pricing - use lowest price from travel classes if available
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

        // Capacity
        availableSeats: singleFlight.availableSeats,
        totalSeats:
          singleFlight.aircraft?.totalSeats || singleFlight.totalSeats,

        // Additional info
        stops: singleFlight.stops,
        stopsList: singleFlight.stopsList || [],
        gate: singleFlight.gate,
        terminal: singleFlight.terminal,
        businessName: singleFlight.businessName,
        tripType: singleFlight.tripType || singleFlight.type || "ONE_WAY",

        // Contact info
        contact: singleFlight.airline?.contact,

        // Itinerary ID
        itineraryId: singleFlight.flightId || `oneway-${Date.now()}`,

        // Travel classes
        flightTravelClasses: singleFlight.flightTravelClasses,
      };
    }
  }

  // Handle direct flight object (legacy support) - separate from itinerary handling
  if (!isItinerary) {
    flightData = {
      flightNumber: flight.flightNumber || "N/A",
      flightId: flight.flightId,

      // Airline info - ensure we always get strings for navigation
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
      aircraft:
        typeof flight.aircraft === "object" && flight.aircraft !== null
          ? flight.aircraft.aircraftName || "Boeing 737"
          : flight.aircraft || "Boeing 737",

      // Pricing - calculate from flightTravelClasses instead of using basePrice
      priceNumeric:
        getLowestPriceFromClasses(flight.flightTravelClasses) ||
        flight.priceNumeric ||
        0,
      basePrice:
        getLowestPriceFromClasses(flight.flightTravelClasses) ||
        flight.priceNumeric ||
        0,

      // Capacity
      availableSeats: flight.availableSeats || 100,
      totalSeats: flight.aircraft?.totalSeats || "N/A",

      // Additional info
      stops: flight.stops || [],
      stopsList: flight.stopsList || [],
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

      // Itinerary ID
      itineraryId:
        flight.flightId || flight.itineraryId || `direct-${Date.now()}`,

      // Travel classes
      flightTravelClasses: flight.flightTravelClasses,
    };
  }

  // Format thời gian
  const formatTime = (dateString) => {
    if (!dateString) return "--:--";

    try {
      // Check if it's already in HH:MM format
      if (typeof dateString === "string" && dateString.match(/^\d{2}:\d{2}$/)) {
        return dateString;
      }

      // Try to extract time directly from ISO string format "2025-09-29T08:00:00"
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
      console.warn("❌ Error formatting time:", dateString, error);
      return "--:--";
    }
  };

  // Format ngày
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = parseDate(dateString);
      if (!date) {
        return "N/A";
      }

      const formatted = date.toLocaleDateString("vi-VN", {
        // weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      return formatted;
    } catch (error) {
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

  // Trip type badge
  const getTripTypeBadge = () => {
    if (flightData.isRoundTripDisplay) {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          <ArrowRightLeft className="w-3 h-3 mr-1" />
          Khứ hồi
        </Badge>
      );
    }
    if (flightData.isMultiCityDisplay) {
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200"
        >
          <Route className="w-3 h-3 mr-1" />
          Đa chặng ({flightData.totalStops} điểm dừng)
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200"
      >
        <Plane className="w-3 h-3 mr-1" />
        Một chiều
      </Badge>
    );
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
              {!compact && (
                <span className="text-xs text-gray-500">
                  ({flightData.airlineCode})
                </span>
              )}

              {/* Trip type badge */}
              <div className="ml-2">{getTripTypeBadge()}</div>
              {/* Hiển thị thông tin combination nếu có */}
              {flight.combination && (
                <Badge variant="outline" className="text-xs ml-2">
                  {flight.combination.route}
                </Badge>
              )}
              {/* Hiển thị route info nếu có */}
              {flight.routeInfo && (
                <Badge variant="secondary" className="text-xs ml-2">
                  {flight.routeInfo}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!compact && <Plane className="w-5 h-5 text-blue-600" />}
              <span className="font-semibold text-lg">
                {flightData.flightNumber}
              </span>
            </div>

            {!compact && (
              <div className="flex gap-2">{getTypeBadge(flightData.type)}</div>
            )}
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
                {formatTime(flightData.departureTime)}
                {!compact && <> ({formatDate(flightData.departureTime)})</>}
              </span>
            </div>

            <div className="font-medium">
              {flightData.departureAirport?.airportCode}
            </div>
            {/* <div className="text-sm text-gray-600">
              {flightData.departureAirport?.airportName}
              {!compact && (
                <> ({flightData.departureAirport?.cityNames?.[0] || ""})</>
              )}
            </div> */}
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
              <PlaneLanding className="w-5 h-5 text-red-600 mr-2" />
              <span className="font-semibold text-lg">
                {formatTime(flightData.arrivalTime)}
                {!compact && <> ({formatDate(flightData.arrivalTime)})</>}
              </span>
            </div>

            <div className="font-medium">
              {flightData.arrivalAirport?.airportCode}
            </div>
            {/* <div className="text-sm text-gray-600">
              {flightData.arrivalAirport?.airportName}
              {!compact && (
                <> ({flightData.arrivalAirport?.cityNames?.[0] || ""})</>
              )}
            </div> */}
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
                    className="text-white hover:text-gray-900 bg-blue-500 rounded-sm px-8"
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

        {/* Multi-city flight details - Ẩn trong chế độ compact */}
        {!compact && flightData.isMultiCityDisplay && (
          <div className="border-t pt-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200"
                >
                  <Route className="w-3 h-3 mr-1" />
                  Đa chặng
                </Badge>
                <span className="text-sm text-gray-600">
                  {Array.isArray(flightData.stopsList)
                    ? flightData.stopsList.length
                    : 0}{" "}
                  điểm dừng • {flightData.multiCityLegs?.length || 1} chuyến bay
                </span>
              </div>
              <Dialog
                open={showMultiCityModal}
                onOpenChange={setShowMultiCityModal}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-purple-600 border-purple-300"
                  >
                    <Map className="w-3 h-3 mr-1" />
                    Xem chi tiết
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Route className="w-5 h-5 text-purple-600" />
                      Chi tiết hành trình đa chặng
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {flightData.multiCityLegs?.map((leg, index) => {
                      // Tạo danh sách các điểm trong hành trình: điểm khởi hành + các điểm dừng + điểm đến
                      const routePoints = [
                        {
                          airportCode: leg.departureAirport?.airportCode,
                          airportName: leg.departureAirport?.airportName,
                          cityName: leg.departureAirport?.cityNames?.[0],
                          time: leg.departureTime,
                          type: "departure",
                        },
                        ...(leg.stopsList || []).map((stop) => ({
                          airportCode: stop.airportCode,
                          airportName: stop.airportName,
                          cityName: stop.cityName || stop.airportName, // Ưu tiên cityName, fallback to airportName
                          time: stop.arrivalTime,
                          type: "stop",
                          stopDuration: stop.stopDuration,
                          departureTime: stop.departureTime,
                        })),
                        {
                          airportCode: leg.arrivalAirport?.airportCode,
                          airportName: leg.arrivalAirport?.airportName,
                          cityName: leg.arrivalAirport?.cityNames?.[0],
                          time: leg.arrivalTime,
                          type: "arrival",
                        },
                      ];

                      return (
                        <div
                          key={leg.flightId}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-50">
                                Chuyến {index + 1}
                              </Badge>
                              <span className="font-semibold">
                                {leg.flightNumber}
                              </span>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              <div>{leg.airline?.airlineName}</div>
                              <div>
                                {leg.aircraft?.aircraftName ||
                                  leg.aircraft?.aircraftCode}
                              </div>
                            </div>
                          </div>

                          {/* Hiển thị hành trình chi tiết */}
                          <div className="space-y-2">
                            {routePoints.map((point, pointIndex) => (
                              <div
                                key={pointIndex}
                                className="flex items-center gap-3"
                              >
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                      point.type === "departure"
                                        ? "bg-green-500"
                                        : point.type === "arrival"
                                        ? "bg-red-500"
                                        : "bg-yellow-500"
                                    }`}
                                  >
                                    {point.type === "departure" && (
                                      <Plane className="w-2 h-2 text-white" />
                                    )}
                                    {point.type === "stop" && (
                                      <MapPin className="w-2 h-2 text-white" />
                                    )}
                                    {point.type === "arrival" && (
                                      <PlaneLanding className="w-2 h-2 text-white" />
                                    )}
                                  </div>
                                  {pointIndex < routePoints.length - 1 && (
                                    <div className="w-0.5 h-8 bg-gray-300 mt-1"></div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium text-gray-800">
                                        {point.airportCode}
                                      </div>
                                      <div className="text-sm text-gray-600 font-medium">
                                        {point.airportName}
                                      </div>
                                      {point.cityName &&
                                        point.cityName !==
                                          point.airportName && (
                                          <div className="text-xs text-gray-500">
                                            {point.cityName}
                                          </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                      <div className="font-medium">
                                        {formatTime(point.time)}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {formatDate(point.time)}
                                      </div>
                                    </div>
                                  </div>
                                  {point.type === "stop" &&
                                    point.stopDuration && (
                                      <div className="mt-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                        <div className="font-medium">
                                          Dừng{" "}
                                          {Math.floor(point.stopDuration / 60)}h{" "}
                                          {point.stopDuration % 60}m
                                        </div>
                                        {point.departureTime && (
                                          <div className="text-gray-500">
                                            Khởi hành lại:{" "}
                                            {formatTime(point.departureTime)}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between text-sm">
                              <div className="text-gray-600">
                                <div>
                                  Thời gian bay: {formatDuration(leg.duration)}
                                </div>
                                {leg.stopsList && leg.stopsList.length > 0 && (
                                  <div className="text-orange-600">
                                    Tổng dừng:{" "}
                                    {leg.stopsList.reduce(
                                      (total, stop) =>
                                        total + (stop.stopDuration || 0),
                                      0
                                    )}{" "}
                                    phút
                                  </div>
                                )}
                              </div>
                              <div className="font-medium text-blue-600">
                                {formatPrice(leg.basePrice)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Summary of multi-city route */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">
                    {flightData.fromCode} → {flightData.toCode}
                  </span>
                </div>
                <div className="text-gray-600">
                  {formatDuration(flightData.duration)} • Tổng:{" "}
                  {formatPrice(flightData.basePrice)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fare Selection Section - Ẩn trong chế độ compact */}
        {!compact && onToggleDetails && (
          <div className="mt-4">
            <Button
              variant="link"
              className="text-blue-600 p-0 hover:text-blue-800"
              onClick={() => onToggleDetails(flight.itineraryId)}
            >
              {expandedFlights?.has(flight.itineraryId) ? "Ẩn" : "Chọn vé ngay"}
              <ChevronRight
                className={`w-4 h-4 ml-1 transition-transform ${
                  expandedFlights?.has(flight.itineraryId) ? "rotate-90" : ""
                }`}
              />
            </Button>

            {expandedFlights?.has(flight.itineraryId) && (
              <div className="mt-4 border-t pt-4 bg-gray-50 dark:bg-gray-800 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-4 rounded-b-lg">
                {/* Round Trip Fare Selection */}
                {flightData.isRoundTripDisplay ? (
                  <RoundTripFareSelection
                    flightData={flightData}
                    selectedFares={selectedFares}
                    fareSelectionStep={fareSelectionStep}
                    setFareSelectionStep={setFareSelectionStep}
                    onSelectFare={onSelectFare}
                    onProceedToBooking={onProceedToBooking}
                  />
                ) : (
                  /* One Way Fare Selection */
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-200">
                      Chọn loại vé phù hợp
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {flightData.flightTravelClasses &&
                      flightData.flightTravelClasses.length > 0 ? (
                        flightData.flightTravelClasses.map(
                          (travelClass, index) => {
                            // Determine if this is recommended (first class or cheapest)
                            const isRecommended =
                              index === 0 ||
                              travelClass.customPrice ===
                                Math.min(
                                  ...flightData.flightTravelClasses.map(
                                    (tc) => tc.customPrice
                                  )
                                );

                            return (
                              <FareOption
                                key={travelClass.id}
                                fare={{
                                  id: travelClass.id,
                                  name:
                                    travelClass.travelClass?.className ||
                                    `Hạng ${index + 1}`,
                                  price: travelClass.customPrice,
                                  originalPrice: travelClass.customPrice,
                                  recommended: isRecommended,
                                  features: [
                                    {
                                      included: true,
                                      text: "Hành lý xách tay",
                                    },
                                    {
                                      included:
                                        travelClass.travelClass?.benefits
                                          ?.toLowerCase()
                                          .includes("ký gửi") ||
                                        travelClass.travelClass?.benefits
                                          ?.toLowerCase()
                                          .includes("luggage") ||
                                        false,
                                      text: "Hành lý ký gửi",
                                    },
                                    {
                                      included:
                                        travelClass.travelClass?.benefits
                                          ?.toLowerCase()
                                          .includes("chỗ ngồi") ||
                                        travelClass.travelClass?.benefits
                                          ?.toLowerCase()
                                          .includes("seat") ||
                                        false,
                                      text: "Chọn chỗ ngồi",
                                    },
                                    {
                                      included:
                                        travelClass.travelClass?.changeable ||
                                        false,
                                      text: "Đổi vé",
                                    },
                                    {
                                      included:
                                        travelClass.travelClass?.refundable ||
                                        false,
                                      text: "Hoàn tiền",
                                    },
                                  ],
                                  availableSeats: travelClass.availableSeats,
                                  benefits: travelClass.travelClass?.benefits,
                                  direction: travelClass.direction,
                                }}
                                flight={flightData}
                                isSelected={
                                  selectedFares?.[flight.itineraryId] ===
                                  travelClass.id
                                }
                                onSelect={() =>
                                  onSelectFare(
                                    flight.itineraryId,
                                    travelClass.id
                                  )
                                }
                                onProceedToBooking={onProceedToBooking}
                              />
                            );
                          }
                        )
                      ) : (
                        // Fallback when no flightTravelClasses available
                        <div className="col-span-full text-center py-8 text-gray-500">
                          <p>Không có thông tin hạng vé cho chuyến bay này</p>
                          <p className="text-sm mt-2">
                            Vui lòng liên hệ với hãng hàng không để biết thêm
                            chi tiết
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedFares?.[flightData.itineraryId] &&
                      flightData.flightTravelClasses && (
                        <FareSummary
                          fare={
                            flightData.flightTravelClasses?.find(
                              (tc) =>
                                tc.id === selectedFares[flightData.itineraryId]
                            )
                              ? {
                                  id: flightData.flightTravelClasses.find(
                                    (tc) =>
                                      tc.id ===
                                      selectedFares[flightData.itineraryId]
                                  ).id,
                                  name:
                                    flightData.flightTravelClasses.find(
                                      (tc) =>
                                        tc.id ===
                                        selectedFares[flightData.itineraryId]
                                    ).travelClass?.className || "Hạng vé",
                                  price: flightData.flightTravelClasses.find(
                                    (tc) =>
                                      tc.id ===
                                      selectedFares[flightData.itineraryId]
                                  ).customPrice,
                                  originalPrice:
                                    flightData.flightTravelClasses.find(
                                      (tc) =>
                                        tc.id ===
                                        selectedFares[flightData.itineraryId]
                                    ).customPrice,
                                }
                              : null
                          }
                          flight={flightData}
                          onProceedToBooking={() =>
                            onProceedToBooking(
                              flight,
                              selectedFares[flightData.itineraryId]
                            )
                          }
                        />
                      )}
                  </div>
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
    onClick={() => onSelect(fare.id)}
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
      {fare.direction && (
        <p className="text-xs text-gray-500 mb-1">
          {fare.direction === "outbound" ? "Chiều đi" : "Chiều về"}
        </p>
      )}
      {fare.originalPrice && fare.originalPrice !== fare.price && (
        <p className="text-sm text-gray-600">
          Đơn giá:{" "}
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(fare.originalPrice)}
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

// Component: Fare Summary
const FareSummary = ({ fare, flight, onProceedToBooking }) => (
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
        {flight?.isRoundTripDisplay && fare.originalPrice && (
          <p className="text-xs text-green-600">
            (Chiều đi:{" "}
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(fare.originalPrice)}{" "}
            + Chiều về:{" "}
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(fare.originalPrice)}
            )
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

// Component: Round Trip Fare Selection
const RoundTripFareSelection = ({
  flightData,
  selectedFares,
  fareSelectionStep,
  setFareSelectionStep,
  onSelectFare,
  onProceedToBooking,
}) => {
  const currentFlight =
    fareSelectionStep === "outbound"
      ? flightData.outboundFlight
      : flightData.returnFlight;
  const currentFlightId =
    fareSelectionStep === "outbound"
      ? flightData.outboundFlight?.flightId
      : flightData.returnFlight?.flightId;
  const stepTitle =
    fareSelectionStep === "outbound"
      ? "Chọn hạng vé chuyến đi"
      : "Chọn hạng vé chuyến về";
  const stepDescription =
    fareSelectionStep === "outbound"
      ? `${flightData.outboundFlight?.departureAirport?.airportCode} → ${flightData.outboundFlight?.arrivalAirport?.airportCode}`
      : `${flightData.returnFlight?.departureAirport?.airportCode} → ${flightData.returnFlight?.arrivalAirport?.airportCode}`;

  const outboundFareId = selectedFares?.[`${flightData.itineraryId}-outbound`];
  const returnFareId = selectedFares?.[`${flightData.itineraryId}-return`];
  const hasOutboundFare = !!outboundFareId;
  const hasReturnFare = !!returnFareId;

  const handleFareSelect = (fareId) => {
    const key =
      fareSelectionStep === "outbound"
        ? `${flightData.itineraryId}-outbound`
        : `${flightData.itineraryId}-return`;
    onSelectFare(key, fareId);
  };

  const handleNext = () => {
    if (fareSelectionStep === "outbound") {
      setFareSelectionStep("return");
    }
  };

  const handlePrev = () => {
    if (fareSelectionStep === "return") {
      setFareSelectionStep("outbound");
    }
  };

  return (
    <div>
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              fareSelectionStep === "outbound"
                ? "bg-blue-600 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            1
          </div>
          <div className="text-sm font-medium">Chuyến đi</div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              fareSelectionStep === "return"
                ? "bg-blue-600 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            2
          </div>
          <div className="text-sm font-medium">Chuyến về</div>
        </div>
        {fareSelectionStep === "return" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            <ArrowRightLeft className="w-4 h-4 mr-1 rotate-180" />
            Quay lại
          </Button>
        )}
      </div>

      {/* Current Step Content */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-200">
          {stepTitle}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{stepDescription}</p>
      </div>

      {/* Fare Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {currentFlight?.flightTravelClasses &&
        currentFlight.flightTravelClasses.length > 0 ? (
          currentFlight.flightTravelClasses.map((travelClass, index) => {
            const isRecommended =
              index === 0 ||
              travelClass.customPrice ===
                Math.min(
                  ...currentFlight.flightTravelClasses.map(
                    (tc) => tc.customPrice
                  )
                );

            return (
              <FareOption
                key={travelClass.id}
                fare={{
                  id: travelClass.id,
                  name:
                    travelClass.travelClass?.className || `Hạng ${index + 1}`,
                  price: travelClass.customPrice,
                  originalPrice: travelClass.customPrice,
                  recommended: isRecommended,
                  features: [
                    { included: true, text: "Hành lý xách tay" },
                    {
                      included:
                        travelClass.travelClass?.benefits
                          ?.toLowerCase()
                          .includes("ký gửi") ||
                        travelClass.travelClass?.benefits
                          ?.toLowerCase()
                          .includes("luggage") ||
                        false,
                      text: "Hành lý ký gửi",
                    },
                    {
                      included:
                        travelClass.travelClass?.benefits
                          ?.toLowerCase()
                          .includes("chỗ ngồi") ||
                        travelClass.travelClass?.benefits
                          ?.toLowerCase()
                          .includes("seat") ||
                        false,
                      text: "Chọn chỗ ngồi",
                    },
                    {
                      included: travelClass.travelClass?.changeable || false,
                      text: "Đổi vé",
                    },
                    {
                      included: travelClass.travelClass?.refundable || false,
                      text: "Hoàn tiền",
                    },
                  ],
                  availableSeats: travelClass.availableSeats,
                  benefits: travelClass.travelClass?.benefits,
                  direction: travelClass.direction,
                }}
                flight={currentFlight}
                isSelected={
                  fareSelectionStep === "outbound"
                    ? outboundFareId === travelClass.id
                    : returnFareId === travelClass.id
                }
                onSelect={() => handleFareSelect(travelClass.id)}
                onProceedToBooking={null} // Disable individual booking
              />
            );
          })
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            <p>Không có thông tin hạng vé cho chuyến bay này</p>
            <p className="text-sm mt-2">
              Vui lòng liên hệ với hãng hàng không để biết thêm chi tiết
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {fareSelectionStep === "outbound" && hasOutboundFare && (
            <span className="text-green-600">✓ Đã chọn hạng vé chuyến đi</span>
          )}
          {fareSelectionStep === "return" && hasReturnFare && (
            <span className="text-green-600">✓ Đã chọn hạng vé chuyến về</span>
          )}
        </div>

        <div className="flex space-x-3">
          {fareSelectionStep === "outbound" && hasOutboundFare && (
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Tiếp tục chọn vé về
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}

          {fareSelectionStep === "return" &&
            hasOutboundFare &&
            hasReturnFare && (
              <Button
                onClick={() =>
                  onProceedToBooking(flightData, {
                    outbound: outboundFareId,
                    return: returnFareId,
                  })
                }
                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                Đặt vé ngay
                <Plane className="w-4 h-4 ml-1" />
              </Button>
            )}
        </div>
      </div>
    </div>
  );
};
