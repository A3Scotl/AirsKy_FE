import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Plane,
  Clock,
} from "lucide-react";
import { bookingApi } from "../../../apis/booking-api";

const BookingMetrics = ({ isLoading = false }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllBookings = async () => {
      try {
        setLoading(true);
        // Fetch all bookings with a large page size to get complete data
        const response = await bookingApi.getAllBookings({ size: 10000 });
        if (response.success) {
          setBookings(response.data.content || response.data || []);
        } else {
          setError("Không thể tải dữ liệu đặt vé");
        }
      } catch (err) {
        setError("Lỗi khi tải dữ liệu đặt vé");
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllBookings();
  }, []);

  // Calculate metrics with memoization for better performance
  const metricsData = useMemo(() => {
    const totalBookings = bookings.length;

    // Use the same status mapping logic as booking-page.jsx
    const confirmedBookings = bookings.filter(
      (b) => b.status === "CONFIRMED" || b.status === "COMPLETED"
    ).length;

    const pendingBookings = bookings.filter(
      (b) => b.status === "PENDING"
    ).length;

    const cancelledBookings = bookings.filter(
      (b) => b.status === "CANCELLED"
    ).length;

    // Only count revenue from actually confirmed/completed bookings
    const totalRevenue = bookings
      .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
      .reduce((sum, booking) => {
        const amount = booking.totalAmount || 0;
        return sum + amount;
      }, 0);

    // Only count passengers from confirmed/completed bookings
    const totalPassengers = bookings
      .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
      .reduce((sum, booking) => {
        // Handle different passenger data formats
        let passengerCount = 0;
        if (Array.isArray(booking.passengers)) {
          passengerCount = booking.passengers.length;
        } else if (typeof booking.passengers === "number") {
          passengerCount = booking.passengers;
        } else {
          passengerCount = 0;
        }
        return sum + passengerCount;
      }, 0);

    // Calculate booking trends
    const confirmedRate =
      totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;
    const cancellationRate =
      totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue,
      totalPassengers,
      confirmedRate,
      cancellationRate,
    };
  }, [bookings]);

  const {
    totalBookings,
    confirmedBookings,
    pendingBookings,
    totalRevenue,
    confirmedRate,
  } = metricsData;

  if (loading || isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-10 h-6 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
                <div className="p-3 rounded-full bg-gray-200">
                  <div className="h-5 w-5 bg-gray-300 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const metrics = [
    {
      title: "Tổng Đặt Vé",
      value: totalBookings.toLocaleString(),
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Tất cả các đặt vé",
    },
    {
      title: "Đặt Vé Đã Xác Nhận",
      value: confirmedBookings.toLocaleString(),
      icon: Plane,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: `${confirmedRate.toFixed(1)}% của tổng số`,
    },
    {
      title: "Tổng Doanh Thu",
      value: `${totalRevenue.toLocaleString("vi-VN")} VNĐ`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: "Từ các đặt vé đã xác nhận",
    },
    {
      title: "Đặt Vé Đang Chờ",
      value: pendingBookings.toLocaleString(),
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      description: "Đang chờ thanh toán",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-white mb-1">
                    {metric.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metric.value}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-200 mt-1">
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
