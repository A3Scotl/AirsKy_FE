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
import { exportBookingToPDF } from "@/utils/booking-pdf-exporter";

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
  cancellationReason: "Lý do hủy",
  lastUpdated: "Cập nhật cuối",
  downloadPdf: "Tải PDF",
  sendEmail: "Gửi Email",
  close: "Đóng",
  class: "Hạng",
};

const BookingDetailsModal = ({ open, onOpenChange, booking, onEdit }) => {
  if (!booking) return null;

  const [isExportingPDF, setIsExportingPDF] = React.useState(false);

  const statusMap = {
    Confirmed: "Đã Xác Nhận",
    Pending: "Chờ Xử Lý",
    Cancelled: "Đã Hủy",
  };

  // Badge styling functions
  const badgeStyles = {
    status: {
      Confirmed: "bg-green-100 text-green-800 border-green-200",
      "Đã Xác Nhận": "bg-green-100 text-green-800 border-green-200",
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Chờ Xử Lý": "bg-yellow-100 text-yellow-800 border-yellow-200",
      Cancelled: "bg-red-100 text-red-800 border-red-200",
      "Đã Hủy": "bg-red-100 text-red-800 border-red-200",
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

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      await exportBookingToPDF(booking);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      // Có thể thêm toast notification ở đây
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl dark:text-white">
                {TEXT.bookingDetails}
              </DialogTitle>
              <DialogDescription className="dark:text-gray-300">
                {TEXT.completeInfo} {booking.bookingRef}
              </DialogDescription>
            </div>
            <Badge
              variant="outline"
              className={getBadgeStyle(
                "status",
                statusMap[booking.status] || booking.status
              )}
            >
              {statusMap[booking.status] || booking.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Flight Information */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="dark:bg-gray-800 dark:border-gray-700">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Plane className="h-5 w-5" />
                {TEXT.flightInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="dark:bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {TEXT.route}
                      </p>
                      <p className="font-semibold dark:text-white">
                        {booking.route}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {TEXT.departure}
                      </p>
                      <p className="font-semibold dark:text-white">
                        {formatDate(booking.departure)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {TEXT.passengers}
                      </p>
                      <p className="font-semibold dark:text-white">
                        {booking.passengerCount ||
                          (Array.isArray(booking.passengers)
                            ? booking.passengers.length
                            : 1)}{" "}
                        {TEXT.passenger}
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
                    <CreditCard className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {TEXT.totalAmount}
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {booking.amount}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Có thể hoàn tiền
                      </p>
                      <p className="font-semibold dark:text-white">
                        {booking.isRefundable ? (
                          <span className="text-green-600">Có</span>
                        ) : (
                          <span className="text-red-600">Không</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Có thể thay đổi</p>
                      <p className="font-semibold">
                        {booking.isChangeable ? (
                          <span className="text-green-600">Có</span>
                        ) : (
                          <span className="text-red-600">Không</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="dark:bg-gray-800 dark:border-gray-700">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <User className="h-5 w-5 dark:text-gray-400" />
                {TEXT.customerInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="dark:bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {TEXT.fullName}
                    </p>
                    <p className="font-semibold text-lg dark:text-white">
                      {booking.customer}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {TEXT.email}
                      </p>
                      <p className="font-medium dark:text-white">
                        {booking.email}
                      </p>
                    </div>
                  </div>

                  {booking.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {TEXT.phone}
                        </p>
                        <p className="font-medium dark:text-white">
                          {booking.phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {TEXT.bookingRef}
                    </p>
                    <p className="font-bold text-lg text-blue-600">
                      {booking.bookingRef}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {TEXT.bookingDate}
                    </p>
                    <p className="font-medium dark:text-white">
                      {formatShortDate(booking.bookingDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {TEXT.bookingId}
                    </p>
                    <p className="font-medium font-mono text-sm dark:text-white">
                      {booking.id}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passengers Information */}
          {booking.passengers && booking.passengers.length > 0 && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="dark:bg-gray-800 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Users className="h-5 w-5 dark:text-gray-400" />
                  {TEXT.passengers}
                </CardTitle>
              </CardHeader>
              <CardContent className="dark:bg-gray-800">
                <div className="space-y-4">
                  {booking.passengers.map((passenger, index) => (
                    <div
                      key={passenger.passengerId}
                      className="border rounded-lg p-4 dark:border-gray-600 dark:bg-gray-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium dark:text-white">
                          {passenger.firstName} {passenger.lastName}
                        </h4>
                        <Badge variant="outline">{passenger.type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Ngày sinh
                          </p>
                          <p className="dark:text-white">
                            {formatShortDate(passenger.dateOfBirth)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Hộ chiếu
                          </p>
                          <p className="dark:text-white">
                            {passenger.passportNumber}
                          </p>
                        </div>
                        {passenger.seatNumber && (
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Số ghế
                            </p>
                            <p className="dark:text-white">
                              {passenger.seatNumber}
                            </p>
                          </div>
                        )}
                        {passenger.className && (
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Hạng
                            </p>
                            <p className="dark:text-white">
                              {passenger.className}
                            </p>
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
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="dark:bg-gray-800 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <MessageSquare className="h-5 w-5 dark:text-gray-400" />
                  {TEXT.additionalInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 dark:bg-gray-800">
                {booking.seatPreferences && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium dark:text-gray-400">
                      {TEXT.seatPreferences}
                    </p>
                    <p className="text-sm bg-gray-50 dark:bg-gray-700 dark:text-white p-3 rounded-md">
                      {booking.seatPreferences}
                    </p>
                  </div>
                )}

                {booking.specialRequests && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium dark:text-gray-400">
                      {TEXT.specialRequests}
                    </p>
                    <p className="text-sm bg-gray-50 dark:bg-gray-700 dark:text-white p-3 rounded-md">
                      {booking.specialRequests}
                    </p>
                  </div>
                )}

                {booking.cancellationReason && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium dark:text-gray-400">
                      {TEXT.cancellationReason}
                    </p>
                    <p className="text-sm bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-3 rounded-md">
                      {booking.cancellationReason}
                    </p>
                  </div>
                )}

                {booking.payment && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium dark:text-gray-400">
                      Thông Tin Thanh Toán
                    </p>
                    <div className="text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <p className="dark:text-white">
                        <strong className="dark:text-gray-300">
                          Trạng thái:
                        </strong>{" "}
                        {statusMap[booking.payment.status] ||
                          booking.payment.status ||
                          "N/A"}
                      </p>
                      <p className="dark:text-white">
                        <strong className="dark:text-gray-300">
                          Phương thức:
                        </strong>{" "}
                        {booking.payment.paymentMethod === "BANK_TRANSFER"
                          ? "Chuyển khoản"
                          : booking.payment.paymentMethod || "N/A"}
                      </p>
                      <p className="dark:text-white">
                        <strong className="dark:text-gray-300">
                          Ngày thanh toán:
                        </strong>{" "}
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
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="dark:bg-gray-800 dark:border-gray-700">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Clock className="h-5 w-5 dark:text-gray-400" />
                {TEXT.bookingTimeline}
              </CardTitle>
            </CardHeader>
            <CardContent className="dark:bg-gray-800">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium dark:text-white">
                      {TEXT.bookingCreated}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(booking.bookingDate)}
                    </p>
                  </div>
                </div>

                {booking.status === "Confirmed" && (
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium dark:text-white">
                        {TEXT.bookingConfirmed}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {TEXT.paymentProcessed}
                      </p>
                    </div>
                  </div>
                )}

                {booking.status === "Cancelled" && (
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-400">
                        {TEXT.bookingCancelled}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
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
                        <p className="font-medium dark:text-white">
                          {TEXT.lastUpdated}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(booking.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-500 dark:text-gray-400">
                      {TEXT.flightDeparture}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      {formatDate(booking.departure)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExportingPDF ? "Đang xuất PDF..." : "Xuất PDF"}
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="dark:border-gray-600 dark:hover:bg-gray-700"
            >
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
