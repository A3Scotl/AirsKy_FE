"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { flightApi } from "@/apis/flight-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

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

  console.log("🔍 detectFlightType:", {
    flight: flight,
    tripType: flight.tripType,
    isMultiCityDisplay: flight.isMultiCityDisplay,
    isMultiCity: flight.isMultiCity,
    legsLength: flight.legs?.length,
    detected: { isItinerary, isRoundTrip, isRoundTripDirect, isMultiCity },
  });

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
      flightTravelClasses: firstLeg.flightTravelClasses || [],

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
      outboundFlight: normalizeFlightData(outbound),
      returnFlight: normalizeFlightData(returnFlight),
      totalPrice: flight.totalPrice || flight.priceNumeric || 0,

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

      // Aircraft info
      aircraft:
        typeof flight.aircraft === "object" && flight.aircraft !== null
          ? flight.aircraft.aircraftName ||
            flight.aircraft.aircraftCode ||
            "N/A"
          : flight.aircraft || "N/A",

      // Pricing
      price: flight.priceNumeric || flight.price || 0,
      basePrice: flight.priceNumeric || flight.price || 0,
      totalPrice: flight.totalPrice || flight.priceNumeric || flight.price || 0,

      // Status and availability
      status: flight.status || "N/A",
      availableSeats: flight.availableSeats || 0,
      totalSeats: flight.totalSeats || 0,

      // Additional info
      gate:
        flight.departureAirport?.gates?.[0]?.gateName || flight.gate || "TBA",
      terminal:
        flight.departureAirport?.gates?.[0]?.terminal ||
        flight.terminal ||
        "TBA",
      type: flight.type || "ONE_WAY",

      // Travel classes
      flightTravelClasses: flight.flightTravelClasses || [],

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

// FareOption Component
const FareOption = ({
  fare,
  isSelected,
  onSelect,
  onProceedToBooking,
  isMultiCity = false,
}) => {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 ${
        isSelected
          ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950"
          : "hover:shadow-md"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{fare.name}</CardTitle>
          {fare.recommended && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Khuyến nghị
            </Badge>
          )}
        </div>
        <div className="text-2xl font-bold text-blue-600">
          {formatCurrencyVND(fare.price)}
        </div>
        {isMultiCity &&
          fare.originalPrice &&
          fare.originalPrice !== fare.price && (
            <div className="text-xs text-gray-500">
              Giá mỗi chặng: {formatCurrencyVND(fare.originalPrice)}
            </div>
          )}
        <div className="text-sm text-gray-500">
          {fare.availableSeats} ghế còn lại
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Multi-city segment breakdown */}
        {isMultiCity && fare.segmentBreakdown && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
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

        <div className="space-y-2 mb-4">
          {fare.features?.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              {feature.included ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
              )}
              <span
                className={`text-sm ${
                  feature.included
                    ? "text-gray-900"
                    : "text-gray-400 line-through"
                }`}
              >
                {feature.text}
              </span>
            </div>
          ))}
        </div>
        <Button
          className="w-full"
          onClick={isSelected ? onProceedToBooking : onSelect}
          variant={isSelected ? "default" : "outline"}
        >
          {isSelected ? "Tiếp tục đặt vé" : "Chọn"}
        </Button>
      </CardContent>
    </Card>
  );
};

