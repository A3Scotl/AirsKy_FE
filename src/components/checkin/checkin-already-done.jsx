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

const CheckInAlreadyDone = ({
  booking,
  onNewCheckIn,
  onDownload,
  onEmail,
  onRefresh,
}) => {
  const [emailSent, setEmailSent] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  const handleEmail = async () => {
    try {
      await onEmail();
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloadStarted(true);
      await onDownload();
      setTimeout(() => setDownloadStarted(false), 3000);
    } catch (error) {
      console.error("Failed to download:", error);
      setDownloadStarted(false);
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
              <p className="font-semibold text-lg">{booking.code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hành khách</p>
              <p className="font-semibold">{booking.passenger}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Chuyến bay</p>
              <p className="font-semibold">{booking.flight}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Chỗ ngồi</p>
              <p className="font-semibold text-blue-600">{booking.seat}</p>
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
                <div>
                  <p className="text-green-100 text-sm">Mã đặt chỗ</p>
                  <p className="text-xl font-bold">{booking.code}</p>
                </div>

                <div>
                  <p className="text-green-100 text-sm">Hành khách</p>
                  <p className="font-semibold">{booking.passenger}</p>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-green-100 text-sm">Từ</p>
                    <p className="text-2xl font-bold">{booking.from}</p>
                  </div>
                  <Plane className="w-6 h-6" />
                  <div>
                    <p className="text-green-100 text-sm">Đến</p>
                    <p className="text-2xl font-bold">{booking.to}</p>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-white p-4 rounded-lg mb-4">
                  <QrCode className="w-24 h-24 text-gray-800" />
                </div>
                <p className="text-sm text-green-100 text-center">
                  Mã QR đã kích hoạt
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-4 border-t border-green-400">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-green-100">Ngày bay</p>
                  <p className="font-medium">{flightDateTime.date}</p>
                </div>
                <div>
                  <p className="text-green-100">Giờ khởi hành</p>
                  <p className="font-medium">{flightDateTime.time}</p>
                </div>
                <div>
                  <p className="text-green-100">Cửa ra máy bay</p>
                  <p className="font-medium">{booking.gate}</p>
                </div>
                <div>
                  <p className="text-green-100">Chỗ ngồi</p>
                  <p className="font-medium text-yellow-300">{booking.seat}</p>
                </div>
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
              <strong>Hành lý:</strong> {booking.baggage} - Kiểm tra kỹ trước
              khi đi.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={handleDownload}
          disabled={downloadStarted}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {downloadStarted ? "Đang tải..." : "Tải lại thẻ"}
        </Button>

        <Button
          onClick={handleEmail}
          variant="outline"
          disabled={emailSent}
          className="flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          {emailSent ? "Đã gửi!" : "Gửi lại email"}
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
