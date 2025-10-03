import { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Calendar,
  Activity,
  PieChart,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrencyVND } from "@/utils/currency-utils";
import { paymentApi } from "@/apis/payment-api";

// Text constants for Vietnamese interface
const TEXT = {
  revenueMetrics: "Chỉ Số Doanh Thu",
  transactionStatus: "Trạng Thái Giao Dịch",
  paymentMethods: "Phương Thức Thanh Toán",
  failureAnalysis: "Phân Tích Thất Bại / Lý do hoàn tiền",
  dailyRevenue: "Doanh Thu Hàng Ngày",
  successRate: "Tỷ Lệ Thành Công",
  topPaymentMethod: "Phương Thức Thanh Toán Hàng Đầu",
  periods: {
    daily: "hàng ngày",
    weekly: "hàng tuần",
    monthly: "hàng tháng",
    yearly: "hàng năm",
  },
  statuses: {
    successful: "Thành Công",
    failed: "Thất Bại",
    pending: "Đang Chờ",
    refunded: "Đã Hoàn Tiền",
  },
  totalFailedTransactions: "Tổng giao dịch được hoàn trả:",
  failureRate: "tỷ lệ hoàn trả",
  vsPrevious: "so với",
};

const PaymentAnalytics = ({
  preview = false,
  dateRange = "30",
  startDate = null,
  endDate = null,
}) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch payments data
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);

        // Build query parameters based on date range
        const params = {
          page: 0,
          size: 1000,
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
          setPayments(response.data.content || response.data || []);
        }
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [dateRange, startDate, endDate]);
  // Calculate analytics data from real payments
  const analyticsData = useMemo(() => {
    if (!payments.length) {
      return {
        revenueMetrics: {
          totalRevenue: 0,
          averageTransaction: 0,
          dailyGrowth: 0,
          monthlyGrowth: 0,
        },
        transactionMetrics: {
          total: 0,
          successful: 0,
          failed: 0,
          pending: 0,
          refunded: 0,
          successRate: 0,
        },
        paymentMethods: [],
        failureAnalysis: { reasons: [] },
      };
    }

    // Since API already filters by date range, use all payments
    const filteredPayments = payments;

    // Calculate transaction metrics
    const total = filteredPayments.length;
    const successful = filteredPayments.filter(
      (p) => p.status === "SUCCESS"
    ).length;
    const pending = filteredPayments.filter(
      (p) => p.status === "PENDING"
    ).length;
    const refunded = filteredPayments.filter(
      (p) => p.status === "REFUNDED"
    ).length;
    const failed = total - successful - pending - refunded;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    // Calculate revenue metrics
    const successfulPayments = filteredPayments.filter(
      (p) => p.status === "SUCCESS"
    );
    const totalRevenue = successfulPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );
    const averageTransaction = successful > 0 ? totalRevenue / successful : 0;

    // Simple growth calculation (compare with previous period of same length)
    let dailyGrowth = 0;
    let monthlyGrowth = 0;

    if (dateRange !== "all" && dateRange !== "custom") {
      const days = parseInt(dateRange);
      const now = new Date();
      const currentPeriodStart = new Date();
      currentPeriodStart.setDate(now.getDate() - days);

      // Calculate previous period
      const previousPeriodStart = new Date();
      previousPeriodStart.setDate(now.getDate() - days * 2);
      const previousPeriodEnd = new Date();
      previousPeriodEnd.setDate(now.getDate() - days);

      const previousPeriodRevenue = payments
        .filter((p) => {
          const paymentDate = new Date(p.paymentDate);
          return (
            paymentDate >= previousPeriodStart &&
            paymentDate <= previousPeriodEnd &&
            p.status === "SUCCESS"
          );
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      if (previousPeriodRevenue > 0) {
        dailyGrowth =
          ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) *
          100;
        monthlyGrowth = dailyGrowth; // Same calculation for simplicity
      }
    }

    // Calculate payment methods distribution
    const methodStats = {};
    filteredPayments.forEach((payment) => {
      const method = payment.paymentMethod || "UNKNOWN";
      if (!methodStats[method]) {
        methodStats[method] = { count: 0, revenue: 0 };
      }
      methodStats[method].count++;
      if (payment.status === "SUCCESS") {
        methodStats[method].revenue += payment.amount || 0;
      }
    });

    const paymentMethods = Object.entries(methodStats).map(
      ([method, stats]) => ({
        method:
          method === "CREDIT_CARD"
            ? "Thẻ tín dụng"
            : method === "BANK_TRANSFER"
            ? "Chuyển khoản"
            : method === "PAYPAL"
            ? "PayPal"
            : method,
        transactions: stats.count,
        percentage:
          total > 0 ? Number(((stats.count / total) * 100).toFixed(1)) : 0,
        revenue: stats.revenue,
      })
    );

    return {
      revenueMetrics: {
        totalRevenue,
        averageTransaction,
        dailyGrowth,
        monthlyGrowth,
      },
      transactionMetrics: {
        total,
        successful,
        failed,
        pending,
        refunded,
        successRate,
      },
      paymentMethods,
      failureAnalysis: {
        reasons:
          failed > 0
            ? [
                {
                  reason: "Lý do thất bại chưa được phân loại",
                  count: failed,
                  percentage: 100.0,
                },
              ]
            : [],
      },
    };
  }, [payments, dateRange, startDate, endDate]);

  // Memoized calculations for better performance
  const failureRate = useMemo(() => {
    return (
      (analyticsData.transactionMetrics.failed /
        analyticsData.transactionMetrics.total) *
      100
    ).toFixed(1);
  }, [
    analyticsData.transactionMetrics.failed,
    analyticsData.transactionMetrics.total,
  ]);

  const formatCurrency = (amount) => {
    return formatCurrencyVND(amount);
  };

  const getGrowthIcon = (growth) => {
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getGrowthColor = (growth) => {
    return growth >= 0 ? "text-green-600" : "text-red-600";
  };

  if (preview) {
    return (
      <div className="space-y-4">
        {/* Revenue Trend Preview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{TEXT.dailyRevenue}</p>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold">
                {formatCurrency(analyticsData.revenueMetrics.daily.current)}
              </span>
              {getGrowthIcon(analyticsData.revenueMetrics.daily.growth)}
              <span
                className={`text-xs ${getGrowthColor(
                  analyticsData.revenueMetrics.daily.growth
                )}`}
              >
                {analyticsData.revenueMetrics.daily.growth.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">{TEXT.successRate}</p>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-green-600">
                {analyticsData.transactionMetrics.successRate.toFixed(1)}%
              </span>
              <Progress
                value={analyticsData.transactionMetrics.successRate}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Top Payment Method */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{TEXT.topPaymentMethod}</p>
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {analyticsData.paymentMethods.length > 0
                ? analyticsData.paymentMethods[0].method
                : "Chưa có dữ liệu"}
            </span>
            <Badge variant="secondary">
              {analyticsData.paymentMethods.length > 0
                ? `${analyticsData.paymentMethods[0].percentage.toFixed(1)}%`
                : "0%"}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>{TEXT.revenueMetrics}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Tổng doanh thu</p>
              <p className="text-xl font-bold">
                {formatCurrency(analyticsData.revenueMetrics.totalRevenue)}
              </p>
              <div className="flex items-center space-x-1">
                {getGrowthIcon(analyticsData.revenueMetrics.dailyGrowth)}
                <span
                  className={`text-sm ${getGrowthColor(
                    analyticsData.revenueMetrics.dailyGrowth
                  )}`}
                >
                  {analyticsData.revenueMetrics.dailyGrowth.toFixed(1)}% so với
                  kỳ trước
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Giá trị giao dịch trung bình
              </p>
              <p className="text-xl font-bold">
                {formatCurrency(
                  analyticsData.revenueMetrics.averageTransaction
                )}
              </p>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-500">Đã hoàn thành</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Tỷ lệ thành công</p>
              <p className="text-xl font-bold">
                {analyticsData.transactionMetrics.successRate.toFixed(1)}%
              </p>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-green-600">
                  {analyticsData.transactionMetrics.successful} /{" "}
                  {analyticsData.transactionMetrics.total}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Tổng giao dịch</p>
              <p className="text-xl font-bold">
                {analyticsData.transactionMetrics.total}
              </p>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-500">Trong kỳ</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>{TEXT.transactionStatus}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {TEXT.statuses.successful}
              </span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {analyticsData.transactionMetrics.successful.toLocaleString()}
                </span>
                <Badge className="bg-green-100 text-green-800">
                  {analyticsData.transactionMetrics.successRate.toFixed(1)}%
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {TEXT.statuses.failed}
              </span>
              <span className="font-medium text-red-600">
                {analyticsData.transactionMetrics.failed.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {TEXT.statuses.pending}
              </span>
              <span className="font-medium text-orange-600">
                {analyticsData.transactionMetrics.pending.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {TEXT.statuses.refunded}
              </span>
              <span className="font-medium text-purple-600">
                {analyticsData.transactionMetrics.refunded.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>{TEXT.paymentMethods}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyticsData.paymentMethods.map((method, index) => (
              <div key={method.method} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{method.method}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {method.transactions.toLocaleString()}
                    </span>
                    <Badge variant="outline">
                      {method.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={method.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Time Analysis & Failure Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>{TEXT.failureAnalysis}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-red-800">
                {TEXT.totalFailedTransactions}{" "}
                {analyticsData.transactionMetrics.failed}
              </p>
              <p className="text-xs text-red-600">
                {failureRate}% {TEXT.failureRate}
              </p>
            </div>

            <div className="space-y-3">
              {analyticsData.failureAnalysis.reasons.map((reason) => (
                <div key={reason.reason} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{reason.reason}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {reason.count}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        {reason.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={reason.percentage} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentAnalytics;
