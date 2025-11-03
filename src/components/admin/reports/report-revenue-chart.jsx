import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  formatCurrencyVND,
  formatDateVN,
  formatNumberVN,
} from "@/utils/currency-utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Target,
  Calendar,
} from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const RevenueChart = ({
  bookings,
  processedData,
  isLoading,
  detailed = false,
  dateRange,
}) => {
  console.log("💰 RevenueChart received data:", {
    bookingsType: typeof bookings,
    bookingsValue: bookings,
    bookingsLength: bookings?.length,
    isLoading,
    hasBookings: Array.isArray(bookings),
  });

  if (isLoading) {
    return (
      <Card className={detailed ? "col-span-full" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Phân tích doanh thu
          </CardTitle>
          <CardDescription>Đang tải dữ liệu doanh thu...</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading skeleton for metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
                <div className="h-8 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>

          {/* Loading skeleton for chart */}
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card className={detailed ? "col-span-full" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Thống Kê Doanh Thu
          </CardTitle>
          <CardDescription>
            Theo dõi hiệu suất và xu hướng doanh thu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Không có dữ liệu doanh thu</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process bookings data to create chart data
  const processBookingsData = () => {
    // Use processed data from Web Worker if available
    if (processedData?.revenue?.revenueByMonth) {
      return processedData.revenue.revenueByMonth.map((item) => ({
        date: item.month,
        revenue: item.revenue,
        bookings: 0, // Will be calculated from other data if needed
      }));
    }

    // Fallback to manual processing
    const revenueByDate = {};

    // Validate bookings is an array before forEach
    if (!Array.isArray(bookings) || bookings.length === 0) {
      return [];
    }

    bookings.forEach((booking) => {
      const date = new Date(booking.createdAt || booking.bookingDate);

      // Filter by date range if provided
      if (dateRange && (date < dateRange.from || date > dateRange.to)) {
        return;
      }

      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD format

      if (!revenueByDate[dateKey]) {
        revenueByDate[dateKey] = {
          date: date,
          revenue: 0,
          bookings: 0,
        };
      }

      revenueByDate[dateKey].revenue +=
        booking.totalPrice || booking.totalAmount || 0;
      revenueByDate[dateKey].bookings += 1;
    });

    // Convert to array and sort by date
    const chartData = Object.values(revenueByDate)
      .sort((a, b) => a.date - b.date)
      .map((item) => ({
        date: formatDateVN(item.date, "short"),
        revenue: item.revenue,
        bookings: item.bookings,
      }));

    return chartData;
  };

  const data = processBookingsData();

  const maxRevenue = Math.max(...data.map((d) => d.revenue || 0));
  const totalRevenue = data.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const avgRevenue = totalRevenue / data.length;
  const revenueGrowth =
    data.length > 1
      ? ((data[data.length - 1].revenue - data[data.length - 2].revenue) /
          data[data.length - 2].revenue) *
        100
      : 0;

  // Enhanced revenue metrics - ACCURATE calculations
  const totalBookings = Array.isArray(bookings) ? bookings.length : 0;

  // FIX: Get actual unique customers and flights from bookings data
  const uniqueCustomers =
    Array.isArray(bookings) && bookings.length > 0
      ? new Set(
          bookings
            .map((b) => b.userId || b.customerId || b.user?.id)
            .filter((id) => id)
        ).size
      : 0;

  const totalFlights =
    Array.isArray(bookings) && bookings.length > 0
      ? new Set(
          bookings
            .map((b) => b.flightId || b.flight?.id || b.outboundFlightId)
            .filter((id) => id)
        ).size
      : 0;

  // Key business metrics with proper validation
  const revenuePerCustomer =
    uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;
  const revenuePerFlight = totalFlights > 0 ? totalRevenue / totalFlights : 0;
  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  // Debug metrics calculation
  console.log("📊 Revenue Metrics Debug:", {
    totalRevenue,
    totalBookings,
    uniqueCustomers,
    totalFlights,
    revenuePerCustomer,
    revenuePerFlight,
    avgBookingValue,
    sampleBooking: bookings[0],
    bookingKeys: bookings[0] ? Object.keys(bookings[0]) : [],
    userIds: bookings.slice(0, 3).map((b) => ({
      userId: b.userId,
      customerId: b.customerId,
      userField: b.user,
      flightId: b.flightId,
      flightField: b.flight,
      outboundFlightId: b.outboundFlightId,
    })),
  });

  const revenueTarget = totalRevenue * 1.15;
  const targetAchievement = (totalRevenue / revenueTarget) * 100;

  const formatCurrency = (amount) => formatCurrencyVND(amount, false);

  const formatNumber = (number) => formatNumberVN(number);

  // Chart.js configuration
  const chartData = {
    labels: data.slice(0, detailed ? 20 : 10).map((item) => item.date),
    datasets: [
      {
        label: "Doanh Thu",
        data: data.slice(0, detailed ? 20 : 10).map((item) => item.revenue),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Doanh Thu: ${formatCurrency(context.parsed.y)}`;
          },
        },
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          callback: function (value) {
            return formatCurrency(value);
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
        },
      },
    },
  };

  // Line chart for trend
  const trendData = {
    labels: data.slice(0, detailed ? 20 : 10).map((item) => item.date),
    datasets: [
      {
        label: "Xu Hướng Doanh Thu",
        data: data.slice(0, detailed ? 20 : 10).map((item) => item.revenue),
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
        pointBorderColor: "white",
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Doanh Thu: ${formatCurrency(context.parsed.y)}`;
          },
        },
        backgroundColor: "rgba(0, 0, 0, 0.8)",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          callback: function (value) {
            return formatCurrency(value);
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <Card className={detailed ? "col-span-full" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Phân tích doanh thu
        </CardTitle>
        <CardDescription>
          Các chỉ số hiệu suất doanh thu và thông tin tài chính
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Key Revenue Metrics - STREAMLINED (only 3 main metrics) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Tổng Doanh Thu
              </span>
            </div>
            <div className="text-xl font-bold text-green-800">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="text-xs text-green-600 mt-1">
              {revenueGrowth > 0 ? (
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />+{revenueGrowth.toFixed(1)}%
                </span>
              ) : revenueGrowth < 0 ? (
                <span className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  {revenueGrowth.toFixed(1)}%
                </span>
              ) : (
                <span>Không đổi</span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Giá Trị Trung Bình/Vé
              </span>
            </div>
            <div className="text-xl font-bold text-blue-800">
              {formatCurrency(avgBookingValue)}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {totalBookings} vé đã bán
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">
                Hiệu Suất Bán Hàng
              </span>
            </div>
            <div className="text-xl font-bold text-purple-800">
              {formatNumber(totalBookings)}
            </div>
            <div className="text-xs text-purple-600 mt-1">
              {uniqueCustomers} khách hàng • {totalFlights} chuyến bay
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          {/* Bar Chart */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Hiệu suất doanh thu
            </h4>
            <div className="h-64 w-full">
              <Bar
                id="revenue-bar-chart"
                data={chartData}
                options={chartOptions}
              />
            </div>
          </div>

          {detailed && (
            <>
              {/* Trend Line Chart */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Phân tích xu hướng
                </h4>
                <div className="h-64 w-full">
                  <Line
                    id="revenue-line-chart"
                    data={trendData}
                    options={trendOptions}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-medium text-sm">
                  Top doanh thu trong các ngày
                </h5>
                <div className="space-y-3">
                  {data
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 4)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm font-medium">{item.date}</span>
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            {formatCurrency(item.revenue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.bookings || 0} bookings
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

          {!detailed && (
            /* Quick Performance Overview */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="font-medium text-sm">Hiệu Suất Tốt Nhất</h5>
                <div className="text-sm">
                  <div className="font-medium">
                    {formatCurrency(maxRevenue)}
                  </div>
                  <div className="text-gray-500">Doanh thu ngày cao nhất</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
