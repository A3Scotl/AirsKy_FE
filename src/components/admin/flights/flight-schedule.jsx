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
  ArrowRightLeft,
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
import { format } from "date-fns";

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
  dailyTimeline: "Lịch Trình trong Ngày",
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
    ON_TIME: "Đúng Giờ",
    DEPARTED: "Đã Khởi Hành",
    DELAYED: "Hoãn",
    CANCELLED: "Đã Hủy",
  },
};

const FlightSchedule = ({ flights }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("day"); // day, week, month
  const [filterAircraft, setFilterAircraft] = useState("all");

  // Status color configuration
  const statusColors = {
    ON_TIME: "bg-green-100 text-green-800 border-green-200",
    DEPARTED: "bg-gray-100 text-gray-800 border-gray-200",
    DELAYED: "bg-red-100 text-red-800 border-red-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
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
    const dateStr = format(selectedDateObj, "yyyy-MM-dd");
    return flights.filter((flight) => {
      const flightDateObj = new Date(flight.departureTime);
      if (isNaN(flightDateObj.getTime())) return false;
      const flightDate = format(flightDateObj, "yyyy-MM-dd");
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
    const totalSeats = flight.aircraft?.totalSeats || flight.totalSeats || 0;
    const availableSeats = flight.availableSeats || 0;
    return Math.max(0, totalSeats - availableSeats);
  };

  const getTotalSeats = (flight) => {
    return flight.aircraft?.totalSeats || flight.totalSeats || 0;
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
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                <span>
                  {filteredFlights.length} {TEXT.flightsScheduled}
                </span>
              </div>
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
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm">
                {filteredFlights.length} {TEXT.flights}
              </Badge>
            </div>
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
                        {filteredHourFlights.map((flight) => {
                          return (
                            <div
                              key={flight.flightId || flight.id}
                              className="flex items-center justify-between p-3 rounded-lg transition-colors bg-gray-50 hover:bg-gray-100"
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
                                    {flight.arrivalAirport?.airportCode ||
                                      "N/A"}
                                  </span>
                                </div>

                                <Badge variant="outline" className="text-xs">
                                  {getAircraftDisplayName(flight.aircraft)}
                                </Badge>
                              </div>

                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <div className="text-sm font-medium dark:text-gray-900">
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
                                  {getBookedSeats(flight)}/
                                  {getTotalSeats(flight)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
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
                  {filteredFlights.filter((f) => f.status === "ON_TIME").length}
                </p>
                <p className="text-xs text-gray-500">
                  {filteredFlights.length > 0
                    ? `${(
                        (filteredFlights.filter((f) => f.status === "ON_TIME")
                          .length /
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
                  Doanh thu ước tính
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {dailyFlights.length > 0
                    ? `${(
                        dailyFlights.reduce((sum, f) => {
                          // Use flightTravelClasses for accurate revenue calculation
                          if (f.flightTravelClasses?.length > 0) {
                            const flightRevenue = f.flightTravelClasses.reduce(
                              (total, tc) => {
                                const bookedSeats =
                                  (tc.capacity || 0) - (tc.availableSeats || 0);
                                return total + bookedSeats * (tc.price || 0);
                              },
                              0
                            );
                            return sum + flightRevenue;
                          }

                          // Fallback for flights without flightTravelClasses
                          const bookedSeats = getBookedSeats(f);
                          const avgPrice =
                            f.basePrice || f.priceNumeric || f.price || 5000000; // Default price
                          return sum + bookedSeats * avgPrice;
                        }, 0) / 1000000
                      ).toFixed(1)}M VNĐ`
                    : "0M VNĐ"}
                </p>
                <p className="text-xs text-gray-500">
                  {dailyFlights.reduce((sum, f) => sum + getBookedSeats(f), 0)}{" "}
                  {TEXT.passengers}
                </p>
              </div>
              <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₫</span>
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
