"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  // Updated seats array to mimic A330 layout: 2-4-2 configuration (A B | C D E F | G H)
  // Approximately 40 rows for realism, with different sections:
  // Rows 1-5: Special (red, e.g., business/premium)
  // Rows 6-15: Front (purple)
  // Rows 16-20: Extra legroom/exit (blue)
  // Rows 21-40: Standard (green)
  // Randomly mark some as occupied for realism
  const generateSeats = () => {
    const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seats = [];
    const totalRows = 40;

    for (let row = 1; row <= totalRows; row++) {
      columns.forEach((col) => {
        let status = 'available';
        let priceVND = 0;
        let priceUSD = 0;

        if (row <= 5) {
          status = 'special'; // Red, special seats
          priceVND = 90000;
          priceUSD = 4; // Approximate conversion, 1 USD ~ 23,000 VND
        } else if (row <= 15) {
          status = 'front'; // Purple, front seats
          priceVND = 40000;
          priceUSD = 2;
        } else if (row <= 20) {
          status = 'legroom'; // Blue, extra legroom
          priceVND = 90000;
          priceUSD = 4;
        } else {
          status = 'standard'; // Green, standard
          priceVND = 30000;
          priceUSD = 1;
        }

        // Randomly occupy ~20% of seats for realism
        if (Math.random() < 0.2 && status !== 'special') {
          status = 'occupied';
        }

        seats.push({
          row: `${row}${col}`,
          status,
          priceUSD,
          priceVND,
        });
      });
    }
    return seats;
  };

  const seats = generateSeats();

  const seatLegend = [
    {
      status: "special",
      color: "bg-red-500",
      label: "Special",
      price: "$4",
    },
    {
      status: "front",
      color: "bg-purple-500",
      label: "Front",
      price: "$2",
    },
    {
      status: "legroom",
      color: "bg-blue-500",
      label: "Extra Legroom",
      price: "$4",
    },
    {
      status: "standard",
      color: "bg-green-500",
      label: "Standard",
      price: "$1",
    },
    {
      status: "occupied",
      color: "bg-gray-500",
      label: "Occupied",
      price: "N/A",
    },
    {
      status: "selected",
      color: "bg-yellow-500",
      label: "Selected",
      price: "Varies",
    },
  ];

  const handleSeatSelect = (seatRow) => {
    const seat = seats.find((s) => s.row === seatRow);
    if (seat && seat.status !== "occupied") {
      setSelectedSeats((prev) =>
        prev.includes(seatRow)
          ? prev.filter((s) => s !== seatRow)
          : [...prev, seatRow].slice(0, 1) // Limit to 1 seat for 1 passenger
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

  const calculateSeatPrice = (seat) => seat?.priceUSD || 0;

  const calculateTotal = () => {
    let total = 299; // Base fare
    total += 45; // Taxes & Fees

    // Seat fees
    selectedSeats.forEach((seatRow) => {
      const seat = seats.find((s) => s.row === seatRow);
      if (seat) {
        total += calculateSeatPrice(seat);
      }
    });

    total +=
      baggage.passenger1.firstBag * 50 + baggage.passenger1.secondBag * 65; // Baggage fees
    total += additionalServices.travelInsurance ? 29 : 0;
    total += additionalServices.inFlightMeal ? 18 : 0;
    total += additionalServices.priorityBoarding ? 12 : 0;
    return total;
  };

  const getSeatPrice = () => {
    let seatTotal = 0;
    selectedSeats.forEach((seatRow) => {
      const seat = seats.find((s) => s.row === seatRow);
      if (seat) {
        seatTotal += calculateSeatPrice(seat);
      }
    });
    return seatTotal;
  };

  // Render aircraft layout with aisles (gaps between columns)
  const renderAircraftLayout = () => {
    const rows = [];
    const columnsPerRow = 8; // A B (left) | gap | C D E F (middle) | gap | G H (right)

    for (let i = 0; i < seats.length; i += columnsPerRow) {
      const rowSeats = seats.slice(i, i + columnsPerRow);
      rows.push(
        <div key={i} className="flex justify-center items-center gap-2 mb-2">
          {/* Left wing: A B */}
          {rowSeats.slice(0, 2).map((seat) => renderSeatButton(seat))}
          {/* Aisle gap */}
          <div className="w-4" />
          {/* Middle: C D E F */}
          {rowSeats.slice(2, 6).map((seat) => renderSeatButton(seat))}
          {/* Aisle gap */}
          <div className="w-4" />
          {/* Right wing: G H */}
          {rowSeats.slice(6, 8).map((seat) => renderSeatButton(seat))}
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
                : seat.status === "special"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : seat.status === "front"
                ? "bg-purple-500 hover:bg-purple-600 text-white"
                : seat.status === "legroom"
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
            disabled={seat.status === "occupied"}
          >
            {seat.row}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{seatLegend.find((l) => l.status === seat.status)?.label}</p>
          <p>Giá: {seatLegend.find((l) => l.status === seat.status)?.price}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select Optional Extras
          </h1>
          <p className="text-gray-600">
            Enhance your journey with additional services
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seat Selection Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Seat Selection -  A330
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Seat Legend */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-gray-700">
                    Seat Legend
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

                {/* Aircraft Layout - Scrollable for many rows */}
                <div className="bg-white p-6 rounded-lg border max-h-[600px] overflow-y-auto">
                  <div className="text-center mb-4">
                    <Badge variant="secondary">Aircraft Layout (A330)</Badge>
                    <p className="text-sm text-gray-500 mt-2">Cuộn xuống để xem thêm hàng ghế</p>
                  </div>

                  <div className="max-w-md mx-auto">
                    {renderAircraftLayout()}
                  </div>

                  {selectedSeats.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">
                        Selected Seats: {selectedSeats.join(", ")}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Total seat cost: ${getSeatPrice()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Baggage Card (unchanged) */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Baggage Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-green-700 font-medium">
                    ✅ Included: 1 carry-on bag (10kg)
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700">
                    Checked Baggage - Passenger 1
                  </h4>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">First Bag (23kg)</Label>
                        <p className="text-sm text-gray-500">
                          Standard checked baggage
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
                        <span className="ml-3 font-bold text-blue-600 min-w-[60px]">
                          ${baggage.passenger1.firstBag * 50}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">Second Bag (23kg)</Label>
                        <p className="text-sm text-gray-500">
                          Additional checked baggage
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
                        <span className="ml-3 font-bold text-blue-600 min-w-[60px]">
                          ${baggage.passenger1.secondBag * 65}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Services Card (unchanged) */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Additional Services
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
                          Travel Insurance
                        </Label>
                        <p className="text-sm text-gray-500">
                          Comprehensive coverage for your trip
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-blue-600">$29</span>
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
                          In-flight Meal
                        </Label>
                        <p className="text-sm text-gray-500">
                          Delicious meal served during your flight
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-blue-600">$18</span>
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
                          Priority Boarding
                        </Label>
                        <p className="text-sm text-gray-500">
                          Board the aircraft before other passengers
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-blue-600">$12</span>
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
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Base Fare (1 passenger)
                      </span>
                      <span className="font-medium">$299</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxes & Fees</span>
                      <span className="font-medium">$45</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Seat Selection</span>
                      <span className="font-medium">${getSeatPrice()}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Baggage</span>
                      <span className="font-medium">
                        $
                        {baggage.passenger1.firstBag * 50 +
                          baggage.passenger1.secondBag * 65}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Additional Services</span>
                      <span className="font-medium">
                        $
                        {(additionalServices.travelInsurance ? 29 : 0) +
                          (additionalServices.inFlightMeal ? 18 : 0) +
                          (additionalServices.priorityBoarding ? 12 : 0)}
                      </span>
                    </div>

                    <hr className="border-gray-200" />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">${calculateTotal()}</span>
                    </div>

                    <div className="space-y-3 mt-6">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3">
                        Continue to Payment
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