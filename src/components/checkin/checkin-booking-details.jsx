import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Calendar,
  MapPin,
  Plane,
  Clock,
  Luggage,
  DoorOpen,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const CheckInBookingDetails = ({ booking, onProceed, onBack }) => {
  if (!booking) return null;

  const isAlreadyCheckedIn =
    booking.checkinStatus === "ALREADY_CHECKED_IN" || booking.isCheckedIn;
  const canCheckIn =
    booking.checkinStatus === "ELIGIBLE" && !booking.isCheckedIn;
  const isPaymentPending = booking.checkinStatus === "PAYMENT_PENDING";

  const getStatusColor = (status) => {
    switch (status) {
      case "ALREADY_CHECKED_IN":
        return "bg-green-100 text-green-800 border-green-200";
      case "ELIGIBLE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PAYMENT_PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "ALREADY_CHECKED_IN":
        return "Đã check-in";
      case "ELIGIBLE":
        return "Đủ điều kiện check-in";
      case "PAYMENT_PENDING":
        return "Chờ thanh toán";
      default:
        return status;
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
      {/* Booking Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              <span>Thông tin đặt chỗ</span>
            </div>
            <Badge
              variant="outline"
              className={getStatusColor(booking.checkinStatus)}
            >
              {getStatusText(booking.checkinStatus)}
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
            {booking.passportNumber && (
              <div>
                <p className="text-sm text-gray-600">Số hộ chiếu</p>
                <p className="font-semibold">{booking.passportNumber}</p>
              </div>
            )}
            {booking.ticketPrice && (
              <div>
                <p className="text-sm text-gray-600">Giá vé</p>
                <p className="font-semibold text-green-600">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(booking.ticketPrice)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flight Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-500" />
            Thông tin chuyến bay
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {booking.from}
                </p>
                <p className="text-sm text-gray-600">Khởi hành</p>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{booking.to}</p>
                <p className="text-sm text-gray-600">Đến</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{booking.flight}</p>
              <p className="text-sm text-gray-600">
                {booking.airline || "AirSky"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Ngày bay</p>
                <p className="font-medium">{flightDateTime.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Giờ khởi hành</p>
                <p className="font-medium">{flightDateTime.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Cửa ra máy bay</p>
                <p className="font-medium">{booking.gate || "Chưa xác định"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Giờ boarding</p>
                <p className="font-medium">
                  {booking.boardingTime || "Chưa xác định"}
                </p>
              </div>
            </div>
          </div>

          {booking.seat && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Chỗ ngồi</p>
                <p className="font-medium text-blue-600">{booking.seat}</p>
              </div>
            </div>
          )}

          {booking.baggage && (
            <div className="flex items-center gap-2">
              <Luggage className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Hành lý</p>
                <p className="font-medium">{booking.baggage}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Messages */}
      {isAlreadyCheckedIn && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">
                  Đã check-in thành công
                </p>
                <p className="text-sm text-green-700">
                  Bạn đã hoàn tất thủ tục check-in cho chuyến bay này. Vui lòng
                  đến sân bay đúng giờ và mang theo thẻ lên máy bay.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isPaymentPending && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-800">
                  Vé chưa được thanh toán
                </p>
                <p className="text-sm text-yellow-700">
                  Bạn cần thanh toán vé trước khi có thể check-in online.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!canCheckIn && !isAlreadyCheckedIn && !isPaymentPending && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-800">
                  Không thể check-in
                </p>
                <p className="text-sm text-yellow-700">
                  {booking.checkInMessage ||
                    "Chuyến bay này chưa mở check-in online hoặc đã hết hạn check-in."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Quay lại
        </Button>
        {canCheckIn && (
          <Button onClick={onProceed} className="flex-1">
            Tiếp tục check-in
          </Button>
        )}
        {isAlreadyCheckedIn && (
          <Button onClick={onProceed} className="flex-1">
            Xem thẻ lên máy bay
          </Button>
        )}
        {isPaymentPending && (
          <Button disabled className="flex-1" variant="secondary">
            Chờ thanh toán
          </Button>
        )}
      </div>
    </div>
  );
};

export default CheckInBookingDetails;
