import { useState, useMemo } from "react";
import {
  X,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  Clock,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Text constants for Vietnamese interface
const TEXT = {
  processRefund: "Xử Lý Hoàn Tiền",
  transaction: "Giao Dịch:",
  originalPayment: "Thanh Toán Gốc",
  refundConfiguration: "Cấu Hình Hoàn Tiền",
  refundSummary: "Tóm Tắt Hoàn Tiền",
  expectedProcessingTimes: "Thời Gian Xử Lý Dự Kiến",
  fields: {
    customer: "Khách Hàng",
    bookingReference: "Mã Đặt Chỗ",
    originalAmount: "Số Tiền Gốc",
    processingFees: "Phí Xử Lý",
    paymentMethod: "Phương Thức Thanh Toán",
    refundType: "Loại Hoàn Tiền",
    refundAmount: "Số Tiền Hoàn",
    refundReason: "Lý Do Hoàn Tiền",
    additionalNotes: "Ghi Chú Thêm",
    notifyCustomer: "Gửi email thông báo cho khách hàng",
    processingFeeRefund: "Hoàn Phí Xử Lý",
    totalRefund: "Tổng Hoàn Tiền",
    remainingBalance: "Số Dư Còn Lại",
  },
  refundTypes: {
    full: "Hoàn Tiền Toàn Bộ",
    partial: "Hoàn Tiền Một Phần",
  },
  placeholders: {
    refundAmount: "0.00",
    selectRefundReason: "Chọn lý do hoàn tiền",
    additionalNotes: "Ghi chú tùy chọn về việc hoàn tiền này...",
  },
  validationMessages: {
    refundAmountRequired: "Số tiền hoàn là bắt buộc",
    refundAmountPositive: "Số tiền hoàn phải lớn hơn 0",
    refundAmountExceeded: "Số tiền hoàn không thể vượt quá thanh toán gốc",
    refundReasonRequired: "Lý do hoàn tiền là bắt buộc",
  },
  alert: {
    title: "Quan trọng:",
    description:
      "Việc hoàn tiền thường được xử lý trong vòng 5-10 ngày làm việc. Tiền sẽ được hoàn vào phương thức thanh toán ban đầu. Hành động này không thể hoàn tác.",
  },
  processingTimes: {
    creditDebitCards: "Thẻ Tín Dụng/Ghi Nợ",
    creditDebitCardsDays: "3-5 ngày làm việc",
    paypalDays: "1-2 ngày làm việc",
    appleGooglePayDays: "1-3 ngày làm việc",
    bankTransfer: "Chuyển Khoản Ngân Hàng",
    bankTransferDays: "5-10 ngày làm việc",
  },
  buttons: {
    cancel: "Hủy",
    processRefund: "Xử Lý Hoàn Tiền",
    processing: "Đang Xử Lý...",
  },
  messages: {
    maxRefundable: "Số tiền hoàn tối đa:",
    refundSuccess: "Hoàn tiền {amount} đã được xử lý thành công!",
    refundFailed: "Xử lý hoàn tiền thất bại. Vui lòng thử lại.",
  },
};

const RefundModal = ({ open, onClose, paymentData }) => {
  const [refundType, setRefundType] = useState("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  // Memoized calculations - must be called before any early returns
  const calculations = useMemo(() => {
    if (!paymentData) {
      return {
        maxRefundAmount: 0,
        processingFeeRefund: 0,
        calculatedRefundAmount: 0,
        totalRefund: 0,
        remainingBalance: 0,
      };
    }

    const maxRefundAmount = paymentData.amount;
    const processingFeeRefund = refundType === "full" ? paymentData.fees : 0;
    const calculatedRefundAmount =
      refundType === "full" ? maxRefundAmount : parseFloat(refundAmount) || 0;

    return {
      maxRefundAmount,
      processingFeeRefund,
      calculatedRefundAmount,
      totalRefund: calculatedRefundAmount + processingFeeRefund,
      remainingBalance: maxRefundAmount - calculatedRefundAmount,
    };
  }, [paymentData, refundType, refundAmount]);

  // Early return after all hooks have been called
  if (!open || !paymentData) return null;

  const validateForm = () => {
    const newErrors = {};

    if (refundType === "partial") {
      if (!refundAmount) {
        newErrors.refundAmount = TEXT.validationMessages.refundAmountRequired;
      } else if (parseFloat(refundAmount) <= 0) {
        newErrors.refundAmount = TEXT.validationMessages.refundAmountPositive;
      } else if (parseFloat(refundAmount) > calculations.maxRefundAmount) {
        newErrors.refundAmount = TEXT.validationMessages.refundAmountExceeded;
      }
    }

    if (!refundReason) {
      newErrors.refundReason = TEXT.validationMessages.refundReasonRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRefund = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const refundData = {
        originalTransactionId: paymentData.transactionId,
        refundAmount: calculations.calculatedRefundAmount,
        refundReason,
        refundNotes,
        processingFeeRefund: calculations.processingFeeRefund,
        notifyCustomer,
        refundId: `REF_${Date.now()}`,
        processedAt: new Date().toISOString(),
      };

      console.log("Processing refund:", refundData);
      alert(
        TEXT.messages.refundSuccess.replace(
          "{amount}",
          formatCurrency(calculations.calculatedRefundAmount)
        )
      );
      onClose();
    } catch (error) {
      console.error("Refund failed:", error);
      alert(TEXT.messages.refundFailed);
    } finally {
      setIsProcessing(false);
    }
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

  const refundReasons = [
    "Customer request",
    "Duplicate payment",
    "Flight cancellation",
    "Flight delay/schedule change",
    "Service not provided",
    "Technical error",
    "Fraud prevention",
    "Chargeback prevention",
    "Goodwill gesture",
    "Other",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <RefreshCw className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {TEXT.processRefund}
              </h2>
              <p className="text-sm text-gray-500">
                {TEXT.transaction} {paymentData.transactionId}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Original Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>{TEXT.originalPayment}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">{TEXT.fields.customer}</span>
                <span className="font-medium">{paymentData.customerName}</span>
              </div>
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
                  {TEXT.fields.originalAmount}
                </span>
                <span className="font-bold text-green-600">
                  {formatCurrency(paymentData.amount, paymentData.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {TEXT.fields.processingFees}
                </span>
                <span className="font-medium">
                  {formatCurrency(paymentData.fees, paymentData.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {TEXT.fields.paymentMethod}
                </span>
                <span className="font-medium capitalize">
                  {paymentData.method.replace("_", " ")} (
                  {paymentData.methodDetails})
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Refund Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>{TEXT.refundConfiguration}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Refund Type */}
              <div className="space-y-2">
                <Label>{TEXT.fields.refundType}</Label>
                <Select value={refundType} onValueChange={setRefundType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">
                      {TEXT.refundTypes.full}
                    </SelectItem>
                    <SelectItem value="partial">
                      {TEXT.refundTypes.partial}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Refund Amount (for partial refunds) */}
              {refundType === "partial" && (
                <div className="space-y-2">
                  <Label htmlFor="refundAmount">
                    {TEXT.fields.refundAmount} *
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="refundAmount"
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder={TEXT.placeholders.refundAmount}
                      className={`pl-10 ${
                        errors.refundAmount ? "border-red-500" : ""
                      }`}
                      min="0"
                      max={calculations.maxRefundAmount}
                      step="0.01"
                    />
                  </div>
                  {errors.refundAmount && (
                    <p className="text-red-500 text-xs">
                      {errors.refundAmount}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {TEXT.messages.maxRefundable}{" "}
                    {formatCurrency(calculations.maxRefundAmount)}
                  </p>
                </div>
              )}

              {/* Refund Reason */}
              <div className="space-y-2">
                <Label htmlFor="refundReason">
                  {TEXT.fields.refundReason} *
                </Label>
                <Select value={refundReason} onValueChange={setRefundReason}>
                  <SelectTrigger
                    className={errors.refundReason ? "border-red-500" : ""}
                  >
                    <SelectValue
                      placeholder={TEXT.placeholders.selectRefundReason}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {refundReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.refundReason && (
                  <p className="text-red-500 text-xs">{errors.refundReason}</p>
                )}
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="refundNotes">
                  {TEXT.fields.additionalNotes}
                </Label>
                <Textarea
                  id="refundNotes"
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder={TEXT.placeholders.additionalNotes}
                  rows={3}
                />
              </div>

              {/* Notify Customer */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyCustomer"
                  checked={notifyCustomer}
                  onCheckedChange={setNotifyCustomer}
                />
                <Label htmlFor="notifyCustomer" className="text-sm">
                  {TEXT.fields.notifyCustomer}
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Refund Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span>{TEXT.refundSummary}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {TEXT.fields.refundAmount}
                </span>
                <span className="font-bold text-purple-600">
                  {formatCurrency(
                    calculations.calculatedRefundAmount,
                    paymentData.currency
                  )}
                </span>
              </div>
              {refundType === "full" && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {TEXT.fields.processingFeeRefund}
                  </span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(
                      calculations.processingFeeRefund,
                      paymentData.currency
                    )}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>{TEXT.fields.totalRefund}</span>
                <span className="text-purple-600">
                  {formatCurrency(
                    calculations.totalRefund,
                    paymentData.currency
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{TEXT.fields.remainingBalance}</span>
                <span>
                  {formatCurrency(
                    calculations.remainingBalance,
                    paymentData.currency
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Warning Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{TEXT.alert.title}</strong> {TEXT.alert.description}
            </AlertDescription>
          </Alert>

          {/* Processing Times */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{TEXT.expectedProcessingTimes}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{TEXT.processingTimes.creditDebitCards}</span>
                  <span className="text-gray-600">
                    {TEXT.processingTimes.creditDebitCardsDays}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>PayPal</span>
                  <span className="text-gray-600">
                    {TEXT.processingTimes.paypalDays}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Apple Pay / Google Pay</span>
                  <span className="text-gray-600">
                    {TEXT.processingTimes.appleGooglePayDays}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{TEXT.processingTimes.bankTransfer}</span>
                  <span className="text-gray-600">
                    {TEXT.processingTimes.bankTransferDays}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              {TEXT.buttons.cancel}
            </Button>
            <Button
              onClick={handleRefund}
              disabled={
                isProcessing || calculations.calculatedRefundAmount <= 0
              }
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{TEXT.buttons.processing}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>{TEXT.buttons.processRefund}</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundModal;
