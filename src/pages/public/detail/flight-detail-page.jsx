"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { flightApi } from "@/apis/flight-api";
import { reviewApi } from "@/apis/review-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FlightRouteMap from "@/components/common/flight-route-map";
import {
  formatCurrencyVND,
  formatDateTimeVN,
  formatTimeVN,
  formatDateVN,
} from "@/utils/currency-utils";
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
  CheckCircle,
  Wifi,
  Monitor,
  Utensils,
  Zap,
  Package,
  Headphones,
  Bed,
  Map,
  ArrowRightLeft,
  ChevronRight,
  ChevronLeft,
  Eye,
  Filter,
  SortAsc,
  SortDesc,
  X,
} from "lucide-react";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

// Utility functions for flight data processing

// Optimized duration formatter
const formatDuration = (duration) => {
  if (!duration) return "N/A";

  // Handle string duration (already formatted)
  if (typeof duration === "string") {
    return duration;
  }

  // Handle numeric duration (minutes)
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;

  if (hours === 0) return `${mins} phút`;
  if (mins === 0) return `${hours} tiếng`;
  return `${hours}h ${mins}p`;
};

// Helper function to detect flight type
const detectFlightType = (flight) => {
  if (!flight)
    return {
      isItinerary: false,
      isRoundTrip: false,
      isRoundTripDirect: false,
      isMultiCity: false,
    };

  const isItinerary = Boolean(flight.itineraryId || flight.legs);
  const isRoundTrip =
    isItinerary &&
    flight.legs?.length === 2 &&
    flight.tripType !== "MULTI_CITY";
  const isRoundTripDirect = Boolean(
    flight.outboundFlight && flight.returnFlight
  );
  const isMultiCity = Boolean(
    flight.tripType === "MULTI_CITY" ||
      flight.isMultiCityDisplay ||
      flight.isMultiCity ||
      (flight.legs?.length >= 2 &&
        (flight.tripType === "MULTI_CITY" || flight.isMultiCityDisplay))
  );

  return {
    isItinerary,
    isRoundTrip,
    isRoundTripDirect,
    isMultiCity,
  };
};

// Helper function to normalize flight data structure
const normalizeFlightData = (flight) => {
  if (!flight) return null;

  const flightType = detectFlightType(flight);
  const { isRoundTrip, isRoundTripDirect, isMultiCity } = flightType;

  let processedFlight;

  if (isMultiCity) {
    // Handle multi-city itinerary with multiple legs
    const firstLeg = flight.legs[0];
    const lastLeg = flight.legs[flight.legs.length - 1];

    processedFlight = {
      // Basic flight info
      id: flight.itineraryId,
      flightId: flight.itineraryId || flight.flightId || Date.now().toString(),
      flightNumber:
        flight.legs.map((leg) => leg.flightNumber).join(" + ") || "Multi-City",

      // Airline info - use first leg's airline
      airline:
        firstLeg.airline?.airlineName ||
        firstLeg.airlineName ||
        "Multi Airlines",
      airlineName:
        firstLeg.airline?.airlineName ||
        firstLeg.airlineName ||
        "Multi Airlines",
      airlineLogo:
        firstLeg.airline?.thumbnail ||
        firstLeg.airline?.logo ||
        "/placeholder.svg",

      // Multi-city specific data
      isMultiCity: true,
      tripType: "MULTI_CITY",
      legs: flight.legs.map((leg) => ({
        ...leg,
        departureAirport: {
          ...leg.departureAirport,
          code: leg.departureAirport?.airportCode,
          name: leg.departureAirport?.airportName,
          city: leg.departureAirport?.cityNames?.[0],
          airportName: leg.departureAirport?.airportName,
          gate: leg.departureAirport?.gates?.[0]?.gateName || "TBA",
          terminal: leg.departureAirport?.gates?.[0]?.terminal || "TBA",
        },
        arrivalAirport: {
          ...leg.arrivalAirport,
          code: leg.arrivalAirport?.airportCode,
          name: leg.arrivalAirport?.airportName,
          city: leg.arrivalAirport?.cityNames?.[0],
          airportName: leg.arrivalAirport?.airportName,
          gate: leg.arrivalAirport?.gates?.[0]?.gateName || "TBA",
          terminal: leg.arrivalAirport?.gates?.[0]?.terminal || "TBA",
        },
        aircraft: leg.aircraft?.aircraftName || leg.aircraftName,
        aircraftName: leg.aircraft?.aircraftName || leg.aircraftName,
        // Keep aircraft object from API for seat layout and details
        aircraftInfo:
          typeof leg.aircraft === "object" && leg.aircraft !== null
            ? leg.aircraft
            : null,
        seatLayout: leg.aircraft?.seatLayout || null,
        totalSeats: leg.aircraft?.totalSeats || null,
        aircraftId: leg.aircraft?.aircraftId || null,
        aircraftCode: leg.aircraft?.aircraftCode || null,
        flightTravelClasses: (leg.flightTravelClasses || []).map((tc) => ({
          ...tc,
          availableSeats: tc.availableSeats || 0,
        })),
      })),
      totalPrice: flight.totalPrice || flight.price || 0,
      segments: flight.legs.length,

      // Use first leg for primary display
      departureTime: firstLeg.departureTime,
      departureAirport: {
        ...firstLeg.departureAirport,
        code: firstLeg.departureAirport?.airportCode,
        name: firstLeg.departureAirport?.airportName,
        city: firstLeg.departureAirport?.cityNames?.[0],
        airportName: firstLeg.departureAirport?.airportName,
        gate: firstLeg.departureAirport?.gates?.[0]?.gateName || "TBA",
        terminal: firstLeg.departureAirport?.gates?.[0]?.terminal || "TBA",
      },
      from: firstLeg.departureAirport?.airportCode || "N/A",
      fromCode: firstLeg.departureAirport?.airportCode || "N/A",

      // Use last leg for arrival info
      arrivalTime: lastLeg.arrivalTime,
      arrivalAirport: {
        ...lastLeg.arrivalAirport,
        code: lastLeg.arrivalAirport?.airportCode,
        name: lastLeg.arrivalAirport?.airportName,
        city: lastLeg.arrivalAirport?.cityNames?.[0],
        airportName: lastLeg.arrivalAirport?.airportName,
        gate: lastLeg.arrivalAirport?.gates?.[0]?.gateName || "TBA",
        terminal: lastLeg.arrivalAirport?.gates?.[0]?.terminal || "TBA",
      },
      to: lastLeg.arrivalAirport?.airportCode || "N/A",
      toCode: lastLeg.arrivalAirport?.airportCode || "N/A",

      // Combined duration
      duration: flight.legs.reduce(
        (total, leg) => total + (leg.duration || 0),
        0
      ),

      // Use first leg's travel classes as primary
      flightTravelClasses: (firstLeg.flightTravelClasses || []).map((tc) => ({
        ...tc,
        availableSeats: tc.availableSeats || 0,
      })),

      // Status and availability (use minimum across all legs)
      status: flight.status || firstLeg.status || "Scheduled",
      availableSeats: Math.min(
        ...flight.legs.map((leg) => leg.availableSeats || 0)
      ),
      totalSeats: Math.min(...flight.legs.map((leg) => leg.totalSeats || 0)),

      // Additional fields
      gate: firstLeg.departureAirport?.gates?.[0]?.gateName || firstLeg.gate,
      terminal:
        firstLeg.departureAirport?.gates?.[0]?.terminal || firstLeg.terminal,
      stops: flight.legs.reduce((total, leg) => total + (leg.stops || 0), 0),
      stopsList: flight.legs.flatMap((leg) => leg.stopsList || []),
      aircraft: firstLeg.aircraft?.aircraftName || firstLeg.aircraftName,
      // Multi-city aircraft info from first leg
      aircraftInfo:
        typeof firstLeg.aircraft === "object" && firstLeg.aircraft !== null
          ? firstLeg.aircraft
          : null,
      seatLayout: firstLeg.aircraft?.seatLayout || null,
      aircraftId: firstLeg.aircraft?.aircraftId || null,
      aircraftCode: firstLeg.aircraft?.aircraftCode || null,
      type: "MULTI_CITY",
      businessName: flight.businessName || firstLeg.businessName,

      // Route information
      routeInfo: flight.legs
        .map(
          (leg) =>
            `${leg.departureAirport?.airportCode} → ${leg.arrivalAirport?.airportCode}`
        )
        .join(" → "),
    };
  } else if (isRoundTrip) {
    // Handle round-trip itinerary with legs array
    const outbound = flight.legs[0];
    const returnFlight = flight.legs[1];

    processedFlight = {
      // Basic flight info
      id: flight.itineraryId,
      flightId: flight.itineraryId || flight.flightId || Date.now().toString(),
      flightNumber: `${outbound.flightNumber || "N/A"} / ${
        returnFlight.flightNumber || "N/A"
      }`,

      // Airline info
      airline: outbound.airline?.airlineName || outbound.airlineName || "N/A",
      airlineName:
        outbound.airline?.airlineName || outbound.airlineName || "N/A",
      airlineLogo:
        outbound.airline?.thumbnail ||
        outbound.airline?.logo ||
        "/placeholder.svg",

      // Round-trip specific data
      isRoundTrip: true,
      tripType: "ROUND_TRIP",
      outboundFlight: normalizeFlightData(outbound),
      returnFlight: normalizeFlightData(returnFlight),
      totalPrice: flight.totalPrice || 0,

      // Use outbound for primary display
      departureTime: outbound.departureTime,
      departureAirport: {
        ...outbound.departureAirport,
        code: outbound.departureAirport?.airportCode,
        name: outbound.departureAirport?.airportName,
        city:
          outbound.departureAirport?.city ||
          outbound.departureAirport?.cityNames?.[0] ||
          outbound.departureCity,
        airportName: outbound.departureAirport?.airportName,
        gate: outbound.departureAirport?.gates?.[0]?.gateName || "TBA",
        terminal: outbound.departureAirport?.gates?.[0]?.terminal || "TBA",
      },
      from: outbound.departureAirport?.airportCode || outbound.from || "N/A",
      fromCode:
        outbound.departureAirport?.airportCode || outbound.fromCode || "N/A",

      arrivalTime: returnFlight.arrivalTime,
      arrivalAirport: {
        ...returnFlight.arrivalAirport,
        code: returnFlight.arrivalAirport?.airportCode,
        name: returnFlight.arrivalAirport?.airportName,
        city:
          returnFlight.arrivalAirport?.city ||
          returnFlight.arrivalAirport?.cityNames?.[0] ||
          returnFlight.arrivalCity,
        airportName: returnFlight.arrivalAirport?.airportName,
        gate: returnFlight.arrivalAirport?.gates?.[0]?.gateName || "TBA",
        terminal: returnFlight.arrivalAirport?.gates?.[0]?.terminal || "TBA",
      },
      to: returnFlight.arrivalAirport?.airportCode || returnFlight.to || "N/A",
      toCode:
        returnFlight.arrivalAirport?.airportCode ||
        returnFlight.toCode ||
        "N/A",

      // Combined duration
      duration: (outbound.duration || 0) + (returnFlight.duration || 0),

      // Travel classes
      flightTravelClasses: outbound.flightTravelClasses || [],

      // Status and availability
      status: outbound.status || "Scheduled",
      availableSeats: Math.min(
        outbound.availableSeats || 0,
        returnFlight.availableSeats || 0
      ),
      totalSeats: Math.min(
        outbound.totalSeats || 0,
        returnFlight.totalSeats || 0
      ),
    };
  } else if (isRoundTripDirect) {
    const outbound = flight.outboundFlight;
    const returnFlight = flight.returnFlight;

    processedFlight = {
      // Basic flight info
      id: flight.itineraryId,
      flightId: flight.itineraryId || flight.flightId || Date.now().toString(),
      flightNumber:
        flight.flightNumber ||
        `${outbound.flightNumber || "N/A"} / ${
          returnFlight.flightNumber || "N/A"
        }`,

      // Airline info
      airline:
        flight.airline ||
        outbound.airline?.airlineName ||
        outbound.airlineName ||
        "N/A",
      airlineName:
        flight.airlineName ||
        outbound.airline?.airlineName ||
        outbound.airlineName ||
        "N/A",
      airlineLogo:
        flight.airlineLogo ||
        outbound.airline?.thumbnail ||
        outbound.airline?.logo ||
        "/placeholder.svg",

      // Round-trip specific data
      isRoundTrip: true,
      tripType: "ROUND_TRIP",
      // Preserve outbound/return data directly without recursive normalization
      outboundFlight: {
        ...outbound,
        // Ensure key fields are preserved
        departureDate: outbound.departureDate,
        arrivalDate: outbound.arrivalDate,
        departureTime: outbound.departureTime,
        arrivalTime: outbound.arrivalTime,
        departureAirport: outbound.departureAirport,
        arrivalAirport: outbound.arrivalAirport,
        from: outbound.from,
        to: outbound.to,
      },
      returnFlight: {
        ...returnFlight,
        // Ensure key fields are preserved
        departureDate: returnFlight.departureDate,
        arrivalDate: returnFlight.arrivalDate,
        departureTime: returnFlight.departureTime,
        arrivalTime: returnFlight.arrivalTime,
        departureAirport: returnFlight.departureAirport,
        arrivalAirport: returnFlight.arrivalAirport,
        from: returnFlight.from,
        to: returnFlight.to,
      },
      totalPrice: flight.totalPrice || flight.priceNumeric || 0,

      // Use outbound for primary display
      departureTime: outbound.departureTime,
      departureDate: outbound.departureDate,

      departureAirport: {
        ...outbound.departureAirport,
        code:
          outbound.departureAirport?.code ||
          outbound.departureAirport?.airportCode,
        name:
          outbound.departureAirport?.name ||
          outbound.departureAirport?.airportName,
        city:
          outbound.departureAirport?.city ||
          outbound.departureAirport?.cityNames?.[0] ||
          outbound.departureCity,
        airportName: outbound.departureAirport?.airportName,
        gate: outbound.departureAirport?.gates?.[0]?.gateName || "TBA",
        terminal: outbound.departureAirport?.gates?.[0]?.terminal || "TBA",
      },
      from: outbound.departureAirport?.airportCode || outbound.from || "N/A",
      fromCode:
        outbound.departureAirport?.airportCode || outbound.fromCode || "N/A",

      arrivalTime: returnFlight.arrivalTime,
      arrivalDate: returnFlight.arrivalDate,
      arrivalAirport: {
        ...returnFlight.arrivalAirport,
        code:
          returnFlight.arrivalAirport?.code ||
          returnFlight.arrivalAirport?.airportCode,
        name:
          returnFlight.arrivalAirport?.name ||
          returnFlight.arrivalAirport?.airportName,
        city:
          returnFlight.arrivalAirport?.city ||
          returnFlight.arrivalAirport?.cityNames?.[0] ||
          returnFlight.arrivalCity,
        airportName:
          returnFlight.arrivalAirport?.name ||
          returnFlight.arrivalAirport?.airportName,
        gate: returnFlight.arrivalAirport?.gates?.[0]?.gateName || "TBA",
        terminal: returnFlight.arrivalAirport?.gates?.[0]?.terminal || "TBA",
      },
      to:
        returnFlight.arrivalAirport?.code ||
        returnFlight.arrivalAirport?.airportCode ||
        "N/A",
      toCode:
        returnFlight.arrivalAirport?.airportCode ||
        returnFlight.toCode ||
        "N/A",

      // Combined duration
      duration: (outbound.duration || 0) + (returnFlight.duration || 0),

      // Travel classes
      flightTravelClasses: (outbound.flightTravelClasses || []).map((tc) => ({
        ...tc,
        availableSeats: tc.availableSeats || 0,
      })),

      // Status and availability
      status: flight.status || outbound.status || "Scheduled",
      availableSeats:
        flight.availableSeats ||
        Math.min(
          outbound.availableSeats || 0,
          returnFlight.availableSeats || 0
        ),
      totalSeats:
        flight.totalSeats ||
        Math.min(outbound.totalSeats || 0, returnFlight.totalSeats || 0),

      // Additional fields
      gate:
        outbound.departureAirport?.gates?.[0]?.gateName ||
        flight.gate ||
        outbound.gate,
      terminal:
        outbound.departureAirport?.gates?.[0]?.terminal ||
        flight.terminal ||
        outbound.terminal,
      stops: flight.stops || outbound.stops,
      stopsList: flight.stopsList || outbound.stopsList || [],
      aircraft: flight.aircraft || outbound.aircraft,
      type: flight.type || outbound.type,
      businessName: flight.businessName || outbound.businessName,
    };
  } else {
    // Handle single flight (one-way or direct flight)
    processedFlight = {
      // Basic flight info
      id: flight.itineraryId || flight.id || flight.flightId,
      flightId: flight.flightId || flight.id || Date.now().toString(),
      flightNumber: flight.flightNumber || "N/A",

      // Airline info
      airline: flight.airline?.airlineName || flight.airlineName || "N/A",
      airlineName: flight.airline?.airlineName || flight.airlineName || "N/A",
      airlineLogo:
        flight.airline?.thumbnail ||
        flight.airline?.logo ||
        flight.airlineLogo ||
        "/placeholder.svg",

      // Departure info
      departureTime: flight.departureTime,
      departureAirport: {
        ...flight.departureAirport,
        code: flight.departureAirport?.airportCode,
        name: flight.departureAirport?.airportName,
        city:
          flight.departureAirport?.city ||
          flight.departureAirport?.cityNames?.[0] ||
          flight.departureCity,
        airportName: flight.departureAirport?.airportName,
        gate: flight.departureAirport?.gates?.[0]?.gateName || "TBA",
        terminal: flight.departureAirport?.gates?.[0]?.terminal || "TBA",
      },
      from: flight.departureAirport?.airportCode || flight.from || "N/A",
      fromCode:
        flight.departureAirport?.airportCode || flight.fromCode || "N/A",

      // Arrival info
      arrivalTime: flight.arrivalTime,
      arrivalAirport: {
        ...flight.arrivalAirport,
        code: flight.arrivalAirport?.airportCode,
        name: flight.arrivalAirport?.airportName,
        city:
          flight.arrivalAirport?.city ||
          flight.arrivalAirport?.cityNames?.[0] ||
          flight.arrivalCity,
        airportName: flight.arrivalAirport?.airportName,
        gate: flight.arrivalAirport?.gates?.[0]?.gateName || "TBA",
        terminal: flight.arrivalAirport?.gates?.[0]?.terminal || "TBA",
      },

      // Flight details
      duration: flight.duration || 0,
      stops: flight.stops || 0,
      stopsList: flight.stopsList || [],

      // Aircraft info from API
      aircraft:
        typeof flight.aircraft === "object" && flight.aircraft !== null
          ? flight.aircraft.aircraftName ||
            flight.aircraft.aircraftCode ||
            "N/A"
          : flight.aircraft || "N/A",

      // Complete aircraft object for reference
      aircraftInfo:
        typeof flight.aircraft === "object" ? flight.aircraft : null,

      // Seat layout and capacity info from API aircraft object
      seatLayout:
        typeof flight.aircraft === "object" && flight.aircraft !== null
          ? flight.aircraft.seatLayout
          : flight.seatLayout || "N/A",
      totalSeats:
        typeof flight.aircraft === "object" && flight.aircraft !== null
          ? flight.aircraft.totalSeats
          : flight.totalSeats ||
            (flight.flightTravelClasses
              ? flight.flightTravelClasses.reduce(
                  (total, tc) => total + (tc.capacity || 0),
                  0
                )
              : 0),
      availableSeatsByClass:
        flight.flightTravelClasses?.reduce((acc, tc) => {
          acc[tc.travelClass?.className || "Unknown"] = tc.availableSeats || 0;
          return acc;
        }, {}) || {},

      // Pricing
      price: flight.priceNumeric || flight.price || 0,
      basePrice: flight.priceNumeric || flight.price || 0,
      totalPrice: flight.totalPrice || flight.priceNumeric || flight.price || 0,

      // Status and availability
      status: flight.status || "N/A",
      availableSeats: flight.availableSeats || 0,

      // Additional info
      gate:
        flight.departureAirport?.gates?.[0]?.gateName || flight.gate || "TBA",
      terminal:
        flight.departureAirport?.gates?.[0]?.terminal ||
        flight.terminal ||
        "TBA",
      type: flight.type || "ONE_WAY",

      // Travel classes - only use real data from API, no fallback mock data
      flightTravelClasses:
        flight.flightTravelClasses && flight.flightTravelClasses.length > 0
          ? flight.flightTravelClasses.map((tc) => ({
              ...tc,
              availableSeats: tc.availableSeats || 0,
            }))
          : [],

      // Additional fields for compatibility
      businessName: flight.businessName || "",
    };
  }

  // Build common properties
  processedFlight.departure = {
    city:
      processedFlight.departureAirport?.cityNames?.[0] ||
      processedFlight.departureAirport?.airportName ||
      processedFlight.from ||
      "N/A",
    airportName: processedFlight.departureAirport?.airportName || "N/A",
    code: processedFlight.fromCode || "N/A",
    time: formatTimeVN(processedFlight.departureTime),
    date: formatDateVN(processedFlight.departureTime),
  };

  processedFlight.arrival = {
    city:
      processedFlight.arrivalAirport?.cityNames?.[0] ||
      processedFlight.arrivalAirport?.airportName ||
      processedFlight.to ||
      "N/A",
    airportName: processedFlight.arrivalAirport?.airportName || "N/A",
    code: processedFlight.toCode || "N/A",
    time: formatTimeVN(processedFlight.arrivalTime),
    date: formatDateVN(processedFlight.arrivalTime),
  };

  return processedFlight;
};

