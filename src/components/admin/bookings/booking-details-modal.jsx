import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarIcon,
  MapPin,
  User,
  Mail,
  Phone,
  CreditCard,
  Clock,
  Plane,
  Users,
  X,
  Edit,
  Download,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";

const BookingDetailsModal = ({ open, onOpenChange, booking, onEdit }) => {
  if (!booking) return null;

  const getStatusBadge = (status) => {
    const variants = {
      Confirmed: "bg-green-100 text-green-800 border-green-200",
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getClassBadge = (flightClass) => {
    const variants = {
      Economy: "bg-blue-100 text-blue-800",
      Business: "bg-purple-100 text-purple-800",
      First: "bg-amber-100 text-amber-800",
    };
    return variants[flightClass] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "EEEE, MMMM do, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  const formatShortDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Booking Details</DialogTitle>
              <DialogDescription>
                Complete information for booking {booking.bookingRef}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={getStatusBadge(booking.status)}
              >
                {booking.status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Flight Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Route</p>
                      <p className="font-semibold">{booking.route}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Departure</p>
                      <p className="font-semibold">
                        {formatDate(booking.departure)}
                      </p>
                    </div>
                  </div>

                  {booking.arrival && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Arrival</p>
                        <p className="font-semibold">
                          {formatDate(booking.arrival)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Passengers</p>
                      <p className="font-semibold">
                        {booking.passengers} passenger
                        {booking.passengers > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={getClassBadge(booking.class)}
                    >
                      {booking.class} Class
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-green-600">
                        {booking.amount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-semibold text-lg">{booking.customer}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{booking.email}</p>
                    </div>
                  </div>

                  {booking.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{booking.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Booking Reference</p>
                    <p className="font-bold text-lg text-blue-600">
                      {booking.bookingRef}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Booking Date</p>
                    <p className="font-medium">
                      {formatShortDate(booking.bookingDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Booking ID</p>
                    <p className="font-medium font-mono text-sm">
                      {booking.id}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(booking.specialRequests || booking.seatPreferences) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.seatPreferences && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Seat Preferences
                    </p>
                    <p className="text-sm bg-gray-50 p-3 rounded-md">
                      {booking.seatPreferences}
                    </p>
                  </div>
                )}

                {booking.specialRequests && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Special Requests
                    </p>
                    <p className="text-sm bg-gray-50 p-3 rounded-md">
                      {booking.specialRequests}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Booking Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Booking Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Booking Created</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(booking.bookingDate)}
                    </p>
                  </div>
                </div>

                {booking.status === "Confirmed" && (
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Booking Confirmed</p>
                      <p className="text-sm text-gray-600">
                        Payment processed successfully
                      </p>
                    </div>
                  </div>
                )}

                {booking.status === "Cancelled" && (
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Booking Cancelled</p>
                      <p className="text-sm text-gray-600">Refund processing</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-500">
                      Flight Departure
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatDate(booking.departure)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailsModal;
