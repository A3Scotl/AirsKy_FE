"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Format currency function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount * 24000);
};

const Payment = () => {
  const [activeTab, setActiveTab] = useState("card");
  const [saveCard, setSaveCard] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Optimized Vietnamese flight data
  const flightDetails = {
    outbound: {
      time: "09:15",
      from: "TP. Hồ Chí Minh (SGN)",
      to: "Hà Nội (HAN)",
      duration: "2g 05p",
      arrival: "11:20",
      date: "15 tháng 3, 2024",
      airline: "Vietnam Airlines - Phổ thông",
    },
    return: {
      time: "19:30",
      from: "Hà Nội (HAN)",
      to: "TP. Hồ Chí Minh (SGN)",
      duration: "2g 10p",
      arrival: "21:40",
      date: "22 tháng 3, 2024",
      airline: "Vietnam Airlines - Phổ thông",
    },
  };

  const passengers = [
    { name: "Nguyễn Văn A", type: "Người lớn" },
    { name: "Nguyễn Thị B", type: "Người lớn" },
  ];

  const selectedExtras = {
    seatSelection: "12A, 12B",
    extraBaggage: "2 x 23kg",
  };

  const priceBreakdown = {
    baseFare: 598,
    taxesFees: 80,
    seatSelection: 40,
    extraBaggage: 80,
    total: 798,
  };

  // Optimized payment handler
  const handlePayment = () => {
    if (!termsAccepted) {
      alert("Vui lòng chấp nhận Điều khoản và Điều kiện.");
      return;
    }
    alert(
      `Thanh toán thành công! Tổng cộng: ${formatCurrency(
        priceBreakdown.total
      )}`
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Xem Lại & Thanh Toán</h2>
      <p className="text-gray-600 mb-6 dark:text-gray-300">
        Vui lòng xem lại thông tin đặt vé và hoàn tất thanh toán
      </p>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Section: Flight and Passenger Details */}
        <div className="w-full md:w-1/2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chi Tiết Chuyến Bay</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <p className="font-semibold">{flightDetails.outbound.time}</p>
                  <p>{flightDetails.outbound.from}</p>
                  <p className="text-sm text-gray-500">
                    {flightDetails.outbound.date} -{" "}
                    {flightDetails.outbound.airline}
                  </p>
                </div>
                <div className="text-center">
                  <p>{flightDetails.outbound.duration}</p>
                  <p className="text-sm text-gray-500">Bay thẳng</p>
                  <p className="font-semibold">
                    {flightDetails.outbound.arrival}
                  </p>
                  <p>{flightDetails.outbound.to}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{flightDetails.return.time}</p>
                  <p>{flightDetails.return.from}</p>
                  <p className="text-sm text-gray-500">
                    {flightDetails.return.date} - {flightDetails.return.airline}
                  </p>
                </div>
                <div className="text-center">
                  <p>{flightDetails.return.duration}</p>
                  <p className="text-sm text-gray-500">Bay thẳng</p>
                  <p className="font-semibold">
                    {flightDetails.return.arrival}
                  </p>
                  <p>{flightDetails.return.to}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Hành Khách</CardTitle>
            </CardHeader>
            <CardContent>
              {passengers.map((passenger, index) => (
                <p key={index} className="mb-2">
                  {passenger.name}{" "}
                  <span className="text-gray-500">({passenger.type})</span>
                </p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dịch Vụ Đã Chọn</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Chọn chỗ ngồi: {selectedExtras.seatSelection}</p>
              <p>Hành lý thêm: {selectedExtras.extraBaggage}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chi Tiết Giá</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                Giá vé cơ bản (2 hành khách):{" "}
                {formatCurrency(priceBreakdown.baseFare)}
              </p>
              <p>Thuế & Phí: {formatCurrency(priceBreakdown.taxesFees)}</p>
              <p>
                Chọn chỗ ngồi: {formatCurrency(priceBreakdown.seatSelection)}
              </p>
              <p>Hành lý thêm: {formatCurrency(priceBreakdown.extraBaggage)}</p>
              <p className="font-bold">
                Tổng cộng: {formatCurrency(priceBreakdown.total)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Payment Method */}
        <div className="w-full md:w-1/2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Phương Thức Thanh Toán</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="card">Thẻ Tín Dụng</TabsTrigger>
                  <TabsTrigger value="paypal">PayPal</TabsTrigger>
                </TabsList>

                {/* Card Payment */}
                <TabsContent value="card">
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <button className="flex-1 p-2 border rounded-md bg-blue-50 text-blue-600">
                        Thẻ Tín Dụng/Ghi Nợ
                      </button>
                    </div>
                    <Input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="text"
                        placeholder="Tên chủ thẻ"
                        className="w-full"
                      />
                      <Input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full"
                      />
                    </div>
                    <Input type="text" placeholder="CVV" className="w-1/4" />
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="save-card"
                        checked={saveCard}
                        onCheckedChange={setSaveCard}
                      />
                      <Label htmlFor="save-card">
                        Lưu thẻ này cho các lần thanh toán sau
                      </Label>
                    </div>
                  </div>
                </TabsContent>

                {/* PayPal Payment */}
                <TabsContent value="paypal">
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <button className="flex-1 p-2 border rounded-md bg-blue-500 text-white">
                        PayPal
                      </button>
                    </div>
                    <p className="text-gray-600">
                      Bạn sẽ được chuyển đến PayPal để hoàn tất thanh toán.
                    </p>
                    <Button className="w-full bg-blue-500 text-white">
                      Tiếp tục với PayPal
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-4 p-2 bg-green-50 text-green-700 rounded-md flex items-center">
                <span className="mr-2">🛡️</span>
                <span>
                  Thanh toán bảo mật: Thông tin thanh toán của bạn được mã hóa
                  và bảo mật
                </span>
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={setTermsAccepted}
                />
                <Label htmlFor="terms">
                  Tôi đồng ý với Điều khoản và Điều kiện cũng như Quy định giá
                  vé
                </Label>
              </div>

              <Button
                className="w-full bg-blue-600 text-white mt-4"
                onClick={handlePayment}
                disabled={!termsAccepted}
              >
                Thanh toán ngay - {formatCurrency(priceBreakdown.total)}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payment;
