import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarIcon,
  MapPin,
  User,
  Mail,
  Phone,
  CreditCard,
  Clock,
  Plane,
  Users,
  X,
  Download,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Vietnamese text constants
const TEXT = {
  bookingDetails: "Chi Tiết Đặt Vé",
  completeInfo: "Thông tin đầy đủ cho đặt vé",
  flightInfo: "Thông Tin Chuyến Bay",
  route: "Tuyến Bay",
  departure: "Khởi Hành",
  arrival: "Đến Nơi",
  passengers: "Hành Khách",
  passenger: "hành khách",
  totalAmount: "Tổng Tiền",
  customerInfo: "Thông Tin Khách Hàng",
  fullName: "Họ và Tên",
  email: "Email",
  phone: "Số Điện Thoại",
  bookingRef: "Mã Đặt Vé",
  bookingDate: "Ngày Đặt",
  bookingId: "ID Đặt Vé",
  additionalInfo: "Thông Tin Bổ Sung",
  seatPreferences: "Yêu Cầu Chỗ Ngồi",
  specialRequests: "Yêu Cầu Đặc Biệt",
  bookingTimeline: "Lịch Sử Đặt Vé",
  bookingCreated: "Đặt Vé Được Tạo",
  bookingConfirmed: "Đặt Vé Đã Xác Nhận",
  paymentProcessed: "Thanh toán đã được xử lý thành công",
  bookingCancelled: "Đặt Vé Đã Hủy",
  refundProcessing: "Đang xử lý hoàn tiền",
  flightDeparture: "Khởi Hành Chuyến Bay",
  downloadPdf: "Tải PDF",
  sendEmail: "Gửi Email",
  close: "Đóng",
  class: "Hạng",
};

const BookingDetailsModal = ({ open, onOpenChange, booking, onEdit }) => {
  if (!booking) return null;

  // Badge styling functions
  const badgeStyles = {
    status: {
      Confirmed: "bg-green-100 text-green-800 border-green-200",
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Cancelled: "bg-red-100 text-red-800 border-red-200",
    },
    class: {
      Economy: "bg-blue-100 text-blue-800",
      Business: "bg-purple-100 text-purple-800",
      First: "bg-amber-100 text-amber-800",
    },
  };

  const getBadgeStyle = (type, value) =>
    badgeStyles[type][value] || "bg-gray-100 text-gray-800 border-gray-200";

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "EEEE, dd MMMM yyyy 'lúc' HH:mm", {
        locale: vi,
      });
    } catch {
      return dateString;
    }
  };

  const formatShortDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {TEXT.bookingDetails}
              </DialogTitle>
              <DialogDescription>
                {TEXT.completeInfo} {booking.bookingRef}
              </DialogDescription>
            </div>
            <Badge
              variant="outline"
              className={getBadgeStyle("status", booking.status)}
            >
              {booking.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Flight Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                {TEXT.flightInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">{TEXT.route}</p>
                      <p className="font-semibold">{booking.route}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">{TEXT.departure}</p>
                      <p className="font-semibold">
                        {formatDate(booking.departure)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">{TEXT.passengers}</p>
                      <p className="font-semibold">
                        {booking.passengers} {TEXT.passenger}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={getBadgeStyle("class", booking.class)}
                    >
                      {TEXT.class} {booking.class}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">
                        {TEXT.totalAmount}
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {booking.amount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {TEXT.customerInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">{TEXT.fullName}</p>
                    <p className="font-semibold text-lg">{booking.customer}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">{TEXT.email}</p>
                      <p className="font-medium">{booking.email}</p>
                    </div>
                  </div>

                  {booking.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">{TEXT.phone}</p>
                        <p className="font-medium">{booking.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">{TEXT.bookingRef}</p>
                    <p className="font-bold text-lg text-blue-600">
                      {booking.bookingRef}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">{TEXT.bookingDate}</p>
                    <p className="font-medium">
                      {formatShortDate(booking.bookingDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">{TEXT.bookingId}</p>
                    <p className="font-medium font-mono text-sm">
                      {booking.id}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passengers Information */}
          {booking.passengersDetails &&
            booking.passengersDetails.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {TEXT.passengers}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {booking.passengersDetails.map((passenger, index) => (
                      <div
                        key={passenger.passengerId}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">
                            {passenger.firstName} {passenger.lastName}
                          </h4>
                          <Badge variant="outline">{passenger.type}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Ngày sinh</p>
                            <p>{formatShortDate(passenger.dateOfBirth)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Hộ chiếu</p>
                            <p>{passenger.passportNumber}</p>
                          </div>
                          {passenger.seatNumber && (
                            <div>
                              <p className="text-gray-600">Số ghế</p>
                              <p>{passenger.seatNumber}</p>
                            </div>
                          )}
                          {passenger.className && (
                            <div>
                              <p className="text-gray-600">Hạng</p>
                              <p>{passenger.className}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Additional Information */}
          {(booking.specialRequests ||
            booking.seatPreferences ||
            booking.payment) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {TEXT.additionalInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.seatPreferences && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      {TEXT.seatPreferences}
                    </p>
                    <p className="text-sm bg-gray-50 p-3 rounded-md">
                      {booking.seatPreferences}
                    </p>
                  </div>
                )}

                {booking.specialRequests && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      {TEXT.specialRequests}
                    </p>
                    <p className="text-sm bg-gray-50 p-3 rounded-md">
                      {booking.specialRequests}
                    </p>
                  </div>
                )}

                {booking.payment && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Thông Tin Thanh Toán
                    </p>
                    <div className="text-sm bg-gray-50 p-3 rounded-md">
                      <p>
                        <strong>Trạng thái:</strong>{" "}
                        {booking.payment.status || "N/A"}
                      </p>
                      <p>
                        <strong>Phương thức:</strong>{" "}
                        {booking.payment.method || "N/A"}
                      </p>
                      <p>
                        <strong>Ngày thanh toán:</strong>{" "}
                        {booking.payment.paymentDate
                          ? formatShortDate(booking.payment.paymentDate)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Booking Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {TEXT.bookingTimeline}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">{TEXT.bookingCreated}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(booking.bookingDate)}
                    </p>
                  </div>
                </div>

                {booking.status === "Confirmed" && (
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">{TEXT.bookingConfirmed}</p>
                      <p className="text-sm text-gray-600">
                        {TEXT.paymentProcessed}
                      </p>
                    </div>
                  </div>
                )}

                {booking.status === "Cancelled" && (
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">{TEXT.bookingCancelled}</p>
                      <p className="text-sm text-gray-600">
                        {TEXT.refundProcessing}
                      </p>
                    </div>
                  </div>
                )}

                {booking.updatedAt &&
                  booking.updatedAt !== booking.bookingDate && (
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Cập Nhật Cuối</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(booking.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-500">
                      {TEXT.flightDeparture}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatDate(booking.departure)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {TEXT.downloadPdf}
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                {TEXT.sendEmail}
              </Button>
            </div>

            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              {TEXT.close}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailsModal;
