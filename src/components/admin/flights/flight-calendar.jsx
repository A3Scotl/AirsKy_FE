import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plane,
  ArrowRightLeft,
} from "lucide-react";

const FlightCalendar = ({ flights }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);

  // Màu sắc cho các nhóm khứ hồi
  const roundTripGroupColors = [
    "bg-blue-100 text-blue-800 border-blue-300",
    "bg-green-100 text-green-800 border-green-300",
    "bg-purple-100 text-purple-800 border-purple-300",
    "bg-orange-100 text-orange-800 border-orange-300",
    "bg-pink-100 text-pink-800 border-pink-300",
    "bg-indigo-100 text-indigo-800 border-indigo-300",
    "bg-teal-100 text-teal-800 border-teal-300",
    "bg-yellow-100 text-yellow-800 border-yellow-300",
  ];

  // Map để lưu màu cho từng nhóm
  const groupColorMap = useMemo(() => {
    const map = {};
    let colorIndex = 0;
    flights.forEach((flight) => {
      if (flight.roundTripGroupId && !map[flight.roundTripGroupId]) {
        map[flight.roundTripGroupId] =
          roundTripGroupColors[colorIndex % roundTripGroupColors.length];
        colorIndex++;
      }
    });
    return map;
  }, [flights]);

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Get flights for a specific date
  const getFlightsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split("T")[0];
    return flights.filter((flight) => {
      const flightDate = new Date(flight.departureTime)
        .toISOString()
        .split("T")[0];
      return flightDate === dateStr;
    });
  };

  // Navigate months
  const navigateMonth = (direction) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
    });
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      ON_TIME: "bg-green-100 text-green-800",
      DEPARTED: "bg-gray-100 text-gray-800",
      DELAYED: "bg-red-100 text-red-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Get round trip color
  const getRoundTripColor = (flight) => {
    if (flight.roundTripGroupId) {
      return (
        groupColorMap[flight.roundTripGroupId] || "bg-blue-100 text-blue-800"
      );
    }
    return getStatusColor(flight.status);
  };

  const getAircraftDisplayName = (aircraft) => {
    if (typeof aircraft === "object") {
      return aircraft?.aircraftName || aircraft?.aircraftCode || "N/A";
    }
    return aircraft || "N/A";
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Lịch Chuyến Bay</span>
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-bold min-w-[200px] text-center">
                {formatDate(currentDate)}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-2 text-center font-semibold text-gray-600 text-sm"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="p-2"></div>;
              }

              const dayFlights = getFlightsForDate(date);
              const hasFlights = dayFlights.length > 0;

              return (
                <div
                  key={date.toISOString()}
                  className={`
                    min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                    ${
                      isToday(date)
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-gray-50"
                    }
                    ${isSelected(date) ? "ring-2 ring-blue-500" : ""}
                  `}
                  onClick={() => setSelectedDate(date)}
                >
                  <div
                    className={`
                    text-sm font-medium mb-2
                    ${isToday(date) ? "text-blue-600" : "text-gray-900"}
                  `}
                  >
                    {date.getDate()}
                  </div>

                  {/* Flight indicators */}
                  {hasFlights && (
                    <div className="space-y-1">
                      {dayFlights.slice(0, 3).map((flight, idx) => (
                        <div
                          key={flight.flightId || idx}
                          className={`text-xs px-1 py-0.5 rounded truncate flex items-center space-x-1 ${
                            flight.roundTripGroupId
                              ? `${
                                  groupColorMap[flight.roundTripGroupId] ||
                                  "bg-blue-100 text-blue-800"
                                } border`
                              : "bg-blue-100 text-blue-800"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFlight(flight);
                          }}
                        >
                          {flight.roundTripGroupId && (
                            <ArrowRightLeft className="h-2 w-2 flex-shrink-0" />
                          )}
                          <span className="truncate">
                            {flight.flightNumber}
                          </span>
                        </div>
                      ))}
                      {dayFlights.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayFlights.length - 3} nữa
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Flights */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              Chuyến Bay Ngày {selectedDate.toLocaleDateString("vi-VN")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getFlightsForDate(selectedDate).length > 0 ? (
                getFlightsForDate(selectedDate)
                  .sort(
                    (a, b) =>
                      new Date(a.departureTime) - new Date(b.departureTime)
                  )
                  .map((flight) => (
                    <div
                      key={flight.flightId || flight.id}
                      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                        flight.roundTripGroupId ? "border-l-4" : ""
                      }`}
                      style={
                        flight.roundTripGroupId
                          ? {
                              borderLeftColor:
                                groupColorMap[flight.roundTripGroupId]
                                  ?.split(" ")[1]
                                  ?.replace("text-", "")
                                  .replace("-800", "") || "#3b82f6",
                            }
                          : {}
                      }
                      onClick={() => setSelectedFlight(flight)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {flight.roundTripGroupId && (
                            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                          )}
                          <Plane className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold text-blue-600">
                            {flight.flightNumber}
                          </span>
                          {flight.roundTripGroupId && (
                            <Badge variant="outline" className="text-xs">
                              {flight.roundTripGroupId}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(flight.departureTime).toLocaleTimeString(
                              "vi-VN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}{" "}
                            -{" "}
                            {new Date(flight.arrivalTime).toLocaleTimeString(
                              "vi-VN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {flight.departureAirport?.airportCode || "N/A"} →{" "}
                            {flight.arrivalAirport?.airportCode || "N/A"}
                          </span>
                        </div>

                        <Badge variant="outline" className="text-xs">
                          {getAircraftDisplayName(flight.aircraft)}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge className={getRoundTripColor(flight)}>
                          {flight.status}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Cửa {flight.gate || "N/A"}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Không có chuyến bay nào trong ngày này
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flight Details Dialog */}
      <Dialog
        open={!!selectedFlight}
        onOpenChange={() => setSelectedFlight(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5" />
              <span>Chi Tiết Chuyến Bay {selectedFlight?.flightNumber}</span>
            </DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về chuyến bay
            </DialogDescription>
          </DialogHeader>

          {selectedFlight && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Số hiệu chuyến bay
                  </label>
                  <p className="text-lg font-semibold flex items-center space-x-2">
                    {selectedFlight.flightNumber}
                    {selectedFlight.roundTripGroupId && (
                      <Badge variant="outline" className="text-xs">
                        <ArrowRightLeft className="h-3 w-3 mr-1" />
                        {selectedFlight.roundTripGroupId}
                      </Badge>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Máy bay
                  </label>
                  <p>{getAircraftDisplayName(selectedFlight.aircraft)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Thời gian khởi hành
                  </label>
                  <p>
                    {new Date(selectedFlight.departureTime).toLocaleString(
                      "vi-VN"
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Thời gian đến
                  </label>
                  <p>
                    {new Date(selectedFlight.arrivalTime).toLocaleString(
                      "vi-VN"
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Sân bay đi
                  </label>
                  <p>{selectedFlight.departureAirport?.airportName || "N/A"}</p>
                  <p className="text-sm text-gray-500">
                    ({selectedFlight.departureAirport?.airportCode || "N/A"})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Sân bay đến
                  </label>
                  <p>{selectedFlight.arrivalAirport?.airportName || "N/A"}</p>
                  <p className="text-sm text-gray-500">
                    ({selectedFlight.arrivalAirport?.airportCode || "N/A"})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Trạng thái
                  </label>
                  <Badge className={getRoundTripColor(selectedFlight)}>
                    {selectedFlight.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Cửa ra máy bay
                  </label>
                  <p>{selectedFlight.gate || "Chưa xác định"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Ghế trống
                  </label>
                  <p>
                    {selectedFlight.availableSeats || 0}/
                    {selectedFlight.totalSeats || 0}
                  </p>
                </div>
              </div>

              {selectedFlight.roundTripGroupId && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">
                      Chuyến bay khứ hồi
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Mã nhóm:{" "}
                    <span className="font-mono font-medium">
                      {selectedFlight.roundTripGroupId}
                    </span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Các chuyến bay trong cùng nhóm sẽ có màu nền tương tự để dễ
                    nhận biết
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlightCalendar;
