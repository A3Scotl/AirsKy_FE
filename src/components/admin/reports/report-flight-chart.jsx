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

const FlightChart = ({ data, isLoading, detailed = false }) => {
  if (isLoading) {
    return (
      <Card className={detailed ? "col-span-full" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Flight Analytics
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
            Flight Analytics
          </CardTitle>
          <CardDescription>
            Flight operations and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No flight data available</p>
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

  // Flight operation metrics
  const onTimeRate = 85.2;
  const delayedRate = 12.3;
  const cancelledRate = 2.5;
  const avgOccupancyRate = 78.5;
  const avgFlightDuration = 2.3;
  const activeAircraft = 18;

  const formatNumber = (number) =>
    new Intl.NumberFormat("en-US").format(number);

  // Bar Chart Configuration
  const barChartData = {
    labels: data.slice(0, detailed ? 20 : 12).map((item) => item.date),
    datasets: [
      {
        label: "Flights",
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
            return `Flights: ${formatNumber(context.parsed.y)}`;
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
    labels: ["On-Time", "Delayed", "Cancelled"],
    datasets: [
      {
        data: [onTimeRate, delayedRate, cancelledRate],
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
    labels: ["NYC → LAX", "CHI → MIA", "DEN → SEA", "ATL → LAS", "BOS → SFO"],
    datasets: [
      {
        label: "Flight Frequency",
        data: [45, 32, 28, 25, 22],
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(59, 130, 246, 1)",
      },
      {
        label: "Occupancy Rate",
        data: [85, 72, 90, 68, 76],
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

  // Sample route data
  const topRoutes = [
    { route: "NYC → LAX", flights: 45, occupancy: 85, revenue: "$1.2M" },
    { route: "CHI → MIA", flights: 32, occupancy: 72, revenue: "$890K" },
    { route: "DEN → SEA", flights: 28, occupancy: 90, revenue: "$950K" },
    { route: "ATL → LAS", flights: 25, occupancy: 68, revenue: "$720K" },
  ];

  return (
    <Card className={detailed ? "col-span-full" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Flight Analytics
        </CardTitle>
        <CardDescription>
          Flight operations and performance insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Key Flight Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(totalFlights)}
            </div>
            <div className="text-sm text-gray-600">Total Flights</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {onTimeRate}%
            </div>
            <div className="text-sm text-gray-600">On-Time Rate</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">
              {avgOccupancyRate}%
            </div>
            <div className="text-sm text-gray-600">Occupancy Rate</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(avgFlights)}
            </div>
            <div className="text-sm text-gray-600">Daily Average</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          {/* Flight Activity Bar Chart */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Flight Activity
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
                Flight Status Distribution
              </h5>
              <div className="h-64 w-full">
                <Doughnut data={statusData} options={statusOptions} />
              </div>
            </div>

            {/* Route Performance Radar */}
            {detailed && (
              <div className="space-y-3">
                <h5 className="font-medium text-sm">
                  Route Performance Analysis
                </h5>
                <div className="h-64 w-full">
                  <Radar data={radarData} options={radarOptions} />
                </div>
              </div>
            )}

            {/* Top Routes (shown when not detailed or as second chart when detailed) */}
            {!detailed && (
              <div className="space-y-3">
                <h5 className="font-medium text-sm">Top Routes</h5>
                <div className="space-y-3">
                  {topRoutes.slice(0, 4).map((route, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">{route.route}</div>
                        <div className="text-xs text-gray-500">
                          {route.flights} flights
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
                  <div className="font-medium">On-Time</div>
                  <div className="text-sm text-gray-600">
                    {onTimeRate}% of flights
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <div>
                  <div className="font-medium">Delayed</div>
                  <div className="text-sm text-gray-600">
                    {delayedRate}% of flights
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <div className="font-medium">Cancelled</div>
                  <div className="text-sm text-gray-600">
                    {cancelledRate}% of flights
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
                            {route.flights} flights
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">
                          {route.revenue}
                        </div>
                        <div className="text-sm text-gray-600">
                          {route.occupancy}% occupancy
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
                  <div className="text-xs text-gray-600">Peak Day Flights</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{avgFlightDuration}h</div>
                  <div className="text-xs text-gray-600">Avg Duration</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{activeAircraft}</div>
                  <div className="text-xs text-gray-600">Active Aircraft</div>
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
                    Growth
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
