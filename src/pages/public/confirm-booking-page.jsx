"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/common/seo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, MapPin, Plane } from "lucide-react";
import {
  formatCurrencyVND,
  formatDateVN,
  formatTimeVN,
} from "@/utils/currency-utils";

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    const storedBookingData = localStorage.getItem("bookingConfirmation");
    if (storedBookingData) {
      setBookingData(JSON.parse(storedBookingData));
    } else {
      // Redirect to home if no booking data
      navigate("/");
    }
  }, [navigate]);

  // Helper function to get flight segment info from API response
  const getFlightSegmentInfo = (segments) => {
    if (!segments || segments.length === 0) return [];

    return segments.map((segment) => ({
      departure: {
        city: segment.departureAirport.city,
        airport: segment.departureAirport.name,
        airportCode: segment.departureAirport.code,
        country: segment.departureAirport.country,
        time: formatTimeVN(segment.departureTime),
        date: formatDateVN(segment.departureTime),
        terminal: segment.departureAirport.gates?.[0]?.terminal || "N/A",
        gate: segment.departureAirport.gates?.[0]?.gateNumber || "N/A",
      },
      arrival: {
        city: segment.arrivalAirport.city,
        airport: segment.arrivalAirport.name,
        airportCode: segment.arrivalAirport.code,
        country: segment.arrivalAirport.country,
        time: formatTimeVN(segment.arrivalTime),
        date: formatDateVN(segment.arrivalTime),
        terminal: segment.arrivalAirport.gates?.[0]?.terminal || "N/A",
        gate: segment.arrivalAirport.gates?.[0]?.gateNumber || "N/A",
      },
      flight: {
        flightNumber: segment.flightNumber,
        airline: segment.airline.name,
        aircraft: segment.aircraft?.name || "N/A",
        duration: segment.duration || "N/A",
      },
    }));
  };

  if (!bookingData) {
    return (
      <>
        <SEO title="Đang tải..." description="Đang tải thông tin booking..." />
        <div className="min-h-screen bg-gray-50 py-8 pt-20 dark:bg-gray-700 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Đang tải thông tin booking...
            </p>
          </div>
        </div>
      </>
    );
  }

  // Process booking details from API response
  const bookingDetails = {
    bookingId: bookingData.bookingId || bookingData.bookingCode,
    bookingCode: bookingData.bookingCode || bookingData.bookingId,
    status: bookingData.status || "CONFIRMED",
    flightSegments: getFlightSegmentInfo(bookingData.flightSegments),
    passengers: bookingData.passengers || [],
    baggage: bookingData.baggage || [],
    ancillaryServices: bookingData.ancillaryServices || [],
    price: {
      subtotal: bookingData.totalPrice || bookingData.price?.subtotal || 0,
      taxes: bookingData.taxes || bookingData.price?.taxes || 0,
      total: bookingData.totalPrice || bookingData.price?.total || 0,
    },
  };

  // Detect flight type
  const flightType =
    bookingDetails.flightSegments.length === 1
      ? "ONE_WAY"
      : bookingDetails.flightSegments.length === 2
      ? "ROUND_TRIP"
      : "MULTI_CITY";

  const copyBookingCode = () => {
    navigator.clipboard.writeText(bookingDetails.bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <SEO
        title="Đã đặt vé"
        description="Đặt vé máy bay thành công! Xem chi tiết booking và thông tin chuyến bay của bạn."
        keywords="xác nhận đặt vé, booking thành công, vé máy bay đã đặt, chi tiết chuyến bay"
      />
      <div className="min-h-screen bg-gray-50 py-8 pt-20 dark:bg-gray-700 ">
        <div className="max-w-4xl mx-auto px-4">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Đặt Vé Thành Công!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Cảm ơn bạn đã tin tương chúng tôi. Thông tin chi tiết booking của
              bạn như sau:
            </p>
          </div>

          {/* Booking Code */}
          <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                  Mã đặt chỗ của bạn
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {bookingDetails.bookingCode}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyBookingCode}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    {copied ? "Đã sao chép!" : "Sao chép"}
                  </Button>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Vui lòng lưu mã này để tra cứu booking
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Flight Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Flight Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="w-5 h-5" />
                    Chi Tiết Chuyến Bay
                    <Badge variant="secondary" className="ml-2">
                      {flightType === "ONE_WAY"
                        ? "Một chiều"
                        : flightType === "ROUND_TRIP"
                        ? "Khứ hồi"
                        : "Nhiều thành phố"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingDetails.flightSegments.length > 0 ? (
                    <div className="space-y-6">
                      {bookingDetails.flightSegments.map((segment, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <Badge variant="outline">
                              Chặng {index + 1}: {segment.flight.flightNumber}
                            </Badge>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {segment.flight.airline} •{" "}
                              {segment.flight.aircraft}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            {/* Departure */}
                            <div className="text-center">
                              <MapPin className="mx-auto mb-2 text-blue-600" />
                              <p className="font-semibold dark:text-gray-200">
                                {segment.departure.city}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {segment.departure.airport}
                              </p>
                              <p className="text-xs text-gray-500">
                                {segment.departure.airportCode} -{" "}
                                {segment.departure.country}
                              </p>
                              <p className="text-lg font-bold dark:text-gray-200 mt-2">
                                {segment.departure.time}
                              </p>
                              <p className="text-xs text-gray-500">
                                {segment.departure.date}
                              </p>
                              <p className="text-xs text-gray-500">
                                Terminal: {segment.departure.terminal} | Cổng:{" "}
                                {segment.departure.gate}
                              </p>
                            </div>

                            {/* Flight Duration */}
                            <div className="text-center">
                              <div className="flex items-center justify-center">
                                <div className="h-px bg-gray-300 flex-1"></div>
                                <Plane
                                  className="mx-2 text-gray-400"
                                  size={16}
                                />
                                <div className="h-px bg-gray-300 flex-1"></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {segment.flight.duration}
                              </p>
                            </div>

                            {/* Arrival */}
                            <div className="text-center">
                              <MapPin className="mx-auto mb-2 text-green-600" />
                              <p className="font-semibold dark:text-gray-200">
                                {segment.arrival.city}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {segment.arrival.airport}
                              </p>
                              <p className="text-xs text-gray-500">
                                {segment.arrival.airportCode} -{" "}
                                {segment.arrival.country}
                              </p>
                              <p className="text-lg font-bold dark:text-gray-200 mt-2">
                                {segment.arrival.time}
                              </p>
                              <p className="text-xs text-gray-500">
                                {segment.arrival.date}
                              </p>
                              <p className="text-xs text-gray-500">
                                Terminal: {segment.arrival.terminal} | Cổng:{" "}
                                {segment.arrival.gate}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <p>Không có thông tin chuyến bay từ API</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Passengers */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông Tin Hành Khách</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingDetails.passengers.length > 0 ? (
                    <div className="space-y-3">
                      {bookingDetails.passengers.map((passenger, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <div>
                            <p className="font-medium dark:text-gray-200">
                              {passenger.firstName} {passenger.lastName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {passenger.passengerType} •{" "}
                              {passenger.dateOfBirth}
                            </p>
                          </div>
                          <Badge variant="outline">{passenger.gender}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Không có thông tin hành khách từ API
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Baggage & Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Hành Lý & Dịch Vụ Bổ Sung</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Baggage */}
                    {bookingDetails.baggage.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 dark:text-gray-200">
                          Hành lý:
                        </h4>
                        <div className="space-y-2">
                          {bookingDetails.baggage.map((bag, index) => (
                            <div
                              key={index}
                              className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                            >
                              <span className="dark:text-gray-200">
                                {bag.type}: {bag.weight}
                              </span>
                              <span className="font-medium text-blue-600">
                                {formatCurrencyVND(bag.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ancillary Services */}
                    {bookingDetails.ancillaryServices.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 dark:text-gray-200">
                          Dịch vụ bổ sung:
                        </h4>
                        <div className="space-y-2">
                          {bookingDetails.ancillaryServices.map(
                            (service, index) => (
                              <div
                                key={index}
                                className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                              >
                                <span className="dark:text-gray-200">
                                  {service.name}
                                </span>
                                <span className="font-medium text-blue-600">
                                  {formatCurrencyVND(service.price)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {bookingDetails.baggage.length === 0 &&
                      bookingDetails.ancillaryServices.length === 0 && (
                        <p className="text-gray-500">
                          Không có dịch vụ bổ sung nào
                        </p>
                      )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Price Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tổng Quan Giá</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Tổng phụ</span>
                      <span>
                        {formatCurrencyVND(bookingDetails.price.subtotal)}
                      </span>
                    </div>
                    {bookingDetails.price.taxes > 0 && (
                      <div className="flex justify-between">
                        <span>Thuế và phí</span>
                        <span>
                          {formatCurrencyVND(bookingDetails.price.taxes)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Tổng cộng</span>
                      <span className="text-blue-600">
                        {formatCurrencyVND(bookingDetails.price.total)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* What's Next */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Tiếp Theo Là Gì?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => navigate("/checkin")}
                  >
                    Check-in Online
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/my-bookings")}
                  >
                    Quản Lý Booking
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card className="bg-blue-100/50 dark:bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-green-700">
                  Những Lưu Ý Quan Trọng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-blue-800 dark:text-green-800">
                  <li>✔ Mang theo giấy tờ tùy thân hợp lệ</li>
                  <li>
                    ✔ Có mặt tại sân bay trước 2 tiếng (nội địa) / 3 tiếng (quốc
                    tế)
                  </li>
                  <li>✔ Check-in online để tiết kiệm thời gian</li>
                  <li>✔ Xem lại quy định và hạn chế về hành lý</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingConfirmation;
