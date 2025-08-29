"use client";

import { useState } from "react";
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
import { useNavigate } from "react-router-dom";

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const bookingDetails = {
    reference: "SKY789XYZ",
    outbound: {
      flightNumber: "SK401",
      departure: {
        airport: "John F. Kennedy (JFK)",
        city: "New York",
        date: "Dec 15, 2024",
        time: "08:30 AM",
        terminal: "Terminal 4",
      },
      arrival: {
        airport: "Los Angeles Intl (LAX)",
        city: "Los Angeles",
        date: "Dec 15, 2024",
        time: "12:15 PM",
        terminal: "Terminal 6",
      },
      duration: "5h 45m",
      class: "Economy",
      aircraft: "Boeing 787-9",
      gate: "B23",
    },
    return: {
      flightNumber: "SK402",
      departure: {
        airport: "Los Angeles Intl (LAX)",
        city: "Los Angeles",
        date: "Dec 20, 2024",
        time: "06:00 PM",
        terminal: "Terminal 6",
      },
      arrival: {
        airport: "John F. Kennedy (JFK)",
        city: "New York",
        date: "Dec 20, 2024",
        time: "10:20 PM",
        terminal: "Terminal 4",
      },
      duration: "4h 20m",
      class: "Economy",
      aircraft: "Airbus A350",
      gate: "C12",
    },
    passenger: {
      name: "John Doe",
      type: "Adult",
      seat: "12A (Outbound), 15C (Return)",
    },
    price: {
      total: 320,
      currency: "USD",
      breakdown: {
        baseFare: 280,
        taxesFees: 40,
      },
    },
    email: "john.doe@example.com",
  };

  const handleManageBooking = () => {
    navigate(`/manage-booking?reference=${bookingDetails.reference}`);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error("Failed to copy: ", err);
      return false;
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(bookingDetails.reference);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          {/* Confirmation Header */}
          <Card className="mb-6 text-center">
            <CardHeader>
              <div className="flex justify-center mb-6">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-[1.8rem] font-semibold">
                Đơn đặt đã xác nhận!
              </CardTitle>
              <CardDescription className="text-gray-600">
                Bạn đã sẵn sàng! Chuyến bay của bạn đã được đặt thành công.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <p className="text-green-600 mb-2 bg-green-100 p-3 rounded-2xl inline-block">
                <span className="font-medium">
                  Email xác nhận đã được gửi đến
                </span>{" "}
                <span className="underline">{bookingDetails.email}</span>
              </p>
            </CardContent>
          </Card>

          {/* Booking Reference */}
          <Card className="mb-6 flex flex-col justify-center items-center p-4">
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-semibold mb-4">
                Mã Đặt Chỗ
              </CardTitle>
            </CardHeader>
            <CardContent className="border-2 w-full p-4 rounded-lg justify-center flex flex-col items-center">
              <div className="flex gap-2">
                <p className="text-lg font-semibold">
                  {bookingDetails.reference}
                </p>
                <Button
                  variant={copied ? "default" : "outline"}
                  size="sm"
                  onClick={handleCopy}
                  className={
                    copied ? "bg-green-600 hover:bg-green-700 text-white" : ""
                  }
                >
                  {copied ? "Đã sao chép!" : "Sao chép"}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Lưu ý: Mã đặt chỗ này sẽ được sử dụng để quản lý đặt chỗ của
                bạn.
              </p>
            </CardContent>
          </Card>

          {/* Trip Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tóm Tắt Chuyến Đi</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Outbound Flight */}
              <div className="mb-4 p-4 border rounded-lg bg-white shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <MapPin className="mx-auto mb-2 text-blue-600" />
                    <p className="font-semibold dark:text-gray-800">
                      {bookingDetails.outbound.departure.city}
                    </p>
                    <p className="text-sm text-gray-600">
                      {bookingDetails.outbound.departure.airport}
                    </p>
                    <p className="text-sm dark:text-gray-600">
                      {bookingDetails.outbound.departure.time},{" "}
                      {bookingDetails.outbound.departure.date}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ga: {bookingDetails.outbound.terminal}
                    </p>
                  </div>

                  <div className="text-center relative">
                    {/* Flight path line */}
                    <div className="hidden md:block absolute top-1/2 left-0 right-0 transform -translate-y-1/2">
                      <div className="border-t-2 border-dashed border-blue-300 relative">
                        <div className="absolute left-0 top-0 w-2 h-2 bg-blue-600 rounded-full transform -translate-y-1/2"></div>
                        <div className="absolute right-0 top-0 w-2 h-2 bg-blue-600 rounded-full transform -translate-y-1/2"></div>
                      </div>
                    </div>

                    {/* Mobile plane icon */}

                    <div className="mt-8 md:mt-4">
                      <p className="font-semibold dark:text-gray-800">
                        Chuyến bay {bookingDetails.outbound.flightNumber}
                      </p>
                      <p className="text-sm dark:text-gray-800">
                        {bookingDetails.outbound.duration}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-800">
                        Máy bay: {bookingDetails.outbound.aircraft}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-800">
                        Cổng: {bookingDetails.outbound.gate}
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <MapPin className="mx-auto mb-2 text-blue-600" />
                    <p className="font-semibold dark:text-gray-800">
                      {bookingDetails.outbound.arrival.city}
                    </p>
                    <p className="text-sm text-gray-600">
                      {bookingDetails.outbound.arrival.airport}
                    </p>
                    <p className="text-sm dark:text-gray-600">
                      {bookingDetails.outbound.arrival.time},{" "}
                      {bookingDetails.outbound.arrival.date}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ga: {bookingDetails.outbound.terminal}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {bookingDetails.outbound.class}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Passenger Info */}
              <div className="mt-4 p-4 border rounded-lg bg-white shadow-sm">
                <p className="font-semibold dark:text-gray-800">
                  Thông tin hành khách
                </p>
                <p className="dark:text-gray-800">
                  {bookingDetails.passenger.name} -{" "}
                  {bookingDetails.passenger.type}
                </p>
                <p className="text-sm text-gray-600">
                  Chỗ ngồi: {bookingDetails.passenger.seat}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Price Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tóm Tắt Giá</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span>Giá Cơ Bản</span>
                  <span>${bookingDetails.price.breakdown.baseFare}</span>
                </p>
                <p className="flex justify-between">
                  <span>Thuế & Phí</span>
                  <span>${bookingDetails.price.breakdown.taxesFees}</span>
                </p>
                <Separator />
                <p className="flex justify-between font-semibold">
                  <span>Tổng Cộng</span>
                  <span>${bookingDetails.price.total}</span>
                </p>
              </div>
            </CardContent>
          </Card>

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
                  onClick={handleManageBooking}
                >
                  Quản Lý Đặt Chỗ
                </Button>
                <Button variant="outline" className="w-full">
                  Thêm vào Lịch
                </Button>
                <Button variant="outline" className="w-full">
                  In Lịch Trình
                </Button>
                <Button variant="outline" className="w-full mt-2">
                  Chia Sẻ Chi Tiết Chuyến Đi
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Important Reminders */}
          <Card className="bg-blue-100/50 dark:bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-600 dark:text-green-700">
                Những Lưu Ý Quan Trọng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-blue-600 font-semibold dark:text-green-700">
                <li>✔ Làm thủ tục 24 giờ trước khi khởi hành</li>
                <li>✔ Đến sân bay 2 giờ trước giờ bay</li>
                <li>✔ Đảm bảo CMND/hộ chiếu của bạn còn hiệu lực để đi lại</li>
                <li>✔ Xem lại quy định và hạn chế về hành lý</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BookingConfirmation;
