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

// Text constants for Vietnamese interface
const TEXT = {
  paymentDetails: "Chi Tiết Thanh Toán",
  close: "Đóng",
  paymentId: "Mã Thanh Toán",
  bookingId: "Mã Đặt Chỗ",
  amount: "Số Tiền",
  paymentMethod: "Phương Thức Thanh Toán",
  status: "Trạng Thái",
  paymentDate: "Ngày Thanh Toán",
  createdAt: "Ngày Tạo",
  updatedAt: "Ngày Cập Nhật",
  transactionTimeline: "Lịch Sử Giao Dịch",
  paymentCreated: "Tạo Thanh Toán",
  paymentProcessed: "Xử Lý Thanh Toán",
  paymentCompleted: "Hoàn Thành Thanh Toán",
  statuses: {
    SUCCESS: "Thành Công",
    PENDING: "Đang Chờ",
    REFUNDED: "Đã Hoàn Tiền",
    FAILED: "Thất Bại",
    CANCELLED: "Đã Hủy",
  },
  methods: {
    CREDIT_CARD: "Thẻ Tín Dụng",
    BANK_TRANSFER: "Chuyển Khoản Ngân Hàng",
    PAYPAL: "PayPal",
  },
};

const PaymentDetailsModal = ({ open, onClose, paymentData }) => {
  const [copied, setCopied] = useState("");

  // Memoized color configurations
  const statusConfig = useMemo(
    () => ({
      colors: {
        success: "bg-green-100 text-green-800",
        pending: "bg-yellow-100 text-yellow-800",
        refunded: "bg-purple-100 text-purple-800",
        failed: "bg-red-100 text-red-800",
        cancelled: "bg-gray-100 text-gray-800",
      },
      icons: {
        success: <CheckCircle className="h-4 w-4 text-green-600" />,
        pending: <Clock className="h-4 w-4 text-yellow-600" />,
        refunded: <RefreshCw className="h-4 w-4 text-purple-600" />,
        failed: <AlertTriangle className="h-4 w-4 text-red-600" />,
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
    const statusKey = status?.toLowerCase();
    return statusConfig.colors[statusKey] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    const statusKey = status?.toLowerCase();
    return statusConfig.icons[statusKey] || <Clock className="h-4 w-4" />;
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

  // Create timeline based on actual data
  const timeline = [
    {
      event: TEXT.paymentCreated,
      timestamp: paymentData.createdAt,
      status: "info",
      description: "Thanh toán được tạo trong hệ thống",
    },
    {
      event: TEXT.paymentProcessed,
      timestamp: paymentData.paymentDate,
      status: "info",
      description: "Thanh toán được xử lý",
    },
    ...(paymentData.status === "SUCCESS"
      ? [
          {
            event: TEXT.paymentCompleted,
            timestamp: paymentData.updatedAt,
            status: "success",
            description: "Thanh toán hoàn thành thành công",
          },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {TEXT.paymentDetails}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                #{paymentData.paymentId}
              </p>
            </div>
            <Badge
              className={getStatusColor(paymentData.status?.toLowerCase())}
            >
              {getStatusIcon(paymentData.status?.toLowerCase())}
              <span className="ml-1">
                {TEXT.statuses[paymentData.status] || paymentData.status}
              </span>
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Payment Information */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="dark:bg-gray-800 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2 dark:text-white">
                <DollarSign className="h-4 w-4" />
                <span>Thông Tin Thanh Toán</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{TEXT.paymentId}:</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      #{paymentData.paymentId}
                    </code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{TEXT.bookingId}:</span>
                    <span className="font-medium">
                      #{paymentData.bookingId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{TEXT.amount}:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(paymentData.amount || 0, "VND")}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{TEXT.paymentMethod}:</span>
                    <span className="font-medium">
                      {TEXT.methods[paymentData.paymentMethod] ||
                        paymentData.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{TEXT.status}:</span>
                    <Badge variant="outline">
                      {TEXT.statuses[paymentData.status] || paymentData.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{TEXT.paymentDate}:</span>
                    <span className="font-medium">
                      {paymentData.paymentDate
                        ? formatDate(paymentData.paymentDate)
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{TEXT.createdAt}:</span>
                  <span>
                    {paymentData.createdAt
                      ? formatDate(paymentData.createdAt)
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{TEXT.updatedAt}:</span>
                  <span>
                    {paymentData.updatedAt
                      ? formatDate(paymentData.updatedAt)
                      : "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{TEXT.transactionTimeline}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="dark:bg-gray-800">
              <div className="space-y-4">
                {timeline.map((event, index) => (
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
                        <p className="font-medium">{event.event}</p>
                        <span className="text-sm text-gray-500">
                          {event.timestamp
                            ? formatDate(event.timestamp)
                            : "N/A"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
