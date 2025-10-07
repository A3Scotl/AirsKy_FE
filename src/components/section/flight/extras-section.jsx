"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { flightApi } from "@/apis/flight-api";
import {
  ancillaryServiceApi,
  getServiceTypeInfo,
} from "@/apis/ancillary-service-api";
import { handleFetch } from "@/utils/fetch-helper";
import PropTypes from "prop-types";
import { toast } from "sonner";
import { formatCurrencyVND } from "@/utils/currency-utils";

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

  selected: {
    priceVND: 0,
    priceUSD: 0,
    label: "Đã chọn",
    color: "bg-yellow-500",
  },
};

const BAGGAGE_PACKAGES = {
  NONE: { weight: 0, price: 0, label: "Không chọn" },
  KG_15: { weight: 15, price: 200000, label: "15kg" },
  KG_20: { weight: 20, price: 300000, label: "20kg" },
  KG_25: { weight: 25, price: 400000, label: "25kg" },
  KG_30: { weight: 30, price: 500000, label: "30kg" },
};
const SERVICE_PRICES = {
  travelInsurance: 29,
  inFlightMeal: 18,
  priorityBoarding: 12,
};

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
        Tổng chi phí ghế: {formatCurrencyVND(getSeatPrice())}
      </p>
    </div>
  );

