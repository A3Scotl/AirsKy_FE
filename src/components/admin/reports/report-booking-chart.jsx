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
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Users,
  CheckCircle,
} from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const BookingChart = ({ data, isLoading, detailed = false }) => {
  if (isLoading) {
    return (
      <Card className={detailed ? "col-span-full" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Booking Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
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

  // Ensure data exists
  if (!data || data.length === 0) {
    return (
      <Card className={detailed ? "col-span-full" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Booking Analysis
          </CardTitle>
          <CardDescription>Track booking trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No booking data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxBookings = Math.max(...data.map((d) => d.bookings || 0));
  const totalBookings = data.reduce((sum, d) => sum + (d.bookings || 0), 0);
  const avgBookings = totalBookings / data.length;

  const bookingGrowth =
    data.length > 1
      ? ((data[data.length - 1].bookings - data[data.length - 2].bookings) /
          data[data.length - 2].bookings) *
        100
      : 0;

  const formatNumber = (number) => {
    return new Intl.NumberFormat("en-US").format(number);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  };

  // Chart.js Configuration
  const barChartData = {
    labels: data.slice(0, detailed ? 20 : 12).map((item) => item.date),
    datasets: [
      {
        label: "Bookings",
        data: data.slice(0, detailed ? 20 : 12).map((item) => item.bookings),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgba(34, 197, 94, 1)",
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
            return `Bookings: ${formatNumber(context.parsed.y)}`;
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

  // Success Rate Doughnut Chart
  const successRateData = {
    labels: ["Successful", "Cancelled"],
    datasets: [
      {
        data: [94.2, 5.8],
        backgroundColor: ["rgba(34, 197, 94, 0.8)", "rgba(239, 68, 68, 0.8)"],
        borderColor: ["rgba(34, 197, 94, 1)", "rgba(239, 68, 68, 1)"],
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
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
    <Card className={detailed ? "col-span-full" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Booking Analysis
        </CardTitle>
        <CardDescription>Track booking trends over time</CardDescription>
      </CardHeader>
      <CardContent>
        {detailed && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Total Bookings</p>
              <p className="text-2xl font-bold">
                {formatNumber(totalBookings)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Average per Day</p>
              <p className="text-2xl font-bold">
                {formatNumber(Math.round(avgBookings))}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Growth Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">
                  {Math.abs(bookingGrowth).toFixed(1)}%
                </p>
                {bookingGrowth > 0 ? (
                  <Badge variant="success" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Up
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Down
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Chart.js Bar Chart */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Booking Activity
            </h4>
            <div className="h-64 w-full">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

          {detailed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Success Rate Doughnut Chart */}
              <div className="space-y-3">
                <h5 className="font-medium text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Booking Success Rate
                </h5>
                <div className="h-64 w-full">
                  <Doughnut data={successRateData} options={doughnutOptions} />
                </div>
              </div>

              {/* Top Booking Days */}
              <div className="space-y-3">
                <h5 className="font-medium text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Top Booking Days
                </h5>
                <div className="space-y-2">
                  {data
                    .sort((a, b) => b.bookings - a.bookings)
                    .slice(0, 5)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm font-medium">{item.date}</span>
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            {formatNumber(item.bookings)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(item.bookings * 250)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Booking Analytics Summary */}
          {detailed && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
              <div className="text-center p-4 bg-green-50 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(Math.max(...data.map((d) => d.bookings)))}
                </div>
                <div className="text-sm text-gray-600">Peak Bookings</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(Math.min(...data.map((d) => d.bookings)))}
                </div>
                <div className="text-sm text-gray-600">Lowest Bookings</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg border">
                <div className="text-2xl font-bold text-emerald-600">94.2%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border">
                <div className="text-2xl font-bold text-red-600">5.8%</div>
                <div className="text-sm text-gray-600">Cancellation Rate</div>
              </div>
            </div>
          )}
        </div>

        {!detailed && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Bookings</span>
              <span className="font-medium">{formatNumber(totalBookings)}</span>
            </div>
            <Progress
              value={(totalBookings / (maxBookings * data.length)) * 100}
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingChart;
