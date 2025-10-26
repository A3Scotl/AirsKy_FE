import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plane,
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  Wifi,
  Utensils,
  CreditCard,
  ShoppingCart,
} from "lucide-react";
import { flightApi } from "@/apis/flight-api";
import {
  ancillaryServiceApi,
  getServiceTypeInfo,
} from "@/apis/ancillary-service-api";
import { bookingApi } from "@/apis/booking-api";
import { toast } from "sonner";
import { formatCurrencyVND } from "@/utils/currency-utils";

const CheckInSeatSelection = ({
  booking,
  selectedSegment, // Thêm prop selectedSegment
  onSelectSeat,
  onConfirm,
  onBack,
  selectedSeat,
  onProceedToPayment,
  onProceedToFreeCheckIn,
  isProcessingPaymentSuccess = false,
}) => {
  // Seat Button Component for Aircraft Layout
  const SeatButton = ({
    seat,
    isSelected,
    isCurrent,
    isHovered,
    onClick,
    onMouseEnter,
    onMouseLeave,
    getSeatPrice,
    getSeatDescription,
    getSeatClassName,
  }) => {
    const seatNumber = seat.seatNumber;
    const seatPrice = getSeatPrice(seatNumber);
    const seatDesc = getSeatDescription(seatNumber);

    return (
      <button
        className={`
          relative w-14 h-14 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 shadow-xl transform
          ${
            isSelected
              ? "bg-gradient-to-b from-blue-400 to-blue-600 text-white scale-110 shadow-2xl border-blue-300 ring-4 ring-blue-200 transform rotate-1 -translate-y-1"
              : isCurrent
              ? "bg-gradient-to-b from-green-400 to-green-600 text-white scale-110 shadow-2xl border-green-300 ring-4 ring-green-200 transform rotate-1 -translate-y-1"
              : seat.status === "PENDING_PAYMENT"
              ? "bg-gradient-to-b from-yellow-400 to-yellow-600 text-white shadow-inner transform translate-y-0.5 border-yellow-300"
              : seat.status === "BOOKED" || seat.status === "OCCUPIED"
              ? "bg-gradient-to-b from-gray-500 to-gray-700 text-white shadow-inner transform translate-y-0.5 border-gray-400 cursor-not-allowed"
              : isHovered
              ? "bg-gradient-to-b from-yellow-400 to-yellow-600 text-white shadow-2xl hover:brightness-110 hover:-translate-y-2 transition-all duration-300 cursor-pointer hover:rotate-1 border-yellow-300"
              : getSeatClassName(seatNumber) === "premium"
              ? "bg-gradient-to-b from-blue-50 to-blue-100 text-blue-800 hover:scale-110 hover:shadow-2xl hover:brightness-110 hover:-translate-y-2 transition-all duration-300 cursor-pointer hover:rotate-1 border-blue-200"
              : getSeatClassName(seatNumber) === "business"
              ? "bg-gradient-to-b from-purple-50 to-purple-100 text-purple-800 hover:scale-110 hover:shadow-2xl hover:brightness-110 hover:-translate-y-2 transition-all duration-300 cursor-pointer hover:rotate-1 border-purple-200"
              : getSeatClassName(seatNumber) === "accessible"
              ? "bg-gradient-to-b from-orange-50 to-orange-100 text-orange-800 hover:scale-110 hover:shadow-2xl hover:brightness-110 hover:-translate-y-2 transition-all duration-300 cursor-pointer hover:rotate-1 border-orange-200"
              : "bg-gradient-to-b from-green-50 to-green-100 text-green-800 hover:scale-110 hover:shadow-2xl hover:brightness-110 hover:-translate-y-2 transition-all duration-300 cursor-pointer hover:rotate-1 border-green-200"
          }
        `}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        disabled={
          (seat.status === "BOOKED" || seat.status === "OCCUPIED") && !isCurrent
        }
        title={`${seatNumber} - ${seat.className} - ${seatDesc} - ${
          seatPrice > 0 ? `+${formatCurrencyVND(seatPrice)}` : "Miễn phí"
        }${seat.status === "PENDING_PAYMENT" ? " - Đang chờ thanh toán" : ""}${
          seat.status === "BOOKED"
            ? ` - Đã đặt bởi ${seat.bookedBy || "khách hàng khác"}`
            : seat.status === "OCCUPIED"
            ? " - Ghế đã được chiếm"
            : ""
        }`}
      >
        {/* 3D Seat Effect */}
        <div
          className={`absolute inset-0 rounded-xl ${
            isSelected || isCurrent
              ? "bg-gradient-to-br from-white/40 via-white/20 to-blue-500/30 shadow-inner"
              : seat.status === "BOOKED" ||
                seat.status === "OCCUPIED" ||
                seat.status === "PENDING_PAYMENT"
              ? "bg-gradient-to-br from-black/20 via-black/10 to-black/30 shadow-inner"
              : "bg-gradient-to-br from-white/30 via-white/15 to-black/25 shadow-inner"
          }`}
        />

        {/* Seat Armrests */}
        <div className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-r from-black/20 to-transparent rounded-l-xl" />
        <div className="absolute right-0 top-1 bottom-1 w-1 bg-gradient-to-l from-black/20 to-transparent rounded-r-xl" />

        {/* Seat Back */}
        <div className="absolute top-0 left-1 right-1 h-2 bg-gradient-to-b from-black/15 to-transparent rounded-t-xl" />

        {/* Seat Padding */}
        <div className="absolute inset-1 rounded-lg bg-gradient-to-b from-white/15 via-white/5 to-black/10" />

        {/* Seat Content */}
        <div className="relative flex flex-col items-center z-10">
          <span
            className={`font-bold text-xs tracking-tight ${
              isSelected || isCurrent
                ? "text-white drop-shadow-lg font-extrabold"
                : "text-black drop-shadow-md"
            }`}
          >
            {seatNumber}
          </span>

          {/* Seat Type Indicator */}
          {seat.seatType && seat.seatType !== "STANDARD" && (
            <div className="flex flex-col items-center">
              <span
                className={`text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded-full border ${
                  isSelected || isCurrent
                    ? "text-white bg-blue-600/80 border-white/50 drop-shadow-lg"
                    : "text-black bg-white/60 border-black/30 drop-shadow-md"
                }`}
              >
                {seat.seatType === "EXTRA_LEGROOM"
                  ? "EL"
                  : seat.seatType === "EXIT_ROW"
                  ? "ER"
                  : seat.seatType === "FRONT_ROW"
                  ? "FR"
                  : seat.seatType === "ACCESSIBLE"
                  ? "AC"
                  : "ST"}
              </span>
            </div>
          )}

          {/* Price Indicator */}
          {seatPrice > 0 && (
            <div
              className={`text-[8px] leading-none mt-0.5 ${
                isSelected || isCurrent
                  ? "text-white drop-shadow-lg"
                  : "text-green-600 drop-shadow-sm"
              }`}
            >
              +{formatCurrencyVND(seatPrice)}
            </div>
          )}

          {/* Current Seat Indicator */}
          {isCurrent && (
            <div className="text-[8px] leading-none mt-0.5 text-white drop-shadow-lg">
              Hiện tại
            </div>
          )}
        </div>

        {/* Selection/Checkmark Indicator */}
        {(isSelected || isCurrent) && (
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-3 border-white flex items-center justify-center shadow-2xl transform rotate-12">
            <svg
              className="w-4 h-4 text-white drop-shadow-lg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}

        {/* Occupied/Pending Indicator */}
        {(seat.status === "BOOKED" ||
          seat.status === "OCCUPIED" ||
          seat.status === "PENDING_PAYMENT") && (
          <div
            className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-xl border-2 border-white transform rotate-12 ${
              seat.status === "PENDING_PAYMENT"
                ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                : seat.status === "OCCUPIED"
                ? "bg-gradient-to-br from-gray-500 to-gray-700"
                : "bg-gradient-to-br from-red-400 to-red-600"
            }`}
          >
            <svg
              className="w-3 h-3 text-white drop-shadow-lg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </button>
    );
  };

  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [seatsData, setSeatsData] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [seatTypePricing, setSeatTypePricing] = useState({});
  const [ancillaryServices, setAncillaryServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});
  const [preSelectedServices, setPreSelectedServices] = useState({});
  const [loadingServices, setLoadingServices] = useState(false);

  // Dialog states for seat change confirmation
  const [showSeatChangeDialog, setShowSeatChangeDialog] = useState(false);
  const [pendingSeatSelection, setPendingSeatSelection] = useState(null);
  const [seatChangeCost, setSeatChangeCost] = useState(0);

  // Seat change calculation data from API
  const [seatChangeCalculation, setSeatChangeCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Track if seat change has been confirmed through popup
  const [seatChangeConfirmed, setSeatChangeConfirmed] = useState(false);

  // State for current seat ID (calculated after getSeatData is available)
  const [currentSeatId, setCurrentSeatId] = useState(null);

  // Get current passenger info for selected segment
  const currentPassenger = selectedSegment
    ? booking.checkinEligiblePassengers?.find(
        (p) => p.segmentId === selectedSegment.segmentId
      ) ||
      booking.checkinEligiblePassengers?.find(
        (p) => p.segmentId === null && booking.flightSegments?.length === 1
      ) ||
      booking.checkinEligiblePassengers?.[0]
    : booking.checkinEligiblePassengers?.[0] || booking.passengers?.[0];
  const currentSeat = currentPassenger?.seatNumber;
  const flightId = booking.flightSegments?.[0]?.flightId || booking.flightId;
  const travelClassId =
    currentPassenger?.travelClassId || booking.travelClassId;

  // Helper function to get seat type pricing from booking data
  const getSeatTypePricing = () => {
    if (booking.seatTypeDetails && booking.seatTypeDetails.length > 0) {
      const pricing = {};
      booking.seatTypeDetails.forEach((detail) => {
        pricing[detail.seatType] = {
          description: detail.seatTypeDescription,
          price: detail.additionalPrice || 0,
          seatNumber: detail.seatNumber,
          passengerName: detail.passengerName,
        };
      });
      return pricing;
    }
    return {};
  };

  // Helper function to get service type icon
  const getServiceTypeIcon = (serviceType) => {
    switch (serviceType) {
      case "MEAL":
        return "🍽️";
      case "WIFI":
        return "📶";
      case "ENTERTAINMENT":
        return "🎬";
      case "BAGGAGE":
        return "🧳";
      default:
        return "🛎️";
    }
  };

  // Get current seat type pricing
  const currentSeatPricing = getSeatTypePricing();

  // Load seat data from API
  useEffect(() => {
    const loadSeatsData = async () => {
      // Determine the target segment based on selectedSegment
      let targetSegment = null;

      if (selectedSegment) {
        // Check if selectedSegment is a segment object (has segmentId)
        if (selectedSegment.segmentId) {
          targetSegment = booking.flightSegments?.find(
            (fs) => fs.segmentId === selectedSegment.segmentId
          );
        }
        // Check if selectedSegment is a passenger object (has passengerId)
        else if (selectedSegment.passengerId) {
          // For one-way bookings, passenger might have segmentId: null, so use first segment
          if (booking.flightSegments?.length === 1) {
            targetSegment = booking.flightSegments[0];
          }
          // For round-trip, find segment that matches passenger's segmentId if available
          else if (selectedSegment.segmentId !== null) {
            targetSegment = booking.flightSegments?.find(
              (fs) => fs.segmentId === selectedSegment.segmentId
            );
          }
          // Fallback to first segment
          if (!targetSegment) {
            targetSegment = booking.flightSegments?.[0];
          }
        }
      } else {
        // No selectedSegment, use first segment
        targetSegment = booking.flightSegments?.[0];
      }

      const finalFlightId =
        targetSegment?.flightId || targetSegment?.id || booking.flightId;
      const finalTravelClassId =
        targetSegment?.classId ||
        targetSegment?.travelClassId ||
        currentPassenger?.travelClassId ||
        booking.travelClassId;

      // Try to get flight and travel class info from different sources
      console.log("🔍 Debug flight data:", {
        selectedSegment,
        targetSegment,
        bookingFlightSegments: booking.flightSegments,
        bookingFlightId: booking.flightId,
        currentPassenger,
        finalFlightId,
        finalTravelClassId,
      });

      // Get available seats for the target segment
      const segmentAvailableSeats = booking.availableSeats?.find(
        (segment) => segment.segmentId === targetSegment?.segmentId
      );

      console.log("🛩️ Attempting to load seats with:", {
        finalFlightId,
        finalTravelClassId,
        selectedSegment,
        targetSegment,
        segmentAvailableSeats,
        booking,
        currentPassenger,
      });

      // Always try to call API first to get real seatId
      if (finalFlightId && finalTravelClassId) {
        setLoadingSeats(true);
        try {
          console.log(
            "🛩️ Loading seats from API for flight:",
            finalFlightId,
            "class:",
            finalTravelClassId
          );

          const response =
            await flightApi.getSeatsFlightByFlightIdAndTravelClassId(
              finalFlightId,
              finalTravelClassId
            );

          if (response.success && response.data) {
            console.log(
              "✅ Seats loaded successfully from API:",
              response.data
            );

            // Mark seats as available based on segment's availableSeats
            let processedSeats = response.data.map((seat) => ({
              ...seat,
              status:
                segmentAvailableSeats &&
                segmentAvailableSeats.availableSeats &&
                segmentAvailableSeats.availableSeats.includes(seat.seatNumber)
                  ? "AVAILABLE"
                  : seat.status || "OCCUPIED",
            }));

            // Ensure current seat is always included, even if not in API response
            if (
              currentSeat &&
              !processedSeats.find((seat) => seat.seatNumber === currentSeat)
            ) {
              console.log("➕ Adding current seat to seats data:", currentSeat);
              const currentSeatData = {
                seatId: `current-${currentSeat}`, // Generate a temporary ID for current seat
                seatNumber: currentSeat,
                className: booking.travelClass || "Economy",
                status: "AVAILABLE", // Always show current seat as available for reselection
                seatType: getSeatTypeFromPosition(currentSeat),
                travelClassId: finalTravelClassId,
              };
              processedSeats.push(currentSeatData);
            }

            console.log(
              "✅ Processed seats with availability:",
              processedSeats
            );
            setSeatsData(processedSeats);

            // Build seat type pricing from API data
            const pricing = {};
            processedSeats.forEach((seat) => {
              if (seat.seatType && !pricing[seat.seatType]) {
                pricing[seat.seatType] = {
                  description: getSeatTypeDescription(seat.seatType),
                  sampleSeat: seat,
                };
              }
            });
            setSeatTypePricing(pricing);
            return;
          } else {
            console.error(
              "❌ Failed to load seats from API:",
              response.message
            );
          }
        } catch (error) {
          console.error("❌ Error loading seats from API:", error);
        } finally {
          setLoadingSeats(false);
        }
      }

      // Fallback: use availableSeats from segment data if API failed
      if (
        segmentAvailableSeats &&
        segmentAvailableSeats.availableSeats &&
        Array.isArray(segmentAvailableSeats.availableSeats)
      ) {
        console.log(
          "🪑 Using available seats from segment data as fallback:",
          segmentAvailableSeats.availableSeats
        );
        const fallbackSeats = segmentAvailableSeats.availableSeats.map(
          (seatNumber, index) => ({
            seatId: null, // No real seatId for fallback data
            seatNumber: seatNumber,
            className: booking.travelClass || "Economy",
            status: "AVAILABLE",
            seatType: getSeatTypeFromPosition(seatNumber),
            travelClassId: finalTravelClassId,
          })
        );

        // Ensure current seat is always included in fallback data
        if (
          currentSeat &&
          !fallbackSeats.find((seat) => seat.seatNumber === currentSeat)
        ) {
          console.log(
            "➕ Adding current seat to fallback seats data:",
            currentSeat
          );
          const currentSeatData = {
            seatId: `current-${currentSeat}`, // Generate a temporary ID for current seat
            seatNumber: currentSeat,
            className: booking.travelClass || "Economy",
            status: "AVAILABLE", // Always show current seat as available for reselection
            seatType: getSeatTypeFromPosition(currentSeat),
            travelClassId: finalTravelClassId,
          };
          fallbackSeats.push(currentSeatData);
        }

        setSeatsData(fallbackSeats);

        // Build seat type pricing
        const pricing = {};
        fallbackSeats.forEach((seat) => {
          if (seat.seatType && !pricing[seat.seatType]) {
            pricing[seat.seatType] = {
              description: getSeatTypeDescription(seat.seatType),
            };
          }
        });
        setSeatTypePricing(pricing);
      }
    };

    loadSeatsData();
  }, [flightId, travelClassId, booking]);

  // Load ancillary services
  useEffect(() => {
    const loadAncillaryServices = async () => {
      try {
        setLoadingServices(true);
        const response = await ancillaryServiceApi.getAllActiveServices();
        setAncillaryServices(response.data || []);
      } catch (error) {
        console.error("Error loading ancillary services:", error);
      } finally {
        setLoadingServices(false);
      }
    };

    loadAncillaryServices();
  }, []);

  // Initialize selected services from booking data
  useEffect(() => {
    if (booking?.ancillaryServices && ancillaryServices.length > 0) {
      const initialSelected = {};
      const preSelected = {};
      booking.ancillaryServices.forEach((service) => {
        const serviceKey = service.serviceId || service.id;
        initialSelected[serviceKey] = true;
        preSelected[serviceKey] = true;
      });
      setSelectedServices(initialSelected);
      setPreSelectedServices(preSelected);
    }
  }, [booking?.ancillaryServices, ancillaryServices]);

  // Calculate current seat ID when seats data is available
  useEffect(() => {
    if (seatsData.length > 0 && currentSeat) {
      const currentSeatData = seatsData.find(
        (seat) => seat.seatNumber === currentSeat
      );
      if (currentSeatData?.seatId) {
        setCurrentSeatId(currentSeatData.seatId);
        console.log("✅ Current seat ID resolved:", {
          seatNumber: currentSeat,
          seatId: currentSeatData.seatId,
        });
      } else {
        console.warn("⚠️ Could not find seatId for current seat:", currentSeat);
      }
    }
  }, [seatsData, currentSeat]);

  // Helper function to get seat type description
  const getSeatTypeDescription = (seatType) => {
    const descriptions = {
      STANDARD: "Ghế tiêu chuẩn",
      EXTRA_LEGROOM: "Ghế thêm không gian chân",
      EXIT_ROW: "Ghế lối thoát hiểm",
      FRONT_ROW: "Ghế hàng đầu",
      ACCESSIBLE: "Ghế cho người khuyết tật",
    };
    return descriptions[seatType] || "Ghế tiêu chuẩn";
  };

  // Helper function to determine seat type from position
  const getSeatTypeFromPosition = (seatNumber) => {
    if (!seatNumber || typeof seatNumber !== "string") {
      return "STANDARD";
    }

    const row = parseInt(seatNumber.slice(0, -1));
    const letter = seatNumber.slice(-1);

    // Logic to determine seat type based on position
    if (row === 1) return "FRONT_ROW";
    if (row >= 10 && row <= 15 && (letter === "A" || letter === "F"))
      return "EXIT_ROW";
    if (row <= 5) return "EXTRA_LEGROOM";
    if (letter === "A" && row >= 20) return "ACCESSIBLE";
    return "STANDARD";
  };

  // Get all seats from API data - Display ALL seats to show their actual status (AVAILABLE, BOOKED, OCCUPIED, etc.)
  // This ensures users can see which seats are actually occupied in the database
  const availableSeats = seatsData;

  // Get seat data from API data
  const getSeatData = (seatNumber) => {
    return seatsData.find((seat) => seat.seatNumber === seatNumber);
  };

  // Handle service selection
  const handleServiceSelection = (serviceId, checked) => {
    // Don't allow unchecking pre-selected services
    if (preSelectedServices[serviceId] && !checked) {
      return;
    }

    setSelectedServices((prev) => ({
      ...prev,
      [serviceId]: checked,
    }));
  };

  // Calculate total additional costs (backwards compatibility)
  const calculateTotalAdditionalCost = () => {
    return calculateFinalTotal();
  };

  // Get selected services list (only newly selected, not pre-selected)
  const getSelectedServices = () => {
    return ancillaryServices.filter((service) => {
      const serviceKey = service.serviceId || service.id;
      return selectedServices[serviceKey] && !preSelectedServices[serviceKey];
    });
  };

  // Calculate final total including seat change and additional services
  const calculateFinalTotal = () => {
    let total = 0;

    if (seatChangeCalculation && seatChangeConfirmed) {
      // If seat change is confirmed, only use the seat price difference (not services included in calculation)
      total += seatChangeCalculation.priceDifference || 0;

      // Add all selected services (both from seat change and additional ones)
      const allServices = getSelectedServices();
      allServices.forEach((service) => {
        total += service.price || 0;
      });
    } else {
      // No seat change, just add service costs
      const services = getSelectedServices();
      services.forEach((service) => {
        total += service.price || 0;
      });
    }

    return Math.max(0, total); // Ensure positive value
  };

  const getSeatType = (seatNumber) => {
    const seatData = getSeatData(seatNumber);
    return seatData?.seatType || "STANDARD";
  };

  const getSeatPrice = (seatNumber) => {
    if (!seatNumber) return 0;

    const seatData = getSeatData(seatNumber);
    // First check if we have pricing from booking data
    if (seatData?.seatType && currentSeatPricing[seatData.seatType]) {
      return currentSeatPricing[seatData.seatType].price;
    }
    // Fallback to API data or default pricing logic
    // For now, return sample prices based on seat type
    const seatType = seatData?.seatType || getSeatTypeFromPosition(seatNumber);
    switch (seatType) {
      case "FRONT_ROW":
        return 75000;
      case "EXTRA_LEGROOM":
        return 50000;
      case "EXIT_ROW":
        return 100000;
      case "ACCESSIBLE":
        return 25000;
      default:
        return 0; // Standard seats are free
    }
  };

  const getSeatDescription = (seatNumber) => {
    const seatType = getSeatType(seatNumber);
    return getSeatTypeDescription(seatType);
  };

  const getSeatClassName = (seatNumber) => {
    const seatType = getSeatType(seatNumber);
    switch (seatType) {
      case "FRONT_ROW":
      case "EXTRA_LEGROOM":
        return "premium";
      case "EXIT_ROW":
        return "business";
      case "ACCESSIBLE":
        return "accessible";
      default:
        return "economy";
    }
  };

  const getSeatClass = (seatNumber) => {
    if (selectedSeat?.seatNumber === seatNumber) return "selected";
    if (hoveredSeat === seatNumber) return "hovered";
    return "available";
  };

  const handleProceedToPayment = () => {
    // Skip payment if already processing payment success
    if (isProcessingPaymentSuccess) {
      console.log("⏭️ Skipping payment - payment success in progress");
      return;
    }

    const finalTotal = calculateFinalTotal();
    const services = getSelectedServices();

    // Validate amount is positive
    if (finalTotal <= 0) {
      console.error("❌ Invalid payment amount:", finalTotal);
      toast.error("Số tiền thanh toán không hợp lệ");
      return;
    }

    // Create combined payment data
    const paymentData = {
      seatChange:
        seatChangeCalculation && seatChangeConfirmed
          ? {
              calculation: seatChangeCalculation,
              newSeat: selectedSeat,
            }
          : null,
      additionalServices: services,
      totalAmount: finalTotal,
    };

    console.log("💳 Proceeding to payment with combined data:", {
      finalTotal,
      services,
      selectedSeat,
      paymentData,
    });
    onProceedToPayment(finalTotal, services, selectedSeat, paymentData);
  };

  const handleSeatSelection = async (seatNumber, seatType, seatId) => {
    // Allow selecting the same seat to confirm selection
    // Only skip if it's the same as currently selected AND no seat change is needed
    if (
      selectedSeat &&
      selectedSeat.seatNumber === seatNumber &&
      currentSeat === seatNumber
    ) {
      console.log("✅ Seat already selected and confirmed:", seatNumber);
      return;
    }

    // Reset seat change confirmation when selecting a new seat
    setSeatChangeConfirmed(false);

    // If there's a current seat (from booking) and we're changing to a different seat
    if (currentSeat && currentSeat !== seatNumber) {
      console.log("🔄 Seat change detected:", {
        from: currentSeat,
        to: seatNumber,
      });
      // Calculate seat change using API
      await calculateSeatChangeWithAPI(seatNumber, seatType, seatId);
    } else {
      // Selecting current seat or no current seat - just select normally
      console.log("✅ Normal seat selection:", seatNumber);
      onSelectSeat(seatNumber, seatType, seatId);
    }
  };

  // Calculate seat change cost using API
  const calculateSeatChangeWithAPI = async (
    newSeatNumber,
    newSeatType,
    newSeatId
  ) => {
    // Skip calculation if processing payment success to prevent duplicate API calls
    if (isProcessingPaymentSuccess) {
      console.log("⏭️ Skipping seat calculation - payment success in progress");
      return;
    }

    setIsCalculating(true);
    try {
      const currentPassenger = selectedSegment
        ? booking.checkinEligiblePassengers?.find(
            (p) => p.segmentId === selectedSegment.segmentId
          ) || booking.checkinEligiblePassengers?.[0]
        : booking.checkinEligiblePassengers?.[0] || booking.passengers?.[0];

      // Prepare services to add (newly selected services)
      const servicesToAdd = ancillaryServices
        .filter((service) => {
          const serviceKey = service.serviceId || service.id;
          return (
            selectedServices[serviceKey] && !preSelectedServices[serviceKey]
          );
        })
        .map((service) => ({
          serviceId: service.serviceId || service.id,
          quantity: 1, // Default quantity
          notes: "", // Required notes field
        }));

      const seatChangeData = {
        bookingCode: booking.bookingCode,
        passengerId: currentPassenger?.passengerId,
        newSeatId: newSeatId,
        servicesToAdd: servicesToAdd,
      };

      console.log("🧮 Calculating seat change with data:", seatChangeData);

      const response = await bookingApi.calculateSeatChange(seatChangeData);

      if (response.success && response.data) {
        console.log("✅ Seat change calculation:", response.data);
        setSeatChangeCalculation(response.data);
        setPendingSeatSelection({
          seatNumber: newSeatNumber,
          seatType: newSeatType,
          seatId: newSeatId,
        });
        setSeatChangeCost(response.data.totalCharge || 0);

        // If seat change is free (priceDifference is 0), just confirm the seat change
        if (
          response.data.totalCharge === 0 ||
          response.data.priceDifference === 0
        ) {
          console.log(
            "💰 Seat change is free, confirming seat change without payment"
          );
          // Select the seat and mark as confirmed
          onSelectSeat(newSeatNumber, newSeatType, newSeatId);
          setSeatChangeConfirmed(true);
          // Don't proceed to check-in automatically - let user select services first
          return;
        }

        // If seat change has cost, show confirmation dialog
        setShowSeatChangeDialog(true);
      } else {
        toast.error(
          "Không thể tính toán phí thay đổi ghế: " +
            (response.message || "Lỗi không xác định")
        );
      }
    } catch (error) {
      console.error("❌ Error calculating seat change:", error);
      toast.error("Có lỗi xảy ra khi tính toán phí thay đổi ghế");
    } finally {
      setIsCalculating(false);
    }
  };

  // Confirm seat change
  const confirmSeatChange = () => {
    if (pendingSeatSelection && seatChangeCalculation) {
      // Select the seat first
      onSelectSeat(
        pendingSeatSelection.seatNumber,
        pendingSeatSelection.seatType,
        pendingSeatSelection.seatId
      );

      // Mark that seat change has been confirmed through popup
      setSeatChangeConfirmed(true);

      console.log(
        "✅ Seat change confirmed, user can now select additional services before final payment"
      );

      // Close dialog and let user continue selecting services
      // Don't proceed to payment immediately - let user select more services first
      setShowSeatChangeDialog(false);
      setPendingSeatSelection(null);
      setSeatChangeCost(0);
      // Keep seatChangeCalculation for final payment calculation
    }
  };

  // Handle proceed to payment with calculation data
  const handleProceedToPaymentWithCalculation = () => {
    if (seatChangeCalculation) {
      const services = getSelectedServices();
      // Pass the calculation data along with seat and services
      onProceedToPayment(
        seatChangeCalculation.totalCharge,
        services,
        selectedSeat,
        seatChangeCalculation
      );
    } else {
      // Fallback to original method
      handleProceedToPayment();
    }
  };

  // Cancel seat change
  const cancelSeatChange = () => {
    setShowSeatChangeDialog(false);
    setPendingSeatSelection(null);
    setSeatChangeCost(0);
    setSeatChangeCalculation(null);
    setSeatChangeConfirmed(false);
  };

  // Handle confirm check-in with seat change validation
  const handleConfirmCheckin = async () => {
    // If seat change has already been confirmed, proceed directly to check-in
    if (seatChangeConfirmed) {
      console.log("✅ Seat change already confirmed, proceeding with check-in");
      onConfirm();
      return;
    }

    // If user has selected a different seat from current seat, need to calculate seat change
    if (
      selectedSeat &&
      currentSeat &&
      selectedSeat.seatNumber !== currentSeat
    ) {
      console.log("🔄 Need to process seat change before check-in");
      await calculateSeatChangeWithAPI(
        selectedSeat.seatNumber,
        selectedSeat.seatType,
        selectedSeat.seatId
      );
    } else if (currentSeat && !selectedSeat) {
      // User wants to keep current seat - just proceed with check-in
      console.log("✅ Keeping current seat, proceeding with check-in");
      onConfirm();
    } else if (selectedSeat) {
      // User has selected a seat but no current seat (new selection)
      console.log("✅ New seat selection, proceeding with check-in");
      onConfirm();
    } else {
      console.log("⚠️ No seat selected");
      toast.error("Vui lòng chọn ghế trước khi check-in");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-500" />
            Chọn chỗ ngồi -{" "}
            {selectedSegment?.flightNumber ||
              booking.flightSegments?.[0]?.flightNumber ||
              booking.flight}
            {selectedSegment?.segmentOrder && (
              <Badge variant="outline" className="ml-2">
                Chuyến {selectedSegment.segmentOrder === 1 ? "Đi" : "Về"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Hành khách</p>
              <p className="font-medium">
                {currentPassenger?.fullName ||
                  currentPassenger?.firstName +
                    " " +
                    currentPassenger?.lastName}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Chuyến bay</p>
              <p className="font-medium">
                {selectedSegment?.flightNumber ||
                  booking.flightSegments?.[0]?.flightNumber ||
                  booking.flightNumber}{" "}
                -{" "}
                {selectedSegment?.departureAirport?.airportCode ||
                  booking.flightSegments?.[0]?.departureAirport?.airportCode ||
                  booking.from}{" "}
                →{" "}
                {selectedSegment?.arrivalAirport?.airportCode ||
                  booking.flightSegments?.[0]?.arrivalAirport?.airportCode ||
                  booking.to}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {selectedSegment?.departureTime
                  ? new Date(selectedSegment.departureTime).toLocaleString(
                      "vi-VN"
                    )
                  : booking.flightSegments?.[0]?.departureTime
                  ? new Date(
                      booking.flightSegments[0].departureTime
                    ).toLocaleString("vi-VN")
                  : "N/A"}{" "}
                -{" "}
                {selectedSegment?.arrivalTime
                  ? new Date(selectedSegment.arrivalTime).toLocaleString(
                      "vi-VN"
                    )
                  : booking.flightSegments?.[0]?.arrivalTime
                  ? new Date(
                      booking.flightSegments[0].arrivalTime
                    ).toLocaleString("vi-VN")
                  : "N/A"}
              </p>
            </div>
            {currentSeat && (
              <div>
                <p className="text-gray-600">Ghế hiện tại</p>
                <p className="font-medium text-blue-600">{currentSeat}</p>
              </div>
            )}
            <div>
              <p className="text-gray-600">Hạng ghế</p>
              <p className="font-medium">
                {booking.travelClass || currentPassenger?.className}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Current Seat and Services Information */}
      {(booking.seatTypeDetails?.length > 0 ||
        booking.ancillaryServices?.length > 0) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="w-5 h-5" />
              Thông Tin Đã Chọn Trước Đó
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Seat Information */}
            {(() => {
              // For one-way bookings, show all seat details; for round-trip, filter by segment
              const isOneWay = booking.flightSegments?.length === 1;
              const filteredSeatDetails = isOneWay
                ? booking.seatTypeDetails
                : booking.seatTypeDetails?.filter(
                    (seatDetail) =>
                      seatDetail.segmentId === selectedSegment?.segmentId
                  );

              return (
                filteredSeatDetails?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <Plane className="w-4 h-4" />
                      Ghế Đã Chọn
                    </h4>
                    <div className="space-y-2">
                      {filteredSeatDetails.map((seatDetail, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 bg-white rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-600">
                                {seatDetail.seatNumber}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {seatDetail.passengerName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {seatDetail.seatTypeDescription}
                              </p>
                              <p className="text-xs text-gray-500">
                                Chuyến {seatDetail.segmentOrder}:{" "}
                                {seatDetail.flightNumber}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">
                              {seatDetail.additionalPrice > 0
                                ? `+${formatCurrencyVND(
                                    seatDetail.additionalPrice
                                  )}`
                                : "Miễn phí"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-800">
                          Tổng phí ghế:
                        </span>
                        <span className="font-bold text-blue-600">
                          {formatCurrencyVND(
                            filteredSeatDetails?.reduce(
                              (total, seat) =>
                                total + (seat.additionalPrice || 0),
                              0
                            ) || 0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              );
            })()}

            {/* Ancillary Services Information */}
            {booking.ancillaryServices?.length > 0 && (
              <div>
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Dịch Vụ Đi Kèm Đã Chọn
                </h4>
                <div className="space-y-2">
                  {booking.ancillaryServices.map((service, index) => (
                    <div
                      key={service.bookingServiceId || index}
                      className="flex justify-between items-center p-3 bg-white rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-lg">
                          {getServiceTypeIcon(service.serviceType)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {service.serviceName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {service.serviceTypeDisplayName}
                          </p>
                          {service.passengerName && (
                            <p className="text-xs text-gray-500">
                              Cho: {service.passengerName}
                            </p>
                          )}
                          {service.notes && (
                            <p className="text-xs text-gray-500 italic">
                              "{service.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrencyVND(service.totalPrice)}
                        </p>
                        {service.quantity > 1 && (
                          <p className="text-xs text-gray-500">
                            SL: {service.quantity} ×{" "}
                            {formatCurrencyVND(service.unitPrice)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-green-100 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">
                      Tổng phí dịch vụ:
                    </span>
                    <span className="font-bold text-green-600">
                      {formatCurrencyVND(booking.ancillaryServicesAmount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Current Seat Information */}
      {currentSeat && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">
                  Ghế hiện tại của bạn: {currentSeat}
                </p>
                <p className="text-sm text-green-700">
                  Loại ghế: {getSeatTypeDescription(getSeatType(currentSeat))}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Ghế này sẽ được highlight màu xanh lá trong sơ đồ bên dưới
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Seat Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            Sơ đồ chỗ ngồi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
              <span className="text-sm">Còn trống</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 border-2 border-blue-700 rounded"></div>
              <span className="text-sm">Đã chọn</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 border-2 border-green-700 rounded"></div>
              <span className="text-sm">Ghế hiện tại của bạn</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-600 border-2 border-gray-700 rounded"></div>
              <span className="text-sm">Đã bị chiếm</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 border-2 border-yellow-500 rounded"></div>
              <span className="text-sm">Đang hover</span>
            </div>
          </div>

          {/* Seat Type Legend */}
          {Object.keys(seatTypePricing).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 text-xs">
              {Object.entries(seatTypePricing).map(([type, info]) => (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded border ${
                      type === "FRONT_ROW" || type === "EXTRA_LEGROOM"
                        ? "bg-blue-100 border-blue-300"
                        : type === "EXIT_ROW"
                        ? "bg-purple-100 border-purple-300"
                        : type === "ACCESSIBLE"
                        ? "bg-orange-100 border-orange-300"
                        : "bg-green-100 border-green-300"
                    }`}
                  ></div>
                  <span>{info.description}</span>
                  <span className="font-medium text-gray-600">
                    {currentSeatPricing[type]
                      ? formatCurrencyVND(currentSeatPricing[type].price)
                      : info.sampleSeat?.seatNumber &&
                        getSeatPrice(info.sampleSeat.seatNumber) > 0
                      ? formatCurrencyVND(
                          getSeatPrice(info.sampleSeat.seatNumber)
                        )
                      : "Miễn phí"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Available Seats Display */}
          <div className="bg-gradient-to-b from-blue-50 to-gray-100 rounded-2xl p-6 shadow-lg">
            {loadingSeats ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải thông tin ghế...</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Sơ đồ chỗ ngồi máy bay
                  </h4>
                  <p className="text-sm text-gray-600">
                    Sơ đồ chỗ ngồi ({availableSeats.length} ghế)
                    {currentSeat && (
                      <span className="ml-2 text-green-600 font-medium">
                        • Ghế hiện tại: {currentSeat}
                      </span>
                    )}
                  </p>
                </div>

                {/* Aircraft Layout */}
                <div className="max-w-4xl mx-auto">
                  {/* Cockpit */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-20 h-12 bg-gradient-to-b from-gray-200 to-gray-400 rounded-t-full flex items-center justify-center shadow-lg border-2 border-gray-300">
                        <span className="text-lg">✈️</span>
                      </div>
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                        <div className="w-3 h-2 bg-blue-400 rounded-sm shadow-inner border border-blue-500"></div>
                        <div className="w-3 h-2 bg-blue-400 rounded-sm shadow-inner border border-blue-500"></div>
                      </div>
                      <div className="absolute inset-0 rounded-t-full bg-gradient-to-r from-white/30 via-transparent to-white/30"></div>
                    </div>
                  </div>

                  {/* Aisle */}
                  <div className="flex justify-center mb-4">
                    <div className="w-2 h-8 bg-gradient-to-b from-gray-300 to-gray-400 shadow-sm"></div>
                  </div>

                  {/* Seats by Row */}
                  {(() => {
                    // Group seats by row number
                    const seatsByRow = {};
                    availableSeats.forEach((seat) => {
                      const rowNum = seat.seatNumber.match(/\d+/)?.[0] || "1";
                      if (!seatsByRow[rowNum]) seatsByRow[rowNum] = [];
                      seatsByRow[rowNum].push(seat);
                    });

                    // Sort row numbers
                    const sortedRowNumbers = Object.keys(seatsByRow).sort(
                      (a, b) => parseInt(a) - parseInt(b)
                    );

                    return sortedRowNumbers.map((rowNum) => {
                      const rowSeats = seatsByRow[rowNum];
                      // Sort seats by column: A, B, C, D, E, F
                      const sortedSeats = rowSeats.sort((a, b) => {
                        const colA = a.seatNumber.match(/[A-Z]/)?.[0] || "A";
                        const colB = b.seatNumber.match(/[A-Z]/)?.[0] || "A";
                        return colA.localeCompare(colB);
                      });

                      return (
                        <div key={rowNum} className="mb-4">
                          {/* Row Number */}
                          <div className="flex items-center justify-center mb-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
                              {rowNum}
                            </div>
                          </div>

                          {/* Seat Row */}
                          <div className="flex items-center justify-center gap-2">
                            {/* Left Side: A B C */}
                            <div className="flex gap-2">
                              {["A", "B", "C"].map((col) => {
                                const seat = sortedSeats.find(
                                  (s) => s.seatNumber === `${rowNum}${col}`
                                );
                                return seat ? (
                                  <SeatButton
                                    key={seat.seatId}
                                    seat={seat}
                                    isSelected={
                                      selectedSeat?.seatNumber ===
                                      seat.seatNumber
                                    }
                                    isCurrent={currentSeat === seat.seatNumber}
                                    isHovered={hoveredSeat === seat.seatNumber}
                                    onClick={() => {
                                      console.log("🎯 Seat clicked:", {
                                        seatNumber: seat.seatNumber,
                                        seatType: seat.seatType,
                                        seatId: seat.seatId,
                                      });
                                      if (
                                        !seat.seatId &&
                                        currentSeat !== seat.seatNumber
                                      ) {
                                        console.error(
                                          "❌ Missing seatId for seat:",
                                          seat.seatNumber
                                        );
                                        toast.error(
                                          `Không thể chọn ghế ${seat.seatNumber} - thiếu thông tin ID ghế`
                                        );
                                        return;
                                      }
                                      handleSeatSelection(
                                        seat.seatNumber,
                                        seat.seatType,
                                        seat.seatId
                                      );
                                    }}
                                    onMouseEnter={() =>
                                      setHoveredSeat(seat.seatNumber)
                                    }
                                    onMouseLeave={() => setHoveredSeat(null)}
                                    getSeatPrice={getSeatPrice}
                                    getSeatDescription={getSeatDescription}
                                    getSeatClassName={getSeatClassName}
                                  />
                                ) : (
                                  <div
                                    key={`empty-${rowNum}-${col}`}
                                    className="w-14 h-14 rounded-xl border-2 border-gray-200 bg-gray-100 flex items-center justify-center text-gray-400 text-xs"
                                  >
                                    {rowNum}
                                    {col}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Aisle */}
                            <div className="w-8 h-14 bg-gradient-to-b from-gray-200 to-gray-300 rounded-lg flex items-center justify-center shadow-inner border-2 border-gray-300">
                              <span className="text-xs text-gray-600 font-medium transform -rotate-90 whitespace-nowrap">
                                AISLE
                              </span>
                            </div>

                            {/* Right Side: D E F */}
                            <div className="flex gap-2">
                              {["D", "E", "F"].map((col) => {
                                const seat = sortedSeats.find(
                                  (s) => s.seatNumber === `${rowNum}${col}`
                                );
                                return seat ? (
                                  <SeatButton
                                    key={seat.seatId}
                                    seat={seat}
                                    isSelected={
                                      selectedSeat?.seatNumber ===
                                      seat.seatNumber
                                    }
                                    isCurrent={currentSeat === seat.seatNumber}
                                    isHovered={hoveredSeat === seat.seatNumber}
                                    onClick={() => {
                                      console.log("🎯 Seat clicked:", {
                                        seatNumber: seat.seatNumber,
                                        seatType: seat.seatType,
                                        seatId: seat.seatId,
                                      });
                                      if (
                                        !seat.seatId &&
                                        currentSeat !== seat.seatNumber
                                      ) {
                                        console.error(
                                          "❌ Missing seatId for seat:",
                                          seat.seatNumber
                                        );
                                        toast.error(
                                          `Không thể chọn ghế ${seat.seatNumber} - thiếu thông tin ID ghế`
                                        );
                                        return;
                                      }
                                      handleSeatSelection(
                                        seat.seatNumber,
                                        seat.seatType,
                                        seat.seatId
                                      );
                                    }}
                                    onMouseEnter={() =>
                                      setHoveredSeat(seat.seatNumber)
                                    }
                                    onMouseLeave={() => setHoveredSeat(null)}
                                    getSeatPrice={getSeatPrice}
                                    getSeatDescription={getSeatDescription}
                                    getSeatClassName={getSeatClassName}
                                  />
                                ) : (
                                  <div
                                    key={`empty-${rowNum}-${col}`}
                                    className="w-14 h-14 rounded-xl border-2 border-gray-200 bg-gray-100 flex items-center justify-center text-gray-400 text-xs"
                                  >
                                    {rowNum}
                                    {col}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Rear Section */}
                  <div className="flex justify-center mt-6">
                    <div className="w-16 h-6 bg-gradient-to-b from-gray-300 to-gray-500 rounded-b-lg shadow-lg border-2 border-gray-400">
                      <div className="w-full h-full bg-gradient-to-r from-white/20 via-transparent to-white/20 rounded-b-lg"></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Selected Seat Info */}
      {selectedSeat && (
        <Card
          className={`border-blue-200 ${
            selectedSeat.seatNumber === currentSeat
              ? "bg-green-50"
              : "bg-blue-50"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle
                  className={`w-6 h-6 ${
                    selectedSeat.seatNumber === currentSeat
                      ? "text-green-600"
                      : "text-blue-600"
                  }`}
                />
                <div>
                  <p
                    className={`font-semibold ${
                      selectedSeat.seatNumber === currentSeat
                        ? "text-green-800"
                        : "text-blue-800"
                    }`}
                  >
                    {selectedSeat.seatNumber === currentSeat
                      ? "Giữ ghế hiện tại"
                      : "Chọn ghế mới"}
                    : {selectedSeat.seatNumber}
                  </p>
                  <p
                    className={`text-sm ${
                      selectedSeat.seatNumber === currentSeat
                        ? "text-green-700"
                        : "text-blue-700"
                    }`}
                  >
                    Loại ghế:{" "}
                    {getSeatTypeDescription(
                      selectedSeat.seatType || "STANDARD"
                    )}
                  </p>
                  {currentSeat && selectedSeat.seatNumber !== currentSeat && (
                    <div className="mt-2 p-2 bg-orange-100 rounded text-xs">
                      <p className="text-orange-800">
                        <strong>Thay đổi từ:</strong> {currentSeat} →{" "}
                        {selectedSeat.seatNumber}
                      </p>
                      {(() => {
                        const currentPrice = getSeatPrice(currentSeat);
                        const newPrice = getSeatPrice(selectedSeat.seatNumber);
                        const difference = newPrice - currentPrice;
                        return difference !== 0 ? (
                          <p
                            className={`mt-1 ${
                              difference > 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            <strong>Chênh lệch phí:</strong>{" "}
                            {difference > 0 ? "+" : ""}
                            {formatCurrencyVND(difference)}
                          </p>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-lg font-bold ${
                    selectedSeat.seatNumber === currentSeat
                      ? "text-green-800"
                      : "text-blue-800"
                  }`}
                >
                  {(() => {
                    const price = getSeatPrice(selectedSeat.seatNumber);
                    return price > 0
                      ? `+${formatCurrencyVND(price)}`
                      : "Miễn phí";
                  })()}
                </p>
                {(() => {
                  const price = getSeatPrice(selectedSeat.seatNumber);
                  return (
                    price > 0 && (
                      <p
                        className={`text-xs ${
                          selectedSeat.seatNumber === currentSeat
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      >
                        Phụ phí ghế
                      </p>
                    )
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}{" "}
      {/* Ancillary Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Dịch vụ bổ sung
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingServices ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Đang tải dịch vụ...</p>
            </div>
          ) : ancillaryServices.length > 0 ? (
            <div className="space-y-3">
              {ancillaryServices.map((service) => (
                <div
                  key={service.serviceId || service.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`service-${service.serviceId || service.id}`}
                      checked={
                        selectedServices[service.serviceId || service.id] ||
                        false
                      }
                      disabled={
                        preSelectedServices[service.serviceId || service.id] ||
                        false
                      }
                      onCheckedChange={(checked) =>
                        handleServiceSelection(
                          service.serviceId || service.id,
                          checked
                        )
                      }
                    />
                    {preSelectedServices[service.serviceId || service.id] && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Đã chọn
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getServiceTypeIcon(service.serviceType)}
                      </span>
                      <div>
                        <label
                          htmlFor={`service-${service.serviceId || service.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {service.serviceName || service.name}
                        </label>
                        <p className="text-sm text-gray-600">
                          {service.description}
                        </p>
                        {service.maxQuantity && (
                          <p className="text-xs text-blue-600">
                            Số lượng tối đa: {service.maxQuantity}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrencyVND(service.price || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              Không có dịch vụ bổ sung nào khả dụng
            </p>
          )}
        </CardContent>
      </Card>
      {/* Cost Summary */}
      {calculateFinalTotal() > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-orange-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Tổng phí phụ thêm
              </h4>

              {/* Seat change cost breakdown */}
              {seatChangeCalculation && (
                <div className="bg-white p-4 rounded-lg border">
                  <h5 className="font-medium mb-3 text-gray-800">
                    Chi tiết thay đổi ghế
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>
                        Ghế cũ ({seatChangeCalculation.oldSeatNumber}):
                      </span>
                      <span>
                        {formatCurrencyVND(
                          seatChangeCalculation.oldSeatPrice || 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Ghế mới ({seatChangeCalculation.newSeatNumber}):
                      </span>
                      <span>
                        {formatCurrencyVND(
                          seatChangeCalculation.newSeatPrice || 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Chênh lệch ghế:</span>
                      <span
                        className={
                          seatChangeCalculation.priceDifference >= 0
                            ? "text-orange-600"
                            : "text-green-600"
                        }
                      >
                        {seatChangeCalculation.priceDifference >= 0 ? "+" : ""}
                        {formatCurrencyVND(
                          seatChangeCalculation.priceDifference || 0
                        )}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-orange-600">
                      <span>Phí thay đổi ghế:</span>
                      <span>
                        {formatCurrencyVND(
                          seatChangeCalculation.priceDifference || 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional services cost breakdown */}
              {getSelectedServices().length > 0 && (
                <div className="bg-white p-4 rounded-lg border">
                  <h5 className="font-medium mb-3 text-gray-800">
                    Dịch vụ bổ sung đã chọn
                  </h5>
                  <div className="space-y-2 text-sm">
                    {getSelectedServices().map((service, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{service.name || service.serviceName}</span>
                        <span>+{formatCurrencyVND(service.price || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-4 p-4 bg-orange-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                  <div>
                    <p className="font-semibold text-orange-800">
                      Tổng phụ phí thêm
                    </p>
                    <p className="text-sm text-orange-700">
                      Bao gồm thay đổi ghế và dịch vụ bổ sung
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-orange-800">
                    {formatCurrencyVND(calculateFinalTotal())}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Lưu ý:</strong>{" "}
          {currentSeat
            ? `Bạn hiện đang có ghế ${currentSeat}. Việc chọn ghế mới có thể áp dụng phụ phí.`
            : "Việc chọn chỗ ngồi có thể áp dụng phụ phí."}{" "}
          Chỗ ngồi đã chọn sẽ được xác nhận sau khi hoàn tất check-in.
        </AlertDescription>
      </Alert>
      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Quay lại
        </Button>
        {calculateFinalTotal() > 0 ? (
          <Button
            onClick={handleProceedToPayment}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
            disabled={!selectedSeat && !currentSeat}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Tiếp tục thanh toán
          </Button>
        ) : (
          <Button
            onClick={handleConfirmCheckin}
            disabled={!selectedSeat}
            className="flex-1"
          >
            {selectedSeat ? "Xác nhận check-in" : "Vui lòng chọn ghế"}
          </Button>
        )}
      </div>
      {/* Seat Change Confirmation Dialog */}
      <Dialog
        open={showSeatChangeDialog}
        onOpenChange={setShowSeatChangeDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Xác nhận thay đổi ghế
            </DialogTitle>
            <DialogDescription>
              Bạn đang thay đổi từ ghế <strong>{currentSeat}</strong> sang ghế{" "}
              <strong>{pendingSeatSelection?.seatNumber}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ghế hiện tại:</span>
                  <span className="font-medium">{currentSeat}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ghế mới:</span>
                  <span className="font-medium">
                    {pendingSeatSelection?.seatNumber}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Loại ghế mới:</span>
                  <span className="font-medium">
                    {getSeatTypeDescription(
                      pendingSeatSelection?.seatType || "STANDARD"
                    )}
                  </span>
                </div>

                {/* Display calculation results */}
                {seatChangeCalculation && (
                  <div className="border-t pt-2 mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Giá ghế cũ:</span>
                      <span>
                        {formatCurrencyVND(
                          seatChangeCalculation.oldSeatPrice || 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Giá ghế mới:</span>
                      <span>
                        {formatCurrencyVND(
                          seatChangeCalculation.newSeatPrice || 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Chênh lệch ghế:</span>
                      <span
                        className={
                          seatChangeCalculation.priceDifference >= 0
                            ? "text-orange-600"
                            : "text-green-600"
                        }
                      >
                        {seatChangeCalculation.priceDifference >= 0 ? "+" : ""}
                        {formatCurrencyVND(
                          seatChangeCalculation.priceDifference || 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium text-orange-600 border-t pt-2">
                      <span>Phí thay đổi ghế:</span>
                      <span>
                        {seatChangeCalculation.priceDifference >= 0 ? "+" : ""}
                        {formatCurrencyVND(
                          seatChangeCalculation.priceDifference || 0
                        )}
                      </span>
                    </div>
                    {seatChangeCalculation.priceDifference > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Sau khi xác nhận, bạn có thể tiếp tục chọn thêm dịch vụ
                        trước khi thanh toán
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>{" "}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {seatChangeCalculation?.priceDifference > 0
                  ? "Xác nhận thay đổi ghế. Sau đó bạn có thể chọn thêm dịch vụ bổ sung trước khi thanh toán tổng cộng."
                  : "Thay đổi này miễn phí. Bạn có thể xác nhận và check-in ngay lập tức."}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelSeatChange}>
              Hủy bỏ
            </Button>
            <Button
              onClick={confirmSeatChange}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isCalculating}
            >
              {isCalculating
                ? "Đang tính toán..."
                : seatChangeCalculation?.priceDifference > 0
                ? "Xác nhận thay đổi ghế"
                : "Xác nhận và Check-in"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckInSeatSelection;
