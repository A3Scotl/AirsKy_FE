import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Download,
  Mail,
  QrCode,
  Plane,
  User,
  Calendar,
  MapPin,
  Clock,
  Printer,
  Share2,
  RefreshCw,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { paymentApi } from "@/apis/payment-api";
import { formatCurrencyVND } from "@/utils/currency-utils";

const CheckInCompletion = ({
  booking,
  onNewCheckIn,
  onDownload,
  onEmail,
  onRefresh,
  isAlreadyCheckedIn = false,
  additionalCost = 0,
  selectedServices = [],
  selectedSeat = null,
  onPaymentSuccess,
}) => {
  const [emailSent, setEmailSent] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PAYPAL");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Get passenger info
  const currentPassenger =
    booking.checkinEligiblePassengers?.[0] || booking.passengers?.[0];
  const checkinData = booking.checkinId ? booking : null;

  const handleEmail = async () => {
    try {
      await onEmail();
      setEmailSent(true);
      toast.success("Thẻ lên máy bay đã được gửi đến email của bạn!");
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Có lỗi xảy ra khi gửi email. Vui lòng thử lại.");
    }
  };

  const handleDownload = async () => {
    try {
      setDownloadStarted(true);
      await onDownload();
      toast.success("Thẻ lên máy bay đã được tải xuống thành công!");
      setTimeout(() => setDownloadStarted(false), 3000);
    } catch (error) {
      console.error("Failed to download:", error);
      toast.error("Có lỗi xảy ra khi tải xuống. Vui lòng thử lại.");
      setDownloadStarted(false);
    }
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
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

  // Handle different date formats from API
  const getFlightDateTime = () => {
    if (booking.flightSegments?.[0]?.departureTime) {
      return formatDateTime(booking.flightSegments[0].departureTime);
    } else if (booking.departureTime) {
      return formatDateTime(booking.departureTime);
    } else if (booking.date && booking.time) {
      return formatDateTime(`${booking.date}T${booking.time}`);
    }
    return { date: "N/A", time: "N/A" };
  };

  const flightDateTime = getFlightDateTime();
  const checkInDateTime = booking.checkInTime
    ? formatDateTime(booking.checkInTime)
    : null;

  const handleImageError = () => {
    setImageLoadError(true);
    toast.error("Không thể tải ảnh thẻ lên máy bay. Vui lòng thử lại sau.");
  };

  const handlePayment = async () => {
    if (additionalCost <= 0) {
      toast.error("Không có khoản phí nào cần thanh toán.");
      return;
    }

    setIsProcessingPayment(true);
    try {
      const paymentData = {
        bookingId: booking.bookingId || booking.id,
        amount: additionalCost,
        paymentMethod: paymentMethod,
        description: `Thanh toán dịch vụ bổ sung cho booking ${booking.bookingCode}`,
        services: selectedServices,
        seatChange: selectedSeat
          ? {
              seatNumber: selectedSeat.seatNumber,
              seatType: selectedSeat.seatType,
              additionalPrice: selectedSeat.additionalPrice || 0,
            }
          : null,
      };

      const response = await paymentApi.createPayment(paymentData);

      if (response.success && response.data) {
        if (paymentMethod === "PAYPAL" && response.data.paypalApprovalUrl) {
          toast.success("Đang chuyển hướng đến PayPal để thanh toán...");
          // Redirect to PayPal
          window.location.href = response.data.paypalApprovalUrl;
        } else {
          toast.success("Thanh toán thành công!");
          if (onPaymentSuccess) {
            onPaymentSuccess(response.data);
          }
        }
      } else {
        toast.error(
          response.message || "Thanh toán thất bại. Vui lòng thử lại."
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const needsPayment = additionalCost > 0;

  return (
    <div className="space-y-6">
      {/* Success/Already Done Header */}
      <Card
        className={`border-green-200 ${
          isAlreadyCheckedIn ? "bg-green-50" : "bg-blue-50"
        }`}
      >
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle
              className={`w-16 h-16 mx-auto mb-4 ${
                isAlreadyCheckedIn ? "text-green-600" : "text-blue-600"
              }`}
            />
            <h2
              className={`text-2xl font-bold mb-2 ${
                isAlreadyCheckedIn ? "text-green-800" : "text-blue-800"
              }`}
            >
              {isAlreadyCheckedIn
                ? "Đã check-in thành công"
                : "Check-in thành công!"}
            </h2>
            <p
              className={
                isAlreadyCheckedIn ? "text-green-700" : "text-blue-700"
              }
            >
              {isAlreadyCheckedIn
                ? `Bạn đã hoàn tất thủ tục check-in cho chuyến bay này vào ${
                    checkInDateTime
                      ? checkInDateTime.date + " lúc " + checkInDateTime.time
                      : "trước đó"
                  }.`
                : "Chúc mừng! Bạn đã hoàn tất thủ tục check-in online. Vui lòng đến sân bay đúng giờ và mang theo thẻ lên máy bay."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Section - Show if there's additional cost */}
      {needsPayment && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <CreditCard className="w-5 h-5" />
              Thanh toán dịch vụ bổ sung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Summary */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-3">Chi tiết thanh toán</h4>
              <div className="space-y-2">
                {selectedSeat && (
                  <div className="flex justify-between">
                    <span>Phí thay đổi ghế ({selectedSeat.seatNumber})</span>
                    <span>
                      {formatCurrencyVND(selectedSeat.additionalPrice || 0)}
                    </span>
                  </div>
                )}
                {selectedServices.map((service, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{service.name}</span>
                    <span>{formatCurrencyVND(service.price || 0)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-orange-600">
                    {formatCurrencyVND(additionalCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Chọn phương thức thanh toán
              </Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="PAYPAL" id="paypal" />
                  <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">PayPal</span>
                      <span className="text-sm text-gray-500">
                        Thanh toán quốc tế
                      </span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="BANK_TRANSFER" id="bank" />
                  <Label htmlFor="bank" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        Chuyển khoản ngân hàng
                      </span>
                      <span className="text-sm text-gray-500">
                        Thanh toán trong nước
                      </span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Payment Info */}
            {paymentMethod === "PAYPAL" && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Bạn sẽ được chuyển hướng đến PayPal để hoàn tất thanh toán một
                  cách an toàn.
                </AlertDescription>
              </Alert>
            )}

            {paymentMethod === "BANK_TRANSFER" && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Vui lòng chuyển khoản theo thông tin sẽ được hiển thị sau khi
                  nhấn "Thanh toán".
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handlePayment}
              disabled={isProcessingPayment}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isProcessingPayment ? (
                "Đang xử lý..."
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Thanh toán {formatCurrencyVND(additionalCost)}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current Booking Status - Only for already checked in */}
      {isAlreadyCheckedIn && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-500" />
                <span>Thông tin chuyến bay</span>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Đã check-in
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Mã đặt chỗ</p>
                <p className="font-semibold text-lg">{booking.bookingCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hành khách</p>
                <p className="font-semibold">
                  {currentPassenger?.fullName ||
                    booking.passenger ||
                    `${currentPassenger?.firstName} ${currentPassenger?.lastName}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Chuyến bay</p>
                <p className="font-semibold">
                  {booking.flightSegments?.[0]?.flightNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Chỗ ngồi</p>
                <p className="font-semibold text-blue-600">
                  {booking.checkinEligiblePassengers?.[0]?.seatNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cửa ra máy bay</p>
                <p className="font-semibold text-green-600">
                  {booking.flightSegments?.[0]?.departureAirport?.gates?.[0]
                    ?.gateName || "Chưa có"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Terminal</p>
                <p className="font-semibold">
                  {booking.flightSegments?.[0]?.departureAirport?.gates?.[0]
                    ?.terminal || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boarding Pass */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-500" />
            Thẻ lên máy bay {isAlreadyCheckedIn ? "của bạn" : "điện tử"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Display boarding pass image if available */}
          {booking.boardingPassUrl && !imageLoadError ? (
            <div className="space-y-4">
              <div className="w-full flex justify-center">
                <img
                  src={booking.boardingPassUrl}
                  alt="Thẻ lên máy bay"
                  className="max-w-full h-auto rounded-lg shadow-md border"
                  style={{ maxHeight: "600px" }}
                  onError={handleImageError}
                  onLoad={() => setImageLoadError(false)}
                />
              </div>
            </div>
          ) : (
            <div
              className={`bg-gradient-to-r ${
                isAlreadyCheckedIn
                  ? "from-green-600 to-blue-600"
                  : "from-blue-600 to-purple-600"
              } text-white p-6 rounded-lg`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Flight Info */}
                <div className="space-y-4">
                  <div>
                    <p
                      className={`${
                        isAlreadyCheckedIn ? "text-green-100" : "text-blue-100"
                      } text-sm`}
                    >
                      Mã đặt chỗ
                    </p>
                    <p className="text-xl font-bold">
                      {booking.bookingCode || booking.code}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`${
                        isAlreadyCheckedIn ? "text-green-100" : "text-blue-100"
                      } text-sm`}
                    >
                      Hành khách
                    </p>
                    <p className="font-semibold">
                      {currentPassenger?.fullName ||
                        booking.passenger ||
                        `${currentPassenger?.firstName} ${currentPassenger?.lastName}` ||
                        "N/A"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`${
                        isAlreadyCheckedIn ? "text-green-100" : "text-blue-100"
                      } text-sm`}
                    >
                      Chuyến bay
                    </p>
                    <p className="font-semibold">
                      {booking.flightSegments?.[0]?.flightNumber ||
                        booking.flight ||
                        booking.flightNumber ||
                        "N/A"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`${
                        isAlreadyCheckedIn ? "text-green-100" : "text-blue-100"
                      } text-sm`}
                    >
                      Chỗ ngồi
                    </p>
                    <p className="font-semibold text-yellow-300">
                      {booking.checkinEligiblePassengers?.[0]?.seatNumber ||
                        booking.seat ||
                        booking.seatNumber ||
                        "N/A"}
                    </p>
                  </div>

                  {booking.ticketPrice && (
                    <div>
                      <p
                        className={`${
                          isAlreadyCheckedIn
                            ? "text-green-100"
                            : "text-blue-100"
                        } text-sm`}
                      >
                        Giá vé
                      </p>
                      <p className="font-semibold">
                        {formatCurrencyVND(booking.ticketPrice)}
                      </p>
                    </div>
                  )}

                  {booking.checkinId && (
                    <div>
                      <p
                        className={`${
                          isAlreadyCheckedIn
                            ? "text-green-100"
                            : "text-blue-100"
                        } text-sm`}
                      >
                        Mã check-in
                      </p>
                      <p className="font-semibold text-yellow-300">
                        {booking.checkinId}
                      </p>
                    </div>
                  )}
                </div>

                {/* QR Code Placeholder */}
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <QrCode className="w-24 h-24 text-gray-800" />
                  </div>
                  <p className="text-sm text-blue-100 text-center">
                    Quét mã QR tại sân bay
                  </p>
                </div>
              </div>

              {/* Flight Route */}
              <div
                className={`mt-6 pt-4 border-t ${
                  isAlreadyCheckedIn ? "border-green-400" : "border-blue-400"
                }`}
              >
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    <p
                      className={`${
                        isAlreadyCheckedIn ? "text-green-100" : "text-blue-100"
                      } text-xs`}
                    >
                      Từ
                    </p>
                    <p className="text-2xl font-bold">
                      {booking.flightSegments?.[0]?.departureAirport
                        ?.airportName ||
                        booking.from ||
                        "N/A"}
                      (
                      {booking.flightSegments?.[0]?.departureAirport
                        ?.airportCode || "N/A"}
                      )
                    </p>
                  </div>
                  <Plane className="w-6 h-6 text-blue-200" />
                  <div className="text-center">
                    <p
                      className={`${
                        isAlreadyCheckedIn ? "text-green-100" : "text-blue-100"
                      } text-xs`}
                    >
                      Đến
                    </p>
                    <p className="text-2xl font-bold">
                      {booking.flightSegments?.[0]?.arrivalAirport
                        ?.airportName ||
                        booking.to ||
                        "N/A"}
                      ({" "}
                      {booking.flightSegments?.[0]?.arrivalAirport
                        ?.airportCode || "N/A"}
                      )
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p
                      className={`${
                        isAlreadyCheckedIn ? "text-green-100" : "text-blue-100"
                      }`}
                    >
                      Ngày bay
                    </p>
                    <p className="font-medium">{flightDateTime.date}</p>
                  </div>
                  <div>
                    <p
                      className={`${
                        isAlreadyCheckedIn ? "text-green-100" : "text-blue-100"
                      }`}
                    >
                      Giờ khởi hành
                    </p>
                    <p className="font-medium">{flightDateTime.time}</p>
                  </div>
                  <div>
                    <p
                      className={`${
                        isAlreadyCheckedIn ? "text-green-100" : "text-blue-100"
                      }`}
                    >
                      Cửa ra máy bay
                    </p>
                    <p className="font-medium">
                      {booking.flightSegments?.[0]?.departureAirport?.gates?.[0]
                        ?.gateName ||
                        booking.gate ||
                        "TBD"}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`${
                        isAlreadyCheckedIn ? "text-green-100" : "text-blue-100"
                      }`}
                    >
                      Trạng thái
                    </p>
                    <p className="font-medium text-green-300">Đã check-in</p>
                  </div>
                </div>

                {booking.checkinId && (
                  <div className="mt-4 text-center">
                    <p
                      className={`${
                        isAlreadyCheckedIn ? "text-green-100" : "text-blue-100"
                      } text-xs`}
                    >
                      Mã check-in
                    </p>
                    <p className="text-sm font-medium">{booking.checkinId}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-orange-700">
            Thông tin quan trọng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Giờ boarding:</strong>{" "}
              {booking.boardingTime ||
                booking.flightSegments?.[0]?.boardingTime ||
                "Sẽ thông báo sau"}{" "}
              - Vui lòng có mặt tại cửa ra máy bay trước giờ khởi hành 15 phút.
            </AlertDescription>
          </Alert>

          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              <strong>Giấy tờ tùy thân:</strong> Mang theo CMND/CCCD/Hộ chiếu và
              thẻ lên máy bay đã tải về.
            </AlertDescription>
          </Alert>

          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              <strong>Hành lý:</strong>{" "}
              {booking.baggage &&
              Array.isArray(booking.baggage) &&
              booking.baggage.length > 0
                ? typeof booking.baggage[0] === "object"
                  ? `${booking.baggage[0].type || "Hành lý"} - ${
                      booking.baggage[0].purchasedPackage || "Gói cơ bản"
                    }`
                  : booking.baggage[0]
                : "Hành lý cơ bản"}{" "}
              - Kiểm tra kỹ hành lý xách tay theo quy định.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {booking.boardingPassUrl && (
          <Button
            onClick={() => window.open(booking.boardingPassUrl, "_blank")}
            className="flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Xem thẻ
          </Button>
        )}

        <Button
          onClick={handleDownload}
          disabled={downloadStarted}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {downloadStarted ? "Đang tải..." : "Tải xuống"}
        </Button>

        <Button
          onClick={handleEmail}
          variant="outline"
          disabled={emailSent}
          className="flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          {emailSent ? "Đã gửi!" : "Gửi email"}
        </Button>

        {isAlreadyCheckedIn && (
          <Button
            onClick={onRefresh}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </Button>
        )}
      </div>

      {emailSent && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Thẻ lên máy bay đã được gửi đến email của bạn!
          </AlertDescription>
        </Alert>
      )}

      {/* New Check-in Option */}
      <Card
        className={`border-blue-200 ${
          isAlreadyCheckedIn ? "bg-blue-50" : "bg-green-50"
        }`}
      >
        <CardContent className="pt-6">
          <div className="text-center">
            <p
              className={
                isAlreadyCheckedIn ? "text-blue-800" : "text-green-800"
              }
              mb-4
            >
              {isAlreadyCheckedIn
                ? "Bạn có muốn check-in cho một chuyến bay khác không?"
                : "Cảm ơn bạn đã hoàn tất check-in!"}
            </p>
            <Button
              onClick={onNewCheckIn}
              className={
                isAlreadyCheckedIn
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {isAlreadyCheckedIn ? "Check-in vé mới" : "Check-in thêm vé khác"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="text-center text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
        <p>
          Cảm ơn bạn đã chọn AirSky. Chúc bạn có một chuyến bay an toàn và thoải
          mái!
        </p>
        <p className="mt-2">
          Hotline hỗ trợ: 1900 XXX XXX | Website: www.airsky.vn
        </p>
      </div>
    </div>
  );
};

export default CheckInCompletion;
