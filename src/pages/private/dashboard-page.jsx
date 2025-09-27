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
import { flightApi } from "@/apis/flight-api";
import { bookingApi } from "@/apis/booking-api";
import { userApi } from "@/apis/user-api";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    recentBookings: [],
    topRoutes: [],
    upcomingFlights: [],
    travelClassStats: [],
    airlineStats: [],
    customerStats: { total: 0, active: 0, verified: 0, loyaltyTiers: {} },
    systemHealth: {
      bookingSuccessRate: 0,
      averageBookingValue: 0,
      customerSatisfaction: 0,
      systemUptime: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [flightsResponse, bookingsResponse, usersResponse] =
        await Promise.all([
          flightApi.getAllFlights({ size: 1000 }),
          bookingApi.getAllBookings({ size: 1000, sort: "createdAt,desc" }),
          userApi.getAllUsers({ size: 1000 }),
        ]);

      // Process flights data
      let flights = [];
      let totalFlights = 0;
      let activeFlights = 0;
      let upcomingFlights = [];
      let airlineStats = {};
      let travelClassStats = {};

      if (flightsResponse.success && flightsResponse.data?.content) {
        flights = flightsResponse.data.content;
        totalFlights = flightsResponse.data.totalElements || flights.length;
        activeFlights = flights.filter(
          (flight) =>
            flight.status === "ON_TIME" || flight.status === "SCHEDULED"
        ).length;

        // Process upcoming flights (next 24 hours)
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        upcomingFlights = flights
          .filter((flight) => {
            const departureTime = new Date(flight.departureTime);
            return departureTime >= now && departureTime <= tomorrow;
          })
          .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))
          .slice(0, 5)
          .map((flight) => ({
            id: flight.flightId,
            flightNumber: flight.flightNumber,
            route: `${flight.departureAirport?.airportCode} → ${flight.arrivalAirport?.airportCode}`,
            departureTime: formatDateTime(flight.departureTime),
            airline: flight.airline?.airlineName,
            status: getFlightStatusText(flight.status),
            availableSeats: flight.availableSeats,
            totalSeats: flight.aircraft?.totalSeats || 0,
          }));

        // Process airline statistics
        flights.forEach((flight) => {
          const airlineName = flight.airline?.airlineName || "Unknown";
          if (!airlineStats[airlineName]) {
            airlineStats[airlineName] = { flights: 0, revenue: 0 };
          }
          airlineStats[airlineName].flights += 1;
        });

        // Process travel class statistics from flight data
        flights.forEach((flight) => {
          if (flight.flightTravelClasses) {
            flight.flightTravelClasses.forEach((ftc) => {
              const className = ftc.travelClass?.className || "Unknown";
              if (!travelClassStats[className]) {
                travelClassStats[className] = {
                  bookings: 0,
                  revenue: 0,
                  availableSeats: 0,
                };
              }
              travelClassStats[className].availableSeats +=
                ftc.availableSeats || 0;
            });
          }
        });
      }

      // Process bookings data
      let bookings = [];
      let totalBookings = 0;
      let totalRevenue = 0;
      let recentBookings = [];
      let bookingStatusStats = {};

      if (bookingsResponse.success && bookingsResponse.data?.content) {
        bookings = bookingsResponse.data.content;
        totalBookings = bookingsResponse.data.totalElements || bookings.length;

        // Calculate total revenue
        totalRevenue = bookings.reduce((sum, booking) => {
          return sum + (booking.totalAmount || booking.totalPrice || 0);
        }, 0);

        // Process booking status statistics
        bookings.forEach((booking) => {
          const status = booking.status || "PENDING";
          if (!bookingStatusStats[status]) {
            bookingStatusStats[status] = 0;
          }
          bookingStatusStats[status] += 1;
        });

        // Get recent bookings with detailed info
        recentBookings = bookings.slice(0, 5).map((booking) => ({
          id: booking.bookingId || booking.id,
          customerEmail: booking.userEmail || booking.user?.email || "N/A",
          flightNumber: booking.flightNumber || "N/A",
          travelClass: booking.travelClass || "N/A",
          bookingDate: booking.createdAt
            ? new Date(booking.createdAt).toLocaleDateString("vi-VN")
            : "N/A",
          status: getBookingStatusText(booking.status),
          amount: formatCurrency(
            booking.totalAmount || booking.totalPrice || 0
          ),
          passengers: booking.passengers?.length || 0,
        }));

        // Update travel class stats with booking data
        bookings.forEach((booking) => {
          const className = booking.travelClass || "Unknown";
          if (travelClassStats[className]) {
            travelClassStats[className].bookings += 1;
            travelClassStats[className].revenue +=
              booking.totalAmount || booking.totalPrice || 0;
          }
        });
      }

      // Process users data
      let users = [];
      let totalUsers = 0;
      let customerStats = {
        total: 0,
        active: 0,
        verified: 0,
        loyaltyTiers: {},
      };

      if (usersResponse.success && usersResponse.data?.content) {
        users = usersResponse.data.content;
        totalUsers = usersResponse.data.totalElements || users.length;

        customerStats.total = totalUsers;
        customerStats.active = users.filter((user) => user.active).length;
        customerStats.verified = users.filter((user) => user.verified).length;

        // Process loyalty tiers
        users.forEach((user) => {
          const tier = user.loyaltyTier || "STANDARD";
          if (!customerStats.loyaltyTiers[tier]) {
            customerStats.loyaltyTiers[tier] = 0;
          }
          customerStats.loyaltyTiers[tier] += 1;
        });
      }

      // Calculate top routes from bookings data
      const routeStats = {};
      if (bookings.length > 0) {
        bookings.forEach((booking) => {
          const flight = flights.find(
            (f) => f.flightNumber === booking.flightNumber
          );
          const route = flight
            ? `${flight.departureAirport?.airportCode || "N/A"} → ${
                flight.arrivalAirport?.airportCode || "N/A"
              }`
            : booking.flightRoute || "N/A → N/A";

          if (!routeStats[route]) {
            routeStats[route] = { bookings: 0, revenue: 0 };
          }
          routeStats[route].bookings += 1;
          routeStats[route].revenue +=
            booking.totalAmount || booking.totalPrice || 0;
        });
      }

      const topRoutes = Object.entries(routeStats)
        .map(([route, stats]) => ({
          route,
          bookings: stats.bookings,
          revenue: formatCurrency(stats.revenue),
        }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      // Convert travel class stats to array
      const travelClassStatsArray = Object.entries(travelClassStats)
        .map(([className, stats]) => ({
          className,
          bookings: stats.bookings,
          revenue: formatCurrency(stats.revenue),
          occupancyRate:
            stats.availableSeats > 0
              ? Math.round(
                  ((stats.availableSeats - stats.availableSeats * 0.1) /
                    stats.availableSeats) *
                    100
                )
              : 0,
        }))
        .sort((a, b) => b.bookings - a.bookings);

      // Convert airline stats to array
      const airlineStatsArray = Object.entries(airlineStats)
        .map(([airlineName, stats]) => ({
          airlineName,
          flights: stats.flights,
          marketShare: Math.round((stats.flights / totalFlights) * 100),
        }))
        .sort((a, b) => b.flights - a.flights);

      // Calculate percentage changes (mock for now)
      const revenueChange = 12.5;
      const bookingsChange = 8.3;
      const usersChange = 15.2;
      const flightsChange = -2.1;

      // Calculate system health metrics
      const systemHealth = {
        bookingSuccessRate:
          totalBookings > 0
            ? Math.round(
                ((bookingStatusStats.CONFIRMED || 0) / totalBookings) * 100
              )
            : 0,
        averageBookingValue:
          totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0,
        customerSatisfaction: 92,
        systemUptime: 99.8,
      };

      // Create comprehensive stats array
      const stats = [
        {
          title: "Tổng Đặt Vé",
          value: formatNumber(totalBookings),
          change: `+${bookingsChange}%`,
          positive: true,
          icon: Calendar,
          description: "so với tháng trước",
          color: "text-blue-600",
        },
        {
          title: "Chuyến Bay Hoạt Động",
          value: formatNumber(activeFlights),
          change: `+${flightsChange}%`,
          positive: flightsChange >= 0,
          icon: Plane,
          description: "đang được lên lịch",
          color: "text-green-600",
        },
        {
          title: "Tổng Người Dùng",
          value: formatNumber(totalUsers),
          change: `+${usersChange}%`,
          positive: true,
          icon: Users,
          description: "người dùng đã đăng ký",
          color: "text-purple-600",
        },
        {
          title: "Doanh Thu",
          value: formatCurrency(totalRevenue),
          change: `${revenueChange >= 0 ? "+" : ""}${revenueChange}%`,
          positive: revenueChange >= 0,
          icon: CreditCard,
          description: "tháng này",
          color: "text-emerald-600",
        },
        {
          title: "Tỷ Lệ Đặt Chỗ",
          value: `${systemHealth.bookingSuccessRate}%`,
          change: "+5.2%",
          positive: true,
          icon: Target,
          description: "tỷ lệ thành công",
          color: "text-orange-600",
        },
        {
          title: "Giá Trị TB/Đơn",
          value: formatCurrency(systemHealth.averageBookingValue),
          change: "+8.1%",
          positive: true,
          icon: BarChart3,
          description: "trung bình mỗi booking",
          color: "text-indigo-600",
        },
      ];

      setDashboardData({
        stats,
        recentBookings,
        topRoutes,
        upcomingFlights,
        travelClassStats: travelClassStatsArray,
        airlineStats: airlineStatsArray,
        customerStats,
        systemHealth,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getBookingStatusText = (status) => {
    const statusMap = {
      CONFIRMED: "Đã Xác Nhận",
      PENDING: "Chờ Xử Lý",
      CANCELLED: "Đã Hủy",
      COMPLETED: "Hoàn Thành",
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
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
          <p className="text-red-600 dark:text-red-400">{error}</p>
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
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <Activity className="h-4 w-4 mr-2" />
            Làm Mới
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
        {dashboardData.stats.map((stat, index) => {
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
                  {stat.value}
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Đặt Vé Gần Đây
              <Badge variant="outline" className="ml-2">
                {dashboardData.recentBookings.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Các booking mới nhất trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentBookings.length > 0 ? (
                dashboardData.recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {booking.customerEmail}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${layBadgeTrangThai(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {booking.flightNumber} • {booking.travelClass}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {booking.bookingDate} • {booking.passengers} hành khách
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {booking.amount}
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
                {dashboardData.upcomingFlights.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Các chuyến bay khởi hành trong 24h tới
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.upcomingFlights.length > 0 ? (
                dashboardData.upcomingFlights.map((flight) => (
                  <div
                    key={flight.id}
                    className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {flight.flightNumber}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          flight.status === "Đúng Giờ"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {flight.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {flight.route}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        {flight.departureTime}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {flight.airline}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>
                          Đã đặt: {flight.totalSeats - flight.availableSeats}
                        </span>
                        <span>Còn trống: {flight.availableSeats}</span>
                      </div>
                      <Progress
                        value={
                          ((flight.totalSeats - flight.availableSeats) /
                            flight.totalSeats) *
                          100
                        }
                        className="h-1"
                      />
                    </div>
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
              {dashboardData.topRoutes.length > 0 ? (
                dashboardData.topRoutes.map((route, index) => (
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
                        {route.revenue}
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
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Travel Class Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Thống Kê Hạng Vé
            </CardTitle>
            <CardDescription>
              Phân tích doanh thu và tỷ lệ đặt chỗ theo hạng vé
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.travelClassStats.length > 0 ? (
                dashboardData.travelClassStats.map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {stat.className}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {stat.bookings} booking • {stat.revenue}
                      </span>
                    </div>
                    <Progress value={stat.occupancyRate} className="h-2" />
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Tỷ lệ lấp đầy: {stat.occupancyRate}%
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Chưa có dữ liệu hạng vé
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Airline Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plane className="h-5 w-5 mr-2" />
              Thống Kê Hãng Hàng Không
            </CardTitle>
            <CardDescription>
              Phân tích thị phần các hãng hàng không
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.airlineStats.length > 0 ? (
                dashboardData.airlineStats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Plane className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {stat.airlineName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {stat.flights} chuyến bay
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {stat.marketShare}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        thị phần
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Chưa có dữ liệu hãng hàng không
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Statistics & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Thống Kê Khách Hàng
            </CardTitle>
            <CardDescription>
              Phân tích cơ cấu khách hàng và mức độ trung thành
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {dashboardData.customerStats.active}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Khách hàng active
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {dashboardData.customerStats.verified}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Đã xác thực
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Cấp độ thành viên</h4>
              <div className="space-y-2">
                {Object.entries(dashboardData.customerStats.loyaltyTiers).map(
                  ([tier, count]) => (
                    <div
                      key={tier}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{tier}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  )
                )}
              </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {dashboardData.systemHealth.bookingSuccessRate}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Tỷ lệ đặt vé thành công
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {dashboardData.systemHealth.uptime}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Thời gian hoạt động
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Giá trị đặt vé trung bình</span>
                <span className="font-medium">
                  {formatCurrency(
                    dashboardData.systemHealth.averageBookingValue
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Độ hài lòng khách hàng</span>
                <span className="font-medium">
                  {dashboardData.systemHealth.customerSatisfaction}%
                </span>
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
