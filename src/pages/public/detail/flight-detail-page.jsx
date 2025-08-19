"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Plane,
  MapPin,
  Calendar,
  Luggage,
  Star,
  AlertCircle,
  ArrowRight,
  Check,
  Wifi,
  Monitor,
  Utensils,
  Zap,
  Package,
  Headphones,
  Bed,
} from "lucide-react";

// Format currency function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount * 24000);
};

const FlightDetail = () => {
  const navigate = useNavigate();
  const [selectedFare, setSelectedFare] = useState(null);
  const [flightData, setFlightData] = useState(null);

  // Default flight info with Vietnamese data
  const defaultFlightInfo = {
    airline: "Vietnam Airlines",
    flightNumber: "VN7210",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2021/02/Vietnam-Airlines-Logo.png",
    departure: {
      city: "TP. Hồ Chí Minh",
      code: "SGN",
      time: "05:05",
      date: "15 tháng 8, 2025",
    },
    arrival: {
      city: "Hà Nội",
      code: "HAN",
      time: "07:10",
      date: "15 tháng 8, 2025",
    },
    duration: "2g 05p",
    stops: "Bay thẳng",
    aircraft: "Airbus A321",
  };

  const flightInfo = flightData || defaultFlightInfo;

  // Optimized fare classes with Vietnamese content
  const fareClasses = [
    {
      id: "economy",
      type: "Phổ thông",
      price: 299,
      originalPrice: 350,
      features: [
        { included: true, text: "Đồ dùng cá nhân" },
        { included: true, text: "Hành lý xách tay (7kg)" },
        { included: false, text: "Hành lý ký gửi" },
        { included: true, text: "Chọn chỗ ngồi tiêu chuẩn" },
        { included: true, text: "Giải trí trên máy bay" },
        { included: false, text: "Dịch vụ ăn uống" },
      ],
      availability: "Còn 9 chỗ",
      popular: false,
    },
    {
      id: "premium",
      type: "Phổ thông cao cấp",
      price: 499,
      originalPrice: 580,
      features: [
        { included: true, text: "Đồ dùng cá nhân" },
        { included: true, text: "Hành lý xách tay (10kg)" },
        { included: true, text: "1 hành lý ký gửi (23kg)" },
        { included: true, text: "Ghế ngồi rộng rãi" },
        { included: true, text: "Ưu tiên lên máy bay" },
        { included: true, text: "Dịch vụ ăn uống nâng cao" },
      ],
      availability: "Còn 6 chỗ",
      popular: true,
    },
    {
      id: "business",
      type: "Thương gia",
      price: 1299,
      originalPrice: 1499,
      features: [
        { included: true, text: "Đồ dùng cá nhân" },
        { included: true, text: "2 hành lý xách tay (15kg)" },
        { included: true, text: "2 hành lý ký gửi (32kg mỗi kiện)" },
        { included: true, text: "Ghế nằm phẳng" },
        { included: true, text: "Phòng chờ VIP" },
        { included: true, text: "Ẩm thực cao cấp" },
        { included: true, text: "Dịch vụ riêng biệt" },
      ],
      availability: "Còn 4 chỗ",
      popular: false,
    },
  ];

  const handleSelectFare = (fareId) => setSelectedFare(fareId);

  const handleProceedToBooking = (fareId) => {
    const selectedFareData = fareClasses.find((fare) => fare.id === fareId);
    localStorage.setItem("selectedFlight", JSON.stringify(flightInfo));
    localStorage.setItem("selectedFare", JSON.stringify(selectedFareData));
    navigate("/booking-stepper");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div
        className="h-80 bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-blue-500 bg-opacity-50"></div>
        <div className="relative z-10 h-full flex items-center justify-center text-white">
          <div className="text-center max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img
                src={flightInfo.airlineLogo || defaultFlightInfo.airlineLogo}
                alt={flightInfo.airline}
                className="w-12 h-12 rounded bg-white p-1"
              />
              <h1 className="text-4xl font-bold">
                {flightInfo.departure?.city || flightInfo.from} →{" "}
                {flightInfo.arrival?.city || flightInfo.to}
              </h1>
            </div>
            <p className="text-xl mb-2">
              {flightInfo.airline} Chuyến bay{" "}
              {flightInfo.flightNumber || "VN7210"}
            </p>
            <div className="flex items-center justify-center gap-8 text-lg">
              <span>
                {flightInfo.departure?.time || flightInfo.departureTime} -{" "}
                {flightInfo.arrival?.time || "07:10"}
              </span>
              <span>•</span>
              <span>{flightInfo.duration || defaultFlightInfo.duration}</span>
              <span>•</span>
              <span>{flightInfo.stops || defaultFlightInfo.stops}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Flight Summary Card */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="w-6 h-6 text-blue-600" />
              Thông tin chuyến bay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                <MapPin className="w-8 h-8 mb-3 text-blue-600" />
                <h3 className="font-semibold text-lg">Khởi hành</h3>
                <p className="font-bold">
                  {flightInfo.departure?.city || flightInfo.from} (
                  {flightInfo.departure?.code || flightInfo.fromCode})
                </p>
                <p className="text-sm text-gray-600">
                  {flightInfo.departure?.time || flightInfo.departureTime},{" "}
                  {flightInfo.departure?.date || flightInfo.date}
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                <Plane className="w-8 h-8 mb-3 text-blue-600" />
                <h3 className="font-semibold text-lg">Chi tiết chuyến bay</h3>
                <p className="font-bold">
                  {flightInfo.duration || defaultFlightInfo.duration} •{" "}
                  {flightInfo.stops || defaultFlightInfo.stops}
                </p>
                <p className="text-sm text-gray-600">
                  Máy bay: {flightInfo.aircraft || defaultFlightInfo.aircraft}
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                <MapPin className="w-8 h-8 mb-3 text-blue-600" />
                <h3 className="font-semibold text-lg">Đến nơi</h3>
                <p className="font-bold">
                  {flightInfo.arrival?.city || flightInfo.to} (
                  {flightInfo.arrival?.code || flightInfo.toCode})
                </p>
                <p className="text-sm text-gray-600">
                  {flightInfo.arrival?.time || "07:10"},{" "}
                  {flightInfo.arrival?.date || flightInfo.date}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fare Selection Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Chọn loại vé phù hợp
          </h2>
          <p className="text-gray-600 mb-6">
            Lựa chọn hạng ghế phù hợp với nhu cầu du lịch của bạn
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {fareClasses.map((fare) => (
              <div
                key={fare.id}
                className={`border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedFare === fare.id
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:border-blue-300 hover:shadow-md"
                } ${
                  fare.popular
                    ? "border-blue-200 bg-blue-50 relative"
                    : "border-gray-200"
                }`}
                onClick={() => handleSelectFare(fare.id)}
              >
                {fare.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1">
                    Phổ biến nhất
                  </Badge>
                )}

                <div className="p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {fare.type}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {fare.availability}
                    </Badge>
                  </div>

                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-3xl font-bold text-blue-600">
                        {formatCurrency(fare.price)}
                      </span>
                      <span className="text-lg text-gray-500 line-through">
                        {formatCurrency(fare.originalPrice)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">mỗi người</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {fare.features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <span
                          className={`mr-3 ${
                            feature.included ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {feature.included ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            "✗"
                          )}
                        </span>
                        <span
                          className={
                            feature.included ? "text-gray-700" : "text-gray-500"
                          }
                        >
                          {feature.text}
                        </span>
                      </div>
                    ))}
                    {fare.features.length > 4 && (
                      <p className="text-xs text-gray-500 pl-7">
                        +{fare.features.length - 4} quyền lợi khác
                      </p>
                    )}
                  </div>

                  {selectedFare === fare.id ? (
                    <div className="space-y-3">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProceedToBooking(fare.id);
                        }}
                      >
                        Tiếp tục đặt vé <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <p className="text-xs text-center text-green-600 font-medium">
                        ✓ {fare.type} đã chọn
                      </p>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Chọn {fare.type}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedFare && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {fareClasses.find((f) => f.id === selectedFare)?.type} đã
                    chọn
                  </p>
                  <p className="text-xs text-green-600">
                    Tổng cộng:{" "}
                    {formatCurrency(
                      fareClasses.find((f) => f.id === selectedFare)?.price
                    )}{" "}
                    mỗi người
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleProceedToBooking(selectedFare)}
                >
                  Đặt ngay <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Flight Information Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50 rounded-t-lg border-b">
              <TabsTrigger value="details" className="text-sm">
                Chi tiết chuyến bay
              </TabsTrigger>
              <TabsTrigger value="policies" className="text-sm">
                Chính sách
              </TabsTrigger>
              <TabsTrigger value="amenities" className="text-sm">
                Tiện ích
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="details" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                      Lịch trình chuyến bay
                    </h3>
                    <div className="relative">
                      <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200"></div>

                      <div className="flex items-start space-x-4 mb-8">
                        <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center relative z-10">
                          <Plane className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              Khởi hành
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                            >
                              Đúng giờ
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {flightInfo.departure.time}
                          </p>
                          <p className="text-gray-600">
                            {flightInfo.departure.date}
                          </p>
                          <p className="text-lg font-medium text-gray-800 mt-1">
                            {flightInfo.departure.city}
                          </p>
                          <p className="text-sm text-gray-500">
                            Terminal 4, Cổng A12
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mb-8 ml-8">
                        <div className="flex-grow border-l-2 border-dashed border-gray-300 pl-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Thời gian bay
                              </span>
                              <span className="font-semibold text-gray-900">
                                {flightInfo.duration}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm text-gray-600">
                                Máy bay
                              </span>
                              <span className="font-semibold text-gray-900">
                                {flightInfo.aircraft}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center relative z-10">
                          <MapPin className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              Đến nơi
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                            >
                              Đúng giờ
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {flightInfo.arrival.time}
                          </p>
                          <p className="text-gray-600">
                            {flightInfo.arrival.date}
                          </p>
                          <p className="text-lg font-medium text-gray-800 mt-1">
                            {flightInfo.arrival.city}
                          </p>
                          <p className="text-sm text-gray-500">
                            Terminal 7, Cổng B15
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Thông tin chuyến bay
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Số hiệu:</span>
                          <span className="font-medium">
                            {flightInfo.flightNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Loại máy bay:</span>
                          <span className="font-medium">
                            {flightInfo.aircraft}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Khoảng cách:</span>
                          <span className="font-medium">2,475 dặm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Vận hành bởi:</span>
                          <span className="font-medium">
                            {flightInfo.airline}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Thông tin làm thủ tục
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Check-in online:
                          </span>
                          <span className="font-medium">24h trước giờ bay</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Check-in sân bay:
                          </span>
                          <span className="font-medium">2h trước giờ bay</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lên máy bay:</span>
                          <span className="font-medium">30p trước giờ bay</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Đóng cổng:</span>
                          <span className="font-medium">10p trước giờ bay</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="policies" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                      Chính sách hành lý
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Package className="w-5 h-5 text-blue-600 mr-2" />
                          <h4 className="font-semibold">Hành lý xách tay</h4>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Trọng lượng tối đa: 7kg</li>
                          <li>• Kích thước tối đa: 56 x 36 x 23 cm</li>
                          <li>• 1 kiện bao gồm trong tất cả vé</li>
                          <li>• Phải vừa ngăn hành lý trên đầu</li>
                        </ul>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Luggage className="w-5 h-5 text-blue-600 mr-2" />
                          <h4 className="font-semibold">Hành lý ký gửi</h4>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Phổ thông: 1 x 23kg bao gồm</li>
                          <li>• Thương gia: 2 x 32kg bao gồm</li>
                          <li>• Kích thước tối đa: 158cm tổng</li>
                          <li>• Có thể mua thêm hành lý</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                      Hủy & Thay đổi
                    </h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                        <h4 className="font-semibold text-yellow-800">
                          Thông báo quan trọng
                        </h4>
                      </div>
                      <p className="text-sm text-yellow-700">
                        Điều kiện vé thay đổi theo loại vé. Vui lòng xem quy
                        định cụ thể trước khi đặt.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Phổ thông cơ bản</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Không được thay đổi</li>
                          <li>• Không hoàn tiền</li>
                          <li>• Không chuyển nhượng</li>
                        </ul>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">
                          Phổ thông tiêu chuẩn
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>
                            • Thay đổi: phí 3.600.000₫ + chênh lệch giá vé
                          </li>
                          <li>• Hủy: phí 4.800.000₫</li>
                          <li>• Hủy miễn phí trong 24h</li>
                        </ul>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Thương gia</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Thay đổi miễn phí (áp dụng chênh lệch giá)</li>
                          <li>• Hủy miễn phí đến 2h trước</li>
                          <li>• Hoàn tiền đầy đủ trong 24h</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="amenities" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                      Dịch vụ trên chuyến bay
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          icon: Wifi,
                          title: "Wi-Fi miễn phí",
                          desc: "Internet tốc độ cao miễn phí",
                        },
                        {
                          icon: Monitor,
                          title: "Giải trí",
                          desc: "Màn hình cá nhân với 1000+ lựa chọn",
                        },
                        {
                          icon: Utensils,
                          title: "Ẩm thực",
                          desc: "Bữa ăn cao cấp và đồ uống hảo hạng",
                        },
                        {
                          icon: Headphones,
                          title: "Âm thanh cao cấp",
                          desc: "Tai nghe chống ồn được cung cấp",
                        },
                        {
                          icon: Bed,
                          title: "Thoải mái",
                          desc: "Gối đầu điều chỉnh và chăn",
                        },
                        {
                          icon: Zap,
                          title: "Ổ cắm điện",
                          desc: "Cổng USB và điện tại mỗi ghế",
                        },
                      ].map((amenity, idx) => (
                        <div
                          key={idx}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center mb-2">
                            <amenity.icon className="w-6 h-6 text-blue-600 mr-3" />
                            <h4 className="font-semibold">{amenity.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600">
                            {amenity.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                      Cấu hình ghế ngồi
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Hạng phổ thông</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Khoảng cách ghế: 31-32 inch</li>
                            <li>• Độ rộng ghế: 17-18 inch</li>
                            <li>• Cấu hình 3-3-3</li>
                            <li>• Gối đầu điều chỉnh</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">
                            Hạng thương gia
                          </h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Khoảng cách ghế: 60+ inch</li>
                            <li>• Độ rộng ghế: 21 inch</li>
                            <li>• Cấu hình 2-2-2</li>
                            <li>• Ghế nằm phẳng</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default FlightDetail;
