import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SeatMap from "./seat-map";
import { User, Users, Crown, Briefcase } from "lucide-react";

const SeatSelectionWrapper = ({
  seats = [],
  selectedSeats = {},
  passengers = [],
  onSeatSelect,
  isReturnFlight = false,
  flightTitle = "Chọn Chỗ Ngồi",
  showLegend = true,
  userTravelClassId = null, // Travel class ID của user
}) => {
  const [activePassengerIndex, setActivePassengerIndex] = useState(0);

  // Convert selectedSeats object to array of seat numbers for SeatMap
  const getSelectedSeatsArray = () => {
    return Object.values(selectedSeats)
      .map((seat) => (typeof seat === "object" ? seat.seatNumber : seat))
      .filter(Boolean);
  };

  // Check if a seat is selected by any passenger
  const isSeatSelectedByAnyPassenger = (seatNumber) => {
    return Object.values(selectedSeats).some(
      (seat) =>
        (typeof seat === "object" ? seat.seatNumber : seat) === seatNumber
    );
  };

  // Get passenger type icon
  const getPassengerIcon = (passengerType) => {
    switch (passengerType) {
      case "CHILD":
        return <Users className="w-4 h-4" />;
      case "INFANT":
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  // Get passenger type color
  const getPassengerColor = (passengerType) => {
    switch (passengerType) {
      case "CHILD":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "INFANT":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  // Handle seat selection for active passenger
  const handleSeatClick = (seat) => {
    if (onSeatSelect) {
      onSeatSelect(seat.seatNumber, activePassengerIndex, isReturnFlight);
    }
  };

  // Get seat status considering all passengers
  const getSeatStatus = (seat) => {
    if (seat.status === "OCCUPIED" || seat.status === "BLOCKED") {
      return seat.status;
    }

    // Check if seat is selected by current active passenger
    const currentPassengerSeat =
      selectedSeats[`passenger${activePassengerIndex + 1}`];
    const currentPassengerSeatNumber =
      typeof currentPassengerSeat === "object"
        ? currentPassengerSeat.seatNumber
        : currentPassengerSeat;

    if (currentPassengerSeatNumber === seat.seatNumber) {
      return "AVAILABLE"; // Will be shown as selected in SeatMap
    }

    // Check if seat is selected by another passenger
    if (isSeatSelectedByAnyPassenger(seat.seatNumber)) {
      return "BLOCKED"; // Show as blocked for other passengers
    }

    return seat.status;
  };

  // Transform seats for SeatMap component
  const transformedSeats = seats
    .filter((seat) => {
      // For all flight types: show all seats from all travel classes
      // SeatMap will handle disabling seats not matching user's travel class
      return true; // Show all seats
    })
    .map((seat) => ({
      seatNumber: seat.seatNumber,
      status: getSeatStatus(seat),
      price: seat.priceVND || seat.price || 0,
      seatType: seat.seatType || "STANDARD",
      // Preserve travel class information for SeatMap
      travelClassId: seat.travelClassId,
      classId: seat.classId,
      className: seat.className,
      travelClassName: seat.travelClassName,
      seatClassId: seat.seatClassId,
    }));

  console.log(
    `🎫 SeatSelectionWrapper - userTravelClassId:`,
    userTravelClassId
  );

  return (
    <div className="space-y-6">
      {/* Passenger Selection Tabs */}
      {passengers.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chọn ghế cho hành khách</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activePassengerIndex.toString()} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
                {passengers.map((passenger, index) => (
                  <TabsTrigger
                    key={index}
                    value={index.toString()}
                    onClick={() => setActivePassengerIndex(index)}
                    className="flex items-center gap-2"
                  >
                    {getPassengerIcon(passenger.type)}
                    <span className="hidden sm:inline">
                      Hành khách {index + 1}
                    </span>
                    <span className="sm:hidden">HK{index + 1}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {passengers.map((passenger, index) => (
                <TabsContent key={index} value={index.toString()}>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getPassengerIcon(passenger.type)}
                      <div>
                        <p className="font-medium">
                          Hành khách {index + 1}: {passenger.firstName}{" "}
                          {passenger.lastName}
                        </p>
                        <Badge
                          variant="outline"
                          className={getPassengerColor(passenger.type)}
                        >
                          {passenger.type === "ADULT"
                            ? "Người lớn"
                            : passenger.type === "CHILD"
                            ? "Trẻ em"
                            : "Em bé"}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right">
                      {selectedSeats[`passenger${index + 1}`] ? (
                        <div>
                          <p className="font-medium text-green-600">
                            Ghế:{" "}
                            {typeof selectedSeats[`passenger${index + 1}`] ===
                            "object"
                              ? selectedSeats[`passenger${index + 1}`]
                                  .seatNumber
                              : selectedSeats[`passenger${index + 1}`]}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onSeatSelect(null, index, isReturnFlight)
                            }
                          >
                            Đổi ghế
                          </Button>
                        </div>
                      ) : (
                        <p className="text-gray-500">Chưa chọn ghế</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Seat Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-blue-600" />
            {flightTitle}
            {isReturnFlight && " - Chuyến Về"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SeatMap
            seats={transformedSeats}
            selectedSeats={getSelectedSeatsArray()}
            onSeatSelect={handleSeatClick}
            showLegend={showLegend}
            userTravelClassId={userTravelClassId}
          />
        </CardContent>
      </Card>

      {/* Selection Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tóm tắt lựa chọn ghế</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {passengers.map((passenger, index) => {
              const passengerKey = `passenger${index + 1}`;
              const selectedSeat = selectedSeats[passengerKey];

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getPassengerIcon(passenger.type)}
                    <div>
                      <p className="font-medium">
                        Hành khách {index + 1}: {passenger.firstName}{" "}
                        {passenger.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-50">
                        {passenger.type === "ADULT"
                          ? "Người lớn"
                          : passenger.type === "CHILD"
                          ? "Trẻ em"
                          : "Em bé"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {selectedSeat ? (
                      <div>
                        <Badge variant="secondary" className="mb-1">
                          Ghế:{" "}
                          {typeof selectedSeat === "object"
                            ? selectedSeat.seatNumber
                            : selectedSeat}
                        </Badge>
                        <p className="text-sm text-green-600 font-medium">
                          ✓ Đã chọn
                        </p>
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-orange-600 border-orange-300"
                      >
                        Chưa chọn ghế
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeatSelectionWrapper;
