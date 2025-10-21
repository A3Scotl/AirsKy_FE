import {
  X,
  Plane,
  MapPin,
  Clock,
  Users,
  Edit,
  Trash2,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Armchair,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowRightLeft,
  Check,
  X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { flightApi } from "@/apis/flight-api";

const TEXT = {
  flightDetails: "Chi Tiết Chuyến Bay",
  flightSchedule: "Lịch Trình Bay",
  departure: "Khởi Hành",
  arrival: "Đến Nơi",
  passengerInfo: "Thông Tin Hành Khách",
  bookedSeats: "Ghế Đã Đặt",
  totalCapacity: "Tổng Sức Chứa",
  availableSeats: "Ghế Còn Trống",
  loadFactor: "Tỷ Lệ Lấp Đầy",
  aircraftDetails: "Chi Tiết Máy Bay",
  aircraftType: "Loại Máy Bay",
  gate: "Cổng",
  airlineName: "Hãng Hàng Không",
  flightType: "Loại Chuyến Bay",
  terminal: "Nhà Ga",
  pricingRevenue: "Giá Vé & Doanh Thu",
  economyClass: "Hạng Phổ Thông",
  estimatedRevenue: "Doanh Thu Ước Tính",
  routeInfo: "Thông Tin Tuyến Bay",
  flightId: "ID Chuyến Bay",
  lastUpdated: "Cập nhật lần cuối",
  editFlight: "Sửa Chuyến Bay",
  cancelFlight: "Hủy Chuyến Bay",
  stops: "Điểm Dừng",
  scheduled: "Đã Lên Lịch",
  boarding: "Đang Lên Máy Bay",
  departed: "Đã Khởi Hành",
  delayed: "Hoãn",
  cancelled: "Đã Hủy",
  completed: "Hoàn Thành",
  travelClasses: "Hạng vé (giá tùy chỉnh)",
  className: "Tên Lớp",
  customPrice: "Giá Tùy Chỉnh",
  benefits: "Lợi Ích",
  refundable: "Hoàn Tiền",
  changeable: "Thay Đổi",
  cancellationFee: "Phí Hủy",
  bookedSeatsClass: "Ghế Đã Đặt",
  yes: "Có",
  no: "Không",
  businessName: "Người Tạo",
  tripType: "Loại Chuyến",
  roundTripGroupId: "ID Nhóm Khứ Hồi",
  createdAt: "Ngày Tạo",
  updatedAt: "Ngày Cập Nhật",
  seatLayout: "Bố Trí Ghế Ngồi",
  available: "Trống",
  occupied: "Đã Đặt",
  selected: "Đã Chọn",
  cockpit: "Buồng Lái",
};

const FlightDetailsModal = ({ flight, open, onClose, onEdit, onDelete }) => {
  const [isSeatLayoutExpanded, setIsSeatLayoutExpanded] = useState(false);
  const [detailedSeats, setDetailedSeats] = useState([]);

  useEffect(() => {
    if (open && flight) {
      const fetchSeats = async () => {
        const result = await flightApi.getSeatsByFlight(flight.flightId);
        if (result.success) {
          setDetailedSeats(result.data || []);
        }
      };
      fetchSeats();
    }
  }, [open, flight]);
  if (!open || !flight) return null;

  const statusConfig = {
    ON_TIME: {
      style: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
      label: TEXT.scheduled,
    },
    DEPARTED: {
      style: "bg-gray-100 text-gray-800 border-gray-200",
      icon: Plane,
      label: TEXT.departed,
    },
    DELAYED: {
      style: "bg-red-100 text-red-800 border-red-200",
      icon: AlertCircle,
      label: TEXT.delayed,
    },
    CANCELLED: {
      style: "bg-red-100 text-red-800 border-red-200",
      icon: AlertCircle,
      label: TEXT.cancelled,
    },
  };

  const currentStatus = statusConfig[flight.status] || statusConfig.ON_TIME;
  const StatusIcon = currentStatus.icon;

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const departure = formatDateTime(flight.departureTime);
  const arrival = formatDateTime(flight.arrivalTime);
  const loadFactor = (
    ((flight?.aircraft?.totalSeats - flight.availableSeats) / flight?.aircraft?.totalSeats) *
    100
  ).toFixed(1);
  const estimatedRevenue =
    (flight?.aircraft?.totalSeats - flight.availableSeats) * flight.basePrice;

  const getLoadFactorStyle = (factor) => {
    if (factor >= 90) return "bg-red-100 text-red-800";
    if (factor >= 80) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getTripTypeBadge = (tripType) => {
    switch (tripType) {
      case "one_way":
        return {
          text: "Một Chiều",
          className:
            "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
        };
      case "round_trip":
        return {
          text: "Khứ Hồi",
          className:
            "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
        };
      case "multi_city":
        return {
          text: "Đa Chặng",
          className:
            "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
        };
      default:
        return {
          text: "Không xác định",
          className:
            "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
        };
    }
  };

  const renderRouteInfo = (flight) => {
    switch (flight.tripType) {
      case "one_way":
        return (
          <div className="flex items-center justify-center space-x-8 py-4">
            <div className="text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Plane className="h-6 w-6 text-blue-600 transform -rotate-45" />
              </div>
              <p className="font-semibold text-lg">
                {flight.departureAirport.airportCode}
              </p>
              <p className="text-sm text-gray-600">
                {flight.departureAirport.airportName}
              </p>
            </div>
            <div className="flex-1 relative">
              <div className="h-px bg-gray-300" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                <Badge variant="outline">
                  {formatDuration(flight.duration)}
                </Badge>
              </div>
            </div>
            <div className="text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-semibold text-lg">
                {flight.arrivalAirport.airportCode}
              </p>
              <p className="text-sm text-gray-600">
                {flight.arrivalAirport.airportName}
              </p>
            </div>
          </div>
        );

      case "round_trip":
        return (
          <div className="space-y-6">
            {/* Outbound Flight */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-center space-x-6">
                <div className="text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <Plane className="h-5 w-5 text-blue-600 transform -rotate-45" />
                  </div>
                  <p className="font-semibold text-base">
                    {flight.departureAirport.airportCode}
                  </p>
                  <p className="text-xs text-gray-600">
                    {flight.departureAirport.airportName}
                  </p>
                </div>
                <div className="flex-1 relative">
                  <div className="h-px bg-blue-300" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-50 px-2">
                    <Badge
                      variant="outline"
                      className="text-blue-600 border-blue-300"
                    >
                      {formatDuration(flight.duration)}
                    </Badge>
                  </div>
                </div>
                <div className="text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="font-semibold text-base">
                    {flight.arrivalAirport.airportCode}
                  </p>
                  <p className="text-xs text-gray-600">
                    {flight.arrivalAirport.airportName}
                  </p>
                </div>
              </div>
              <div className="text-center mt-3">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-300"
                >
                  Chuyến đi
                </Badge>
              </div>
            </div>

            {/* Return Flight */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-center space-x-6">
                <div className="text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="font-semibold text-base">
                    {flight.arrivalAirport.airportCode}
                  </p>
                  <p className="text-xs text-gray-600">
                    {flight.arrivalAirport.airportName}
                  </p>
                </div>
                <div className="flex-1 relative">
                  <div className="h-px bg-green-300" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-50 px-2">
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-300"
                    >
                      {formatDuration(flight.duration)}
                    </Badge>
                  </div>
                </div>
                <div className="text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <Plane className="h-5 w-5 text-blue-600 transform rotate-45" />
                  </div>
                  <p className="font-semibold text-base">
                    {flight.departureAirport.airportCode}
                  </p>
                  <p className="text-xs text-gray-600">
                    {flight.departureAirport.airportName}
                  </p>
                </div>
              </div>
              <div className="text-center mt-3">
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-300"
                >
                  Chuyến về
                </Badge>
              </div>
            </div>
          </div>
        );

      case "multi_city":
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <Plane className="h-5 w-5 text-purple-600 transform -rotate-45" />
                  </div>
                  <p className="font-semibold text-base">
                    {flight.departureAirport.airportCode}
                  </p>
                  <p className="text-xs text-gray-600">
                    {flight.departureAirport.airportName}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                </div>

                <div className="text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="font-semibold text-base">
                    {flight.arrivalAirport.airportCode}
                  </p>
                  <p className="text-xs text-gray-600">
                    {flight.arrivalAirport.airportName}
                  </p>
                </div>
              </div>
              <div className="text-center mt-3">
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-300"
                >
                  Đa chặng
                </Badge>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Chuyến bay đa chặng với nhiều điểm dừng
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center space-x-8 py-4">
            <div className="text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <Plane className="h-6 w-6 text-gray-600 transform -rotate-45" />
              </div>
              <p className="font-semibold text-lg">
                {flight.departureAirport.airportCode}
              </p>
              <p className="text-sm text-gray-600">
                {flight.departureAirport.airportName}
              </p>
            </div>
            <div className="flex-1 relative">
              <div className="h-px bg-gray-300" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                <Badge variant="outline">
                  {formatDuration(flight.duration)}
                </Badge>
              </div>
            </div>
            <div className="text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <MapPin className="h-6 w-6 text-gray-600" />
              </div>
              <p className="font-semibold text-lg">
                {flight.arrivalAirport.airportCode}
              </p>
              <p className="text-sm text-gray-600">
                {flight.arrivalAirport.airportName}
              </p>
            </div>
          </div>
        );
    }
  };

  const parseBenefits = (benefitsString) => {
    if (!benefitsString) return [];
    return benefitsString.split(",").map((benefit) => benefit.trim());
  };

  const generateSeats = (aircraft) => {
    if (!aircraft || !aircraft.seatLayout || !aircraft.totalSeats) {
      return [];
    }

    const layout = aircraft.seatLayout; // e.g., "3-3", "3-4-3", "2-3-2"
    const layoutParts = layout.split("-").map(Number);

    let left, middle, right;
    let totalSeatsPerRow;

    if (layoutParts.length === 2) {
      // Format: "3-3" (left-right)
      left = layoutParts[0];
      right = layoutParts[1];
      totalSeatsPerRow = left + right;
    } else if (layoutParts.length === 3) {
      // Format: "2-3-2" (left-middle-right)
      left = layoutParts[0];
      middle = layoutParts[1];
      right = layoutParts[2];
      totalSeatsPerRow = left + middle + right;
    } else {
      // Default fallback
      left = 3;
      right = 3;
      totalSeatsPerRow = 6;
    }

    const rows = Math.ceil(aircraft.totalSeats / totalSeatsPerRow);
    const seats = [];
    let seatCounter = 1;
     console.log(seats);

    for (let row = 1; row <= rows; row++) {
      const rowSeats = [];

      // Left side seats
      for (let col = 1; col <= left; col++) {
        const seatId = `${row}${String.fromCharCode(64 + col)}`;
        const seatStatus = detailedSeats.find(s => s.seatNumber === seatId)?.status || 'AVAILABLE';
        rowSeats.push({
          id: seatId,
          row,
          col,
          side: "left",
          status: seatStatus,
          type: "seat",
        });
        seatCounter++;
      }

      // Middle aisle (if 3-part layout)
      if (middle && middle > 0) {
        rowSeats.push({ id: `aisle-middle-${row}`, type: "aisle" });
        // Middle seats
        for (let col = 1; col <= middle; col++) {
          const seatId = `${row}${String.fromCharCode(64 + left + col)}`;
          const seatStatus = detailedSeats.find(s => s.seatNumber === seatId)?.status || 'AVAILABLE';
          rowSeats.push({
            id: seatId,
            row,
            col: left + col,
            side: "middle",
            status: seatStatus,
            type: "seat",
          });
          seatCounter++;
        }
      }

      // Main aisle
      rowSeats.push({ id: `aisle-${row}`, type: "aisle" });

      // Right side seats
      for (let col = 1; col <= right; col++) {
        const seatId = `${row}${String.fromCharCode(
          64 + left + (middle || 0) + col
        )}`;
        const seatStatus = detailedSeats.find(s => s.seatNumber === seatId)?.status || 'AVAILABLE';
        rowSeats.push({
          id: seatId,
          row,
          col: left + (middle || 0) + col,
          side: "right",
          status: seatStatus,
          type: "seat",
        });
        seatCounter++;
      }

      seats.push(rowSeats);
    }

    return seats;
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-7xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Plane className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 gap-3 flex">
                {flight.flightNumber}
                 {(() => {
                const badgeConfig = getTripTypeBadge(flight.tripType);
                return (
                  <Badge
                    variant="outline"
                    className={`text-sm font-bold border ${badgeConfig.className}`}
                  >
                    {badgeConfig.text}
                  </Badge>
                );
              })()}
              </h2>
              {/* show tripType */}
             
              <p className="text-xl text-gray-600">
                {flight.departureAirport.airportName} (
                {flight.departureAirport.airportCode})
                {flight.tripType === "round_trip" ? (
                  <ArrowRightLeft className="inline mx-1 text-gray-500" />
                ) : (
                  <ArrowRight className="inline mx-1 text-gray-500" />
                )}
                {flight.arrivalAirport.airportName} (
                {flight.arrivalAirport.airportCode})
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className={`${currentStatus.style} flex items-center space-x-1`}
            >
              <StatusIcon className="h-4 w-4" />
              <span>{currentStatus.label}</span>
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{TEXT.flightSchedule}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {TEXT.departure}
                    </p>
                    <p className="text-lg font-semibold">{departure.time}</p>
                    <p className="text-sm text-gray-500">{departure.date}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-px bg-gray-300 relative">
                      <Plane className="absolute -top-2 left-1/2 transform -translate-x-1/2 h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDuration(flight.duration)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">
                      {TEXT.arrival}
                    </p>
                    <p className="text-lg font-semibold">{arrival.time}</p>
                    <p className="text-sm text-gray-500">{arrival.date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{TEXT.passengerInfo}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {TEXT.bookedSeats}
                  </span>
                  <span className="font-semibold">
                    {flight.aircraft.totalSeats - flight.availableSeats}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {TEXT.totalCapacity}
                  </span>
                  <span className="font-semibold">
                    {flight.aircraft.totalSeats}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {TEXT.availableSeats}
                  </span>
                  <span className="font-semibold text-green-600">
                    {flight.availableSeats}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {TEXT.loadFactor}
                  </span>
                  <Badge
                    variant="outline"
                    className={getLoadFactorStyle(loadFactor)}
                  >
                    {loadFactor}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plane className="h-4 w-4" />
                  <span>{TEXT.aircraftDetails}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {TEXT.aircraftType}
                  </span>
                  <span className="font-medium">
                    {flight.aircraft?.aircraftName || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {TEXT.seatLayout}
                  </span>
                  <span className="font-medium">
                    {flight.aircraft?.seatLayout || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{TEXT.gate}</span>
                  <span className="font-medium">{flight.gate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {TEXT.airlineName}
                  </span>
                  <span className="font-medium">
                    {flight.airline.airlineName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {TEXT.flightType}
                  </span>
                  <span className="font-medium">
                    {flight.type == "INTERNATIONAL" ? "Quốc tế" : "Nội địa"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{TEXT.terminal}</span>
                  <span className="font-medium">
                    {flight.terminal || "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{TEXT.travelClasses}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flight.flightTravelClasses?.map((travelClass, index) => {
                  const benefits = parseBenefits(
                    travelClass.travelClass.benefits
                  );
                  return (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      {/* Header with class name and price */}
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-lg text-gray-900">
                          {travelClass.travelClass.className}
                        </h4>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(travelClass.price)}
                          </div>
                          <div className="text-xs text-gray-500">/khách</div>
                        </div>
                      </div>

                      {/* Benefits section */}
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">
                          {TEXT.benefits}:
                        </h5>
                        <div className="space-y-1">
                          {benefits.map((benefit, benefitIndex) => (
                            <div
                              key={benefitIndex}
                              className="flex items-center text-sm text-gray-600"
                            >
                              <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Features section */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {TEXT.refundable}:
                          </span>
                          {travelClass.travelClass.refundable ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <XIcon className="h-4 w-4 text-red-500" />
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {TEXT.changeable}:
                          </span>
                          {travelClass.travelClass.changeable ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <XIcon className="h-4 w-4 text-red-500" />
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {TEXT.availableSeats}:
                          </span>
                          <span className="font-semibold text-blue-600">
                            {travelClass.capacity}
                          </span>
                        </div>

                        {travelClass.travelClass.cancellationFee && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {TEXT.cancellationFee}:
                            </span>
                            <span className="font-semibold text-red-600">
                              {formatCurrency(
                                travelClass.travelClass.cancellationFee
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Armchair className="h-4 w-4" />
                  <span>{TEXT.seatLayout}</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSeatLayoutExpanded(!isSeatLayoutExpanded)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {isSeatLayoutExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Thu gọn
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Xem chi tiết
                    </>
                  )}
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                Layout: {flight.aircraft?.seatLayout || "N/A"} | Tổng ghế:{" "}
                {flight?.aircraft?.totalSeats} | Đã đặt:{" "}
                {flight?.aircraft?.totalSeats - flight.availableSeats} | Còn trống:{" "}
                {flight.availableSeats}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Legend - Always visible */}
                <div className="flex items-center justify-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded"></div>
                    <span className="text-sm">{TEXT.available}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded"></div>
                    <span className="text-sm">{TEXT.occupied}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 border-2 border-gray-300 rounded"></div>
                    <span className="text-sm">Lối đi</span>
                  </div>
                </div>

                {/* Seat Layout - Only show when expanded */}
                {isSeatLayoutExpanded && (
                  <>
                    <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto flex flex-col items-center justify-center">
                      {/* Cockpit */}
                      <div className="flex justify-center mb-4 items-center">
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-t-lg text-sm font-medium">
                          <Plane className="h-4 w-4 inline mr-1" />
                          {TEXT.cockpit}
                        </div>
                      </div>

                      <div className="flex flex-col min-w-full justify-center items-center">
                        {generateSeats(
                          flight.aircraft,
                      
                        ).map((row, rowIndex) => 
                          <div
                            key={rowIndex}
                            className="flex items-center mb-2 mr-12"
                          >
                            <span className="w-8 text-xs font-mono text-gray-500 mr-2 text-right">
                              {rowIndex + 1}
                            </span>
                            {row.map((seat, seatIndex) => 
                            
                            {
                              console.log(seat);
                              return(
                              <div
                                key={seatIndex}
                                className={`w-8 h-8 mx-1 rounded text-xs flex items-center justify-center font-mono text-[10px] border-2 ${
                                  seat.type === "aisle"
                                    ? "bg-gray-200 border-gray-300"
                                   : seat.status === 'OCCUPIED'
                                    ? "bg-red-100 border-red-400 text-red-800"
                                    : "bg-green-100 border-green-400 text-green-800"
                                }`}
                                title={
                                  seat.type === "aisle"
                                    ? "Lối đi"
                                    : seat.status === 'OCCUPIED'
                                    ? `Ghế ${seat.id} - Đã đặt`
                                    : `Ghế ${seat.id} - Còn trống`
                                }
                              >
                                {seat.type === "aisle" ? "" : seat.id}
                              </div>
                            )
                            }
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded mr-2"></div>
                          <span>Còn trống: {flight.availableSeats}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded mr-2"></div>
                          <span>
                            Đã đặt: {flight?.aircraft?.totalSeats - flight.availableSeats}
                          </span>
                        </div>
                      </div>
                      <div className="text-gray-600">
                        Hiển thị tất cả{" "}
                        {
                          generateSeats(
                            flight.aircraft,

                          ).length
                        }{" "}
                        hàng ghế
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{TEXT.routeInfo}</span>
                <div>
                  <img
                    src={flight.airline.thumbnail}
                    alt="Airline Logo"
                    className="w-full h-8 rounded object-cover"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderRouteInfo(flight)}
              {flight.stopsList?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600">
                    {TEXT.stops}
                  </p>
                  <ul className="list-disc pl-5 text-sm text-gray-600">
                    {flight.stopsList.map((stop, index) => (
                      <li key={index}>
                        {stop.airportCode} - {stop.airportName} (
                        {stop.stopDuration} phút)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {flight.roundTripGroupId &&
              ` • ${TEXT.roundTripGroupId}: ${flight.roundTripGroupId}`}{" "}
            • {TEXT.createdAt}: {formatDateTime(flight.createdAt).date}{" "}
            {formatDateTime(flight.createdAt).time} • {TEXT.lastUpdated}:{" "}
            {formatDateTime(flight.updatedAt).date}{" "}
            {formatDateTime(flight.updatedAt).time}
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => onEdit(flight)}>
              <Edit className="h-4 w-4 mr-2" />
              {TEXT.editFlight}
            </Button>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDetailsModal;
