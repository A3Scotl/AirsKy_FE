import { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  Calendar,
  Filter,
  Search,
  Plus,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import PaymentAnalytics from "@/components/admin/payments/payment-analytics";
import PaymentTable from "@/components/admin/payments/payment-table"; // Giữ lại
import PaymentDetailsModal from "@/components/admin/payments/payment-details-modal"; // Giữ lại
import RefundModal from "@/components/admin/payments/payment-refund-modal"; // Giữ lại
import PaymentMethods from "@/components/admin/payments/payment-methods";

import { paymentApi } from "@/apis/payment-api";
import { formatCurrencyVND } from "@/utils/currency-utils";
import { toast } from "sonner";

const AdminPaymentPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Bật loading mặc định
  const [paymentsData, setPaymentsData] = useState([]);

  // Fetch payments data for statistics
  useEffect(() => {
    const fetchPaymentsData = async () => {
      try {
        setIsLoading(true);
        // Build query parameters
        const params = {
          page: 0,
          size: 1000, // Get enough data for statistics
        };

        // Add date filters
        if (dateRange !== "all") {
          if (dateRange === "custom" && startDate && endDate) {
            params.startDate = startDate.toISOString().split("T")[0];
            params.endDate = endDate.toISOString().split("T")[0];
          } else if (dateRange !== "custom") {
            const days = parseInt(dateRange);
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);
            params.startDate = startDate.toISOString().split("T")[0];
            params.endDate = endDate.toISOString().split("T")[0];
          }
        }

        const response = await paymentApi.getAllPayments(params);
        if (response.success) {
          setPaymentsData(response.data.content || response.data || []);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching payments data:", error);
        setPaymentsData([]);
        setIsLoading(false);
      }
    };

    fetchPaymentsData();
  }, [dateRange, startDate, endDate, refreshKey]);

  // Calculate payment statistics from real data
  const paymentStats = useMemo(() => {
    if (!paymentsData.length) {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      return {
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        successRate: 0,
        dailyGrowth: 0,
        monthlyGrowth: 0,
        pendingAmount: 0,
        refundedAmount: 0,
        currentMonth,
        currentYear,
        previousMonth,
        previousYear,
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Month info for display
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Calculate totals
    const totalRevenue = paymentsData
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + (p.amount || p.totalAmount || 0), 0);

    const totalTransactions = paymentsData.length;

    const successfulTransactions = paymentsData.filter(
      (p) => p.status === "COMPLETED"
    ).length;

    const cancelledTransactions = paymentsData.filter(
      (p) => p.status === "CANCELLED"
    ).length;

    const successRate =
      totalTransactions > 0
        ? (successfulTransactions / totalTransactions) * 100
        : 0;

    const averageTransaction =
      successfulTransactions > 0 ? totalRevenue / successfulTransactions : 0;

    // Calculate pending and refunded amounts
    const pendingAmount = paymentsData
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + (p.amount || p.totalAmount || 0), 0);

    const refundedAmount = paymentsData
      .filter((p) => p.status === "REFUNDED")
      .reduce((sum, p) => sum + (p.amount || p.totalAmount || 0), 0);

    const cancelledAmount = paymentsData
      .filter((p) => p.status === "CANCELLED")
      .reduce((sum, p) => sum + (p.amount || p.totalAmount || 0), 0);

    // Calculate growth rates (simplified - comparing with previous period)
    const todayRevenue = paymentsData
      .filter(
        (p) => p.status === "COMPLETED" && new Date(p.paymentDate) >= today
      )
      .reduce((sum, p) => sum + (p.amount || p.totalAmount || 0), 0);

    const yesterdayRevenue = paymentsData
      .filter(
        (p) =>
          p.status === "COMPLETED" &&
          new Date(p.paymentDate) >= yesterday &&
          new Date(p.paymentDate) < today
      )
      .reduce((sum, p) => sum + (p.amount || p.totalAmount || 0), 0);

    const dailyGrowth =
      yesterdayRevenue > 0
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        : 0;

    // Calculate monthly growth (compare same period)
    const thisMonthRevenue = paymentsData
      .filter(
        (p) => p.status === "COMPLETED" && new Date(p.paymentDate) >= thisMonth
      )
      .reduce((sum, p) => sum + (p.amount || p.totalAmount || 0), 0);

    // For fair comparison, calculate last month revenue for the same number of days
    const daysIntoMonth = now.getDate();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      daysIntoMonth
    );

    const lastMonthRevenue = paymentsData
      .filter((p) => {
        const paymentDate = new Date(p.paymentDate);
        return (
          p.status === "COMPLETED" &&
          paymentDate >= lastMonthStart &&
          paymentDate <= lastMonthEnd
        );
      })
      .reduce((sum, p) => sum + (p.amount || p.totalAmount || 0), 0);

    const monthlyGrowth =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    return {
      totalRevenue,
      totalTransactions,
      averageTransaction,
      successRate,
      dailyGrowth,
      monthlyGrowth,
      pendingAmount,
      refundedAmount,
      cancelledAmount,
      cancelledTransactions,
      currentMonth,
      currentYear,
      previousMonth,
      previousYear,
    };
  }, [paymentsData]);

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      // Trigger refresh by incrementing key
      setRefreshKey((prev) => prev + 1);
      toast.success("Dữ liệu đã được làm mới");
    } catch (error) {
      console.error("Error refreshing payments data:", error);
      toast.error("Không thể làm mới dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setMethodFilter("all");
    setDateRange("30");
    setStartDate(null);
    setEndDate(null);
    toast.success("Đã đặt lại bộ lọc");
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setIsDetailsModalOpen(true);
  };

  const handleRefund = (payment) => {
    setSelectedPayment(payment);
    setIsRefundModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsDetailsModalOpen(false);
    setIsRefundModalOpen(false);
    setSelectedPayment(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quản lý thanh toán
          </h1>
          <p className="text-gray-600 mt-1">
            Giám sát giao dịch, quản lý hoàn tiền và phân tích dữ liệu thanh
            toán
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Đặt lại bộ lọc</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Làm mới</span>
          </Button>
   
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrencyVND(paymentStats.totalRevenue)}
                </p>
                <p className="text-xs text-gray-500">Tổng doanh thu</p>
                <p className="text-xs text-green-600">
                  {paymentStats.monthlyGrowth >= 0 ? "+" : ""}
                  {paymentStats.monthlyGrowth.toFixed(1)}% (
                  {paymentStats.currentMonth}/{paymentStats.currentYear} vs{" "}
                  {paymentStats.previousMonth}/{paymentStats.previousYear})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {paymentStats.totalTransactions.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Tổng giao dịch</p>
                <p className="text-xs text-blue-600">
                  {paymentStats.dailyGrowth.toFixed(1)}% hôm nay
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrencyVND(paymentStats.averageTransaction)}
                </p>
                <p className="text-xs text-gray-500">
                  Giá trị giao dịch trung bình
                </p>
                <p className="text-xs text-purple-600">
                  {paymentStats.successRate.toFixed(1)}% tỷ lệ thành công
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrencyVND(paymentStats.cancelledAmount)}
                </p>
                <p className="text-xs text-gray-500">Đã hủy</p>
                <p className="text-xs text-red-600">
                  {paymentStats.cancelledTransactions} giao dịch
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm theo mã thanh toán, mã đặt chỗ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:text-black"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="COMPLETED">Thành công</SelectItem>
                <SelectItem value="PENDING">Đang chờ</SelectItem>
                <SelectItem value="REFUNDED">Đã hoàn tiền</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Phương thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {/* <SelectItem value="CREDIT_CARD">Thẻ tín dụng</SelectItem> */}
                <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                <SelectItem value="PAYPAL">PayPal</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 ngày qua</SelectItem>
                  <SelectItem value="30">30 ngày qua</SelectItem>
                  <SelectItem value="90">3 tháng qua</SelectItem>
                  <SelectItem value="365">1 năm qua</SelectItem>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="custom">Tùy chỉnh</SelectItem>
                </SelectContent>
              </Select>

              {dateRange === "custom" && (
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate
                          ? format(startDate, "dd/MM/yyyy", { locale: vi })
                          : "Từ ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate
                          ? format(endDate, "dd/MM/yyyy", { locale: vi })
                          : "Đến ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="table" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Bảng giao dịch</TabsTrigger>
          <TabsTrigger value="analytics">Phân tích</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tất cả giao dịch</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentTable
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                methodFilter={methodFilter}
                dateRange={dateRange}
                startDate={startDate}
                endDate={endDate}
                refreshKey={refreshKey}
                onViewDetails={handleViewDetails}
                onRefund={handleRefund}
                showActions={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PaymentAnalytics
            dateRange={dateRange}
            startDate={startDate}
            endDate={endDate}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PaymentDetailsModal
        open={isDetailsModalOpen}
        onClose={handleCloseModals}
        paymentData={selectedPayment}
      />

      <RefundModal
        open={isRefundModalOpen}
        onClose={handleCloseModals}
        paymentData={selectedPayment}
      />
    </div>
  );
};

export default AdminPaymentPage;
