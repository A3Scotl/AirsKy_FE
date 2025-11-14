import React, { useState, useEffect } from "react";
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
import { bookingApi } from "@/apis/booking-api";
import { formatCurrencyVND } from "@/utils/currency-utils";

const CheckInCompletion = ({
  booking,
  selectedSegment, // Thêm prop selectedSegment
  onNewCheckIn,
  onDownload,
  onEmail,
  onRefresh,
  isAlreadyCheckedIn = false,
  additionalCost = 0,
  selectedServices = [],
  selectedSeat = null,
  onPaymentSuccess,
  onBack,
  fromPaymentSuccess = false, // New prop to indicate if coming from payment success
}) => {
  const [emailSent, setEmailSent] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PAYPAL");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [autoCheckInAttempted, setAutoCheckInAttempted] = useState(false);

  // Track original total for revert functionality
  const [originalTotal, setOriginalTotal] = useState(null);
  const [hasTotalBeenUpdated, setHasTotalBeenUpdated] = useState(false);

  // Get passenger info
  const currentPassenger =
    booking.checkinEligiblePassengers?.[0] || booking.passengers?.[0];
  const checkinData = booking.checkinId ? booking : null;

  // Auto check-in when coming from payment success
  useEffect(() => {
    if (
      fromPaymentSuccess &&
      !autoCheckInAttempted &&
      !isAlreadyCheckedIn &&
      currentPassenger // Always allow auto check-in if passenger exists
    ) {

      performAutoCheckIn();
    }
  }, [
    fromPaymentSuccess,
    autoCheckInAttempted,
    selectedSeat,
    selectedServices,
    booking,
  ]);

  const performAutoCheckIn = async () => {
    if (autoCheckInAttempted) return;

    setAutoCheckInAttempted(true);

    try {
      // Validate payment status for the entire booking (not per segment)
      // For roundtrip bookings, if at least one segment is already checked-in,
      // we can assume payment was completed for the entire booking
      const hasCheckedInSegments = booking?.flightSegments?.some(
        (segment) => segment.checkinStatus === "COMPLETED"
      );

      const isBookingPaid =
        booking?.paymentStatus === "COMPLETED" ||
        booking?.status === "CONFIRMED" ||
        hasCheckedInSegments; // Roundtrip: if any segment checked-in, payment is valid

      if (!isBookingPaid) {
        console.warn(
          "⚠️ Booking payment not completed, skipping auto check-in"
        );
        toast.info("Vui lòng hoàn tất thanh toán trước khi check-in");
        return;
      }

      const selectedPassenger =
        booking.checkinEligiblePassengers?.[0] || booking.passengers?.[0];
      if (!selectedPassenger) {
        console.warn("⚠️ No passenger found for auto check-in");
        return;
      }

      // Resolve seat ID (optional for check-in)
      let newSeatId = null;
      if (selectedSeat?.seatId) {
        newSeatId = selectedSeat.seatId;
      } else if (selectedPassenger?.seatId) {
        newSeatId = selectedPassenger.seatId;
      } else {
        // Try to find seat from booking data
        const currentSeatNumber = selectedPassenger?.seatNumber;
        if (currentSeatNumber) {
          const seatDetails = booking.seatTypeDetails?.find(
            (detail) => detail.seatNumber === currentSeatNumber
          );
          newSeatId = seatDetails?.seatId;
        }
      }

      // Note: Seat selection is optional for check-in

      const checkinData = {
        bookingCode: booking.bookingCode,
        passengerId: selectedPassenger.passengerId,
        newSeatId: newSeatId,
        servicesToAdd: selectedServices.map((service) => ({
          serviceId: service.id || service.serviceId,
          quantity: service.quantity || 1,
        })),
      };

      const response = await bookingApi.processCheckin(checkinData);

      if (response.success && response.data) {

        toast.success("Check-in hoàn tất thành công!");

        // Small delay to ensure backend updates are processed
        setTimeout(() => {
          // Update booking data and auto-advance to next segment
          if (onRefresh) {
            onRefresh();
          }
        }, 1000);
      } else {
        console.warn("⚠️ Auto check-in failed:", response);
        toast.info("Vui lòng hoàn tất check-in thủ công");
      }
    } catch (error) {
      console.error("❌ Auto check-in error:", error);
      toast.info("Vui lòng hoàn tất check-in thủ công");
    }
  };

  // Track original total when component mounts (before any updates)
  useEffect(() => {
    if (booking?.totalAmount && !originalTotal) {

      setOriginalTotal(booking.totalAmount);
    }
  }, [booking?.totalAmount, originalTotal]);

  // Detect if total has been updated (when user comes to payment page with additional cost)
  useEffect(() => {
    if (additionalCost > 0 && !hasTotalBeenUpdated && originalTotal) {

      setHasTotalBeenUpdated(true);
    }
  }, [additionalCost, hasTotalBeenUpdated, originalTotal]);

  // Function to revert total amount if user goes back without payment
  const revertTotalAmount = async () => {
    if (!hasTotalBeenUpdated || !originalTotal || !booking?.id) {

      return;
    }

    try {

      const revertData = {
        totalAmount: originalTotal,
        reason: "User cancelled payment - reverting to original total",
      };

      const response = await bookingApi.updateBookingTotal(
        booking.id,
        revertData
      );

      if (response.success) {

        toast.success("Đã hoàn lại số tiền ban đầu");
        setHasTotalBeenUpdated(false);
      } else {
        console.error("❌ Failed to revert total amount:", response.message);
        toast.error("Có lỗi khi hoàn lại số tiền");
      }
    } catch (error) {
      console.error("❌ Error reverting total amount:", error);
      toast.error("Có lỗi khi hoàn lại số tiền");
    }
  };

  // Handle back button with total revert
  const handleBackWithRevert = async () => {

    // Revert total if it was updated
    await revertTotalAmount();

    // Call original onBack
    if (onBack) {
      onBack();
    }
  };

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

  const handleImageLoad = () => {
    setImageLoadError(false);
  };

  const handlePayment = async () => {
    if (additionalCost <= 0) {
      toast.error("Không có khoản phí nào cần thanh toán.");
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Step 2: Create payment with bookingId and paymentMethod
      // (Step 1 was already done in handleProceedToPayment - update booking total)
      const paymentData = {
        bookingId: booking.bookingId || booking.id,
        paymentMethod: paymentMethod,
      };

      const response = await paymentApi.createPayment(paymentData);

      if (response.success && response.data) {
        const checkoutUrl = response.data.checkoutUrl;

        if (paymentMethod === "PAYPAL") {
          if (checkoutUrl) {
            toast.success("Đang chuyển hướng đến PayPal để thanh toán...");

            // Store check-in payment info in localStorage for restoration after PayPal redirect
            const checkinPaymentInfo = {
              isCheckinPayment: true,
              bookingCode: booking.bookingCode,
              timestamp: Date.now(),
            };
            localStorage.setItem(
              "checkin_payment_info",
              JSON.stringify(checkinPaymentInfo)
            );
            localStorage.setItem(
              "checkin_payment_info_backup",
              JSON.stringify(checkinPaymentInfo)
            ); // backup for button

            // Redirect to PayPal
            window.location.href = checkoutUrl;
          } else {
            toast.error("Không thể tạo liên kết thanh toán PayPal");
          }
        } else if (paymentMethod === "BANK_TRANSFER") {
          if (checkoutUrl) {
            toast.success("Đang chuyển hướng đến trang thanh toán QR Code...");

            // Store check-in payment info in localStorage for restoration after QR payment
            const checkinPaymentInfo = {
              isCheckinPayment: true,
              bookingCode: booking.bookingCode,
              timestamp: Date.now(),
            };
            localStorage.setItem(
              "checkin_payment_info",
              JSON.stringify(checkinPaymentInfo)
            );
            localStorage.setItem(
              "checkin_payment_info_backup",
              JSON.stringify(checkinPaymentInfo)
            );

            // Redirect to QR payment page with check-in flag
            const qrUrl = `/qr-pay?checkoutUrl=${encodeURIComponent(
              checkoutUrl
            )}&bookingCode=${booking.bookingCode}&isCheckinPayment=true`;
            window.location.href = qrUrl;
          } else {
            toast.error("Không thể tạo liên kết thanh toán");
          }
        } else {
          toast.success("Thanh toán thành công!");

          // Step 3: After successful payment, trigger check-in process
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
  // Don't require payment if booking is already paid or has valid payment status
  const isBookingAlreadyPaid =
    booking.status === "CONFIRMED" ||
    booking.status === "PAID" ||
    booking.paymentStatus === "COMPLETED" ||
    booking.paymentStatus === "PAID";
  const isPaymentPage =
    needsPayment && !booking.checkinId && !isBookingAlreadyPaid;

  return (
    <div className="space-y-6">
      {/* Payment Header or Success Header */}
      {isPaymentPage ? (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-orange-600" />
              <h2 className="text-2xl font-bold mb-2 text-orange-800 dark:text-orange-200">
                Thanh toán bổ sung
              </h2>
              <p className="text-orange-700 dark:text-orange-300">
                Vui lòng hoàn tất thanh toán để tiếp tục check-in
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={`border-green-200 ${
            isAlreadyCheckedIn ? "bg-green-50 dark:bg-gray-900" : "bg-blue-50 dark:bg-gray-900"
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
                  isAlreadyCheckedIn
                    ? "text-green-800 dark:text-green-200"
                    : "text-blue-800 dark:text-blue-200"
                }`}
              >
                {isAlreadyCheckedIn
                  ? "Đã check-in thành công"
                  : "Check-in thành công!"}
              </h2>
              <p
                className={
                  isAlreadyCheckedIn
                    ? "text-green-700 dark:text-green-300"
                    : "text-blue-700 dark:text-blue-300"
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
      )}

      {/* Payment Section - Show if there's additional cost */}
      {needsPayment && (
        <Card className="border-orange-200 dark:bg-gray-900 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <CreditCard className="w-5 h-5" />
              Thanh toán dịch vụ bổ sung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Summary */}
            <div className="bg-white dark:bg-black p-4 rounded-lg border">
              <h4 className="font-semibold mb-3">Chi tiết thanh toán</h4>
              <div className="space-y-2">
                {/* Seat change cost breakdown from calculation */}
                {booking.seatChangeCalculation && selectedSeat && (
                  <>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        Ghế cũ ({booking.seatChangeCalculation.oldSeatNumber}):
                      </span>
                      <span>
                        {formatCurrencyVND(
                          booking.seatChangeCalculation.oldSeatPrice || 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        Ghế mới ({booking.seatChangeCalculation.newSeatNumber}):
                      </span>
                      <span>
                        {formatCurrencyVND(
                          booking.seatChangeCalculation.newSeatPrice || 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="dark:text-gray-200">
                        Phí thay đổi ghế:
                      </span>
                      <span
                        className={
                          booking.seatChangeCalculation.priceDifference >= 0
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-green-600 dark:text-green-400"
                        }
                      >
                        {booking.seatChangeCalculation.priceDifference >= 0
                          ? "+"
                          : ""}
                        {formatCurrencyVND(
                          booking.seatChangeCalculation.priceDifference || 0
                        )}
                      </span>
                    </div>
                    {booking.seatChangeCalculation.servicesCharge > 0 && (
                      <div className="flex justify-between">
                        <span className="dark:text-gray-200">
                          Phí dịch vụ bổ sung:
                        </span>
                        <span className="dark:text-gray-100">
                          +
                          {formatCurrencyVND(
                            booking.seatChangeCalculation.servicesCharge
                          )}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Fallback for seat change without calculation */}
                {!booking.seatChangeCalculation && selectedSeat && (
                  <div className="flex justify-between">
                    <span className="dark:text-gray-200">
                      Phí thay đổi ghế ({selectedSeat.seatNumber})
                    </span>
                    <span className="dark:text-gray-100">
                      {formatCurrencyVND(selectedSeat.additionalPrice || 0)}
                    </span>
                  </div>
                )}

                {/* Services */}
                {selectedServices.map((service, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="dark:text-gray-200">
                      {service.name || service.serviceName}
                    </span>
                    <span className="dark:text-gray-100">
                      +{formatCurrencyVND(service.price || 0)}
                    </span>
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
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
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
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
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

            {onBack && (
              <Button
                variant="outline"
                onClick={handleBackWithRevert}
                className="w-full"
              >
                ← Quay lại chọn ghế/dịch vụ
              </Button>
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
                  {selectedSegment?.flightNumber ||
                    booking.flightSegments?.[0]?.flightNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Chỗ ngồi</p>
                <p className="font-semibold text-blue-600">
                  {selectedSegment?.seatNumber ||
                    booking.checkinEligiblePassengers?.[0]?.seatNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cửa ra máy bay</p>
                <p className="font-semibold text-green-600">
                  {(() => {
                    const segment = selectedSegment
                      ? booking.flightSegments?.find(
                          (fs) => fs.segmentId === selectedSegment.segmentId
                        )
                      : booking.flightSegments?.[0];
                    return (
                      segment?.departureAirport?.gates?.[0]?.gateName ||
                      "Chưa có"
                    );
                  })()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Terminal</p>
                <p className="font-semibold">
                  {(() => {
                    const segment = selectedSegment
                      ? booking.flightSegments?.find(
                          (fs) => fs.segmentId === selectedSegment.segmentId
                        )
                      : booking.flightSegments?.[0];
                    return (
                      segment?.departureAirport?.gates?.[0]?.terminal || "N/A"
                    );
                  })()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boarding Pass - Only show if checked in successfully */}
      {!isPaymentPage && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-500" />
              Thẻ lên máy bay {isAlreadyCheckedIn ? "của bạn" : "điện tử"}
              {selectedSegment?.segmentOrder && (
                <Badge variant="outline" className="ml-2">
                  Chuyến {selectedSegment.segmentOrder === 1 ? "Đi" : "Về"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Display boarding pass image if available */}
            {(booking.boardingPassUrl ||
              booking?.checkinEligiblePassengers?.[0]?.boardingpassurl) &&
            !imageLoadError ? (
              <div className="space-y-4">
                <div className="w-full flex justify-center">
                  <img
                    src={
                      booking.boardingPassUrl ||
                      booking?.checkinEligiblePassengers?.[0]?.boardingpassurl
                    }
                    alt="Thẻ lên máy bay"
                    className="max-w-full h-auto rounded-lg shadow-md border"
                    style={{ maxHeight: "600px" }}
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                  />
                </div>
              </div>
            ) : (
              null
              // <div
              //   className={`bg-gradient-to-r ${
              //     isAlreadyCheckedIn
              //       ? "from-green-600 to-blue-600"
              //       : "from-blue-600 to-purple-600"
              //   } text-white p-6 rounded-lg`}
              // >
              //   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              //     <div className="space-y-4">
              //       <div>
              //         <p
              //           className={`${
              //             isAlreadyCheckedIn
              //               ? "text-green-100"
              //               : "text-blue-100"
              //           } text-sm`}
              //         >
              //           Mã đặt chỗ
              //         </p>
              //         <p className="text-xl font-bold">
              //           {booking.bookingCode || booking.code}
              //         </p>
              //       </div>

              //       <div>
              //         <p
              //           className={`${
              //             isAlreadyCheckedIn
              //               ? "text-green-100"
              //               : "text-blue-100"
              //           } text-sm`}
              //         >
              //           Hành khách
              //         </p>
              //         <p className="font-semibold">
              //           {currentPassenger?.fullName ||
              //             booking.passenger ||
              //             `${currentPassenger?.firstName} ${currentPassenger?.lastName}` ||
              //             "N/A"}
              //         </p>
              //       </div>

              //       <div>
              //         <p
              //           className={`${
              //             isAlreadyCheckedIn
              //               ? "text-green-100"
              //               : "text-blue-100"
              //           } text-sm`}
              //         >
              //           Chuyến bay
              //         </p>
              //         <p className="font-semibold">
              //           {booking.flightSegments?.[0]?.flightNumber ||
              //             booking.flight ||
              //             booking.flightNumber ||
              //             "N/A"}
              //         </p>
              //       </div>

              //       <div>
              //         <p
              //           className={`${
              //             isAlreadyCheckedIn
              //               ? "text-green-100"
              //               : "text-blue-100"
              //           } text-sm`}
              //         >
              //           Chỗ ngồi
              //         </p>
              //         <p className="font-semibold text-yellow-300">
              //           {booking.checkinEligiblePassengers?.[0]?.seatNumber ||
              //             booking.seat ||
              //             booking.seatNumber ||
              //             "N/A"}
              //         </p>
              //       </div>

              //       {booking.ticketPrice && (
              //         <div>
              //           <p
              //             className={`${
              //               isAlreadyCheckedIn
              //                 ? "text-green-100"
              //                 : "text-blue-100"
              //             } text-sm`}
              //           >
              //             Giá vé
              //           </p>
              //           <p className="font-semibold">
              //             {formatCurrencyVND(booking.ticketPrice)}
              //           </p>
              //         </div>
              //       )}

              //       {booking.checkinId && (
              //         <div>
              //           <p
              //             className={`${
              //               isAlreadyCheckedIn
              //                 ? "text-green-100"
              //                 : "text-blue-100"
              //             } text-sm`}
              //           >
              //             Mã check-in
              //           </p>
              //           <p className="font-semibold text-yellow-300">
              //             {booking.checkinId}
              //           </p>
              //         </div>
              //       )}
              //     </div>

              //     {/* QR Code Placeholder */}
              //     <div className="flex flex-col items-center justify-center">
              //       <div className="bg-white p-4 rounded-lg mb-4">
              //         <QrCode className="w-24 h-24 text-gray-800" />
              //       </div>
              //       <p className="text-sm text-blue-100 text-center">
              //         Quét mã QR tại sân bay
              //       </p>
              //     </div>
              //   </div>

              //   <div
              //     className={`mt-6 pt-4 border-t ${
              //       isAlreadyCheckedIn ? "border-green-400" : "border-blue-400"
              //     }`}
              //   >
              //     <div className="flex items-center justify-center gap-4 mb-4">
              //       <div className="text-center">
              //         <p
              //           className={`${
              //             isAlreadyCheckedIn
              //               ? "text-green-100"
              //               : "text-blue-100"
              //           } text-xs`}
              //         >
              //           Từ
              //         </p>
              //         <p className="text-2xl font-bold">
              //           {booking.flightSegments?.[0]?.departureAirport
              //             ?.airportName ||
              //             booking.from ||
              //             "N/A"}
              //           (
              //           {booking.flightSegments?.[0]?.departureAirport
              //             ?.airportCode || "N/A"}
              //           )
              //         </p>
              //       </div>
              //       <Plane className="w-6 h-6 text-blue-200" />
              //       <div className="text-center">
              //         <p
              //           className={`${
              //             isAlreadyCheckedIn
              //               ? "text-green-100"
              //               : "text-blue-100"
              //           } text-xs`}
              //         >
              //           Đến
              //         </p>
              //         <p className="text-2xl font-bold">
              //           {booking.flightSegments?.[0]?.arrivalAirport
              //             ?.airportName ||
              //             booking.to ||
              //             "N/A"}
              //           ({" "}
              //           {booking.flightSegments?.[0]?.arrivalAirport
              //             ?.airportCode || "N/A"}
              //           )
              //         </p>
              //       </div>
              //     </div>

              //     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              //       <div>
              //         <p
              //           className={`${
              //             isAlreadyCheckedIn
              //               ? "text-green-100"
              //               : "text-blue-100"
              //           }`}
              //         >
              //           Ngày bay
              //         </p>
              //         <p className="font-medium">{flightDateTime.date}</p>
              //       </div>
              //       <div>
              //         <p
              //           className={`${
              //             isAlreadyCheckedIn
              //               ? "text-green-100"
              //               : "text-blue-100"
              //           }`}
              //         >
              //           Giờ khởi hành
              //         </p>
              //         <p className="font-medium">{flightDateTime.time}</p>
              //       </div>
              //       <div>
              //         <p
              //           className={`${
              //             isAlreadyCheckedIn
              //               ? "text-green-100"
              //               : "text-blue-100"
              //           }`}
              //         >
              //           Cửa ra máy bay
              //         </p>
              //         <p className="font-medium">
              //           {booking.flightSegments?.[0]?.departureAirport
              //             ?.gates?.[0]?.gateName ||
              //             booking.gate ||
              //             "TBD"}
              //         </p>
              //       </div>
              //       <div>
              //         <p
              //           className={`${
              //             isAlreadyCheckedIn
              //               ? "text-green-100"
              //               : "text-blue-100"
              //           }`}
              //         >
              //           Trạng thái
              //         </p>
              //         <p className="font-medium text-green-300">Đã check-in</p>
              //       </div>
              //     </div>

              //     {booking.checkinId && (
              //       <div className="mt-4 text-center">
              //         <p
              //           className={`${
              //             isAlreadyCheckedIn
              //               ? "text-green-100"
              //               : "text-blue-100"
              //           } text-xs`}
              //         >
              //           Mã check-in
              //         </p>
              //         <p className="text-sm font-medium">{booking.checkinId}</p>
              //       </div>
              //     )}
              //   </div>
              // </div>
            )}
          </CardContent>
        </Card>
      )}

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
        {(booking.boardingPassUrl ||
          booking?.checkinEligiblePassengers?.[0]?.boardingpassurl) && (
          <Button
            onClick={() =>
              window.open(
                booking.boardingPassUrl ||
                  booking?.checkinEligiblePassengers?.[0]?.boardingpassurl,
                "_blank"
              )
            }
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

      {/* Footer Note */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
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
