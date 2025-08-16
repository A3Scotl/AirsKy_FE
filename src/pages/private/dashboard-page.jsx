import {
  Calendar,
  Plane,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  // Mock data for demonstration
  const stats = [
    {
      title: "Total Bookings",
      value: "2,847",
      change: "+12.5%",
      isPositive: true,
      icon: Calendar,
      description: "vs last month",
    },
    {
      title: "Active Flights",
      value: "156",
      change: "+3.2%",
      isPositive: true,
      icon: Plane,
      description: "currently scheduled",
    },
    {
      title: "Total Users",
      value: "8,429",
      change: "+8.1%",
      isPositive: true,
      icon: Users,
      description: "registered users",
    },
    {
      title: "Revenue",
      value: "$342,890",
      change: "-2.4%",
      isPositive: false,
      icon: CreditCard,
      description: "this month",
    },
  ];

  const recentBookings = [
    {
      id: "BK001",
      customer: "John Smith",
      route: "NYC → LAX",
      date: "2024-01-15",
      status: "Confirmed",
      amount: "$450",
    },
    {
      id: "BK002",
      customer: "Sarah Johnson",
      route: "CHI → MIA",
      date: "2024-01-15",
      status: "Pending",
      amount: "$320",
    },
    {
      id: "BK003",
      customer: "Mike Davis",
      route: "SEA → BOS",
      date: "2024-01-14",
      status: "Confirmed",
      amount: "$680",
    },
    {
      id: "BK004",
      customer: "Emma Wilson",
      route: "LAX → NYC",
      date: "2024-01-14",
      status: "Cancelled",
      amount: "$420",
    },
    {
      id: "BK005",
      customer: "Alex Brown",
      route: "DEN → ATL",
      date: "2024-01-13",
      status: "Confirmed",
      amount: "$290",
    },
  ];

  const topRoutes = [
    { route: "NYC → LAX", bookings: 234, revenue: "$105,300" },
    { route: "CHI → MIA", bookings: 189, revenue: "$85,680" },
    { route: "SEA → BOS", bookings: 156, revenue: "$89,420" },
    { route: "LAX → NYC", bookings: 145, revenue: "$92,800" },
    { route: "DEN → ATL", bookings: 132, revenue: "$67,440" },
  ];

  const getStatusBadge = (status) => {
    const variants = {
      Confirmed: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return variants[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with your airline today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="flex items-center text-xs text-gray-600 mt-1">
                  {stat.isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span
                    className={
                      stat.isPositive ? "text-green-600" : "text-red-600"
                    }
                  >
                    {stat.change}
                  </span>
                  <span className="ml-1">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Bookings
              <Badge variant="outline" className="ml-2">
                {recentBookings.length} new
              </Badge>
            </CardTitle>
            <CardDescription>
              Latest booking activities and status updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {booking.customer}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusBadge(booking.status)}`}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {booking.route}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {booking.date} • {booking.id}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      {booking.amount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Routes */}
        <Card>
          <CardHeader>
            <CardTitle>Top Routes</CardTitle>
            <CardDescription>
              Most popular flight routes by bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topRoutes.map((route, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{route.route}</div>
                      <div className="text-xs text-gray-500">
                        {route.bookings} bookings
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{route.revenue}</div>
                    <div className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +5.2%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
