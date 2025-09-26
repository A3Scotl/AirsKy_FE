import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, User, Calendar, MapPin, Plane, ChevronRight } from "lucide-react";

const mockBooking = {
  code: "VN123456",
  passenger: "Nguyen Van A",
  flight: "VN123",
  from: "SGN",
  to: "HAN",
  date: "2025-10-01",
  time: "08:00",
  seat: null,
  status: "Chưa check-in",
  baggage: "20kg",
  gate: "A12",
  boardingTime: "07:30",
};

const availableSeats = [
  "12A", "12B", "12C", "13A", "13B", "13C", "14A", "14B", "14C"
];

export default function CheckInPage() {
  const [booking, setBooking] = useState(mockBooking);
  const [step, setStep] = useState(1);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  const handleFindBooking = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSelectSeat = (seat) => {
    setSelectedSeat(seat);
  };

  const handleCheckIn = () => {
    setBooking({ ...booking, seat: selectedSeat, status: "Đã check-in" });
    setCheckInSuccess(true);
    setStep(3);
  };

  return (
    <div className="min-h-screen mt-16 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center py-10 dark:from-gray-700 dark:via-gray-900 dark:to-gray-950">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-700 flex items-center gap-2">
            <Plane className="w-6 h-6 text-blue-500" /> Check-in Online
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={handleFindBooking} className="space-y-6">
              <div>
                <label className="block font-medium mb-1">Mã đặt chỗ / Vé điện tử</label>
                <Input required placeholder="Nhập mã đặt chỗ hoặc vé điện tử" defaultValue={booking.code} />
              </div>
              <div>
                <label className="block font-medium mb-1">Họ và tên hành khách</label>
                <Input required placeholder="Nhập họ tên" defaultValue={booking.passenger} />
              </div>
              <Button type="submit" className="w-full mt-2">Tìm kiếm đặt chỗ</Button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <User className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">{booking.passenger}</span>
                <Badge variant="outline" className="ml-auto text-blue-700 border-blue-300">{booking.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Chuyến bay:</span> {booking.flight}</div>
                <div><span className="font-medium">Ngày:</span> {booking.date}</div>
                <div><span className="font-medium">Từ:</span> {booking.from}</div>
                <div><span className="font-medium">Đến:</span> {booking.to}</div>
                <div><span className="font-medium">Giờ khởi hành:</span> {booking.time}</div>
                <div><span className="font-medium">Cửa ra máy bay:</span> {booking.gate}</div>
                <div><span className="font-medium">Hành lý:</span> {booking.baggage}</div>
                <div><span className="font-medium">Giờ boarding:</span> {booking.boardingTime}</div>
              </div>
              <div>
                <label className="block font-medium mb-2">Chọn chỗ ngồi</label>
                <div className="grid grid-cols-6 gap-2">
                  {availableSeats.map((seat) => (
                    <Button
                      key={seat}
                      type="button"
                      variant={selectedSeat === seat ? "default" : "outline"}
                      className={selectedSeat === seat ? "bg-blue-600 text-white" : ""}
                      onClick={() => handleSelectSeat(seat)}
                    >
                      {seat}
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                className="w-full mt-2"
                disabled={!selectedSeat}
                onClick={handleCheckIn}
              >
                Xác nhận check-in <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 3 && checkInSuccess && (
            <div className="flex flex-col items-center gap-6 py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mb-2" />
              <div className="text-xl font-semibold text-green-700">Check-in thành công!</div>
              <div className="w-full bg-gray-50 rounded-lg p-4 shadow-inner">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold">{booking.passenger}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Chuyến bay:</span> {booking.flight}</div>
                  <div><span className="font-medium">Ngày:</span> {booking.date}</div>
                  <div><span className="font-medium">Từ:</span> {booking.from}</div>
                  <div><span className="font-medium">Đến:</span> {booking.to}</div>
                  <div><span className="font-medium">Giờ khởi hành:</span> {booking.time}</div>
                  <div><span className="font-medium">Cửa ra máy bay:</span> {booking.gate}</div>
                  <div><span className="font-medium">Chỗ ngồi:</span> <span className="font-bold text-blue-700">{booking.seat}</span></div>
                  <div><span className="font-medium">Hành lý:</span> {booking.baggage}</div>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline" onClick={() => setStep(1)}>
                Check-in cho vé khác
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
