"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Smartphone, Wallet } from "lucide-react";
import { bookingApi } from "@/apis/booking-api";
import { flightApi } from "@/apis/flight-api";
import { toast } from "sonner";
import PropTypes from "prop-types";
import { formatCurrencyVND, formatDateTimeVN } from "@/utils/currency-utils";

// Helper functions
const calculateDuration = (departureDateTime, arrivalDateTime) => {
  if (!departureDateTime || !arrivalDateTime) return "N/A";
  const departure = new Date(departureDateTime);
  const arrival = new Date(arrivalDateTime);
  const diffMs = arrival - departure;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffHours}h ${diffMinutes}m`;
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return { date: "N/A", time: "N/A" };
  const date = new Date(dateTime);
  return {
    date: date.toLocaleDateString("vi-VN"),
    time: date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

// Helper function to get airport display name
const getAirportDisplayName = (airport, flight) => {
  if (!airport) {
    // Fallback to flight data if available
    if (flight?.departureAirport?.airportName)
      return flight.departureAirport.airportName;
    if (flight?.arrivalAirport?.airportName)
      return flight.arrivalAirport.airportName;
    return "N/A";
  }

  // Try multiple properties to get the best name
  return (
    airport.airportName ||
    airport.city ||
    airport.name ||
    airport.airport ||
    "Sân bay"
  );
};

// Helper function to get city name
const getCityDisplayName = (location, flight) => {
  if (!location) {
    // Fallback to flight data
    if (flight?.departureAirport?.city) return flight.departureAirport.city;
    if (flight?.arrivalAirport?.city) return flight.arrivalAirport.city;
    return "N/A";
  }

  return (
    location.city ||
    location.cityName ||
    location.airportName ||
    location.name ||
    "Thành phố"
  );
};

// Helper function to get aircraft name
const getAircraftDisplayName = (aircraft, flight) => {
  if (!aircraft) {
    // Fallback to flight data
    if (flight?.aircraft?.aircraftName) return flight.aircraft.aircraftName;
    if (flight?.aircraftName) return flight.aircraftName;
    return "N/A";
  }

  if (typeof aircraft === "string") return aircraft;

  return aircraft.aircraftName || aircraft.name || aircraft.model || "Máy bay";
};

// Helper function to get airline display name
const getAirlineDisplayName = (airline) => {
  if (!airline) return "N/A";
  if (typeof airline === "string") return airline;
  return airline.airlineName || airline.name || "Unknown Airline";
};

const Payment = ({ formData, extrasData, flight, fare }) => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get authenticated user

  // Helper function to convert time to ISO format for backend
  const formatTimeForBackend = (time, date = null) => {
    if (!time) return null;

    // If already in ISO format, return as is
    if (time.includes("T") && time.includes(":")) {
      return time;
    }

    // If just time (HH:MM), combine with date
    if (time.match(/^\d{2}:\d{2}$/)) {
      let isoDate = date;

      // Convert date from DD/MM/YYYY to YYYY-MM-DD format if needed
      if (date && date.includes("/")) {
        const [day, month, year] = date.split("/");
        isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      } else if (!date) {
        isoDate = new Date().toISOString().split("T")[0];
      }

      return `${isoDate}T${time}:00`;
    }

    return time;
  };

  // Debug: Log flight data structure
  console.log("=== PAYMENT COMPONENT DEBUG - FLIGHT DATA STRUCTURE ===");
  console.log("Payment - Flight data:", flight);
  console.log("Payment - Flight.type:", flight?.type);
  console.log("Payment - Flight.isRoundTrip:", flight?.isRoundTrip);
  console.log("Payment - Flight.isMultiCity:", flight?.isMultiCity);
  console.log("Payment - Flight.outboundFlight:", flight?.outboundFlight);
  console.log("Payment - Flight.returnFlight:", flight?.returnFlight);
  console.log("Payment - Flight.legs:", flight?.legs);
  console.log("Payment - Fare data:", fare);
  console.log("Payment - Flight.departureAirport:", flight?.departureAirport);
  console.log("Payment - Flight.arrivalAirport:", flight?.arrivalAirport);
  console.log("Payment - Flight.aircraft:", flight?.aircraft);

  // Debug localStorage selectedFlight
  const selectedFlightDebug = JSON.parse(
    localStorage.getItem("selectedFlight") || "{}"
  );
  console.log("Payment - localStorage selectedFlight:", selectedFlightDebug);
  console.log(
    "Payment - localStorage flight.outboundFlight:",
    selectedFlightDebug?.flight?.outboundFlight
  );
  console.log(
    "Payment - localStorage flight.returnFlight:",
    selectedFlightDebug?.flight?.returnFlight
  );
  console.log(
    "Payment - localStorage outbound:",
    selectedFlightDebug?.outbound
  );
  console.log("Payment - localStorage return:", selectedFlightDebug?.return);
  console.log("Payment - localStorage type:", selectedFlightDebug?.type);
  console.log("Payment - outbound.id:", selectedFlightDebug?.outbound?.id);
  console.log(
    "Payment - outbound.flightId:",
    selectedFlightDebug?.outbound?.flightId
  );
  console.log("Payment - return.id:", selectedFlightDebug?.return?.id);
  console.log(
    "Payment - return.flightId:",
    selectedFlightDebug?.return?.flightId
  );
  console.log("=== END FLIGHT DATA STRUCTURE DEBUG ===");

  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolderName: "",
  });
  const [billingAddress, setBillingAddress] = useState({
    address: "",
    city: "",
    postalCode: "",
    country: "Vietnam",
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("card");
  const [saveCard, setSaveCard] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("IMMEDIATE"); // IMMEDIATE or LATER
  const [showOutboundDetails, setShowOutboundDetails] = useState(true);
  const [showReturnDetails, setShowReturnDetails] = useState(true);
  const [autoAssignedSeats, setAutoAssignedSeats] = useState({});

  // Deal code states
  const [dealCode, setDealCode] = useState("");
  const [dealDiscount, setDealDiscount] = useState(0);
  const [dealApplied, setDealApplied] = useState(false);
  const [dealError, setDealError] = useState("");
  const [applyingDeal, setApplyingDeal] = useState(false);

  // Calculate totals from real data
  const calculatePassengerTotal = () => {
    // For round-trip, use flight.totalPrice; for one-way, calculate from fare
    if (flight?.isRoundTrip || flight?.type === "ROUND_TRIP") {
      return flight.totalPrice || 0;
    }

    // One-way flight calculation
    const basePrice = fare?.customPrice || fare?.basePrice || 0;
    return formData.passengers.reduce((total, p) => {
      const discountedPrice =
        p.type === "CHILD"
          ? basePrice * 0.75
          : p.type === "INFANT"
          ? basePrice * 0.1
          : basePrice;
      return total + discountedPrice;
    }, 0);
  };

  // Total amount - extrasData.total already includes passenger costs
  const totalAmount = extrasData?.total || calculatePassengerTotal();

  const handleCardChange = (field, value) => {
    setCardDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBillingChange = (field, value) => {
    setBillingAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Deal code handlers
  const handleApplyDeal = async () => {
    if (!dealCode.trim()) {
      setDealError("Vui lòng nhập mã giảm giá");
      return;
    }

    setApplyingDeal(true);
    setDealError("");

    try {
      // Simulate API call to validate deal code
      // Replace this with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock deal validation - replace with actual API
      const validDeals = {
        STUDENT10: { discount: 10, type: "percentage" },
        SAVE20: { discount: 20, type: "percentage" },
        FIRST50: { discount: 50000, type: "fixed" },
      };

      const deal = validDeals[dealCode.toUpperCase()];
      if (deal) {
        const baseAmount = extrasData?.total || calculatePassengerTotal();
        const discountAmount =
          deal.type === "percentage"
            ? (baseAmount * deal.discount) / 100
            : Math.min(deal.discount, baseAmount);

        setDealDiscount(discountAmount);
        setDealApplied(true);
        setDealError("");
      } else {
        setDealError("Mã giảm giá không hợp lệ hoặc đã hết hạn");
        setDealDiscount(0);
        setDealApplied(false);
      }
    } catch (error) {
      setDealError("Có lỗi xảy ra khi áp dụng mã giảm giá");
      setDealDiscount(0);
      setDealApplied(false);
    } finally {
      setApplyingDeal(false);
    }
  };

  const handleRemoveDeal = () => {
    setDealCode("");
    setDealDiscount(0);
    setDealApplied(false);
    setDealError("");
  };

  // Calculate final amount with deal discount
  const finalAmount = Math.max(0, totalAmount - dealDiscount);

  // Function to auto-assign available seats from API
  const autoAssignSeats = async () => {
    try {
      // Get flight data from localStorage if available
      const selectedFlight = JSON.parse(
        localStorage.getItem("selectedFlight") || "{}"
      );
      const flightData = selectedFlight.flight || flight;

      const flightId =
        flightData.id || flightData.flightId || flight.id || flight.flightId;
      const classId =
        flightData.selectedClass?.id || fare?.travelClass?.classId;

      console.log("Auto-assign seats - Flight data:", {
        flightId: flightId,
        classId: classId,
        flightIdType: typeof flightId,
        classIdType: typeof classId,
        selectedFlight: selectedFlight,
        flightData: flightData,
      });

      if (!flightId || !classId) {
        console.warn(
          "Missing flight ID or travel class ID for seat assignment",
          {
            flightId: flightId,
            classId: classId,
            flightObject: flight,
            fareObject: fare,
          }
        );
        return { seats: {}, seatMapping: {}, availableSeatsData: [] };
      }

      // Get available seats from API
      const seatsResponse =
        await flightApi.getSeatsFlightByFlightIdAndTravelClassId(
          flightId,
          classId
        );

      if (!seatsResponse.success) {
        console.error("Failed to fetch seats:", seatsResponse.message);
        return { seats: {}, seatMapping: {}, availableSeatsData: [] };
      }

      // Filter only available seats
      const availableSeats = seatsResponse.data.filter(
        (seat) => seat.status === "AVAILABLE"
      );

      if (availableSeats.length === 0) {
        toast.warning("Không có ghế trống. Vui lòng chọn ghế thủ công.");
        return { seats: {}, seatMapping: {}, availableSeatsData: [] };
      }

      const assignedSeats = {};
      const seatMapping = {}; // Map seatNumber to seatId from API
      const usedSeats = [...availableSeats]; // Copy to avoid modifying original

      // Create mapping for all available seats
      availableSeats.forEach((seat) => {
        seatMapping[seat.seatNumber] = seat.seatId;
      });

      formData.passengers.forEach((_, index) => {
        if (
          !extrasData?.selectedSeats?.[`passenger${index + 1}`] &&
          usedSeats.length > 0
        ) {
          // Random pick a seat from available seats
          const randomIndex = Math.floor(Math.random() * usedSeats.length);
          const selectedSeat = usedSeats[randomIndex];

          assignedSeats[`passenger${index + 1}`] = selectedSeat.seatNumber;

          // Remove used seat from available list
          usedSeats.splice(randomIndex, 1);
        }
      });

      if (Object.keys(assignedSeats).length > 0) {
        // Cập nhật state để hiển thị ghế đã gán
        setAutoAssignedSeats(assignedSeats);

        toast.success(
          `Đã tự động gán ${
            Object.keys(assignedSeats).length
          } ghế trống cho hành khách`
        );
      }

      return {
        seats: assignedSeats,
        seatMapping,
        availableSeatsData: availableSeats,
      };
    } catch (error) {
      console.error("Error auto-assigning seats:", error);
      toast.error("Lỗi khi tự động gán ghế");
      return { seats: {}, seatMapping: {}, availableSeatsData: [] };
    }
  };

  const handleSubmit = async (e, payLater = false) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast.error("Vui lòng đồng ý với điều khoản và điều kiện");
      return;
    }

    setIsProcessing(true);

    try {
      // Auto assign seats from API if none selected
      const autoAssignResult = await autoAssignSeats();
      const finalSelectedSeats = {
        ...extrasData?.selectedSeats,
        ...autoAssignResult.seats,
      };

      // Get seat mapping from API (seatNumber -> seatId)
      const seatMapping = autoAssignResult.seatMapping;
      const allAvailableSeats = autoAssignResult.availableSeatsData;

      // Helper function to get real seatId from API mapping or random assignment
      const getSeatIdFromMapping = async (seatNumber, flightId, classId) => {
        console.log(`getSeatIdFromMapping called with:`, {
          seatNumber: seatNumber,
          flightId: flightId,
          classId: classId,
          flightIdType: typeof flightId,
          classIdType: typeof classId,
        });

        // Validate parameters first
        if (
          !flightId ||
          !classId ||
          flightId === "undefined" ||
          classId === "undefined"
        ) {
          console.error(`Invalid parameters for getSeatIdFromMapping:`, {
            seatNumber: seatNumber,
            flightId: flightId,
            classId: classId,
          });
          return null;
        }

        if (seatNumber && seatMapping && seatMapping[seatNumber]) {
          // Return mapped seat ID if available
          console.log(
            `Mapped seat ${seatNumber} to ID:`,
            seatMapping[seatNumber]
          );
          return seatMapping[seatNumber];
        }

        // If no seat selected or mapping failed, get random available seat from API
        console.log(
          `Getting random seat for flight ${flightId}, class ${classId}`
        );
        const randomSeatId = await getRandomAvailableSeat(flightId, classId);
        if (randomSeatId) {
          console.log(`Assigned random seat ID:`, randomSeatId);
          return randomSeatId;
        }

        console.error(
          `No available seats found for flight ${flightId}, class ${classId}`
        );
        return null; // Return null instead of hardcoded fallback
      };

      // Prepare booking data for new API format
      // Get localStorage data first to check for flight structure
      const selectedFlight = JSON.parse(
        localStorage.getItem("selectedFlight") || "{}"
      );
      const localStorageFlight = selectedFlight.flight || {};

      const isMultiCity =
        flight?.type === "MULTI_CITY" ||
        flight?.isMultiCity ||
        localStorageFlight?.type === "MULTI_CITY" ||
        localStorageFlight?.isMultiCity;

      // Improved round-trip detection: check multiple sources
      const isRoundTrip =
        flight?.type === "ROUND_TRIP" ||
        flight?.isRoundTrip ||
        selectedFlight?.type === "ROUND_TRIP" ||
        localStorageFlight?.type === "ROUND_TRIP" ||
        localStorageFlight?.isRoundTrip ||
        (flight?.outboundFlight && flight?.returnFlight ? true : false) ||
        (localStorageFlight?.outboundFlight && localStorageFlight?.returnFlight
          ? true
          : false) ||
        (selectedFlight?.outbound && selectedFlight?.return ? true : false);

      // Debug flight type detection
      console.log("Flight type detection:", {
        isMultiCity,
        isRoundTrip,
        flightType: flight?.type,
        isRoundTripFlag: flight?.isRoundTrip,
        hasOutboundFlight: !!flight?.outboundFlight,
        hasReturnFlight: !!flight?.returnFlight,
        outboundFlightId: flight?.outboundFlight?.id,
        returnFlightId: flight?.returnFlight?.id,
      });

      // Helper function to get random available seat
      const getRandomAvailableSeat = async (flightId, classId) => {
        try {
          const response =
            await flightApi.getSeatsFlightByFlightIdAndTravelClassId(
              flightId,
              classId
            );
          // Check if response has data property and is array
          const seatsData = response.success ? response.data : response;
          const availableSeats = Array.isArray(seatsData)
            ? seatsData.filter((seat) => seat.status === "AVAILABLE")
            : [];

          if (availableSeats.length > 0) {
            const randomSeat =
              availableSeats[Math.floor(Math.random() * availableSeats.length)];
            return randomSeat.seatId || randomSeat.id; // Return actual seat ID from database
          }
          return null;
        } catch (error) {
          console.error("Error getting random seat:", error);
          return null;
        }
      };

      // Helper function to determine baggage package
      const getBaggagePackage = (passenger, index) => {
        if (isMultiCity) {
          // For multi-city, baggage is stored per segment, but we'll use the first segment's selection
          // Or you could modify this logic based on your requirements
          const firstSegmentBaggage =
            extrasData?.multiCityBaggage?.segment0?.[`passenger${index + 1}`];
          return firstSegmentBaggage && firstSegmentBaggage !== "NONE"
            ? firstSegmentBaggage
            : null;
        } else {
          // For regular flights, baggage is now stored as package key
          const passengerBaggage =
            extrasData?.baggage?.[`passenger${index + 1}`];
          return passengerBaggage && passengerBaggage !== "NONE"
            ? passengerBaggage
            : null;
        }
      };

      const bookingData = {
        userId: user?.id || null, // Get from authenticated user or null if not logged in
        totalAmount: finalAmount, // Use final amount with deal discount
        status: payLater ? "PENDING" : "PENDING", // Always PENDING initially
        passengers: formData.passengers.map((passenger, index) => ({
          firstName:
            passenger.firstName ||
            passenger.fullName?.split(" ")[0] ||
            passenger.fullName,
          lastName:
            passenger.lastName ||
            passenger.fullName?.split(" ").slice(1).join(" ") ||
            "",
          dateOfBirth: passenger.dob
            ? new Date(passenger.dob).toISOString().split("T")[0]
            : null,
          passportNumber:
            passenger.passportNumber ||
            (typeof passenger.passport === "string"
              ? passenger.passport
              : passenger.passport?.number) ||
            "",
          type: passenger.type,
          email: passenger.email || null,
          phone: passenger.phone || null,
          gender: passenger.gender || "N/A",
          seatId: null, // Will be assigned below
          baggagePackage: getBaggagePackage(passenger, index),
        })),
        flightSegments: [],
        ancillaryServices: [], // Will be populated below
        paymentMethod: paymentMethod || "CREDIT_CARD",
        checkInType: "ONLINE",
        ...(dealApplied && dealCode && { dealCode: dealCode }),
      };

      // Build flight segments based on flight type
      if (isMultiCity && flight.legs) {
        // Multi-city flights
        bookingData.flightSegments = flight.legs.map((leg, index) => {
          const classId =
            leg.selectedClass?.id || leg.flightTravelClasses?.[0]?.id || 1;
          return {
            segmentId: index + 1,
            flightId: leg.id || leg.flightId,
            classId: classId,
            departure: {
              code: leg.departureAirport?.airportCode || leg.from || "N/A",
              city:
                leg.departureAirport?.cityNames?.[0] ||
                leg.departureAirport?.city ||
                leg.departureCity ||
                leg.from ||
                "N/A",
              time: formatTimeForBackend(leg.departureTime, leg.departureDate),
              airport:
                leg.departureAirport?.airportName ||
                leg.departureAirportName ||
                leg.fromAirport ||
                "N/A",
              terminal:
                leg.departureAirport?.terminal ||
                leg.departureAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                leg.departureAirport?.gate ||
                leg.departureAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            arrival: {
              code: leg.arrivalAirport?.airportCode || leg.to || "N/A",
              city:
                leg.arrivalAirport?.cityNames?.[0] ||
                leg.arrivalAirport?.city ||
                leg.arrivalCity ||
                leg.to ||
                "N/A",
              time: formatTimeForBackend(leg.arrivalTime, leg.arrivalDate),
              airport:
                leg.arrivalAirport?.airportName ||
                leg.arrivalAirportName ||
                leg.toAirport ||
                "N/A",
              terminal:
                leg.arrivalAirport?.terminal ||
                leg.arrivalAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                leg.arrivalAirport?.gate ||
                leg.arrivalAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            price:
              leg.selectedClass?.customPrice ||
              leg.flightTravelClasses?.[0]?.customPrice ||
              0,
            aircraft: leg.aircraft || leg.aircraftName || "Unknown Aircraft",
            duration: leg.duration
              ? `${Math.floor(leg.duration / 60)}h ${leg.duration % 60}m`
              : "2h 0m",
            passengerSeats: [], // Will be populated later with proper API call
          };
        });
      } else if (
        isRoundTrip &&
        ((flight.outboundFlight && flight.returnFlight) ||
          (localStorageFlight.outboundFlight &&
            localStorageFlight.returnFlight) ||
          (selectedFlight.outbound && selectedFlight.return))
      ) {
        // Round-trip flights - use localStorage data if flight prop is incomplete
        const outboundData =
          flight.outboundFlight ||
          localStorageFlight.outboundFlight ||
          selectedFlight.outbound;
        const returnData =
          flight.returnFlight ||
          localStorageFlight.returnFlight ||
          selectedFlight.return;

        console.log("Creating ROUND-TRIP segments with data:", {
          outboundData,
          returnData,
          outboundId: outboundData?.id || outboundData?.flightId,
          returnId: returnData?.id || returnData?.flightId,
          flightSource: flight.outboundFlight
            ? "flight prop"
            : localStorageFlight.outboundFlight
            ? "localStorage.flight"
            : "localStorage.outbound",
        });

        bookingData.flightSegments = [
          // Outbound segment
          {
            segmentId: 1,
            flightId: parseInt(outboundData?.id || outboundData?.flightId || 0),
            classId:
              flight.selectedOutboundFare?.travelClass?.classId ||
              fare.travelClass?.classId ||
              1,
            departure: {
              code:
                outboundData.departureAirport?.airportCode ||
                outboundData.departureAirport?.code ||
                outboundData.from ||
                "N/A",
              city:
                outboundData.departureAirport?.city ||
                outboundData.departureAirport?.cityName ||
                outboundData.departureAirport?.cityNames?.[0] ||
                outboundData.from ||
                "N/A",
              time: formatTimeForBackend(
                outboundData.departureTime,
                outboundData.departureDate
              ),
              airport:
                outboundData.departureAirport?.airportName ||
                outboundData.departureAirport?.name ||
                "N/A",
              terminal:
                outboundData.departureAirport?.terminal ||
                outboundData.departureAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                outboundData.departureAirport?.gate ||
                outboundData.departureAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            arrival: {
              code:
                outboundData.arrivalAirport?.airportCode ||
                outboundData.arrivalAirport?.code ||
                outboundData.to ||
                "N/A",
              city:
                outboundData.arrivalAirport?.city ||
                outboundData.arrivalAirport?.cityName ||
                outboundData.arrivalAirport?.cityNames?.[0] ||
                outboundData.to ||
                "N/A",
              time: formatTimeForBackend(
                outboundData.arrivalTime,
                outboundData.arrivalDate
              ),
              airport:
                outboundData.arrivalAirport?.airportName ||
                outboundData.arrivalAirport?.name ||
                "N/A",
              terminal:
                outboundData.arrivalAirport?.terminal ||
                outboundData.arrivalAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                outboundData.arrivalAirport?.gate ||
                outboundData.arrivalAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            price:
              flight.selectedOutboundFare?.customPrice ||
              outboundData.flightTravelClasses?.[0]?.customPrice ||
              outboundData.price ||
              0,
            aircraft:
              outboundData.aircraft?.aircraftName ||
              outboundData.aircraft?.name ||
              outboundData.aircraftName ||
              outboundData.aircraft ||
              "N/A",
            duration: outboundData.duration
              ? `${Math.floor(outboundData.duration / 60)}h ${
                  outboundData.duration % 60
                }m`
              : "N/A",
            passengerSeats: [], // Will be populated later with proper API call
          },
          // Return segment
          {
            segmentId: 2,
            flightId: parseInt(returnData?.id || returnData?.flightId || 0),
            classId:
              flight.selectedReturnFare?.travelClass?.classId ||
              fare.travelClass?.classId ||
              1,
            departure: {
              code:
                returnData.departureAirport?.airportCode ||
                returnData.departureAirport?.code ||
                returnData.from ||
                "N/A",
              city:
                returnData.departureAirport?.city ||
                returnData.departureAirport?.cityName ||
                returnData.departureAirport?.cityNames?.[0] ||
                returnData.from ||
                "N/A",
              time: formatTimeForBackend(
                returnData.departureTime,
                returnData.departureDate
              ),
              airport:
                returnData.departureAirport?.airportName ||
                returnData.departureAirport?.name ||
                "N/A",
              terminal:
                returnData.departureAirport?.terminal ||
                returnData.departureAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                returnData.departureAirport?.gate ||
                returnData.departureAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            arrival: {
              code:
                returnData.arrivalAirport?.airportCode ||
                returnData.arrivalAirport?.code ||
                returnData.to ||
                "N/A",
              city:
                returnData.arrivalAirport?.city ||
                returnData.arrivalAirport?.cityName ||
                returnData.arrivalAirport?.cityNames?.[0] ||
                returnData.to ||
                "N/A",
              time: formatTimeForBackend(
                returnData.arrivalTime,
                returnData.arrivalDate
              ),
              airport:
                returnData.arrivalAirport?.airportName ||
                returnData.arrivalAirport?.name ||
                "N/A",
              terminal:
                returnData.arrivalAirport?.terminal ||
                returnData.arrivalAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                returnData.arrivalAirport?.gate ||
                returnData.arrivalAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            price:
              flight.selectedReturnFare?.customPrice ||
              returnData.flightTravelClasses?.[0]?.customPrice ||
              returnData.price ||
              0,
            aircraft:
              returnData.aircraft?.aircraftName ||
              returnData.aircraft?.name ||
              returnData.aircraftName ||
              returnData.aircraft ||
              "N/A",
            duration: returnData.duration
              ? `${Math.floor(returnData.duration / 60)}h ${
                  returnData.duration % 60
                }m`
              : "N/A",
            passengerSeats: [], // Will be populated later with proper API call
          },
        ];
      } else {
        // One-way flight - Use already fetched localStorage data
        const flightData = localStorageFlight || flight;

        // Debug localStorage data for one-way flight
        console.log(
          "One-way flight - selectedFlight from localStorage:",
          selectedFlight
        );
        console.log("One-way flight - flightData:", flightData);
        console.log(
          "One-way flight - flightData.departureAirport:",
          flightData.departureAirport
        );
        console.log(
          "One-way flight - flightData.arrivalAirport:",
          flightData.arrivalAirport
        );
        console.log("One-way flight - flight prop:", flight);

        bookingData.flightSegments = [
          {
            segmentId: 1,
            flightId: parseInt(
              flightData.id ||
                flightData.flightId ||
                flight.id ||
                flight.flightId ||
                selectedFlight.outbound?.id ||
                selectedFlight.outbound?.flightId ||
                0
            ),
            classId:
              flightData.selectedClass?.id || fare.travelClass?.classId || 1,
            departure: {
              code:
                flightData.departureAirport?.code ||
                flightData.departureAirport?.airportCode ||
                flightData.from ||
                flight.departureAirport?.airportCode ||
                flight.from ||
                "N/A",
              city:
                flightData.departureAirport?.city === "N/A"
                  ? flightData.from
                  : flightData.departureAirport?.city ||
                    flight.departureAirport?.city ||
                    flight.departureCity ||
                    "N/A",
              time: formatTimeForBackend(
                flightData.departureTime || flight.departureTime,
                flightData.departureDate || flight.departureDate
              ),
              airport:
                flightData.departureAirport?.name ||
                flightData.departureAirport?.airportName ||
                flight.departureAirport?.airportName ||
                flight.departureAirport?.name ||
                "N/A",
              terminal:
                flightData.departureAirport?.terminal ||
                flightData.departureAirport?.gates?.[0]?.terminal ||
                flight.departureAirport?.terminal ||
                flight.departureAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                flightData.departureAirport?.gate ||
                flightData.departureAirport?.gates?.[0]?.gateName ||
                flight.departureAirport?.gate ||
                flight.departureAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            arrival: {
              code:
                flightData.arrivalAirport?.code ||
                flightData.arrivalAirport?.airportCode ||
                flightData.to ||
                flight.arrivalAirport?.airportCode ||
                flight.to ||
                "SGN",
              city:
                flightData.arrivalAirport?.city === "N/A"
                  ? flightData.to
                  : flightData.arrivalAirport?.city ||
                    flight.arrivalAirport?.city ||
                    flight.arrivalCity ||
                    "N/A",
              time: formatTimeForBackend(
                flightData.arrivalTime || flight.arrivalTime,
                flightData.arrivalDate || flight.arrivalDate
              ),
              airport:
                flightData.arrivalAirport?.name ||
                flightData.arrivalAirport?.airportName ||
                flight.arrivalAirport?.airportName ||
                flight.arrivalAirport?.name ||
                "N/A",
              terminal:
                flightData.arrivalAirport?.terminal ||
                flightData.arrivalAirport?.gates?.[0]?.terminal ||
                flight.arrivalAirport?.terminal ||
                flight.arrivalAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                flightData.arrivalAirport?.gate ||
                flightData.arrivalAirport?.gates?.[0]?.gateName ||
                flight.arrivalAirport?.gate ||
                flight.arrivalAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            price: fare.customPrice || fare.price || flightData.totalPrice || 0,
            aircraft:
              flightData.aircraft ||
              flightData.aircraftName ||
              flight.aircraft?.aircraftName ||
              flight.aircraft?.name ||
              flight.aircraftName ||
              flight.aircraft ||
              "N/A",
            duration: flightData.duration
              ? `${Math.floor(flightData.duration / 60)}h ${
                  flightData.duration % 60
                }m`
              : flight.duration
              ? `${Math.floor(flight.duration / 60)}h ${flight.duration % 60}m`
              : calculateDuration(
                  flightData.departureTime || flight.departureTime,
                  flightData.arrivalTime || flight.arrivalTime
                ) || "2h 0m",
            passengerSeats: [], // Will be populated with async seat assignment below
          },
        ];
      }

      // Debug: Log segment data before seat assignment
      console.log(
        "Flight segments before seat assignment:",
        bookingData.flightSegments.map((s) => ({
          segmentId: s.segmentId,
          flightId: s.flightId,
          classId: s.classId,
          flightIdType: typeof s.flightId,
          classIdType: typeof s.classId,
        }))
      );

      // Assign seats for all passengers and segments
      for (
        let segmentIndex = 0;
        segmentIndex < bookingData.flightSegments.length;
        segmentIndex++
      ) {
        const segment = bookingData.flightSegments[segmentIndex];

        // Validate segment data
        if (!segment.flightId || !segment.classId) {
          console.error(`Invalid segment data at index ${segmentIndex}:`, {
            flightId: segment.flightId,
            classId: segment.classId,
            segment: segment,
          });
          toast.error(`Lỗi dữ liệu chuyến bay tại segment ${segmentIndex + 1}`);
          continue;
        }

        const passengerSeats = [];

        for (
          let passengerIndex = 0;
          passengerIndex < formData.passengers.length;
          passengerIndex++
        ) {
          const passengerKey = `passenger${passengerIndex + 1}`;
          let selectedSeat;

          if (isMultiCity) {
            selectedSeat =
              extrasData.multiCitySeats?.[`segment${segmentIndex}`]?.[
                passengerKey
              ];
          } else if (isRoundTrip && segmentIndex === 1) {
            selectedSeat = extrasData.selectedReturnSeats?.[passengerKey];
          } else {
            selectedSeat = extrasData.selectedSeats?.[passengerKey];
          }

          const seatId = await getSeatIdFromMapping(
            selectedSeat,
            segment.flightId,
            segment.classId
          );

          passengerSeats.push({
            passengerId: passengerIndex + 1,
            seatId: seatId,
          });

          // Also update passenger seatId
          bookingData.passengers[passengerIndex].seatId = seatId;
        }

        segment.passengerSeats = passengerSeats;
      }

      // Build ancillary services from extrasData
      if (extrasData?.selectedAncillaryServices) {
        bookingData.ancillaryServices = Object.values(
          extrasData.selectedAncillaryServices
        ).map((serviceSelection) => ({
          serviceId: serviceSelection.serviceId,
          passengerId: serviceSelection.passengerId, // null for booking-wide services
          quantity: serviceSelection.quantity || 1,
          notes: serviceSelection.notes || "",
        }));
      }

      // Show debug info if enabled
      if (showDebug) {
        console.log("=== BOOKING DATA DEBUG (NEW API FORMAT) ===");
        console.log("User ID:", user?.id || "Not logged in");
        console.log(
          "Flight Type:",
          flight?.type ||
            (isMultiCity
              ? "MULTI_CITY"
              : isRoundTrip
              ? "ROUND_TRIP"
              : "ONE_WAY")
        );
        console.log(
          "Flight Segments Count:",
          bookingData.flightSegments.length
        );
        console.log(
          "Deal Applied:",
          dealApplied,
          "Deal Code:",
          dealCode,
          "Discount:",
          dealDiscount
        );
        console.log(
          "Original Amount:",
          totalAmount,
          "Final Amount:",
          finalAmount
        );
        console.log("Selected Seats:", {
          regular: extrasData.selectedSeats || {},
          return: extrasData.selectedReturnSeats || {},
          multiCity: extrasData.multiCitySeats || {},
        });
        console.log(
          "Seat Assignment Results:",
          bookingData.passengers.map((p) => ({
            passenger: p.firstName + " " + p.lastName,
            seatId: p.seatId,
            baggagePackage: p.baggagePackage,
          }))
        );
        console.log(
          "Final Seat ID assignment:",
          formData.passengers.map((_, index) => ({
            passenger: index + 1,
            seatNumber:
              finalSelectedSeats[`passenger${index + 1}`] || "auto-random",
            realSeatId: getSeatIdFromMapping(
              finalSelectedSeats[`passenger${index + 1}`]
            ),
            source: finalSelectedSeats[`passenger${index + 1}`]
              ? "manual/auto-assigned"
              : "fallback-random",
          }))
        );
        console.log(
          "Flight Segments Details:",
          bookingData.flightSegments.map((segment) => ({
            segmentId: segment.segmentId,
            flightId: segment.flightId,
            classId: segment.classId,
            from: `${segment.departure.code} (${segment.departure.city})`,
            to: `${segment.arrival.code} (${segment.arrival.city})`,
            price: segment.price,
            passengerSeats: segment.passengerSeats.length,
          }))
        );
        console.log(
          "Passenger Details:",
          bookingData.passengers.map((p) => ({
            name: `${p.firstName} ${p.lastName}`,
            type: p.type,
            passport: p.passportNumber,
            seatId: p.seatId,
            baggage: p.baggagePackage,
          }))
        );
        console.log(
          "Ancillary Services:",
          bookingData.ancillaryServices.length > 0
            ? bookingData.ancillaryServices
            : "No ancillary services selected"
        );
        console.log("Full Booking Data:", JSON.stringify(bookingData, null, 2));
        toast.info(
          "Check console for detailed booking data with new API format"
        );
      }

      const result = await bookingApi.createBooking(bookingData);

      // Debug: Log API response structure
      console.log("Booking API Response:", {
        success: result.success,
        data: result.data,
        fullResponse: result,
      });

      if (result.success) {
        // Extract booking data from API response
        const bookingResponse = result.data;
        const bookingId = bookingResponse.bookingId;
        const bookingCode = bookingResponse.bookingCode;

        console.log("Booking created successfully:", {
          apiResponse: result,
          bookingId: bookingId,
          bookingCode: bookingCode,
        });

        // Store complete booking data from API for confirmation page
        localStorage.setItem(
          "bookingConfirmation",
          JSON.stringify({
            // New API Response Data
            bookingId: bookingResponse.bookingId,
            bookingCode: bookingResponse.bookingCode,
            userEmail: bookingResponse.userEmail,
            bookingDate: bookingResponse.bookingDate,
            totalAmount: bookingResponse.totalAmount,
            status: bookingResponse.status,
            passengers: bookingResponse.passengers || [],
            flightSegments: bookingResponse.flightSegments || [],
            payment: bookingResponse.payment,
            createdAt: bookingResponse.createdAt,
            updatedAt: bookingResponse.updatedAt,
            baggage: bookingResponse.baggage,
            dealCode: bookingResponse.dealCode,
            // Flight type information
            flightType:
              flight?.type ||
              (isMultiCity
                ? "MULTI_CITY"
                : isRoundTrip
                ? "ROUND_TRIP"
                : "ONE_WAY"),
            isMultiCity: isMultiCity,
            isRoundTrip: isRoundTrip,
            // Original data for backward compatibility
            flight,
            fare,
            formData,
            extrasData: { ...extrasData, selectedSeats: finalSelectedSeats },
            reference: bookingCode, // Use bookingCode as reference
            paymentMethod:
              bookingResponse.payment?.paymentMethod ||
              paymentMethod ||
              "CREDIT_CARD",
            paymentStatus:
              bookingResponse.payment?.status || bookingResponse.status,
            bookingStatus: bookingResponse.status,
            assignedSeats: finalSelectedSeats,
            // Deal information
            appliedDeal: dealApplied
              ? {
                  code: dealCode,
                  discount: dealDiscount,
                  originalAmount: totalAmount,
                  finalAmount: finalAmount,
                }
              : null,
            // Ancillary services information
            selectedAncillaryServices:
              extrasData?.selectedAncillaryServices || {},
            availableAncillaryServices:
              extrasData?.availableAncillaryServices || [],
          })
        );

        const message = payLater
          ? "Đặt vé thành công! Bạn có thể thanh toán sau."
          : "Đặt vé và thanh toán thành công!";
        toast.success(message);
        navigate("/confirm-booking");
      } else {
        console.error("Booking API Error:", result);
        toast.error(result.message || "Có lỗi xảy ra khi đặt vé");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Có lỗi xảy ra khi đặt vé. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  const priceBreakdown = {
    baseFare: calculatePassengerTotal(),
    seatSelection: extrasData?.seatTotal || 0,
    extraBaggage: extrasData?.baggageTotal || 0,
    services: extrasData?.servicesTotal || 0,
    total: totalAmount,
  };

  // Optimized payment handler
  const handlePayment = () => {
    if (!agreeTerms) {
      alert("Vui lòng chấp nhận Điều khoản và Điều kiện.");
      return;
    }
    alert(
      `Thanh toán thành công! Tổng cộng: ${formatCurrencyVND(
        priceBreakdown.total
      )}`
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Xem Lại & Thanh Toán</h2>
      <p className="text-gray-600 mb-6 dark:text-gray-300">
        Vui lòng xem lại thông tin đặt vé và hoàn tất thanh toán
      </p>

      {/* Booking Summary Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">📋 Tóm tắt đặt vé</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Chuyến bay:</span>
            <p className="font-medium">
              {flight?.type === "MULTI_CITY"
                ? flight?.flightNumber ||
                  `Multi-City (${flight?.legs?.length || 0} chặng)`
                : flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                ? `${flight.outbound?.flightNumber} / ${flight.return?.flightNumber}`
                : flight?.flightNumber || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Loại vé:</span>
            <p className="font-medium">
              {flight?.type === "MULTI_CITY"
                ? `Đa thành phố (${flight?.legs?.length || 0} chặng)`
                : flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                ? "Khứ hồi"
                : "Một chiều"}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Hành khách:</span>
            <p className="font-medium">{formData.passengers.length} người</p>
          </div>
          <div>
            <span className="text-gray-600">Ghế đã chọn:</span>
            <p className="font-medium">
              {(() => {
                const selectedSeatsCount =
                  Object.keys(extrasData?.selectedSeats || {}).length +
                  Object.keys(extrasData?.selectedReturnSeats || {}).length;
                const totalSeatsNeeded =
                  formData.passengers.length *
                  (flight?.type === "MULTI_CITY"
                    ? flight?.legs?.length || 1
                    : flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                    ? 2
                    : 1);
                return (
                  <>
                    {selectedSeatsCount}/{totalSeatsNeeded}
                    {selectedSeatsCount < totalSeatsNeeded && (
                      <span className="text-blue-600 text-xs ml-1">
                        (Tự động gán ghế trống)
                      </span>
                    )}
                  </>
                );
              })()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Section: Flight and Passenger Details */}
        <div className="w-full md:w-1/2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chi Tiết Chuyến Bay</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Multi-City Flight */}
              {flight?.type === "MULTI_CITY" && flight?.legs ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-purple-800">
                      🗺️ Chuyến bay đa thành phố ({flight.legs.length} chặng)
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowOutboundDetails(!showOutboundDetails)
                      }
                      className="text-purple-600 hover:text-purple-800"
                    >
                      {showOutboundDetails ? "Thu gọn" : "Mở rộng"}
                    </Button>
                  </div>
                  {showOutboundDetails && (
                    <div className="space-y-4">
                      {flight.legs.map((leg, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-purple-700">
                              Chặng {index + 1}:{" "}
                              {leg.departureAirport?.code} →{" "}
                              {leg.arrivalAirport?.code}
                            </h5>
                            <span className="text-sm font-mono bg-purple-100 px-2 py-1 rounded">
                              {leg.flightNumber}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 items-center">
                            <div>
                              <p className="font-semibold">
                                {leg.departureTime}
                              </p>
                              <p className="text-sm">
                                {leg.departureAirport?.airportName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {leg.departureDate}
                              </p>
                            </div>
                            <div className="text-center">
                              <div className="w-full h-0.5 bg-purple-300 mb-1"></div>
                              <p className="text-xs text-gray-500">
                                {leg.duration} phút
                              </p>
                              <p className="text-xs text-purple-600">
                                {leg.airline || leg.airlineName}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{leg.arrivalTime}</p>
                              <p className="text-sm">
                                {leg.arrivalAirport?.airportName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {leg.arrivalDate}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>Máy bay: {leg.aircraft || leg.aircraftName}</p>
                            <p>
                              Hạng vé:{" "}
                              {leg.selectedClass?.travelClass?.className ||
                                "N/A"}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="bg-purple-100 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-purple-800">
                            Tổng thời gian hành trình:
                          </span>
                          <span className="font-bold text-purple-600">
                            {flight.totalDuration
                              ? `${flight.totalDuration} phút`
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Outbound Flight - Original Logic */
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-800">
                      ✈️ Chuyến bay{" "}
                      {flight.type === "ROUND_TRIP" ? "chiều đi" : ""}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowOutboundDetails(!showOutboundDetails)
                      }
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {showOutboundDetails ? "Thu gọn" : "Mở rộng"}
                    </Button>
                  </div>
                  {showOutboundDetails && (
                    <>
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <div>
                          <p className="font-semibold">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outbound?.departureTime
                              : flight?.flight.departureTime}
                          </p>
                          <p className="text-sm">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outbound?.departureAirport
                                  ?.airportName || flight.outbound?.from
                              : flight?.flight.departureAirport?.airportName ||
                                "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outbound?.departureDate
                              : flight?.flight.departureDate}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="w-full h-0.5 bg-gray-300 mb-1"></div>
                          <p className="text-xs text-gray-500">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? `${flight.outbound?.duration} phút`
                              : `${flight?.flight.duration} phút`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outbound?.flightNumber
                              : flight?.flight.flightNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outbound?.arrivalTime
                              : flight?.flight.arrivalTime}
                          </p>
                          <p className="text-sm">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outbound?.arrivalAirport?.airportName ||
                                flight.outbound?.to
                              : flight?.flight.arrivalAirport?.airportName ||
                                "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outbound?.arrivalDate
                              : flight?.flight.arrivalDate}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>
                          Hãng bay:{" "}
                          {flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                            ? getAirlineDisplayName(
                                flight.outbound?.airline || flight.outbound
                              )
                            : getAirlineDisplayName(flight?.airline || flight)}
                        </p>
                        <p>
                          Máy bay:{" "}
                          {flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                            ? getAircraftDisplayName(
                                flight.outbound?.aircraft ||
                                  flight.outbound?.aircraftName,
                                flight
                              )
                            : getAircraftDisplayName(
                                flight?.flight?.aircraft || flight?.aircraft,
                                flight
                              )}
                        </p>
                        <p>
                          Hạng vé:{" "}
                          {flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                            ? flight.outbound?.selectedClass.travelClass
                                ?.className
                            : fare?.travelClass?.className}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Return Flight */}
              {(flight?.isRoundTrip || flight?.type === "ROUND_TRIP") &&
                flight.return && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-green-800">
                        ✈️ Chuyến bay chiều về
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowReturnDetails(!showReturnDetails)}
                        className="text-green-600 hover:text-green-800"
                      >
                        {showReturnDetails ? "Thu gọn" : "Mở rộng"}
                      </Button>
                    </div>
                    {showReturnDetails && (
                      <>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <div>
                            <p className="font-semibold">
                              {flight.return?.departureTime}
                            </p>
                            <p className="text-sm">
                              {flight.return?.departureAirport.airportName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {flight.return?.departureDate}
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="w-full h-0.5 bg-gray-300 mb-1"></div>
                            <p className="text-xs text-gray-500">
                              {flight.return?.duration} phút
                            </p>
                            <p className="text-xs text-gray-500">
                              {flight.return?.flightNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {flight.return?.arrivalTime}
                            </p>
                            <p className="text-sm">
                              {flight.return?.arrivalAirport?.airportName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {flight.return?.arrivalDate}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>
                            Hãng bay:{" "}
                            {getAirlineDisplayName(
                              flight.return?.airline || flight.return
                            )}
                          </p>
                          <p>
                            Máy bay:{" "}
                            {flight.return?.aircraft ||
                              flight.return?.aircraftName}
                          </p>
                          <p>
                            Hạng vé:{" "}
                            {
                              flight.return?.selectedClass.travelClass
                                ?.className
                            }
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Hành Khách</CardTitle>
            </CardHeader>
            <CardContent>
              {formData.passengers.map((passenger, index) => (
                <p key={index} className="mb-2">
                  {passenger.firstName || passenger.lastName
                    ? `${passenger.firstName || ""} ${
                        passenger.lastName || ""
                      }`.trim()
                    : `Hành khách ${index + 1}`}{" "}
                  <span className="text-gray-500">({passenger.type})</span>
                </p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dịch Vụ Đã Chọn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chỗ ngồi */}
                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">
                    💺 Chỗ Ngồi:
                  </h5>
                  {/* Ghế đã chọn thủ công */}
                  {Object.entries(extrasData?.selectedSeats || {}).map(
                    ([passengerKey, seatNumber]) => {
                      const passengerIndex =
                        parseInt(passengerKey.replace("passenger", "")) - 1;
                      const passenger = formData.passengers[passengerIndex];
                      return (
                        <div
                          key={passengerKey}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {passenger?.firstName} {passenger?.lastName}:
                          </span>
                          <span className="text-blue-600 font-medium">
                            {seatNumber}
                          </span>
                        </div>
                      );
                    }
                  )}

                  {/* Ghế tự động gán */}
                  {Object.entries(autoAssignedSeats).map(
                    ([passengerKey, seatNumber]) => {
                      const passengerIndex =
                        parseInt(passengerKey.replace("passenger", "")) - 1;
                      const passenger = formData.passengers[passengerIndex];
                      // Chỉ hiển thị nếu chưa có ghế thủ công
                      if (extrasData?.selectedSeats?.[passengerKey])
                        return null;
                      return (
                        <div
                          key={passengerKey}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {passenger?.firstName} {passenger?.lastName}:
                          </span>
                          <span className="text-green-600 font-medium">
                            {seatNumber}{" "}
                            <span className="text-xs text-gray-500">
                              (tự động)
                            </span>
                          </span>
                        </div>
                      );
                    }
                  )}

                  {/* Ghế chiều về nếu có */}
                  {(flight?.isRoundTrip || flight?.type === "ROUND_TRIP") &&
                    Object.keys(extrasData?.selectedReturnSeats || {}).length >
                      0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-1">Chiều về:</p>
                        {Object.entries(extrasData.selectedReturnSeats).map(
                          ([passengerKey, seatNumber]) => {
                            const passengerIndex =
                              parseInt(passengerKey.replace("passenger", "")) -
                              1;
                            const passenger =
                              formData.passengers[passengerIndex];
                            return (
                              <div
                                key={passengerKey}
                                className="flex justify-between text-sm"
                              >
                                <span>
                                  {passenger?.firstName} {passenger?.lastName}:
                                </span>
                                <span className="text-blue-600 font-medium">
                                  {seatNumber}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}

                  {/* Thông báo khi không có ghế nào */}
                  {Object.keys(extrasData?.selectedSeats || {}).length === 0 &&
                    Object.keys(autoAssignedSeats).length === 0 && (
                      <p className="text-sm text-gray-500">
                        Sẽ tự động gán ghế trống khi thanh toán
                      </p>
                    )}
                </div>

                {/* Hành lý */}
                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">
                    🧳 Hành Lý Ký Gửi:
                  </h5>
                  {formData.passengers
                    .map((passenger, index) => {
                      const baggagePackage =
                        extrasData?.baggage?.[`passenger${index + 1}`];
                      if (baggagePackage && baggagePackage !== "NONE") {
                        const packageInfo = {
                          KG_15: "15kg",
                          KG_20: "20kg",
                          KG_25: "25kg",
                          KG_30: "30kg",
                        }[baggagePackage];
                        return (
                          <div
                            key={index}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {passenger.firstName} {passenger.lastName}:
                            </span>
                            <span className="text-green-600 font-medium">
                              {packageInfo}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })
                    .filter(Boolean)}
                  {!formData.passengers.some((_, index) => {
                    const baggage =
                      extrasData?.baggage?.[`passenger${index + 1}`];
                    return baggage && baggage !== "NONE";
                  }) && (
                    <p className="text-sm text-gray-500">
                      Không có hành lý ký gửi
                    </p>
                  )}
                </div>

                {/* Dịch vụ đi kèm */}
                {extrasData?.selectedAncillaryServices &&
                  Object.keys(extrasData.selectedAncillaryServices).length >
                    0 && (
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">
                        🛎️ Dịch Vụ Đi Kèm:
                      </h5>
                      {Object.values(extrasData.selectedAncillaryServices).map(
                        (service, index) => {
                          const serviceInfo =
                            extrasData.availableAncillaryServices?.find(
                              (s) => s.serviceId === service.serviceId
                            );
                          const passengerName = service.passengerId
                            ? `${
                                formData.passengers[service.passengerId - 1]
                                  ?.firstName
                              } ${
                                formData.passengers[service.passengerId - 1]
                                  ?.lastName
                              }`
                            : "Toàn booking";

                          return (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <div>
                                <span>
                                  {serviceInfo?.serviceName ||
                                    `Dịch vụ ${service.serviceId}`}
                                </span>
                                <span className="text-gray-500 ml-2">
                                  ({passengerName})
                                </span>
                              </div>
                              <span className="text-purple-600 font-medium">
                                {formatCurrencyVND(serviceInfo?.price || 0)}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chi Tiết Giá</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Flight Info */}
              <div className="text-sm mb-4">
                {flight?.isRoundTrip || flight?.type === "ROUND_TRIP" ? (
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold text-blue-700">
                        Chuyến bay chiều đi
                      </p>
                      <p className="text-gray-600">
                        {flight.outbound?.departureAirport?.code} →{" "}
                        {flight.outbound?.arrivalAirport?.code}
                      </p>
                      <p className="text-gray-600">
                        {flight.selectedOutboundFare?.travelClass?.className}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-700">
                        Chuyến bay chiều về
                      </p>
                      <p className="text-gray-600">
                        {flight.return?.departureAirport?.code} →{" "}
                        {flight.return?.arrivalAirport?.code}
                      </p>
                      <p className="text-gray-600">
                        {flight.selectedReturnFare?.travelClass?.className}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600">
                      Hạng vé:{" "}
                      {flight?.legs && flight.legs.length > 0
                        ? flight.legs
                            .map((leg) => leg.segmentFare?.className)

                            .filter((name) => name)
                            .join(" + ")
                        : fare?.travelClass?.className ||
                          flight?.legs?.[0]?.segmentFare?.className}
                    </p>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Passenger Names */}
              <div className="space-y-2 mb-4">
                <h5 className="font-semibold text-gray-700">Hành Khách:</h5>
                {formData.passengers.map((passenger, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {passenger.firstName} {passenger.lastName} (
                      {passenger.type === "ADULT"
                        ? "Người lớn"
                        : passenger.type === "CHILD"
                        ? "Trẻ em"
                        : "Em bé"}
                      )
                    </span>
                    <span className="text-gray-500">
                      Ghế:{" "}
                      {extrasData?.selectedSeats?.[`passenger${index + 1}`] ||
                        "Tự động"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Baggage Info */}
              {extrasData?.baggage &&
                Object.values(extrasData.baggage).some(
                  (pkg) => pkg !== "NONE"
                ) && (
                  <div className="space-y-2 mb-4">
                    <h5 className="font-semibold text-gray-700">
                      Hành Lý Ký Gửi:
                    </h5>
                    {formData.passengers
                      .map((passenger, index) => {
                        const baggagePackage =
                          extrasData.baggage[`passenger${index + 1}`];
                        if (baggagePackage && baggagePackage !== "NONE") {
                          const packageInfo = {
                            KG_15: "15kg",
                            KG_20: "20kg",
                            KG_25: "25kg",
                            KG_30: "30kg",
                          }[baggagePackage];
                          return (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-600">
                                {passenger.firstName} {passenger.lastName}
                              </span>
                              <span className="text-blue-600 font-medium">
                                {packageInfo}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })
                      .filter(Boolean)}
                  </div>
                )}

              <Separator className="my-4" />

              {/* Passengers */}
              {flight?.isRoundTrip || flight?.type === "ROUND_TRIP" ? (
                // Round-trip pricing from flight.totalPrice
                <div className="flex justify-between text-sm mb-2">
                  <span>{formData.passengers.length} hành khách (Khứ hồi)</span>
                  <span>{formatCurrencyVND(flight.totalPrice || 0)}</span>
                </div>
              ) : (
                // One-way pricing calculated per passenger
                formData.passengers.map((passenger, index) => {
                  const basePrice = fare?.customPrice || fare?.basePrice || 0;
                  const discountedPrice =
                    passenger.type === "CHILD"
                      ? basePrice * 0.75
                      : passenger.type === "INFANT"
                      ? basePrice * 0.1
                      : basePrice;
                  return (
                    <div
                      key={index}
                      className="flex justify-between text-sm mb-2"
                    >
                      <span>
                        {passenger.type === "ADULT"
                          ? "Người lớn"
                          : passenger.type === "CHILD"
                          ? "Trẻ em"
                          : "Em bé"}
                      </span>
                      <span>{formatCurrencyVND(discountedPrice)}</span>
                    </div>
                  );
                })
              )}

              {/* Extras */}
              {extrasData?.selectedSeats &&
                Object.keys(extrasData.selectedSeats).length > 0 && (
                  <div className="flex justify-between text-sm mb-2">
                    <span>Chỗ ngồi</span>
                    <span>{formatCurrencyVND(extrasData.seatTotal || 0)}</span>
                  </div>
                )}

              {extrasData?.baggage &&
                Object.values(extrasData.baggage).some(
                  (bag) => bag.firstBag > 0 || bag.secondBag > 0
                ) && (
                  <div className="flex justify-between text-sm mb-2">
                    <span>Hành lý</span>
                    <span>
                      {formatCurrencyVND(extrasData.baggageTotal || 0)}
                    </span>
                  </div>
                )}

              {extrasData?.selectedAncillaryServices &&
                Object.keys(extrasData.selectedAncillaryServices).length >
                  0 && (
                  <div className="space-y-1 mb-2">
                    <span className="text-sm font-medium">
                      🛎️ Dịch vụ đi kèm:
                    </span>
                    {Object.values(extrasData.selectedAncillaryServices).map(
                      (service, index) => {
                        const serviceInfo =
                          extrasData.availableAncillaryServices?.find(
                            (s) => s.serviceId === service.serviceId
                          );
                        return (
                          <div
                            key={index}
                            className="flex justify-between text-sm ml-4"
                          >
                            <span className="text-gray-600">
                              {serviceInfo?.serviceName ||
                                `Dịch vụ ${service.serviceId}`}
                            </span>
                            <span>
                              {formatCurrencyVND(serviceInfo?.price || 0)}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

              <Separator className="my-4" />

              {/* Deal Code Section */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập mã giảm giá (VD: STUDENT10)"
                    value={dealCode}
                    onChange={(e) => setDealCode(e.target.value.toUpperCase())}
                    disabled={dealApplied}
                    className="flex-1"
                  />
                  {!dealApplied ? (
                    <Button
                      onClick={handleApplyDeal}
                      disabled={applyingDeal || !dealCode.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {applyingDeal ? "Đang xử lý..." : "Áp dụng"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleRemoveDeal}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Xóa
                    </Button>
                  )}
                </div>

                {dealError && (
                  <p className="text-red-500 text-sm">{dealError}</p>
                )}

                {dealApplied && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex justify-between text-sm text-green-800">
                      <span>✓ Mã giảm giá "{dealCode}" đã áp dụng</span>
                      <span>-{formatCurrencyVND(dealDiscount)}</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {dealApplied && (
                <div className="flex justify-between text-sm mb-2">
                  <span>Tạm tính</span>
                  <span>{formatCurrencyVND(totalAmount)}</span>
                </div>
              )}

              {dealApplied && (
                <div className="flex justify-between text-sm mb-2 text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrencyVND(dealDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-blue-600">
                  {formatCurrencyVND(finalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Payment Method */}
        <div className="w-full md:w-1/2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Phương Thức Thanh Toán</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="card">Thẻ Tín Dụng</TabsTrigger>
                  <TabsTrigger value="paypal">PayPal</TabsTrigger>
                </TabsList>

                {/* Card Payment */}
                <TabsContent value="card">
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <button className="flex-1 p-2 border rounded-md bg-blue-50 text-blue-600">
                        Thẻ Tín Dụng/Ghi Nợ
                      </button>
                    </div>
                    <Input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.cardNumber}
                      onChange={(e) =>
                        handleCardChange("cardNumber", e.target.value)
                      }
                      className="w-full"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="text"
                        placeholder="Tên chủ thẻ"
                        value={cardDetails.cardHolderName}
                        onChange={(e) =>
                          handleCardChange("cardHolderName", e.target.value)
                        }
                        className="w-full"
                      />
                      <Input
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiryDate}
                        onChange={(e) =>
                          handleCardChange("expiryDate", e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                    <Input
                      type="text"
                      placeholder="CVV"
                      value={cardDetails.cvv}
                      onChange={(e) => handleCardChange("cvv", e.target.value)}
                      className="w-1/4"
                    />
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="save-card"
                        checked={saveCard}
                        onCheckedChange={setSaveCard}
                      />
                      <Label htmlFor="save-card">
                        Lưu thẻ này cho các lần thanh toán sau
                      </Label>
                    </div>
                  </div>
                </TabsContent>

                {/* PayPal Payment */}
                <TabsContent value="paypal">
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <button className="flex-1 p-2 border rounded-md bg-blue-500 text-white">
                        PayPal
                      </button>
                    </div>
                    <p className="text-gray-600">
                      Bạn sẽ được chuyển đến PayPal để hoàn tất thanh toán.
                    </p>
                    <Button className="w-full bg-blue-500 text-white">
                      Tiếp tục với PayPal
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-4 p-2 bg-green-50 text-green-700 rounded-md flex items-center">
                <span className="mr-2">🛡️</span>
                <span>
                  Thanh toán bảo mật: Thông tin thanh toán của bạn được mã hóa
                  và bảo mật
                </span>
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="terms"
                  checked={agreeTerms}
                  onCheckedChange={setAgreeTerms}
                />
                <Label htmlFor="terms">
                  Tôi đồng ý với Điều khoản và Điều kiện cũng như Quy định giá
                  vé
                </Label>
              </div>

              {/* Debug Panel */}
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id="debug"
                    checked={showDebug}
                    onCheckedChange={setShowDebug}
                  />
                  <Label htmlFor="debug" className="text-sm">
                    Hiển thị thông tin debug (Console)
                  </Label>
                </div>
                {showDebug && (
                  <div className="text-xs bg-gray-100 p-2 rounded mt-2 max-h-40 overflow-y-auto">
                    <strong>Booking Data Preview:</strong>
                    <pre className="mt-1">
                      {JSON.stringify(
                        {
                          flightId: flight.id,
                          classId: fare?.travelClass?.classId,
                          totalAmount: totalAmount,
                          totalAmountUSD: totalAmount.toFixed(2),
                          passengers: formData.passengers.length,
                          selectedSeats: Object.keys(
                            extrasData?.selectedSeats || {}
                          ).length,
                          needAutoAssign:
                            formData.passengers.length -
                            Object.keys(extrasData?.selectedSeats || {}).length,
                          baggage: Object.values(
                            extrasData?.baggage || {}
                          ).reduce(
                            (total, bag) =>
                              total + bag.firstBag + bag.secondBag,
                            0
                          ),
                          services: Object.values(
                            extrasData?.additionalServices || {}
                          ).filter(Boolean).length,
                          paymentMethod: "CREDIT_CARD",
                          status:
                            "Will be PENDING if pay later, CONFIRMED if pay now",
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>

              {/* Payment Buttons */}
              <div className="space-y-3 mt-4">
                <Button
                  className="w-full bg-blue-600 text-white"
                  disabled={!agreeTerms || isProcessing}
                  onClick={(e) => handleSubmit(e, false)}
                >
                  {isProcessing
                    ? "Đang xử lý..."
                    : `Thanh toán ngay - ${formatCurrencyVND(totalAmount)}`}
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                  disabled={!agreeTerms || isProcessing}
                  onClick={(e) => handleSubmit(e, true)}
                >
                  <span className="mr-2">⏰</span>
                  Thanh toán sau
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Thanh toán sau: Bạn có 1 giờ để hoàn tất thanh toán trước khi
                  mã đặt chỗ sẽ tự động hủy trên hệ thống
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

Payment.propTypes = {
  formData: PropTypes.shape({
    passengers: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.oneOf(["ADULT", "CHILD", "INFANT"]),
        fullName: PropTypes.string,
        dob: PropTypes.instanceOf(Date),
        passport: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            number: PropTypes.string,
          }),
        ]),
      })
    ).isRequired,
  }).isRequired,
  extrasData: PropTypes.shape({
    selectedSeats: PropTypes.object,
    baggage: PropTypes.object,
    additionalServices: PropTypes.object,
    total: PropTypes.number,
    seatTotal: PropTypes.number,
    baggageTotal: PropTypes.number,
    servicesTotal: PropTypes.number,
  }),
  flight: PropTypes.shape({
    id: PropTypes.number,
    airline: PropTypes.string,
    departureAirport: PropTypes.shape({
      airportName: PropTypes.string,
    }),
    arrivalAirport: PropTypes.shape({
      airportName: PropTypes.string,
    }),
  }).isRequired,
  fare: PropTypes.shape({
    price: PropTypes.number,
    travelClass: PropTypes.shape({
      classId: PropTypes.number,
      className: PropTypes.string,
    }),
  }).isRequired,
};

export default Payment;
