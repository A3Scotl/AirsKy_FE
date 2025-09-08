import { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Plane,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Text constants for Vietnamese interface
const TEXT = {
  title: "Lịch Trình Chuyến Bay",
  description: "Hoạt động bay hàng ngày và quản lý lịch trình",
  filterPlaceholder: "Lọc theo máy bay",
  allAircraft: "Tất Cả Máy Bay",
  addFlight: "Thêm Chuyến Bay",
  previousDay: "Ngày Trước",
  nextDay: "Ngày Tiếp",
  flightsScheduled: "chuyến bay đã lên lịch",
  dailyTimeline: "Lịch Trình Hàng Ngày",
  flights: "chuyến bay",
  noFlightsScheduled: "Không có chuyến bay nào được lên lịch",
  totalFlights: "Tổng Chuyến Bay",
  onTime: "Đúng Giờ",
  loadFactor: "Tỷ Lệ Lấp Đầy",
  passengers: "hành khách",
  noFlightsTitle: "Không có chuyến bay nào được lên lịch",
  noFlightsDescription: "Không có chuyến bay nào được lên lịch cho",
  with: "với",
  scheduleAFlight: "Lên Lịch Chuyến Bay",
  gate: "Cửa",
  status: {
    SCHEDULED: "Đã Lên Lịch",
    BOARDING: "Đang Lên Máy Bay",
    DEPARTED: "Đã Khởi Hành",
    DELAYED: "Hoãn",
    CANCELLED: "Đã Hủy",
    COMPLETED: "Hoàn Thành",
    ON_TIME: "Đúng Giờ",
  },
};

const FlightSchedule = ({ flights }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("day"); // day, week, month
  const [filterAircraft, setFilterAircraft] = useState("all");

  // Status color configuration
  const statusColors = {
    SCHEDULED: "bg-green-100 text-green-800 border-green-200",
    BOARDING: "bg-blue-100 text-blue-800 border-blue-200",
    DEPARTED: "bg-gray-100 text-gray-800 border-gray-200",
    DELAYED: "bg-red-100 text-red-800 border-red-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    ON_TIME: "bg-green-100 text-green-800 border-green-200",
  };

  // Memoized calculations
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
    }
    return slots;
  }, []);

  const dailyFlights = useMemo(() => {
    const selectedDateObj = new Date(selectedDate);
    if (isNaN(selectedDateObj.getTime())) return [];
    const dateStr = selectedDateObj.toISOString().split("T")[0];
    return flights.filter((flight) => {
      const flightDateObj = new Date(flight.departureTime);
      if (isNaN(flightDateObj.getTime())) return false;
      const flightDate = flightDateObj.toISOString().split("T")[0];
      return flightDate === dateStr;
    });
  }, [flights, selectedDate]);

  const filteredFlights = useMemo(() => {
    return filterAircraft === "all"
      ? dailyFlights
      : dailyFlights.filter((f) => {
          const aircraftName =
            typeof f.aircraft === "object"
              ? f.aircraft?.aircraftName || f.aircraft?.aircraftCode || ""
              : f.aircraft || "";
          return aircraftName === filterAircraft;
        });
  }, [dailyFlights, filterAircraft]);

  const flightsByHour = useMemo(() => {
    const grouped = {};
    dailyFlights.forEach((flight) => {
      const flightDateObj = new Date(flight.departureTime);
      if (isNaN(flightDateObj.getTime())) return;
      const hour = flightDateObj.getHours();
      const hourKey = `${hour.toString().padStart(2, "0")}:00`;
      if (!grouped[hourKey]) {
        grouped[hourKey] = [];
      }
      grouped[hourKey].push(flight);
    });
    return grouped;
  }, [dailyFlights]);

  const aircraftTypes = useMemo(() => {
    const aircraftSet = new Set();
    flights.forEach((f) => {
      const aircraftName =
        typeof f.aircraft === "object"
          ? f.aircraft?.aircraftName || f.aircraft?.aircraftCode || ""
          : f.aircraft || "";
      if (aircraftName && typeof aircraftName === "string") {
        aircraftSet.add(aircraftName);
      }
    });
    return Array.from(aircraftSet);
  }, [flights]);

  // Navigate dates
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateTimeString) => {
    const dateObj = new Date(dateTimeString);
    if (isNaN(dateObj.getTime())) return "Invalid Time";
    return dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    return statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getAircraftDisplayName = (aircraft) => {
    if (typeof aircraft === "object") {
      return aircraft?.aircraftName || aircraft?.aircraftCode || "N/A";
    }
    return aircraft || "N/A";
  };

  const getBookedSeats = (flight) => {
    return flight.totalSeats - (flight.availableSeats || 0);
  };

  const getTotalSeats = (flight) => {
    return flight.totalSeats || 0;
  };

  return (
    <div className="space-y-6">
      {/* Schedule Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>{TEXT.title}</span>
              </CardTitle>
              <CardDescription>{TEXT.description}</CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={filterAircraft} onValueChange={setFilterAircraft}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={TEXT.filterPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{TEXT.allAircraft}</SelectItem>
                  {aircraftTypes.map((aircraft, index) => (
                    <SelectItem
                      key={`aircraft-${index}-${aircraft}`}
                      value={aircraft}
                    >
                      {aircraft}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Date Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
              {TEXT.previousDay}
            </Button>

            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">
                {formatDate(selectedDate)}
              </h2>
              <p className="text-sm text-gray-600">
                {filteredFlights.length} {TEXT.flightsScheduled}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate("next")}
            >
              {TEXT.nextDay}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Flight Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{TEXT.dailyTimeline}</span>
            <Badge variant="outline" className="text-sm">
              {filteredFlights.length} {TEXT.flights}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {timeSlots.map((timeSlot) => {
              const hourFlights = flightsByHour[timeSlot] || [];
              const filteredHourFlights =
                filterAircraft === "all"
                  ? hourFlights
                  : hourFlights.filter((f) => {
                      const aircraftName = getAircraftDisplayName(f.aircraft);
                      return aircraftName === filterAircraft;
                    });

              return (
                <div
                  key={timeSlot}
                  className="flex border-b border-gray-100 pb-2"
                >
                  {/* Time Column */}
                  <div className="w-20 flex-shrink-0 py-2">
                    <div className="text-sm font-medium text-gray-500">
                      {timeSlot}
                    </div>
                  </div>

                  {/* Flights Column */}
                  <div className="flex-1 py-2">
                    {filteredHourFlights.length > 0 ? (
                      <div className="space-y-2">
                        {filteredHourFlights.map((flight) => (
                          <div
                            key={flight.flightId || flight.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <Plane className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold text-blue-600">
                                  {flight.flightNumber}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <MapPin className="h-3 w-3" />
                                <span>
                                  {flight.departureAirport?.airportCode ||
                                    "N/A"}{" "}
                                  →{" "}
                                  {flight.arrivalAirport?.airportCode || "N/A"}
                                </span>
                              </div>

                              <Badge variant="outline" className="text-xs">
                                {getAircraftDisplayName(flight.aircraft)}
                              </Badge>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {formatTime(flight.departureTime)} -{" "}
                                  {formatTime(flight.arrivalTime)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {TEXT.gate} {flight.gate || "N/A"}
                                </div>
                              </div>

                              <Badge
                                variant="outline"
                                className={getStatusColor(flight.status)}
                              >
                                {TEXT.status[flight.status] || flight.status}
                              </Badge>

                              <div className="text-sm text-gray-600">
                                {getBookedSeats(flight)}/{getTotalSeats(flight)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">
                        {TEXT.noFlightsScheduled}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {TEXT.totalFlights}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredFlights.length}
                </p>
              </div>
              <Plane className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {TEXT.onTime}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {
                    filteredFlights.filter(
                      (f) => f.status === "SCHEDULED" || f.status === "ON_TIME"
                    ).length
                  }
                </p>
                <p className="text-xs text-gray-500">
                  {filteredFlights.length > 0
                    ? `${(
                        (filteredFlights.filter(
                          (f) =>
                            f.status === "SCHEDULED" || f.status === "ON_TIME"
                        ).length /
                          filteredFlights.length) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {TEXT.loadFactor}
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredFlights.length > 0
                    ? `${(
                        (filteredFlights.reduce(
                          (sum, f) => sum + getBookedSeats(f),
                          0
                        ) /
                          filteredFlights.reduce(
                            (sum, f) => sum + getTotalSeats(f),
                            0
                          )) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}
                </p>
                <p className="text-xs text-gray-500">
                  {filteredFlights.reduce(
                    (sum, f) => sum + getBookedSeats(f),
                    0
                  )}{" "}
                  {TEXT.passengers}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {filteredFlights.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {TEXT.noFlightsTitle}
              </h3>
              <p className="text-gray-600 mb-4">
                {TEXT.noFlightsDescription} {formatDate(selectedDate)}
                {filterAircraft !== "all" && ` ${TEXT.with} ${filterAircraft}`}
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                {TEXT.scheduleAFlight}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FlightSchedule;