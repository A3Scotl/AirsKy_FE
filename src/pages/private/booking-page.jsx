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
            <TableCell key={j}>
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const AdminBookings = () => {
  // Consolidated state
  const [state, setState] = useState(
    {
      bookings: [],
      allBookings: [], // Store all bookings for filtering
      loading: true,
      searchQuery: "",
      advancedFilters: {},
      currentPage: 1,
      itemsPerPage: 10, // 10 phần tử/trang cho pagination
      totalElements: 0, // Thêm totalElements từ API
      showAll: false, // Thêm state để hiển thị tất cả
      showDetailsModal: false,
      selectedBooking: null,
    },
    []
  );

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

  // Create a stable filter key for dependency tracking
  const filterKey = useMemo(() => {
    const key = Object.keys(state.advancedFilters)
      .sort()
      .map((key) => `${key}:${state.advancedFilters[key]}`)
      .join("|");

    return key;
  }, [state.advancedFilters]);

  // Fetch bookings on component mount and when filters/state changes
  useEffect(() => {
    const fetchBookings = async () => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        // Check if there are active advanced filters
        const hasActiveFilters = Object.keys(state.advancedFilters).some(
          (key) =>
            state.advancedFilters[key] &&
            state.advancedFilters[key] !== "all" &&
            state.advancedFilters[key] !== ""
        );

        let bookingsData;
        if (hasActiveFilters) {
          // Fetch all bookings by fetching multiple pages
          let allBookingsData = [];
          let page = 0;
          const pageSize = 50; // Smaller page size to avoid API limits
          let hasMore = true;
          let totalFetched = 0;

          try {
            while (hasMore && page < 10) {
              // Safety limit of 10 pages

              try {
                const response = await bookingApi.getAllBookings({
                  page: page,
                  size: pageSize,
                });

                if (response && response.success) {
                  const pageData = response.data.content || response.data || [];

                  allBookingsData = allBookingsData.concat(pageData);
                  totalFetched += pageData.length;
                  hasMore = pageData.length === pageSize;

                  page++;
                } else {

                  hasMore = false;
                }
              } catch (pageError) {
                console.error(`Error fetching page ${page}:`, pageError);
                hasMore = false;
              }
            }

            bookingsData = allBookingsData;
          } catch (error) {
            const pageSize = state.showAll ? 10000 : state.itemsPerPage;
            const pageNum = state.showAll ? 0 : state.currentPage - 1;

            const response = await bookingApi.getAllBookings({
              page: pageNum,
              size: pageSize,
            });

            if (response.success) {
              bookingsData = response.data.content;
            }
          }
        } else {
          // Normal pagination
          const pageSize = state.showAll ? 10000 : state.itemsPerPage;
          const page = state.showAll ? 0 : state.currentPage - 1;

          const response = await bookingApi.getAllBookings({
            page: page,
            size: pageSize,
          });

          if (response.success) {
            bookingsData = response.data.content;

            // Store totalElements temporarily - will be set properly after mapping
            bookingsData._totalElements =
              response.data.totalElements ||
              response.data.total ||
              bookingsData.length;
          }
        }

        if (bookingsData) {
          const mappedBookings = bookingsData.map((booking) => {
            // Debug log to check passenger data
            if (
              booking.passengers &&
              typeof booking.passengers !== "number" &&
              !Array.isArray(booking.passengers)
            ) {

            }

            return {
              id: booking.bookingId,
              bookingRef: `${booking.bookingId.toString().padStart(3, "")}`,
              // customer: booking.contactName || "Unknow",
              contactName: booking.contactName || "N/A",
              contactEmail: booking.contactEmail || "N/A",
              // email: booking.contactEmail || "N/A",
              route: booking.flightNumber,
              departure: booking.flightSegments?.[0]?.departureTime,
              passengers: Array.isArray(booking.passengers)
                ? booking.passengers.length
                : booking.passengers || 0,
              class: booking.travelClass,
              status:
                booking.status === "CONFIRMED" || booking.status === "COMPLETED"
                  ? "Confirmed"
                  : booking.status === "PENDING"
                  ? "Pending"
                  : booking.status === "CANCELLED"
                  ? "Cancelled"
                  : "Pending", // Default to Pending for unknown status
              amount: `${booking.totalAmount.toLocaleString()} VNĐ`,
              bookingDate: booking.createdAt || booking.bookingDate,
              passengersDetails: booking.passengers,
              payment: booking.payment,
              updatedAt: booking.updatedAt,
              cancellationReason: booking.cancellationReason,
              isRefundable: booking.travelClassDetails?.refundable || false,
              isChangeable: booking.travelClassDetails?.changeable || false,
            };
          });
          // Không cần sort ở client vì BE đã sắp xếp sẵn
          // Check if this is for filtering (has active filters)
          const hasActiveFilters = Object.keys(state.advancedFilters).some(
            (key) =>
              state.advancedFilters[key] &&
              state.advancedFilters[key] !== "all" &&
              state.advancedFilters[key] !== ""
          );

          if (hasActiveFilters) {
            // When filtering, set both allBookings and bookings
            setState((prev) => ({
              ...prev,
              allBookings: mappedBookings,
              bookings: [], // Clear regular bookings when filtering
              loading: false,
            }));
          } else {
            // Normal pagination - get totalElements from bookingsData if available
            const totalElements =
              bookingsData._totalElements || bookingsData.length;

            setState((prev) => ({
              ...prev,
              bookings: mappedBookings,
              allBookings: [], // Clear allBookings when not filtering
              loading: false,
              totalElements: totalElements,
            }));
          }
        } else {
          toast.error("Không thể tải danh sách đặt vé");
          setState((prev) => ({ ...prev, loading: false }));
        }
      } catch (error) {
        toast.error("Lỗi khi tải danh sách đặt vé");
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchBookings();
  }, [state.currentPage, state.itemsPerPage, state.showAll, filterKey]);

  // Toggle show all function
  const handleToggleShowAll = () => {
    setState((prev) => ({
      ...prev,
      showAll: !prev.showAll,
      currentPage: 1, // Reset về trang đầu khi toggle
    }));
  };

  const getStatusBadge = (status) => {
    const variants = {
      Confirmed: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return variants[status] || "bg-gray-100 text-gray-800";
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

  // Filter logic - use all bookings when filters are active, otherwise use current page
  const filteredBookings = useMemo(() => {
    const hasActiveFilters = Object.keys(state.advancedFilters).some(
      (key) =>
        state.advancedFilters[key] &&
        state.advancedFilters[key] !== "all" &&
        state.advancedFilters[key] !== ""
    );

    const bookingsToFilter = hasActiveFilters
      ? state.allBookings
      : state.bookings;

    return bookingsToFilter.filter((booking) => {
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

      const matchesBookingDate = (() => {
        if (!state.advancedFilters.bookingDate) return true;

        // Convert booking date to local date string in yyyy-MM-dd format
        const bookingDate = new Date(booking.bookingDate);
        const bookingDateString =
          bookingDate.getFullYear() +
          "-" +
          String(bookingDate.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(bookingDate.getDate()).padStart(2, "0");

        return bookingDateString === state.advancedFilters.bookingDate;
      })();

      return (
        matchesSearch &&
        matchesAdvancedStatus &&
        matchesClass &&
        matchesPassengers &&
        matchesBookingDate
      );
    });
  }, [
    state.bookings,
    state.allBookings,
    state.searchQuery,
    state.advancedFilters,
  ]);

  // Check if filters are active
  const hasActiveFilters = Object.keys(state.advancedFilters).some(
    (key) =>
      state.advancedFilters[key] &&
      state.advancedFilters[key] !== "all" &&
      state.advancedFilters[key] !== ""
  );

  // Use server-side pagination info when no filters, otherwise show all filtered results
  const totalPages = hasActiveFilters
    ? 1
    : state.showAll
    ? 1
    : Math.ceil(state.totalElements / state.itemsPerPage);
  const paginatedBookings = filteredBookings; // Current page data is already filtered from API
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between flex-wrap gap-3 items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {TEXT.pageTitle}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {TEXT.pageDescription}
          </p>
        </div>
        {/* <div className="flex gap-2">
          <Button
            variant={state.showAll ? "default" : "outline"}
            onClick={handleToggleShowAll}
            className="dark:border-gray-600 dark:hover:bg-gray-700"
          >
            {state.showAll ? "Hiển thị phân trang" : "Hiển thị tất cả"}
          </Button>
        </div> */}
      </div>

      {/* Metrics Cards */}
      <BookingMetrics isLoading={state.loading} />

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
                className="w-full dark:text-black"
              />
            </div>
          </div>

          {/* Bookings Table */}
          <div className="border rounded-lg overflow-hidden">
            {state.loading ? (
              <BookingTableSkeleton itemsPerPage={state.itemsPerPage} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{TEXT.bookingRef}</TableHead>
                    <TableHead>{TEXT.customer}</TableHead>
                    <TableHead>{TEXT.route}</TableHead>
                    <TableHead>{TEXT.departure}</TableHead>
                    <TableHead>Ngày Đặt Vé</TableHead>
                    <TableHead>{TEXT.passengers}</TableHead>
                    <TableHead>{TEXT.class}</TableHead>
                    <TableHead>{TEXT.status}</TableHead>
                    <TableHead>{TEXT.amount}</TableHead>
                    <TableHead className="text-right">{TEXT.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.map((booking, index) => (
                    <TableRow key={`${booking.id}-${index}`}>
                      <TableCell className="font-medium">
                        {booking.bookingRef}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {booking.contactName}
                          </div>
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
                        <div className="text-sm">
                          <div>
                            {new Date(booking.bookingDate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </div>
                          <div className="text-gray-500">
                            {new Date(booking.bookingDate).toLocaleTimeString(
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

          {/* Enhanced Pagination - only show if not loading, not showing all, no active filters, and there are bookings */}
          {!state.loading &&
            !state.showAll &&
            !hasActiveFilters &&
            state.totalElements > 0 && (
              <Pagination
                currentPage={state.currentPage}
                totalPages={totalPages}
                itemsPerPage={state.itemsPerPage}
                totalItems={state.totalElements}
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
