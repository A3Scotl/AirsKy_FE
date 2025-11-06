import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plane,
  User,
  Calendar,
  Clock,
  MapPin,
  Luggage,
  CreditCard,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Mail,
  Tag,
} from "lucide-react";
import { formatCurrencyVND } from "@/utils/currency-utils";
import {
  getPassengerMultiplier,
  calculateFlightPrice,
  calculateExtraServicePrice,
} from "@/utils/flight-booking-utils";
import { paymentApi } from "@/apis/payment-api";
import { toast } from "sonner";

const MyFlightsBookingDetails = ({ booking, onProceed, onBack }) => {
  const navigate = useNavigate();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Service type classifications based on backend logic
  const PER_SEGMENT_SERVICE_TYPES = [
    "MEAL",
    "SEAT",
    "PRIORITY_BOARDING",
    "WIFI",
    "EXTRA_LEGROOM",
    "INFANT_MEAL",
  ];

  const PER_BOOKING_SERVICE_TYPES = [
    "TRAVEL_INSURANCE",
    "LOUNGE_ACCESS",
    "ENTERTAINMENT",
    "PET_TRANSPORT",
    "SPECIAL_ASSISTANCE",
  ];

  if (!booking) return null;

  // Calculate segment count for pricing
  const segmentCount = booking.flightSegments?.length || 1;

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      case "REFUNDED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const parsePayPalError = (error) => {
    try {
      const errorData = JSON.parse(error.message || error);
      if (errorData.details && Array.isArray(errorData.details)) {
        return errorData.details
          .map((detail) => detail.issue || detail.description)
          .join(", ");
      }
      return (
        errorData.message ||
        errorData.error_description ||
        "Lỗi thanh toán PayPal"
      );
    } catch {
      return error.message || "Lỗi thanh toán PayPal";
    }
  };

  const handlePayment = async (paymentMethod) => {
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      // Format totalAmount to ensure it's a string with proper decimal places for PayPal
      const rawAmount = booking.totalAmount || booking.payment?.amount || 0;
      const formattedAmount =
        typeof rawAmount === "number"
          ? rawAmount.toFixed(2)
          : parseFloat(rawAmount).toFixed(2);

      const paymentData = {
        bookingId: booking.bookingId,
        paymentMethod: paymentMethod,
        totalAmount: formattedAmount + "", // Force string concatenation
      };

      const response = await paymentApi.createPayment(paymentData);

      if (response.success && response.data) {
        const payment = response.data;
        const checkoutUrl = payment.checkoutUrl;

        // Store payment info for redirect handling
        const paymentInfo = {
          isMyFlightsPayment: true,
          bookingCode: booking.bookingCode,
          bookingId: booking.bookingId,
        };
        localStorage.setItem(
          "my_flights_payment_info",
          JSON.stringify(paymentInfo)
        );
        localStorage.setItem(
          "my_flights_payment_info_backup",
          JSON.stringify(paymentInfo)
        );

        // Handle payment redirect based on method
        if (paymentMethod === "PAYPAL") {
          if (checkoutUrl) {
            toast.success("Đang chuyển hướng đến PayPal để thanh toán...");
            window.location.href = checkoutUrl;
          } else {
            toast.error("Không thể tạo liên kết thanh toán PayPal");
          }
        } else if (paymentMethod === "BANK_TRANSFER") {
          if (checkoutUrl) {
            toast.success("Đang chuyển hướng đến trang thanh toán QR...");
            navigate("/qr-pay", {
              state: {
                checkoutUrl: checkoutUrl,
                bookingCode: booking.bookingCode,
              },
            });
          } else {
            toast.error("Không thể tạo liên kết thanh toán");
          }
        }
      } else {
        const errorMessage = response.message || "Có lỗi xảy ra khi thanh toán";
        setPaymentError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage =
        paymentMethod === "PAYPAL"
          ? parsePayPalError(error)
          : "Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.";
      setPaymentError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const isPaid = booking.payment && booking.payment.status === "COMPLETED";
  const canProceedToPayment = !isPaid && booking.status === "CONFIRMED";
  const isCancelled = booking.status === "CANCELLED";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Booking Status */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Plane className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800 dark:text-gray-200">
                  Chi tiết đặt chỗ
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Mã đặt chỗ:{" "}
                  <span className="font-mono font-semibold dark:text-white">
                    {booking.bookingCode}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className={getStatusColor(booking.status)}
              >
                {booking.status}
              </Badge>
              {booking.payment && (
                <Badge
                  variant="outline"
                  className={getPaymentStatusColor(booking.payment.status)}
                >
                  {booking.payment.status === "COMPLETED"
                    ? "Đã thanh toán"
                    : "Chưa thanh toán"}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Email đặt chỗ
              </p>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <p className="font-medium dark:text-white">
                  {booking.contactEmail || booking.userEmail || "N/A"}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Ngày đặt
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <p className="font-medium dark:text-white">
                  {booking.createdAt || booking.bookingDate
                    ? formatDateTime(booking.createdAt || booking.bookingDate)
                        .date
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Số hành khách
              </p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <p className="font-medium text-blue-600 dark:text-blue-400">
                  {booking.passengers ? booking.passengers.length : 0} người
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Chi tiết giá vé
              </p>
              <div className="space-y-1">
                {(() => {
                  // Group passengers by type and calculate totals
                  const passengerGroups = {};
                  booking.checkinEligiblePassengers?.forEach((passenger) => {
                    if (!passengerGroups[passenger.type]) {
                      passengerGroups[passenger.type] = {
                        count: 0,
                        totalPrice: 0,
                        label:
                          passenger.type === "ADULT"
                            ? "Người lớn"
                            : passenger.type === "CHILD"
                            ? "Trẻ em"
                            : "Em bé",
                      };
                    }
                    passengerGroups[passenger.type].count += 1;
                    passengerGroups[passenger.type].totalPrice +=
                      passenger.ticketPrice || 0;
                  });

                  return Object.values(passengerGroups).map((group) => (
                    <div
                      key={group.label}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        {group.count} {group.label.toLowerCase()}
                      </span>
                      <span className="font-medium">
                        {formatCurrencyVND(group.totalPrice)}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Tổng tiền
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrencyVND(booking.totalAmount || 0)}
              </p>
            </div>
          </div>

          {/* Deal Code */}
          {booking.appliedDealCode && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Mã giảm giá: {booking.appliedDealCode}
                  {booking.discountPercentage && (
                    <span className="ml-2">
                      ({booking.discountPercentage}%)
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Passengers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <User className="w-5 h-5 text-blue-500" />
            Hành khách
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {booking.passengers && booking.passengers.length > 0 ? (
              booking.passengers.map((passenger, index) => (
                <div
                  key={passenger.passengerId || index}
                  className="border rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold dark:text-white">
                      {passenger.lastName || ""} {passenger.firstName || ""}
                    </h4>
                    <Badge
                      variant="outline"
                      className="dark:text-gray-300 dark:border-gray-600"
                    >
                      {passenger.type === "ADULT"
                        ? "Người lớn"
                        : passenger.type === "CHILD"
                        ? "Trẻ em"
                        : "Em bé"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Ngày sinh
                      </p>
                      <p className="dark:text-white">
                        {passenger.dateOfBirth
                          ? new Date(passenger.dateOfBirth).toLocaleDateString(
                              "vi-VN"
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Giới tính
                      </p>
                      <p className="dark:text-white">
                        {passenger.gender === "MALE" ? "Nam" : "Nữ"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Số hộ chiếu
                      </p>
                      <p className="dark:text-white">
                        {passenger.passportNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Chỗ ngồi
                      </p>
                      <p className="font-medium text-blue-600 dark:text-blue-400">
                        {(() => {
                          // Find seat assignments for this passenger
                          const seatAssignments =
                            passenger.seatAssignments || [];
                          if (seatAssignments.length > 0) {
                            return seatAssignments
                              .map(
                                (seat) =>
                                  `${seat.seatNumber} (${seat.flightNumber})`
                              )
                              .join(", ");
                          }

                          // Fallback to seatTypeDetails
                          const seatDetails =
                            booking.seatTypeDetails?.filter(
                              (seat) =>
                                seat.passengerName ===
                                `${passenger.firstName} ${passenger.lastName}`
                            ) || [];
                          if (seatDetails.length > 0) {
                            return seatDetails
                              .map(
                                (seat) =>
                                  `${seat.seatNumber} (${seat.flightNumber})`
                              )
                              .join(", ");
                          }

                          return "Chưa chọn";
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Hạng vé
                      </p>
                      <p className="dark:text-white">
                        {passenger.className || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Email</p>
                      <p className="dark:text-white">
                        {passenger.email || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>Không có thông tin hành khách</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flight Segments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Plane className="w-5 h-5 text-blue-500" />
            Chuyến bay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {booking.flightSegments && booking.flightSegments.length > 0 ? (
              booking.flightSegments.map((segment, index) => {
                const departureDateTime = formatDateTime(segment.departureTime);
                const arrivalDateTime = formatDateTime(segment.arrivalTime);

                return (
                  <div
                    key={segment.segmentId || index}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {segment.departureAirport?.airportCode || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Khởi hành
                          </p>
                        </div>
                        <ArrowRight className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {segment.arrivalAirport?.airportCode || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Đến
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold dark:text-white">
                          {segment.flightNumber || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {segment.aircraft || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Ngày bay
                          </p>
                          <p className="font-medium dark:text-white">
                            {departureDateTime.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Giờ khởi hành
                          </p>
                          <p className="font-medium dark:text-white">
                            {departureDateTime.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Giờ đến
                          </p>
                          <p className="font-medium dark:text-white">
                            {arrivalDateTime.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Thời gian bay
                          </p>
                          <p className="font-medium dark:text-white">
                            {segment.duration || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Giá vé:
                        </span>
                        <span className="font-medium dark:text-white">
                          {formatCurrencyVND(segment.price || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Plane className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>Không có thông tin chuyến bay</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seat Assignments */}
      {booking.seatAssignments && booking.seatAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <span>💺</span>
              Ghế ngồi đã chọn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {booking.seatAssignments.map((seat, index) => {
                const passenger = booking.passengers?.find(
                  (p) => p.passengerId === seat.passengerId
                );
                const segment = booking.flightSegments?.find(
                  (s) => s.segmentId === seat.flightSegmentId
                );

                return (
                  <div
                    key={seat.seatAssignmentId}
                    className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold dark:text-white">
                          Ghế {seat.seatNumber}
                          {seat.seatTypeDescription && (
                            <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                              {seat.seatTypeDescription}
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Hành khách:{" "}
                          {passenger
                            ? `${passenger.firstName} ${passenger.lastName}`
                            : "Không xác định"}
                        </p>
                        {segment && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Chuyến bay: {segment.departureAirport?.airportCode}{" "}
                            → {segment.arrivalAirport?.airportCode}
                          </p>
                        )}
                      </div>
                      {seat.additionalPrice > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Phụ phí
                          </p>
                          <p className="font-semibold text-orange-600 dark:text-orange-400">
                            +{formatCurrencyVND(seat.additionalPrice)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Baggage */}
      {booking.baggage && booking.baggage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Luggage className="w-5 h-5 text-blue-500" />
              Hành lý ({booking.baggage.length} gói)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {booking.baggage.map((item, index) => {
                // Tìm hành khách tương ứng với hành lý này (nếu có thông tin)
                const passenger = booking.passengers?.find((p) => {
                  // Logic để match hành lý với hành khách - có thể cần adjust tùy theo API
                  return booking.passengers.length === booking.baggage.length
                    ? booking.passengers.indexOf(p) === index
                    : true;
                });

                const packageName =
                  item.purchasedPackage.replace("KG_", "").replace("_", " ") +
                  " kg";

                return (
                  <div key={item.baggageId} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{packageName}</p>
                          <Badge variant="outline" className="text-xs">
                            {item.type === "CHECK_IN"
                              ? "Hành lý ký gửi"
                              : "Hành lý xách tay"}
                          </Badge>
                        </div>
                        {(() => {
                          // Find passenger by passengerId
                          const passenger = booking.passengers?.find(
                            (p) => p.passengerId === item.passengerId
                          );
                          return passenger ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Hành khách: {passenger.firstName}{" "}
                              {passenger.lastName}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Hành khách: {item.passengerName || "N/A"}
                            </p>
                          );
                        })()}
                        {item.actualWeight && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Trọng lượng thực: {item.actualWeight} kg
                          </p>
                        )}
                        {item.excessWeight > 0 && (
                          <p className="text-sm text-orange-600 dark:text-orange-400">
                            Vượt cước: {item.excessWeight} kg
                            {item.excessFee &&
                              ` - Phí: ${formatCurrencyVND(item.excessFee)}`}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-blue-600 dark:text-blue-400">
                          {formatCurrencyVND(item.packagePrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ancillary Services */}
      {booking.ancillaryServices && booking.ancillaryServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <DollarSign className="w-5 h-5 text-blue-500" />
              Dịch vụ bổ sung ({booking.ancillaryServices.length} dịch vụ)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {booking.ancillaryServices.map((service) => (
                <div
                  key={service.bookingServiceId}
                  className="border rounded-lg p-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{service.serviceName}</p>
                        <Badge variant="outline" className="text-xs">
                          {service.serviceTypeDisplayName}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {service.passengerName ? (
                          <p>👤 Hành khách: {service.passengerName}</p>
                        ) : (
                          <p>📋 Áp dụng cho toàn booking</p>
                        )}
                        <p>📦 Số lượng: {service.quantity}</p>
                        <p>
                          💰 Đơn giá: {formatCurrencyVND(service.unitPrice)}
                        </p>
                        {service.notes && <p>📝 Ghi chú: {service.notes}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600 dark:text-blue-400">
                        {formatCurrencyVND(
                          PER_SEGMENT_SERVICE_TYPES.includes(
                            service.serviceType
                          )
                            ? service.totalPrice * segmentCount
                            : service.totalPrice
                        )}
                      </p>
                      {PER_SEGMENT_SERVICE_TYPES.includes(
                        service.serviceType
                      ) &&
                        segmentCount > 1 && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            ({formatCurrencyVND(service.totalPrice)} ×{" "}
                            {segmentCount} chặng)
                          </p>
                        )}
                      {service.quantity > 1 && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          ({service.quantity} ×{" "}
                          {formatCurrencyVND(service.unitPrice)})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Tổng cộng dịch vụ bổ sung */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium dark:text-white">
                    Tổng dịch vụ bổ sung:
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrencyVND(
                      booking.ancillaryServicesAmount ||
                        booking.ancillaryServices.reduce((sum, service) => {
                          const servicePrice =
                            PER_SEGMENT_SERVICE_TYPES.includes(
                              service.serviceType
                            )
                              ? service.totalPrice * segmentCount
                              : service.totalPrice;
                          return sum + servicePrice;
                        }, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Trạng thái thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPaid ? (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Đã thanh toán
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Mã giao dịch: {booking.payment.transactionId}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Ngày thanh toán:{" "}
                  {formatDateTime(booking.payment.paymentDate).date}
                </p>
              </div>
            </div>
          ) : booking.status === "PENDING" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Chưa thanh toán
                  </p>
                  {!isCancelled ? (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Vui lòng hoàn tất thanh toán để có thể check-in
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Payment Options */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium dark:text-white mb-3">
                  Chọn phương thức thanh toán:
                </h4>
                {paymentError && (
                  <div className="mb-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {paymentError}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={() => handlePayment("PAYPAL")}
                    disabled={isProcessingPayment}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <CreditCard className="w-4 h-4" />
                    {isProcessingPayment
                      ? "Đang xử lý..."
                      : "Thanh toán bằng PayPal"}
                  </Button>
                  <Button
                    onClick={() => handlePayment("BANK_TRANSFER")}
                    disabled={isProcessingPayment}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    {isProcessingPayment
                      ? "Đang xử lý..."
                      : "Thanh toán bằng thẻ tín dụng"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  * Bạn sẽ được chuyển hướng đến cổng thanh toán an toàn
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  Chưa thanh toán
                </p>
                {!isCancelled ? (
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Vui lòng hoàn tất thanh toán để có thể check-in
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-in Reminder */}
      {isPaid &&
        booking.flightSegments &&
        booking.flightSegments.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-green-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-800 mb-2">
                    Nhắc nhở Check-in
                  </h4>
                  <div className="space-y-2 text-sm text-green-700">
                    <p>
                      <strong>Thời gian check-in:</strong> Từ 24 giờ đến 1 giờ
                      trước giờ khởi hành
                    </p>
                    <p>
                      <strong>Chuyến bay đầu tiên:</strong>{" "}
                      {
                        formatDateTime(booking.flightSegments[0].departureTime)
                          .date
                      }{" "}
                      lúc{" "}
                      {
                        formatDateTime(booking.flightSegments[0].departureTime)
                          .time
                      }
                    </p>
                    <p className="text-xs">
                      * Vui lòng check-in đúng thời gian để đảm bảo chỗ ngồi và
                      tránh phí phát sinh
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Price Summary */}
      <Card className="border-blue-200 bg-blue-50 bg-gray-900">
        <CardHeader>
          <CardTitle className="text-lg">📊 Chi tiết giá</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Giá vé chi tiết */}
            <div className="space-y-2">
              <div className="flex justify-between font-medium">
                <span>
                  ✈️ Vé máy bay (
                  {booking.passengers ? booking.passengers.length : 0} người):
                </span>
                <span>
                  {(() => {
                    // Calculate total flight price for all passengers
                    const baseAdultPrice =
                      booking.flightSegments &&
                      booking.flightSegments.length > 0
                        ? booking.flightSegments.reduce(
                            (sum, seg) => sum + (seg.price || 0),
                            0
                          )
                        : 0;

                    let totalFlightPrice = 0;
                    booking.passengers?.forEach((passenger) => {
                      const multiplier = getPassengerMultiplier(passenger.type);
                      totalFlightPrice += baseAdultPrice * multiplier;
                    });

                    return formatCurrencyVND(totalFlightPrice);
                  })()}
                </span>
              </div>

              {/* Chi tiết theo loại hành khách */}
              {(() => {
                // Base price is for ADULT (total flight price for all segments)
                const baseAdultPrice =
                  booking.flightSegments && booking.flightSegments.length > 0
                    ? booking.flightSegments.reduce(
                        (sum, seg) => sum + (seg.price || 0),
                        0
                      )
                    : 0;

                // Group passengers by type
                const passengerGroups = {};
                booking.passengers?.forEach((passenger) => {
                  if (!passengerGroups[passenger.type]) {
                    passengerGroups[passenger.type] = {
                      count: 0,
                      label:
                        passenger.type === "ADULT"
                          ? "Người lớn"
                          : passenger.type === "CHILD"
                          ? "Trẻ em"
                          : "Em bé",
                    };
                  }
                  passengerGroups[passenger.type].count += 1;
                });

                return Object.values(passengerGroups).map((group) => {
                  const multiplier = getPassengerMultiplier(
                    group.label === "Người lớn"
                      ? "ADULT"
                      : group.label === "Trẻ em"
                      ? "CHILD"
                      : "INFANT"
                  );
                  const totalForType = baseAdultPrice * multiplier;

                  return (
                    <div
                      key={group.label}
                      className="ml-4 flex justify-between text-sm text-gray-600"
                    >
                      <span>
                        • {group.count} {group.label.toLowerCase()}
                      </span>
                      <span>{formatCurrencyVND(totalForType)}</span>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Phụ phí ghế ngồi */}
            {booking.seatTypeAmount > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>💺 Phụ phí ghế ngồi:</span>
                  <span className="font-medium">
                    {formatCurrencyVND(booking.seatTypeAmount)}
                  </span>
                </div>
                {booking.seatTypeDetails &&
                  booking.seatTypeDetails.length > 0 && (
                    <div className="ml-4 space-y-1 text-sm text-gray-600">
                      {booking.seatTypeDetails.map((seat, index) => (
                        <div key={index} className="flex justify-between">
                          <span>
                            • {seat.passengerName} - {seat.seatNumber} (
                            {seat.seatTypeDescription})
                          </span>
                          <span>
                            {formatCurrencyVND(seat.additionalPrice || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {/* Hành lý */}
            {booking.baggage && booking.baggage.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>🧳 Hành lý ({booking.baggage.length} gói):</span>
                  <span className="font-medium">
                    {formatCurrencyVND(
                      booking.baggage.reduce(
                        (sum, item) => sum + (item.packagePrice || 0),
                        0
                      ) * segmentCount
                    )}
                  </span>
                </div>
                <div className="ml-4 space-y-1 text-sm text-gray-600">
                  {booking.baggage.map((item, index) => {
                    const passenger = booking.passengers?.find((p) => {
                      return booking.passengers.length ===
                        booking.baggage.length
                        ? booking.passengers.indexOf(p) === index
                        : true;
                    });
                    const packageName =
                      item.purchasedPackage
                        .replace("KG_", "")
                        .replace("_", " ") + " kg";

                    return (
                      <div
                        key={item.baggageId}
                        className="flex justify-between"
                      >
                        <span>
                          • {packageName}
                          {passenger &&
                            ` - ${passenger.firstName} ${passenger.lastName}`}
                        </span>
                        <span>
                          {formatCurrencyVND(item.packagePrice * segmentCount)}
                          {segmentCount > 1 && (
                            <span className="text-xs ml-1">
                              ({formatCurrencyVND(item.packagePrice)} ×{" "}
                              {segmentCount})
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dịch vụ bổ sung */}
            {booking.ancillaryServicesAmount > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>🛎️ Dịch vụ bổ sung:</span>
                  <span className="font-medium">
                    {formatCurrencyVND(booking.ancillaryServicesAmount)}
                  </span>
                </div>
                {booking.ancillaryServices &&
                  booking.ancillaryServices.length > 0 && (
                    <div className="ml-4 space-y-1 text-sm text-gray-600">
                      {booking.ancillaryServices.map((service) => (
                        <div
                          key={service.bookingServiceId}
                          className="flex justify-between"
                        >
                          <span>
                            • {service.serviceName}
                            {service.passengerName &&
                              ` - ${service.passengerName}`}
                            {service.quantity > 1 && ` (×${service.quantity})`}
                          </span>
                          <span>{formatCurrencyVND(service.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {/* Giảm giá */}
            {booking.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>🎫 Giảm giá:</span>
                <span className="font-medium">
                  -{formatCurrencyVND(booking.discountAmount)}
                </span>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg dark:text-white">
                  💰 Tổng cộng:
                </span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrencyVND(booking.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      {canProceedToPayment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <CreditCard className="w-5 h-5 text-blue-500" />
              Chọn phương thức thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PayPal Payment */}
              <Button
                onClick={() => handlePayment("PAYPAL")}
                disabled={isProcessingPayment}
                className="h-auto p-4 flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isProcessingPayment ? (
                  <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <div className="text-2xl">🅿️</div>
                    <div className="text-center">
                      <p className="font-semibold">PayPal</p>
                      <p className="text-sm opacity-90">
                        Thanh toán qua PayPal
                      </p>
                    </div>
                  </>
                )}
              </Button>

              {/* Bank Transfer Payment */}
              <Button
                onClick={() => handlePayment("BANK_TRANSFER")}
                disabled={isProcessingPayment}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 border-2 border-blue-200 hover:border-blue-300 dark:border-blue-700 dark:hover:border-blue-600"
              >
                {isProcessingPayment ? (
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <div className="text-2xl">🏦</div>
                    <div className="text-center">
                      <p className="font-semibold dark:text-white">
                        Chuyển khoản
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        QR Code thanh toán
                      </p>
                    </div>
                  </>
                )}
              </Button>
            </div>

            {paymentError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  {paymentError}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyFlightsBookingDetails;
