import { useState } from "react";
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

const PaymentDetailsModal = ({ open, onClose, paymentData }) => {
  const [copied, setCopied] = useState("");

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  if (!open || !paymentData) return null;

  const getStatusColor = (status) => {
    const colors = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-purple-100 text-purple-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: <CheckCircle className="h-4 w-4 text-green-600" />,
      pending: <Clock className="h-4 w-4 text-yellow-600" />,
      failed: <AlertTriangle className="h-4 w-4 text-red-600" />,
      refunded: <RefreshCw className="h-4 w-4 text-purple-600" />,
      cancelled: <X className="h-4 w-4 text-gray-600" />,
    };
    return icons[status] || <Clock className="h-4 w-4" />;
  };

  const getRiskScoreColor = (score) => {
    const colors = {
      low: "text-green-600 bg-green-50",
      medium: "text-yellow-600 bg-yellow-50",
      high: "text-red-600 bg-red-50",
    };
    return colors[score] || "text-gray-600 bg-gray-50";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
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
                Payment Details
              </h2>
              <p className="text-sm text-gray-500">
                {paymentData.transactionId}
              </p>
            </div>
            <Badge className={getStatusColor(paymentData.status)}>
              {getStatusIcon(paymentData.status)}
              <span className="ml-1">
                {paymentData.status.charAt(0).toUpperCase() +
                  paymentData.status.slice(1)}
              </span>
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Receipt
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="booking">Booking</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Payment Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Amount</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          paymentData.amount,
                          paymentData.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Processing Fee</span>
                      <span className="font-medium">
                        {formatCurrency(paymentData.fees, paymentData.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Net Amount</span>
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
                        <span className="text-gray-600">Payment Method</span>
                        <span className="font-medium capitalize">
                          {paymentData.method.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Method Details</span>
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
                      <span>Transaction Info</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Transaction ID</span>
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
                        <span className="text-gray-600">Gateway Reference</span>
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
                        <span className="text-gray-600">Processing Time</span>
                        <span className="font-medium">
                          {paymentData.processingTime}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Risk Score</span>
                        <Badge
                          className={getRiskScoreColor(paymentData.riskScore)}
                        >
                          {paymentData.riskScore.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Country</span>
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
                    <span>Transaction Timeline</span>
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
                            <p className="font-medium">{event.event}</p>
                            <span className="text-sm text-gray-500">
                              {formatDate(event.timestamp)}
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
            </TabsContent>

            {/* Customer Tab */}
            <TabsContent value="customer" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Customer Information</span>
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
                        <span className="text-gray-600">Registration Date</span>
                        <span className="font-medium">
                          {new Date(
                            extendedData.customerDetails.registrationDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Bookings</span>
                        <span className="font-medium">
                          {extendedData.customerDetails.totalBookings}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Spent</span>
                        <span className="font-medium">
                          {formatCurrency(
                            extendedData.customerDetails.totalSpent
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Login</span>
                        <span className="font-medium">
                          {new Date(
                            extendedData.customerDetails.lastLogin
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>Risk Assessment</span>
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
                        {paymentData.riskScore.toUpperCase()} Risk
                      </h3>
                      <p className="text-sm text-gray-600">
                        This transaction has been assessed as{" "}
                        {paymentData.riskScore} risk based on multiple factors.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Risk Factors</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>
                          • Payment method:{" "}
                          {paymentData.method.replace("_", " ")}
                        </li>
                        <li>• Geographic location: {paymentData.country}</li>
                        <li>
                          • Customer history:{" "}
                          {extendedData.customerDetails.totalBookings} previous
                          bookings
                        </li>
                        <li>
                          • Transaction amount:{" "}
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
                    <span>Booking Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Booking Information</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Booking Reference
                          </span>
                          <span className="font-medium">
                            {paymentData.bookingReference}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Flight Route</span>
                          <span className="font-medium">
                            {extendedData.bookingDetails.flightRoute}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Departure Date</span>
                          <span className="font-medium">
                            {new Date(
                              extendedData.bookingDetails.departureDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Passengers</span>
                          <span className="font-medium">
                            {extendedData.bookingDetails.passengers}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Class</span>
                          <span className="font-medium">
                            {extendedData.bookingDetails.class}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Airline</span>
                          <span className="font-medium">
                            {extendedData.bookingDetails.airline}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Payment Breakdown</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base Fare</span>
                          <span className="font-medium">
                            {formatCurrency(paymentData.amount - 50)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Taxes & Fees</span>
                          <span className="font-medium">
                            {formatCurrency(50)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total Amount</span>
                          <span>{formatCurrency(paymentData.amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Technical Tab */}
            <TabsContent value="technical" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4" />
                    <span>Gateway Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold">Payment Processor</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gateway</span>
                          <span className="font-medium">
                            {extendedData.gatewayDetails.processor}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Merchant ID</span>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {extendedData.gatewayDetails.merchantId}
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gateway Fee</span>
                          <span className="font-medium">
                            {formatCurrency(
                              extendedData.gatewayDetails.gatewayFee
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">Fee Breakdown</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interchange Fee</span>
                          <span className="font-medium">
                            {formatCurrency(
                              extendedData.gatewayDetails.interchangeFee
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Processing Fee</span>
                          <span className="font-medium">
                            {formatCurrency(
                              extendedData.gatewayDetails.processingFee
                            )}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total Fees</span>
                          <span>{formatCurrency(paymentData.fees)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Raw Transaction Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(paymentData, null, 2)}
                  </pre>
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
