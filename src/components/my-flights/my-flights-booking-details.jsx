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
} from "lucide-react";
import { formatCurrencyVND } from "@/utils/currency-utils";
import { paymentApi } from "@/apis/payment-api";
import { toast } from "sonner";

const MyFlightsBookingDetails = ({ booking, onProceed, onBack }) => {
  const navigate = useNavigate();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  if (!booking) return null;

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

        // Handle PayPal payment
        if (paymentMethod === "PAYPAL" && payment.paypalApprovalUrl) {
          toast.success("Đang chuyển hướng đến PayPal để thanh toán...");
          // Redirect to PayPal for approval
          window.location.href = payment.paypalApprovalUrl;
        } else if (paymentMethod === "BANK_TRANSFER") {
          // For bank transfer and credit card, redirect to QR pay page
          toast.success("Đang chuyển hướng đến trang thanh toán QR...");
          // Navigate to QR pay page with state (same as payment-section.jsx)
          navigate("/qr-pay", {
            state: {
              approvalUrl: payment.qrCodeUrl || payment.paypalApprovalUrl,
              bookingCode: booking.bookingCode,
            },
          });
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
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Plane className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800">
                  Chi tiết đặt chỗ
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Mã đặt chỗ:{" "}
                  <span className="font-mono font-semibold">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Email đặt chỗ</p>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <p className="font-medium">{booking.userEmail}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Ngày đặt</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className="font-medium">
                  {formatDateTime(booking.createdAt).date}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Tổng tiền</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrencyVND(booking.totalAmount)}
              </p>
            </div>
          </div>

          {/* Deal Code */}
          {booking.appliedDealCode && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
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
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Hành khách
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {booking.passengers.map((passenger, index) => (
              <div
                key={passenger.passengerId}
                className="border rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold">
                    {passenger.lastName} {passenger.firstName}
                  </h4>
                  <Badge variant="outline">
                    {passenger.type === "ADULT" ? "Người lớn" : "Trẻ em"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Ngày sinh</p>
                    <p>
                      {new Date(passenger.dateOfBirth).toLocaleDateString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Giới tính</p>
                    <p>{passenger.gender === "MALE" ? "Nam" : "Nữ"}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Số hộ chiếu</p>
                    <p>{passenger.passportNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Chỗ ngồi</p>
                    <p className="font-medium text-blue-600">
                      {passenger.seatNumber || "Chưa chọn"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Hạng vé</p>
                    <p>{passenger.className}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p>{passenger.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flight Segments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-500" />
            Chuyến bay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {booking.flightSegments.map((segment, index) => {
              const departureDateTime = formatDateTime(segment.departureTime);
              const arrivalDateTime = formatDateTime(segment.arrivalTime);

              return (
                <div key={segment.segmentId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {segment.departureAirport.airportCode}
                        </p>
                        <p className="text-sm text-gray-600">Khởi hành</p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {segment.arrivalAirport.airportCode}
                        </p>
                        <p className="text-sm text-gray-600">Đến</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {segment.flightNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {segment.aircraft}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-gray-600">Ngày bay</p>
                        <p className="font-medium">{departureDateTime.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-gray-600">Giờ khởi hành</p>
                        <p className="font-medium">{departureDateTime.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-gray-600">Giờ đến</p>
                        <p className="font-medium">{arrivalDateTime.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-gray-600">Thời gian bay</p>
                        <p className="font-medium">{segment.duration}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Giá vé:</span>
                      <span className="font-medium">
                        {formatCurrencyVND(segment.price)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Baggage */}
      {booking.baggage && booking.baggage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Luggage className="w-5 h-5 text-blue-500" />
              Hành lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {booking.baggage.map((item) => (
                <div
                  key={item.baggageId}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      {item.purchasedPackage.replace("_", " ")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.type === "CHECK_IN"
                        ? "Hành lý ký gửi"
                        : "Hành lý xách tay"}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatCurrencyVND(item.packagePrice)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ancillary Services */}
      {booking.ancillaryServices && booking.ancillaryServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              Dịch vụ bổ sung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {booking.ancillaryServices.map((service) => (
                <div
                  key={service.bookingServiceId}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{service.serviceName}</p>
                    <p className="text-sm text-gray-600">
                      {service.serviceTypeDisplayName}
                      {service.passengerName && ` - ${service.passengerName}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrencyVND(service.totalPrice)}
                    </p>
                    <p className="text-sm text-gray-600">x{service.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Trạng thái thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPaid ? (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Đã thanh toán</p>
                <p className="text-sm text-green-700">
                  Mã giao dịch: {booking.payment.transactionId}
                </p>
                <p className="text-sm text-green-700">
                  Ngày thanh toán:{" "}
                  {formatDateTime(booking.payment.paymentDate).date}
                </p>
              </div>
            </div>
          ) : booking.status === "PENDING" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800">
                    Chưa thanh toán
                  </p>
                  {!isCancelled ? (
                    <p className="text-sm text-yellow-700">
                      Vui lòng hoàn tất thanh toán để có thể check-in
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Payment Options */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">
                  Chọn phương thức thanh toán:
                </h4>
                {paymentError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{paymentError}</p>
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
                <p className="text-xs text-gray-500 mt-2">
                  * Bạn sẽ được chuyển hướng đến cổng thanh toán an toàn
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-gray-400" />
              <div>
                <p className="font-semibold text-gray-800">Chưa thanh toán</p>
                {!isCancelled ? (
                  <p className="text-sm text-yellow-700">
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
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Tổng giá vé:</span>
              <span className="font-medium">
                {formatCurrencyVND(
                  booking.flightSegments.reduce(
                    (sum, seg) => sum + seg.price,
                    0
                  )
                )}
              </span>
            </div>
            {booking.baggage && booking.baggage.length > 0 && (
              <div className="flex justify-between">
                <span>Hành lý:</span>
                <span className="font-medium">
                  {formatCurrencyVND(
                    booking.baggage.reduce(
                      (sum, item) => sum + item.packagePrice,
                      0
                    )
                  )}
                </span>
              </div>
            )}
            {booking.ancillaryServicesAmount > 0 && (
              <div className="flex justify-between">
                <span>Dịch vụ bổ sung:</span>
                <span className="font-medium">
                  {formatCurrencyVND(booking.ancillaryServicesAmount)}
                </span>
              </div>
            )}
            {booking.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá:</span>
                <span className="font-medium">
                  -{formatCurrencyVND(booking.discountAmount)}
                </span>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Tổng cộng:</span>
                <span className="text-xl font-bold text-blue-600">
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
            <CardTitle className="flex items-center gap-2">
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
                className="h-auto p-4 flex flex-col items-center gap-2 border-2 border-blue-200 hover:border-blue-300"
              >
                {isProcessingPayment ? (
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <div className="text-2xl">🏦</div>
                    <div className="text-center">
                      <p className="font-semibold">Chuyển khoản</p>
                      <p className="text-sm text-gray-600">
                        QR Code thanh toán
                      </p>
                    </div>
                  </>
                )}
              </Button>
            </div>

            {paymentError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{paymentError}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyFlightsBookingDetails;