// FareSummary Component
const FareSummary = ({ fare, onProceedToBooking }) => {
  if (!fare) return null;

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800">Tóm tắt đặt vé</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Hạng vé:</span>
            <span>{fare.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Giá vé:</span>
            <span className="text-xl font-bold text-blue-600">
              {formatCurrencyVND(fare.price)}
            </span>
          </div>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
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
        if (location.state && location.state.flight) {
          const flight = location.state.flight;
          console.log("🚀 Flight data from location.state:", flight);
          console.log(
            "🚀 Is Multi-City?",
            flight.isMultiCity || flight.isMultiCityDisplay
          );
          console.log("🚀 Legs count:", flight.legs?.length);
          console.log("🚀 Original itinerary:", flight.originalItinerary);

          let flightToProcess = flight;

          // If flight has originalFlight, use that
          if (flight.originalFlight) {
            flightToProcess = flight.originalFlight;
            console.log("🚀 Using originalFlight:", flightToProcess);
          }

          // If flight has originalItinerary, use that for multi-city
          if (flight.originalItinerary && flight.isMultiCity) {
            flightToProcess = flight.originalItinerary;
            console.log(
              "🚀 Using originalItinerary for multi-city:",
              flightToProcess
            );
          }

          // Transform flight data to match expected structure
          const transformedFlight = normalizeFlightData(flightToProcess);
          console.log("🚀 Transformed flight data:", transformedFlight);
          setFlightData(transformedFlight);
          setLoading(false);
          return;
        }

        // If no state data, try to fetch from API using flight ID
        if (id) {
          console.log("Fetching flight data from API with ID:", id);

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
          console.error("No flight ID provided");
          setFlightData(null);
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

  // Load selected fares from localStorage when component mounts
  useEffect(() => {
    if (flightData) {
      const savedSelectedFare = localStorage.getItem("selectedFare");
      const savedOutboundFare = localStorage.getItem("selectedOutboundFare");
      const savedReturnFare = localStorage.getItem("selectedReturnFare");

      if (flightData.isRoundTrip) {
        if (savedOutboundFare) {
          setOutboundFare(savedOutboundFare);
          if (savedReturnFare) {
            setReturnFare(savedReturnFare);
            setFareSelectionStep("confirm");
          } else {
            setFareSelectionStep("return");
          }
        }
      } else {
        if (savedSelectedFare) {
          setSelectedFare(savedSelectedFare);
        }
      }
    }
  }, [flightData]);

  const handleSelectFare = (fareId) => {
    if (flightData?.isMultiCity) {
      // Multi-city uses individual segment selection now
      // This function is not used for multi-city anymore
      console.log("Multi-city fare selection handled individually per segment");
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

  const handleProceedToBooking = () => {
    try {
      console.log("🚀 handleProceedToBooking - flightData:", flightData);
      console.log("🚀 isMultiCity:", flightData?.isMultiCity);
      console.log("🚀 legs:", flightData?.legs);
      console.log("🚀 selectedFare:", selectedFare);

      let bookingData;

      if (flightData?.isMultiCity) {
        // Handle multi-city booking with individual segment fares
        if (
          !_selectedFares.segmentFares ||
          Object.keys(_selectedFares.segmentFares).length !==
            flightData.legs?.length
        ) {
          alert(
            "Vui lòng chọn hạng vé cho tất cả các chặng trong chuyến bay đa thành phố"
          );
          return;
        }

        // Generate multi-city flight ID with format: multi-city-{leg1Id}-{leg2Id}-...
        const legIds = flightData.legs
          .map((leg) => leg.id || leg.flightId)
          .join("-");
        const multiCityFlightId = `multi-city-${legIds}`;

        // Generate combined flight number
        const flightNumbers = flightData.legs
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
            flightData.airline ||
            flightData.legs[0]?.airline?.airlineName ||
            flightData.legs[0]?.airline,
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
              arrivalAirport: {
                code: leg.arrivalAirport?.airportCode,
                name:
                  leg.arrivalAirport?.airportName || leg.arrivalAirport?.name,
                city:
                  leg.arrivalAirport?.city ||
                  leg.arrivalAirport?.cityNames?.[0],
                airportName:
                  leg.arrivalAirport?.airportName || leg.arrivalAirport?.name,
                gate: leg.arrivalAirport?.gates?.[0]?.gateName || "TBA",
                terminal: leg.arrivalAirport?.gates?.[0]?.terminal || "TBA",
              },
              arrivalAirport: {
                code: leg.arrivalAirport?.airportCode,
                name:
                  leg.arrivalAirport?.airportName || leg.arrivalAirport?.name,
                city:
                  leg.arrivalAirport?.city ||
                  leg.arrivalAirport?.cityNames?.[0],
                airportName:
                  leg.arrivalAirport?.airportName || leg.arrivalAirport?.name,
                gate: leg.arrivalAirport?.gates?.[0]?.gateName || "TBA",
                terminal: leg.arrivalAirport?.gates?.[0]?.terminal || "TBA",
              },
              duration: leg.duration,
              aircraft: leg.aircraft || leg.aircraftName,
              aircraftName: leg.aircraftName || leg.aircraft,
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

        console.log("🚀 Multi-city bookingData created:", bookingData);
      } else if (flightData?.isRoundTrip) {
        // Handle round-trip booking
        if (!outboundFare || !returnFare) {
          alert("Vui lòng chọn hạng vé cho cả chuyến đi và chuyến về");
          return;
        }

        const outboundTravelClass =
          flightData.outboundFlight?.flightTravelClasses?.find(
            (tc) => tc.id === outboundFare
          );
        const returnTravelClass =
          flightData.returnFlight?.flightTravelClasses?.find(
            (tc) => tc.id === returnFare
          );

        bookingData = {
          type: "ROUND_TRIP",
          itineraryId: flightData.id,
          flightNumber: `${
            flightData.outboundFlight?.flightNumber || "N/A"
          } / ${flightData.returnFlight?.flightNumber || "N/A"}`,
          airline:
            flightData.outboundFlight?.airline || flightData.airline || "N/A",
          airlineLogo:
            flightData.outboundFlight?.airlineLogo || flightData.airlineLogo,
          outbound: {
            id:
              flightData.outboundFlight?.id ||
              flightData.outboundFlight?.flightId,
            flightId:
              flightData.outboundFlight?.flightId ||
              flightData.outboundFlight?.id,
            flightNumber: flightData.outboundFlight?.flightNumber,
            airline: flightData.outboundFlight?.airline,
            airlineName:
              flightData.outboundFlight?.airlineName ||
              flightData.outboundFlight?.airline,
            airlineLogo: flightData.outboundFlight?.airlineLogo,
            selectedClass: outboundTravelClass,
            departureTime: formatTimeVN(
              flightData.outboundFlight?.departureTime
            ),
            arrivalTime: formatTimeVN(flightData.outboundFlight?.arrivalTime),
            departureDate: formatDateVN(
              flightData.outboundFlight?.departureTime
            ),
            arrivalDate: formatDateVN(flightData.outboundFlight?.arrivalTime),
            from: flightData.outboundFlight?.from || "N/A",
            to: flightData.outboundFlight?.to || "N/A",
            departureAirport: {
              code:
                flightData.outboundFlight?.departureAirport?.airportCode ||
                flightData.outboundFlight?.from,
              name:
                flightData.outboundFlight?.departureAirport?.airportName ||
                "N/A",
              city:
                flightData.outboundFlight?.departureAirport?.cityNames?.[0] ||
                "N/A",
              airportName:
                flightData.outboundFlight?.departureAirport?.airportName ||
                "N/A",
              gate:
                flightData.outboundFlight?.departureAirport?.gates?.[0]
                  ?.gateName || "TBA",
              terminal:
                flightData.outboundFlight?.departureAirport?.gates?.[0]
                  ?.terminal || "TBA",
            },
            arrivalAirport: {
              code:
                flightData.outboundFlight?.arrivalAirport?.airportCode ||
                flightData.outboundFlight?.to,
              name:
                flightData.outboundFlight?.arrivalAirport?.airportName || "N/A",
              city:
                flightData.outboundFlight?.arrivalAirport?.cityNames?.[0] ||
                "N/A",
              airportName:
                flightData.outboundFlight?.arrivalAirport?.airportName || "N/A",
              gate:
                flightData.outboundFlight?.arrivalAirport?.gates?.[0]
                  ?.gateName || "TBA",
              terminal:
                flightData.outboundFlight?.arrivalAirport?.gates?.[0]
                  ?.terminal || "TBA",
            },
            duration: flightData.outboundFlight?.duration,
            aircraft:
              flightData.outboundFlight?.aircraft ||
              flightData.outboundFlight?.aircraftName ||
              "N/A",
            aircraftName:
              flightData.outboundFlight?.aircraftName ||
              flightData.outboundFlight?.aircraft ||
              "N/A",
          },
          return: {
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
            departureTime: formatTimeVN(flightData.returnFlight?.departureTime),
            arrivalTime: formatTimeVN(flightData.returnFlight?.arrivalTime),
            departureDate: formatDateVN(flightData.returnFlight?.departureTime),
            arrivalDate: formatDateVN(flightData.returnFlight?.arrivalTime),
            from: flightData.returnFlight?.from,
            to: flightData.returnFlight?.to,
            departureAirport: {
              code:
                flightData.returnFlight?.departureAirport?.airportCode ||
                flightData.returnFlight?.from,
              name:
                flightData.returnFlight?.departureAirport?.airportName || "N/A",
              city:
                flightData.returnFlight?.departureAirport?.cityNames?.[0] ||
                "N/A",
              airportName:
                flightData.returnFlight?.departureAirport?.airportName || "N/A",
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
                flightData.returnFlight?.to,
              name:
                flightData.returnFlight?.arrivalAirport?.airportName || "N/A",
              city:
                flightData.returnFlight?.arrivalAirport?.cityNames?.[0] ||
                "N/A",
              airportName:
                flightData.returnFlight?.arrivalAirport?.airportName || "N/A",
              gate:
                flightData.returnFlight?.arrivalAirport?.gates?.[0]?.gateName ||
                "TBA",
              terminal:
                flightData.returnFlight?.arrivalAirport?.gates?.[0]?.terminal ||
                "TBA",
            },
            duration: flightData.returnFlight?.duration,
            aircraft:
              flightData.returnFlight?.aircraft ||
              flightData.returnFlight?.aircraftName ||
              "N/A",
            aircraftName:
              flightData.returnFlight?.aircraftName ||
              flightData.returnFlight?.aircraft ||
              "N/A",
          },
          totalPrice:
            (outboundTravelClass?.customPrice || 0) +
            (returnTravelClass?.customPrice || 0),
          formattedTotalPrice: formatCurrencyVND(
            (outboundTravelClass?.customPrice || 0) +
              (returnTravelClass?.customPrice || 0)
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
            aircraft: flightData.aircraft || flightData.aircraftName || "N/A",
            aircraftName:
              flightData.aircraftName || flightData.aircraft || "N/A",
            stops: flightData.stops,
          },
          selectedClass: selectedTravelClass,
          totalPrice: selectedTravelClass?.customPrice || 0,
          formattedTotalPrice: formatCurrencyVND(
            selectedTravelClass?.customPrice || 0
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
    <div className="min-h-screen bg-gray-50 py-8 pt-24">
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
                  <CardTitle className="text-2xl font-bold">
                    {flightData.airline}
                  </CardTitle>
                  <p className="text-gray-600">
                    Chuyến bay {flightData.flightNumber}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrencyVND(flightData.totalPrice || flightData.price)}
                </div>
                <p className="text-sm text-gray-500">Giá từ / người</p>
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
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {flightData.outboundFlight?.departure?.time || "N/A"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flightData.outboundFlight?.departure?.city || "N/A"}
                      </div>
                      <div className="text-sm font-medium">
                        {flightData.outboundFlight?.departure?.code || "N/A"}
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
                        {formatDuration(flightData.outboundFlight?.duration)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {flightData.outboundFlight?.arrival?.time || "N/A"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flightData.outboundFlight?.arrival?.city || "N/A"}
                      </div>
                      <div className="text-sm font-medium">
                        {flightData.outboundFlight?.arrival?.code || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Return */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-green-600">
                    Chuyến về
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {flightData.returnFlight?.departure?.time || "N/A"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flightData.returnFlight?.departure?.city || "N/A"}
                      </div>
                      <div className="text-sm font-medium">
                        {flightData.returnFlight?.departure?.code || "N/A"}
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
                        {formatDuration(flightData.returnFlight?.duration)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {flightData.returnFlight?.arrival?.time || "N/A"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flightData.returnFlight?.arrival?.city || "N/A"}
                      </div>
                      <div className="text-sm font-medium">
                        {flightData.returnFlight?.arrival?.code || "N/A"}
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
                    {flightData.departure?.time || "N/A"}
                  </div>
                  <div className="text-lg font-medium">
                    {flightData.departure?.city || "N/A"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {flightData.departure?.code || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {flightData.departure?.date || "N/A"}
                  </div>
                </div>
                <div className="flex-1 mx-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-blue-300"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-gray-50 px-4 py-2">
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
                    {flightData.arrival?.time || "N/A"}
                  </div>
                  <div className="text-lg font-medium">
                    {flightData.arrival?.city || "N/A"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {flightData.arrival?.code || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {flightData.arrival?.date || "N/A"}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Flight Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Chi tiết chuyến bay</TabsTrigger>
                <TabsTrigger value="map">Bản đồ tuyến bay</TabsTrigger>
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
                                  {flightData.outboundFlight?.aircraft || "N/A"}
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
                              <div>
                                <span className="text-sm text-gray-600">
                                  Trạng thái:
                                </span>
                                <p className="font-medium">
                                  {flightData.outboundFlight?.status || "N/A"}
                                </p>
                              </div>
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
                                  {flightData.returnFlight?.aircraft || "N/A"}
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
                              <div>
                                <span className="text-sm text-gray-600">
                                  Trạng thái:
                                </span>
                                <p className="font-medium">
                                  {flightData.returnFlight?.status || "N/A"}
                                </p>
                              </div>
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
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Trạng thái:
                                </span>
                                <span className="font-medium">
                                  {flightData.status}
                                </span>
                              </div>
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

              <TabsContent value="map" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bản đồ tuyến bay</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FlightRouteMap
                      searchData={{
                        tripType: flightData?.isRoundTrip
                          ? "round_trip"
                          : "one_way",
                        from: flightData?.from || flightData?.departure?.code,
                        to: flightData?.to || flightData?.arrival?.code,
                      }}
                      flightInfo={flightData}
                      height="400px"
                      showFlightPath={true}
                      showAirportInfo={true}
                      className="rounded-lg"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Fare Selection */}
          <div className="space-y-6">
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
                        Chuyến bay Multi-City ({flightData.legs?.length ||
                          0}{" "}
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
                                        price: travelClass.customPrice,
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
                                        {formatCurrencyVND(
                                          travelClass.customPrice
                                        )}
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
                                Object.values(
                                  _selectedFares.segmentFares
                                ).reduce((sum, fare) => sum + fare.price, 0)
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
                              (index === 0 &&
                                fareSelectionStep === "outbound") ||
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
                      <div className="space-y-4">
                        <h3 className="font-semibold text-blue-600">
                          Chọn hạng vé cho chuyến đi
                        </h3>
                        <div className="space-y-3">
                          {flightData.outboundFlight?.flightTravelClasses?.map(
                            (travelClass, index) => {
                              const isRecommended = index === 0;
                              return (
                                <FareOption
                                  key={travelClass.id}
                                  fare={{
                                    id: travelClass.id,
                                    name:
                                      travelClass.travelClass?.className ||
                                      `Hạng ${index + 1}`,
                                    price: travelClass.customPrice,
                                    recommended: isRecommended,
                                    features: [
                                      {
                                        included: true,
                                        text: "Hành lý xách tay",
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
                                  }}
                                  flight={flightData}
                                  isSelected={outboundFare === travelClass.id}
                                  onSelect={() =>
                                    handleSelectFare(travelClass.id)
                                  }
                                  onProceedToBooking={() => {}}
                                />
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}

                    {fareSelectionStep === "return" && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-green-600">
                          Chọn hạng vé cho chuyến về
                        </h3>
                        <div className="space-y-3">
                          {flightData.returnFlight?.flightTravelClasses?.map(
                            (travelClass, index) => {
                              const isRecommended = index === 0;
                              return (
                                <FareOption
                                  key={travelClass.id}
                                  fare={{
                                    id: travelClass.id,
                                    name:
                                      travelClass.travelClass?.className ||
                                      `Hạng ${index + 1}`,
                                    price: travelClass.customPrice,
                                    recommended: isRecommended,
                                    features: [
                                      {
                                        included: true,
                                        text: "Hành lý xách tay",
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
                                  }}
                                  flight={flightData}
                                  isSelected={returnFare === travelClass.id}
                                  onSelect={() =>
                                    handleSelectFare(travelClass.id)
                                  }
                                  onProceedToBooking={() => {}}
                                />
                              );
                            }
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
                                      )?.customPrice || 0
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
                                      )?.customPrice || 0
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="border-t pt-4">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold">
                                  Tổng cộng:
                                </span>
                                <span className="text-xl font-bold text-blue-600">
                                  {formatCurrencyVND(
                                    (flightData.outboundFlight?.flightTravelClasses?.find(
                                      (tc) => tc.id === outboundFare
                                    )?.customPrice || 0) +
                                      (flightData.returnFlight?.flightTravelClasses?.find(
                                        (tc) => tc.id === returnFare
                                      )?.customPrice || 0)
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
                  // One-way fare selection
                  <div className="space-y-4">
                    {flightData?.flightTravelClasses &&
                    flightData.flightTravelClasses.length > 0 ? (
                      flightData.flightTravelClasses.map(
                        (travelClass, index) => {
                          const isRecommended = index === 0;
                          return (
                            <FareOption
                              key={travelClass.id}
                              fare={{
                                id: travelClass.id,
                                name:
                                  travelClass.travelClass?.className ||
                                  `Hạng ${index + 1}`,
                                price: travelClass.customPrice,
                                recommended: isRecommended,
                                features: [
                                  { included: true, text: "Hành lý xách tay" },
                                  {
                                    included:
                                      travelClass.travelClass?.benefits
                                        ?.toLowerCase()
                                        .includes("ký gửi") || false,
                                    text: "Hành lý ký gửi",
                                  },
                                  {
                                    included:
                                      travelClass.travelClass?.benefits
                                        ?.toLowerCase()
                                        .includes("chỗ ngồi") || false,
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
                              }}
                              flight={flightData}
                              isSelected={selectedFare === travelClass.id}
                              onSelect={() => handleSelectFare(travelClass.id)}
                              onProceedToBooking={() =>
                                handleProceedToBooking(flightData, selectedFare)
                              }
                            />
                          );
                        }
                      )
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <p>Không có thông tin hạng vé cho chuyến bay này</p>
                        <p className="text-sm mt-2">
                          Vui lòng liên hệ với hãng hàng không để biết thêm chi
                          tiết
                        </p>
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
                            )?.customPrice || 0
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
                          ).customPrice,
                        }
                      : null
                  }
                  onProceedToBooking={() =>
                    handleProceedToBooking(flightData, selectedFare)
                  }
                />
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDetail;
