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
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  UserCheck,
  Calendar,
  Clock,
} from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CustomerChart = ({ data, isLoading, detailed = false }) => {
  if (isLoading) {
    return (
      <Card className={detailed ? "col-span-full" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Analytics
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
            <Users className="h-5 w-5" />
            Customer Analytics
          </CardTitle>
          <CardDescription>Customer analysis and demographics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No customer data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCustomers = Math.max(...data.map((d) => d.customers || 0));
  const totalCustomers = data.reduce((sum, d) => sum + (d.customers || 0), 0);
  const avgCustomers = totalCustomers / data.length;
  const customerGrowth =
    data.length > 1
      ? ((data[data.length - 1].customers - data[data.length - 2].customers) /
          data[data.length - 2].customers) *
        100
      : 0;

  // Customer demographics and metrics
  const newCustomersRate = 35;
  const returningCustomersRate = 65;
  const customerSatisfaction = 92.8;
  const avgLifetimeValue = 1250;

  const formatNumber = (number) =>
    new Intl.NumberFormat("en-US").format(number);
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);

  // Line Chart Configuration
  const lineChartData = {
    labels: data.slice(0, detailed ? 20 : 12).map((item) => item.date),
    datasets: [
      {
        label: "Customers",
        data: data.slice(0, detailed ? 20 : 12).map((item) => item.customers),
        borderColor: "rgba(147, 51, 234, 1)",
        backgroundColor: "rgba(147, 51, 234, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgba(147, 51, 234, 1)",
        pointBorderColor: "white",
        pointBorderWidth: 2,
        pointRadius: 4,
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
            return `Customers: ${formatNumber(context.parsed.y)}`;
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
      },
    },
  };

  // Customer Activity by Day of Week Bar Chart
  const weeklyActivityData = {
    labels: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    datasets: [
      {
        label: "Customer Activity",
        data: [85, 92, 88, 95, 120, 78, 65],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(147, 51, 234, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 101, 101, 0.8)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(34, 197, 94, 1)",
          "rgba(251, 191, 36, 1)",
          "rgba(147, 51, 234, 1)",
          "rgba(239, 68, 68, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(245, 101, 101, 1)",
        ],
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const weeklyActivityOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Active customers: ${context.parsed.y}`;
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
      },
    },
  };

  // Customer Age Groups Doughnut Chart
  const ageGroupData = {
    labels: [
      "18-25 years",
      "26-35 years",
      "36-45 years",
      "46-55 years",
      "55+ years",
    ],
    datasets: [
      {
        data: [20, 35, 25, 15, 5],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(147, 51, 234, 0.8)",
          "rgba(156, 163, 175, 0.8)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(34, 197, 94, 1)",
          "rgba(251, 191, 36, 1)",
          "rgba(147, 51, 234, 1)",
          "rgba(156, 163, 175, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const ageGroupOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Age ${context.label}: ${context.parsed}%`;
          },
        },
      },
    },
  };

  return (
    <Card className={detailed ? "col-span-full" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customer Analytics
        </CardTitle>
        <CardDescription>
          Customer demographics and behavior insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Key Customer Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(totalCustomers)}
            </div>
            <div className="text-sm text-gray-600">Total Customers</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {Math.abs(customerGrowth).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              {customerGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              Growth
            </div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">
              {customerSatisfaction}%
            </div>
            <div className="text-sm text-gray-600">Satisfaction</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(avgLifetimeValue)}
            </div>
            <div className="text-sm text-gray-600">Avg LTV</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          {/* Customer Activity Line Chart */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Customer Activity Trends
            </h4>
            <div className="h-64 w-full">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Customer Insights Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekly Activity */}
            <div className="space-y-3">
              <h5 className="font-medium text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Activity by Day of Week
              </h5>
              <div className="h-64 w-full">
                <Bar
                  data={weeklyActivityData}
                  options={weeklyActivityOptions}
                />
              </div>
            </div>

            {/* Age Groups */}
            <div className="space-y-3">
              <h5 className="font-medium text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Customer Age Groups
              </h5>
              <div className="h-64 w-full">
                <Doughnut data={ageGroupData} options={ageGroupOptions} />
              </div>
            </div>
          </div>

          {/* Customer Type Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h5 className="font-medium text-sm">Customer Types</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-green-500" />
                    New Customers
                  </span>
                  <Badge variant="outline">{newCustomersRate}%</Badge>
                </div>
                <Progress value={newCustomersRate} className="h-2" />

                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    Returning Customers
                  </span>
                  <Badge variant="outline">{returningCustomersRate}%</Badge>
                </div>
                <Progress value={returningCustomersRate} className="h-2" />
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-medium text-sm">Key Metrics</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Peak Day</span>
                  <span className="font-medium">
                    {formatNumber(maxCustomers)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Daily Average</span>
                  <span className="font-medium">
                    {Math.round(avgCustomers)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Avg Trips/Customer</span>
                  <span className="font-medium">4.2</span>
                </div>
              </div>
            </div>
          </div>

          {detailed && (
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">
                    {(
                      (data.filter((d) => d.customers > avgCustomers).length /
                        data.length) *
                      100
                    ).toFixed(0)}
                    %
                  </div>
                  <div className="text-xs text-gray-600">
                    Above Average Days
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold">8.5</div>
                  <div className="text-xs text-gray-600">
                    Avg Session Duration
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold">3.2</div>
                  <div className="text-xs text-gray-600">Pages per Session</div>
                </div>
                <div>
                  <div className="text-lg font-bold">78%</div>
                  <div className="text-xs text-gray-600">Mobile Users</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerChart;