// Helper function to format stops display
const formatStops = (stops) => {
  if (!stops) return "N/A";

  if (typeof stops === "string") {
    if (
      stops.toLowerCase() === "non_stop" ||
      stops.toLowerCase() === "bay thẳng"
    ) {
      return "Bay thẳng";
    }
    return stops;
  }

  if (Array.isArray(stops)) {
    if (stops.length === 0) return "Bay thẳng";
    return `${stops.length} điểm dừng`;
  }

  if (typeof stops === "number") {
    if (stops === 0) return "Bay thẳng";
    return `${stops} điểm dừng`;
  }

  return stops;
};

// FareOption Component - Professional Design
const FareOption = ({
  fare,
  isSelected,
  onSelect,
  onProceedToBooking,
  isMultiCity = false,
}) => {
  // Parse benefits from database
  const parseBenefits = (benefits) => {
    if (!benefits) return [];
    return benefits.split(",").map((benefit) => benefit.trim());
  };

  const benefits = parseBenefits(fare.travelClass?.benefits);
  const isEconomy = fare.travelClass?.className
    ?.toLowerCase()
    .includes("economy");
  const isBusiness = fare.travelClass?.className
    ?.toLowerCase()
    .includes("business");
  const isFirst = fare.travelClass?.className?.toLowerCase().includes("first");

  // Get class-specific styling
  const getClassStyling = () => {
    if (isFirst)
      return {
        bgColor: "bg-gradient-to-br from-purple-50 to-indigo-50",
        borderColor: "border-purple-200",
        selectedBg: "bg-gradient-to-br from-purple-100 to-indigo-100",
        accentColor: "text-purple-700",
      };
    if (isBusiness)
      return {
        bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
        borderColor: "border-blue-200",
        selectedBg: "bg-gradient-to-br from-blue-100 to-cyan-100",
        accentColor: "text-blue-700",
      };
    return {
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
      borderColor: "border-green-200",
      selectedBg: "bg-gradient-to-br from-green-100 to-emerald-100",
      accentColor: "text-green-700",
    };
  };

  const styling = getClassStyling();

  return (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
        isSelected
          ? `ring-3 ring-blue-500 shadow-2xl ${styling.selectedBg} ${styling.borderColor}`
          : `hover:shadow-lg ${styling.bgColor} ${styling.borderColor}`
      }`}
      onClick={isSelected ? onProceedToBooking : onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CardTitle className={`text-xl font-bold ${styling.accentColor}`}>
              {fare.travelClass?.className || "N/A"}
            </CardTitle>
          </div>
          {isBusiness && (
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-orange-400 to-red-500 text-white border-0"
            >
              Phổ biến
            </Badge>
          )}
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {formatCurrencyVND(fare.price)}
          </div>
          <div className="text-sm text-gray-500">
            {fare.availableSeats} ghế còn trống
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Multi-city segment breakdown */}
        {isMultiCity && fare.segmentBreakdown && (
          <div className="mb-4 p-3 bg-white/60 rounded-lg border border-white/40">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Chi tiết từng chặng:
            </div>
            <div className="space-y-1">
              {fare.segmentBreakdown.map((segment, index) => (
                <div
                  key={index}
                  className="flex justify-between text-xs text-gray-600"
                >
                  <span className="flex items-center gap-1">
                    <span className="font-mono bg-gray-200 px-1 rounded">
                      {segment.flightNumber}
                    </span>
                    {segment.segment}
                  </span>
                  <span className="font-medium">
                    {formatCurrencyVND(segment.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Benefits Section */}
        <div className="space-y-3 mb-4">
          <h4 className="font-semibold text-gray-800 text-sm">
            Quyền lợi chính:
          </h4>
          <div className="space-y-2">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700 leading-relaxed">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Policy Section */}
        <div className="space-y-2 mb-4 p-3 bg-white/40 rounded-lg">
          <h4 className="font-semibold text-gray-800 text-sm mb-2">
            Chính sách:
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              {fare.travelClass?.changeable ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <X className="w-3 h-3 text-red-500" />
              )}
              <span
                className={
                  fare.travelClass?.changeable
                    ? "text-gray-700"
                    : "text-gray-400 line-through"
                }
              >
                Đổi vé
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {fare.travelClass?.refundable ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <X className="w-3 h-3 text-red-500" />
              )}
              <span
                className={
                  fare.travelClass?.refundable
                    ? "text-gray-700"
                    : "text-gray-400 line-through"
                }
              >
                Hoàn tiền
              </span>
            </div>
          </div>
          {fare.travelClass?.cancellationFee > 0 && (
            <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
              <span className="font-medium">Phí hủy:</span>{" "}
              {formatCurrencyVND(fare.travelClass.cancellationFee)}
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          className={`w-full font-semibold transition-all duration-200 ${
            isSelected
              ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
              : "bg-white border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700 dark:text-white"
          }`}
          variant={isSelected ? "default" : "outline"}
        >
          {isSelected ? "Tiếp tục đặt vé" : "Chọn hạng vé"}
        </Button>
      </CardContent>
    </Card>
  );
};

// FareSummary Component
const FareSummary = ({ fare, onProceedToBooking }) => {
  if (!fare) return null;

  return (
    <Card className="bg-blue-50 dark:bg-gray-600 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800 dark:text-white">
          Tóm tắt đặt vé
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Hạng vé:</span>
            <span>{fare.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Giá vé:</span>
            <span className="text-xl font-bold text-blue-600 dark:text-white">
              {formatCurrencyVND(fare.price)}
            </span>
          </div>
          <Button
            className="w-full bg-blue-600 dark:text-white hover:bg-blue-700"
            onClick={onProceedToBooking}
          >
            Xác nhận và đặt vé
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const FlightDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [selectedFare, setSelectedFare] = useState(null);
  const [outboundFare, setOutboundFare] = useState(null);
  const [returnFare, setReturnFare] = useState(null);
  const [flightData, setFlightData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fareSelectionStep, setFareSelectionStep] = useState("outbound");
  const [_selectedFares, _setSelectedFares] = useState({});
  const [routeReviews, setRouteReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewSearch, setReviewSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Filter and sort reviews for modal
  const getFilteredAndSortedReviews = () => {
    let filtered = [...routeReviews];

    // Filter by rating
    if (reviewFilter !== "all") {
      const rating = parseInt(reviewFilter);
      filtered = filtered.filter((review) => review.rating === rating);
    }

    // Filter by search term
    if (reviewSearch.trim()) {
      const searchTerm = reviewSearch.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.comment.toLowerCase().includes(searchTerm) ||
          review.userName.toLowerCase().includes(searchTerm)
      );
    }

    // Sort reviews
    filtered.sort((a, b) => {
      switch (reviewSort) {
        case "newest":
          return new Date(b.reviewDate) - new Date(a.reviewDate);
        case "oldest":
          return new Date(a.reviewDate) - new Date(b.reviewDate);
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Get paginated reviews
  const getPaginatedReviews = () => {
    const filteredReviews = getFilteredAndSortedReviews();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredReviews.slice(startIndex, endIndex);
  };

  // Get total pages
  const getTotalPages = () => {
    return Math.ceil(getFilteredAndSortedReviews().length / itemsPerPage);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [reviewFilter, reviewSort, reviewSearch]);

  // Prepare data for FlightRouteMap component
  const prepareMapData = (flight) => {
    if (!flight) {
      return { processedSearchData: null, legs: [], coordsMap: {} };
    }

    const flightType = detectFlightType(flight);
    const { isRoundTrip, isRoundTripDirect, isMultiCity } = flightType;

    let processedSearchData = {
      tripType: isMultiCity
        ? "multi_city"
        : isRoundTrip
        ? "round_trip"
        : "one_way",
    };

    let legs = [];
    let coordsMap = {};

    if (isMultiCity) {
      // Multi-city: each leg is a separate flight
      legs = flight.legs.map((leg, index) => ({
        flight: {
          flightNumber: leg.flightNumber || `Flight ${index + 1}`,
          airlineName: leg.airlineName || leg.airline?.airlineName,
          airlineLogo: leg.airlineLogo || leg.airline?.thumbnail,
          duration: leg.duration,
          departureTime: leg.departureTime,
          arrivalTime: leg.arrivalTime,
          aircraft: leg.aircraft || leg.aircraftName,
          airline: leg.airline,
        },
        dep: leg.departureAirport || {
          code: leg.departureAirportCode || leg.from,
          airportName: leg.departureAirportName || `Airport ${leg.from}`,
          cityNames: [
            leg.departureCity || leg.departureAirportCode || leg.from,
          ],
          airportCode: leg.departureAirportCode || leg.from,
        },
        arr: leg.arrivalAirport || {
          code: leg.arrivalAirportCode || leg.to,
          airportName: leg.arrivalAirportName || `Airport ${leg.to}`,
          cityNames: [leg.arrivalCity || leg.arrivalAirportCode || leg.to],
          airportCode: leg.arrivalAirportCode || leg.to,
        },
        stops: Array.isArray(leg.stops) ? leg.stops : [],
        direction: `Chặng ${index + 1}`,
        segments: [],
      }));

      // Build coordsMap for multi-city
      legs.forEach((leg) => {
        if (leg.dep.code) {
          coordsMap[leg.dep.code] = {
            lat: leg.dep.lat || leg.dep.latitude,
            lon: leg.dep.lon || leg.dep.longitude,
            name: leg.dep.airportName,
            code: leg.dep.code,
          };
        }
        if (leg.arr.code) {
          coordsMap[leg.arr.code] = {
            lat: leg.arr.lat || leg.arr.latitude,
            lon: leg.arr.lon || leg.arr.longitude,
            name: leg.arr.airportName,
            code: leg.arr.code,
          };
        }
        // Add stop airports
        leg.stops.forEach((stop) => {
          if (stop.airportCode) {
            coordsMap[stop.airportCode] = {
              lat: stop.lat || stop.latitude,
              lon: stop.lon || stop.longitude,
              name: stop.airportName,
              code: stop.airportCode,
            };
          }
        });
      });

      // Create segments for multi-city legs
      legs.forEach((leg) => {
        if (leg.stops.length === 0) {
          // Direct flight - create single segment from dep to arr
          leg.segments.push({
            from: leg.dep,
            to: leg.arr,
          });
        } else {
          // Flight with stops - create segments between each stop
          let current = leg.dep;
          leg.stops.forEach((stop) => {
            leg.segments.push({
              from: current,
              to: {
                code: stop.airportCode,
                airportName: stop.airportName,
                cityNames: [stop.cityName || stop.airportCode],
              },
            });
            current = {
              code: stop.airportCode,
              airportName: stop.airportName,
              cityNames: [stop.cityName || stop.airportCode],
            };
          });
          // Final segment from last stop to arrival
          leg.segments.push({
            from: current,
            to: leg.arr,
          });
        }
      });
    } else if (isRoundTrip) {
      // Round-trip: outbound and inbound legs
      const outboundFlight = flight.outboundFlight || flight.legs?.[0];
      const returnFlight = flight.returnFlight || flight.legs?.[1];

      if (outboundFlight) {
        legs.push({
          flight: {
            flightNumber: outboundFlight.flightNumber,
            airlineName:
              outboundFlight.airlineName || outboundFlight.airline?.airlineName,
            airlineLogo:
              outboundFlight.airlineLogo || outboundFlight.airline?.thumbnail,
            duration: outboundFlight.duration,
            departureTime: outboundFlight.departureTime,
            departureDate: outboundFlight.departureDate,
            arrivalTime: outboundFlight.arrivalTime,
            aircraft: outboundFlight.aircraft,
            airline: outboundFlight.airline,
          },
          dep: outboundFlight.departureAirport || {
            code: outboundFlight.departureAirportCode || outboundFlight.from,
            airportName:
              outboundFlight.departureAirportName ||
              `Airport ${outboundFlight.from}`,
            cityNames: [
              outboundFlight.departureCity ||
                outboundFlight.departureAirportCode ||
                outboundFlight.from,
            ],
            airportCode:
              outboundFlight.departureAirportCode || outboundFlight.from,
          },
          arr: outboundFlight.arrivalAirport || {
            code: outboundFlight.arrivalAirportCode || outboundFlight.to,
            airportName:
              outboundFlight.arrivalAirportName ||
              `Airport ${outboundFlight.to}`,
            cityNames: [
              outboundFlight.arrivalCity ||
                outboundFlight.arrivalAirportCode ||
                outboundFlight.to,
            ],
            airportCode: outboundFlight.arrivalAirportCode || outboundFlight.to,
          },
          stops: Array.isArray(outboundFlight.stops)
            ? outboundFlight.stops
            : [],
          direction: "Outbound",
          segments: [],
        });
      }

      if (returnFlight) {
        legs.push({
          flight: {
            flightNumber: returnFlight.flightNumber,
            airlineName:
              returnFlight.airlineName || returnFlight.airline?.airlineName,
            airlineLogo:
              returnFlight.airlineLogo || returnFlight.airline?.thumbnail,
            duration: returnFlight.duration,
            departureTime: returnFlight.departureTime,
            departureDate: returnFlight.departureDate,
            arrivalTime: returnFlight.arrivalTime,
            aircraft: returnFlight.aircraft,
            airline: returnFlight.airline,
          },
          dep: returnFlight.departureAirport || {
            code: returnFlight.departureAirportCode || returnFlight.from,
            airportName:
              returnFlight.departureAirportName ||
              `Airport ${returnFlight.from}`,
            cityNames: [
              returnFlight.departureCity ||
                returnFlight.departureAirportCode ||
                returnFlight.from,
            ],
            airportCode: returnFlight.departureAirportCode || returnFlight.from,
          },
          arr: returnFlight.arrivalAirport || {
            code: returnFlight.arrivalAirportCode || returnFlight.to,
            airportName:
              returnFlight.arrivalAirportName || `Airport ${returnFlight.to}`,
            cityNames: [
              returnFlight.arrivalCity ||
                returnFlight.arrivalAirportCode ||
                returnFlight.to,
            ],
            airportCode: returnFlight.arrivalAirportCode || returnFlight.to,
          },
          stops: Array.isArray(returnFlight.stops) ? returnFlight.stops : [],
          direction: "Inbound",
          segments: [],
        });
      }

      // Build coordsMap for round-trip
      legs.forEach((leg) => {
        if (leg.dep.code) {
          coordsMap[leg.dep.code] = {
            lat: leg.dep.lat || leg.dep.latitude,
            lon: leg.dep.lon || leg.dep.longitude,
            name: leg.dep.airportName,
            code: leg.dep.code,
          };
        }
        if (leg.arr.code) {
          coordsMap[leg.arr.code] = {
            lat: leg.arr.lat || leg.arr.latitude,
            lon: leg.arr.lon || leg.arr.longitude,
            name: leg.arr.airportName,
            code: leg.arr.code,
          };
        }
        // Add stop airports
        leg.stops.forEach((stop) => {
          if (stop.airportCode) {
            coordsMap[stop.airportCode] = {
              lat: stop.lat || stop.latitude,
              lon: stop.lon || stop.longitude,
              name: stop.airportName,
              code: stop.airportCode,
            };
          }
        });
      });

      // Create segments for round-trip legs
      legs.forEach((leg) => {
        if (leg.stops.length === 0) {
          // Direct flight - create single segment from dep to arr
          leg.segments.push({
            from: leg.dep,
            to: leg.arr,
          });
        } else {
          // Flight with stops - create segments between each stop
          let current = leg.dep;
          leg.stops.forEach((stop) => {
            leg.segments.push({
              from: current,
              to: {
                code: stop.airportCode,
                airportName: stop.airportName,
                cityNames: [stop.cityName || stop.airportCode],
              },
            });
            current = {
              code: stop.airportCode,
              airportName: stop.airportName,
              cityNames: [stop.cityName || stop.airportCode],
            };
          });
          // Final segment from last stop to arrival
          leg.segments.push({
            from: current,
            to: leg.arr,
          });
        }
      });
    } else {
      // One-way flight
      legs = [
        {
          flight: {
            flightNumber: flight.flightNumber,
            airlineName: flight.airlineName || flight.airline?.airlineName,
            airlineLogo: flight.airlineLogo || flight.airline?.thumbnail,
            duration: flight.duration,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            aircraft: flight.aircraft,
            airline: flight.airline,
          },
          dep: flight.departureAirport || {
            code: flight.departureAirportCode || flight.from,
            airportName:
              flight.departureAirportName || `Airport ${flight.from}`,
            cityNames: [
              flight.departureCity ||
                flight.departureAirportCode ||
                flight.from,
            ],
            airportCode: flight.departureAirportCode || flight.from,
          },
          arr: flight.arrivalAirport || {
            code: flight.arrivalAirportCode || flight.to,
            airportName: flight.arrivalAirportName || `Airport ${flight.to}`,
            cityNames: [
              flight.arrivalCity || flight.arrivalAirportCode || flight.to,
            ],
            airportCode: flight.arrivalAirportCode || flight.to,
          },
          stops: Array.isArray(flight.stops) ? flight.stops : [],
          direction: "Outbound",
          segments: [],
        },
      ];

      // Build coordsMap for one-way
      const leg = legs[0];
      if (leg.dep.code) {
        coordsMap[leg.dep.code] = {
          lat: leg.dep.lat || leg.dep.latitude,
          lon: leg.dep.lon || leg.dep.longitude,
          name: leg.dep.airportName,
          code: leg.dep.code,
        };
      }
      if (leg.arr.code) {
        coordsMap[leg.arr.code] = {
          lat: leg.arr.lat || leg.arr.latitude,
          lon: leg.arr.lon || leg.arr.longitude,
          name: leg.arr.airportName,
          code: leg.arr.code,
        };
      }
      // Add stop airports
      leg.stops.forEach((stop) => {
        if (stop.airportCode) {
          coordsMap[stop.airportCode] = {
            lat: stop.lat || stop.latitude,
            lon: stop.lon || stop.longitude,
            name: stop.airportName,
            code: stop.airportCode,
          };
        }
      });

      // Create segments for the leg
      if (leg.stops.length === 0) {
        // Direct flight - create single segment from dep to arr
        leg.segments.push({
          from: leg.dep,
          to: leg.arr,
        });
      } else {
        // Flight with stops - create segments between each stop
        let current = leg.dep;
        leg.stops.forEach((stop) => {
          leg.segments.push({
            from: current,
            to: {
              code: stop.airportCode,
              airportName: stop.airportName,
              cityNames: [stop.cityName || stop.airportCode],
            },
          });
          current = {
            code: stop.airportCode,
            airportName: stop.airportName,
            cityNames: [stop.cityName || stop.airportCode],
          };
        });
        // Final segment from last stop to arrival
        leg.segments.push({
          from: current,
          to: leg.arr,
        });
      }
    }

    return { processedSearchData, legs, coordsMap };
  };

  // Stepper configuration for round-trip
  const roundTripSteps = [
    { title: "Chọn vé đi" },
    { title: "Chọn vé về" },
    { title: "Xác nhận" },
  ];

  // Get flight data from location state or fetch from API
  useEffect(() => {
    const getFlightData = async () => {
      try {
        setLoading(true);

        // First try to get data from location state
        if (
          location.state &&
          (location.state.flight || location.state.flightData)
        ) {
          const flight = location.state.flight || location.state.flightData;

          let flightToProcess = flight;

          // If flight has originalFlight, use that
          if (flight.originalFlight) {
            flightToProcess = flight.originalFlight;
          }

          // If flight has originalItinerary, use that for multi-city
          if (flight.originalItinerary && flight.isMultiCity) {
            flightToProcess = flight.originalItinerary;
          }

          // Transform flight data to match expected structure
          const transformedFlight = normalizeFlightData(flightToProcess);
          setFlightData(transformedFlight);
          setLoading(false);
          return;
        }

        // If no state data, try to fetch from API using flight ID (only if id is a valid number)
        if (id && !isNaN(Number(id))) {
          try {
            const response = await flightApi.getFlightById(id);

            if (response.success && response.data) {
              const transformedFlight = normalizeFlightData(response.data);
              setFlightData(transformedFlight);
            } else {
              console.error("API response unsuccessful:", response);
              setFlightData(null);
            }
          } catch (apiError) {
            console.error("API fetch error:", apiError);
            setFlightData(null);
          }
        } else {
          // Fallback: Try to load from localStorage
          console.log("Trying to load flight data from localStorage...");
          try {
            const savedFlightData = localStorage.getItem("selectedFlight");
            if (savedFlightData) {
              const parsedFlightData = JSON.parse(savedFlightData);
              console.log(
                "📦 Loaded flight data from localStorage:",
                parsedFlightData
              );

              // Transform to match expected structure if needed
              const transformedFlight = normalizeFlightData(parsedFlightData);
              setFlightData(transformedFlight);
            } else {
              console.error("No flight data in localStorage");
              setFlightData(null);
            }
          } catch (localStorageError) {
            console.error(
              "Error loading from localStorage:",
              localStorageError
            );
            setFlightData(null);
          }
        }
      } catch (error) {
        console.error("Error getting flight data:", error);
        setFlightData(null);
      } finally {
        setLoading(false);
      }
    };

    getFlightData();
  }, [id, location.state]);

  // Fetch reviews for the route
  useEffect(() => {
    const fetchRouteReviews = async () => {
      if (!flightData) return;

      try {
        setReviewsLoading(true);

        // Get departure and arrival codes
        let departureCode, arrivalCode;

        if (flightData.isMultiCity && flightData.legs) {
          // For multi-city, use the first leg's route
          departureCode =
            flightData.legs[0]?.departureAirport?.airportCode ||
            flightData.legs[0]?.from;
          arrivalCode =
            flightData.legs[0]?.arrivalAirport?.airportCode ||
            flightData.legs[0]?.to;
        } else {
          // For one-way or round-trip
          departureCode =
            flightData.departure?.code ||
            flightData.departureAirport?.airportCode;
          arrivalCode = flightData.arrivalAirport?.airportCode;
        }

        if (departureCode && arrivalCode) {
          const response = await reviewApi.getReviewsByRoute(
            departureCode,
            arrivalCode
          );

          if (response.success && response.data) {
            setRouteReviews(response.data);
          }
        }
      } catch (error) {
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchRouteReviews();
  }, [flightData]);

  // Load selected fares from localStorage when component mounts
  useEffect(() => {
    if (flightData) {
      const savedSelectedFare = localStorage.getItem("selectedFare");
      const savedOutboundFare = localStorage.getItem("selectedOutboundFare");
      const savedReturnFare = localStorage.getItem("selectedReturnFare");

      if (flightData.isRoundTrip) {
        if (savedOutboundFare) {
          setOutboundFare(parseInt(savedOutboundFare, 10));
          if (savedReturnFare) {
            setReturnFare(parseInt(savedReturnFare, 10));
            setFareSelectionStep("confirm");
          } else {
            setFareSelectionStep("return");
          }
        }
      } else {
        if (savedSelectedFare) {
          setSelectedFare(parseInt(savedSelectedFare, 10));
        }
      }
    }
  }, [flightData]);

  const handleSelectFare = (fareId) => {
    if (flightData?.isMultiCity) {
      // Multi-city uses individual segment selection now
      // This function is not used for multi-city anymore
    } else if (flightData?.isRoundTrip) {
      // Handle round-trip fare selection
      if (fareSelectionStep === "outbound") {
        setOutboundFare(fareId);
        setFareSelectionStep("return");
        // Lưu outbound fare vào localStorage
        localStorage.setItem("selectedOutboundFare", fareId);
      } else {
        setReturnFare(fareId);
        setFareSelectionStep("confirm");
        // Lưu return fare vào localStorage
        localStorage.setItem("selectedReturnFare", fareId);
      }
    } else {
      // For one-way, use single fare selection
      setSelectedFare(fareId);
      // Lưu selectedFare vào localStorage
      localStorage.setItem("selectedFare", fareId);
    }
  };

  const handleProceedToBooking = (
    passedFlightData = null,
    passedSelectedFare = null
  ) => {
    try {
      // Use passed parameters if available, otherwise fall back to state
      const currentFlightData = passedFlightData || flightData;
      const currentSelectedFare = passedSelectedFare || selectedFare;

      console.log("🔧 handleProceedToBooking called with:", {
        passedFlightData: !!passedFlightData,
        passedSelectedFare: !!passedSelectedFare,
        currentFlightData: currentFlightData?.id,
        currentSelectedFare: currentSelectedFare,
      });

      // QUICK FIX: Check if we already have good data in localStorage
      const existingSelectedFlight = JSON.parse(
        localStorage.getItem("selectedFlight") || "{}"
      );
      console.log("🔍 Existing selectedFlight:", existingSelectedFlight);

      // If existing data is good (not N/A), preserve it and just update classes/price
      if (
        existingSelectedFlight.type === "ROUND_TRIP" &&
        existingSelectedFlight.outboundFlight?.departureTime &&
        existingSelectedFlight.outboundFlight?.departureTime !== "N/A" &&
        existingSelectedFlight.outboundFlight?.to &&
        existingSelectedFlight.outboundFlight?.to !== "N/A"
      ) {
        console.log("✅ Preserving existing good round-trip data");

        // Just update the selected classes and pricing
        if (outboundFare && returnFare) {
          const outboundTravelClass =
            currentFlightData.outboundFlight?.flightTravelClasses?.find(
              (tc) => tc.id === outboundFare
            );
          const returnTravelClass =
            currentFlightData.returnFlight?.flightTravelClasses?.find(
              (tc) => tc.id === returnFare
            );
          const totalPrice =
            (outboundTravelClass?.price || 0) + (returnTravelClass?.price || 0);

          existingSelectedFlight.outboundFlight.selectedClass =
            outboundTravelClass;
          existingSelectedFlight.returnFlight.selectedClass = returnTravelClass;
          existingSelectedFlight.totalPrice = totalPrice;
          existingSelectedFlight.formattedTotalPrice =
            formatCurrencyVND(totalPrice);
          existingSelectedFlight.bookingDate = formatDateTimeVN(new Date());
        }

        localStorage.setItem(
          "selectedFlight",
          JSON.stringify(existingSelectedFlight)
        );
        navigate("/booking-stepper");
        return;
      }

      let bookingData;

      if (currentFlightData?.isMultiCity) {
        // Handle multi-city booking with individual segment fares
        if (
          !_selectedFares.segmentFares ||
          Object.keys(_selectedFares.segmentFares).length !==
            currentFlightData.legs?.length
        ) {
          alert(
            "Vui lòng chọn hạng vé cho tất cả các chặng trong chuyến bay đa thành phố"
          );
          return;
        }

        // Generate multi-city flight ID with format: multi-city-{leg1Id}-{leg2Id}-...
        const legIds = currentFlightData.legs
          .map((leg) => leg.id || leg.flightId)
          .join("-");
        const multiCityFlightId = `multi-city-${legIds}`;

        // Generate combined flight number
        const flightNumbers = currentFlightData.legs
          .map((leg) => leg.flightNumber)
          .join(" → ");

        // Calculate total price from all segments
        const totalPrice = Object.values(_selectedFares.segmentFares).reduce(
          (sum, fare) => sum + fare.price,
          0
        );

        bookingData = {
          type: "MULTI_CITY",
          tripType: "MULTI_CITY",
          flightId: multiCityFlightId,
          flightNumber: flightNumbers,
          airline:
            currentFlightData.airline ||
            currentFlightData.legs[0]?.airline?.airlineName ||
            currentFlightData.legs[0]?.airline,
          airlineName:
            flightData.airlineName ||
            flightData.legs[0]?.airline?.airlineName ||
            flightData.legs[0]?.airline,
          airlineLogo:
            flightData.airlineLogo ||
            flightData.legs[0]?.airline?.thumbnail ||
            flightData.legs[0]?.airline?.logo,

          // Main flight structure for compatibility with existing components
          legs: flightData.legs.map((leg, index) => {
            const segmentFare = _selectedFares.segmentFares[index];
            const selectedClass = leg.flightTravelClasses?.find(
              (tc) => tc.id === segmentFare?.travelClassId
            );

            return {
              id: leg.id || leg.flightId,
              flightId: leg.flightId || leg.id,
              flightNumber: leg.flightNumber,
              airline: leg.airline?.airlineName || leg.airline,
              airlineName: leg.airline?.airlineName || leg.airline,
              airlineLogo: leg.airline?.thumbnail || leg.airline?.logo,
              selectedClass: selectedClass, // Individual class for each leg
              segmentFare: segmentFare, // Include segment fare info
              departureTime: formatTimeVN(leg.departureTime),
              arrivalTime: formatTimeVN(leg.arrivalTime),
              departureDate: formatDateVN(leg.departureTime),
              arrivalDate: formatDateVN(leg.arrivalTime),
              from: leg.departureAirport?.airportCode,
              to: leg.arrivalAirport?.airportCode,
              departureAirport: {
                code: leg.departureAirport?.airportCode,
                name:
                  leg.departureAirport?.airportName ||
                  leg.departureAirport?.name,
                city:
                  leg.departureAirport?.city ||
                  leg.departureAirport?.cityNames?.[0],
                airportName:
                  leg.departureAirport?.airportName ||
                  leg.departureAirport?.name,
                gate: leg.departureAirport?.gates?.[0]?.gateName || "TBA",
                terminal: leg.departureAirport?.gates?.[0]?.terminal || "TBA",
              },
              duration: leg.duration,
              aircraft:
                typeof leg.aircraft === "object" && leg.aircraft !== null
                  ? leg.aircraft.aircraftName || leg.aircraft.aircraftCode
                  : leg.aircraft || leg.aircraftName,
              aircraftName:
                typeof leg.aircraft === "object" && leg.aircraft !== null
                  ? leg.aircraft.aircraftName || leg.aircraft.aircraftCode
                  : leg.aircraftName || leg.aircraft,
              seatLayout:
                leg.seatLayout ||
                (typeof leg.aircraft === "object" && leg.aircraft !== null
                  ? leg.aircraft.seatLayout
                  : null) ||
                "N/A",
              totalSeats:
                leg.totalSeats ||
                (typeof leg.aircraft === "object" && leg.aircraft !== null
                  ? leg.aircraft.totalSeats
                  : null) ||
                0,
              stops: leg.stops || 0,
              segmentIndex: index,
              segmentLabel: `Chặng ${index + 1}`,
            };
          }),

          // Additional multi-city specific data
          segments: flightData.segments,
          routeInfo: flightData.routeInfo,
          totalDuration: flightData.duration,
          segmentCount: flightData.legs?.length || 0,
          segmentFares: _selectedFares.segmentFares, // Include segment fare details

          // Use total price from all segments
          totalPrice: totalPrice,
          formattedTotalPrice: formatCurrencyVND(totalPrice),
          currency: "VND",
          passengers: 1,
          bookingDate: formatDateTimeVN(new Date()),
        };
      } else if (currentFlightData?.isRoundTrip) {
        // Handle round-trip booking
        if (!outboundFare || !returnFare) {
          alert("Vui lòng chọn hạng vé cho cả chuyến đi và chuyến về");
          return;
        }

        const outboundTravelClass =
          currentFlightData.outboundFlight?.flightTravelClasses?.find(
            (tc) => tc.id === outboundFare
          );
        const returnTravelClass =
          currentFlightData.returnFlight?.flightTravelClasses?.find(
            (tc) => tc.id === returnFare
          );

        // Debug raw flight data before mapping
        console.log(
          "🔍 Raw outbound flight data:",
          currentFlightData.outboundFlight
        );
        console.log(
          "🔍 Raw return flight data:",
          currentFlightData.returnFlight
        );
        console.log(
          "🔍 Outbound departureTime:",
          currentFlightData.outboundFlight?.departureTime
        );
        console.log(
          "🔍 Outbound arrivalTime:",
          currentFlightData.outboundFlight?.arrivalTime
        );
        console.log(
          "🔍 Return departureTime:",
          currentFlightData.returnFlight?.departureTime
        );
        console.log(
          "🔍 Return arrivalTime:",
          currentFlightData.returnFlight?.arrivalTime
        );

        bookingData = {
          type: "ROUND_TRIP",
          itineraryId: currentFlightData.id,
          flightNumber: `${
            currentFlightData.outboundFlight?.flightNumber || "N/A"
          } / ${currentFlightData.returnFlight?.flightNumber || "N/A"}`,
          airline:
            currentFlightData.outboundFlight?.airline ||
            currentFlightData.airline ||
            "N/A",
          airlineLogo:
            currentFlightData.outboundFlight?.airlineLogo ||
            currentFlightData.airlineLogo,
          outboundFlight: {
            id:
              currentFlightData.outboundFlight?.id ||
              currentFlightData.outboundFlight?.flightId,
            flightId:
              currentFlightData.outboundFlight?.flightId ||
              currentFlightData.outboundFlight?.id,
            flightNumber: currentFlightData.outboundFlight?.flightNumber,
            airline: currentFlightData.outboundFlight?.airline,
            airlineName:
              currentFlightData.outboundFlight?.airlineName ||
              currentFlightData.outboundFlight?.airline,
            airlineLogo: currentFlightData.outboundFlight?.airlineLogo,
            selectedClass: outboundTravelClass,
            // Extract time/date with multiple fallbacks
            departureTime: (() => {
              const timeValue =
                currentFlightData.outboundFlight?.departureTime ||
                currentFlightData.outboundFlight?.departureDateTime ||
                currentFlightData.departure?.datetime ||
                currentFlightData.departureTime;
              console.log("🔍 Outbound departureTime raw value:", timeValue);
              return formatTimeVN(timeValue);
            })(),
            arrivalTime: (() => {
              const timeValue =
                currentFlightData.outboundFlight?.arrivalTime ||
                currentFlightData.outboundFlight?.arrivalDateTime ||
                currentFlightData.arrival?.datetime ||
                currentFlightData.arrivalTime;
              console.log("🔍 Outbound arrivalTime raw value:", timeValue);
              return formatTimeVN(timeValue);
            })(),
            departureDate: (() => {
              const dateValue =
                currentFlightData.outboundFlight?.departureTime ||
                currentFlightData.outboundFlight?.departureDate ||
                currentFlightData.departure?.datetime ||
                currentFlightData.departureTime;
              console.log("🔍 Outbound departureDate raw value:", dateValue);
              return formatDateVN(dateValue);
            })(),
            arrivalDate: (() => {
              const dateValue =
                currentFlightData.outboundFlight?.arrivalTime ||
                currentFlightData.outboundFlight?.arrivalDateTime ||
                currentFlightData.arrival?.datetime ||
                currentFlightData.arrivalTime;
              console.log("🔍 Outbound arrivalDate raw value:", dateValue);
              return formatDateVN(dateValue);
            })(),
            from:
              currentFlightData.outboundFlight?.departureAirport?.airportCode ||
              currentFlightData.outboundFlight?.from ||
              currentFlightData.outboundFlight?.fromCode ||
              "N/A",
            to:
              currentFlightData.outboundFlight?.arrivalAirport?.airportCode ||
              currentFlightData.outboundFlight?.to ||
              currentFlightData.outboundFlight?.toCode ||
              "N/A",
            departureAirport: {
              code:
                currentFlightData.outboundFlight?.departureAirport
                  ?.airportCode ||
                currentFlightData.outboundFlight?.departureAirport?.code ||
                currentFlightData.outboundFlight?.from ||
                currentFlightData.outboundFlight?.fromCode ||
                "N/A",
              name:
                currentFlightData.outboundFlight?.departureAirport
                  ?.airportName ||
                currentFlightData.outboundFlight?.departureAirport?.name ||
                currentFlightData.outboundFlight?.departureAirportName ||
                "N/A",
              city:
                currentFlightData.outboundFlight?.departureAirport
                  ?.cityNames?.[0] ||
                currentFlightData.outboundFlight?.departureAirport?.city ||
                currentFlightData.outboundFlight?.departureCity ||
                currentFlightData.outboundFlight?.fromCity ||
                "N/A",
              airportName:
                currentFlightData.outboundFlight?.departureAirport
                  ?.airportName ||
                currentFlightData.outboundFlight?.departureAirport?.name ||
                "N/A",
              gate:
                currentFlightData.outboundFlight?.departureAirport?.gates?.[0]
                  ?.gateName || "TBA",
              terminal:
                currentFlightData.outboundFlight?.departureAirport?.gates?.[0]
                  ?.terminal || "TBA",
            },
            arrivalAirport: {
              code:
                currentFlightData.outboundFlight?.arrivalAirport?.airportCode ||
                currentFlightData.outboundFlight?.arrivalAirport?.code ||
                currentFlightData.outboundFlight?.to ||
                currentFlightData.outboundFlight?.toCode ||
                "N/A",
              name:
                flightData.outboundFlight?.arrivalAirport?.airportName ||
                flightData.outboundFlight?.arrivalAirport?.name ||
                flightData.outboundFlight?.arrivalAirportName ||
                "N/A",
              city:
                flightData.outboundFlight?.arrivalAirport?.cityNames?.[0] ||
                flightData.outboundFlight?.arrivalAirport?.city ||
                flightData.outboundFlight?.arrivalCity ||
                flightData.outboundFlight?.toCity ||
                "N/A",
              airportName:
                flightData.outboundFlight?.arrivalAirport?.airportName ||
                flightData.outboundFlight?.arrivalAirport?.name ||
                "N/A",
              gate:
                flightData.outboundFlight?.arrivalAirport?.gates?.[0]
                  ?.gateName || "TBA",
              terminal:
                flightData.outboundFlight?.arrivalAirport?.gates?.[0]
                  ?.terminal || "TBA",
            },
            duration: flightData.outboundFlight?.duration,
            aircraft:
              typeof flightData.outboundFlight?.aircraft === "object" &&
              flightData.outboundFlight?.aircraft !== null
                ? flightData.outboundFlight.aircraft.aircraftName ||
                  flightData.outboundFlight.aircraft.aircraftCode
                : flightData.outboundFlight?.aircraft ||
                  flightData.outboundFlight?.aircraftName ||
                  "N/A",
            aircraftName:
              typeof flightData.outboundFlight?.aircraft === "object" &&
              flightData.outboundFlight?.aircraft !== null
                ? flightData.outboundFlight.aircraft.aircraftName ||
                  flightData.outboundFlight.aircraft.aircraftCode
                : flightData.outboundFlight?.aircraftName ||
                  flightData.outboundFlight?.aircraft ||
                  "N/A",
            seatLayout:
              flightData.outboundFlight?.aircraftInfo?.seatLayout ||
              flightData.outboundFlight?.seatLayout ||
              (typeof flightData.outboundFlight?.aircraft === "object" &&
                flightData.outboundFlight?.aircraft?.seatLayout) ||
              "N/A",
            totalSeats:
              flightData.outboundFlight?.aircraftInfo?.totalSeats ||
              flightData.outboundFlight?.totalSeats ||
              (typeof flightData.outboundFlight?.aircraft === "object" &&
                flightData.outboundFlight?.aircraft?.totalSeats) ||
              0,
          },
          returnFlight: {
            id:
              flightData.returnFlight?.id || flightData.returnFlight?.flightId,
            flightId:
              flightData.returnFlight?.flightId || flightData.returnFlight?.id,
            flightNumber: flightData.returnFlight?.flightNumber,
            airline: flightData.returnFlight?.airline,
            airlineName:
              flightData.returnFlight?.airlineName ||
              flightData.returnFlight?.airline,
            airlineLogo: flightData.returnFlight?.airlineLogo,
            selectedClass: returnTravelClass,
            // Extract time/date with multiple fallbacks
            departureTime: (() => {
              const timeValue =
                flightData.returnFlight?.departureTime ||
                flightData.returnFlight?.departureDateTime ||
                flightData.returnDeparture?.datetime ||
                flightData.return?.departureTime;
              console.log("🔍 Return departureTime raw value:", timeValue);
              return formatTimeVN(timeValue);
            })(),
            arrivalTime: (() => {
              const timeValue =
                flightData.returnFlight?.arrivalTime ||
                flightData.returnFlight?.arrivalDateTime ||
                flightData.returnArrival?.datetime ||
                flightData.return?.arrivalTime;
              console.log("🔍 Return arrivalTime raw value:", timeValue);
              return formatTimeVN(timeValue);
            })(),
            departureDate: (() => {
              const dateValue =
                flightData.returnFlight?.departureTime ||
                flightData.returnFlight?.departureDateTime ||
                flightData.returnDeparture?.datetime ||
                flightData.return?.departureTime;
              console.log("🔍 Return departureDate raw value:", dateValue);
              return formatDateVN(dateValue);
            })(),
            arrivalDate: (() => {
              const dateValue =
                flightData.returnFlight?.arrivalTime ||
                flightData.returnFlight?.arrivalDateTime ||
                flightData.returnArrival?.datetime ||
                flightData.return?.arrivalTime;
              console.log("🔍 Return arrivalDate raw value:", dateValue);
              return formatDateVN(dateValue);
            })(),
            from:
              flightData.returnFlight?.departureAirport?.airportCode ||
              flightData.returnFlight?.from ||
              flightData.returnFlight?.fromCode ||
              "N/A",
            to:
              flightData.returnFlight?.arrivalAirport?.airportCode ||
              flightData.returnFlight?.to ||
              flightData.returnFlight?.toCode ||
              "N/A",
            departureAirport: {
              code:
                flightData.returnFlight?.departureAirport?.airportCode ||
                flightData.returnFlight?.departureAirport?.code ||
                flightData.returnFlight?.from ||
                flightData.returnFlight?.fromCode ||
                "N/A",
              name:
                flightData.returnFlight?.departureAirport?.airportName ||
                flightData.returnFlight?.departureAirport?.name ||
                flightData.returnFlight?.departureAirportName ||
                "N/A",
              city:
                flightData.returnFlight?.departureAirport?.cityNames?.[0] ||
                flightData.returnFlight?.departureAirport?.city ||
                flightData.returnFlight?.departureCity ||
                flightData.returnFlight?.fromCity ||
                "N/A",
              airportName:
                flightData.returnFlight?.departureAirport?.airportName ||
                flightData.returnFlight?.departureAirport?.name ||
                "N/A",
              gate:
                flightData.returnFlight?.departureAirport?.gates?.[0]
                  ?.gateName || "TBA",
              terminal:
                flightData.returnFlight?.departureAirport?.gates?.[0]
                  ?.terminal || "TBA",
            },
            arrivalAirport: {
              code:
                flightData.returnFlight?.arrivalAirport?.airportCode ||
                flightData.returnFlight?.arrivalAirport?.code ||
                flightData.returnFlight?.to ||
                flightData.returnFlight?.toCode ||
                "N/A",
              name:
                flightData.returnFlight?.arrivalAirport?.airportName ||
                flightData.returnFlight?.arrivalAirport?.name ||
                flightData.returnFlight?.arrivalAirportName ||
                "N/A",
              city:
                flightData.returnFlight?.arrivalAirport?.cityNames?.[0] ||
                flightData.returnFlight?.arrivalAirport?.city ||
                flightData.returnFlight?.arrivalCity ||
                flightData.returnFlight?.toCity ||
                "N/A",
              airportName:
                flightData.returnFlight?.arrivalAirport?.airportName ||
                flightData.returnFlight?.arrivalAirport?.name ||
                "N/A",
              gate:
                flightData.returnFlight?.arrivalAirport?.gates?.[0]?.gateName ||
                "TBA",
              terminal:
                flightData.returnFlight?.arrivalAirport?.gates?.[0]?.terminal ||
                "TBA",
            },
            duration: flightData.returnFlight?.duration,
            aircraft:
              typeof flightData.returnFlight?.aircraft === "object" &&
              flightData.returnFlight?.aircraft !== null
                ? flightData.returnFlight.aircraft.aircraftName ||
                  flightData.returnFlight.aircraft.aircraftCode
                : flightData.returnFlight?.aircraft ||
                  flightData.returnFlight?.aircraftName ||
                  "N/A",
            aircraftName:
              typeof flightData.returnFlight?.aircraft === "object" &&
              flightData.returnFlight?.aircraft !== null
                ? flightData.returnFlight.aircraft.aircraftName ||
                  flightData.returnFlight.aircraft.aircraftCode
                : flightData.returnFlight?.aircraftName ||
                  flightData.returnFlight?.aircraft ||
                  "N/A",
            seatLayout:
              flightData.returnFlight?.aircraftInfo?.seatLayout ||
              flightData.returnFlight?.seatLayout ||
              (typeof flightData.returnFlight?.aircraft === "object" &&
                flightData.returnFlight?.aircraft?.seatLayout) ||
              "N/A",
            totalSeats:
              flightData.returnFlight?.aircraftInfo?.totalSeats ||
              flightData.returnFlight?.totalSeats ||
              (typeof flightData.returnFlight?.aircraft === "object" &&
                flightData.returnFlight?.aircraft?.totalSeats) ||
              0,
          },
          totalPrice:
            (outboundTravelClass?.price || 0) + (returnTravelClass?.price || 0),
          formattedTotalPrice: formatCurrencyVND(
            (outboundTravelClass?.price || 0) + (returnTravelClass?.price || 0)
          ),
          currency: "VND",
          passengers: 1,
          bookingDate: formatDateTimeVN(new Date()),
        };
      } else {
        // Handle one-way booking
        const selectedTravelClass = flightData.flightTravelClasses?.find(
          (tc) => tc.id === selectedFare
        );

        bookingData = {
          type: "ONE_WAY",
          flightId: flightData.id,
          flightNumber: flightData.flightNumber || "N/A",
          airline: flightData.airline || "N/A",
          airlineLogo: flightData.airlineLogo,
          flight: {
            id: flightData.id,
            flightId: flightData.flightId || flightData.id,
            flightNumber: flightData.flightNumber,
            airline: flightData.airline,
            airlineName: flightData.airlineName || flightData.airline,
            airlineLogo: flightData.airlineLogo,
            selectedClass: selectedTravelClass,
            departureTime: formatTimeVN(flightData.departureTime),
            arrivalTime: formatTimeVN(flightData.arrivalTime),
            departureDate: formatDateVN(flightData.departureTime),
            arrivalDate: formatDateVN(flightData.arrivalTime),
            from: flightData.from,
            to: flightData.to,
            departureAirport: {
              code: flightData.departureAirport?.airportCode || flightData.from,
              name: flightData.departureAirport?.airportName || "N/A",
              city: flightData.departureAirport?.cityNames?.[0] || "N/A",
              airportName: flightData.departureAirport?.airportName || "N/A",
              gate: flightData.departureAirport?.gates?.[0]?.gateName || "TBA",
              terminal:
                flightData.departureAirport?.gates?.[0]?.terminal || "TBA",
            },
            arrivalAirport: {
              code: flightData.arrivalAirport?.airportCode || flightData.to,
              name: flightData.arrivalAirport?.airportName || "N/A",
              city: flightData.arrivalAirport?.cityNames?.[0] || "N/A",
              airportName: flightData.arrivalAirport?.airportName || "N/A",
              gate: flightData.arrivalAirport?.gates?.[0]?.gateName || "TBA",
              terminal:
                flightData.arrivalAirport?.gates?.[0]?.terminal || "TBA",
            },
            duration: flightData.duration,
            aircraft:
              typeof flightData.aircraft === "object" &&
              flightData.aircraft !== null
                ? flightData.aircraft.aircraftName ||
                  flightData.aircraft.aircraftCode
                : flightData.aircraft || flightData.aircraftName || "N/A",
            aircraftName:
              typeof flightData.aircraft === "object" &&
              flightData.aircraft !== null
                ? flightData.aircraft.aircraftName ||
                  flightData.aircraft.aircraftCode
                : flightData.aircraftName || flightData.aircraft || "N/A",
            seatLayout:
              flightData.aircraftInfo?.seatLayout ||
              flightData.seatLayout ||
              (typeof flightData.aircraft === "object" &&
                flightData.aircraft?.seatLayout) ||
              "N/A",
            totalSeats:
              flightData.aircraftInfo?.totalSeats ||
              flightData.totalSeats ||
              (typeof flightData.aircraft === "object" &&
                flightData.aircraft?.totalSeats) ||
              0,
            stops: flightData.stops,
          },
          selectedClass: selectedTravelClass,
          totalPrice: selectedTravelClass?.price || 0,
          formattedTotalPrice: formatCurrencyVND(
            selectedTravelClass?.price || 0
          ),
          currency: "VND",
          passengers: 1,
          bookingDate: formatDateTimeVN(new Date()),
        };
      }

      // Store booking data in localStorage
      localStorage.setItem("selectedFlight", JSON.stringify(bookingData));

      // Navigate to booking page
      navigate("/booking-stepper", {
        state: { bookingData },
      });
    } catch (error) {
      console.error("Error proceeding to booking:", error);
      alert("Có lỗi xảy ra khi chuyển đến trang đặt vé. Vui lòng thử lại.");
    }
  };

  const resetFareSelection = () => {
    setSelectedFare(null);
    setOutboundFare(null);
    setReturnFare(null);
    setFareSelectionStep("outbound");
    _setSelectedFares({});

    // Xóa selected fares từ localStorage
    localStorage.removeItem("selectedFare");
    localStorage.removeItem("selectedOutboundFare");
    localStorage.removeItem("selectedReturnFare");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin chuyến bay...</p>
        </div>
      </div>
    );
  }

  if (!flightData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy thông tin chuyến bay
          </h1>
          <p className="text-gray-600 mb-6">
            Chuyến bay bạn đang tìm kiếm không tồn tại hoặc đã bị hủy.
          </p>
          <Button onClick={() => navigate("/")}>Quay về trang chủ</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 py-8 pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-gray-100"
        >
          <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
          Quay lại
        </Button>
        {/* Flight Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={flightData.airlineLogo}
                  alt={flightData.airline}
                  className="w-12 h-12 rounded-lg object-contain"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg";
                  }}
                />
                <div>
                  <CardTitle className="text-2xl font-bold dark:text-white">
                    {flightData.airline}
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">
                    Chuyến bay {flightData.flightNumber}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrencyVND(flightData.totalPrice || flightData.price)}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Giá từ / người
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {flightData.isMultiCity && flightData.legs ? (
              // Multi-city flight summary
              <div className="space-y-6">
                <div className="flex items-center justify-center mb-4">
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    Multi-City ({flightData.legs.length} chặng)
                  </Badge>
                </div>

                {flightData.legs.map((leg, index) => (
                  <div key={index} className="space-y-4">
                    <h3
                      className="font-semibold text-lg"
                      style={{ color: `hsl(${index * 60}, 70%, 50%)` }}
                    >
                      Chặng {index + 1}:{" "}
                      {leg.departureAirport?.airportCode || leg.from} →{" "}
                      {leg.arrivalAirport?.airportCode || leg.to}
                    </h3>
                    <div
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{
                        backgroundColor: `hsl(${index * 60}, 70%, 95%)`,
                      }}
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {formatTimeVN(leg.departureTime)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {leg.departureAirport?.airportName ||
                            leg.departureAirport?.name ||
                            "N/A"}
                        </div>
                        <div className="text-sm font-medium">
                          {leg.departureAirport?.airportCode || leg.from}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateVN(leg.departureTime)}
                        </div>
                      </div>
                      <div className="flex-1 mx-6">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="bg-gray-50 px-2 text-gray-500">
                              <Plane className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                        <div className="text-center text-sm text-gray-500 mt-2">
                          {formatDuration(leg.duration)}
                        </div>
                        <div className="text-center text-xs text-gray-400">
                          {leg.flightNumber}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {formatTimeVN(leg.arrivalTime)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {leg.arrivalAirport?.airportName ||
                            leg.arrivalAirport?.name ||
                            "N/A"}
                        </div>
                        <div className="text-sm font-medium">
                          {leg.arrivalAirport?.airportCode || leg.to}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateVN(leg.arrivalTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-4 pt-4 border-t">
                  <div className="text-center text-sm text-gray-600">
                    <div className="font-medium">
                      Tổng thời gian hành trình:{" "}
                      {formatDuration(flightData.duration)}
                    </div>
                    <div className="text-xs mt-1">
                      {flightData.routeInfo ||
                        `${
                          flightData.legs[0]?.departureAirport?.airportCode
                        } → ${
                          flightData.legs[flightData.legs.length - 1]
                            ?.arrivalAirport?.airportCode
                        }`}
                    </div>
                  </div>
                </div>
              </div>
            ) : flightData.isRoundTrip ? (
              // Round-trip flight summary
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Outbound */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-blue-600">
                    Chuyến đi
                  </h3>
                  <div className="text-sm text-gray-600 mb-2">
                    {flightData.outboundFlight?.flightNumber || "N/A"} •{" "}
                    {flightData.outboundFlight?.aircraft?.aircraftName || "N/A"}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {flightData.outboundFlight?.departureTime}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flightData.outboundFlight?.departureAirport?.city ||
                          flightData.outboundFlight?.departureAirport?.name ||
                          "N/A"}
                      </div>
                      <div className="text-sm font-medium">
                        {flightData.outboundFlight?.departureAirport?.code ||
                          flightData.outboundFlight?.from ||
                          "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {flightData.outboundFlight?.departureDate || "N/A"}
                      </div>
                    </div>
                    <div className="flex-1 mx-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="bg-gray-50 px-2 text-gray-500">
                            <Plane className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                      <div className="text-center text-sm text-gray-500 mt-2">
                        {flightData.outboundFlight?.duration} phút
                      </div>
                      <div className="text-center text-xs text-gray-400">
                        {flightData.outboundFlight?.stops === "NON_STOP"
                          ? "Bay thẳng"
                          : `${flightData.outboundFlight?.stops} điểm dừng`}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {flightData.outboundFlight?.arrivalTime}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flightData.outboundFlight?.arrivalAirport?.city ||
                          flightData.outboundFlight?.arrivalAirport?.name ||
                          "N/A"}
                      </div>
                      <div className="text-sm font-medium">
                        {flightData.outboundFlight?.arrivalAirport?.code ||
                          flightData.outboundFlight?.to ||
                          "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {flightData.outboundFlight?.arrivalDate || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Return */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-green-600">
                    Chuyến về
                  </h3>
                  <div className="text-sm text-gray-600 mb-2">
                    {flightData.returnFlight?.flightNumber || "N/A"} •{" "}
                    {flightData.returnFlight?.aircraft?.aircraftName || "N/A"}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {flightData.returnFlight?.departureTime}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flightData.returnFlight?.departureAirport?.city ||
                          flightData.returnFlight?.departureAirport?.name ||
                          "N/A"}
                      </div>
                      <div className="text-sm font-medium">
                        {flightData.returnFlight?.departureAirport?.code ||
                          flightData.returnFlight?.from ||
                          "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {flightData.returnFlight?.departureDate || "N/A"}
                      </div>
                    </div>
                    <div className="flex-1 mx-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="bg-gray-50 px-2 text-gray-500">
                            <Plane className="w-4 h-4 rotate-180" />
                          </span>
                        </div>
                      </div>
                      <div className="text-center text-sm text-gray-500 mt-2">
                        {flightData.returnFlight?.duration} phút
                      </div>
                      <div className="text-center text-xs text-gray-400">
                        {flightData.returnFlight?.stops === "NON_STOP"
                          ? "Bay thẳng"
                          : `${flightData.returnFlight?.stops} điểm dừng`}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {flightData.returnFlight?.arrivalTime}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flightData.returnFlight?.arrivalAirport?.city ||
                          flightData.returnFlight?.arrivalAirport?.name ||
                          "N/A"}
                      </div>
                      <div className="text-sm font-medium">
                        {flightData.returnFlight?.arrivalAirport?.code ||
                          flightData.returnFlight?.to ||
                          "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {flightData.returnFlight?.arrivalDate || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // One-way flight summary
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {flightData.departure?.time ||
                      flightData.departureTime ||
                      "N/A"}
                  </div>
                  <div className="text-lg font-medium">
                    {flightData.departure?.city || flightData.from || "N/A"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {flightData.departure?.code || flightData.fromCode || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {flightData.departure?.date ||
                      flightData.departureDate ||
                      "N/A"}
                  </div>
                </div>
                <div className="flex-1 mx-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-blue-300"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-gray-50 dark:bg-gray-900 px-4 py-2">
                        <Plane className="w-6 h-6 text-blue-600" />
                      </span>
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <div className="text-sm font-medium text-gray-700">
                      {formatDuration(flightData.duration)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatStops(flightData.stops)}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {flightData.arrival?.time ||
                      flightData.arrivalTime ||
                      "N/A"}
                  </div>
                  <div className="text-lg font-medium">
                    {flightData.arrival?.city || flightData.to || "N/A"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {flightData.arrivalAirport?.code || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {flightData.arrival?.date ||
                      flightData.arrivalDate ||
                      "N/A"}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Flight Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="details">Chi tiết chuyến bay</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin chi tiết</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {flightData.isMultiCity && flightData.legs ? (
                      // Multi-city details
                      <div className="space-y-8">
                        {flightData.legs.map((leg, index) => (
                          <div key={index}>
                            <h3
                              className="text-lg font-semibold mb-4"
                              style={{ color: `hsl(${index * 60}, 70%, 50%)` }}
                            >
                              Chặng {index + 1}:{" "}
                              {leg.departureAirport?.airportCode} →{" "}
                              {leg.arrivalAirport?.airportCode}
                            </h3>
                            <div
                              className="rounded-lg p-4 space-y-4"
                              style={{
                                backgroundColor: `hsl(${index * 60}, 70%, 95%)`,
                              }}
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <span className="text-sm text-gray-600">
                                    Số hiệu chuyến bay:
                                  </span>
                                  <p className="font-medium">
                                    {leg.flightNumber || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">
                                    Hãng hàng không:
                                  </span>
                                  <p className="font-medium">
                                    {leg.airline?.airlineName ||
                                      leg.airline ||
                                      "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">
                                    Máy bay:
                                  </span>
                                  <p className="font-medium">
                                    {leg.aircraftName || leg.aircraft || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">
                                    Thời gian bay:
                                  </span>
                                  <p className="font-medium">
                                    {formatDuration(leg.duration)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">
                                    Khởi hành:
                                  </span>
                                  <p className="font-medium">
                                    {formatTimeVN(leg.departureTime)} -{" "}
                                    {formatDateVN(leg.departureTime)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">
                                    Đến nơi:
                                  </span>
                                  <p className="font-medium">
                                    {formatTimeVN(leg.arrivalTime)} -{" "}
                                    {formatDateVN(leg.arrivalTime)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">
                                    Sân bay khởi hành:
                                  </span>
                                  <p className="font-medium">
                                    {leg.departureAirport?.airportName ||
                                      leg.departureAirport?.name ||
                                      "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">
                                    Sân bay đến:
                                  </span>
                                  <p className="font-medium">
                                    {leg.arrivalAirport?.airportName ||
                                      leg.arrivalAirport?.name ||
                                      "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">
                                    Điểm dừng:
                                  </span>
                                  <p className="font-medium">
                                    {formatStops(leg.stops)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">
                                    Trạng thái:
                                  </span>
                                  <p className="font-medium">
                                    {leg.status || "Có sẵn"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold mb-2">
                            Tóm tắt hành trình
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">
                                Tổng số chặng:
                              </span>
                              <span className="font-medium ml-2">
                                {flightData.legs.length}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">
                                Tổng thời gian:
                              </span>
                              <span className="font-medium ml-2">
                                {formatDuration(flightData.duration)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">
                                Tuyến đường:
                              </span>
                              <span className="font-medium ml-2">
                                {flightData.routeInfo ||
                                  `${
                                    flightData.legs[0]?.departureAirport
                                      ?.airportCode
                                  } → ${
                                    flightData.legs[flightData.legs.length - 1]
                                      ?.arrivalAirport?.airportCode
                                  }`}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Máy bay:</span>
                              <span className="font-medium ml-2">
                                {flightData.aircraft || "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">
                                Cấu hình ghế:
                              </span>
                              <span className="font-medium ml-2">
                                {flightData.seatLayout || "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">
                                Tổng số ghế:
                              </span>
                              <span className="font-medium ml-2">
                                {flightData.totalSeats || 0} ghế
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">
                                Loại hành trình:
                              </span>
                              <span className="font-medium ml-2">
                                Multi-City
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : flightData.isRoundTrip ? (
                      // Round-trip details
                      <div className="space-y-8">
                        {/* Outbound Flight Details */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-blue-600">
                            Chuyến đi
                          </h3>
                          <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm text-gray-600">
                                  Số hiệu chuyến bay:
                                </span>
                                <p className="font-medium">
                                  {flightData.outboundFlight?.flightNumber ||
                                    "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">
                                  Máy bay:
                                </span>
                                <p className="font-medium">
                                  {flightData.outboundFlight?.aircraft
                                    ?.aircraftName || "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">
                                  Thời gian bay:
                                </span>
                                <p className="font-medium">
                                  {formatDuration(
                                    flightData.outboundFlight?.duration
                                  )}
                                </p>
                              </div>
                              {/* <div>
                                <span className="text-sm text-gray-600">
                                  Trạng thái:
                                </span>
                                <p className="font-medium">
                                  {flightData.outboundFlight?.status || "N/A"}
                                </p>
                              </div> */}
                            </div>
                          </div>
                        </div>

                        {/* Return Flight Details */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-green-600">
                            Chuyến về
                          </h3>
                          <div className="bg-green-50 rounded-lg p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm text-gray-600">
                                  Số hiệu chuyến bay:
                                </span>
                                <p className="font-medium">
                                  {flightData.returnFlight?.flightNumber ||
                                    "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">
                                  Máy bay:
                                </span>
                                <p className="font-medium">
                                  {flightData.returnFlight?.aircraft
                                    ?.aircraftName || "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">
                                  Thời gian bay:
                                </span>
                                <p className="font-medium">
                                  {formatDuration(
                                    flightData.returnFlight?.duration
                                  )}
                                </p>
                              </div>
                              {/* <div>
                                <span className="text-sm text-gray-600">
                                  Trạng thái:
                                </span>
                                <p className="font-medium">
                                  {flightData.returnFlight?.status || "N/A"}
                                </p>
                              </div> */}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // One-way flight details
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-2">
                              Thông tin chuyến bay
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Số hiệu:</span>
                                <span className="font-medium">
                                  {flightData.flightNumber}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Máy bay:</span>
                                <span className="font-medium">
                                  {flightData.aircraft}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Thời gian bay:
                                </span>
                                <span className="font-medium">
                                  {formatDuration(flightData.duration)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Điểm dừng:
                                </span>
                                <span className="font-medium">
                                  {formatStops(flightData.stops)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">
                              Thông tin bổ sung
                            </h4>
                            <div className="space-y-2">
                              {/* <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Trạng thái:
                                </span>
                                <span className="font-medium">
                                  {flightData.status}
                                </span>
                              </div> */}
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Ghế còn lại:
                                </span>
                                <span className="font-medium">
                                  {flightData.availableSeats}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Cổng:</span>
                                <span className="font-medium">
                                  {flightData.gate}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Terminal:</span>
                                <span className="font-medium">
                                  {flightData.terminal}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        {/* Fare Selection */}
        <div className="space-y-6 mt-10 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>
                {flightData?.isMultiCity
                  ? "Chọn hạng vé cho chuyến bay Multi-City"
                  : flightData?.isRoundTrip
                  ? "Chọn hạng vé cho chuyến bay khứ hồi"
                  : "Chọn loại vé phù hợp"}
              </CardTitle>
              {(outboundFare || returnFare || selectedFare) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFareSelection}
                >
                  Đặt lại lựa chọn
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {flightData?.isMultiCity ? (
                // Multi-city fare selection - Individual segment selection
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6 border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                      <Map className="w-5 h-5 mr-2" />
                      Chuyến bay Multi-City ({flightData.legs?.length || 0}{" "}
                      chặng)
                    </h4>
                    <p className="text-sm text-purple-700 mb-3">
                      Chọn hạng vé riêng cho từng chặng trong hành trình của
                      bạn.
                    </p>
                  </div>

                  {/* Individual segment fare selection */}
                  {flightData.legs?.map((leg, segmentIndex) => (
                    <div
                      key={segmentIndex}
                      className="bg-white border rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span
                          className="font-medium text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
                          style={{
                            backgroundColor: `hsl(${
                              segmentIndex * 60
                            }, 70%, 50%)`,
                          }}
                        >
                          {segmentIndex + 1}
                        </span>
                        <div>
                          <h5 className="font-semibold text-lg">
                            Chặng {segmentIndex + 1}:{" "}
                            {leg.departureAirport?.airportCode} →{" "}
                            {leg.arrivalAirport?.airportCode}
                          </h5>
                          <div className="text-sm text-gray-600">
                            {leg.flightNumber} •{" "}
                            {formatTimeVN(leg.departureTime)} -{" "}
                            {formatTimeVN(leg.arrivalTime)}
                          </div>
                        </div>
                      </div>

                      {/* Fare options for this segment */}
                      {leg.flightTravelClasses &&
                      leg.flightTravelClasses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {leg.flightTravelClasses.map(
                            (travelClass, classIndex) => {
                              const segmentFareKey = `segment-${segmentIndex}-${travelClass.id}`;
                              const isSelected =
                                selectedFare === segmentFareKey;

                              return (
                                <div
                                  key={travelClass.id}
                                  className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                                    isSelected
                                      ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
                                      : "hover:border-blue-300 hover:shadow-sm"
                                  } ${
                                    classIndex === 0
                                      ? "bg-gradient-to-br from-blue-50 to-indigo-50 relative"
                                      : "bg-white"
                                  }`}
                                  onClick={() => {
                                    // Update the segment fare selection
                                    const newSegmentFares = {
                                      ...(_selectedFares.segmentFares || {}),
                                    };
                                    newSegmentFares[segmentIndex] = {
                                      travelClassId: travelClass.id,
                                      className:
                                        travelClass.travelClass?.className,
                                      price: travelClass.price,
                                      availableSeats:
                                        travelClass.availableSeats,
                                    };
                                    _setSelectedFares((prev) => ({
                                      ...prev,
                                      segmentFares: newSegmentFares,
                                    }));
                                  }}
                                >
                                  {classIndex === 0 && (
                                    <Badge className="absolute -top-2 right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm text-xs">
                                      Phổ biến
                                    </Badge>
                                  )}

                                  <div className="mb-3">
                                    <h6 className="font-bold text-gray-900 mb-1">
                                      {travelClass.travelClass?.className ||
                                        `Hạng ${classIndex + 1}`}
                                    </h6>
                                    <p className="text-lg font-bold text-blue-600 mb-1">
                                      {formatCurrencyVND(travelClass.price)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      cho chặng này
                                    </p>
                                    <p className="text-xs text-orange-600 mt-1">
                                      Còn {travelClass.availableSeats} ghế
                                    </p>
                                  </div>

                                  <div className="space-y-1 mb-3">
                                    <div className="flex items-center text-xs">
                                      <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                                      <span>Hành lý xách tay</span>
                                    </div>
                                    <div className="flex items-center text-xs">
                                      {travelClass.travelClass?.benefits
                                        ?.toLowerCase()
                                        .includes("ký gửi") ? (
                                        <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                                      ) : (
                                        <div className="w-3 h-3 rounded-full border border-gray-300 mr-1" />
                                      )}
                                      <span
                                        className={
                                          !travelClass.travelClass?.benefits
                                            ?.toLowerCase()
                                            .includes("ký gửi")
                                            ? "text-gray-400 line-through"
                                            : ""
                                        }
                                      >
                                        Hành lý ký gửi
                                      </span>
                                    </div>
                                  </div>

                                  {_selectedFares.segmentFares?.[segmentIndex]
                                    ?.travelClassId === travelClass.id ? (
                                    <div className="w-full py-1 px-2 bg-green-100 border border-green-300 rounded text-center text-green-800 text-xs font-medium">
                                      ✓ Đã chọn
                                    </div>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full text-xs border-gray-300 hover:border-blue-400 hover:text-blue-600"
                                    >
                                      Chọn
                                    </Button>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm">
                            Không có hạng vé cho chặng này
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Multi-city summary and total */}
                  {_selectedFares.segmentFares &&
                    Object.keys(_selectedFares.segmentFares).length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h5 className="font-semibold text-green-800 mb-3">
                          Tóm tắt lựa chọn
                        </h5>
                        <div className="space-y-2 mb-4">
                          {Object.entries(_selectedFares.segmentFares).map(
                            ([segmentIndex, fareInfo]) => {
                              const leg =
                                flightData.legs[parseInt(segmentIndex)];
                              return (
                                <div
                                  key={segmentIndex}
                                  className="flex justify-between items-center text-sm"
                                >
                                  <span>
                                    Chặng {parseInt(segmentIndex) + 1}:{" "}
                                    {leg?.departureAirport?.airportCode} →{" "}
                                    {leg?.arrivalAirport?.airportCode}
                                    <span className="ml-2 text-gray-600">
                                      ({fareInfo.className})
                                    </span>
                                  </span>
                                  <span className="font-semibold">
                                    {formatCurrencyVND(fareInfo.price)}
                                  </span>
                                </div>
                              );
                            }
                          )}
                        </div>
                        <div className="border-t border-green-300 pt-3 flex justify-between items-center">
                          <span className="font-bold text-green-800">
                            Tổng cộng:
                          </span>
                          <span className="text-xl font-bold text-green-600">
                            {formatCurrencyVND(
                              Object.values(_selectedFares.segmentFares).reduce(
                                (sum, fare) => sum + fare.price,
                                0
                              )
                            )}
                          </span>
                        </div>

                        {Object.keys(_selectedFares.segmentFares).length ===
                          flightData.legs?.length && (
                          <Button
                            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold"
                            onClick={handleProceedToBooking}
                          >
                            Tiếp tục đặt vé Multi-City
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    )}
                </div>
              ) : flightData?.isRoundTrip ? (
                // Round-trip fare selection with stepper
                <div className="space-y-6">
                  {/* Stepper */}
                  <div className="flex items-center justify-between">
                    {roundTripSteps.map((step, index) => (
                      <div key={index} className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            (index === 0 && fareSelectionStep === "outbound") ||
                            (index === 1 && fareSelectionStep === "return") ||
                            (index === 2 && fareSelectionStep === "confirm")
                              ? "bg-blue-600 text-white"
                              : index === 0 && outboundFare
                              ? "bg-green-600 text-white"
                              : index === 1 && returnFare
                              ? "bg-green-600 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {(index === 0 && outboundFare) ||
                          (index === 1 && returnFare) ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {step.title}
                        </span>
                        {index < roundTripSteps.length - 1 && (
                          <ChevronRight className="w-4 h-4 text-gray-400 ml-2" />
                        )}
                      </div>
                    ))}
                  </div>

                  {fareSelectionStep === "outbound" && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          Chọn hạng vé cho chuyến đi
                        </h3>
                        <p className="text-sm text-gray-600">
                          Chọn hạng vé phù hợp với nhu cầu của bạn
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {flightData.outboundFlight?.flightTravelClasses &&
                        flightData.outboundFlight.flightTravelClasses.length >
                          0 ? (
                          flightData.outboundFlight.flightTravelClasses.map(
                            (travelClass) => (
                              <FareOption
                                key={travelClass.id}
                                fare={travelClass}
                                isSelected={outboundFare === travelClass.id}
                                onSelect={() =>
                                  handleSelectFare(travelClass.id)
                                }
                                onProceedToBooking={() => {
                                  if (outboundFare === travelClass.id) {
                                    setFareSelectionStep("return");
                                  }
                                }}
                                isMultiCity={false}
                              />
                            )
                          )
                        ) : (
                          <div className="col-span-full text-center py-8 text-gray-500">
                            <div className="mb-4">
                              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg
                                  className="w-8 h-8 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Không có hạng vé cho chuyến đi
                              </h3>
                              <p className="text-sm text-gray-600">
                                Hiện tại chưa có thông tin về các hạng vé cho
                                chuyến bay này. Vui lòng liên hệ với hãng hàng
                                không để biết thêm chi tiết.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {fareSelectionStep === "return" && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          Chọn hạng vé cho chuyến về
                        </h3>
                        <p className="text-sm text-gray-600">
                          Chọn hạng vé phù hợp với nhu cầu của bạn
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {flightData.returnFlight?.flightTravelClasses &&
                        flightData.returnFlight.flightTravelClasses.length >
                          0 ? (
                          flightData.returnFlight.flightTravelClasses.map(
                            (travelClass) => (
                              <FareOption
                                key={travelClass.id}
                                fare={travelClass}
                                isSelected={returnFare === travelClass.id}
                                onSelect={() =>
                                  handleSelectFare(travelClass.id)
                                }
                                onProceedToBooking={() => {
                                  if (returnFare === travelClass.id) {
                                    setFareSelectionStep("confirm");
                                  }
                                }}
                                isMultiCity={false}
                              />
                            )
                          )
                        ) : (
                          <div className="col-span-full text-center py-8 text-gray-500">
                            <div className="mb-4">
                              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg
                                  className="w-8 h-8 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Không có hạng vé cho chuyến về
                              </h3>
                              <p className="text-sm text-gray-600">
                                Hiện tại chưa có thông tin về các hạng vé cho
                                chuyến bay này. Vui lòng liên hệ với hãng hàng
                                không để biết thêm chi tiết.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {fareSelectionStep === "confirm" &&
                    outboundFare &&
                    returnFare && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-purple-600">
                          Xác nhận lựa chọn
                        </h3>
                        <div className="space-y-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="font-medium text-blue-800 mb-2">
                              Chuyến đi
                            </h4>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Hạng vé:</span>
                                <span className="font-medium">
                                  {flightData.outboundFlight?.flightTravelClasses?.find(
                                    (tc) => tc.id === outboundFare
                                  )?.travelClass?.className || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Giá:</span>
                                <span className="font-medium">
                                  {formatCurrencyVND(
                                    flightData.outboundFlight?.flightTravelClasses?.find(
                                      (tc) => tc.id === outboundFare
                                    )?.price || 0
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="font-medium text-green-800 mb-2">
                              Chuyến về
                            </h4>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Hạng vé:</span>
                                <span className="font-medium">
                                  {flightData.returnFlight?.flightTravelClasses?.find(
                                    (tc) => tc.id === returnFare
                                  )?.travelClass?.className || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Giá:</span>
                                <span className="font-medium">
                                  {formatCurrencyVND(
                                    flightData.returnFlight?.flightTravelClasses?.find(
                                      (tc) => tc.id === returnFare
                                    )?.price || 0
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="border-t pt-4">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">Tổng cộng:</span>
                              <span className="text-xl font-bold text-blue-600">
                                {formatCurrencyVND(
                                  (flightData.outboundFlight?.flightTravelClasses?.find(
                                    (tc) => tc.id === outboundFare
                                  )?.price || 0) +
                                    (flightData.returnFlight?.flightTravelClasses?.find(
                                      (tc) => tc.id === returnFare
                                    )?.price || 0)
                                )}
                              </span>
                            </div>
                          </div>
                          <Button
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleProceedToBooking(flightData)}
                          >
                            Xác nhận và đặt vé
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                // One-way fare selection - Horizontal Layout
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Chọn hạng vé phù hợp
                    </h3>
                    <p className="text-sm text-gray-600">
                      Chọn hạng vé và tùy chọn phù hợp với nhu cầu của bạn
                    </p>
                  </div>

                  {flightData?.flightTravelClasses &&
                  flightData.flightTravelClasses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {flightData.flightTravelClasses.map((travelClass) => (
                        <FareOption
                          key={travelClass.id}
                          fare={travelClass}
                          isSelected={selectedFare === travelClass.id}
                          onSelect={() => handleSelectFare(travelClass.id)}
                          onProceedToBooking={() =>
                            handleProceedToBooking(flightData, travelClass)
                          }
                          isMultiCity={flightData.isMultiCity}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-12">
                      <div className="mb-4">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Không có thông tin hạng vé
                        </h3>
                        <p className="text-sm text-gray-600">
                          Hiện tại chưa có thông tin về các hạng vé cho chuyến
                          bay này. Vui lòng liên hệ với hãng hàng không để biết
                          thêm chi tiết.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fare Summary for Multi-city */}
          {flightData?.isMultiCity &&
            selectedFare &&
            flightData?.flightTravelClasses && (
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-800">
                    Tóm tắt đặt vé Multi-City
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Loại hành trình:</span>
                      <span>
                        Multi-City ({flightData.legs?.length || 0} chặng)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Hạng vé:</span>
                      <span>
                        {flightData.flightTravelClasses.find(
                          (tc) => tc.id === selectedFare
                        )?.travelClass?.className || "Hạng vé"}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="font-medium mb-2">Các chặng bay:</div>
                        {flightData.legs?.map((leg, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-xs"
                          >
                            <span>Chặng {index + 1}:</span>
                            <span>
                              {leg.departureAirport?.airportCode} →{" "}
                              {leg.arrivalAirport?.airportCode}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="font-medium">Tổng giá vé:</span>
                      <span className="text-xl font-bold text-purple-600">
                        {formatCurrencyVND(
                          flightData.flightTravelClasses.find(
                            (tc) => tc.id === selectedFare
                          )?.price || 0
                        )}
                      </span>
                    </div>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() =>
                        handleProceedToBooking(flightData, selectedFare)
                      }
                    >
                      Xác nhận và đặt vé Multi-City
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Fare Summary for One-way */}
          {!flightData?.isRoundTrip &&
            !flightData?.isMultiCity &&
            selectedFare &&
            flightData?.flightTravelClasses && (
              <FareSummary
                fare={
                  flightData.flightTravelClasses?.find(
                    (tc) => tc.id === selectedFare
                  )
                    ? {
                        id: flightData.flightTravelClasses.find(
                          (tc) => tc.id === selectedFare
                        ).id,
                        name:
                          flightData.flightTravelClasses.find(
                            (tc) => tc.id === selectedFare
                          ).travelClass?.className || "Hạng vé",
                        price: flightData.flightTravelClasses.find(
                          (tc) => tc.id === selectedFare
                        ).price,
                      }
                    : null
                }
                onProceedToBooking={() =>
                  handleProceedToBooking(flightData, selectedFare)
                }
              />
            )}
        </div>

        {/* Route Reviews Section - Only show if there are reviews */}
        {routeReviews.length > 0 && (
          <Card className="mb-8 mt-">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Đánh giá từ hành khách về tuyến bay này
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReviewsModalOpen(true);
                    setCurrentPage(1);
                  }}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Xem tất cả ({routeReviews.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <Swiper
                  modules={[Autoplay, Pagination]}
                  spaceBetween={20}
                  slidesPerView={1}
                  breakpoints={{
                    640: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                  }}
                  autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                  }}
                  pagination={{
                    clickable: true,
                    dynamicBullets: true,
                  }}
                  loop={routeReviews.length > 3}
                  className="pb-8"
                >
                  {routeReviews.slice(0, 8).map((review) => (
                    <SwiperSlide key={review.reviewId}>
                      <div className="bg-gray-50 dark:bg-gray-500 rounded-lg p-4 h-full">
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={review.userAvatar || "/placeholder-avatar.png"}
                            alt={review.userName}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = "/placeholder-avatar.png";
                            }}
                          />
                          <div>
                            <p className="font-medium text-sm">
                              {review.userName}
                            </p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {review.comment}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(review.reviewDate).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reviews Modal */}
        {reviewsModalOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setReviewsModalOpen(false)}
            />

            {/* Modal */}
            <div
              className="fixed top-0 right-0 h-full w-1/3 bg-white dark:bg-gray-800 border-l border-gray-200 shadow-2xl z-50 flex flex-col"
              style={{
                width: "33.333333%",
                height: "100vh",
              }}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <h2 className="text-lg font-semibold">
                      Tất cả đánh giá ({routeReviews.length})
                    </h2>
                  </div>
                  <button
                    onClick={() => setReviewsModalOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Filters and Search */}
                <div className="p-4 border-b bg-gray-50 dark:bg-gray-800 space-y-3 flex-shrink-0">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-600 dark:text-white flex items-center gap-1 mb-2">
                        <Filter className="h-3 w-3" />
                        Lọc theo sao
                      </Label>
                      <Select
                        value={reviewFilter}
                        onValueChange={setReviewFilter}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="5">5 sao</SelectItem>
                          <SelectItem value="4">4 sao</SelectItem>
                          <SelectItem value="3">3 sao</SelectItem>
                          <SelectItem value="2">2 sao</SelectItem>
                          <SelectItem value="1">1 sao</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1">
                      <Label className="text-xs text-gray-600 dark:text-white flex items-center gap-1 mb-2">
                        <SortAsc className="h-3 w-3" />
                        Sắp xếp
                      </Label>
                      <Select value={reviewSort} onValueChange={setReviewSort}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Mới nhất</SelectItem>
                          <SelectItem value="oldest">Cũ nhất</SelectItem>
                          <SelectItem value="highest">Sao cao nhất</SelectItem>
                          <SelectItem value="lowest">Sao thấp nhất</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {getFilteredAndSortedReviews().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Không tìm thấy đánh giá nào</p>
                    </div>
                  ) : (
                    getPaginatedReviews().map((review) => (
                      <div
                        key={review.reviewId}
                        className="bg-white dark:bg-gray-400 border rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={review.userAvatar || "/placeholder-avatar.png"}
                            alt={review.userName}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = "/placeholder-avatar.png";
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {review.userName}
                            </p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(review.reviewDate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {review.comment}
                        </p>
                        {review.flightCode && (
                          <div className="mt-2 text-xs text-gray-500">
                            Chuyến bay: {review.flightCode}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {getTotalPages() > 1 && (
                  <div className="border-t p-4 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 px-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: getTotalPages() },
                          (_, i) => i + 1
                        ).map((page) => (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="h-8 w-8 p-0 text-xs"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === getTotalPages()}
                        className="h-8 px-2"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FlightDetail;
