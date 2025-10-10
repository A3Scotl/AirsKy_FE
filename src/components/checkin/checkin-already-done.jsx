import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const CheckInAlreadyDone = ({
  booking,
  onNewCheckIn,
  onDownload,
  onEmail,
  onRefresh,
}) => {
  const [emailSent, setEmailSent] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

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
    if (downloadStarted) return;
    setDownloadStarted(true);

    try {
      // Try to download from boarding pass URL if available
      if (booking.boardingPassUrl) {
        const link = document.createElement("a");
        link.href = booking.boardingPassUrl;
        link.download = `boarding-pass-${
          booking.bookingCode || booking.code
        }.png`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Đã tải xuống thẻ lên máy bay thành công!");
      } else if (onDownload) {
        await onDownload();
        toast.success("Thẻ lên máy bay đã được tải xuống thành công!");
      } else {
        toast.error("Không tìm thấy thẻ lên máy bay để tải xuống");
      }
    } catch (error) {
      console.error("Failed to download:", error);
      toast.error("Có lỗi xảy ra khi tải xuống. Vui lòng thử lại.");
    } finally {
      setTimeout(() => setDownloadStarted(false), 1000);
    }
  };

  const formatDateTime = (date, time) => {
    const dateTime = new Date(`${date}T${time}`);
    return {
      date: dateTime.toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: dateTime.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const flightDateTime = formatDateTime(booking.date, booking.time);
  const checkInDateTime = booking.checkInTime
    ? formatDateTime(
        booking.checkInTime.split("T")[0],
        booking.checkInTime.split("T")[1]
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Already Checked In Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Đã check-in thành công
            </h2>
            <p className="text-green-700">
              Bạn đã hoàn tất thủ tục check-in cho chuyến bay này vào{" "}
              {checkInDateTime
                ? checkInDateTime.date + " lúc " + checkInDateTime.time
                : "trước đó"}
              .
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Booking Status */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Boarding Pass */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-500" />
            Thẻ lên máy bay của bạn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Flight Info */}
              <div className="space-y-4">
                
              </div>

           
            </div>

           
          </div>
        </CardContent>
      </Card>

      {/* Important Reminders */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Lưu ý quan trọng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Giờ boarding:</strong> {booking.boardingTime} - Đến sân
              bay đúng giờ, không trễ!
            </AlertDescription>
          </Alert>

          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              <strong>Giấy tờ:</strong> Mang theo CMND/CCCD và thẻ lên máy bay.
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
              - Kiểm tra kỹ trước khi đi.
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

        <Button
          onClick={onRefresh}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </Button>
      </div>

      {emailSent && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Thẻ lên máy bay đã được gửi lại đến email của bạn!
          </AlertDescription>
        </Alert>
      )}

      {/* New Check-in Option */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-blue-800 mb-4">
              Bạn có muốn check-in cho một chuyến bay khác không?
            </p>
            <Button
              onClick={onNewCheckIn}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Check-in vé mới
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckInAlreadyDone;
