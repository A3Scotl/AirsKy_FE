import { useState, useEffect } from "react";
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
import PaymentAnalytics from "@/components/admin/payments/payment-analytics";
import PaymentTable from "@/components/admin/payments/payment-table";
import PaymentDetailsModal from "@/components/admin/payments/payment-details-modal";
import RefundModal from "@/components/admin/payments/payment-refund-modal";
import ExportButton from "@/components/common/export-button";

const AdminPaymentPage = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Payment statistics
  const paymentStats = {
    totalRevenue: 2847560.0,
    totalTransactions: 15847,
    averageTransaction: 179.65,
    successRate: 98.7,
    dailyGrowth: 8.2,
    monthlyGrowth: 23.5,
    pendingAmount: 45890.5,
    refundedAmount: 12340.75,
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleExportData = () => {
    // In real implementation, this would export payment data
    // console.log("Exporting payment data...");
    alert("Payment data exported successfully!");
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
          <h1 className="text-3xl font-bold text-gray-900">
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
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Làm mới</span>
          </Button>
          <ExportButton entity="payments" />
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
                  ${paymentStats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Tổng doanh thu</p>
                <p className="text-xs text-green-600">
                  +{paymentStats.monthlyGrowth}% tháng này
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
                  +{paymentStats.dailyGrowth}% hôm nay
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
                  ${paymentStats.averageTransaction}
                </p>
                <p className="text-xs text-gray-500">
                  Giá trị giao dịch trung bình
                </p>
                <p className="text-xs text-purple-600">
                  {paymentStats.successRate}% tỷ lệ thành công
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${paymentStats.pendingAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500"> Tiền đang chờ</p>
                <p className="text-xs text-orange-600">
                  ${paymentStats.refundedAmount.toLocaleString()} hoàn tiền
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
                  placeholder="Search by transaction ID, customer name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="pending">Đang chờ</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
                <SelectItem value="refunded">Hoàn tiền</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="credit_card">Thẻ tín dụng</SelectItem>
                <SelectItem value="debit_card">Thẻ ghi nợ</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="bank_transfer">
                  Chuyển khoản ngân hàng
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 ngày qua</SelectItem>
                <SelectItem value="30">30 ngày qua</SelectItem>
                <SelectItem value="90">3 tháng qua</SelectItem>
                <SelectItem value="365">1 năm qua</SelectItem>
                <SelectItem value="custom">
                  Khoảng thời gian tùy chỉnh
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          {/* <TabsTrigger value="overview">Overview</TabsTrigger> */}
          <TabsTrigger value="transactions">Giao dịch</TabsTrigger>
          <TabsTrigger value="analytics">Phân tích</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-1">
            {/* Recent Transactions Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Hoạt động gần đây</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentTable
                  searchTerm={searchTerm}
                  statusFilter={statusFilter}
                  methodFilter={methodFilter}
                  dateRange={dateRange}
                  onViewDetails={handleViewDetails}
                  onRefund={handleRefund}
                  limit={5}
                  showActions={false}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
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
                onViewDetails={handleViewDetails}
                onRefund={handleRefund}
                showActions={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PaymentAnalytics />
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
