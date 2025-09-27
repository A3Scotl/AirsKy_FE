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

const RevenueChart = ({ bookings, isLoading, detailed = false, dateRange }) => {
  if (isLoading) {
    return (
      <Card className={detailed ? "col-span-full" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Phân tích doanh thu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
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
    // Group bookings by date
    const revenueByDate = {};

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

  // Additional revenue metrics
  const revenueTarget = totalRevenue * 1.15;
  const targetAchievement = (totalRevenue / revenueTarget) * 100;
  const avgTransactionValue =
    totalRevenue / data.reduce((sum, d) => sum + (d.bookings || 0), 0);

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
        {/* Key Revenue Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="text-sm text-gray-600">Tổng Doanh Thu</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(avgRevenue)}
            </div>
            <div className="text-sm text-gray-600">Trung Bình Ngày</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">
              {Math.abs(revenueGrowth).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              {revenueGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              Tăng Trưởng
            </div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(avgTransactionValue)}
            </div>
            <div className="text-sm text-gray-600">Giá Trị TB/Giao Dịch</div>
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
              <Bar data={chartData} options={chartOptions} />
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
                  <Line data={trendData} options={trendOptions} />
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="font-medium text-sm">Hiệu suất tài chính</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        Mục tiêu đạt được
                      </span>
                      <Badge
                        variant={
                          targetAchievement >= 100 ? "default" : "secondary"
                        }
                      >
                        {targetAchievement.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress
                      value={Math.min(targetAchievement, 100)}
                      className="h-2"
                    />

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Hiệu suất doanh thu</span>
                      <Badge variant="outline">87.5%</Badge>
                    </div>
                    <Progress value={87.5} className="h-2" />
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
                          <span className="text-sm font-medium">
                            {item.date}
                          </span>
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
