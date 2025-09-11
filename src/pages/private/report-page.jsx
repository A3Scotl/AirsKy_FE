import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  Users,
  Plane,
  DollarSign,
  Activity,
  Filter,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import RevenueChart from "@/components/admin/reports/report-revenue-chart";
import BookingChart from "@/components/admin/reports/report-booking-chart";
import CustomerChart from "@/components/admin/reports/report-customer-chart";
import FlightChart from "@/components/admin/reports/report-flight-chart";
import ReportTable from "@/components/admin/reports/report-table";

const AdminReportPage = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [period, setPeriod] = useState("30days");
  const [reportType, setReportType] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);

  // Sample data - replace with actual API calls
  const [reportData, setReportData] = useState({
    summary: {
      totalRevenue: 2458900,
      totalBookings: 12486,
      totalCustomers: 8942,
      totalFlights: 1247,
      revenueChange: 12.5,
      bookingsChange: 8.3,
      customersChange: 15.2,
      flightsChange: -2.1,
    },
    charts: {
      revenue: [],
      bookings: [],
      customers: [],
      flights: [],
    },
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange, period, reportType]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate sample data based on period
      const generateData = () => {
        const data = [];
        const days = period === "7days" ? 7 : period === "30days" ? 30 : 90;

        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (days - i));

          data.push({
            date: format(date, "MM/dd"),
            revenue: Math.floor(Math.random() * 100000) + 50000,
            bookings: Math.floor(Math.random() * 100) + 50,
            customers: Math.floor(Math.random() * 80) + 20,
            flights: Math.floor(Math.random() * 20) + 10,
          });
        }
        return data;
      };

      setReportData((prev) => ({
        ...prev,
        charts: {
          revenue: generateData(),
          bookings: generateData(),
          customers: generateData(),
          flights: generateData(),
        },
      }));
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = (format) => {
    // Handle export functionality
    console.log(`Exporting report in ${format} format`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat("en-US").format(number);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-gray-600">
            Detailed analysis of business operations
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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
                  <span>Select date</span>
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

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={fetchReportData}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
            />
            Refresh
          </Button>

          <Button onClick={() => handleExportReport("excel")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData.summary.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {reportData.summary.revenueChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span
                className={
                  reportData.summary.revenueChange > 0
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {Math.abs(reportData.summary.revenueChange)}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(reportData.summary.totalBookings)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {reportData.summary.bookingsChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span
                className={
                  reportData.summary.bookingsChange > 0
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {Math.abs(reportData.summary.bookingsChange)}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(reportData.summary.totalCustomers)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {reportData.summary.customersChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span
                className={
                  reportData.summary.customersChange > 0
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {Math.abs(reportData.summary.customersChange)}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flights</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(reportData.summary.totalFlights)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {reportData.summary.flightsChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span
                className={
                  reportData.summary.flightsChange > 0
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {Math.abs(reportData.summary.flightsChange)}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs
        value={reportType}
        onValueChange={setReportType}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart
              data={reportData.charts.revenue}
              isLoading={isLoading}
            />
            <BookingChart
              data={reportData.charts.bookings}
              isLoading={isLoading}
            />
            <CustomerChart
              data={reportData.charts.customers}
              isLoading={isLoading}
            />
            <FlightChart
              data={reportData.charts.flights}
              isLoading={isLoading}
            />
          </div>
          <ReportTable type="overview" dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <RevenueChart
            data={reportData.charts.revenue}
            isLoading={isLoading}
            detailed={true}
          />
          <ReportTable type="revenue" dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <BookingChart
            data={reportData.charts.bookings}
            isLoading={isLoading}
            detailed={true}
          />
          <ReportTable type="bookings" dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <CustomerChart
            data={reportData.charts.customers}
            isLoading={isLoading}
            detailed={true}
          />
          <ReportTable type="customers" dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReportPage;
