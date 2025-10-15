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
  onSelectSeat,
  onConfirm,
  onBack,
  selectedSeat,
  onProceedToPayment,
  onProceedToFreeCheckIn,
}) => {
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

  // Get current passenger info
  const currentPassenger =
    booking.checkinEligiblePassengers?.[0] || booking.passengers?.[0];
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
      // Try to get flight and travel class info from different sources
      const finalFlightId =
        flightId || booking.flightSegments?.[0]?.id || booking.flightId;
      const finalTravelClassId =
        travelClassId ||
        currentPassenger?.travelClassId ||
        booking.flightSegments?.[0]?.classId;

      console.log("🛩️ Attempting to load seats with:", {
        finalFlightId,
        finalTravelClassId,
        booking,
        currentPassenger,
      });

      // Always try to call API first to get real seatId
      if (finalFlightId && finalTravelClassId) {
        setLoadingSeats(true);
        try {
          console.log(
            "�️ Loading seats from API for flight:",
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

            // Mark seats as available based on booking.availableSeats
            let processedSeats = response.data.map((seat) => ({
              ...seat,
              status:
                booking.availableSeats &&
                Array.isArray(booking.availableSeats) &&
                booking.availableSeats.includes(seat.seatNumber)
                  ? "AVAILABLE"
                  : seat.status || "OCCUPIED",
            }));

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

      // Fallback: use availableSeats from booking data if API failed
      if (booking.availableSeats && Array.isArray(booking.availableSeats)) {
        console.log(
          "� Using available seats from booking data as fallback:",
          booking.availableSeats
        );
        const fallbackSeats = booking.availableSeats.map(
          (seatNumber, index) => ({
            seatId: null, // No real seatId for fallback data
            seatNumber: seatNumber,
            className: booking.travelClass || "Economy",
            status: "AVAILABLE",
            seatType: getSeatTypeFromPosition(seatNumber),
            travelClassId: finalTravelClassId,
          })
        );
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

  // Get available seats (AVAILABLE status) - Keep ALL seats as they have different className and seatType
  // Always include current seat even if it's not AVAILABLE
  const availableSeats = seatsData.filter((seat) => {
    if (seat.status === "AVAILABLE") return true;
    if (currentSeat && seat.seatNumber === currentSeat) return true;
    return false;
  });

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

  // Handle seat selection with change confirmation
  const handleSeatSelection = async (seatNumber, seatType, seatId) => {
    // If selecting the same seat, do nothing
    if (selectedSeat && selectedSeat.seatNumber === seatNumber) {
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
      // No current seat or selecting the same seat - just select normally
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
    setIsCalculating(true);
    try {
      const currentPassenger =
        booking.checkinEligiblePassengers?.[0] || booking.passengers?.[0];

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
            {booking.flightSegments?.[0]?.flightNumber || booking.flight}
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
                {booking.flightSegments?.[0]?.flightNumber ||
                  booking.flightNumber}{" "}
                -{" "}
                {booking.flightSegments?.[0]?.departureAirport?.airportCode ||
                  booking.from}{" "}
                →{" "}
                {booking.flightSegments?.[0]?.arrivalAirport?.airportCode ||
                  booking.to}
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
            {booking.seatTypeDetails?.length > 0 && (
              <div>
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  Ghế Đã Chọn
                </h4>
                <div className="space-y-2">
                  {booking.seatTypeDetails.map((seatDetail, index) => (
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
                      {formatCurrencyVND(booking.seatTypeAmount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
          <div className="bg-gray-50 p-4 rounded-lg">
            {loadingSeats ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải thông tin ghế...</p>
              </div>
            ) : (
              <>
                <h4 className="text-sm font-medium mb-3">
                  Ghế có sẵn ({availableSeats.length} ghế)
                  {currentSeat && (
                    <span className="ml-2 text-green-600">
                      • Ghế hiện tại: {currentSeat}
                    </span>
                  )}
                </h4>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                  {availableSeats.map((seat, index) => {
                    const seatNumber = seat.seatNumber;
                    const seatClass = getSeatClass(seatNumber);
                    const seatPrice = getSeatPrice(seatNumber);
                    const seatDesc = getSeatDescription(seatNumber);
                    const isSelected = selectedSeat?.seatNumber === seatNumber;
                    const isCurrent = currentSeat === seatNumber;
                    // Create unique key using seatId or combination of properties
                    const uniqueKey =
                      seat.seatId ||
                      `${seatNumber}-${seat.className}-${seat.seatType}-${index}`;

                    return (
                      <button
                        key={uniqueKey}
                        className={`
                      relative p-2 rounded border-2 text-xs font-medium transition-all duration-200 min-h-[60px]
                      ${
                        isSelected
                          ? "bg-blue-600 border-blue-700 text-white shadow-lg scale-105"
                          : isCurrent
                          ? "bg-green-600 border-green-700 text-white shadow-lg ring-2 ring-green-300"
                          : hoveredSeat === seatNumber
                          ? "bg-yellow-400 border-yellow-500 text-gray-800 shadow-md"
                          : getSeatClassName(seatNumber) === "premium"
                          ? "bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100"
                          : getSeatClassName(seatNumber) === "business"
                          ? "bg-purple-50 border-purple-200 hover:border-purple-400 hover:bg-purple-100"
                          : getSeatClassName(seatNumber) === "accessible"
                          ? "bg-orange-50 border-orange-200 hover:border-orange-400 hover:bg-orange-100"
                          : "bg-green-50 border-green-200 hover:border-green-400 hover:bg-green-100"
                      }
                    `}
                        onClick={() => {
                          console.log("🎯 Seat clicked:", {
                            seatNumber,
                            seatType: seat.seatType,
                            seatId: seat.seatId,
                          });
                          if (!seat.seatId) {
                            console.error(
                              "❌ Missing seatId for seat:",
                              seatNumber
                            );
                            toast.error(
                              `Không thể chọn ghế ${seatNumber} - thiếu thông tin ID ghế`
                            );
                            return;
                          }
                          handleSeatSelection(
                            seatNumber,
                            seat.seatType,
                            seat.seatId
                          );
                        }}
                        onMouseEnter={() => setHoveredSeat(seatNumber)}
                        onMouseLeave={() => setHoveredSeat(null)}
                        title={`${seatNumber} - ${
                          seat.className
                        } - ${seatDesc} - ${
                          seatPrice > 0
                            ? `+${formatCurrencyVND(seatPrice)}`
                            : "Miễn phí"
                        }`}
                      >
                        <div className="font-bold">{seatNumber}</div>
                        <div className="text-[8px] leading-none">
                          {seat.className}
                        </div>
                        <div className="text-[8px] leading-none">
                          {seat.seatType}
                        </div>
                        {seatPrice > 0 && (
                          <div className="text-[10px] leading-none mt-1">
                            +{formatCurrencyVND(seatPrice)}
                          </div>
                        )}
                        {isCurrent && (
                          <div className="text-[10px] leading-none mt-1">
                            Hiện tại
                          </div>
                        )}
                      </button>
                    );
                  })}
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
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Tiếp tục thanh toán
          </Button>
        ) : (
          <Button
            onClick={handleConfirmCheckin}
            disabled={!currentSeat && !selectedSeat}
            className="flex-1"
          >
            {selectedSeat
              ? "Xác nhận check-in"
              : currentSeat
              ? "Giữ ghế hiện tại"
              : "Chọn ghế"}
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