// Multi-City Seat Selection Card
const MultiCitySeatSelectionCard = ({
  flight,
  formData,
  multiCitySeats,
  setMultiCitySeats,
  multiCitySeatData,
  multiCityLoading,
  multiCityShowSeats,
  setMultiCityShowSeats,
  seatLegend,
}) => {
  const passengers = formData.passengers;

  const handleMultiCitySeatSelect = (
    segmentIndex,
    seatNumber,
    passengerIndex
  ) => {
    const segmentKey = `segment${segmentIndex}`;
    const segmentSeatData = multiCitySeatData[segmentKey] || [];

    const seat = segmentSeatData.find((s) => s.seatNumber === seatNumber);
    if (seat?.status !== "occupied" && seat?.status !== "pending") {
      setMultiCitySeats((prev) => {
        const newSeats = { ...prev };

        // Initialize segment if not exists
        if (!newSeats[segmentKey]) {
          newSeats[segmentKey] = {};
        }

        const segmentSeats = { ...newSeats[segmentKey] };
        const passengerKey = `passenger${passengerIndex + 1}`;

        // Remove seat from other passengers in this segment
        Object.keys(segmentSeats).forEach((key) => {
          if (segmentSeats[key] === seatNumber && key !== passengerKey) {
            delete segmentSeats[key];
          }
        });

        // Toggle seat for current passenger
        if (segmentSeats[passengerKey] === seatNumber) {
          delete segmentSeats[passengerKey];
        } else {
          segmentSeats[passengerKey] = seatNumber;
        }

        newSeats[segmentKey] = segmentSeats;
        return newSeats;
      });
    }
  };

  const getSegmentSeatPrice = (segmentIndex) => {
    const segmentKey = `segment${segmentIndex}`;
    const segmentSeats = multiCitySeats[segmentKey] || {};
    const segmentSeatData = multiCitySeatData[segmentKey] || [];

    return Object.values(segmentSeats).reduce((total, seatNumber) => {
      const seat = segmentSeatData.find((s) => s.seatNumber === seatNumber);
      return total + (seat?.priceVND || 0);
    }, 0);
  };

  const toggleSegmentSeats = (segmentIndex) => {
    const segmentKey = `segment${segmentIndex}`;
    setMultiCityShowSeats((prev) => ({
      ...prev,
      [segmentKey]: !prev[segmentKey],
    }));
  };

  return (
    <div className="space-y-6">
      {flight.legs?.map((leg, segmentIndex) => {
        const segmentKey = `segment${segmentIndex}`;
        const segmentSeats = multiCitySeats[segmentKey] || {};
        const segmentSeatData = multiCitySeatData[segmentKey] || [];
        const isLoading = multiCityLoading[segmentKey];
        const showSeats = multiCityShowSeats[segmentKey];

        return (
          <Card key={segmentKey} className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Chọn Chỗ Ngồi - Chặng {segmentIndex + 1} (
                  {leg.departureAirport?.code || "N/A"} →{" "}
                  {leg.arrivalAirport?.code || "N/A"}) -{" "}
                  {leg.aircraftName || leg.aircraft || "N/A"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSegmentSeats(segmentIndex)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {showSeats ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" /> Thu gọn
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" /> Mở rộng
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showSeats && (
                <div>
                  {isLoading ? (
                    <SeatSkeleton />
                  ) : (
                    <>
                      <SeatLegend seatLegend={seatLegend} />
                      <div className="bg-white p-6 rounded-lg border max-h-[600px] overflow-y-auto">
                        <div className="text-center mb-4">
                          <Badge variant="secondary">
                            Sơ đồ máy bay - Chặng {segmentIndex + 1} (
                            {leg.aircraftName || leg.aircraft || "N/A"})
                          </Badge>
                          <p className="text-sm text-gray-500 mt-2">
                            {leg.departureAirport?.airportName ||
                              leg.departureAirport?.name ||
                              leg.departureAirportName ||
                              leg.fromAirport ||
                              "N/A"}{" "}
                            →{" "}
                            {leg.arrivalAirport?.airportName ||
                              leg.arrivalAirport?.name ||
                              leg.arrivalAirportName ||
                              leg.toAirport ||
                              "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Cuộn xuống để xem thêm hàng ghế
                          </p>
                        </div>
                        <div className="max-w-md mx-auto">
                          <AircraftLayout
                            seats={segmentSeatData}
                            selectedSeats={segmentSeats}
                            passengers={passengers}
                            handleSeatSelect={(seatNumber, passengerIndex) =>
                              handleMultiCitySeatSelect(
                                segmentIndex,
                                seatNumber,
                                passengerIndex
                              )
                            }
                          />
                        </div>
                        <SelectedSeatsSummary
                          selectedSeats={segmentSeats}
                          getSeatPrice={() => getSegmentSeatPrice(segmentIndex)}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

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
  // New props for round-trip
  returnSeats,
  returnLoading,
  selectedReturnSeats,
  setSelectedReturnSeats,
  isRoundTrip = false,
  // Collapsible state props
  showOutboundSeats,
  setShowOutboundSeats,
  showReturnSeats,
  setShowReturnSeats,
}) => {
  const passengers = formData.passengers;

  const handleSeatSelect = (seatNumber, passengerIndex, isReturn = false) => {
    const seatList = isReturn ? returnSeats : seats;
    const setSeats = isReturn ? setSelectedReturnSeats : setSelectedSeats;
    const prefix = isReturn ? "return_passenger" : "passenger";

    const seat = seatList.find((s) => s.seatNumber === seatNumber);
    if (seat?.status !== "occupied" && seat?.status !== "pending") {
      setSeats((prev) => {
        const newSeats = { ...prev };
        Object.keys(newSeats).forEach((key) => {
          if (
            newSeats[key] === seatNumber &&
            key !== `${prefix}${passengerIndex + 1}`
          ) {
            delete newSeats[key];
          }
        });
        if (newSeats[`${prefix}${passengerIndex + 1}`] === seatNumber) {
          delete newSeats[`${prefix}${passengerIndex + 1}`];
        } else {
          newSeats[`${prefix}${passengerIndex + 1}`] = seatNumber;
        }
        return newSeats;
      });
    }
  };

  const getSeatPrice = (seatData, selectedSeatData) =>
    Object.values(selectedSeatData || {}).reduce((total, seatNumber) => {
      const seat = seatData.find((s) => s.seatNumber === seatNumber);
      return total + (seat?.priceVND || 0);
    }, 0);

  return (
    <div className="space-y-6">
      {/* Outbound Flight Seats */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {isRoundTrip ? "Chọn Chỗ Ngồi - Chuyến Đi" : "Chọn Chỗ Ngồi"} -{" "}
              {flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                ? flight.outbound?.aircraftName ||
                  flight.outbound?.aircraft ||
                  "N/A"
                : flight?.flight?.aircraftName ||
                  flight?.flight?.aircraft ||
                  flight?.aircraftName ||
                  flight?.aircraft ||
                  "N/A"}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOutboundSeats(!showOutboundSeats)}
              className="text-blue-600 hover:text-blue-800"
            >
              {showOutboundSeats ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" /> Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" /> Mở rộng
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showOutboundSeats && (
            <div>
              {loading ? (
                <SeatSkeleton />
              ) : (
                <>
                  <SeatLegend seatLegend={seatLegend} />
                  <div className="bg-white p-6 rounded-lg border max-h-[600px] overflow-y-auto">
                    <div className="text-center mb-4">
                      <Badge variant="secondary">
                        Sơ đồ máy bay (
                        {flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                          ? flight.outbound?.aircraftName ||
                            flight.outbound?.aircraft ||
                            "N/A"
                          : flight?.flight?.aircraftName ||
                            flight?.flight?.aircraft ||
                            flight?.aircraftName ||
                            flight?.aircraft ||
                            "N/A"}
                        )
                      </Badge>
                      <p className="text-sm text-gray-500 mt-2">
                        Cuộn xuống để xem thêm hàng ghế
                      </p>
                    </div>
                    <div className="max-w-md mx-auto">
                      <AircraftLayout
                        seats={seats}
                        selectedSeats={selectedSeats}
                        passengers={passengers}
                        handleSeatSelect={(seatNumber, passengerIndex) =>
                          handleSeatSelect(seatNumber, passengerIndex, false)
                        }
                      />
                    </div>
                    <SelectedSeatsSummary
                      selectedSeats={selectedSeats}
                      getSeatPrice={() => getSeatPrice(seats, selectedSeats)}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Flight Seats - Only show for round trip */}
      {isRoundTrip && (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Chọn Chỗ Ngồi - Chuyến Về -{" "}
                {flight.return?.aircraftName ||
                  flight.return?.aircraft ||
                  "N/A"}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReturnSeats(!showReturnSeats)}
                className="text-green-600 hover:text-green-800"
              >
                {showReturnSeats ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" /> Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" /> Mở rộng
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showReturnSeats && (
              <div>
                {returnLoading ? (
                  <SeatSkeleton />
                ) : (
                  <>
                    <SeatLegend seatLegend={seatLegend} />
                    <div className="bg-white p-6 rounded-lg border max-h-[600px] overflow-y-auto">
                      <div className="text-center mb-4">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          Sơ đồ máy bay - Chuyến Về (
                          {flight.return?.aircraftName ||
                            flight.return?.aircraft ||
                            "N/A"}
                          )
                        </Badge>
                        <p className="text-sm text-gray-500 mt-2">
                          Cuộn xuống để xem thêm hàng ghế
                        </p>
                      </div>
                      <div className="max-w-md mx-auto">
                        <AircraftLayout
                          seats={returnSeats}
                          selectedSeats={selectedReturnSeats}
                          passengers={passengers}
                          handleSeatSelect={(seatNumber, passengerIndex) =>
                            handleSeatSelect(seatNumber, passengerIndex, true)
                          }
                        />
                      </div>
                      <SelectedSeatsSummary
                        selectedSeats={selectedReturnSeats}
                        getSeatPrice={() =>
                          getSeatPrice(returnSeats, selectedReturnSeats)
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Baggage Package Selection for a single passenger
const BaggagePackageOption = ({
  passengerIndex,
  passengerType,
  selectedPackage,
  onPackageChange,
}) => (
  <div className="space-y-4">
    <h4 className="font-semibold text-gray-700">
      Hành Lý Ký Gửi - Hành khách {passengerIndex + 1} (
      {passengerType === "ADULT"
        ? "Người lớn"
        : passengerType === "CHILD"
        ? "Trẻ em"
        : "Em bé"}
      )
    </h4>
    <RadioGroup
      value={selectedPackage}
      onValueChange={(value) =>
        onPackageChange(`passenger${passengerIndex + 1}`, value)
      }
      className="space-y-3"
    >
      {Object.entries(BAGGAGE_PACKAGES).map(([packageKey, packageInfo]) => (
        <div
          key={packageKey}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem
              value={packageKey}
              id={`${passengerIndex}-${packageKey}`}
            />
            <div>
              <Label
                htmlFor={`${passengerIndex}-${packageKey}`}
                className="font-medium cursor-pointer"
              >
                {packageInfo.label}
              </Label>
              <p className="text-sm text-gray-500">
                {packageKey === "NONE"
                  ? "Chỉ bao gồm hành lý xách tay (10kg)"
                  : `Hành lý ký gửi ${packageInfo.weight}kg`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-blue-600">
              {formatCurrencyVND(packageInfo.price)}
            </span>
          </div>
        </div>
      ))}
    </RadioGroup>
  </div>
);

// Baggage Options Card
const BaggageOptionsCard = ({ formData, baggage, setBaggage }) => {
  const handlePackageChange = (passenger, packageKey) => {
    setBaggage((prev) => ({
      ...prev,
      [passenger]: packageKey,
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
            <BaggagePackageOption
              key={`passenger${index + 1}`}
              passengerIndex={index}
              passengerType={passenger.type}
              selectedPackage={baggage[`passenger${index + 1}`] || "NONE"}
              onPackageChange={handlePackageChange}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Multi-City Baggage Options Card
const MultiCityBaggageOptionsCard = ({
  formData,
  flight,
  multiCityBaggage,
  setMultiCityBaggage,
}) => {
  const handleMultiCityBaggageChange = (
    segmentIndex,
    passenger,
    packageKey
  ) => {
    const segmentKey = `segment${segmentIndex}`;
    setMultiCityBaggage((prev) => {
      const newBaggage = { ...prev };

      // Initialize segment if not exists
      if (!newBaggage[segmentKey]) {
        newBaggage[segmentKey] = {};
      }

      // Set the selected package for this passenger in this segment
      newBaggage[segmentKey] = {
        ...newBaggage[segmentKey],
        [passenger]: packageKey,
      };

      return newBaggage;
    });
  };

  const getSegmentBaggagePrice = (segmentIndex) => {
    const segmentKey = `segment${segmentIndex}`;
    const segmentBaggage = multiCityBaggage[segmentKey] || {};

    return Object.values(segmentBaggage).reduce((total, packageKey) => {
      const packageInfo = BAGGAGE_PACKAGES[packageKey];
      return total + (packageInfo ? packageInfo.price : 0);
    }, 0);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Tùy Chọn Hành Lý - Multi-City
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-green-700 font-medium">
            ✅ Bao gồm: 1 túi xách tay (10kg) mỗi hành khách cho mỗi chặng
          </p>
        </div>

        <div className="space-y-6">
          {flight.legs?.map((leg, segmentIndex) => {
            const segmentKey = `segment${segmentIndex}`;
            const segmentBaggage = multiCityBaggage[segmentKey] || {};

            return (
              <div key={segmentKey} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-700">
                    Chặng {segmentIndex + 1}:{" "}
                    {leg.departureAirport?.code || "N/A"} →{" "}
                    {leg.arrivalAirport?.code || "N/A"}
                  </h4>
                  <Badge variant="outline" className="text-blue-600">
                    Tổng:{" "}
                    {formatCurrencyVND(getSegmentBaggagePrice(segmentIndex))}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {formData.passengers.map((passenger, passengerIndex) => {
                    const passengerKey = `passenger${passengerIndex + 1}`;
                    const passengerBaggage =
                      segmentBaggage[passengerKey] || "NONE";

                    return (
                      <div key={passengerKey} className="space-y-3">
                        <h5 className="font-medium text-gray-700">
                          Hành khách {passengerIndex + 1} (
                          {passenger.type === "ADULT"
                            ? "Người lớn"
                            : passenger.type === "CHILD"
                            ? "Trẻ em"
                            : "Em bé"}
                          )
                        </h5>

                        {/* Baggage Package Selection */}
                        <RadioGroup
                          value={passengerBaggage || "NONE"}
                          onValueChange={(value) =>
                            handleMultiCityBaggageChange(
                              segmentIndex,
                              passengerKey,
                              value
                            )
                          }
                          className="space-y-3"
                        >
                          {Object.entries(BAGGAGE_PACKAGES).map(
                            ([packageKey, packageInfo]) => (
                              <div
                                key={packageKey}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <RadioGroupItem
                                    value={packageKey}
                                    id={`${segmentKey}-${passengerKey}-${packageKey}`}
                                  />
                                  <div>
                                    <Label
                                      htmlFor={`${segmentKey}-${passengerKey}-${packageKey}`}
                                      className="font-medium cursor-pointer"
                                    >
                                      {packageInfo.label}
                                    </Label>
                                    <p className="text-sm text-gray-500">
                                      {packageKey === "NONE"
                                        ? "Chỉ bao gồm hành lý xách tay (10kg)"
                                        : `Hành lý ký gửi ${packageInfo.weight}kg`}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-blue-600">
                                    {formatCurrencyVND(packageInfo.price)}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </RadioGroup>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
    <span className="font-bold text-blue-600">{formatCurrencyVND(price)}</span>
  </div>
);

// Enhanced Ancillary Services Card with API data
const AncillaryServicesCard = ({
  selectedServices,
  setSelectedServices,
  availableServices,
  loadingServices,
  formData,
}) => {
  const handleServiceChange = (
    serviceId,
    isSelected,
    passengerIndex = null
  ) => {
    setSelectedServices((prev) => {
      const newServices = { ...prev };
      const serviceKey =
        passengerIndex !== null
          ? `${serviceId}_passenger${passengerIndex}`
          : `${serviceId}_booking`;

      if (isSelected) {
        newServices[serviceKey] = {
          serviceId: serviceId,
          passengerId: passengerIndex !== null ? passengerIndex + 1 : null,
          quantity: 1,
          notes: "",
        };
      } else {
        delete newServices[serviceKey];
      }

      return newServices;
    });
  };

  const isServiceSelected = (serviceId, passengerIndex = null) => {
    const serviceKey =
      passengerIndex !== null
        ? `${serviceId}_passenger${passengerIndex}`
        : `${serviceId}_booking`;
    return !!selectedServices[serviceKey];
  };

  if (loadingServices) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🛎️ Dịch Vụ Đi Kèm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group services by type
  const servicesByType = availableServices.reduce((acc, service) => {
    const type = service.serviceType || "OTHER";
    if (!acc[type]) acc[type] = [];
    acc[type].push(service);
    return acc;
  }, {});

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🛎️ Dịch Vụ Đi Kèm
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Chọn các dịch vụ bổ sung để nâng cao trải nghiệm bay của bạn
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(servicesByType).map(([type, services]) => {
            const typeInfo = getServiceTypeInfo(type);
            return (
              <div key={type} className="space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span>{typeInfo.icon}</span>
                  {typeInfo.vietnameseName}
                </h4>
                <div className="space-y-3 pl-4">
                  {services.map((service) => (
                    <AncillaryServiceOption
                      key={service.serviceId}
                      service={service}
                      passengers={formData.passengers}
                      onServiceChange={handleServiceChange}
                      isSelected={isServiceSelected}
                      selectedServices={selectedServices}
                      setSelectedServices={setSelectedServices}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {availableServices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Hiện tại không có dịch vụ nào khả dụng</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Component for individual ancillary service option
const AncillaryServiceOption = ({
  service,
  passengers,
  onServiceChange,
  isSelected,
  selectedServices,
  setSelectedServices,
}) => {
  const [expandedPassengers, setExpandedPassengers] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Determine if service applies to individual passengers or entire booking
  const isPerPassenger = [
    "MEAL",
    "INFANT_MEAL",
    "SPECIAL_ASSISTANCE",
    "SEAT",
  ].includes(service.serviceType);

  const handleNotesChange = (serviceId, passengerIndex, notes) => {
    const serviceKey =
      passengerIndex !== null
        ? `${serviceId}_passenger${passengerIndex}`
        : `${serviceId}_booking`;

    setSelectedServices((prev) => {
      if (prev[serviceKey]) {
        return {
          ...prev,
          [serviceKey]: {
            ...prev[serviceKey],
            notes: notes,
          },
        };
      }
      return prev;
    });
  };

  const getServiceNotes = (serviceId, passengerIndex = null) => {
    const serviceKey =
      passengerIndex !== null
        ? `${serviceId}_passenger${passengerIndex}`
        : `${serviceId}_booking`;
    return selectedServices[serviceKey]?.notes || "";
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h5 className="font-medium text-gray-800">{service.serviceName}</h5>
            <Badge variant="outline" className="text-xs">
              {formatCurrencyVND(service.price)}
            </Badge>
          </div>
          {service.description && (
            <p className="text-sm text-gray-600 mb-3">{service.description}</p>
          )}

          {isPerPassenger ? (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedPassengers(!expandedPassengers)}
                className="p-0 h-auto font-normal text-blue-600"
              >
                Chọn cho từng hành khách {expandedPassengers ? "▲" : "▼"}
              </Button>

              {expandedPassengers && (
                <div className="space-y-3 ml-4">
                  {passengers.map((passenger, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`service-${service.serviceId}-passenger-${index}`}
                          checked={isSelected(service.serviceId, index)}
                          onCheckedChange={(checked) =>
                            onServiceChange(service.serviceId, checked, index)
                          }
                        />
                        <Label
                          htmlFor={`service-${service.serviceId}-passenger-${index}`}
                          className="text-sm"
                        >
                          {passenger.firstName} {passenger.lastName}
                          <span className="text-gray-500 ml-1">
                            ({passenger.type})
                          </span>
                        </Label>
                      </div>
                      {isSelected(service.serviceId, index) && (
                        <div className="ml-6">
                          <textarea
                            placeholder="Ghi chú đặc biệt (tùy chọn)..."
                            className="w-full text-xs p-2 border rounded-md resize-none"
                            rows={2}
                            value={getServiceNotes(service.serviceId, index)}
                            onChange={(e) =>
                              handleNotesChange(
                                service.serviceId,
                                index,
                                e.target.value
                              )
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`service-${service.serviceId}-booking`}
                  checked={isSelected(service.serviceId)}
                  onCheckedChange={(checked) =>
                    onServiceChange(service.serviceId, checked)
                  }
                />
                <Label
                  htmlFor={`service-${service.serviceId}-booking`}
                  className="text-sm"
                >
                  Áp dụng cho toàn bộ booking
                </Label>
              </div>
              {isSelected(service.serviceId) && (
                <div className="ml-6">
                  <textarea
                    placeholder="Ghi chú đặc biệt (tùy chọn)..."
                    className="w-full text-xs p-2 border rounded-md resize-none"
                    rows={2}
                    value={getServiceNotes(service.serviceId)}
                    onChange={(e) =>
                      handleNotesChange(service.serviceId, null, e.target.value)
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Keep the old AdditionalServicesCard for backward compatibility
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
          Dịch Vụ Bổ Sung (Legacy)
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
  getAncillaryServicesPrice,
  calculateTotal,
  fare,
  flight,
  // Flight type props
  isRoundTrip = false,
  isMultiCity = false,
  getReturnSeatPrice,
}) => (
  <div className="sticky top-8">
    <Card className="shadow-lg border-2 border-blue-100">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          Tóm Tắt Đặt Vé
          {isMultiCity && (
            <Badge variant="secondary" className="ml-2">
              Multi-City
            </Badge>
          )}
          {isRoundTrip && !isMultiCity && (
            <Badge variant="secondary" className="ml-2">
              Khứ hồi
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Flight fares */}
          {isMultiCity ? (
            <>
              {/* Multi-city passenger pricing */}
              {formData.passengers.map((passenger, index) => {
                // For multi-city, use total price divided by passenger count
                const totalPerPassenger =
                  (flight.totalPrice || 0) / formData.passengers.length;
                const discountedPrice =
                  passenger.type === "CHILD"
                    ? totalPerPassenger * 0.75
                    : passenger.type === "INFANT"
                    ? totalPerPassenger * 0.1
                    : totalPerPassenger;

                return (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">
                      1{" "}
                      {passenger.type === "ADULT"
                        ? "người lớn"
                        : passenger.type === "CHILD"
                        ? "trẻ em"
                        : "em bé"}{" "}
                      (Multi-City {flight.legs?.length || 0} chặng)
                    </span>
                    <span className="font-medium">
                      {formatCurrencyVND(discountedPrice)}
                    </span>
                  </div>
                );
              })}
            </>
          ) : isRoundTrip ? (
            <>
              {/* Round-trip passenger pricing */}
              {formData.passengers.map((passenger, index) => {
                const outboundPrice =
                  (flight.outbound?.selectedClass?.customPrice ||
                    flight.outbound?.selectedClass?.basePrice ||
                    0) / formData.passengers.length;
                const returnPrice =
                  (flight.return?.selectedClass?.customPrice ||
                    flight.return?.selectedClass?.basePrice ||
                    0) / formData.passengers.length;
                const totalPerPassenger = outboundPrice + returnPrice;

                const discountedPrice =
                  passenger.type === "CHILD"
                    ? totalPerPassenger * 0.75
                    : passenger.type === "INFANT"
                    ? totalPerPassenger * 0.1
                    : totalPerPassenger;

                return (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">
                      1{" "}
                      {passenger.type === "ADULT"
                        ? "người lớn"
                        : passenger.type === "CHILD"
                        ? "trẻ em"
                        : "em bé"}{" "}
                      (Khứ hồi)
                    </span>
                    <span className="font-medium">
                      {formatCurrencyVND(discountedPrice)}
                    </span>
                  </div>
                );
              })}
            </>
          ) : (
            // One-way passenger pricing
            formData.passengers.map((passenger, index) => {
              const basePrice = fare?.customPrice || fare?.basePrice || 0;
              const discountedPrice =
                passenger.type === "CHILD"
                  ? basePrice * 0.75
                  : passenger.type === "INFANT"
                  ? basePrice * 0.1
                  : basePrice;
              return (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600">
                    1{" "}
                    {passenger.type === "ADULT"
                      ? "người lớn"
                      : passenger.type === "CHILD"
                      ? "trẻ em"
                      : "em bé"}{" "}
                    (đã bao gồm thuế & phí)
                  </span>
                  <span className="font-medium">
                    {formatCurrencyVND(discountedPrice)}
                  </span>
                </div>
              );
            })
          )}

          {/* Seat selection */}
          <div className="flex justify-between">
            <span className="text-gray-600">
              {isMultiCity
                ? "Chọn chỗ ngồi (tất cả chặng)"
                : isRoundTrip
                ? "Chọn chỗ ngồi (Chuyến đi)"
                : "Chọn chỗ ngồi"}
            </span>
            <span className="font-medium">
              {formatCurrencyVND(getSeatPrice())}
            </span>
          </div>

          {/* Return seat selection for round trip (not multi-city) */}
          {isRoundTrip && !isMultiCity && (
            <div className="flex justify-between">
              <span className="text-gray-600">Chọn chỗ ngồi (Chuyến về)</span>
              <span className="font-medium">
                {formatCurrencyVND(
                  getReturnSeatPrice ? getReturnSeatPrice() : 0
                )}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-600">
              {isMultiCity ? "Hành lý (tất cả chặng)" : "Hành lý"}
            </span>
            <span className="font-medium">
              {formatCurrencyVND(getBaggagePrice())}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">🛎️ Dịch vụ đi kèm</span>
            <span className="font-medium">
              {formatCurrencyVND(
                getAncillaryServicesPrice ? getAncillaryServicesPrice() : 0
              )}
            </span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between text-lg font-bold">
            <span>Tổng cộng</span>
            <span className="text-blue-600">
              {formatCurrencyVND(calculateTotal())}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Main Extras Component
const Extras = ({ flight, fare, formData, setExtrasData }) => {
  // Check flight type
  const isRoundTrip = flight.type === "ROUND_TRIP";
  const isMultiCity =
    flight.type === "MULTI_CITY" || (flight.legs && flight.legs.length > 1);

  // Multi-city seat selection state - segment-based
  const [multiCitySeats, setMultiCitySeats] = useState({}); // { segment0: {}, segment1: {}, ... }
  const [multiCitySeatData, setMultiCitySeatData] = useState({}); // { segment0: [], segment1: [], ... }
  const [multiCityLoading, setMultiCityLoading] = useState({}); // { segment0: false, segment1: false, ... }
  const [multiCityShowSeats, setMultiCityShowSeats] = useState({}); // { segment0: true, segment1: true, ... }

  // Round-trip state (keep existing for backward compatibility)
  const [selectedSeats, setSelectedSeats] = useState({});
  const [selectedReturnSeats, setSelectedReturnSeats] = useState({});
  const [seats, setSeats] = useState([]);
  const [returnSeats, setReturnSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [showOutboundSeats, setShowOutboundSeats] = useState(true);
  const [showReturnSeats, setShowReturnSeats] = useState(true);
  // Multi-city baggage state - per segment per passenger
  const [multiCityBaggage, setMultiCityBaggage] = useState({});

  // Regular baggage state (for round-trip and one-way)
  const [baggage, setBaggage] = useState(
    formData.passengers.reduce(
      (acc, _, index) => ({
        ...acc,
        [`passenger${index + 1}`]: "NONE",
      }),
      {}
    )
  );

  // Initialize multi-city states based on flight type
  useEffect(() => {
    if (isMultiCity && flight.legs) {
      // Initialize seat selection state for each segment
      const initialSeats = {};
      const initialSeatData = {};
      const initialLoading = {};
      const initialShowSeats = {};
      const initialBaggage = {};

      flight.legs.forEach((_, segmentIndex) => {
        const segmentKey = `segment${segmentIndex}`;
        initialSeats[segmentKey] = {};
        initialSeatData[segmentKey] = [];
        initialLoading[segmentKey] = false;
        initialShowSeats[segmentKey] = true;

        // Initialize baggage for each segment and passenger
        initialBaggage[segmentKey] = formData.passengers.reduce(
          (acc, _, passengerIndex) => ({
            ...acc,
            [`passenger${passengerIndex + 1}`]: "NONE",
          }),
          {}
        );
      });

      setMultiCitySeats(initialSeats);
      setMultiCitySeatData(initialSeatData);
      setMultiCityLoading(initialLoading);
      setMultiCityShowSeats(initialShowSeats);
      setMultiCityBaggage(initialBaggage);
    }
  }, [isMultiCity, flight.legs, formData.passengers]);
  const [additionalServices, setAdditionalServices] = useState({
    travelInsurance: false,
    inFlightMeal: false,
    priorityBoarding: false,
  });

  // New ancillary services state
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});
  const [loadingServices, setLoadingServices] = useState(true);

  // Fetch available ancillary services
  useEffect(() => {
    const fetchAncillaryServices = async () => {
      try {
        setLoadingServices(true);
        const response = await ancillaryServiceApi.getAllActiveServices();

        if (response.success) {
          setAvailableServices(response.data || []);
        } else {
          console.error(
            "Failed to fetch ancillary services:",
            response.message
          );
          toast.error("Không thể tải danh sách dịch vụ đi kèm");
        }
      } catch (error) {
        console.error("Error fetching ancillary services:", error);
        toast.error("Có lỗi xảy ra khi tải dịch vụ đi kèm");
      } finally {
        setLoadingServices(false);
      }
    };

    fetchAncillaryServices();
  }, []);

  // Fetch seats for multi-city segments
  useEffect(() => {
    if (isMultiCity && flight.legs) {
      flight.legs.forEach((leg, segmentIndex) => {
        const segmentKey = `segment${segmentIndex}`;
        const flightId = leg.flightId || leg.id;
        const classId =
          leg.selectedClass?.travelClass?.classId || leg.selectedClass?.id;

        if (flightId && classId) {
          // Set loading for this segment
          setMultiCityLoading((prev) => ({ ...prev, [segmentKey]: true }));

          handleFetch({
            apiCall: () =>
              flightApi.getSeatsFlightByFlightIdAndTravelClassId(
                flightId,
                classId
              ),
            setData: (data) => {
              const transformedSeats = data.map((seat) => ({
                seatNumber: seat.seatNumber,
                row: seat.seatNumber,
                status: mapApiStatusToUiStatus(seat.status, seat.seatNumber),
                priceVND:
                  SEAT_PRICING[
                    mapApiStatusToUiStatus(seat.status, seat.seatNumber)
                  ]?.priceVND || 0,
              }));

              setMultiCitySeatData((prev) => ({
                ...prev,
                [segmentKey]: transformedSeats,
              }));
            },
            setLoading: (loading) =>
              setMultiCityLoading((prev) => ({
                ...prev,
                [segmentKey]: loading,
              })),
            errorMessage: `Không thể lấy danh sách ghế cho chặng ${
              segmentIndex + 1
            }`,
          });
        }
      });
    } else if (isRoundTrip && flight.outbound && flight.return) {
      // Existing round-trip logic
      if (
        flight.outbound.id &&
        flight.outbound.selectedClass?.travelClass?.classId
      ) {
        handleFetch({
          apiCall: () =>
            flightApi.getSeatsFlightByFlightIdAndTravelClassId(
              flight.outbound.id,
              flight.outbound.selectedClass.travelClass?.classId ||
                flight.outbound.selectedClass.id
            ),
          setData: (data) =>
            setSeats(
              data.map((seat) => ({
                seatNumber: seat.seatNumber,
                row: seat.seatNumber,
                status: mapApiStatusToUiStatus(seat.status, seat.seatNumber),
                priceVND:
                  SEAT_PRICING[
                    mapApiStatusToUiStatus(seat.status, seat.seatNumber)
                  ]?.priceVND || 0,
              }))
            ),
          setLoading,
          errorMessage: "Không thể lấy danh sách ghế chuyến đi",
        });
      }

      if (
        flight.return.id &&
        flight.return.selectedClass?.travelClass?.classId
      ) {
        handleFetch({
          apiCall: () =>
            flightApi.getSeatsFlightByFlightIdAndTravelClassId(
              flight.return.id,
              flight.return.selectedClass.travelClass?.classId ||
                flight.return.selectedClass.id
            ),
          setData: (data) =>
            setReturnSeats(
              data.map((seat) => ({
                seatNumber: seat.seatNumber,
                row: seat.seatNumber,
                status: mapApiStatusToUiStatus(seat.status, seat.seatNumber),
                priceVND:
                  SEAT_PRICING[
                    mapApiStatusToUiStatus(seat.status, seat.seatNumber)
                  ]?.priceVND || 0,
              }))
            ),
          setLoading: setReturnLoading,
          errorMessage: "Không thể lấy danh sách ghế chuyến về",
        });
      }
    } else {
      // For one-way flights
      const flightId = flight.flight?.id || flight.flightId;
      const classId =
        flight.selectedClass?.travelClass?.classId || flight.selectedClass?.id;
      if (flightId && classId) {
        handleFetch({
          apiCall: () =>
            flightApi.getSeatsFlightByFlightIdAndTravelClassId(
              flightId,
              classId
            ),
          setData: (data) =>
            setSeats(
              data.map((seat) => ({
                seatNumber: seat.seatNumber,
                row: seat.seatNumber,
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
    }
  }, [
    isMultiCity,
    flight?.legs,
    flight?.flightId,
    flight?.selectedClass?.id,
    isRoundTrip,
    flight.outbound?.id,
    flight.return?.id,
    flight.outbound?.selectedClass?.id,
    flight.return?.selectedClass?.id,
  ]);

  // Prepare seat legend
  const seatLegend = Object.entries(SEAT_PRICING).map(([status, config]) => ({
    status,
    color: config.color,
    label: config.label,
    price: config.priceVND > 0 ? formatCurrencyVND(config.priceVND) : null,
  }));

  // Multi-city price calculations
  const getMultiCitySeatPrice = () => {
    if (!isMultiCity) return 0;

    let total = 0;
    Object.entries(multiCitySeats).forEach(([segmentKey, segmentSeats]) => {
      const segmentSeatData = multiCitySeatData[segmentKey] || [];
      Object.values(segmentSeats).forEach((seatNumber) => {
        const seat = segmentSeatData.find((s) => s.seatNumber === seatNumber);
        total += seat?.priceVND || 0;
      });
    });
    return total;
  };

  const getMultiCityBaggagePrice = () => {
    if (!isMultiCity) return 0;

    let total = 0;
    Object.values(multiCityBaggage).forEach((segmentBaggage) => {
      Object.values(segmentBaggage).forEach((packageKey) => {
        const packageInfo = BAGGAGE_PACKAGES[packageKey];
        total += packageInfo ? packageInfo.price : 0;
      });
    });
    return total;
  };

  // Regular price calculations (round-trip and one-way)
  const getSeatPrice = () =>
    Object.values(selectedSeats).reduce((total, seatNumber) => {
      const seat = seats.find((s) => s.seatNumber === seatNumber);
      return total + (seat?.priceVND || 0);
    }, 0);

  const getReturnSeatPrice = () =>
    Object.values(selectedReturnSeats).reduce((total, seatNumber) => {
      const seat = returnSeats.find((s) => s.seatNumber === seatNumber);
      return total + (seat?.priceVND || 0);
    }, 0);

  const getBaggagePrice = () => {
    if (isMultiCity) {
      return getMultiCityBaggagePrice();
    }
    return Object.values(baggage).reduce((total, packageKey) => {
      const packageInfo = BAGGAGE_PACKAGES[packageKey];
      return total + (packageInfo ? packageInfo.price : 0);
    }, 0);
  };

  const getServicesPrice = () =>
    Object.entries(additionalServices).reduce(
      (total, [service, selected]) =>
        total + (selected ? SERVICE_PRICES[service] : 0),
      0
    );

  // Calculate ancillary services price
  const getAncillaryServicesPrice = () => {
    return Object.values(selectedServices).reduce((total, serviceSelection) => {
      const service = availableServices.find(
        (s) => s.serviceId === serviceSelection.serviceId
      );
      if (service) {
        return total + service.price * serviceSelection.quantity;
      }
      return total;
    }, 0);
  };

  const calculateTotal = () => {
    let passengersTotal = 0;

    if (isMultiCity) {
      // Multi-city: use total price from flight data
      passengersTotal = flight.totalPrice || 0;
    } else if (isRoundTrip) {
      // Round trip: use total price from flight data
      passengersTotal = flight.totalPrice || 0;
    } else {
      // Single flight: calculate based on fare
      const basePrice = fare?.customPrice || fare?.basePrice || 0;
      passengersTotal = formData.passengers.reduce((total, p) => {
        const discountedPrice =
          p.type === "CHILD"
            ? basePrice * 0.75
            : p.type === "INFANT"
            ? basePrice * 0.1
            : basePrice;
        return total + discountedPrice;
      }, 0);
    }

    // Calculate prices - all in VND
    let seatPrice = 0;
    let baggagePrice = 0;

    if (isMultiCity) {
      seatPrice = getMultiCitySeatPrice();
      baggagePrice = getMultiCityBaggagePrice();
    } else {
      seatPrice = getSeatPrice();
      const returnSeatPrice = isRoundTrip ? getReturnSeatPrice() : 0;
      seatPrice += returnSeatPrice;
      baggagePrice = getBaggagePrice();
    }

    const servicesPrice = getServicesPrice();
    const ancillaryServicesPrice = getAncillaryServicesPrice();

    // Return total
    return (
      passengersTotal +
      seatPrice +
      baggagePrice +
      servicesPrice +
      ancillaryServicesPrice
    );
  };

  // Update extras data
  useEffect(() => {
    const extrasData = {
      // Flight type flags
      isRoundTrip,
      isMultiCity,

      // Seat selections
      selectedSeats: isMultiCity ? {} : selectedSeats,
      selectedReturnSeats:
        isRoundTrip && !isMultiCity ? selectedReturnSeats : {},
      multiCitySeats: isMultiCity ? multiCitySeats : {},

      // Baggage selections
      baggage: isMultiCity ? {} : baggage,
      multiCityBaggage: isMultiCity ? multiCityBaggage : {},

      // Services (same for all flight types)
      additionalServices,
      selectedAncillaryServices: selectedServices,
      availableAncillaryServices: availableServices,

      // Pricing
      total: calculateTotal(),
      seatTotal: isMultiCity ? getMultiCitySeatPrice() : getSeatPrice(),
      returnSeatTotal: isRoundTrip && !isMultiCity ? getReturnSeatPrice() : 0,
      baggageTotal: getBaggagePrice(),
      servicesTotal: getServicesPrice(),
      ancillaryServicesTotal: getAncillaryServicesPrice(),
    };

    setExtrasData(extrasData);
  }, [
    selectedSeats,
    selectedReturnSeats,
    multiCitySeats,
    baggage,
    multiCityBaggage,
    additionalServices,
    selectedServices,
    availableServices,
    setExtrasData,
    formData.passengers.length,
    isRoundTrip,
    isMultiCity,
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700">
      <div className="max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
            Chọn Dịch Vụ Bổ Sung
            {isMultiCity && (
              <Badge variant="secondary" className="ml-3 text-sm">
                Multi-City ({flight.legs?.length || 0} chặng)
              </Badge>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isMultiCity
              ? "Chọn chỗ ngồi và dịch vụ cho từng chặng của chuyến bay multi-city"
              : "Nâng cao trải nghiệm chuyến bay với các dịch vụ thêm"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {isMultiCity ? (
              <MultiCitySeatSelectionCard
                flight={flight}
                formData={formData}
                multiCitySeats={multiCitySeats}
                setMultiCitySeats={setMultiCitySeats}
                multiCitySeatData={multiCitySeatData}
                multiCityLoading={multiCityLoading}
                multiCityShowSeats={multiCityShowSeats}
                setMultiCityShowSeats={setMultiCityShowSeats}
                seatLegend={seatLegend}
              />
            ) : (
              <SeatSelectionCard
                flight={flight}
                fare={fare}
                formData={formData}
                selectedSeats={selectedSeats}
                setSelectedSeats={setSelectedSeats}
                seats={seats}
                loading={loading}
                seatLegend={seatLegend}
                // Round-trip props
                isRoundTrip={isRoundTrip}
                returnSeats={returnSeats}
                returnLoading={returnLoading}
                selectedReturnSeats={selectedReturnSeats}
                setSelectedReturnSeats={setSelectedReturnSeats}
                // Collapsible state props
                showOutboundSeats={showOutboundSeats}
                setShowOutboundSeats={setShowOutboundSeats}
                showReturnSeats={showReturnSeats}
                setShowReturnSeats={setShowReturnSeats}
              />
            )}

            {isMultiCity ? (
              <MultiCityBaggageOptionsCard
                formData={formData}
                flight={flight}
                multiCityBaggage={multiCityBaggage}
                setMultiCityBaggage={setMultiCityBaggage}
              />
            ) : (
              <BaggageOptionsCard
                formData={formData}
                baggage={baggage}
                setBaggage={setBaggage}
              />
            )}

            <AncillaryServicesCard
              selectedServices={selectedServices}
              setSelectedServices={setSelectedServices}
              availableServices={availableServices}
              loadingServices={loadingServices}
              formData={formData}
            />
          </div>

          <BookingSummary
            formData={formData}
            getSeatPrice={isMultiCity ? getMultiCitySeatPrice : getSeatPrice}
            getBaggagePrice={getBaggagePrice}
            getServicesPrice={getServicesPrice}
            getAncillaryServicesPrice={getAncillaryServicesPrice}
            calculateTotal={calculateTotal}
            fare={fare}
            flight={flight}
            // Flight type props
            isRoundTrip={isRoundTrip}
            isMultiCity={isMultiCity}
            getReturnSeatPrice={getReturnSeatPrice}
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
