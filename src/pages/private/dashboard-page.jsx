import { useState, useEffect } from "react";
import {
  Calendar,
  Plane,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  MapPin,
  Clock,
  Star,
  Activity,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Shield,
  Globe,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useDashboardData } from "@/hooks/use-reports-data";
import { formatCurrencyVND } from "@/utils/currency-utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const {
    data: dashboardData,
    isLoading: loading,
    isFetching: isRefreshing,
    error,
    refetch,
  } = useDashboardData();

  const data = dashboardData;

  // Helper functions
  const getBookingStatusText = (status) => {
    const statusMap = {
      CONFIRMED: "Đã Xác Nhận",
      PENDING: "Chờ Xử Lý",
      CANCELLED: "Đã Hủy",
      COMPLETED: "Đã Xác Nhận",
    };
    return statusMap[status] || status || "Chờ Xử Lý";
  };

  const getFlightStatusText = (status) => {
    const statusMap = {
      ON_TIME: "Đúng Giờ",
      DELAYED: "Trễ",
      CANCELLED: "Đã Hủy",
      SCHEDULED: "Đã Lên Lịch",
    };
    return statusMap[status] || status || "Không Xác Định";
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat("vi-VN").format(number);
  };

  const layBadgeTrangThai = (trangThai) => {
    const styles = {
      "Đã Xác Nhận":
        "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
      "Chờ Xử Lý":
        "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
      "Đã Hủy": "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
      "Hoàn Thành":
        "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
    };
    return (
      styles[trangThai] ||
      "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Bảng Điều Khiển
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Đang tải dữ liệu...
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Bảng Điều Khiển
          </h1>
          <p className="text-red-600 dark:text-red-400">
            {error?.message || String(error)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Bảng Điều Khiển Quản Trị
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tổng quan về hoạt động của hệ thống đặt vé máy bay
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch({ force: true })}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")}
            />
            {isRefreshing ? "Đang tải..." : "Làm Mới"}
          </Button>
          <Link to="/admin/reports">
            <Button variant="default" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Báo Cáo Chi Tiết
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {data?.stats?.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.format === "currency"
                    ? formatCurrencyVND(stat.value)
                    : stat.suffix
                    ? `${formatNumber(stat.value)}${stat.suffix}`
                    : formatNumber(stat.value)}
                </div>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {stat.positive ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span
                    className={
                      stat.positive ? "text-green-600" : "text-red-600"
                    }
                  >
                    {stat.change}
                  </span>
                  <span className="ml-1">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dashboard Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Revenue and Bookings Status Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              So Sánh Doanh Thu & Số Đặt Vé (7 Ngày)
            </CardTitle>
            <CardDescription>
              Doanh thu từ booking thành công và tổng số đặt vé theo ngày
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="h-80"
              key={`chart-${data?.recentBookings?.length || 0}-${isRefreshing}`}
            >
              {(() => {
                // Calculate data for last 7 days
                const last7Days = [];
                const revenueByDay = {};
                const successfulBookingsByDay = {};
                const cancelledBookingsByDay = {};

                for (let i = 6; i >= 0; i--) {
                  const date = new Date();
                  date.setDate(date.getDate() - i);
                  const dateStr = date.toISOString().split("T")[0];
                  last7Days.push(dateStr);
                  revenueByDay[dateStr] = 0;
                  successfulBookingsByDay[dateStr] = 0;
                  cancelledBookingsByDay[dateStr] = 0;
                }

                // Aggregate data by day
                data.recentBookings.forEach((booking) => {
                  const bookingDate = new Date(
                    booking.bookingDate || booking.createdAt
                  );
                  const dateStr = bookingDate.toISOString().split("T")[0];

                  console.log("Processing booking:", {
                    originalDate: booking.bookingDate || booking.createdAt,
                    parsedDate: bookingDate,
                    dateStr: dateStr,
                    status: booking.status,
                    amount:
                      booking.amount || booking.totalAmount || booking.price,
                  });

                  if (revenueByDay.hasOwnProperty(dateStr)) {
                    const isSuccessful =
                      booking.status === "CONFIRMED" ||
                      booking.status === "COMPLETED";

                    // Count all bookings regardless of status
                    successfulBookingsByDay[dateStr] += 1;

                    // Only count revenue from successful bookings
                    if (isSuccessful) {
                      revenueByDay[dateStr] +=
                        booking.amount ||
                        booking.totalAmount ||
                        booking.price ||
                        0;
                    }
                  }
                });

                console.log("Final data:", {
                  revenueByDay,
                  successfulBookingsByDay,
                  last7Days,
                });

                const revenueData = last7Days.map((date) => revenueByDay[date]);
                const totalBookingsData = last7Days.map(
                  (date) => successfulBookingsByDay[date]
                );

                return (
                  <Bar
                    data={{
                      labels: last7Days.map((date) => {
                        const d = new Date(date);
                        return d.toLocaleDateString("vi-VN", {
                          weekday: "short",
                          day: "numeric",
                        });
                      }),
                      datasets: [
                        {
                          label: "Doanh thu (VNĐ)",
                          data: revenueData,
                          backgroundColor: "rgba(59, 130, 246, 0.8)",
                          borderColor: "rgba(59, 130, 246, 1)",
                          borderWidth: 1,
                          borderRadius: 4,
                          yAxisID: "y",
                        },
                        {
                          label: "Tổng số đặt vé",
                          data: totalBookingsData,
                          backgroundColor: "rgba(16, 185, 129, 0.8)",
                          borderColor: "rgba(16, 185, 129, 1)",
                          borderWidth: 1,
                          borderRadius: 4,
                          yAxisID: "y1",
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top",
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              if (context.datasetIndex === 0) {
                                return `Doanh thu: ${formatCurrencyVND(
                                  context.parsed.y
                                )}`;
                              } else {
                                return `${context.dataset.label}: ${context.parsed.y} booking`;
                              }
                            },
                          },
                        },
                      },
                      scales: {
                        x: {
                          grid: {
                            display: false,
                          },
                        },
                        y: {
                          type: "linear",
                          display: true,
                          position: "left",
                          title: {
                            display: true,
                            text: "Doanh thu (VNĐ)",
                          },
                          ticks: {
                            callback: function (value) {
                              return formatCurrencyVND(value, true);
                            },
                          },
                        },
                        y1: {
                          type: "linear",
                          display: true,
                          position: "right",
                          title: {
                            display: true,
                            text: "Số lượng booking",
                          },
                          grid: {
                            drawOnChartArea: false,
                          },
                          min: 0,
                        },
                      },
                    }}
                  />
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Đặt Vé Gần Đây
              <Badge variant="outline" className="ml-2">
                {data.recentBookings.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Các booking mới nhất trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentBookings.length > 0 ? (
                data.recentBookings.map((booking, index) => (
                  <div
                    key={booking.bookingId || `booking-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {booking.contactEmail || booking.userEmail || "N/A"}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${layBadgeTrangThai(
                            getBookingStatusText(booking.status)
                          )}`}
                        >
                          {getBookingStatusText(booking.status)}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {booking.flightNumber} • {booking.travelClass}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(booking.bookingDate)} •{" "}
                        {Array.isArray(booking.passengers)
                          ? booking.passengers.length
                          : booking.passengers &&
                            typeof booking.passengers === "object"
                          ? 1
                          : booking.passengers || 0}{" "}
                        hành khách
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrencyVND(
                          booking.amount || booking.totalAmount || 0
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Chưa có đặt vé nào
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Flights */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Chuyến Bay Sắp Tới
              <Badge variant="outline" className="ml-2">
                {data.upcomingFlights.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Các chuyến bay khởi hành trong 24h tới
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.upcomingFlights.length > 0 ? (
                data.upcomingFlights.map((flight, index) => (
                  <div
                    key={flight.flightId || `flight-${index}`}
                    className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {flight.flightNumber}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          getFlightStatusText(flight.status) === "Đúng Giờ"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {getFlightStatusText(flight.status)}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {flight.route ||
                        `${flight.departureAirport?.airportCode || "N/A"} → ${
                          flight.arrivalAirport?.airportCode || "N/A"
                        }`}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatDateTime(flight.departureTime)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {flight.airline?.airlineName ||
                          flight.airlineName ||
                          "Unknown Airline"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span>
                        Đã đặt:{" "}
                        {(flight.aircraft?.totalSeats ||
                          flight.totalSeats ||
                          0) - (flight.availableSeats || 0)}
                      </span>
                      <span>Còn trống: {flight.availableSeats || 0}</span>
                    </div>
                    <Progress
                      value={
                        (((flight.aircraft?.totalSeats ||
                          flight.totalSeats ||
                          0) -
                          (flight.availableSeats || 0)) /
                          (flight.aircraft?.totalSeats ||
                            flight.totalSeats ||
                            1)) *
                        100
                      }
                      className="h-1 mt-2"
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Không có chuyến bay sắp tới
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Routes */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Tuyến Bay Phổ Biến</CardTitle>
            <CardDescription>
              Top 5 tuyến bay theo số lượng booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topRoutes.length > 0 ? (
                data.topRoutes.map((route, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {route.route}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {route.bookings} booking
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrencyVND(route.revenue)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Chưa có dữ liệu tuyến bay
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Tình Trạng Hệ Thống
            </CardTitle>
            <CardDescription>
              Giám sát hiệu suất và độ ổn định của hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {data.systemHealth.bookingSuccessRate}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Tỷ lệ đặt vé thành công
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrencyVND(data.systemHealth.averageBookingValue)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Giá trị đặt vé trung bình
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(data.systemHealth.customerSatisfaction)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mức độ hài lòng KH
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {data.systemHealth.systemUptime.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Thời gian hoạt động
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {Math.round(data.systemHealth.apiResponseTime)}ms
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Thời gian phản hồi API
                </div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {data.systemHealth.errorRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Tỷ lệ lỗi hệ thống
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Liên Kết Nhanh</CardTitle>
          <CardDescription>
            Truy cập nhanh đến các chức năng quản lý quan trọng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link to="/admin/flights" className="block">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plane className="h-6 w-6" />
                <span className="text-xs">Quản Lý Chuyến Bay</span>
              </Button>
            </Link>
            <Link to="/admin/bookings" className="block">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <Calendar className="h-6 w-6" />
                <span className="text-xs">Quản Lý Đặt Vé</span>
              </Button>
            </Link>
            <Link to="/admin/users" className="block">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                <Users className="h-6 w-6" />
                <span className="text-xs">Quản Lý Người Dùng</span>
              </Button>
            </Link>
            <Link to="/admin/airlines" className="block">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                <Globe className="h-6 w-6" />
                <span className="text-xs">Quản Lý Hãng Bay</span>
              </Button>
            </Link>
            <Link to="/admin/reports" className="block">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-xs">Báo Cáo & Thống Kê</span>
              </Button>
            </Link>
            <Link to="/admin/deals" className="block">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
              >
                <Zap className="h-6 w-6" />
                <span className="text-xs">Quản Lý Khuyến Mãi</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
