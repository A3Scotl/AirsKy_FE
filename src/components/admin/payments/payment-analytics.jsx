import { useState } from "react";
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

const PaymentAnalytics = ({ preview = false }) => {
  // Mock analytics data
  const analyticsData = {
    revenueMetrics: {
      daily: { current: 45670.5, previous: 42180.3, growth: 8.3 },
      weekly: { current: 287456.75, previous: 245890.2, growth: 16.9 },
      monthly: { current: 1234567.89, previous: 987654.32, growth: 25.0 },
      yearly: { current: 12345678.9, previous: 9876543.21, growth: 25.0 },
    },
    transactionMetrics: {
      total: 15847,
      successful: 15634,
      failed: 213,
      pending: 45,
      refunded: 89,
      successRate: 98.7,
    },
    paymentMethods: [
      {
        method: "Credit Card",
        transactions: 8934,
        percentage: 56.4,
        revenue: 1567890.45,
      },
      {
        method: "Debit Card",
        transactions: 3421,
        percentage: 21.6,
        revenue: 598765.32,
      },
      {
        method: "PayPal",
        transactions: 2156,
        percentage: 13.6,
        revenue: 387654.21,
      },
      {
        method: "Apple Pay",
        transactions: 876,
        percentage: 5.5,
        revenue: 154321.98,
      },
      {
        method: "Google Pay",
        transactions: 460,
        percentage: 2.9,
        revenue: 87654.32,
      },
    ],

    failureAnalysis: {
      reasons: [
        { reason: "Insufficient Funds", count: 98, percentage: 46.0 },
        { reason: "Card Declined", count: 54, percentage: 25.4 },
        { reason: "Network Error", count: 32, percentage: 15.0 },
        { reason: "Invalid Card", count: 18, percentage: 8.5 },
        { reason: "Others", count: 11, percentage: 5.1 },
      ],
    },
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
            <p className="text-sm text-gray-600">Daily Revenue</p>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold">
                ${analyticsData.revenueMetrics.daily.current.toLocaleString()}
              </span>
              {getGrowthIcon(analyticsData.revenueMetrics.daily.growth)}
              <span
                className={`text-xs ${getGrowthColor(
                  analyticsData.revenueMetrics.daily.growth
                )}`}
              >
                {analyticsData.revenueMetrics.daily.growth}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Success Rate</p>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-green-600">
                {analyticsData.transactionMetrics.successRate}%
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
          <p className="text-sm text-gray-600">Top Payment Method</p>
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {analyticsData.paymentMethods[0].method}
            </span>
            <Badge variant="secondary">
              {analyticsData.paymentMethods[0].percentage}%
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
            <span>Revenue Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(analyticsData.revenueMetrics).map(
              ([period, data]) => (
                <div key={period} className="space-y-2">
                  <p className="text-sm text-gray-600 capitalize">{period}</p>
                  <p className="text-xl font-bold">
                    ${data.current.toLocaleString()}
                  </p>
                  <div className="flex items-center space-x-1">
                    {getGrowthIcon(data.growth)}
                    <span className={`text-sm ${getGrowthColor(data.growth)}`}>
                      {data.growth}% vs previous {period}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Transaction Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Successful</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {analyticsData.transactionMetrics.successful.toLocaleString()}
                </span>
                <Badge className="bg-green-100 text-green-800">
                  {analyticsData.transactionMetrics.successRate}%
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Failed</span>
              <span className="font-medium text-red-600">
                {analyticsData.transactionMetrics.failed.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="font-medium text-orange-600">
                {analyticsData.transactionMetrics.pending.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Refunded</span>
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
              <span>Payment Methods</span>
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
                    <Badge variant="outline">{method.percentage}%</Badge>
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
              <span>Failure Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-red-800">
                Total Failed Transactions:{" "}
                {analyticsData.transactionMetrics.failed}
              </p>
              <p className="text-xs text-red-600">
                {(
                  (analyticsData.transactionMetrics.failed /
                    analyticsData.transactionMetrics.total) *
                  100
                ).toFixed(1)}
                % failure rate
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
                        {reason.percentage}%
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
