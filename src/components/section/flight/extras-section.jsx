"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { flightApi } from "@/apis/flight-api";
import { handleFetch } from "@/utils/fetch-helper";
import PropTypes from "prop-types";
import { toast } from "sonner";

// Utility function to format currency in VND
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount * 24000);
};

// Constants
const SEAT_PRICING = {
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
  occupied: { priceVND: 0, priceUSD: 0, label: "Đã đặt", color: "bg-gray-500" },
  pending: {
    priceVND: 0,
    priceUSD: 0,
    label: "Đang chờ thanh toán",
    color: "bg-orange-500",
  },
  selected: {
    priceVND: 0,
    priceUSD: 0,
    label: "Đã chọn",
    color: "bg-yellow-500",
  },
};

const BAGGAGE_PRICES = { firstBag: 50, secondBag: 65 };
const SERVICE_PRICES = {
  travelInsurance: 29,
  inFlightMeal: 18,
  priorityBoarding: 12,
};
const BASE_FARE = 299;
const TAXES_FEES = 45;

// Map API status to UI status
const mapApiStatusToUiStatus = (apiStatus, seatNumber) => {
  if (apiStatus === "BOOKED") return "occupied";
  if (apiStatus === "PENDING_PAYMENT") return "pending";
  // Example logic for seat type based on seatNumber (customize as needed)
  if (seatNumber.startsWith("1") || seatNumber.startsWith("2")) return "front";
  if (seatNumber.includes("A") || seatNumber.includes("F")) return "legroom";
  return "standard"; // Default to standard
};

