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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Vietnamese text constants
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
  pilot: "Phi Công",
  pricingRevenue: "Giá Vé & Doanh Thu",
  economyClass: "Hạng Phổ Thông",
  businessClass: "Hạng Thương Gia",
  firstClass: "Hạng Nhất",
  estimatedRevenue: "Doanh Thu Ước Tính",
  routeInfo: "Thông Tin Tuyến Bay",
  flightId: "ID Chuyến Bay",
  lastUpdated: "Cập nhật lần cuối",
  editFlight: "Sửa Chuyến Bay",
  cancelFlight: "Hủy Chuyến Bay",
};

const FlightDetailsModal = ({ flight, open, onClose, onEdit, onDelete }) => {
  if (!open || !flight) return null;

  // Status configuration
  const statusConfig = {
    "On Time": {
      style: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
    },
    Delayed: {
      style: "bg-red-100 text-red-800 border-red-200",
      icon: AlertCircle,
    },
    Boarding: {
      style: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Clock,
    },
    Departed: {
      style: "bg-gray-100 text-gray-800 border-gray-200",
      icon: Plane,
    },
    Cancelled: {
      style: "bg-red-100 text-red-800 border-red-200",
      icon: AlertCircle,
    },
  };

  const currentStatus = statusConfig[flight.status] || statusConfig["On Time"];
  const StatusIcon = currentStatus.icon;

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
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

  const departureDateTime = formatDateTime(flight.departure);
  const arrivalDateTime = formatDateTime(flight.arrival);

  const loadFactor = ((flight.booked / flight.capacity) * 100).toFixed(1);
  const availableSeats = flight.capacity - flight.booked;

  const estimatedRevenue =
    flight.booked * 0.7 * flight.price.economy +
    flight.booked * 0.25 * flight.price.business +
    flight.booked * 0.05 * flight.price.first;

  const getLoadFactorStyle = (factor) => {
    if (factor >= 90) return "bg-red-100 text-red-800";
    if (factor >= 80) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Plane className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {TEXT.flightDetails} {flight.flightNumber}
              </h2>
              <p className="text-sm text-gray-600">{flight.route}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className={`${currentStatus.style} flex items-center space-x-1`}
            >
              <StatusIcon className="h-4 w-4" />
              <span>{flight.status}</span>
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Flight Overview */}
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
                    <p className="text-lg font-semibold">
                      {departureDateTime.time}
                    </p>
                    <p className="text-sm text-gray-500">
                      {departureDateTime.date}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-px bg-gray-300 relative">
                      <Plane className="absolute -top-2 left-1/2 transform -translate-x-1/2 h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {flight.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">
                      {TEXT.arrival}
                    </p>
                    <p className="text-lg font-semibold">
                      {arrivalDateTime.time}
                    </p>
                    <p className="text-sm text-gray-500">
                      {arrivalDateTime.date}
                    </p>
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
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {TEXT.bookedSeats}
                  </span>
                  <span className="font-semibold">{flight.booked}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {TEXT.totalCapacity}
                  </span>
                  <span className="font-semibold">{flight.capacity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {TEXT.availableSeats}
                  </span>
                  <span className="font-semibold text-green-600">
                    {availableSeats}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
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

          {/* Aircraft & Operational Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <span className="font-medium">{flight.aircraft}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{TEXT.gate}</span>
                  <span className="font-medium">{flight.gate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{TEXT.pilot}</span>
                  <span className="font-medium">{flight.pilot}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{TEXT.pricingRevenue}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {TEXT.economyClass}
                  </span>
                  <span className="font-medium">${flight.price.economy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {TEXT.businessClass}
                  </span>
                  <span className="font-medium">${flight.price.business}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {TEXT.firstClass}
                  </span>
                  <span className="font-medium">${flight.price.first}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {TEXT.estimatedRevenue}
                  </span>
                  <span className="font-semibold text-green-600">
                    ${estimatedRevenue.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Route Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{TEXT.routeInfo}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center space-x-8 py-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <Plane className="h-6 w-6 text-blue-600 transform -rotate-45" />
                  </div>
                  <p className="font-semibold text-lg">
                    {flight.route.split(" → ")[0].match(/\((.*?)\)/)?.[1] ||
                      flight.route.split(" → ")[0]}
                  </p>
                  <p className="text-sm text-gray-600">{TEXT.departure}</p>
                </div>

                <div className="flex-1 relative">
                  <div className="h-px bg-gray-300"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                    <Badge variant="outline">{flight.duration}</Badge>
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="font-semibold text-lg">
                    {flight.route.split(" → ")[1].match(/\((.*?)\)/)?.[1] ||
                      flight.route.split(" → ")[1]}
                  </p>
                  <p className="text-sm text-gray-600">{TEXT.arrival}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {TEXT.flightId}: {flight.id} • {TEXT.lastUpdated}:{" "}
            {new Date().toLocaleString("vi-VN")}
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => onEdit(flight)}>
              <Edit className="h-4 w-4 mr-2" />
              {TEXT.editFlight}
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(flight)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {TEXT.cancelFlight}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDetailsModal;
