import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import { formatCurrencyVND } from "@/utils/currency-utils";

const CheckInSeatSelection = ({
  booking,
  onSelectSeat,
  onConfirm,
  onBack,
  selectedSeat,
  onProceedToPayment,
}) => {
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [seatsData, setSeatsData] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [seatTypePricing, setSeatTypePricing] = useState({});
  const [ancillaryServices, setAncillaryServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});
  const [loadingServices, setLoadingServices] = useState(false);

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
        booking.flightSegments?.[0]?.travelClassId;

      console.log("🛩️ Attempting to load seats with:", {
        finalFlightId,
        finalTravelClassId,
        booking,
        currentPassenger,
      });

      // If we have available seats in booking data, use them as fallback
      if (booking.availableSeats && Array.isArray(booking.availableSeats)) {
        console.log(
          "📋 Using available seats from booking data:",
          booking.availableSeats
        );
        const fallbackSeats = booking.availableSeats.map(
          (seatNumber, index) => ({
            seatId: `fallback-${seatNumber}-${index}`,
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
              sampleSeat: seat,
            };
          }
        });
        setSeatTypePricing(pricing);
        return;
      }

      if (!finalFlightId || !finalTravelClassId) {
        console.warn("Missing required data for API call:", {
          finalFlightId,
          finalTravelClassId,
        });
        return;
      }

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
          console.log("✅ Seats loaded successfully from API:", response.data);
          setSeatsData(response.data);

          // Build seat type pricing from API data
          const pricing = {};
          response.data.forEach((seat) => {
            if (seat.seatType && !pricing[seat.seatType]) {
              pricing[seat.seatType] = {
                description: getSeatTypeDescription(seat.seatType),
                sampleSeat: seat,
              };
            }
          });
          setSeatTypePricing(pricing);
        } else {
          console.error("❌ Failed to load seats from API:", response.message);
          toast.error("Không thể tải thông tin ghế: " + response.message);
        }
      } catch (error) {
        console.error("❌ Error loading seats from API:", error);
        toast.error("Lỗi khi tải thông tin ghế");
      } finally {
        setLoadingSeats(false);
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
      booking.ancillaryServices.forEach((service) => {
        initialSelected[service.id] = true;
      });
      setSelectedServices(initialSelected);
    }
  }, [booking?.ancillaryServices, ancillaryServices]);

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
  const availableSeats = seatsData.filter(
    (seat) => seat.status === "AVAILABLE"
  );

  // Get seat data from API data
  const getSeatData = (seatNumber) => {
    return seatsData.find((seat) => seat.seatNumber === seatNumber);
  };

  // Handle service selection
  const handleServiceSelection = (serviceId, checked) => {
    setSelectedServices((prev) => ({
      ...prev,
      [serviceId]: checked,
    }));
  };

  // Calculate total additional costs
  const calculateTotalAdditionalCost = () => {
    let total = 0;

    // Add seat change cost if different from original
    if (selectedSeat && currentSeat && selectedSeat !== currentSeat) {
      const selectedSeatData = getSeatData(selectedSeat);
      if (selectedSeatData && seatTypePricing[selectedSeatData.seatType]) {
        total += seatTypePricing[selectedSeatData.seatType].price || 0;
      }
    }

    // Add selected services cost
    ancillaryServices.forEach((service) => {
      if (selectedServices[service.id]) {
        total += service.price || 0;
      }
    });

    return total;
  };

  // Get selected services list
  const getSelectedServices = () => {
    return ancillaryServices.filter((service) => selectedServices[service.id]);
  };

  const getSeatType = (seatNumber) => {
    const seatData = getSeatData(seatNumber);
    return seatData?.seatType || "STANDARD";
  };

  const getSeatPrice = (seatNumber) => {
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

  const selectedSeatPrice = selectedSeat
    ? getSeatPrice(selectedSeat.seatNumber)
    : 0;
  const selectedSeatDescription = selectedSeat
    ? getSeatDescription(selectedSeat.seatNumber)
    : "";

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
              <span className="text-sm">Ghế hiện tại</span>
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
                      : getSeatPrice(info.sampleSeat?.seatNumber) > 0
                      ? formatCurrencyVND(
                          getSeatPrice(info.sampleSeat?.seatNumber)
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
                          ? "bg-blue-600 border-blue-700 text-white"
                          : isCurrent
                          ? "bg-green-600 border-green-700 text-white"
                          : getSeatClassName(seatNumber) === "premium"
                          ? "bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100"
                          : getSeatClassName(seatNumber) === "business"
                          ? "bg-purple-50 border-purple-200 hover:border-purple-400 hover:bg-purple-100"
                          : getSeatClassName(seatNumber) === "accessible"
                          ? "bg-orange-50 border-orange-200 hover:border-orange-400 hover:bg-orange-100"
                          : "bg-green-50 border-green-200 hover:border-green-400 hover:bg-green-100"
                      }
                    `}
                        onClick={() => onSelectSeat(seatNumber, seat.seatType)}
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
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-800">
                    Chỗ ngồi đã chọn:{" "}
                    {typeof selectedSeat === "string"
                      ? selectedSeat
                      : selectedSeat?.seatNumber || "N/A"}
                  </p>
                  <p className="text-sm text-blue-700">
                    Loại ghế:{" "}
                    {typeof selectedSeat === "string"
                      ? getSeatTypeDescription(
                          getSeatTypeFromPosition(selectedSeat)
                        )
                      : getSeatTypeDescription(
                          selectedSeat?.seatType || "STANDARD"
                        )}
                  </p>
                  {currentSeat &&
                    (typeof selectedSeat === "string"
                      ? selectedSeat
                      : selectedSeat?.seatNumber) !== currentSeat && (
                      <p className="text-xs text-blue-600">
                        Thay đổi từ ghế {currentSeat}
                      </p>
                    )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-800">
                  {(() => {
                    const seatForPrice =
                      typeof selectedSeat === "string"
                        ? selectedSeat
                        : selectedSeat?.seatNumber;
                    const price = seatForPrice ? getSeatPrice(seatForPrice) : 0;
                    return price > 0
                      ? `+${formatCurrencyVND(price)}`
                      : "Miễn phí";
                  })()}
                </p>
                {(() => {
                  const seatForPrice =
                    typeof selectedSeat === "string"
                      ? selectedSeat
                      : selectedSeat?.seatNumber;
                  const price = seatForPrice ? getSeatPrice(seatForPrice) : 0;
                  return (
                    price > 0 && (
                      <p className="text-xs text-blue-600">Phụ phí</p>
                    )
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  key={service.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`service-${service.id}`}
                      checked={selectedServices[service.id] || false}
                      onCheckedChange={(checked) =>
                        handleServiceSelection(service.id, checked)
                      }
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getServiceTypeIcon(service.serviceType)}
                      </span>
                      <div>
                        <label
                          htmlFor={`service-${service.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {service.name}
                        </label>
                        <p className="text-sm text-gray-600">
                          {service.description}
                        </p>
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
      {calculateTotalAdditionalCost() > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
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
                  {formatCurrencyVND(calculateTotalAdditionalCost())}
                </p>
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
        {calculateTotalAdditionalCost() > 0 ? (
          <Button
            onClick={onProceedToPayment}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Tiếp tục thanh toán
          </Button>
        ) : (
          <Button
            onClick={onConfirm}
            disabled={!selectedSeat && !currentSeat}
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
    </div>
  );
};

export default CheckInSeatSelection;
