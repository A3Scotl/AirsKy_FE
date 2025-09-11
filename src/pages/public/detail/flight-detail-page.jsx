"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { flightApi } from "@/apis/flight-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import FlightRouteMap from "@/components/common/flight-route-map";
import CustomStepper from "@/lib/Stepper";
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
  ChevronRight,
} from "lucide-react";

// Helper function to combine travel classes from round trip flights
const combineRoundTripClasses = (outboundClasses, inboundClasses) => {
  if (!outboundClasses && !inboundClasses) return [];
  if (!outboundClasses) return inboundClasses;
  if (!inboundClasses) return outboundClasses;

  // Create an object to store classes by classId for easy lookup
  const combinedClasses = {};

  // Add outbound classes
  outboundClasses.forEach((cls) => {
    const key =
      cls.travelClass?.classId || cls.travelClass?.className || cls.id;
    combinedClasses[key] = {
      ...cls,
      direction: "outbound",
      combinedPrice: cls.customPrice || cls.price || 0,
      outboundPrice: cls.customPrice || cls.price || 0,
    };
  });

  // Add or merge inbound classes
  inboundClasses.forEach((cls) => {
    const key =
      cls.travelClass?.classId || cls.travelClass?.className || cls.id;
    const existing = combinedClasses[key];

    if (existing) {
      // If class exists in both directions, combine prices
      existing.combinedPrice =
        (existing.outboundPrice || 0) + (cls.customPrice || cls.price || 0);
      existing.inboundPrice = cls.customPrice || cls.price || 0;
      existing.availableSeats = Math.min(
        existing.availableSeats,
        cls.availableSeats || 0
      );
    } else {
      // If class only exists in inbound, add it
      combinedClasses[key] = {
        ...cls,
        direction: "inbound",
        combinedPrice: cls.customPrice || cls.price || 0,
        inboundPrice: cls.customPrice || cls.price || 0,
      };
    }
  });

  return Object.values(combinedClasses);
};

