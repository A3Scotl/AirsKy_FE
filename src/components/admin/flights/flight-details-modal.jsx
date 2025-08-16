import {
  X,
  Plane,
  MapPin,
  Clock,
  Users,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
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
import { Separator } from "@/components/ui/separator";

const FlightDetailsModal = ({ flight, open, onClose, onEdit, onDelete }) => {
  if (!open || !flight) return null;

  const getStatusColor = (status) => {
    const colors = {
      "On Time": "bg-green-100 text-green-800 border-green-200",
      Delayed: "bg-red-100 text-red-800 border-red-200",
      Boarding: "bg-blue-100 text-blue-800 border-blue-200",
      Departed: "bg-gray-100 text-gray-800 border-gray-200",
      Cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status) => {
    const icons = {
      "On Time": CheckCircle,
      Delayed: AlertCircle,
      Boarding: Clock,
      Departed: Plane,
      Cancelled: AlertCircle,
    };
    const Icon = icons[status] || CheckCircle;
    return <Icon className="h-4 w-4" />;
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
                Flight {flight.flightNumber}
              </h2>
              <p className="text-sm text-gray-600">{flight.route}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className={`${getStatusColor(
                flight.status
              )} flex items-center space-x-1`}
            >
              {getStatusIcon(flight.status)}
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
                  <span>Flight Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Departure
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
                    <p className="text-sm font-medium text-gray-600">Arrival</p>
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
                  <span>Passenger Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Booked Seats</span>
                  <span className="font-semibold">{flight.booked}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Capacity</span>
                  <span className="font-semibold">{flight.capacity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Available Seats</span>
                  <span className="font-semibold text-green-600">
                    {availableSeats}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Load Factor</span>
                  <Badge
                    variant="outline"
                    className={`${
                      loadFactor >= 90
                        ? "bg-red-100 text-red-800"
                        : loadFactor >= 80
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
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
                  <span>Aircraft Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Aircraft Type</span>
                  <span className="font-medium">{flight.aircraft}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gate</span>
                  <span className="font-medium">{flight.gate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pilot</span>
                  <span className="font-medium">{flight.pilot}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Pricing & Revenue</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Economy Class</span>
                  <span className="font-medium">${flight.price.economy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Business Class</span>
                  <span className="font-medium">${flight.price.business}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">First Class</span>
                  <span className="font-medium">${flight.price.first}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Estimated Revenue
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
                <span>Route Information</span>
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
                  <p className="text-sm text-gray-600">Departure</p>
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
                  <p className="text-sm text-gray-600">Arrival</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Flight ID: {flight.id} • Last updated: {new Date().toLocaleString()}
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => onEdit(flight)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Flight
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(flight)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel Flight
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDetailsModal;
