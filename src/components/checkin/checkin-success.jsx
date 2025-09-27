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
  Printer,
  Share2,
} from "lucide-react";

const CheckInSuccess = ({ booking, onNewCheckIn, onDownload, onEmail }) => {
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

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Check-in thành công!
            </h2>
            <p className="text-green-700">
              Chúc mừng! Bạn đã hoàn tất thủ tục check-in online. Vui lòng đến
              sân bay đúng giờ và mang theo thẻ lên máy bay.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Boarding Pass */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-500" />
            Thẻ lên máy bay điện tử
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Flight Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-blue-100 text-sm">Mã đặt chỗ</p>
                  <p className="text-xl font-bold">{booking.code}</p>
                </div>

                <div>
                  <p className="text-blue-100 text-sm">Hành khách</p>
                  <p className="font-semibold">{booking.passenger}</p>
                </div>

                <div>
                  <p className="text-blue-100 text-sm">Chuyến bay</p>
                  <p className="font-semibold">{booking.flight}</p>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-blue-100 text-sm">Từ</p>
                    <p className="text-2xl font-bold">{booking.from}</p>
                  </div>
                  <Plane className="w-6 h-6" />
                  <div>
                    <p className="text-blue-100 text-sm">Đến</p>
                    <p className="text-2xl font-bold">{booking.to}</p>
                  </div>
                </div>
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

            {/* Additional Info */}
            <div className="mt-6 pt-4 border-t border-blue-400">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-blue-100">Ngày bay</p>
                  <p className="font-medium">{flightDateTime.date}</p>
                </div>
                <div>
                  <p className="text-blue-100">Giờ khởi hành</p>
                  <p className="font-medium">{flightDateTime.time}</p>
                </div>
                <div>
                  <p className="text-blue-100">Cửa ra máy bay</p>
                  <p className="font-medium">{booking.gate}</p>
                </div>
                <div>
                  <p className="text-blue-100">Chỗ ngồi</p>
                  <p className="font-medium text-yellow-300">{booking.seat}</p>
                </div>
              </div>
            </div>
          </div>
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
              <strong>Giờ boarding:</strong> {booking.boardingTime} - Vui lòng
              có mặt tại cửa ra máy bay trước giờ khởi hành 15 phút.
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
              <strong>Hành lý:</strong> {booking.baggage} - Kiểm tra kỹ hành lý
              xách tay theo quy định.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={handleDownload}
          disabled={downloadStarted}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {downloadStarted ? "Đang tải..." : "Tải thẻ lên máy bay"}
        </Button>

        <Button
          onClick={handleEmail}
          variant="outline"
          disabled={emailSent}
          className="flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          {emailSent ? "Đã gửi!" : "Gửi qua email"}
        </Button>
      </div>

      {emailSent && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Thẻ lên máy bay đã được gửi đến email của bạn!
          </AlertDescription>
        </Alert>
      )}

      {/* Additional Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onNewCheckIn} className="flex-1">
          Check-in vé khác
        </Button>
        <Button variant="outline" className="flex-1">
          <Share2 className="w-4 h-4 mr-2" />
          Chia sẻ
        </Button>
      </div>

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

export default CheckInSuccess;
