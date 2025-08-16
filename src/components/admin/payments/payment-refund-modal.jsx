import { useState } from "react";
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

const RefundModal = ({ open, onClose, paymentData }) => {
  const [refundType, setRefundType] = useState("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  if (!open || !paymentData) return null;

  const maxRefundAmount = paymentData.amount;
  const processingFeeRefund = refundType === "full" ? paymentData.fees : 0;
  const calculatedRefundAmount =
    refundType === "full" ? maxRefundAmount : parseFloat(refundAmount) || 0;

  const validateForm = () => {
    const newErrors = {};

    if (refundType === "partial") {
      if (!refundAmount) {
        newErrors.refundAmount = "Refund amount is required";
      } else if (parseFloat(refundAmount) <= 0) {
        newErrors.refundAmount = "Refund amount must be greater than 0";
      } else if (parseFloat(refundAmount) > maxRefundAmount) {
        newErrors.refundAmount = "Refund amount cannot exceed original payment";
      }
    }

    if (!refundReason) {
      newErrors.refundReason = "Refund reason is required";
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
        refundAmount: calculatedRefundAmount,
        refundReason,
        refundNotes,
        processingFeeRefund,
        notifyCustomer,
        refundId: `REF_${Date.now()}`,
        processedAt: new Date().toISOString(),
      };

      console.log("Processing refund:", refundData);
      alert(
        `Refund of $${calculatedRefundAmount.toFixed(
          2
        )} processed successfully!`
      );
      onClose();
    } catch (error) {
      console.error("Refund failed:", error);
      alert("Refund processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
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
                Process Refund
              </h2>
              <p className="text-sm text-gray-500">
                Transaction: {paymentData.transactionId}
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
                <span>Original Payment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer</span>
                <span className="font-medium">{paymentData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Booking Reference</span>
                <span className="font-medium">
                  {paymentData.bookingReference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Original Amount</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(paymentData.amount, paymentData.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fees</span>
                <span className="font-medium">
                  {formatCurrency(paymentData.fees, paymentData.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
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
              <CardTitle>Refund Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Refund Type */}
              <div className="space-y-2">
                <Label>Refund Type</Label>
                <Select value={refundType} onValueChange={setRefundType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Refund</SelectItem>
                    <SelectItem value="partial">Partial Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Refund Amount (for partial refunds) */}
              {refundType === "partial" && (
                <div className="space-y-2">
                  <Label htmlFor="refundAmount">Refund Amount *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="refundAmount"
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="0.00"
                      className={`pl-10 ${
                        errors.refundAmount ? "border-red-500" : ""
                      }`}
                      min="0"
                      max={maxRefundAmount}
                      step="0.01"
                    />
                  </div>
                  {errors.refundAmount && (
                    <p className="text-red-500 text-xs">
                      {errors.refundAmount}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Maximum refundable amount: {formatCurrency(maxRefundAmount)}
                  </p>
                </div>
              )}

              {/* Refund Reason */}
              <div className="space-y-2">
                <Label htmlFor="refundReason">Refund Reason *</Label>
                <Select value={refundReason} onValueChange={setRefundReason}>
                  <SelectTrigger
                    className={errors.refundReason ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select refund reason" />
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
                <Label htmlFor="refundNotes">Additional Notes</Label>
                <Textarea
                  id="refundNotes"
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Optional notes about this refund..."
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
                  Send email notification to customer
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Refund Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span>Refund Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Refund Amount</span>
                <span className="font-bold text-purple-600">
                  {formatCurrency(calculatedRefundAmount, paymentData.currency)}
                </span>
              </div>
              {refundType === "full" && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Fee Refund</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(processingFeeRefund, paymentData.currency)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Refund</span>
                <span className="text-purple-600">
                  {formatCurrency(
                    calculatedRefundAmount + processingFeeRefund,
                    paymentData.currency
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Remaining Balance</span>
                <span>
                  {formatCurrency(
                    maxRefundAmount - calculatedRefundAmount,
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
              <strong>Important:</strong> Refunds are typically processed within
              5-10 business days. The refund will be credited to the original
              payment method. This action cannot be undone.
            </AlertDescription>
          </Alert>

          {/* Processing Times */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Expected Processing Times</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Credit/Debit Cards</span>
                  <span className="text-gray-600">3-5 business days</span>
                </div>
                <div className="flex justify-between">
                  <span>PayPal</span>
                  <span className="text-gray-600">1-2 business days</span>
                </div>
                <div className="flex justify-between">
                  <span>Apple Pay / Google Pay</span>
                  <span className="text-gray-600">1-3 business days</span>
                </div>
                <div className="flex justify-between">
                  <span>Bank Transfer</span>
                  <span className="text-gray-600">5-10 business days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleRefund}
              disabled={isProcessing || calculatedRefundAmount <= 0}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Process Refund</span>
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
