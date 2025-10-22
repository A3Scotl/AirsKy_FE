import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Plane,
  Calendar,
  MapPin,
  DollarSign,
  CreditCard,
  Star,
} from "lucide-react";
import { userApi } from "@/apis/user-api";
import { bookingApi } from "@/apis/booking-api";
import { paymentApi } from "@/apis/payment-api";
import { reviewApi } from "@/apis/review-api";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrencyVND } from "@/utils/currency-utils";
import { toast } from "sonner";

const MyBookingsTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [bookingReviews, setBookingReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    comment: "",
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const itemsPerPage = 5;

  // Fetch bookings data
  const fetchBookings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await userApi.getBookingsByUserId(user.id);

      if (response.success) {
        // Transform API data to match component structure
        const transformedBookings = response.data.map((booking) => ({
          id: `BK${booking.bookingId}`,
          bookingId: booking.bookingId,
          flight: booking.flightNumber,
          from: "Origin Airport", // This would come from flight data
          to: "Destination Airport", // This would come from flight data
          date: booking.bookingDate.split("T")[0],
          displayDate: new Date(booking.bookingDate).toLocaleDateString(
            "vi-VN",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          ),
          status: booking.status,
          price: booking.totalAmount,
          formattedPrice: new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(booking.totalAmount),
          passengers: booking.passengers,
          payment: booking.payment,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
          travelClass: booking.travelClass,
          userEmail: booking.userEmail,
        }));
        setBookings(transformedBookings);
      } else {
        setError(response.message || "Failed to load bookings");
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchBookings();
  }, [user?.id]);

  // Refresh bookings data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchBookings();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle view booking details
  const handleViewBooking = async (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);

    // Fetch reviews for this booking
    try {
      const reviewsResponse = await reviewApi.getReviewsByBookingFlight(
        booking.bookingId
      );
      if (reviewsResponse.success) {
        setBookingReviews(reviewsResponse.data || []);
      }

      // Fetch user's review for this booking
      const myReviewResponse = await reviewApi.getMyReviewForBooking(
        booking.bookingId,
        user.id
      );
      if (myReviewResponse.success && myReviewResponse.data) {
        setMyReview(myReviewResponse.data);
      } else {
        setMyReview(null);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setBookingReviews([]);
      setMyReview(null);
    }
  };

  // Handle cancel booking
  const handleCancelBooking = async (booking) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy booking ${booking.id}?`)) {
      try {
        const response = await bookingApi.deleteBooking(booking.id);
        if (response.success) {
          // Refresh bookings list
          fetchBookings();
          alert("Hủy booking thành công!");
        } else {
          alert(`Lỗi: ${response.message}`);
        }
      } catch (error) {
        console.error("Error canceling booking:", error);
        alert("Có lỗi xảy ra khi hủy booking. Vui lòng thử lại.");
      }
    }
  };

  // Handle payment
  const handlePayment = async (paymentMethod) => {
    if (!selectedBooking) return;

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      // Format totalAmount to ensure it's a string with proper decimal places for PayPal
      const rawAmount = selectedBooking.price || 0;
      const formattedAmount =
        typeof rawAmount === "number"
          ? rawAmount.toFixed(2)
          : parseFloat(rawAmount).toFixed(2);

      const paymentData = {
        bookingId: selectedBooking.bookingId,
        paymentMethod: paymentMethod,
        totalAmount: formattedAmount + "", // Force string concatenation
      };

      const response = await paymentApi.createPayment(paymentData);

      if (response.success && response.data) {
        const payment = response.data;
        const checkoutUrl = payment.checkoutUrl;

        // Store payment info for redirect handling
        const paymentInfo = {
          isMyBookingsPayment: true,
          bookingCode: selectedBooking.id,
          bookingId: selectedBooking.bookingId,
          passengerName:
            selectedBooking.passengers?.[0]?.firstName +
            " " +
            selectedBooking.passengers?.[0]?.lastName,
        };
        localStorage.setItem(
          "my_bookings_payment_info",
          JSON.stringify(paymentInfo)
        );
        localStorage.setItem(
          "my_bookings_payment_info_backup",
          JSON.stringify(paymentInfo)
        );

        // Handle payment redirect based on method
        if (paymentMethod === "PAYPAL") {
          if (checkoutUrl) {
            toast.success("Đang chuyển hướng đến PayPal để thanh toán...");
            window.location.href = checkoutUrl;
          } else {
            toast.error("Không thể tạo liên kết thanh toán PayPal");
          }
        } else if (paymentMethod === "BANK_TRANSFER") {
          if (checkoutUrl) {
            toast.success("Đang chuyển hướng đến trang thanh toán QR...");
            navigate("/qr-pay", {
              state: {
                checkoutUrl: checkoutUrl,
                bookingCode: selectedBooking.id,
              },
            });
          } else {
            toast.error("Không thể tạo liên kết thanh toán");
          }
        }
      } else {
        const errorMessage = response.message || "Có lỗi xảy ra khi thanh toán";
        setPaymentError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage =
        paymentMethod === "PAYPAL"
          ? "Có lỗi xảy ra khi thanh toán PayPal"
          : "Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.";
      setPaymentError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Check if booking is eligible for review
  const isBookingEligibleForReview = (booking) => {
    if (!booking) return false;

    // Booking must be CONFIRMED
    if (booking.status !== "CONFIRMED") return false;

    // Payment must be COMPLETED
    if (!booking.payment || booking.payment.status !== "COMPLETED")
      return false;

    // All passengers must have checkin COMPLETED
    if (!booking.passengers || booking.passengers.length === 0) return false;

    return booking.passengers.every(
      (passenger) => passenger.checkinStatus === "COMPLETED"
    );
  };

  // Handle create review
  const handleCreateReview = async () => {
    if (!selectedBooking || !user?.id) return;

    setIsSubmittingReview(true);
    try {
      const reviewData = {
        bookingId: selectedBooking.bookingId,
        userId: user.id,
        flightId: selectedBooking.flightId || selectedBooking.bookingId, // Assuming flightId is available or use bookingId
        rating: reviewFormData.rating,
        comment: reviewFormData.comment,
        reviewDate: new Date().toISOString(),
        isApproved: true,
      };

      const response = await reviewApi.createReview(reviewData);

      if (response.success) {
        toast.success("Đánh giá đã được gửi thành công!");
        setIsReviewFormOpen(false);
        setReviewFormData({ rating: 5, comment: "" });

        // Refresh reviews
        const reviewsResponse = await reviewApi.getReviewsByBookingFlight(
          selectedBooking.bookingId
        );
        if (reviewsResponse.success) {
          setBookingReviews(reviewsResponse.data || []);
        }

        // Refresh my review
        const myReviewResponse = await reviewApi.getMyReviewForBooking(
          selectedBooking.bookingId,
          user.id
        );
        if (myReviewResponse.success && myReviewResponse.data) {
          setMyReview(myReviewResponse.data);
        }
      } else {
        toast.error(response.message || "Có lỗi xảy ra khi gửi đánh giá");
      }
    } catch (error) {
      console.error("Error creating review:", error);
      toast.error("Có lỗi xảy ra khi gửi đánh giá");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Filter bookings based on search, status, and date range
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.flight.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || booking.status.toLowerCase() === statusFilter;

    let matchesDateRange = true;
    if (dateRange?.from && dateRange?.to) {
      const bookingDate = new Date(booking.date);
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      matchesDateRange = bookingDate >= fromDate && bookingDate <= toDate;
    }

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  React.useEffect(() => {
    resetPagination();
  }, [searchTerm, statusFilter, dateRange]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Đặt chỗ của tôi</CardTitle>
              <CardDescription>
                Xem và quản lý các đặt chỗ chuyến bay của bạn
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="search">Tìm kiếm theo ID hoặc chuyến bay</Label>
              <Input
                id="search"
                placeholder="Nhập ID đặt chỗ hoặc số chuyến bay"
                className="dark:bg-black dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Lọc theo trạng thái</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="pending">Đang chờ</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateRange">Lọc theo khoảng thời gian</Label>
              <DateRangePicker
                date={dateRange}
                setDate={setDateRange}
                placeholder="Chọn khoảng thời gian"
                className="w-full  "
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || statusFilter !== "all" || dateRange) && (
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setDateRange(undefined);
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Đang tải danh sách đặt chỗ...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchBookings}
                className="mt-2"
              >
                Thử lại
              </Button>
            </div>
          )}

          {/* Bookings Table */}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã Đặt Chỗ</TableHead>
                  <TableHead>Chuyến Bay</TableHead>
                  <TableHead>Từ</TableHead>
                  <TableHead>Đến</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.id}</TableCell>
                    <TableCell>{booking.flight}</TableCell>
                    <TableCell>{booking.from}</TableCell>
                    <TableCell>{booking.to}</TableCell>
                    <TableCell>{booking.displayDate}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          booking.status === "CONFIRMED"
                            ? "success"
                            : booking.status === "PENDING"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{booking.formattedPrice}</TableCell>
                    <TableCell className="flex">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleViewBooking(booking)}
                      >
                        Xem
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {currentBookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Không tìm thấy đặt chỗ
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Hiển thị {startIndex + 1} đến{" "}
              {Math.min(endIndex, filteredBookings.length)} của{" "}
              {filteredBookings.length} kết quả
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 p-0 ${
                        currentPage === page
                          ? "bg-blue-600 hover:bg-blue-700"
                          : ""
                      }`}
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Tiếp theo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Booking Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="!fixed !right-0 !left-0 !top-0 !h-[100vh] !w-[60%] !translate-x-0 !translate-y-0 !border-l !border-gray-200 !bg-white !p-0 !shadow-2xl !dark:bg-gray-900 !overflow-y-scroll !scrollbar-hide !z-99999">
          <div className="flex h-full flex-col w-full">
            {/* Modal Header */}
            <DialogHeader className="flex-shrink-0 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    Chi tiết đặt chỗ {selectedBooking?.id}
                  </DialogTitle>
                  <DialogDescription>
                    Thông tin chi tiết về đặt chỗ của bạn
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedBooking && (
                <div className="space-y-6">
                  {/* Booking Status */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Trạng thái đặt chỗ</h3>
                    <Badge
                      variant={
                        selectedBooking.status === "CONFIRMED"
                          ? "success"
                          : selectedBooking.status === "PENDING"
                          ? "warning"
                          : "destructive"
                      }
                      className="text-sm"
                    >
                      {selectedBooking.status}
                    </Badge>
                  </div>
                  {/* Flight Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plane className="h-5 w-5" />
                        Thông tin chuyến bay
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Số chuyến bay
                          </Label>
                          <p className="text-lg font-semibold">
                            {selectedBooking.flight}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Hạng ghế
                          </Label>
                          <p className="text-lg font-semibold">
                            {selectedBooking.travelClass}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Ngày khởi hành
                          </Label>
                          <p className="text-lg font-semibold flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {selectedBooking.displayDate}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Trạng thái
                          </Label>
                          <Badge
                            variant={
                              selectedBooking.status === "CONFIRMED"
                                ? "success"
                                : selectedBooking.status === "PENDING"
                                ? "warning"
                                : "destructive"
                            }
                          >
                            {selectedBooking.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Passengers Information */}
                      {selectedBooking.passengers &&
                        selectedBooking.passengers.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-gray-500 mb-2 block">
                              Thông tin hành khách
                            </Label>
                            <div className="space-y-2">
                              {selectedBooking.passengers.map(
                                (passenger, index) => (
                                  <div
                                    key={passenger.passengerId || index}
                                    className="bg-gray-50 p-3 rounded-lg"
                                  >
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">
                                          Tên:
                                        </span>{" "}
                                        {passenger.firstName}{" "}
                                        {passenger.lastName}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Loại:
                                        </span>{" "}
                                        {passenger.type}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Ngày sinh:
                                        </span>{" "}
                                        {new Date(
                                          passenger.dateOfBirth
                                        ).toLocaleDateString("vi-VN")}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Số hộ chiếu:
                                        </span>{" "}
                                        {passenger.passportNumber || "N/A"}
                                      </div>
                                      {passenger.seatNumber && (
                                        <div>
                                          <span className="font-medium">
                                            Số ghế:
                                          </span>{" "}
                                          {passenger.seatNumber}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                  {/* Pricing Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Thông tin thanh toán
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg">Tổng tiền</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrencyVND(selectedBooking.price)}
                        </span>
                      </div>

                      {/* Payment Status */}
                      {selectedBooking.payment && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Trạng thái thanh toán:
                            </span>
                            <Badge
                              variant={
                                selectedBooking.payment.status === "COMPLETED"
                                  ? "success"
                                  : selectedBooking.payment.status === "PENDING"
                                  ? "warning"
                                  : "destructive"
                              }
                            >
                              {selectedBooking.payment.status === "COMPLETED"
                                ? "Đã thanh toán"
                                : selectedBooking.payment.status === "PENDING"
                                ? "Chưa thanh toán"
                                : selectedBooking.payment.status}
                            </Badge>
                          </div>
                          {selectedBooking.payment.status === "COMPLETED" &&
                            selectedBooking.payment.transactionId && (
                              <p className="text-xs text-gray-600 mt-1">
                                Mã giao dịch:{" "}
                                {selectedBooking.payment.transactionId}
                              </p>
                            )}
                        </div>
                      )}

                      {/* Payment Methods for PENDING bookings */}
                      {selectedBooking.status === "PENDING" &&
                        (!selectedBooking.payment ||
                          selectedBooking.payment.status !== "COMPLETED") && (
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-3">
                              Chọn phương thức thanh toán:
                            </h4>
                            {paymentError && (
                              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700">
                                  {paymentError}
                                </p>
                              </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Button
                                onClick={() => handlePayment("PAYPAL")}
                                disabled={isProcessingPayment}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                              >
                                <CreditCard className="w-4 h-4" />
                                {isProcessingPayment
                                  ? "Đang xử lý..."
                                  : "Thanh toán bằng PayPal"}
                              </Button>
                              <Button
                                onClick={() => handlePayment("BANK_TRANSFER")}
                                disabled={isProcessingPayment}
                                variant="outline"
                                className="flex items-center gap-2"
                              >
                                <CreditCard className="w-4 h-4" />
                                {isProcessingPayment
                                  ? "Đang xử lý..."
                                  : "Thanh toán bằng thẻ tín dụng"}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              * Bạn sẽ được chuyển hướng đến cổng thanh toán an
                              toàn
                            </p>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                  {/* Additional Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Thông tin bổ sung</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">ID đặt chỗ:</span>
                          <p className="font-mono">
                            {selectedBooking.bookingId}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Email:</span>
                          <p>{selectedBooking.userEmail}</p>
                        </div>
                        <div>
                          <span className="font-medium">Ngày tạo:</span>
                          <p>
                            {new Date(
                              selectedBooking.createdAt
                            ).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">
                            Cập nhật lần cuối:
                          </span>
                          <p>
                            {new Date(
                              selectedBooking.updatedAt
                            ).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Reviews Section */}
                  {(selectedBooking.status !== "CANCELLED" || selectedBooking.status !== "PENDING") && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Star className="h-5 w-5" />
                            Đánh giá chuyến bay
                          </span>
                          {isBookingEligibleForReview(selectedBooking) &&
                            !myReview && (
                              <Button
                                onClick={() => setIsReviewFormOpen(true)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Viết đánh giá
                              </Button>
                            )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* My Review */}
                        {myReview && (
                          <div className="border rounded-lg p-4 bg-blue-50">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-blue-900">
                                Đánh giá của bạn
                              </h4>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < myReview.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-blue-800">
                              {myReview.comment}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              {new Date(myReview.reviewDate).toLocaleDateString(
                                "vi-VN"
                              )}
                            </p>
                          </div>
                        )}

                        {/* Other Reviews */}
                        {bookingReviews.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium">
                              Đánh giá từ hành khách khác
                            </h4>
                            {bookingReviews
                              .filter((review) => review.userId !== user?.id)
                              .map((review) => (
                                <div
                                  key={review.reviewId}
                                  className="border rounded-lg p-3"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < review.rating
                                              ? "fill-yellow-400 text-yellow-400"
                                              : "text-gray-300"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {new Date(
                                        review.reviewDate
                                      ).toLocaleDateString("vi-VN")}
                                    </span>
                                  </div>
                                  <p className="text-sm">{review.comment}</p>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* No reviews message */}
                        {bookingReviews.length === 0 && !myReview && (
                          <div className="text-center py-4 text-gray-500">
                            <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>Chưa có đánh giá nào cho chuyến bay này</p>
                            {isBookingEligibleForReview(selectedBooking) && (
                              <p className="text-sm mt-1">
                                Hãy là người đầu tiên đánh giá!
                              </p>
                            )}
                          </div>
                        )}

                        {/* Eligibility message */}
                        {!isBookingEligibleForReview(selectedBooking) &&
                          !myReview && (
                            <div className="text-center py-4 text-gray-500">
                              <p className="text-sm">
                                Bạn có thể đánh giá sau khi chuyến bay hoàn
                                thành và check-in thành công
                              </p>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  )}{" "}
                  {/* Action Buttons */}
                  {/* <div className="flex gap-3 pt-4">
                    {selectedBooking.status !== "CANCELLED" && (
                      <>
                        <Button variant="outline" className="flex-1">
                          In vé
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Gửi email
                        </Button>
                      </>
                    )}
                    {selectedBooking.status === "CANCELLED" && (
                      <Button className="w-full">Đặt lại chuyến bay</Button>
                    )}
                  </div> */}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Form Dialog */}
      <Dialog open={isReviewFormOpen} onOpenChange={setIsReviewFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đánh giá chuyến bay</DialogTitle>
            <DialogDescription>
              Chia sẻ trải nghiệm của bạn về chuyến bay này
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Rating */}
            <div>
              <Label className="text-sm font-medium">Đánh giá</Label>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setReviewFormData((prev) => ({ ...prev, rating: star }))
                    }
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= reviewFormData.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-400"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {reviewFormData.rating}/5
                </span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <Label htmlFor="review-comment" className="text-sm font-medium">
                Nhận xét
              </Label>
              <Textarea
                id="review-comment"
                placeholder="Chia sẻ trải nghiệm của bạn..."
                value={reviewFormData.comment}
                onChange={(e) =>
                  setReviewFormData((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                className="mt-2"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReviewFormOpen(false)}
              disabled={isSubmittingReview}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateReview}
              disabled={isSubmittingReview || !reviewFormData.comment.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyBookingsTab;
