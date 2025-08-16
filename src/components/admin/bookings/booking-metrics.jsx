import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Plane,
  Clock,
} from "lucide-react";

const BookingMetrics = ({ bookings = [] }) => {
  // Calculate metrics
  const totalBookings = bookings.length;

  const confirmedBookings = bookings.filter(
    (b) => b.status === "Confirmed"
  ).length;
  const pendingBookings = bookings.filter((b) => b.status === "Pending").length;
  const cancelledBookings = bookings.filter(
    (b) => b.status === "Cancelled"
  ).length;

  const totalRevenue = bookings
    .filter((b) => b.status === "Confirmed")
    .reduce((sum, booking) => {
      const amount = parseFloat(booking.amount.replace(/[^0-9.-]+/g, ""));
      return sum + amount;
    }, 0);

  const totalPassengers = bookings
    .filter((b) => b.status === "Confirmed")
    .reduce((sum, booking) => sum + booking.passengers, 0);

  const averageBookingValue =
    confirmedBookings > 0 ? totalRevenue / confirmedBookings : 0;

  // Calculate booking trends (comparing with mock previous period)
  const confirmedRate =
    totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;
  const cancellationRate =
    totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

  const metrics = [
    {
      title: "Total Bookings",
      value: totalBookings.toLocaleString(),
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "All time bookings",
    },
    {
      title: "Confirmed Bookings",
      value: confirmedBookings.toLocaleString(),
      icon: Plane,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: `${confirmedRate.toFixed(1)}% of total`,
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: "From confirmed bookings",
    },
    {
      title: "Avg. Booking Value",
      value: `$${averageBookingValue.toFixed(0)}`,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Per confirmed booking",
    },
    {
      title: "Pending Bookings",
      value: pendingBookings.toLocaleString(),
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      description: "Awaiting confirmation",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {metric.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {metric.value}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {metric.description}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BookingMetrics;
