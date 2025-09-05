import { useState, useMemo } from "react";
import {
  X,
  CreditCard,
  User,
  Calendar,
  MapPin,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Plane,
  Copy,
  Download,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Text constants for Vietnamese interface
const TEXT = {
  paymentDetails: "Chi Tiết Thanh Toán",
  receipt: "Biên Lai",
  overview: "Tổng Quan",
  customer: "Khách Hàng",
  booking: "Đặt Chỗ",
  paymentSummary: "Tóm Tắt Thanh Toán",
  transactionInfo: "Thông Tin Giao Dịch",
  transactionTimeline: "Lịch Sử Giao Dịch",
  customerInformation: "Thông Tin Khách Hàng",
  riskAssessment: "Đánh Giá Rủi Ro",
  bookingDetails: "Chi Tiết Đặt Chỗ",
  gatewayDetails: "Chi Tiết Cổng Thanh Toán",
  rawTransactionData: "Dữ Liệu Giao Dịch Thô",
  fields: {
    amount: "Số Tiền",
    processingFee: "Phí Xử Lý",
    netAmount: "Số Tiền Thực",
    paymentMethod: "Phương Thức Thanh Toán",
    methodDetails: "Chi Tiết Phương Thức",
    transactionId: "Mã Giao Dịch",
    gatewayReference: "Tham Chiếu Cổng",
    processingTime: "Thời Gian Xử Lý",
    riskScore: "Điểm Rủi Ro",
    country: "Quốc Gia",
    registrationDate: "Ngày Đăng Ký",
    totalBookings: "Tổng Đặt Chỗ",
    totalSpent: "Tổng Chi Tiêu",
    lastLogin: "Đăng Nhập Cuối",
    bookingReference: "Mã Đặt Chỗ",
    flightRoute: "Tuyến Bay",
    departureDate: "Ngày Khởi Hành",
    passengers: "Hành Khách",
    class: "Hạng",
    airline: "Hãng Hàng Không",
    baseFare: "Giá Cơ Bản",
    taxesAndFees: "Thuế Và Phí",
    totalAmount: "Tổng Tiền",
    gateway: "Cổng",
    merchantId: "Mã Thương Gia",
    gatewayFee: "Phí Cổng",
    interchangeFee: "Phí Hoán Đổi",
    totalFees: "Tổng Phí",
  },
  statuses: {
    completed: "Hoàn Thành",
    pending: "Đang Chờ",
    failed: "Thất Bại",
    refunded: "Đã Hoàn Tiền",
    cancelled: "Đã Hủy",
  },
  riskLabels: {
    low: "THẤP",
    medium: "TRUNG BÌNH",
    high: "CAO",
  },
  timelineEvents: {
    "Payment Initiated": "Bắt Đầu Thanh Toán",
    "Payment Processing": "Xử Lý Thanh Toán",
    "Payment Completed": "Hoàn Thành Thanh Toán",
  },
  timelineDescriptions: {
    "Customer initiated payment process":
      "Khách hàng bắt đầu quá trình thanh toán",
    "Payment gateway processing transaction":
      "Cổng thanh toán đang xử lý giao dịch",
    "Payment successfully processed": "Thanh toán được xử lý thành công",
  },
  riskAssessmentText:
    "Giao dịch này đã được đánh giá là rủi ro {risk} dựa trên nhiều yếu tố.",
  riskFactors: "Yếu Tố Rủi Ro",
  paymentBreakdown: "Phân Tích Thanh Toán",
  bookingInformation: "Thông Tin Đặt Chỗ",
  paymentProcessor: "Bộ Xử Lý Thanh Toán",
  feeBreakdown: "Phân Tích Phí",
};

const PaymentDetailsModal = ({ open, onClose, paymentData }) => {
  const [copied, setCopied] = useState("");

  // Memoized color configurations
  const statusConfig = useMemo(
    () => ({
      colors: {
        completed: "bg-green-100 text-green-800",
        pending: "bg-yellow-100 text-yellow-800",
        failed: "bg-red-100 text-red-800",
        refunded: "bg-purple-100 text-purple-800",
        cancelled: "bg-gray-100 text-gray-800",
      },
      icons: {
        completed: <CheckCircle className="h-4 w-4 text-green-600" />,
        pending: <Clock className="h-4 w-4 text-yellow-600" />,
        failed: <AlertTriangle className="h-4 w-4 text-red-600" />,
        refunded: <RefreshCw className="h-4 w-4 text-purple-600" />,
        cancelled: <X className="h-4 w-4 text-gray-600" />,
      },
    }),
    []
  );

  const riskColors = useMemo(
    () => ({
      low: "text-green-600 bg-green-50",
      medium: "text-yellow-600 bg-yellow-50",
      high: "text-red-600 bg-red-50",
    }),
    []
  );

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  if (!open || !paymentData) return null;

  const getStatusColor = (status) => {
    return statusConfig.colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    return statusConfig.icons[status] || <Clock className="h-4 w-4" />;
  };

  const getRiskScoreColor = (score) => {
    return riskColors[score] || "text-gray-600 bg-gray-50";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatCurrency = (amount, currency = "USD") => {
    if (currency === "USD") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount * 24000); // Convert USD to VND
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Mock additional data that would come from API
  const extendedData = {
    timeline: [
      {
        event: "Payment Initiated",
        timestamp: paymentData.date,
        status: "info",
        description: "Customer initiated payment process",
      },
      {
        event: "Payment Processing",
        timestamp: new Date(
          new Date(paymentData.date).getTime() + 1000
        ).toISOString(),
        status: "info",
        description: "Payment gateway processing transaction",
      },
      {
        event: "Payment Completed",
        timestamp: new Date(
          new Date(paymentData.date).getTime() + 3000
        ).toISOString(),
        status: "success",
        description: "Payment successfully processed",
      },
    ],
    customerDetails: {
      customerId: "CUST_12345",
      registrationDate: "2023-06-15",
      totalBookings: 12,
      totalSpent: 5460.75,
      riskProfile: paymentData.riskScore,
      lastLogin: "2024-08-15T08:00:00Z",
    },
    bookingDetails: {
      flightRoute: "JFK → LAX",
      departureDate: "2024-09-15",
      passengers: 2,
      class: "Economy",
      airline: "AirSky Airlines",
    },
    gatewayDetails: {
      processor: "Stripe",
      merchantId: "acct_1234567890",
      gatewayFee: paymentData.fees,
      interchangeFee: 5.25,
      processingFee: 8.25,
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {TEXT.paymentDetails}
              </h2>
              <p className="text-sm text-gray-500">
                {paymentData.transactionId}
              </p>
            </div>
            <Badge className={getStatusColor(paymentData.status)}>
              {getStatusIcon(paymentData.status)}
              <span className="ml-1">
                {TEXT.statuses[paymentData.status] ||
                  paymentData.status.charAt(0).toUpperCase() +
                    paymentData.status.slice(1)}
              </span>
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {TEXT.receipt}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">{TEXT.overview}</TabsTrigger>
              <TabsTrigger value="customer">{TEXT.customer}</TabsTrigger>
              <TabsTrigger value="booking">{TEXT.booking}</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>{TEXT.paymentSummary}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {TEXT.fields.amount}
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          paymentData.amount,
                          paymentData.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {TEXT.fields.processingFee}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(paymentData.fees, paymentData.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {TEXT.fields.netAmount}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(
                          paymentData.netAmount,
                          paymentData.currency
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {TEXT.fields.paymentMethod}
                        </span>
                        <span className="font-medium capitalize">
                          {paymentData.method.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {TEXT.fields.methodDetails}
                        </span>
                        <span className="font-medium">
                          {paymentData.methodDetails}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>{TEXT.transactionInfo}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {TEXT.fields.transactionId}
                        </span>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {paymentData.transactionId}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                paymentData.transactionId,
                                "transaction"
                              )
                            }
                          >
                            {copied === "transaction" ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {TEXT.fields.gatewayReference}
                        </span>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {paymentData.gatewayReference}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                paymentData.gatewayReference,
                                "gateway"
                              )
                            }
                          >
                            {copied === "gateway" ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {TEXT.fields.processingTime}
                        </span>
                        <span className="font-medium">
                          {paymentData.processingTime}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {TEXT.fields.riskScore}
                        </span>
                        <Badge
                          className={getRiskScoreColor(paymentData.riskScore)}
                        >
                          {TEXT.riskLabels[paymentData.riskScore] ||
                            paymentData.riskScore.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {TEXT.fields.country}
                        </span>
                        <span className="font-medium">
                          {paymentData.country}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{TEXT.transactionTimeline}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {extendedData.timeline.map((event, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div
                          className={`w-3 h-3 rounded-full mt-1 ${
                            event.status === "success"
                              ? "bg-green-500"
                              : event.status === "error"
                              ? "bg-red-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {TEXT.timelineEvents[event.event] || event.event}
                            </p>
                            <span className="text-sm text-gray-500">
                              {formatDate(event.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {TEXT.timelineDescriptions[event.description] ||
                              event.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customer Tab */}
            <TabsContent value="customer" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{TEXT.customerInformation}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg">
                          {paymentData.customerName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {paymentData.customerName}
                        </h3>
                        <p className="text-gray-600">
                          {paymentData.customerEmail}
                        </p>
                        <p className="text-sm text-gray-500">
                          Customer ID: {extendedData.customerDetails.customerId}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {TEXT.fields.registrationDate}
                        </span>
                        <span className="font-medium">
                          {new Date(
                            extendedData.customerDetails.registrationDate
                          ).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {TEXT.fields.totalBookings}
                        </span>
                        <span className="font-medium">
                          {extendedData.customerDetails.totalBookings}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {TEXT.fields.totalSpent}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            extendedData.customerDetails.totalSpent
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {TEXT.fields.lastLogin}
                        </span>
                        <span className="font-medium">
                          {new Date(
                            extendedData.customerDetails.lastLogin
                          ).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>{TEXT.riskAssessment}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-6 border rounded-lg">
                      <div
                        className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${getRiskScoreColor(
                          paymentData.riskScore
                        )}`}
                      >
                        <Shield className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        Rủi Ro{" "}
                        {TEXT.riskLabels[paymentData.riskScore] ||
                          paymentData.riskScore.toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {TEXT.riskAssessmentText.replace(
                          "{risk}",
                          TEXT.riskLabels[
                            paymentData.riskScore
                          ]?.toLowerCase() || paymentData.riskScore
                        )}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">{TEXT.riskFactors}</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>
                          • {TEXT.fields.paymentMethod}:{" "}
                          {paymentData.method.replace("_", " ")}
                        </li>
                        <li>• Vị trí địa lý: {paymentData.country}</li>
                        <li>
                          • Lịch sử khách hàng:{" "}
                          {extendedData.customerDetails.totalBookings} lần đặt
                          chỗ trước đó
                        </li>
                        <li>
                          • Số tiền giao dịch:{" "}
                          {formatCurrency(paymentData.amount)}
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Booking Tab */}
            <TabsContent value="booking" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plane className="h-4 w-4" />
                    <span>{TEXT.bookingDetails}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">
                        {TEXT.bookingInformation}
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {TEXT.fields.bookingReference}
                          </span>
                          <span className="font-medium">
                            {paymentData.bookingReference}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {TEXT.fields.flightRoute}
                          </span>
                          <span className="font-medium">
                            {extendedData.bookingDetails.flightRoute}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {TEXT.fields.departureDate}
                          </span>
                          <span className="font-medium">
                            {new Date(
                              extendedData.bookingDetails.departureDate
                            ).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {TEXT.fields.passengers}
                          </span>
                          <span className="font-medium">
                            {extendedData.bookingDetails.passengers}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {TEXT.fields.class}
                          </span>
                          <span className="font-medium">
                            {extendedData.bookingDetails.class}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {TEXT.fields.airline}
                          </span>
                          <span className="font-medium">
                            {extendedData.bookingDetails.airline}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">{TEXT.paymentBreakdown}</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {TEXT.fields.baseFare}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(paymentData.amount - 50)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {TEXT.fields.taxesAndFees}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(50)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>{TEXT.fields.totalAmount}</span>
                          <span>{formatCurrency(paymentData.amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
