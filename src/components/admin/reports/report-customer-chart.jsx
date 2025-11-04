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
  formatCurrencyVND,
  formatDateVN,
  formatNumberVN,
} from "@/utils/currency-utils";
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

const CustomerChart = ({
  users: initialUsers,
  isLoading,
  detailed = false,
  dateRange,
}) => {
  const users = Array.isArray(initialUsers) ? initialUsers : [];
  if (isLoading) {
    return (
      <Card
        className={
          detailed ? "col-span-full" : "dark:bg-gray-900 dark:border-gray-700"
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Users className="h-5 w-5" />
            Thống Kê Khách Hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2 dark:bg-gray-700"></div>
                <div className="h-8 bg-gray-200 rounded dark:bg-gray-700"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Card
        className={
          detailed ? "col-span-full" : "dark:bg-gray-900 dark:border-gray-700"
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Users className="h-5 w-5" />
            Thống Kê Khách Hàng
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Phân tích khách hàng và nhân khẩu học
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Không có dữ liệu khách hàng
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process users data
  const processUsersData = () => {
    // Validate users is an array before processing
    if (!Array.isArray(users) || users.length === 0) {
      return {
        chartData: [],
        loyaltyTiers: { standard: 0, silver: 0, gold: 0, platinum: 0 },
        ageGroups: { "18-25": 0, "26-35": 0, "36-50": 0, "51+": 0 },
        authProviders: { local: 0, google: 0, facebook: 0 },
        activityStats: { active: 0, verified: 0, total: 0 },
      };
    }

    // Group users by registration date
    const usersByDate = {};
    const loyaltyTiers = { standard: 0, silver: 0, gold: 0, platinum: 0 };
    const ageGroups = { "18-25": 0, "26-35": 0, "36-50": 0, "51+": 0 };
    const authProviders = { local: 0, google: 0, facebook: 0 };
    const activityStats = { active: 0, verified: 0, total: users.length };

    // Tính ngày hiện tại để phân tích new/returning customers
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    users.forEach((user) => {
      // Group by registration date
      const date = new Date(user.createdAt || user.registrationDate);

      // Filter by date range if provided
      if (dateRange && (date < dateRange.from || date > dateRange.to)) {
        return;
      }

      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD format

      if (!usersByDate[dateKey]) {
        usersByDate[dateKey] = {
          date: date,
          customers: 0,
        };
      }

      usersByDate[dateKey].customers += 1;

      // Count loyalty tiers (dựa trên dữ liệu thực)
      const tier = user.loyaltyTier?.toLowerCase() || "standard";
      if (loyaltyTiers.hasOwnProperty(tier)) {
        loyaltyTiers[tier] += 1;
      }

      // Count auth providers
      const provider = user.authProvider?.toLowerCase() || "local";
      if (authProviders.hasOwnProperty(provider)) {
        authProviders[provider] += 1;
      }

      // Count activity stats
      if (user.active) activityStats.active += 1;
      if (user.verified) activityStats.verified += 1;

      // Tính tuổi từ dateOfBirth
      if (user.dateOfBirth) {
        const birthDate = new Date(user.dateOfBirth);
        const age = now.getFullYear() - birthDate.getFullYear();
        const monthDiff = now.getMonth() - birthDate.getMonth();

        const actualAge =
          monthDiff < 0 ||
          (monthDiff === 0 && now.getDate() < birthDate.getDate())
            ? age - 1
            : age;

        if (actualAge >= 18 && actualAge <= 25) ageGroups["18-25"] += 1;
        else if (actualAge >= 26 && actualAge <= 35) ageGroups["26-35"] += 1;
        else if (actualAge >= 36 && actualAge <= 50) ageGroups["36-50"] += 1;
        else if (actualAge > 50) ageGroups["51+"] += 1;
      } else {
        // Nếu không có ngày sinh, phân loại vào nhóm 26-35 (phổ biến nhất)
        ageGroups["26-35"] += 1;
      }
    });

    // Convert to array and sort by date
    const chartData = Object.values(usersByDate)
      .sort((a, b) => a.date - b.date)
      .map((item) => ({
        date: formatDateVN(item.date, "short"),
        customers: item.customers,
      }));

    return { chartData, loyaltyTiers, ageGroups, authProviders, activityStats };
  };

  const {
    chartData: data,
    loyaltyTiers,
    ageGroups,
    authProviders,
    activityStats,
  } = processUsersData();

  const maxCustomers =
    data.length > 0 ? Math.max(...data.map((d) => d.customers || 0)) : 0;
  const totalCustomers = data.reduce((sum, d) => sum + (d.customers || 0), 0);
  const avgCustomers = data.length > 0 ? totalCustomers / data.length : 0;
  const customerGrowth =
    data.length > 1
      ? ((data[data.length - 1].customers - data[data.length - 2].customers) /
          data[data.length - 2].customers) *
        100
      : 0;

  // Tính toán các thống kê thực từ dữ liệu
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Phân tích khách hàng mới (đăng ký trong 30 ngày qua)
  const newCustomersCount = users.filter((user) => {
    const createdAt = new Date(user.createdAt);
    return createdAt >= thirtyDaysAgo;
  }).length;

  const newCustomersRate =
    totalCustomers > 0 ? (newCustomersCount / totalCustomers) * 100 : 0;

  // Phân tích khách hàng quay lại (đăng nhập trong 7 ngày qua)
  const returningCustomersCount = users.filter((user) => {
    if (!user.lastLogin) return false;
    const lastLogin = new Date(user.lastLogin);
    return lastLogin >= sevenDaysAgo;
  }).length;

  const returningCustomersRate =
    totalCustomers > 0 ? (returningCustomersCount / totalCustomers) * 100 : 0;

  // Tỷ lệ khách hàng active và verified
  const activeRate =
    activityStats.total > 0
      ? (activityStats.active / activityStats.total) * 100
      : 0;
  const verifiedRate =
    activityStats.total > 0
      ? (activityStats.verified / activityStats.total) * 100
      : 0;

  // Tính tuổi trung bình
  const ages = users
    .filter((user) => user.dateOfBirth)
    .map((user) => {
      const birthDate = new Date(user.dateOfBirth);
      return now.getFullYear() - birthDate.getFullYear();
    });

  const avgAge =
    ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;

  const formatNumber = (number) => formatNumberVN(number);
  const formatCurrency = (amount) => formatCurrencyVND(amount, false);

  // Line Chart Configuration
  const lineChartData = {
    labels: data.slice(0, detailed ? 20 : 12).map((item) => item.date),
    datasets: [
      {
        label: "Khách Hàng",
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
            return `Khách Hàng: ${formatNumber(context.parsed.y)}`;
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
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
      "Chủ Nhật",
    ],
    datasets: [
      {
        label: "Hoạt Động Khách Hàng",
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
            return `Khách hàng hoạt động: ${context.parsed.y}`;
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
    labels: ["18-25 tuổi", "26-35 tuổi", "36-50 tuổi", "51+ tuổi"],
    datasets: [
      {
        data: [
          ageGroups["18-25"],
          ageGroups["26-35"],
          ageGroups["36-50"],
          ageGroups["51+"],
        ],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(147, 51, 234, 0.8)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(34, 197, 94, 1)",
          "rgba(251, 191, 36, 1)",
          "rgba(147, 51, 234, 1)",
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
            return `Tuổi ${context.label}: ${context.parsed}%`;
          },
        },
      },
    },
  };

  return (
    <Card
      className={
        detailed ? "col-span-full" : "dark:bg-gray-900 dark:border-gray-700"
      }
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Users className="h-5 w-5" />
          Phân tích khách hàng
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          Thông tin nhân khẩu học và hành vi của khách hàng
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Key Customer Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg border dark:bg-blue-900/20 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(totalCustomers)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tổng Khách Hàng
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border dark:bg-green-900/20 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {newCustomersRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Khách Hàng Mới (30 ngày)
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          {/* Customer Activity Line Chart */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2 dark:text-white">
              <UserCheck className="h-4 w-4" />
              Xu Hướng Hoạt Động Khách Hàng
            </h4>
            <div className="h-64 w-full">
              <Line
                id="customers-line-chart"
                data={lineChartData}
                options={lineChartOptions}
              />
            </div>
          </div>

          {/* Customer Loyalty & Auth Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loyalty Tiers */}
            <div className="space-y-3">
              <h5 className="font-medium text-sm">Cấp Độ Thành Viên</h5>
              <div className="space-y-2">
                {Object.entries(loyaltyTiers).map(([tier, count]) => (
                  <div key={tier} className="flex justify-between items-center">
                    <span className="text-sm capitalize dark:text-white">
                      {tier}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                          className="bg-purple-600 h-2 rounded-full dark:bg-purple-500"
                          style={{
                            width: `${
                              totalCustomers > 0
                                ? (count / totalCustomers) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right dark:text-white">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Auth Providers */}
            <div className="space-y-3">
              <h5 className="font-medium text-sm dark:text-white">
                Các Hình thức đăng nhập
              </h5>
              <div className="space-y-2">
                {Object.entries(authProviders).map(([provider, count]) => (
                  <div
                    key={provider}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm capitalize">{provider}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              totalCustomers > 0
                                ? (count / totalCustomers) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {detailed && (
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">
                    {activeRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">Tỷ Lệ Active</div>
                </div>
                <div>
                  <div className="text-lg font-bold">
                    {Object.keys(loyaltyTiers)
                      .reduce(
                        (a, b) => (loyaltyTiers[a] > loyaltyTiers[b] ? a : b),
                        "standard"
                      )
                      .toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-600">Cấp Độ Phổ Biến</div>
                </div>
                <div>
                  <div className="text-lg font-bold">
                    {Object.keys(authProviders)
                      .reduce(
                        (a, b) => (authProviders[a] > authProviders[b] ? a : b),
                        "local"
                      )
                      .toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Đăng Nhập Phổ Biến
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

export default CustomerChart;
