import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Download,
  Eye,
  Trash2,
  MapPin,
  User,
  FileText,
  BarChart3,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { bookingFilters } from "@/utils/filter-configs";
import { toast } from "sonner";


// Import modal components
import BookingDetailsModal from "@/components/admin/bookings/booking-details-modal";
import BookingMetrics from "@/components/admin/bookings/booking-metrics";
import AdvancedSearch from "@/components/common/advanced-search";

// Import API
import { bookingApi } from "@/apis/booking-api";

// Vietnamese text constants
const TEXT = {
  pageTitle: "Quản Lý Đặt Vé",
  pageDescription: "Quản lý và theo dõi tất cả các đặt vé máy bay",
  allBookings: "Tất Cả Đặt Vé",
  cardDescription: "Xem và quản lý tất cả các đặt vé máy bay trong hệ thống",
  export: "Xuất File",
  exportCSV: "Xuất CSV",
  exportJSON: "Xuất JSON",
  exportSummary: "Xuất Báo Cáo",
  bookingRef: "Mã Đặt Vé",
  customer: "Khách Hàng",
  route: "Tuyến Bay",
  departure: "Khởi Hành",
  passengers: "Hành Khách",
  class: "Hạng Vé",
  status: "Trạng Thái",
  amount: "Số Tiền",
  actions: "Thao Tác",
  viewDetails: "Xem Chi Tiết",
  exportSuccess: "Xuất file thành công dưới định dạng",
  searchPlaceholder:
    "Tìm kiếm theo tên khách hàng, mã đặt vé, email hoặc tuyến bay...",
  statusConfirmed: "Đã Xác Nhận",
  statusPending: "Chờ Xử Lý",
  statusCancelled: "Đã Hủy",
  classEconomy: "Phổ Thông",
  classBusiness: "Thương Gia",
  classFirst: "Hạng Nhất",
  confirmBooking: "Xác Nhận Đặt Vé",
  cancelBooking: "Hủy Đặt Vé",
  statusUpdateSuccess: "Cập nhật trạng thái thành công",
  statusUpdateError: "Lỗi khi cập nhật trạng thái",
  confirmStatusChange: "Bạn có chắc chắn muốn",
  statusChangeTo: "trạng thái này?",
};