// Helper function to normalize flight data
const normalizeFlightData = (flight) => {
  console.log("[normalizeFlightData] Input flight data:", flight);

  // Check if this is a round-trip or multi-city itinerary
  const isItinerary = flight.tripType && flight.legs;
  const isRoundTrip =
    isItinerary && flight.tripType === "ROUND_TRIP" && flight.legs?.length >= 2;
  const isMultiCity =
    isItinerary && flight.tripType === "MULTI_CITY" && flight.legs?.length > 1;

  let processedFlight;

  if (isRoundTrip) {
    // Handle round-trip itinerary
    const outbound = flight.legs[0];
    const returnFlight = flight.legs[1];

    processedFlight = {
      // Basic flight info
      id: flight.itineraryId || flight.flightId || Date.now().toString(),
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
      departureAirport: outbound.departureAirport || {},
      from: outbound.departureAirport?.airportCode || outbound.from || "N/A",
      fromCode:
        outbound.departureAirport?.airportCode || outbound.fromCode || "N/A",

      arrivalTime: returnFlight.arrivalTime,
      arrivalAirport: returnFlight.arrivalAirport || {},
      to: returnFlight.arrivalAirport?.airportCode || returnFlight.to || "N/A",
      toCode:
        returnFlight.arrivalAirport?.airportCode ||
        returnFlight.toCode ||
        "N/A",

      // Combined duration
      duration: (outbound.duration || 0) + (returnFlight.duration || 0),

      // Travel classes - combine both directions
      flightTravelClasses: combineRoundTripClasses(
        outbound.flightTravelClasses || [],
        returnFlight.flightTravelClasses || []
      ),

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
  } else if (isMultiCity) {
    // Handle multi-city itinerary
    const firstLeg = flight.legs[0];
    const lastLeg = flight.legs[flight.legs.length - 1];

    processedFlight = {
      // Basic flight info
      id: flight.itineraryId || flight.flightId || Date.now().toString(),
      flightId: flight.itineraryId || flight.flightId || Date.now().toString(),
      flightNumber: `${flight.legs.length} chặng`,

      // Airline info
      airline:
        firstLeg.airline?.airlineName ||
        firstLeg.airlineName ||
        "Multiple Airlines",
      airlineName:
        firstLeg.airline?.airlineName ||
        firstLeg.airlineName ||
        "Multiple Airlines",
      airlineLogo:
        firstLeg.airline?.thumbnail ||
        firstLeg.airline?.logo ||
        "/placeholder.svg",

      // Multi-city specific data
      isMultiCity: true,
      tripType: "MULTI_CITY",
      multiCityLegs: flight.legs.map((leg) => normalizeFlightData(leg)),
      totalPrice: flight.totalPrice || 0,

      // Use first and last leg for primary display
      departureTime: firstLeg.departureTime,
      departureAirport: firstLeg.departureAirport || {},
      from: firstLeg.departureAirport?.airportCode || firstLeg.from || "N/A",
      fromCode:
        firstLeg.departureAirport?.airportCode || firstLeg.fromCode || "N/A",

      arrivalTime: lastLeg.arrivalTime,
      arrivalAirport: lastLeg.arrivalAirport || {},
      to: lastLeg.arrivalAirport?.airportCode || lastLeg.to || "N/A",
      toCode: lastLeg.arrivalAirport?.airportCode || lastLeg.toCode || "N/A",

      // Total duration
      duration: flight.legs.reduce(
        (total, leg) => total + (leg.duration || 0),
        0
      ),

      // Travel classes - use first leg as representative
      flightTravelClasses: firstLeg.flightTravelClasses || [],

      // Status and availability
      status: "Scheduled",
      availableSeats: Math.min(
        ...flight.legs.map((leg) => leg.availableSeats || 0)
      ),
      totalSeats: Math.min(...flight.legs.map((leg) => leg.totalSeats || 0)),
    };
  } else {
    // Handle single flight (one-way or direct flight)
    processedFlight = {
      // Basic flight info
      id: flight.flightId || flight.id || Date.now().toString(),
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
      departureAirport: flight.departureAirport || {},
      from: flight.departureAirport?.airportCode || flight.from || "N/A",
      fromCode:
        flight.departureAirport?.airportCode || flight.fromCode || "N/A",

      // Arrival info
      arrivalTime: flight.arrivalTime,
      arrivalAirport: flight.arrivalAirport || {},
      to: flight.arrivalAirport?.airportCode || flight.to || "N/A",
      toCode: flight.arrivalAirport?.airportCode || flight.toCode || "N/A",

      // Flight details
      duration: flight.duration || 0,
      stops: flight.stops || flight.stopsList || [],
      stopsList: flight.stopsList || [],

      // Aircraft info - handle both object and string formats
      aircraft:
        typeof flight.aircraft === "object" && flight.aircraft !== null
          ? flight.aircraft.aircraftName ||
            flight.aircraft.aircraftCode ||
            "Boeing 737"
          : flight.aircraft || "Boeing 737",

      // Pricing
      price: flight.basePrice || flight.priceNumeric || flight.price || 0,
      basePrice: flight.basePrice || flight.priceNumeric || flight.price || 0,

      // Status and availability
      status: flight.status || "Scheduled",
      availableSeats: flight.availableSeats || 0,
      totalSeats: flight.totalSeats || 0,

      // Additional info
      gate: flight.gate || "TBA",
      terminal: flight.terminal || "TBA",
      type: flight.type || "ONE_WAY",

      // Travel classes
      flightTravelClasses: flight.flightTravelClasses || [],

      // Additional fields for compatibility
      businessName: flight.businessName || "",
    };
  }

  // Build departure object (common for all types)
  processedFlight.departure = {
    city:
      processedFlight.departureAirport?.cityNames?.[0] ||
      processedFlight.departureAirport?.cityName ||
      processedFlight.departureAirport?.airportName ||
      "N/A",
    airportName: processedFlight.departureAirport?.airportName || "N/A",
    code:
      processedFlight.departureAirport?.airportCode ||
      processedFlight.fromCode ||
      "N/A",
    time: processedFlight.departureTime
      ? new Date(processedFlight.departureTime).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A",
    date: processedFlight.departureTime
      ? new Date(processedFlight.departureTime).toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("vi-VN"),
  };

  // Build arrival object (common for all types)
  processedFlight.arrival = {
    city:
      processedFlight.arrivalAirport?.cityNames?.[0] ||
      processedFlight.arrivalAirport?.cityName ||
      processedFlight.arrivalAirport?.airportName ||
      "N/A",
    airportName: processedFlight.arrivalAirport?.airportName || "N/A",
    code:
      processedFlight.arrivalAirport?.airportCode ||
      processedFlight.toCode ||
      "N/A",
    time: processedFlight.arrivalTime
      ? new Date(processedFlight.arrivalTime).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A",
    date: processedFlight.arrivalTime
      ? new Date(processedFlight.arrivalTime).toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("vi-VN"),
  };

  // Format duration
  processedFlight.duration = processedFlight.duration
    ? `${Math.floor(processedFlight.duration / 60)}h ${
        processedFlight.duration % 60
      }m`
    : "N/A";

  console.log("[normalizeFlightData] Processed flight data:", processedFlight);
  return processedFlight;
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
  const [outboundFare, setOutboundFare] = useState(null);
  const [returnFare, setReturnFare] = useState(null);
  const [flightData, setFlightData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fareOptions, setFareOptions] = useState([]);
  const [fareSelectionStep, setFareSelectionStep] = useState("outbound"); // 'outbound' or 'return'

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

        console.log("[FlightDetail] useEffect triggered");
        console.log("[FlightDetail] location.state:", location.state);
        console.log("[FlightDetail] URL param id:", id);

        // First try to get data from location state
        if (location.state && location.state.flight) {
          const flight = location.state.flight;
          console.log(
            "[FlightDetail] Found flight data in location.state:",
            flight
          );

          // Handle different flight data structures
          let flightToProcess = flight;

          // If flight has originalFlight (from suggestion section), use that
          if (flight.originalFlight) {
            console.log("[FlightDetail] Using originalFlight from suggestion");
            flightToProcess = flight.originalFlight;
          }

          // Transform flight data to match expected structure
          const transformedFlight = normalizeFlightData(flightToProcess);
          console.log(
            "[FlightDetail] Transformed flight data:",
            transformedFlight
          );

          setFlightData(transformedFlight);
          setLoading(false);
          return;
        }

        // If no state data, try to fetch from API using flight ID
        if (id) {
          console.log(
            "[FlightDetail] No state data, trying to fetch from API with ID:",
            id
          );

          try {
            const response = await flightApi.getFlightById(id);
            console.log("[FlightDetail] API response:", response);

            if (response.success && response.data) {
              // Transform flight data to match expected structure
              const transformedFlight = normalizeFlightData(response.data);
              console.log(
                "[FlightDetail] API transformed flight data:",
                transformedFlight
              );

              setFlightData(transformedFlight);
              setLoading(false);
              return;
            } else {
              console.error(
                "[FlightDetail] API call failed:",
                response.message
              );
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error(
              "[FlightDetail] Error fetching flight from API:",
              error
            );
            setLoading(false);
            return;
          }
        }

        // If no ID and no state data, show error
        console.error("[FlightDetail] No flight ID or flight data provided");
        setLoading(false);
      } catch (error) {
        console.error("[FlightDetail] Error loading flight data:", error);
        setLoading(false);
      }
    };

    getFlightData();
  }, [location.state, id]);

  // Load fare options from flight data
  const loadFareOptions = (flight) => {
    try {
      console.log(
        "[FlightDetail] Loading fare options from flight data:",
        flight
      );

      if (!flight || !flight.flightTravelClasses) {
        console.warn(
          "[FlightDetail] No flight travel classes found, using fallback"
        );
        // Fallback to default fare options if no flightTravelClasses
        setFareOptions([
          {
            id: "economy",
            name: "Phổ thông",
            price: flight?.price || flight?.basePrice || 299000,
            recommended: false,
            availableSeats: 15,
            features: [
              { included: true, text: "Hành lý xách tay (7kg)" },
              { included: false, text: "Hành lý ký gửi (23kg)" },
              { included: false, text: "Dịch vụ ăn uống" },
              { included: true, text: "Chọn chỗ ngồi" },
              { included: false, text: "Giải trí trên máy bay" },
            ],
          },
        ]);
        return;
      }

      // Set flightTravelClasses directly - no transformation needed
      setFareOptions(flight.flightTravelClasses);
      console.log(
        "[FlightDetail] Set fare options from flightTravelClasses:",
        flight.flightTravelClasses
      );
    } catch (error) {
      console.error("[FlightDetail] Error loading fare options:", error);
      // Use fallback fare options
      setFareOptions([
        {
          id: "economy",
          name: "Phổ thông",
          price: flight?.price || flight?.basePrice || 299000,
          recommended: false,
          availableSeats: 15,
          features: [
            { included: true, text: "Hành lý xách tay (7kg)" },
            { included: false, text: "Hành lý ký gửi (23kg)" },
            { included: false, text: "Dịch vụ ăn uống" },
            { included: true, text: "Chọn chỗ ngồi" },
            { included: false, text: "Giải trí trên máy bay" },
          ],
        },
      ]);
    }
  };

  // Load fare options when flight data is available
  useEffect(() => {
    if (flightData) {
      loadFareOptions(flightData);
    }
  }, [flightData]);

  // Handle fare selection for different flight types
  const handleSelectFare = (fareId) => {
    if (flightData?.isRoundTrip) {
      // For round-trip, we need to select both outbound and return fares
      if (!outboundFare) {
        setOutboundFare(fareId);
        setFareSelectionStep("return"); // Move to return fare selection
      } else if (!returnFare) {
        setReturnFare(fareId);
        // Stay on return step until user proceeds to booking
      } else {
        // If both are selected, reset and start over
        setOutboundFare(fareId);
        setReturnFare(null);
        setFareSelectionStep("return");
      }
    } else {
      // For one-way or multi-city, use single fare selection
      setSelectedFare(fareId);
    }
  };

  const handleSelectOutboundFare = (fareId) => {
    setOutboundFare(fareId);
    setFareSelectionStep("return"); // Move to return fare selection
  };

  const handleSelectReturnFare = (fareId) => {
    setReturnFare(fareId);
    // Stay on return step
  };

  const handleResetFareSelection = () => {
    setOutboundFare(null);
    setReturnFare(null);
    setSelectedFare(null);
    setFareSelectionStep("outbound"); // Reset to first step
  };

  const handleBackToOutbound = () => {
    setReturnFare(null);
    setFareSelectionStep("outbound");
  };

  const handleNextToReturn = () => {
    if (outboundFare) {
      setFareSelectionStep("return");
    }
  };

  const handleProceedToBooking = (flight, fareId) => {
    console.log(
      "[FlightDetail] handleProceedToBooking called with flight and fareId:",
      flight,
      fareId
    );

    if (!flight) {
      console.error("[FlightDetail] No flight data available");
      alert("Không có dữ liệu chuyến bay. Vui lòng tải lại trang.");
      return;
    }

    let bookingFlightData;

    if (flight.isRoundTrip) {
      // Handle round-trip booking
      if (!outboundFare || !returnFare) {
        alert("Vui lòng chọn hạng vé cho cả chuyến đi và chuyến về.");
        return;
      }

      const outboundFareData = flight.outboundFlight?.flightTravelClasses?.find(
        (fare) => fare.id === outboundFare
      );
      const returnFareData = flight.returnFlight?.flightTravelClasses?.find(
        (fare) => fare.id === returnFare
      );

      if (!outboundFareData || !returnFareData) {
        console.error("[FlightDetail] Round-trip fares not found");
        alert("Không tìm thấy thông tin hạng vé đã chọn.");
        return;
      }

      bookingFlightData = {
        ...flight,
        selectedOutboundFare: outboundFareData,
        selectedReturnFare: returnFareData,
        outboundFareId: outboundFare,
        returnFareId: returnFare,
        totalPrice: outboundFareData.customPrice + returnFareData.customPrice,
      };
    } else {
      // Handle one-way or multi-city booking
      const selectedFareData = flight.flightTravelClasses?.find(
        (fare) => fare.id === fareId
      );

      if (!selectedFareData) {
        console.error("[FlightDetail] Selected fare not found:", fareId);
        alert("Không tìm thấy thông tin hạng vé đã chọn.");
        return;
      }

      bookingFlightData = {
        ...flight,
        selectedFare: selectedFareData,
        fareId: fareId,
      };
    }

    console.log(
      "[FlightDetail] Prepared bookingFlightData:",
      bookingFlightData
    );

    // Store in localStorage and navigate
    localStorage.setItem("selectedFlight", JSON.stringify(bookingFlightData));
    localStorage.setItem(
      "selectedFare",
      JSON.stringify(
        bookingFlightData.selectedFare || bookingFlightData.selectedOutboundFare
      )
    );

    console.log("[FlightDetail] Data stored in localStorage");
    console.log("[FlightDetail] Navigating to booking-stepper with state:", {
      flightData: bookingFlightData,
    });

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
                    src={flightData.airlineLogo || "/placeholder.svg"}
                    alt={flightData.airline}
                    className="w-auto h-12 rounded bg-white p-1 object-cover"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg";
                    }}
                  />
                  <h1 className="text-4xl font-bold">
                    {flightData.departure?.city || flightData.from || "N/A"} →{" "}
                    {flightData.arrival?.city || flightData.to || "N/A"}
                  </h1>
                </div>
                <p className="text-xl mb-2">
                  {flightData.airline || "N/A"} Chuyến bay{" "}
                  {flightData.flightNumber || "N/A"}
                </p>
                <div className="flex items-center justify-center gap-8 text-lg">
                  <span>
                    {flightData.departure?.time || "N/A"} -{" "}
                    {flightData.arrival?.time || "N/A"}
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
                      {flightData.departure?.city || flightData.from || "N/A"} (
                      {flightData.departure?.code ||
                        flightData.fromCode ||
                        "N/A"}
                      )
                    </p>
                    <p className="text-sm text-gray-600">
                      {flightData.departure?.time || "N/A"},{" "}
                      {flightData.departure?.date || "N/A"}
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
                      {flightData.arrival?.city || flightData.to || "N/A"} (
                      {flightData.arrival?.code || flightData.toCode || "N/A"})
                    </p>
                    <p className="text-sm text-gray-600">
                      {flightData.arrival?.time || "N/A"},{" "}
                      {flightData.arrival?.date || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fare Selection Section */}
            <div className="mt-4 border-t pt-4 bg-gray-50 dark:bg-gray-800 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-4 rounded-b-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                  {flightData?.isRoundTrip
                    ? "Chọn hạng vé cho chuyến bay khứ hồi"
                    : flightData?.isMultiCity
                    ? "Chọn hạng vé cho chuyến bay đa chặng"
                    : "Chọn loại vé phù hợp"}
                </h3>
                {(outboundFare || returnFare) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFareSelection}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Đặt lại lựa chọn
                  </Button>
                )}
              </div>

              {flightData?.isRoundTrip ? (
                // Round-trip fare selection with stepper
                <div className="space-y-6">
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
                      <div className="text-sm font-medium">Chọn vé đi</div>
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
                      <div className="text-sm font-medium">Chọn vé về</div>
                    </div>
                    {fareSelectionStep === "return" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBackToOutbound}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                        Quay lại
                      </Button>
                    )}
                  </div>

                  {/* Current Step Content */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-200">
                      {fareSelectionStep === "outbound"
                        ? "Chọn hạng vé chuyến đi"
                        : "Chọn hạng vé chuyến về"}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {fareSelectionStep === "outbound"
                        ? `${flightData.outboundFlight?.departure?.code} → ${flightData.outboundFlight?.arrival?.code}`
                        : `${flightData.returnFlight?.departure?.code} → ${flightData.returnFlight?.arrival?.code}`}
                    </p>
                  </div>

                  {/* Fare Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {(fareSelectionStep === "outbound"
                      ? flightData.outboundFlight?.flightTravelClasses
                      : flightData.returnFlight?.flightTravelClasses
                    )?.map((travelClass, index) => {
                      const isRecommended = index === 0;
                      const currentFare =
                        fareSelectionStep === "outbound"
                          ? outboundFare
                          : returnFare;

                      return (
                        <FareOption
                          key={`${fareSelectionStep}-${travelClass.id}`}
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
                                  travelClass.travelClass?.changeable || false,
                                text: "Đổi vé",
                              },
                              {
                                included:
                                  travelClass.travelClass?.refundable || false,
                                text: "Hoàn tiền",
                              },
                            ],
                            availableSeats: travelClass.availableSeats,
                          }}
                          flight={flightData}
                          isSelected={currentFare === travelClass.id}
                          onSelect={() =>
                            fareSelectionStep === "outbound"
                              ? handleSelectOutboundFare(travelClass.id)
                              : handleSelectReturnFare(travelClass.id)
                          }
                          showProceedButton={false}
                        />
                      );
                    })}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {fareSelectionStep === "outbound" && outboundFare && (
                        <span className="text-green-600">
                          ✓ Đã chọn hạng vé chuyến đi
                        </span>
                      )}
                      {fareSelectionStep === "return" && returnFare && (
                        <span className="text-green-600">
                          ✓ Đã chọn hạng vé chuyến về
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      {fareSelectionStep === "outbound" && outboundFare && (
                        <Button
                          onClick={handleNextToReturn}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Tiếp tục chọn vé về
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}

                      {fareSelectionStep === "return" &&
                        outboundFare &&
                        returnFare && (
                          <Button
                            onClick={() =>
                              handleProceedToBooking(flightData, outboundFare)
                            }
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                          >
                            Đặt vé ngay
                            <Plane className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                    </div>
                  </div>
                </div>
              ) : flightData?.isMultiCity ? (
                // Multi-city fare selection
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <h4 className="font-semibold text-purple-800">
                        Chọn hạng vé cho tất cả các chặng
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {flightData.multiCityLegs?.length || 0} chặng
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {flightData.flightTravelClasses?.map(
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
                              onProceedToBooking={handleProceedToBooking}
                            />
                          );
                        }
                      )}
                    </div>
                  </div>

                  {selectedFare && flightData?.flightTravelClasses && (
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
              ) : (
                // One-way fare selection
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {flightData?.flightTravelClasses &&
                  flightData.flightTravelClasses.length > 0 ? (
                    flightData.flightTravelClasses.map((travelClass, index) => {
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
                                included:
                                  travelClass.travelClass?.changeable || false,
                                text: "Đổi vé",
                              },
                              {
                                included:
                                  travelClass.travelClass?.refundable || false,
                                text: "Hoàn tiền",
                              },
                            ],
                            availableSeats: travelClass.availableSeats,
                            benefits: travelClass.travelClass?.benefits,
                          }}
                          flight={flightData}
                          isSelected={selectedFare === travelClass.id}
                          onSelect={() => handleSelectFare(travelClass.id)}
                          onProceedToBooking={handleProceedToBooking}
                        />
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <p>Không có thông tin hạng vé cho chuyến bay này</p>
                      <p className="text-sm mt-2">
                        Vui lòng liên hệ với hãng hàng không để biết thêm chi
                        tiết
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* One-way fare summary */}
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
                                {flightData?.departure?.time || "N/A"}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400">
                                {flightData?.departure?.date || "N/A"}
                              </p>
                              <p className="text-lg font-medium text-gray-800 mt-1 dark:text-gray-300">
                                {flightData?.departure?.city ||
                                  flightData?.from ||
                                  "N/A"}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {flightData?.terminal || "TBA"}, Cổng{" "}
                                {flightData?.gate || "TBA"}
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
                                {flightData?.arrival?.time || "N/A"}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400">
                                {flightData?.arrival?.date || "N/A"}
                              </p>
                              <p className="text-lg font-medium text-gray-800 mt-1 dark:text-gray-300">
                                {flightData?.arrival?.city ||
                                  flightData?.to ||
                                  "N/A"}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Terminal {flightData?.terminal || "TBA"}, Cổng{" "}
                                {flightData?.gate || "TBA"}
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

// Component: Round Trip Fare Summary
const RoundTripFareSummary = ({
  flightData,
  outboundFareId,
  returnFareId,
  onProceedToBooking,
  onBack,
}) => {
  const outboundFare = flightData.flightTravelClasses?.find(
    (fare) => fare.id === outboundFareId
  );
  const returnFare = flightData.flightTravelClasses?.find(
    (fare) => fare.id === returnFareId
  );

  const outboundPrice =
    outboundFare?.outboundPrice || outboundFare?.customPrice || 0;
  const returnPrice = returnFare?.inboundPrice || returnFare?.customPrice || 0;
  const totalPrice = outboundPrice + returnPrice;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="border rounded-lg p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Quay lại
        </Button>
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-green-800 text-lg">
            Xác nhận lựa chọn hạng vé
          </h4>
        </div>
      </div>

      <div className="space-y-4">
        {/* Outbound flight summary */}
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-semibold text-blue-800">Chuyến đi</span>
              <Badge variant="outline" className="text-xs">
                {flightData.outboundFlight?.departure?.code} →{" "}
                {flightData.outboundFlight?.arrival?.code}
              </Badge>
            </div>
            <span className="font-bold text-blue-600">
              {formatCurrency(outboundPrice)}
            </span>
          </div>
          <p className="text-sm text-gray-600 ml-5">
            {outboundFare?.travelClass?.className || "Hạng vé"} •{" "}
            {outboundFare?.availableSeats || 0} ghế trống
          </p>
        </div>

        {/* Return flight summary */}
        <div className="bg-white rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="font-semibold text-red-800">Chuyến về</span>
              <Badge variant="outline" className="text-xs">
                {flightData.returnFlight?.departure?.code} →{" "}
                {flightData.returnFlight?.arrival?.code}
              </Badge>
            </div>
            <span className="font-bold text-red-600">
              {formatCurrency(returnPrice)}
            </span>
          </div>
          <p className="text-sm text-gray-600 ml-5">
            {returnFare?.travelClass?.className || "Hạng vé"} •{" "}
            {returnFare?.availableSeats || 0} ghế trống
          </p>
        </div>

        {/* Total price */}
        <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-green-800">Tổng cộng</p>
              <p className="text-sm text-green-600">Cho 2 chuyến bay khứ hồi</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(totalPrice)}
              </p>
              <p className="text-xs text-green-600">mỗi hành khách</p>
            </div>
          </div>
        </div>

        {/* Proceed to booking button */}
        <div className="flex justify-end pt-4">
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3"
            onClick={() => onProceedToBooking(flightData, outboundFareId)}
          >
            Tiếp tục đặt vé
            <Plane className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FlightDetail;
