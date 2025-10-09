import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Building2,
  Smartphone,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { formatCurrencyVND } from "@/utils/currency-utils";

const MyFlightsPayment = ({
  booking,
  onPaymentSuccess,
  onBack,
  isLoading,
  error,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolderName: "",
  });
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });

  const paymentMethods = [
    {
      id: "BANK_TRANSFER",
      name: "Chuyển khoản ngân hàng",
      icon: Building2,
      description: "Thanh toán qua chuyển khoản ngân hàng",
    },
    {
      id: "CREDIT_CARD",
      name: "Thẻ tín dụng/ghi nợ",
      icon: CreditCard,
      description: "Visa, Mastercard, JCB",
    },
    {
      id: "PAYPAL",
      name: "PayPal",
      icon: Smartphone,
      description: "Thanh toán qua PayPal",
    },
  ];

  const handleCardChange = (field, value) => {
    setCardDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBankChange = (field, value) => {
    setBankDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePayment = async () => {
    // Validate payment details based on method
    if (paymentMethod === "CREDIT_CARD") {
      if (
        !cardDetails.cardNumber ||
        !cardDetails.expiryDate ||
        !cardDetails.cvv ||
        !cardDetails.cardHolderName
      ) {
        alert("Vui lòng điền đầy đủ thông tin thẻ");
        return;
      }
    } else if (paymentMethod === "BANK_TRANSFER") {
      if (
        !bankDetails.bankName ||
        !bankDetails.accountNumber ||
        !bankDetails.accountHolder
      ) {
        alert("Vui lòng điền đầy đủ thông tin tài khoản ngân hàng");
        return;
      }
    }

    const paymentData = {
      paymentMethod,
      amount: booking.totalAmount,
      bookingId: booking.bookingId,
      ...(paymentMethod === "CREDIT_CARD" && { cardDetails }),
      ...(paymentMethod === "BANK_TRANSFER" && { bankDetails }),
    };

    await onPaymentSuccess(paymentData);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="space-y-6">
      {/* Payment Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-500" />
            Thanh toán đặt chỗ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Mã đặt chỗ</p>
              <p className="font-semibold">{booking.bookingCode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Số tiền thanh toán</p>
              <p className="font-semibold text-lg text-blue-600">
                {formatCurrencyVND(booking.totalAmount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn phương thức thanh toán</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="space-y-4">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <div key={method.id} className="flex items-center space-x-3">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label
                      htmlFor={method.id}
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <IconComponent className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-sm text-gray-600">
                          {method.description}
                        </p>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Payment Details */}
      {paymentMethod === "CREDIT_CARD" && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin thẻ tín dụng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Số thẻ</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.cardNumber}
                onChange={(e) =>
                  handleCardChange(
                    "cardNumber",
                    formatCardNumber(e.target.value)
                  )
                }
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Ngày hết hạn</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={cardDetails.expiryDate}
                  onChange={(e) =>
                    handleCardChange(
                      "expiryDate",
                      formatExpiryDate(e.target.value)
                    )
                  }
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChange={(e) =>
                    handleCardChange(
                      "cvv",
                      e.target.value.replace(/[^0-9]/g, "")
                    )
                  }
                  maxLength={4}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardHolderName">Tên chủ thẻ</Label>
              <Input
                id="cardHolderName"
                placeholder="NGUYEN VAN A"
                value={cardDetails.cardHolderName}
                onChange={(e) =>
                  handleCardChange(
                    "cardHolderName",
                    e.target.value.toUpperCase()
                  )
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {paymentMethod === "BANK_TRANSFER" && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin chuyển khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vui lòng chuyển khoản theo thông tin bên dưới. Hệ thống sẽ tự
                động xác nhận thanh toán.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Thông tin tài khoản nhận</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Ngân hàng:</span>
                  <span className="font-medium">Vietcombank</span>
                </div>
                <div className="flex justify-between">
                  <span>Số tài khoản:</span>
                  <span className="font-medium">1234567890</span>
                </div>
                <div className="flex justify-between">
                  <span>Chủ tài khoản:</span>
                  <span className="font-medium">CONG TY TNHH AIRSKY</span>
                </div>
                <div className="flex justify-between">
                  <span>Số tiền:</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrencyVND(booking.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Nội dung:</span>
                  <span className="font-medium">{booking.bookingCode}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Ngân hàng của bạn</Label>
              <Input
                id="bankName"
                placeholder="Ví dụ: Vietcombank, BIDV..."
                value={bankDetails.bankName}
                onChange={(e) => handleBankChange("bankName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Số tài khoản</Label>
              <Input
                id="accountNumber"
                placeholder="Số tài khoản của bạn"
                value={bankDetails.accountNumber}
                onChange={(e) =>
                  handleBankChange("accountNumber", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountHolder">Tên chủ tài khoản</Label>
              <Input
                id="accountHolder"
                placeholder="Tên chủ tài khoản"
                value={bankDetails.accountHolder}
                onChange={(e) =>
                  handleBankChange("accountHolder", e.target.value)
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {paymentMethod === "PAYPAL" && (
        <Card>
          <CardHeader>
            <CardTitle>Thanh toán PayPal</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Bạn sẽ được chuyển hướng đến PayPal để hoàn tất thanh toán một
                cách an toàn.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Quay lại
        </Button>
        <Button onClick={handlePayment} disabled={isLoading} className="flex-1">
          {isLoading ? (
            "Đang xử lý..."
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Thanh toán {formatCurrencyVND(booking.totalAmount)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MyFlightsPayment;
