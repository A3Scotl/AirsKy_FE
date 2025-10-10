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

  // Get passenger info for status checks
  const currentPassenger =
    booking.checkinEligiblePassengers?.[0] || booking.passengers?.[0];

  const isAlreadyCheckedIn =
    currentPassenger?.checkinStatus === "ALREADY_CHECKED_IN" ||
    currentPassenger?.checkedIn;
  const canCheckIn =
    currentPassenger?.checkinStatus === "ELIGIBLE" &&
    !currentPassenger?.checkedIn;
  const isPaymentPending =
    currentPassenger?.checkinStatus === "PAYMENT_PENDING" ||
    booking.status === "PAYMENT_PENDING";

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

  const formatDateTime = (dateTimeString) => {
    const dateTime = new Date(dateTimeString);
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

  // Get flight segment info
  const flightSegment = booking.flightSegments?.[0];

  const departureDateTime = flightSegment?.departureTime
    ? formatDateTime(flightSegment.departureTime)
    : { date: "N/A", time: "N/A" };

  const arrivalDateTime = flightSegment?.arrivalTime
    ? formatDateTime(flightSegment.arrivalTime)
    : { date: "N/A", time: "N/A" };

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
              className={getStatusColor(
                currentPassenger?.checkinStatus || booking.status
              )}
            >
              {getStatusText(currentPassenger?.checkinStatus || booking.status)}
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
                  `${currentPassenger?.firstName} ${currentPassenger?.lastName}`}
              </p>
            </div>
            {currentPassenger?.passportNumber && (
              <div>
                <p className="text-sm text-gray-600">Số hộ chiếu</p>
                <p className="font-semibold">
                  {currentPassenger.passportNumber}
                </p>
              </div>
            )}
            {currentPassenger?.ticketPrice && (
              <div>
                <p className="text-sm text-gray-600">Tổng tiền</p>
                <p className="font-semibold text-green-600">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(currentPassenger.ticketPrice)}
                </p>
              </div>
            )}
            {currentPassenger?.seatNumber && (
              <div>
                <p className="text-sm text-gray-600">Ghế hiện tại</p>
                <p className="font-semibold text-blue-600">
                  {currentPassenger.seatNumber}
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
          {/* Flight Route */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <p className="font-bold text-lg">
                  {flightSegment?.departureAirport?.airportCode || "N/A"}
                </p>
              </div>
              <p className="text-sm text-gray-600">
                {flightSegment?.departureAirport?.airportName || "Departure"}
              </p>
              <p className="text-xs text-gray-500">{departureDateTime.time}</p>
            </div>

            <div className="flex flex-col items-center px-4">
              <ArrowRight className="w-6 h-6 text-blue-600" />
              <p className="text-xs text-gray-500 mt-1">
                {flightSegment?.flightNumber || booking.flightNumber}
              </p>
              <p className="text-xs text-gray-500">
                {flightSegment?.duration || "N/A"}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <p className="font-bold text-lg">
                  {flightSegment?.arrivalAirport?.airportCode || "N/A"}
                </p>
              </div>
              <p className="text-sm text-gray-600">
                {flightSegment?.arrivalAirport?.airportName || "Arrival"}
              </p>
              <p className="text-xs text-gray-500">{arrivalDateTime.time}</p>
            </div>
          </div>

          {/* Flight Details */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Ngày bay</p>
              <p className="font-medium">{departureDateTime.date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hạng ghế</p>
              <p className="font-medium">
                {flightSegment?.className || booking.travelClass}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Máy bay</p>
              <p className="font-medium">{flightSegment?.aircraft || "N/A"}</p>
            </div>
          </div>

          {currentPassenger?.seatNumber && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Chỗ ngồi hiện tại</p>
                <p className="font-medium text-blue-600">
                  {currentPassenger.seatNumber}
                </p>
              </div>
            </div>
          )}

          {booking.baggage && booking.baggage.length > 0 && (
            <div className="flex items-center gap-2">
              <Luggage className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Hành lý</p>
                <p className="font-medium">
                  {typeof booking.baggage[0] === "object" ? (
                    <>
                      {booking.baggage[0].type} -{" "}
                      {booking.baggage[0].purchasedPackage}
                      {booking.baggage[0].packagePrice && (
                        <span className="text-green-600 ml-2">
                          (+{booking.baggage[0].packagePrice.toLocaleString()}₫)
                        </span>
                      )}
                    </>
                  ) : (
                    JSON.stringify(booking.baggage[0])
                  )}
                </p>
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
