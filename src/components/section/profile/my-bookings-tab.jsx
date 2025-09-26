import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { userApi } from "@/apis/user-api";
import { bookingApi } from "@/apis/booking-api";
import { useAuth } from "@/contexts/auth-context";

const MyBookingsTab = () => {
  const { user } = useAuth();
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
  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
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
                  <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                  <SelectItem value="PENDING">Đang chờ</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
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
                      {(booking.status === "PENDING" ||
                        booking.status === "CONFIRMED") && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelBooking(booking)}
                        >
                          Hủy
                        </Button>
                      )}
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
                      <div className="flex items-center justify-between">
                        <span className="text-lg">Tổng tiền</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {selectedBooking.formattedPrice}
                        </span>
                      </div>
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

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
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
                    {(selectedBooking.status === "CONFIRMED" ||
                      selectedBooking.status === "PENDING") && (
                      <Button variant="destructive" className="flex-1">
                        Hủy đặt chỗ
                      </Button>
                    )}
                    {selectedBooking.status === "Cancelled" && (
                      <Button className="w-full">Đặt lại chuyến bay</Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyBookingsTab;
