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
import { Bar, Radar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  TrendingUp,
  TrendingDown,
  Plane,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import {
  formatCurrencyVND,
  formatDateVN,
  formatNumberVN,
} from "@/utils/currency-utils";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const FlightChart = ({ flights, isLoading, detailed = false, dateRange }) => {
  // Process flight data from database
  const processFlightsData = () => {
    if (!flights || flights.length === 0) {
      return { chartData: [], statusCounts: {}, topRoutes: [] };
    }

    // Group flights by date
    const flightsByDate = {};
    flights.forEach((flight) => {
      const date = new Date(flight.departureTime);

      // Filter by date range if provided
      if (dateRange && (date < dateRange.from || date > dateRange.to)) {
        return;
      }

      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD format

      if (!flightsByDate[dateKey]) {
        flightsByDate[dateKey] = {
          date: formatDateVN(date),
          flights: 0,
          scheduled: 0,
          completed: 0,
          cancelled: 0,
        };
      }

      flightsByDate[dateKey].flights += 1;

      // Count by status
      const status = flight.status?.toLowerCase() || "scheduled";
      if (status === "completed" || status === "arrived") {
        flightsByDate[dateKey].completed += 1;
      } else if (status === "cancelled") {
        flightsByDate[dateKey].cancelled += 1;
      } else {
        flightsByDate[dateKey].scheduled += 1;
      }
    });

    // Convert to array and sort by date
    const chartData = Object.values(flightsByDate).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Calculate status counts for doughnut chart
    const statusCounts = {
      onTime: flights.filter(
        (f) => f.status === "completed" || f.status === "arrived"
      ).length,
      delayed: flights.filter((f) => f.status === "delayed").length,
      cancelled: flights.filter((f) => f.status === "cancelled").length,
    };

    // Calculate top routes with real metrics
    const routeCounts = {};
    flights.forEach((flight) => {
      const route = `${flight.departureAirport?.code || "DEP"} - ${
        flight.arrivalAirport?.code || "ARR"
      }`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    });

    // Get top routes with additional metrics
    const topRoutes = Object.entries(routeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([route, count]) => {
        // Calculate additional metrics for each route
        const routeFlights = flights.filter(
          (f) =>
            `${f.departureAirport?.code || "DEP"} - ${
              f.arrivalAirport?.code || "ARR"
            }` === route
        );

        const totalPassengers = routeFlights.reduce(
          (sum, f) => sum + (f.passengers || f.bookedSeats || 0),
          0
        );
        const totalCapacity = routeFlights.reduce(
          (sum, f) => sum + (f.totalSeats || f.capacity || 200),
          0
        );
        const occupancyRate =
          totalCapacity > 0
            ? Math.round((totalPassengers / totalCapacity) * 100)
            : 0;

        const totalRevenue = routeFlights.reduce(
          (sum, f) => sum + (f.revenue || f.totalRevenue || 0),
          0
        );

        return {
          route,
          flights: count,
          occupancy: occupancyRate,
          revenue: formatCurrencyVND(totalRevenue),
          passengers: totalPassengers,
        };
      });

    return { chartData, statusCounts, topRoutes };
  };

  const { chartData: data, statusCounts, topRoutes } = processFlightsData();
  if (isLoading) {
    return (
      <Card className={detailed ? "col-span-full" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Thống Kê Chuyến Bay
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

  if (!data || data.length === 0) {
    return (
      <Card className={detailed ? "col-span-full" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Thống Kê Chuyến Bay
          </CardTitle>
          <CardDescription>
            Hoạt động chuyến bay và các chỉ số hiệu suất
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Không có dữ liệu chuyến bay</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxFlights = Math.max(...data.map((d) => d.flights || 0));
  const totalFlights = data.reduce((sum, d) => sum + (d.flights || 0), 0);
  const avgFlights = totalFlights / data.length;
  const flightGrowth =
    data.length > 1
      ? ((data[data.length - 1].flights - data[data.length - 2].flights) /
          data[data.length - 2].flights) *
        100
      : 0;

  // Calculate additional metrics from real data
  const avgFlightDuration =
    flights && flights.length > 0
      ? (
          flights.reduce(
            (sum, f) => sum + (f.duration || f.flightDuration || 2.3),
            0
          ) / flights.length
        ).toFixed(1)
      : 2.3;

  const activeAircraft =
    flights && flights.length > 0
      ? new Set(
          flights.map((f) => f.aircraftId || f.aircraft?.id).filter(Boolean)
        ).size || 18
      : 18;

  const avgOccupancyRate =
    flights && flights.length > 0
      ? Math.round(
          flights.reduce((sum, f) => {
            const passengers = f.passengers || f.bookedSeats || 0;
            const capacity = f.totalSeats || f.capacity || 200;
            return sum + (capacity > 0 ? (passengers / capacity) * 100 : 0);
          }, 0) / flights.length
        )
      : 78.5;

  const formatNumber = (number) => formatNumberVN(number);

  // Bar Chart Configuration
  const barChartData = {
    labels: data.slice(0, detailed ? 20 : 12).map((item) => item.date),
    datasets: [
      {
        label: "Chuyến Bay",
        data: data.slice(0, detailed ? 20 : 12).map((item) => item.flights),
        backgroundColor: "rgba(14, 165, 233, 0.8)",
        borderColor: "rgba(14, 165, 233, 1)",
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Chuyến Bay: ${formatNumber(context.parsed.y)}`;
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

  // Flight Status Doughnut Chart
  const statusData = {
    labels: ["Đúng Giờ", "Trễ", "Hủy"],
    datasets: [
      {
        data: [
          statusCounts.onTime,
          statusCounts.delayed,
          statusCounts.cancelled,
        ],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: [
          "rgba(34, 197, 94, 1)",
          "rgba(251, 191, 36, 1)",
          "rgba(239, 68, 68, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.label}: ${context.parsed}%`;
          },
        },
      },
    },
  };

  // Radar Chart for Route Performance
  const radarData = {
    labels: topRoutes.slice(0, 5).map((route) => route.route),
    datasets: [
      {
        label: "Tần Suất Chuyến Bay",
        data: topRoutes.slice(0, 5).map((route) => route.flights),
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(59, 130, 246, 1)",
      },
      {
        label: "Tỷ Lệ Lấp Đầy",
        data: topRoutes.slice(0, 5).map((route) => route.occupancy),
        borderColor: "rgba(34, 197, 94, 1)",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        pointBackgroundColor: "rgba(34, 197, 94, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(34, 197, 94, 1)",
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          usePointStyle: true,
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <Card className={detailed ? "col-span-full" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Thống Kê Chuyến Bay
        </CardTitle>
        <CardDescription>
          Hoạt động chuyến bay và phân tích hiệu suất
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Key Flight Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(totalFlights)}
            </div>
            <div className="text-sm text-gray-600">Tổng Chuyến Bay</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {totalFlights > 0
                ? Math.round((statusCounts.onTime / totalFlights) * 100)
                : 0}
              %
            </div>
            <div className="text-sm text-gray-600">Tỷ Lệ Đúng Giờ</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">
              {avgOccupancyRate}%
            </div>
            <div className="text-sm text-gray-600">Tỷ Lệ Lấp Đầy</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(avgFlights)}
            </div>
            <div className="text-sm text-gray-600">Trung Bình Ngày</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          {/* Flight Activity Bar Chart */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hoạt Động Chuyến Bay
            </h4>
            <div className="h-64 w-full">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

          {/* Flight Performance Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Flight Status Distribution */}
            <div className="space-y-3">
              <h5 className="font-medium text-sm">
                Phân Bổ Trạng Thái Chuyến Bay
              </h5>
              <div className="h-64 w-full">
                <Doughnut data={statusData} options={statusOptions} />
              </div>
            </div>

            {/* Route Performance Radar */}
            {detailed && (
              <div className="space-y-3">
                <h5 className="font-medium text-sm">
                  Phân Tích Hiệu Suất Tuyến Bay
                </h5>
                <div className="h-64 w-full">
                  <Radar data={radarData} options={radarOptions} />
                </div>
              </div>
            )}

            {/* Top Routes (shown when not detailed or as second chart when detailed) */}
            {!detailed && (
              <div className="space-y-3">
                <h5 className="font-medium text-sm">Các Tuyến Bay Hàng Đầu</h5>
                <div className="space-y-3">
                  {topRoutes.slice(0, 4).map((route, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">{route.route}</div>
                        <div className="text-xs text-gray-500">
                          {route.flights} chuyến bay
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sky-600">
                          {route.occupancy}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {route.revenue}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <div className="font-medium">Đúng Giờ</div>
                  <div className="text-sm text-gray-600">
                    {totalFlights > 0
                      ? Math.round((statusCounts.onTime / totalFlights) * 100)
                      : 0}
                    % chuyến bay
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <div>
                  <div className="font-medium">Trễ</div>
                  <div className="text-sm text-gray-600">
                    {totalFlights > 0
                      ? Math.round((statusCounts.delayed / totalFlights) * 100)
                      : 0}
                    % chuyến bay
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <div className="font-medium">Hủy</div>
                  <div className="text-sm text-gray-600">
                    {totalFlights > 0
                      ? Math.round(
                          (statusCounts.cancelled / totalFlights) * 100
                        )
                      : 0}
                    % chuyến bay
                  </div>
                </div>
              </div>
            </div>
          </div>

          {detailed && (
            <div className="space-y-4 pt-4 border-t">
              {/* Detailed Route Performance */}
              <div>
                <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Route Performance Details
                </h5>
                <div className="space-y-2">
                  {topRoutes.map((route, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{route.route}</div>
                          <div className="text-sm text-gray-600">
                            {route.flights} chuyến bay
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">
                          {route.revenue}
                        </div>
                        <div className="text-sm text-gray-600">
                          {route.occupancy}% lấp đầy
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">
                    {formatNumber(maxFlights)}
                  </div>
                  <div className="text-xs text-gray-600">
                    Chuyến Bay Ngày Cao Điểm
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold">{avgFlightDuration}h</div>
                  <div className="text-xs text-gray-600">
                    Thời Gian Trung Bình
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold">{activeAircraft}</div>
                  <div className="text-xs text-gray-600">Máy Bay Hoạt Động</div>
                </div>
                <div>
                  <div className="text-lg font-bold">
                    {Math.abs(flightGrowth).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                    {flightGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    Tăng Trưởng
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightChart;