const BookingTableSkeleton = ({ rows = 10 }) => (
  <Table>
    <TableHeader>
      <TableRow>
        {Array.from({ length: 9 }).map((_, i) => (
          <TableHead key={i}>
            <Skeleton className="h-5 w-full" />
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 9 }).map((_, j) => (
            <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const AdminBookings = () => {
  // Consolidated state
  const [state, setState] = useState({
    bookings: [],
    loading: true,
    searchQuery: "",
    advancedFilters: {},
    currentPage: 1,
    itemsPerPage: 10,
    showDetailsModal: false,
    selectedBooking: null,
  }, []);

  // Status and class mapping
  const statusMap = {
    Confirmed: TEXT.statusConfirmed,
    Pending: TEXT.statusPending,
    Cancelled: TEXT.statusCancelled,
  };

  const classMap = {
    Economy: TEXT.classEconomy,
    Business: TEXT.classBusiness,
    First: TEXT.classFirst,
  };

  // Fetch bookings on component mount
  useEffect(() => {
    const fetchBookings = async () => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const response = await bookingApi.getAllBookings({
          page: state.currentPage - 1,
          size: state.itemsPerPage,
        });
        
        if (response.success) {
          const mappedBookings = response.data.content.map((booking) => ({
            id: booking.bookingId,
            bookingRef: `BK${booking.bookingId.toString().padStart(4, "0")}`,
            // customer: booking.contactName || "Unknow",
            contactName: booking.contactName || "N/A",
            contactEmail: booking.contactEmail || "N/A",
            // email: booking.contactEmail || "N/A",
            route: booking.flightNumber,
            departure: booking.bookingDate,
            passengers: booking.passengers.length,
            class: booking.travelClass,
            status:
              booking.status === "CONFIRMED"
                ? "Confirmed"
                : booking.status === "PENDING"
                ? "Pending"
                : "Cancelled",
            amount: `${booking.totalAmount.toLocaleString()} VNĐ`,
            bookingDate: booking.createdAt,
            passengersDetails: booking.passengers,
            payment: booking.payment,
            updatedAt: booking.updatedAt,
            cancellationReason: booking.cancellationReason,
            isRefundable: booking.travelClassDetails?.refundable || false,
            isChangeable: booking.travelClassDetails?.changeable || false,
          }));
          // Không cần sort ở client vì BE đã sắp xếp sẵn
          setState(prev => ({ ...prev, bookings: mappedBookings, loading: false }));
        } else {
          toast.error("Không thể tải danh sách đặt vé");
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Lỗi khi tải danh sách đặt vé");
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchBookings();
  }, [state.currentPage, state.itemsPerPage]);

  const getStatusBadge = (status) => {
    const variants = {
      Confirmed: "bg-green-100 text-green-800 border-green-200",
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getClassBadge = (flightClass) => {
    const variants = {
      Economy: "bg-blue-100 text-blue-800",
      Business: "bg-purple-100 text-purple-800",
      First: "bg-amber-100 text-amber-800",
    };
    return variants[flightClass] || "bg-gray-100 text-gray-800";
  };

  // Event handlers
  const handleViewBooking = (booking) => {
    setState((prev) => ({
      ...prev,
      selectedBooking: booking,
      showDetailsModal: true,
    }));
  };



  const handlePageChange = (page) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (newPageSize) => {
    setState((prev) => ({
      ...prev,
      itemsPerPage: newPageSize,
      currentPage: 1,
    }));
  };

  const handleAdvancedSearch = useCallback((query) => {
    setState((prev) => ({
      ...prev,
      searchQuery: query,
      currentPage: 1,
    }));
  }, []);

  const handleAdvancedFilterChange = useCallback((filters) => {
    setState((prev) => ({
      ...prev,
      advancedFilters: filters,
      currentPage: 1,
    }));
  }, []);

  // Filter and pagination logic
  const filteredBookings = useMemo(() => {
    return state.bookings.filter((booking) => {
      const searchFields = [
        booking.contactName,
        booking.bookingRef,
        booking.contactEmail,
        booking.route,
        booking.status,
        booking.class,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !state.searchQuery ||
        searchFields.includes(state.searchQuery.toLowerCase());

      const matchesAdvancedStatus =
        !state.advancedFilters.status ||
        state.advancedFilters.status === "all" ||
        booking.status.toLowerCase() ===
          state.advancedFilters.status.toLowerCase();

      const matchesClass =
        !state.advancedFilters.class ||
        state.advancedFilters.class === "all" ||
        booking.class.toLowerCase() ===
          state.advancedFilters.class.toLowerCase();

      const matchesPassengers =
        !state.advancedFilters.passengers ||
        state.advancedFilters.passengers === "all" ||
        (state.advancedFilters.passengers === "4+" &&
          booking.passengers >= 4) ||
        (state.advancedFilters.passengers !== "4+" &&
          booking.passengers === parseInt(state.advancedFilters.passengers));

      return (
        matchesSearch &&
        matchesAdvancedStatus &&
        matchesClass &&
        matchesPassengers
      );
    });
  }, [state.bookings, state.searchQuery, state.advancedFilters]);

  const totalPages = Math.ceil(filteredBookings.length / state.itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (state.currentPage - 1) * state.itemsPerPage,
    state.currentPage * state.itemsPerPage
  );
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{TEXT.pageTitle}</h1>
          <p className="text-gray-600">{TEXT.pageDescription}</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <BookingMetrics bookings={state.bookings} />

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>{TEXT.allBookings}</CardTitle>
          <CardDescription>{TEXT.cardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Advanced Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <AdvancedSearch
                onSearch={handleAdvancedSearch}
                onFilterChange={handleAdvancedFilterChange}
                placeholder={TEXT.searchPlaceholder}
                filterConfigs={bookingFilters}
                showFilters={true}
                className="w-full"
              />
            </div>

     
     
          </div>

          {/* Bookings Table */}
          <div className="border rounded-lg overflow-hidden">
            {state.loading ? <BookingTableSkeleton itemsPerPage={state.itemsPerPage} /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{TEXT.bookingRef}</TableHead>
                    <TableHead>{TEXT.customer}</TableHead>
                    <TableHead>{TEXT.route}</TableHead>
                    <TableHead>{TEXT.departure}</TableHead>
                    <TableHead>{TEXT.passengers}</TableHead>
                    <TableHead>{TEXT.class}</TableHead>
                    <TableHead>{TEXT.status}</TableHead>
                    <TableHead>{TEXT.amount}</TableHead>
                    <TableHead className="text-right">{TEXT.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.bookingRef}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.contactName}</div>
                          <div className="text-sm text-gray-500">
                            {booking.contactEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                          {booking.route}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {new Date(booking.departure).toLocaleDateString(
                              "vi-VN"
                            )}
                          </div>
                          <div className="text-gray-500">
                            {new Date(booking.departure).toLocaleTimeString(
                              "vi-VN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <User className="h-3 w-3 mr-1 text-gray-400" />
                          {booking.passengers}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getClassBadge(booking.class)}
                        >
                          {classMap[booking.class] || booking.class}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusBadge(booking.status)}
                        >
                          {statusMap[booking.status] || booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {booking.amount}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewBooking(booking)}
                            title={TEXT.viewDetails}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                         
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Enhanced Pagination - only show if not loading and there are bookings */}
          {!state.loading && filteredBookings.length > 0 && (
            <Pagination
              currentPage={state.currentPage}
              totalPages={totalPages}
              itemsPerPage={state.itemsPerPage}
              totalItems={filteredBookings.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              showPageSizeSelector={true}
              showFirstLast={true}
              showInfo={true}
              maxVisiblePages={5}
              className="mt-6"
            />
          )}
        </CardContent>
      </Card>

      <BookingDetailsModal
        open={state.showDetailsModal}
        onOpenChange={(open) =>
          setState((prev) => ({ ...prev, showDetailsModal: open }))
        }
        booking={state.selectedBooking}
      />
    </div>
  );
};

export default AdminBookings;
