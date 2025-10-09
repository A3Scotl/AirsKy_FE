import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Plane,
  CreditCard,
  Download,
  Mail,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import { formatCurrencyVND } from "@/utils/currency-utils";

const MyFlightsSuccess = ({ booking, onNewSearch }) => {
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const handleDownloadInvoice = () => {
    // In real app, this would trigger a download
    console.log("Downloading invoice...");
  };

  const handleEmailInvoice = () => {
    // In real app, this would send email
    console.log("Sending invoice via email...");
  };

  const handleProceedToCheckIn = () => {
    // Navigate to check-in page with booking data
    console.log("Proceeding to check-in...");
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Thanh toán thành công!
            </h2>
            <p className="text-green-700">
              Cảm ơn bạn đã thanh toán. Đặt chỗ của bạn đã được xác nhận.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-500" />
            Xác nhận thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Mã đặt chỗ</p>
              <p className="font-semibold text-lg">{booking.bookingCode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Trạng thái</p>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Đã thanh toán
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Số tiền</p>
              <p className="font-semibold text-lg text-green-600">
                {formatCurrencyVND(booking.totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mã giao dịch</p>
              <p className="font-semibold">{booking.payment?.transactionId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phương thức</p>
              <p className="font-semibold">
                {booking.payment?.paymentMethod === "BANK_TRANSFER" &&
                  "Chuyển khoản"}
                {booking.payment?.paymentMethod === "CREDIT_CARD" &&
                  "Thẻ tín dụng"}
                {booking.payment?.paymentMethod === "PAYPAL" && "PayPal"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Thời gian thanh toán</p>
              <p className="font-semibold">
                {booking.payment?.paymentDate
                  ? formatDateTime(booking.payment.paymentDate).date
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flight Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-500" />
            Thông tin chuyến bay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {booking.flightSegments.map((segment, index) => {
              const departureDateTime = formatDateTime(segment.departureTime);
              const arrivalDateTime = formatDateTime(segment.arrivalTime);

              return (
                <div key={segment.segmentId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {segment.departureAirport.airportCode}
                        </p>
                        <p className="text-sm text-gray-600">Khởi hành</p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {segment.arrivalAirport.airportCode}
                        </p>
                        <p className="text-sm text-gray-600">Đến</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {segment.flightNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {segment.aircraft}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-gray-600">Ngày bay</p>
                        <p className="font-medium">{departureDateTime.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-gray-600">Giờ khởi hành</p>
                        <p className="font-medium">{departureDateTime.time}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Các bước tiếp theo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-medium">Check-in online</p>
                <p className="text-sm text-gray-600">
                  Thực hiện check-in online từ 24-48 giờ trước giờ khởi hành
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium">Đến sân bay</p>
                <p className="text-sm text-gray-600">
                  Có mặt tại sân bay đúng giờ với giấy tờ tùy thân
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-medium">Lên máy bay</p>
                <p className="text-sm text-gray-600">
                  Sử dụng thẻ lên máy bay điện tử hoặc in tại sân bay
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          onClick={handleDownloadInvoice}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Tải hóa đơn
        </Button>

        <Button
          variant="outline"
          onClick={handleEmailInvoice}
          className="flex items-center gap-2"
        >
          <Mail className="w-4 h-4 mr-2" />
          Gửi qua email
        </Button>

        <Button
          onClick={handleProceedToCheckIn}
          className="flex items-center gap-2"
        >
          <Plane className="w-4 h-4 mr-2" />
          Tiến hành Check-in
        </Button>
      </div>

      {/* New Search */}
      <div className="text-center">
        <Button variant="outline" onClick={onNewSearch}>
          Tìm kiếm đặt chỗ khác
        </Button>
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
        <p>
          Cảm ơn bạn đã chọn AirSky. Chúc bạn có một chuyến bay an toàn và thoải
          mái!
        </p>
        <p className="mt-2">
          Hotline hỗ trợ: 1900 XXX XXX | Email: support@airsky.vn
        </p>
      </div>
    </div>
  );
};

export default MyFlightsSuccess;
