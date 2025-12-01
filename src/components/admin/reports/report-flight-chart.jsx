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
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
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
    if (!flights || !Array.isArray(flights) || flights.length === 0) {
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

    // Calculate status counts for doughnut chart using correct enum values
    const statusCounts = {
      onTime: flights.filter((f) => f.status === "ON_TIME").length,
      delayed: flights.filter((f) => f.status === "DELAYED").length,
      cancelled: flights.filter((f) => f.status === "CANCELLED").length,
      departed: flights.filter((f) => f.status === "DEPARTED").length,
    };

    // Calculate top routes with real metrics and flight type analysis
    const routeCounts = {};
    const flightTypeStats = {
      DOMESTIC: 0,
      INTERNATIONAL: 0,
    };

    flights.forEach((flight) => {
      const route = `${
        flight.departureAirport?.airportCode ||
        flight.departureAirport?.code ||
        "DEP"
      } - ${
        flight.arrivalAirport?.airportCode ||
        flight.arrivalAirport?.code ||
        "ARR"
      }`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;

      // Count flight types
      if (flight.type === "DOMESTIC") {
        flightTypeStats.DOMESTIC++;
      } else if (flight.type === "INTERNATIONAL") {
        flightTypeStats.INTERNATIONAL++;
      }
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

        // Calculate occupancy using correct data structure
        const totalBookedSeats = routeFlights.reduce((sum, f) => {
          // Sum all booked seats from flight travel classes
          if (f.flightTravelClasses && Array.isArray(f.flightTravelClasses)) {
            return (
              sum +
              f.flightTravelClasses.reduce(
                (classSum, travelClass) =>
                  classSum + (travelClass.bookedSeat || 0),
                0
              )
            );
          }
          return sum + (f.bookedSeats || 0);
        }, 0);

        const totalCapacity = routeFlights.reduce((sum, f) => {
          if (f.aircraft && f.aircraft.totalSeats) {
            return sum + f.aircraft.totalSeats;
          }
          // Fallback calculation from travel classes
          if (f.flightTravelClasses && Array.isArray(f.flightTravelClasses)) {
            return (
              sum +
              f.flightTravelClasses.reduce(
                (classSum, travelClass) =>
                  classSum + (travelClass.capacity || 0),
                0
              )
            );
          }
          return sum + 180; // Default capacity
        }, 0);

        const occupancyRate =
          totalCapacity > 0
            ? Math.round((totalBookedSeats / totalCapacity) * 100)
            : 0;

        // Calculate revenue from base price and flight travel classes
        const totalRevenue = routeFlights.reduce((sum, f) => {
          if (f.flightTravelClasses && Array.isArray(f.flightTravelClasses)) {
            return (
              sum +
              f.flightTravelClasses.reduce(
                (classSum, travelClass) =>
                  classSum +
                  (travelClass.price || 0) * (travelClass.bookedSeat || 0),
                0
              )
            );
          }
          return sum + (f.basePrice || 0);
        }, 0);

        return {
          route,
          flights: count,
          occupancy: occupancyRate,
          revenue: formatCurrencyVND(totalRevenue),
          passengers: totalBookedSeats,
          type: routeFlights[0]?.type || "DOMESTIC", // Add flight type info
        };
      });

    return { chartData, statusCounts, topRoutes, flightTypeStats };
  };

  const {
    chartData: data,
    statusCounts,
    topRoutes,
    flightTypeStats,
  } = processFlightsData();
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
      <Card
        className={
          detailed ? "col-span-full" : "dark:bg-gray-900 dark:border-gray-700"
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Plane className="h-5 w-5" />
            Thống Kê Chuyến Bay
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Hoạt động chuyến bay và các chỉ số hiệu suất
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Không có dữ liệu chuyến bay
            </p>
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

  // Calculate accurate occupancy rate from real flight data
  const avgOccupancyRate =
    flights && flights.length > 0
      ? Math.round(
          flights.reduce((sum, f) => {
            let bookedSeats = 0;
            let totalCapacity = 0;

            if (f.flightTravelClasses && Array.isArray(f.flightTravelClasses)) {
              bookedSeats = f.flightTravelClasses.reduce(
                (classSum, travelClass) =>
                  classSum + (travelClass.bookedSeat || 0),
                0
              );
              totalCapacity = f.flightTravelClasses.reduce(
                (classSum, travelClass) =>
                  classSum + (travelClass.capacity || 0),
                0
              );
            } else {
              totalCapacity = f.aircraft?.totalSeats || 180;
            }

            return (
              sum +
              (totalCapacity > 0 ? (bookedSeats / totalCapacity) * 100 : 0)
            );
          }, 0) / flights.length
        )
      : 0;

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

  // Flight Trend Line Chart - Show flights over time
  const routeLabels = data
    .slice(0, detailed ? 20 : 12)
    .map((item) => item.date);
  const routeData = data
    .slice(0, detailed ? 20 : 12)
    .map((item) => item.flights);
  const lineChartData = {
    labels: routeLabels,
    datasets: [
      {
        label: "Xu Hướng Chuyến Bay",
        data: routeData,
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineChartOptions = {
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

  // Flight Status Doughnut Chart with all status types
  const statusData = {
    labels: ["Đúng Giờ", "Trễ", "Đã Khởi Hành", "Hủy"],
    datasets: [
      {
        data: [
          statusCounts.onTime,
          statusCounts.delayed,
          statusCounts.departed,
          statusCounts.cancelled,
        ],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: [
          "rgba(34, 197, 94, 1)",
          "rgba(251, 191, 36, 1)",
          "rgba(59, 130, 246, 1)",
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

  return (
    <Card
      className={`${
        detailed ? "col-span-full" : ""
      } dark:bg-gray-900 dark:border-gray-700`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Plane className="h-5 w-5" />
          Thống Kê Chuyến Bay
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          Hoạt động chuyến bay và phân tích hiệu suất
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Key Flight Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(totalFlights)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tổng Chuyến Bay
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {totalFlights > 0
                ? Math.round((statusCounts.onTime / totalFlights) * 100)
                : 0}
              %
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tỷ Lệ Đúng Giờ
            </div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border dark:border-orange-800">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Math.round(avgFlights)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Trung Bình Ngày
            </div>
          </div>

          {detailed && (
            <>
              <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border dark:border-indigo-800">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatNumber(flightTypeStats.DOMESTIC)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Chuyến Nội Địa
                </div>
              </div>

              <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border dark:border-teal-800">
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {formatNumber(flightTypeStats.INTERNATIONAL)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Chuyến Quốc Tế
                </div>
              </div>
            </>
          )}
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          {/* Flight Activity Bar Chart */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2 dark:text-white">
              <Clock className="h-4 w-4" />
              Hoạt Động Chuyến Bay
            </h4>
            <div className="h-64 w-full">
              <Bar
                id="flights-bar-chart"
                data={barChartData}
                options={barChartOptions}
              />
            </div>
          </div>

          {/* Flight Trend Line Chart */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2 dark:text-white">
              <TrendingUp className="h-4 w-4" />
              Xu Hướng Chuyến Bay
            </h4>
            <div className="h-64 w-full">
              <Line
                id="flights-line-chart"
                data={lineChartData}
                options={lineChartOptions}
              />
            </div>
          </div>

          {/* Flight Status Doughnut Chart */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2 dark:text-white">
              <Plane className="h-4 w-4" />
              Trạng Thái Chuyến Bay
            </h4>
            <div className="h-64 w-full flex justify-center">
              <Doughnut
                id="flights-doughnut-chart"
                data={statusData}
                options={statusOptions}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightChart;
