import { X, Plane, MapPin, Clock, Users, Edit, Trash2, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
};

const FlightDetailsModal = ({ flight, open, onClose, onEdit, onDelete }) => {
  if (!open || !flight) return null;

  const statusConfig = {
    SCHEDULED: { style: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle, label: TEXT.scheduled },
    BOARDING: { style: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock, label: TEXT.boarding },
    DEPARTED: { style: "bg-gray-100 text-gray-800 border-gray-200", icon: Plane, label: TEXT.departed },
    DELAYED: { style: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle, label: TEXT.delayed },
    CANCELLED: { style: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle, label: TEXT.cancelled },
    COMPLETED: { style: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle, label: TEXT.completed },
  };

  const currentStatus = statusConfig[flight.status] || statusConfig.SCHEDULED;
  const StatusIcon = currentStatus.icon;

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      time: date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const departure = formatDateTime(flight.departureTime);
  const arrival = formatDateTime(flight.arrivalTime);
  const loadFactor = ((flight.totalSeats - flight.availableSeats) / flight.totalSeats * 100).toFixed(1);
  const estimatedRevenue = (flight.totalSeats - flight.availableSeats) * flight.basePrice;

  const getLoadFactorStyle = (factor) => {
    if (factor >= 90) return "bg-red-100 text-red-800";
    if (factor >= 80) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const formatDuration = (minutes) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Plane className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{TEXT.flightDetails} {flight.flightNumber}</h2>
              <p className="text-sm text-gray-600">{flight.from} ({flight.fromCode}) → {flight.to} ({flight.toCode})</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={`${currentStatus.style} flex items-center space-x-1`}>
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
                    <p className="text-sm font-medium text-gray-600">{TEXT.departure}</p>
                    <p className="text-lg font-semibold">{departure.time}</p>
                    <p className="text-sm text-gray-500">{departure.date}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-px bg-gray-300 relative">
                      <Plane className="absolute -top-2 left-1/2 transform -translate-x-1/2 h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{formatDuration(flight.duration)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">{TEXT.arrival}</p>
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
                  <span className="text-sm text-gray-600">{TEXT.bookedSeats}</span>
                  <span className="font-semibold">{flight.totalSeats - flight.availableSeats}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{TEXT.totalCapacity}</span>
                  <span className="font-semibold">{flight.totalSeats}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{TEXT.availableSeats}</span>
                  <span className="font-semibold text-green-600">{flight.availableSeats}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{TEXT.loadFactor}</span>
                  <Badge variant="outline" className={getLoadFactorStyle(loadFactor)}>{loadFactor}%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

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
                  <span className="text-sm text-gray-600">{TEXT.aircraftType}</span>
                  <span className="font-medium">{flight.aircraft}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{TEXT.gate}</span>
                  <span className="font-medium">{flight.gate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{TEXT.airlineName}</span>
                  <span className="font-medium">{flight.airlineName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{TEXT.flightType}</span>
                  <span className="font-medium">{flight.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{TEXT.terminal}</span>
                  <span className="font-medium">{flight.terminal}</span>
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
                  <span className="text-sm text-gray-600">{TEXT.economyClass}</span>
                  <span className="font-medium">${flight.basePrice}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{TEXT.estimatedRevenue}</span>
                  <span className="font-semibold text-green-600">${estimatedRevenue.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

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
                  <p className="font-semibold text-lg">{flight.fromCode}</p>
                  <p className="text-sm text-gray-600">{flight.from}</p>
                </div>
                <div className="flex-1 relative">
                  <div className="h-px bg-gray-300" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                    <Badge variant="outline">{formatDuration(flight.duration)}</Badge>
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="font-semibold text-lg">{flight.toCode}</p>
                  <p className="text-sm text-gray-600">{flight.to}</p>
                </div>
              </div>
              {flight.stopsList?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600">{TEXT.stops}</p>
                  <ul className="list-disc pl-5 text-sm text-gray-600">
                    {flight.stopsList.map((stop, index) => (
                      <li key={index}>{stop.airportCode} - {stop.airportName} ({stop.duration} phút)</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {TEXT.flightId}: {flight.flightId} • {TEXT.lastUpdated}: {formatDateTime(flight.updatedAt).date} {formatDateTime(flight.updatedAt).time}
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => onEdit(flight)}>
              <Edit className="h-4 w-4 mr-2" />
              {TEXT.editFlight}
            </Button>
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(flight)}>
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