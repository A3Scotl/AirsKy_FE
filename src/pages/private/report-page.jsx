import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Users,
  Plane,
  DollarSign,
  Activity,
  Filter,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import {
  formatCurrencyVND,
  formatDateVN,
  formatNumberVN,
} from "@/utils/currency-utils";
import { cn } from "@/lib/utils";
import RevenueChart from "@/components/admin/reports/report-revenue-chart";
import BookingChart from "@/components/admin/reports/report-booking-chart";
import CustomerChart from "@/components/admin/reports/report-customer-chart";
import FlightChart from "@/components/admin/reports/report-flight-chart";
import ReportTable from "@/components/admin/reports/report-table";
import { flightApi } from "@/apis/flight-api";
import { bookingApi } from "@/apis/booking-api";
import { userApi } from "@/apis/user-api";

const AdminReportPage = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [period, setPeriod] = useState("30days");
  const [reportType, setReportType] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);

  // State for real API data
  const [reportData, setReportData] = useState({
    summary: {
      totalRevenue: 0,
      totalBookings: 0,
      totalCustomers: 0,
      totalFlights: 0,
      revenueChange: 0,
      bookingsChange: 0,
      customersChange: 0,
      flightsChange: 0,
    },
    charts: {
      revenue: [],
      bookings: [],
      customers: [],
      flights: [],
    },
  });

  // State for raw data to pass to components
  const [rawData, setRawData] = useState({
    bookings: [],
    users: [],
    flights: [],
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange, period, reportType]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Fetch data from APIs
      const [flightsResponse, bookingsResponse, usersResponse] =
        await Promise.all([
          flightApi.getAllFlights({ size: 1000 }), // Get all flights for statistics
          bookingApi.getAllBookings({ size: 1000 }), // Get all bookings for statistics
          userApi.getAllUsers({ size: 1000 }), // Get all users for statistics
        ]);

      if (
        !flightsResponse.success ||
        !bookingsResponse.success ||
        !usersResponse.success
      ) {
        throw new Error("Failed to fetch data from APIs");
      }

      const allFlights = flightsResponse.data?.content || [];
      const allBookings = bookingsResponse.data?.content || [];
      const allUsers = usersResponse.data?.content || [];

      // Helper function to filter data by date range
      const filterByDateRange = (items, dateField) => {
        if (!dateRange.from || !dateRange.to) return items;

        return items.filter((item) => {
          const itemDate = new Date(item[dateField]);
          return itemDate >= dateRange.from && itemDate <= dateRange.to;
        });
      };

      // Filter data by selected date range
      const bookings = filterByDateRange(allBookings, "createdAt");
      const flights = filterByDateRange(allFlights, "departureTime");
      const users = filterByDateRange(allUsers, "createdAt");

      // Calculate summary statistics for current period
      const totalRevenue = bookings.reduce(
        (sum, booking) =>
          sum +
          (booking.totalAmount || booking.totalPrice || booking.price || 0),
        0
      );
      const totalBookings = bookings.length;
      const totalCustomers = users.length;
      const totalFlights = flights.length;

      // Calculate previous period (same duration before current period)
      const periodDuration = dateRange.to.getTime() - dateRange.from.getTime();
      const previousPeriodStart = new Date(
        dateRange.from.getTime() - periodDuration
      );
      const previousPeriodEnd = new Date(dateRange.from.getTime());

      const previousBookings = allBookings.filter((booking) => {
        const bookingDate = new Date(booking.createdAt || booking.bookingDate);
        return (
          bookingDate >= previousPeriodStart && bookingDate < previousPeriodEnd
        );
      });

      const previousUsers = allUsers.filter((user) => {
        const userDate = new Date(user.createdAt);
        return userDate >= previousPeriodStart && userDate < previousPeriodEnd;
      });

      const previousFlights = allFlights.filter((flight) => {
        const flightDate = new Date(flight.departureTime);
        return (
          flightDate >= previousPeriodStart && flightDate < previousPeriodEnd
        );
      });

      // Calculate previous period totals
      const previousRevenue = previousBookings.reduce(
        (sum, booking) =>
          sum +
          (booking.totalAmount || booking.totalPrice || booking.price || 0),
        0
      );
      const previousBookingsCount = previousBookings.length;
      const previousCustomersCount = previousUsers.length;
      const previousFlightsCount = previousFlights.length;

      // Calculate percentage changes
      const calculateChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const revenueChange = calculateChange(totalRevenue, previousRevenue);
      const bookingsChange = calculateChange(
        totalBookings,
        previousBookingsCount
      );
      const customersChange = calculateChange(
        totalCustomers,
        previousCustomersCount
      );
      const flightsChange = calculateChange(totalFlights, previousFlightsCount);

      // Generate chart data based on period and filtered data
      const generateChartData = (type) => {
        const data = [];

        // Group data by date within the selected range
        const dateGroups = {};

        // Initialize date groups for the selected range
        const currentDate = new Date(dateRange.from);
        while (currentDate <= dateRange.to) {
          const dateKey = format(currentDate, "MM/dd");
          dateGroups[dateKey] = {
            date: dateKey,
            revenue: 0,
            bookings: 0,
            customers: 0,
            flights: 0,
          };
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Populate data based on type
        switch (type) {
          case "revenue":
            bookings.forEach((booking) => {
              const bookingDate = new Date(
                booking.createdAt || booking.bookingDate
              );
              const dateKey = format(bookingDate, "MM/dd");
              if (dateGroups[dateKey]) {
                dateGroups[dateKey].revenue +=
                  booking.totalAmount ||
                  booking.totalPrice ||
                  booking.price ||
                  0;
              }
            });
            break;
          case "bookings":
            bookings.forEach((booking) => {
              const bookingDate = new Date(
                booking.createdAt || booking.bookingDate
              );
              const dateKey = format(bookingDate, "MM/dd");
              if (dateGroups[dateKey]) {
                dateGroups[dateKey].bookings += 1;
              }
            });
            break;
          case "customers":
            users.forEach((user) => {
              const userDate = new Date(user.createdAt);
              const dateKey = format(userDate, "MM/dd");
              if (dateGroups[dateKey]) {
                dateGroups[dateKey].customers += 1;
              }
            });
            break;
          case "flights":
            flights.forEach((flight) => {
              const flightDate = new Date(flight.departureTime);
              const dateKey = format(flightDate, "MM/dd");
              if (dateGroups[dateKey]) {
                dateGroups[dateKey].flights += 1;
              }
            });
            break;
        }

        // Convert to array and sort by date
        return Object.values(dateGroups).sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA - dateB;
        });
      };

      setReportData({
        summary: {
          totalRevenue,
          totalBookings,
          totalCustomers,
          totalFlights,
          revenueChange,
          bookingsChange,
          customersChange,
          flightsChange,
        },
        charts: {
          revenue: generateChartData("revenue"),
          bookings: generateChartData("bookings"),
          customers: generateChartData("customers"),
          flights: generateChartData("flights"),
        },
      });

      // Store raw data for components
      setRawData({
        bookings,
        users,
        flights,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      // Set default values on error
      setReportData({
        summary: {
          totalRevenue: 0,
          totalBookings: 0,
          totalCustomers: 0,
          totalFlights: 0,
          revenueChange: 0,
          bookingsChange: 0,
          customersChange: 0,
          flightsChange: 0,
        },
        charts: {
          revenue: [],
          bookings: [],
          customers: [],
          flights: [],
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = (format) => {
    // Handle export functionality
    // console.log(`Exporting report in ${format} format`);
  };

  const formatCurrency = (amount) => {
    return formatCurrencyVND(amount);
  };

  const formatNumber = (number) => {
    return formatNumberVN(number);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Báo Cáo & Thống Kê
          </h1>
          <p className="text-gray-600">
            Phân tích chi tiết về hoạt động kinh doanh
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-auto">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from &&
                dateRange.from instanceof Date &&
                !isNaN(dateRange.from.getTime()) ? (
                  dateRange.to &&
                  dateRange.to instanceof Date &&
                  !isNaN(dateRange.to.getTime()) ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                      {format(dateRange.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy")
                  )
                ) : (
                  <span>Chọn ngày</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Chọn khoảng thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 ngày qua</SelectItem>
              <SelectItem value="30days">30 ngày qua</SelectItem>
              <SelectItem value="90days">90 ngày qua</SelectItem>
              <SelectItem value="custom">Tùy chỉnh</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={fetchReportData}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
            />
            Làm Mới
          </Button>

          <Button onClick={() => handleExportReport("excel")}>
            <Download className="h-4 w-4 mr-2" />
            Xuất Báo Cáo
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng Doanh Thu
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData.summary.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {reportData.summary.revenueChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span
                className={
                  reportData.summary.revenueChange > 0
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {Math.abs(reportData.summary.revenueChange)}%
              </span>
              <span className="ml-1">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Đặt Vé</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(reportData.summary.totalBookings)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {reportData.summary.bookingsChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span
                className={
                  reportData.summary.bookingsChange > 0
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {Math.abs(reportData.summary.bookingsChange)}%
              </span>
              <span className="ml-1">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách Hàng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(reportData.summary.totalCustomers)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {reportData.summary.customersChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span
                className={
                  reportData.summary.customersChange > 0
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {Math.abs(reportData.summary.customersChange)}%
              </span>
              <span className="ml-1">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chuyến Bay</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(reportData.summary.totalFlights)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {reportData.summary.flightsChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span
                className={
                  reportData.summary.flightsChange > 0
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {Math.abs(reportData.summary.flightsChange)}%
              </span>
              <span className="ml-1">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs
        value={reportType}
        onValueChange={setReportType}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng Quan</TabsTrigger>
          <TabsTrigger value="revenue">Doanh Thu</TabsTrigger>
          <TabsTrigger value="bookings">Đặt Vé</TabsTrigger>
          <TabsTrigger value="customers">Khách Hàng</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart
              bookings={rawData.bookings}
              isLoading={isLoading}
              dateRange={dateRange}
            />
            <BookingChart
              bookings={rawData.bookings}
              isLoading={isLoading}
              dateRange={dateRange}
            />
            <CustomerChart
              users={rawData.users}
              isLoading={isLoading}
              dateRange={dateRange}
            />
            <FlightChart
              flights={rawData.flights}
              isLoading={isLoading}
              dateRange={dateRange}
            />
          </div>
          <ReportTable
            type="overview"
            dateRange={dateRange}
            realData={rawData}
          />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <RevenueChart
            bookings={rawData.bookings}
            isLoading={isLoading}
            detailed={true}
            dateRange={dateRange}
          />
          <ReportTable
            type="revenue"
            dateRange={dateRange}
            realData={rawData}
          />
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <BookingChart
            bookings={rawData.bookings}
            isLoading={isLoading}
            detailed={true}
            dateRange={dateRange}
          />
          <ReportTable
            type="bookings"
            dateRange={dateRange}
            realData={rawData}
          />
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <CustomerChart
            users={rawData.users}
            isLoading={isLoading}
            detailed={true}
            dateRange={dateRange}
          />
          <ReportTable
            type="customers"
            dateRange={dateRange}
            realData={rawData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReportPage;
