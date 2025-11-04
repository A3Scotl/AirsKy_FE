import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
// Overview cards are now inline in the component
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import OverviewExportButton from "@/components/admin/reports/overview-export-button";

import { useReportsData } from "@/hooks/use-reports-data";
import { useLazyReports } from "@/hooks/use-lazy-reports";

// Skeleton components for loading states
const ReportSkeleton = ({ type = "overview" }) => {
  if (type === "summary") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-3 w-3 rounded" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (type === "chart") {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (type === "table") {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table header */}
            <div className="flex space-x-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-4 w-20 flex-1" />
              ))}
            </div>
            {/* Table rows */}
            {Array.from({ length: 8 }).map((_, rowIndex) => (
              <div key={rowIndex} className="flex space-x-4">
                {Array.from({ length: 6 }).map((_, colIndex) => (
                  <Skeleton key={colIndex} className="h-4 w-20 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default overview skeleton
  return (
    <div className="space-y-6">
      <ReportSkeleton type="summary" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportSkeleton type="chart" />
        <ReportSkeleton type="chart" />
      </div>
      <ReportSkeleton type="table" />
    </div>
  );
};

const AdminReportPage = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [period, setPeriod] = useState("30days");
  const [reportType, setReportType] = useState("overview");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Update dateRange when period changes (except for custom)
  useEffect(() => {
    if (period !== "custom") {
      const daysMap = {
        "7days": 7,
        "30days": 30,
        "90days": 90,
      };

      const days = daysMap[period] || 30;
      const today = new Date();
      const fromDate = new Date();
      fromDate.setDate(today.getDate() - days);

      console.log(
        `Setting dateRange for ${period}: from ${fromDate.toISOString()} to ${today.toISOString()}`
      );

      setDateRange({
        from: fromDate,
        to: today,
      });
      setShowCustomDatePicker(false);
    } else {
      setShowCustomDatePicker(true);
    }
  }, [period]);

  // Use lazy loading hooks - only load data when needed per tab
  const {
    useRevenueData,
    useBookingsData,
    useCustomersData,
    useFlightsData,
    useOverviewData,
    prefetchData,
    clearCache,
  } = useLazyReports(dateRange, period);

  // Alternative: Use unified hook (uncomment to switch)
  const {
    rawData: reportsData,
    processedData,
    summary,
    isLoading,
    error,
    refetch: fetchReportData,
  } = useReportsData({
    dateRange,
    period,
    mode: "reports",
  });

  // Always load overview data for the 4 summary cards (independent of current tab)
  const overviewSummaryQuery = useOverviewData(true); // Always enabled for summary cards

  // Enable data loading based on current tab
  const overviewQuery = useOverviewData(reportType === "overview");
  const revenueQuery = useRevenueData(reportType === "revenue");
  const bookingsQuery = useBookingsData(reportType === "bookings");
  const customersQuery = useCustomersData(reportType === "customers");
  const flightsQuery = useFlightsData(reportType === "flights");

  // Get current tab's data and loading state
  // const getCurrentTabData = () => {
  //   switch (reportType) {
  //     case "overview":
  //       return overviewQuery;
  //     case "revenue":
  //       return revenueQuery;
  //     case "bookings":
  //       return bookingsQuery;
  //     case "customers":
  //       return customersQuery;
  //     case "flights":
  //       return flightsQuery;
  //     default:
  //       return overviewQuery;
  //   }
  // };

  // const currentTabData = getCurrentTabData();
  // const {
  //   data: reportsData,
  //   isLoading,
  //   error,
  //   refetch: fetchReportData,
  // } = currentTabData;

  // Smart prefetching: Prefetch next likely tab when user hovers or after delay
  // useEffect(() => {
  //   const prefetchTimer = setTimeout(() => {
  //     // Prefetch overview if not current tab (most commonly accessed)
  //     if (reportType !== "overview") {
  //       prefetchData("overview");
  //     }

  //     // Prefetch revenue data (second most common)
  //     if (reportType !== "revenue") {
  //       prefetchData("revenue");
  //     }
  //   }, 2000); // Wait 2 seconds before prefetching

  //   return () => clearTimeout(prefetchTimer);
  // }, [reportType, prefetchData]);

  // Handle tab change with smooth transition
  const handleTabChange = (newTab) => {
    console.log(`🔄 Switching to ${newTab} tab`);
    setReportType(newTab);

    // Optional: Clear cache for other tabs to free memory
    // clearCache(); // Uncomment if memory usage becomes an issue
  };

  // Handle data structure from unified hook with proper validation
  const flights = Array.isArray(reportsData?.flights)
    ? reportsData.flights
    : [];

  // Fix for bookings data - correct path to revenue data
  const bookings =
    Array.isArray(reportsData?.bookings) && reportsData.bookings.length > 0
      ? reportsData.bookings
      : Array.isArray(reportsData?.rawData?.content)
      ? reportsData.rawData.content
      : Array.isArray(reportsData?.rawData?.data?.content)
      ? reportsData.rawData.data.content
      : [];

  // Debug bookings data path
  console.log(`📊 Bookings data for ${reportType}:`, {
    reportsDataBookings: reportsData?.bookings,
    reportsDataBookingsLength: reportsData?.bookings?.length,
    rawDataContent: reportsData?.rawData?.content?.length,
    rawDataDataContent: reportsData?.rawData?.data?.content?.length,
    finalBookings: bookings.length,
    finalBookingsType: typeof bookings,
    fullReportsData: reportsData,
  });

  // Debug bookings data flow
  console.log("📈 Bookings data debug:", {
    reportsDataBookings: reportsData?.bookings,
    reportsDataBookingsType: typeof reportsData?.bookings,
    rawDataContent: reportsData?.rawData?.data?.content?.length,
    rawDataDirectContent: reportsData?.rawData?.content?.length,
    fullReportsData: reportsData,
    finalBookings: bookings?.length,
    finalBookingsType: typeof bookings,
    currentTab: reportType,
  });

  const users = Array.isArray(reportsData?.users) ? reportsData.users : [];

  // Process data for components
  const reportData = React.useMemo(() => {
    if (!reportsData)
      return {
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
      };
    const totalFlights = reportsData?.totalFlights || 0;
    const totalBookings = reportsData?.totalBookings || 0;
    const totalUsers = reportsData?.totalUsers || 0;

    // Debug log to check data structure
    console.log("📊 Report data structure:", {
      type: reportsData?.type,
      flights: flights.length,
      bookings: bookings.length,
      users: users.length,
      rawData: reportsData,
    });

    // Calculate summary statistics
    const totalRevenue = Array.isArray(bookings)
      ? bookings.reduce(
          (sum, booking) =>
            sum +
            (booking.totalAmount || booking.totalPrice || booking.price || 0),
          0
        )
      : 0;

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

      // Populate data based on type with proper array validation
      switch (type) {
        case "revenue":
          if (Array.isArray(bookings)) {
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
          }
          break;
        case "bookings":
          if (Array.isArray(bookings)) {
            bookings.forEach((booking) => {
              const bookingDate = new Date(
                booking.createdAt || booking.bookingDate
              );
              const dateKey = format(bookingDate, "MM/dd");
              if (dateGroups[dateKey]) {
                dateGroups[dateKey].bookings += 1;
              }
            });
          }
          break;
        case "customers":
          if (Array.isArray(users)) {
            users.forEach((user) => {
              const userDate = new Date(user.createdAt);
              const dateKey = format(userDate, "MM/dd");
              if (dateGroups[dateKey]) {
                dateGroups[dateKey].customers += 1;
              }
            });
          }
          break;
        case "flights":
          if (Array.isArray(flights)) {
            flights.forEach((flight) => {
              const flightDate = new Date(flight.departureTime);
              const dateKey = format(flightDate, "MM/dd");
              if (dateGroups[dateKey]) {
                dateGroups[dateKey].flights += 1;
              }
            });
          }
          break;
      }

      // Convert to array and sort by date
      return Object.values(dateGroups).sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });
    };

    // Calculate percentage changes (simplified)
    const revenueChange = 0; // Would need previous period data
    const bookingsChange = 0;
    const customersChange = 0;
    const flightsChange = 0;

    return {
      summary: {
        totalRevenue,
        totalBookings,
        totalCustomers: totalUsers,
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
    };
  }, [reportsData, dateRange, bookings, users, flights]);

  const rawData = React.useMemo(
    () => ({
      bookings: bookings,
      users: users,
      flights: flights,
    }),
    [bookings, users, flights]
  );

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Báo Cáo & Thống Kê
          </h1>
          <p className="text-gray-600">
            Phân tích chi tiết về hoạt động kinh doanh
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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

          {showCustomDatePicker && (
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
          )}

          <Button
            onClick={fetchReportData}
            disabled={isLoading}
            variant="outline"
            className="relative"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
            />
            {isLoading ? "Đang tải..." : "Làm Mới"}
            {reportsData?.loadTime && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {reportsData.loadTime.toFixed(0)}ms
              </Badge>
            )}
          </Button>

          {/* Performance indicator */}
          {reportsData?.loadTime && (
            <div className="text-xs text-muted-foreground">
              ⚡ {reportsData.loadTime.toFixed(0)}ms
              {reportType && ` (${reportType} tab)`}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={reportType}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="relative">
            Tổng Quan
            {overviewQuery.isLoading && (
              <RefreshCw className="h-3 w-3 ml-1 animate-spin" />
            )}
          </TabsTrigger>
          <TabsTrigger value="revenue" className="relative">
            Doanh Thu
            {revenueQuery.isLoading && (
              <RefreshCw className="h-3 w-3 ml-1 animate-spin" />
            )}
          </TabsTrigger>
          <TabsTrigger value="bookings" className="relative">
            Đặt Vé
            {bookingsQuery.isLoading && (
              <RefreshCw className="h-3 w-3 ml-1 animate-spin" />
            )}
          </TabsTrigger>
          <TabsTrigger value="customers" className="relative">
            Khách Hàng
            {customersQuery.isLoading && (
              <RefreshCw className="h-3 w-3 ml-1 animate-spin" />
            )}
          </TabsTrigger>
          <TabsTrigger value="flights" className="relative">
            Chuyến Bay
            {flightsQuery.isLoading && (
              <RefreshCw className="h-3 w-3 ml-1 animate-spin" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Header với nút xuất file */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Tổng Quan Toàn Diện
              </h2>
              <p className="text-gray-600">
                Báo cáo tổng hợp tất cả dữ liệu kinh doanh
              </p>
            </div>
            <OverviewExportButton
              rawData={reportsData}
              processedData={reportData.charts.revenue}
              dateRange={dateRange}
              variant="default"
              size="default"
            />
          </div>

          {/* Summary Cards - inline overview cards */}
          {isLoading ? (
            <ReportSkeleton type="summary" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Bookings Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tổng Đặt Vé
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumberVN(bookings?.length || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dateRange?.from && dateRange?.to
                      ? `Từ ${format(dateRange.from, "dd/MM")} - ${format(
                          dateRange.to,
                          "dd/MM"
                        )}`
                      : "Tất cả thời gian"}
                  </p>
                </CardContent>
              </Card>

              {/* Total Revenue Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tổng Doanh Thu
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrencyVND(
                      bookings?.reduce(
                        (sum, b) => sum + (b.totalAmount || b.totalPrice || 0),
                        0
                      ) || 0
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Doanh thu từ đặt vé
                  </p>
                </CardContent>
              </Card>

              {/* Total Customers Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tổng Khách Hàng
                  </CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumberVN(users?.length || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Người dùng đã đăng ký
                  </p>
                </CardContent>
              </Card>

              {/* Total Flights Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tổng Chuyến Bay
                  </CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumberVN(flights?.length || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chuyến bay đã lên lịch
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-6">
              <ReportSkeleton />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReportSkeleton />
                <ReportSkeleton />
              </div>
            </div>
          ) : (
            <>
              {/* Biểu đồ tổng quan */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueChart
                  bookings={rawData.bookings}
                  processedData={reportsData?.chartData}
                  isLoading={false}
                  dateRange={dateRange}
                />
                <BookingChart
                  bookings={bookings}
                  isLoading={false}
                  dateRange={dateRange}
                />
              </div>

              {/* Thêm biểu đồ khách hàng và chuyến bay */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CustomerChart
                  users={reportsData?.users || []}
                  isLoading={false}
                  dateRange={dateRange}
                />
                <FlightChart
                  flights={reportsData?.flights || []}
                  isLoading={false}
                  dateRange={dateRange}
                />
              </div>

              {/* Summary Cards for Overview Tab */}
            </>
          )}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Các thẻ thông tin doanh thu bổ sung */}

          <RevenueChart
            bookings={bookings}
            processedData={reportsData?.chartData}
            isLoading={isLoading}
            detailed={true}
            dateRange={dateRange}
          />
          <ReportTable
            type="revenue"
            dateRange={dateRange}
            realData={rawData}
            isLoading={isLoading}
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
            isLoading={isLoading}
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
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="flights" className="space-y-6">
          <FlightChart
            flights={rawData.flights}
            isLoading={isLoading}
            detailed={true}
            dateRange={dateRange}
          />
          <ReportTable
            type="flights"
            dateRange={dateRange}
            realData={rawData}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReportPage;
