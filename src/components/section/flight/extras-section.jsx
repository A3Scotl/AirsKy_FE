"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Format currency function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount * 24000);
};

const Extras = () => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [baggage, setBaggage] = useState({
    passenger1: { firstBag: 0, secondBag: 0 },
  });
  const [additionalServices, setAdditionalServices] = useState({
    travelInsurance: false,
    inFlightMeal: false,
    priorityBoarding: false,
  });

  // Optimized seat configuration with Vietnamese pricing
  const seatConfig = {
    columns: ["A", "B", "C", "D", "E", "F", "G", "H"],
    totalRows: 40,
    pricing: {
      special: {
        priceVND: 96000,
        priceUSD: 4,
        label: "Đặc biệt",
        color: "bg-red-500",
      },
      front: {
        priceVND: 48000,
        priceUSD: 2,
        label: "Phía trước",
        color: "bg-purple-500",
      },
      legroom: {
        priceVND: 96000,
        priceUSD: 4,
        label: "Chỗ để chân rộng",
        color: "bg-blue-500",
      },
      standard: {
        priceVND: 24000,
        priceUSD: 1,
        label: "Tiêu chuẩn",
        color: "bg-green-500",
      },
      occupied: {
        priceVND: 0,
        priceUSD: 0,
        label: "Đã đặt",
        color: "bg-gray-500",
      },
      selected: {
        priceVND: 0,
        priceUSD: 0,
        label: "Đã chọn",
        color: "bg-yellow-500",
      },
    },
  };

  // Generate seats with optimized logic
  const generateSeats = () => {
    const seats = [];
    for (let row = 1; row <= seatConfig.totalRows; row++) {
      seatConfig.columns.forEach((col) => {
        let seatType = "standard";

        if (row <= 5) seatType = "special";
        else if (row <= 15) seatType = "front";
        else if (row <= 20) seatType = "legroom";

        // Random occupation for realism
        if (Math.random() < 0.2 && seatType !== "special") {
          seatType = "occupied";
        }

        const config = seatConfig.pricing[seatType];
        seats.push({
          row: `${row}${col}`,
          status: seatType,
          priceUSD: config.priceUSD,
          priceVND: config.priceVND,
        });
      });
    }
    return seats;
  };

  const seats = generateSeats();

  // Vietnamese seat legend with VND pricing
  const seatLegend = Object.entries(seatConfig.pricing).map(
    ([status, config]) => ({
      status,
      color: config.color,
      label: config.label,
      price: config.priceUSD > 0 ? formatCurrency(config.priceUSD) : "N/A",
    })
  );

  // Optimized handlers
  const handleSeatSelect = (seatRow) => {
    const seat = seats.find((s) => s.row === seatRow);
    if (seat?.status !== "occupied") {
      setSelectedSeats(
        (prev) =>
          prev.includes(seatRow)
            ? prev.filter((s) => s !== seatRow)
            : [...prev, seatRow].slice(0, 1) // Limit to 1 seat
      );
    }
  };

  const handleBaggageChange = (passenger, bagType, value) => {
    setBaggage((prev) => ({
      ...prev,
      [passenger]: {
        ...prev[passenger],
        [bagType]: Math.max(0, Math.min(2, prev[passenger][bagType] + value)),
      },
    }));
  };

  const handleServiceChange = (service) => {
    setAdditionalServices((prev) => ({
      ...prev,
      [service]: !prev[service],
    }));
  };

  // Pricing calculations with Vietnamese base prices
  const baseFare = 299;
  const taxesFees = 45;
  const baggagePrices = { firstBag: 50, secondBag: 65 };
  const servicePrices = {
    travelInsurance: 29,
    inFlightMeal: 18,
    priorityBoarding: 12,
  };

  const getSeatPrice = () =>
    selectedSeats.reduce((total, seatRow) => {
      const seat = seats.find((s) => s.row === seatRow);
      return total + (seat?.priceUSD || 0);
    }, 0);

  const getBaggagePrice = () =>
    baggage.passenger1.firstBag * baggagePrices.firstBag +
    baggage.passenger1.secondBag * baggagePrices.secondBag;

  const getServicesPrice = () =>
    Object.entries(additionalServices).reduce(
      (total, [service, selected]) =>
        total + (selected ? servicePrices[service] : 0),
      0
    );

  const calculateTotal = () =>
    baseFare +
    taxesFees +
    getSeatPrice() +
    getBaggagePrice() +
    getServicesPrice();

  // Optimized aircraft layout rendering
  const renderAircraftLayout = () => {
    const rows = [];
    for (let i = 0; i < seats.length; i += 8) {
      const rowSeats = seats.slice(i, i + 8);
      rows.push(
        <div key={i} className="flex justify-center items-center gap-2 mb-2">
          {/* Left: A B */}
          {rowSeats.slice(0, 2).map(renderSeatButton)}
          <div className="w-4" />
          {/* Middle: C D E F */}
          {rowSeats.slice(2, 6).map(renderSeatButton)}
          <div className="w-4" />
          {/* Right: G H */}
          {rowSeats.slice(6, 8).map(renderSeatButton)}
        </div>
      );
    }
    return rows;
  };

  const renderSeatButton = (seat) => (
    <TooltipProvider key={seat.row}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => handleSeatSelect(seat.row)}
            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-all duration-300 hover:scale-110 ${
              seat.status === "occupied"
                ? "bg-gray-500 text-white cursor-not-allowed"
                : selectedSeats.includes(seat.row)
                ? "bg-yellow-500 text-black ring-2 ring-yellow-300 animate-pulse"
                : seatConfig.pricing[seat.status]?.color +
                  " hover:opacity-80 text-white"
            }`}
            disabled={seat.status === "occupied"}
          >
            {seat.row}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{seatConfig.pricing[seat.status]?.label}</p>
          <p>Giá: {formatCurrency(seat.priceUSD)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700">
      <div className="max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
            Chọn Dịch Vụ Bổ Sung
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Nâng cao trải nghiệm chuyến bay với các dịch vụ thêm
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seat Selection Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Chọn Chỗ Ngồi - A330
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Seat Legend */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-gray-700">
                    Chú Thích Ghế
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
                    {seatLegend.map((legend) => (
                      <div
                        key={legend.status}
                        className="flex items-center gap-2"
                      >
                        <div
                          className={`w-4 h-4 rounded ${legend.color} border`}
                        ></div>
                        <div className="text-sm">
                          <div className="font-medium text-gray-700">
                            {legend.label}
                          </div>
                          <div className="text-gray-500">{legend.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Aircraft Layout */}
                <div className="bg-white p-6 rounded-lg border max-h-[600px] overflow-y-auto">
                  <div className="text-center mb-4">
                    <Badge variant="secondary">Sơ đồ máy bay (A330)</Badge>
                    <p className="text-sm text-gray-500 mt-2">
                      Cuộn xuống để xem thêm hàng ghế
                    </p>
                  </div>

                  <div className="max-w-md mx-auto">
                    {renderAircraftLayout()}
                  </div>

                  {selectedSeats.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">
                        Ghế đã chọn: {selectedSeats.join(", ")}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Tổng chi phí ghế: {formatCurrency(getSeatPrice())}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Baggage Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Tùy Chọn Hành Lý
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-green-700 font-medium">
                    ✅ Bao gồm: 1 túi xách tay (10kg)
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700">
                    Hành Lý Ký Gửi - Hành khách 1
                  </h4>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">
                          Túi đầu tiên (23kg)
                        </Label>
                        <p className="text-sm text-gray-500">
                          Hành lý ký gửi tiêu chuẩn
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleBaggageChange("passenger1", "firstBag", -1)
                          }
                          disabled={baggage.passenger1.firstBag === 0}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {baggage.passenger1.firstBag}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleBaggageChange("passenger1", "firstBag", 1)
                          }
                          disabled={baggage.passenger1.firstBag === 2}
                        >
                          +
                        </Button>
                        <span className="ml-3 font-bold text-blue-600 min-w-[80px]">
                          {formatCurrency(
                            baggage.passenger1.firstBag * baggagePrices.firstBag
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">
                          Túi thứ hai (23kg)
                        </Label>
                        <p className="text-sm text-gray-500">
                          Hành lý ký gửi bổ sung
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleBaggageChange("passenger1", "secondBag", -1)
                          }
                          disabled={baggage.passenger1.secondBag === 0}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {baggage.passenger1.secondBag}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleBaggageChange("passenger1", "secondBag", 1)
                          }
                          disabled={baggage.passenger1.secondBag === 2}
                        >
                          +
                        </Button>
                        <span className="ml-3 font-bold text-blue-600 min-w-[80px]">
                          {formatCurrency(
                            baggage.passenger1.secondBag *
                              baggagePrices.secondBag
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Services Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Dịch Vụ Bổ Sung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="travel-insurance"
                        checked={additionalServices.travelInsurance}
                        onCheckedChange={() =>
                          handleServiceChange("travelInsurance")
                        }
                      />
                      <div>
                        <Label
                          htmlFor="travel-insurance"
                          className="font-medium cursor-pointer"
                        >
                          Bảo Hiểm Du Lịch
                        </Label>
                        <p className="text-sm text-gray-500">
                          Bảo hiểm toàn diện cho chuyến đi
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(servicePrices.travelInsurance)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="in-flight-meal"
                        checked={additionalServices.inFlightMeal}
                        onCheckedChange={() =>
                          handleServiceChange("inFlightMeal")
                        }
                      />
                      <div>
                        <Label
                          htmlFor="in-flight-meal"
                          className="font-medium cursor-pointer"
                        >
                          Suất Ăn Trên Máy Bay
                        </Label>
                        <p className="text-sm text-gray-500">
                          Bữa ăn ngon được phục vụ trong chuyến bay
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(servicePrices.inFlightMeal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="priority-boarding"
                        checked={additionalServices.priorityBoarding}
                        onCheckedChange={() =>
                          handleServiceChange("priorityBoarding")
                        }
                      />
                      <div>
                        <Label
                          htmlFor="priority-boarding"
                          className="font-medium cursor-pointer"
                        >
                          Lên Máy Bay Ưu Tiên
                        </Label>
                        <p className="text-sm text-gray-500">
                          Lên máy bay trước các hành khách khác
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(servicePrices.priorityBoarding)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Summary (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="shadow-lg border-2 border-blue-100">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    Tóm Tắt Đặt Vé
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Giá vé cơ bản (1 hành khách)
                      </span>
                      <span className="font-medium">
                        {formatCurrency(baseFare)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Thuế & Phí</span>
                      <span className="font-medium">
                        {formatCurrency(taxesFees)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Chọn chỗ ngồi</span>
                      <span className="font-medium">
                        {formatCurrency(getSeatPrice())}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Hành lý</span>
                      <span className="font-medium">
                        {formatCurrency(getBaggagePrice())}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Dịch vụ bổ sung</span>
                      <span className="font-medium">
                        {formatCurrency(getServicesPrice())}
                      </span>
                    </div>

                    <hr className="border-gray-200" />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Tổng cộng</span>
                      <span className="text-blue-600">
                        {formatCurrency(calculateTotal())}
                      </span>
                    </div>

                    <div className="space-y-3 mt-6">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3">
                        Tiếp tục thanh toán
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Extras;
