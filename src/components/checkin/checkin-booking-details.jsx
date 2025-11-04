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

const CheckInBookingDetails = ({
  booking,
  selectedSegment,
  onProceed,
  onBack,
  onSegmentSelect,
}) => {
  if (!booking) return null;

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

  const getStatusColor = (status) => {
    switch (status) {
      case "ALREADY_CHECKED_IN":
        return "bg-green-100 text-green-800 border-green-200";
      case "ELIGIBLE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PAYMENT_PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PREVIOUS_SEGMENT_NOT_CHECKED_IN":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "CHECKIN_NOT_OPEN":
        return "bg-gray-100 text-gray-800 border-gray-200";
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
      case "PREVIOUS_SEGMENT_NOT_CHECKED_IN":
        return "Chờ check-in chuyến trước";
      case "CHECKIN_NOT_OPEN":
        return "Chưa mở check-in";
      default:
        return status;
    }
  };

  const getSegmentTitle = (segmentOrder) => {
    return segmentOrder === 1 ? "Chuyến đi" : "Chuyến về";
  };

  // Get all segments with their passenger info
  const segmentsWithPassengers =
    booking.flightSegments?.map((segment) => {
      const passenger = booking.checkinEligiblePassengers?.find(
        (p) => p.segmentId === segment.segmentId
      );
      return {
        ...segment,
        passenger,
      };
    }) || [];

  // Sort segments by order
  const sortedSegments = segmentsWithPassengers.sort(
    (a, b) => a.segmentOrder - b.segmentOrder
  );

  // Check if any segment can be checked in
  const hasEligibleSegments = sortedSegments.some(
    (segment) =>
      segment.passenger?.checkinStatus === "ELIGIBLE" ||
      (segment.passenger?.checkinStatus === "PREVIOUS_SEGMENT_NOT_CHECKED_IN" &&
        segment.segmentOrder > 1 &&
        sortedSegments.find((s) => s.segmentOrder === segment.segmentOrder - 1)
          ?.passenger?.checkinStatus === "ALREADY_CHECKED_IN")
  );

  return (
    <div className="space-y-6">
      {/* Booking Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <User className="w-5 h-5 text-blue-500" />
            <span>Thông tin đặt chỗ</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Mã đặt chỗ
              </p>
              <p className="font-semibold text-lg dark:text-gray-100">
                {booking.bookingCode}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Hành khách
              </p>
              <p className="font-semibold dark:text-gray-100">
                {booking.checkinEligiblePassengers?.[0]?.fullName ||
                  `${booking.checkinEligiblePassengers?.[0]?.firstName} ${booking.checkinEligiblePassengers?.[0]?.lastName}`}
              </p>
            </div>
            {booking.checkinEligiblePassengers?.[0]?.passportNumber && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Số hộ chiếu
                </p>
                <p className="font-semibold dark:text-gray-100">
                  {booking.checkinEligiblePassengers[0].passportNumber}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Flight Segments */}
      {sortedSegments.map((segmentData, index) => {
        const { passenger, ...segment } = segmentData;
        const departureDateTime = segment.departureTime
          ? formatDateTime(segment.departureTime)
          : { date: "N/A", time: "N/A" };
        const arrivalDateTime = segment.arrivalTime
          ? formatDateTime(segment.arrivalTime)
          : { date: "N/A", time: "N/A" };

        const isCheckedIn = passenger?.checkinStatus === "ALREADY_CHECKED_IN";
        const canCheckInThisSegment =
          passenger?.checkinStatus === "ELIGIBLE" ||
          (passenger?.checkinStatus === "PREVIOUS_SEGMENT_NOT_CHECKED_IN" &&
            segment.segmentOrder > 1 &&
            sortedSegments.find(
              (s) => s.segmentOrder === segment.segmentOrder - 1
            )?.passenger?.checkinStatus === "ALREADY_CHECKED_IN");

        return (
          <Card
            key={segment.segmentId || index}
            className={isCheckedIn ? "border-green-200 bg-green-50/30" : ""}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="w-5 h-5 text-blue-500" />
                  <span>
                    Chuyến bay {getSegmentTitle(segment.segmentOrder)}
                  </span>
                  {isCheckedIn && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={getStatusColor(passenger?.checkinStatus)}
                >
                  {getStatusText(passenger?.checkinStatus)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Flight Route */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <p className="font-bold text-lg">
                      {segment.departureAirport?.airportCode || "N/A"}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {segment.departureAirport?.airportName || "Departure"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {departureDateTime.time}
                  </p>
                </div>

                <div className="flex flex-col items-center px-4">
                  <ArrowRight className="w-6 h-6 text-blue-600" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {segment.flightNumber}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {segment.duration || "N/A"}
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <p className="font-bold text-lg">
                      {segment.arrivalAirport?.airportCode || "N/A"}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {segment.arrivalAirport?.airportName || "Arrival"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {arrivalDateTime.time}
                  </p>
                </div>
              </div>

              {/* Flight Details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Ngày bay
                  </p>
                  <p className="font-medium dark:text-gray-100">
                    {departureDateTime.date}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Hạng ghế
                  </p>
                  <p className="font-medium dark:text-gray-100">
                    {segment.className || booking.travelClass}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Máy bay
                  </p>
                  <p className="font-medium dark:text-gray-100">
                    {segment.aircraft || "N/A"}
                  </p>
                </div>
              </div>

              {/* Seat Information */}
              {passenger?.seatNumber && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Chỗ ngồi</p>
                    <p className="font-medium text-blue-600">
                      {passenger.seatNumber}
                    </p>
                  </div>
                </div>
              )}

              {/* Boarding Pass for checked-in segments */}
              {isCheckedIn && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <DoorOpen className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Thẻ lên máy bay</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-green-600">
                        {passenger?.boardingpassurl ? "Đã tạo" : "Đang xử lý"}
                      </p>
                      {passenger?.boardingpassurl && (
                        <a
                          href={passenger.boardingpassurl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Xem thẻ
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Check-in button for eligible segments */}
              {canCheckInThisSegment && !selectedSegment && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => onSegmentSelect(passenger)}
                    className="w-full"
                  >
                    Check-in chuyến {getSegmentTitle(segment.segmentOrder)}
                  </Button>
                </div>
              )}

              {/* Selected segment indicator */}
              {selectedSegment?.segmentId === segment.segmentId && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Đã chọn để check-in</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Quay lại
        </Button>
        {selectedSegment && (
          <Button onClick={onProceed} className="flex-1">
            Tiếp tục check-in
          </Button>
        )}
        {!selectedSegment && !hasEligibleSegments && (
          <Button disabled className="flex-1" variant="secondary">
            Không có chuyến nào có thể check-in
          </Button>
        )}
      </div>
    </div>
  );
};

export default CheckInBookingDetails;