// Skeleton component for seat selection
const SeatSkeleton = () => (
  <div className="bg-white p-6 rounded-lg border max-h-[600px] overflow-y-auto">
    <div className="text-center mb-4">
      <div className="h-6 w-24 mx-auto bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-48 mx-auto mt-2 bg-gray-200 rounded animate-pulse" />
    </div>
    <div className="max-w-md mx-auto">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex justify-center items-center gap-2 mb-2">
          {[...Array(8)].map((_, j) => (
            <div
              key={j}
              className="w-8 h-8 rounded bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Seat Legend component
const SeatLegend = ({ seatLegend }) => (
  <div className="mb-6">
    <h4 className="font-semibold mb-3 text-gray-700">Chú Thích Ghế</h4>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
      {seatLegend.map((legend) => (
        <div key={legend.status} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded ${legend.color} border`}></div>
          <div className="text-sm">
            <div className="font-medium text-gray-700">{legend.label}</div>
            <div className="text-gray-500">{legend.price}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Aircraft Layout component
const AircraftLayout = ({
  seats,
  selectedSeats,
  passengers,
  handleSeatSelect,
}) => {
  const rows = [];
  for (let i = 0; i < seats.length; i += 8) {
    const rowSeats = seats.slice(i, i + 8);
    rows.push(
      <div key={i} className="flex justify-center items-center gap-2 mb-2">
        {rowSeats
          .slice(0, 2)
          .map((seat) =>
            renderSeatButton(seat, passengers, selectedSeats, handleSeatSelect)
          )}
        <div className="w-4" />
        {rowSeats
          .slice(2, 6)
          .map((seat) =>
            renderSeatButton(seat, passengers, selectedSeats, handleSeatSelect)
          )}
        <div className="w-4" />
        {rowSeats
          .slice(6, 8)
          .map((seat) =>
            renderSeatButton(seat, passengers, selectedSeats, handleSeatSelect)
          )}
      </div>
    );
  }
  return rows;
};

// Helper to render seat button
const renderSeatButton = (
  seat,
  passengers,
  selectedSeats,
  handleSeatSelect
) => (
  <TooltipProvider key={seat.seatNumber}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col gap-1">
          {passengers.map((_, index) => (
            <button
              key={`${seat.seatNumber}-p${index}`}
              onClick={() => handleSeatSelect(seat.seatNumber, index)}
              className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-all duration-300 hover:scale-110 ${
                seat.status === "occupied" || seat.status === "pending"
                  ? "bg-gray-500 text-white cursor-not-allowed"
                  : selectedSeats[`passenger${index + 1}`] === seat.seatNumber
                  ? "bg-yellow-500 text-black ring-2 ring-yellow-300 animate-pulse"
                  : SEAT_PRICING[seat.status]?.color +
                    " hover:opacity-80 text-white"
              }`}
              disabled={seat.status === "occupied" || seat.status === "pending"}
              title={`Hành khách ${index + 1}`}
            >
              {seat.seatNumber}
            </button>
          ))}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{SEAT_PRICING[seat.status]?.label || "Đang chờ thanh toán"}</p>
        <p>
          Giá:{" "}
          {seat.status === "pending" || seat.status === "occupied"
            ? "N/A"
            : formatCurrency(seat.priceVND)}
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// Selected Seats Summary
const SelectedSeatsSummary = ({ selectedSeats, getSeatPrice }) =>
  Object.keys(selectedSeats).length > 0 && (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      {Object.entries(selectedSeats).map(([passenger, seatNumber]) => (
        <p key={passenger} className="text-sm font-medium text-blue-800">
          {passenger}: {seatNumber}
        </p>
      ))}
      <p className="text-xs text-blue-600 mt-1">
        Tổng chi phí ghế: {formatCurrency(getSeatPrice())}
      </p>
    </div>
  );

// Seat Selection Card
const SeatSelectionCard = ({
  flight,
  fare,
  formData,
  selectedSeats,
  setSelectedSeats,
  seats,
  loading,
  seatLegend,
}) => {
  const passengers = formData.passengers;

  const handleSeatSelect = (seatNumber, passengerIndex) => {
    const seat = seats.find((s) => s.seatNumber === seatNumber);
    if (seat?.status !== "occupied" && seat?.status !== "pending") {
      setSelectedSeats((prev) => {
        const newSeats = { ...prev };
        Object.keys(newSeats).forEach((key) => {
          if (
            newSeats[key] === seatNumber &&
            key !== `passenger${passengerIndex + 1}`
          ) {
            delete newSeats[key];
          }
        });
        if (newSeats[`passenger${passengerIndex + 1}`] === seatNumber) {
          delete newSeats[`passenger${passengerIndex + 1}`];
        } else {
          newSeats[`passenger${passengerIndex + 1}`] = seatNumber;
        }
        return newSeats;
      });
    }
  };

  const getSeatPrice = () =>
    Object.values(selectedSeats).reduce((total, seatNumber) => {
      const seat = seats.find((s) => s.seatNumber === seatNumber);
      return total + (seat?.priceVND || 0);
    }, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Chọn Chỗ Ngồi - A330
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <SeatSkeleton />
        ) : (
          <>
            <SeatLegend seatLegend={seatLegend} />
            <div className="bg-white p-6 rounded-lg border max-h-[600px] overflow-y-auto">
              <div className="text-center mb-4">
                <Badge variant="secondary">Sơ đồ máy bay (A330)</Badge>
                <p className="text-sm text-gray-500 mt-2">
                  Cuộn xuống để xem thêm hàng ghế
                </p>
              </div>
              <div className="max-w-md mx-auto">
                <AircraftLayout
                  seats={seats}
                  selectedSeats={selectedSeats}
                  passengers={passengers}
                  handleSeatSelect={handleSeatSelect}
                />
              </div>
              <SelectedSeatsSummary
                selectedSeats={selectedSeats}
                getSeatPrice={getSeatPrice}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Baggage Option for a single passenger
const BaggageOption = ({
  passengerIndex,
  passengerType,
  baggage,
  handleBaggageChange,
}) => (
  <div className="space-y-4">
    <h4 className="font-semibold text-gray-700">
      Hành Lý Ký Gửi - Hành khách {passengerIndex + 1} ({passengerType})
    </h4>
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <Label className="font-medium">Túi đầu tiên (23kg)</Label>
        <p className="text-sm text-gray-500">Hành lý ký gửi tiêu chuẩn</p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleBaggageChange(
              `passenger${passengerIndex + 1}`,
              "firstBag",
              -1
            )
          }
          disabled={baggage[`passenger${passengerIndex + 1}`]?.firstBag === 0}
        >
          -
        </Button>
        <span className="w-8 text-center font-medium">
          {baggage[`passenger${passengerIndex + 1}`]?.firstBag || 0}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleBaggageChange(`passenger${passengerIndex + 1}`, "firstBag", 1)
          }
          disabled={baggage[`passenger${passengerIndex + 1}`]?.firstBag === 2}
        >
          +
        </Button>
        <span className="ml-3 font-bold text-blue-600 min-w-[80px]">
          {formatCurrency(
            (baggage[`passenger${passengerIndex + 1}`]?.firstBag || 0) *
              BAGGAGE_PRICES.firstBag
          )}
        </span>
      </div>
    </div>
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <Label className="font-medium">Túi thứ hai (23kg)</Label>
        <p className="text-sm text-gray-500">Hành lý ký gửi bổ sung</p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleBaggageChange(
              `passenger${passengerIndex + 1}`,
              "secondBag",
              -1
            )
          }
          disabled={baggage[`passenger${passengerIndex + 1}`]?.secondBag === 0}
        >
          -
        </Button>
        <span className="w-8 text-center font-medium">
          {baggage[`passenger${passengerIndex + 1}`]?.secondBag || 0}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleBaggageChange(
              `passenger${passengerIndex + 1}`,
              "secondBag",
              1
            )
          }
          disabled={baggage[`passenger${passengerIndex + 1}`]?.secondBag === 2}
        >
          +
        </Button>
        <span className="ml-3 font-bold text-blue-600 min-w-[80px]">
          {formatCurrency(
            (baggage[`passenger${passengerIndex + 1}`]?.secondBag || 0) *
              BAGGAGE_PRICES.secondBag
          )}
        </span>
      </div>
    </div>
  </div>
);

// Baggage Options Card
const BaggageOptionsCard = ({ formData, baggage, setBaggage }) => {
  const handleBaggageChange = (passenger, bagType, value) => {
    setBaggage((prev) => ({
      ...prev,
      [passenger]: {
        ...prev[passenger],
        [bagType]: Math.max(0, Math.min(2, prev[passenger][bagType] + value)),
      },
    }));
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Tùy Chọn Hành Lý
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-green-700 font-medium">
            ✅ Bao gồm: 1 túi xách tay (10kg) mỗi hành khách
          </p>
        </div>
        <div className="space-y-4">
          {formData.passengers.map((passenger, index) => (
            <BaggageOption
              key={`passenger${index + 1}`}
              passengerIndex={index}
              passengerType={passenger.type}
              baggage={baggage}
              handleBaggageChange={handleBaggageChange}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Service Option
const ServiceOption = ({
  id,
  label,
  description,
  checked,
  onChange,
  price,
}) => (
  <div className="flex items-center justify-between p-4 border rounded-lg">
    <div className="flex items-center gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <div>
        <Label htmlFor={id} className="font-medium cursor-pointer">
          {label}
        </Label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
    <span className="font-bold text-blue-600">{formatCurrency(price)}</span>
  </div>
);

// Additional Services Card
const AdditionalServicesCard = ({
  additionalServices,
  setAdditionalServices,
}) => {
  const handleServiceChange = (service) => {
    setAdditionalServices((prev) => ({
      ...prev,
      [service]: !prev[service],
    }));
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Dịch Vụ Bổ Sung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ServiceOption
            id="travel-insurance"
            label="Bảo Hiểm Du Lịch"
            description="Bảo hiểm toàn diện cho chuyến đi"
            checked={additionalServices.travelInsurance}
            onChange={() => handleServiceChange("travelInsurance")}
            price={SERVICE_PRICES.travelInsurance}
          />
          <ServiceOption
            id="in-flight-meal"
            label="Suất Ăn Trên Máy Bay"
            description="Bữa ăn ngon được phục vụ trong chuyến bay"
            checked={additionalServices.inFlightMeal}
            onChange={() => handleServiceChange("inFlightMeal")}
            price={SERVICE_PRICES.inFlightMeal}
          />
          <ServiceOption
            id="priority-boarding"
            label="Lên Máy Bay Ưu Tiên"
            description="Lên máy bay trước các hành khách khác"
            checked={additionalServices.priorityBoarding}
            onChange={() => handleServiceChange("priorityBoarding")}
            price={SERVICE_PRICES.priorityBoarding}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Booking Summary Card
const BookingSummary = ({
  formData,
  getSeatPrice,
  getBaggagePrice,
  getServicesPrice,
  calculateTotal,
}) => (
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
              Giá vé cơ bản ({formData.passengers.length} hành khách)
            </span>
            <span className="font-medium">
              {formatCurrency(BASE_FARE * formData.passengers.length)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Thuế & Phí</span>
            <span className="font-medium">{formatCurrency(TAXES_FEES)}</span>
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
);

// Main Extras Component
const Extras = ({ flight, fare, formData, setExtrasData }) => {
  const [selectedSeats, setSelectedSeats] = useState({});
  const [seats, setSeats] = useState([]);
  const [baggage, setBaggage] = useState(
    formData.passengers.reduce(
      (acc, _, index) => ({
        ...acc,
        [`passenger${index + 1}`]: { firstBag: 0, secondBag: 0 },
      }),
      {}
    )
  );
  const [additionalServices, setAdditionalServices] = useState({
    travelInsurance: false,
    inFlightMeal: false,
    priorityBoarding: false,
  });
  const [loading, setLoading] = useState(false);

  // Fetch seats and transform API data
  useEffect(() => {
    if (flight?.id && fare?.travelClass?.classId) {
      handleFetch({
        apiCall: () =>
          flightApi.getSeatsFlightByFlightIdAndTravelClassId(
            flight.id,
            fare.travelClass.classId
          ),
        setData: (data) =>
          setSeats(
            data.map((seat) => ({
              seatNumber: seat.seatNumber,
              row: seat.seatNumber, // Map seatNumber to row for compatibility
              status: mapApiStatusToUiStatus(seat.status, seat.seatNumber),
              priceVND:
                SEAT_PRICING[
                  mapApiStatusToUiStatus(seat.status, seat.seatNumber)
                ]?.priceVND || 0,
            }))
          ),
        setLoading,
        errorMessage: "Không thể lấy danh sách ghế",
      });
    }
  }, [flight?.id, fare?.travelClass?.classId]);

  // Prepare seat legend
  const seatLegend = Object.entries(SEAT_PRICING).map(([status, config]) => ({
    status,
    color: config.color,
    label: config.label,
    price: config.priceVND > 0 ? formatCurrency(config.priceVND) : "N/A",
  }));

  // Price calculations
  const getSeatPrice = () =>
    Object.values(selectedSeats).reduce((total, seatNumber) => {
      const seat = seats.find((s) => s.seatNumber === seatNumber);
      return total + (seat?.priceVND || 0);
    }, 0);

  const getBaggagePrice = () =>
    Object.values(baggage).reduce(
      (total, bag) =>
        total +
        bag.firstBag * BAGGAGE_PRICES.firstBag +
        bag.secondBag * BAGGAGE_PRICES.secondBag,
      0
    );

  const getServicesPrice = () =>
    Object.entries(additionalServices).reduce(
      (total, [service, selected]) =>
        total + (selected ? SERVICE_PRICES[service] : 0),
      0
    );

  const calculateTotal = () =>
    BASE_FARE * formData.passengers.length +
    TAXES_FEES +
    getSeatPrice() +
    getBaggagePrice() +
    getServicesPrice();

  // Update extras data
  useEffect(() => {
    setExtrasData({
      selectedSeats,
      baggage,
      additionalServices,
      total: calculateTotal(),
    });
  }, [
    selectedSeats,
    baggage,
    additionalServices,
    setExtrasData,
    formData.passengers.length,
  ]);

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
          <div className="lg:col-span-2 space-y-6">
            <SeatSelectionCard
              flight={flight}
              fare={fare}
              formData={formData}
              selectedSeats={selectedSeats}
              setSelectedSeats={setSelectedSeats}
              seats={seats}
              loading={loading}
              seatLegend={seatLegend}
            />
            <BaggageOptionsCard
              formData={formData}
              baggage={baggage}
              setBaggage={setBaggage}
            />
            <AdditionalServicesCard
              additionalServices={additionalServices}
              setAdditionalServices={setAdditionalServices}
            />
          </div>

          <BookingSummary
            formData={formData}
            getSeatPrice={getSeatPrice}
            getBaggagePrice={getBaggagePrice}
            getServicesPrice={getServicesPrice}
            calculateTotal={calculateTotal}
          />
        </div>
      </div>
    </div>
  );
};

Extras.propTypes = {
  flight: PropTypes.shape({
    id: PropTypes.number,
  }).isRequired,
  fare: PropTypes.shape({
    travelClass: PropTypes.shape({
      classId: PropTypes.number,
    }),
  }).isRequired,
  formData: PropTypes.shape({
    passengers: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.oneOf(["ADULT", "CHILD", "INFANT"]),
      })
    ).isRequired,
  }).isRequired,
  setExtrasData: PropTypes.func.isRequired,
};

export default Extras;
