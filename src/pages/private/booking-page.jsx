import React, { useState, useMemo, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Pagination from "@/components/ui/pagination";
import {
  exportBookings,
  exportBookingSummary,
  exportFormats,
} from "@/utils/export";
import { bookingFilters } from "@/utils/filter-configs";
import { toast } from "sonner";
import ExportButton from "@/components/common/export-button";

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
  deleteBooking: "Xóa Đặt Vé",
  confirmDelete: "Bạn có chắc chắn muốn xóa đặt vé",
  deleteSuccess: "Xóa đặt vé thành công",
  exportSuccess: "Xuất file thành công dưới định dạng",
  searchPlaceholder:
    "Tìm kiếm theo tên khách hàng, mã đặt vé, email hoặc tuyến bay...",
  statusConfirmed: "Đã Xác Nhận",
  statusPending: "Chờ Xử Lý",
  statusCancelled: "Đã Hủy",
  classEconomy: "Phổ Thông",
  classBusiness: "Thương Gia",
  classFirst: "Hạng Nhất",
  updateStatus: "Cập Nhật Trạng Thái",
  confirmBooking: "Xác Nhận Đặt Vé",
  cancelBooking: "Hủy Đặt Vé",
  statusUpdateSuccess: "Cập nhật trạng thái thành công",
  statusUpdateError: "Lỗi khi cập nhật trạng thái",
  confirmStatusChange: "Bạn có chắc chắn muốn",
  statusChangeTo: "trạng thái này?",
};

const AdminBookings = () => {
  // Consolidated state
  const [state, setState] = useState({
    searchQuery: "",
    statusFilter: "all",
    advancedFilters: {},
    currentPage: 1,
    itemsPerPage: 10,
    showDetailsModal: false,
    selectedBooking: null,
  });

  // Booking data and loading state
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch bookings on component mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await bookingApi.getAllBookings();
        if (response.success) {
          // Map API data to component format
          const mappedBookings = response.data.content.map((booking) => ({
            id: booking.bookingId,
            bookingRef: `BK${booking.bookingId.toString().padStart(4, "0")}`, // Generate booking ref
            customer: booking.userEmail
              ? booking.userEmail.split("@")[0]
              : "Unknown", // Use email prefix as customer name, fallback to "Unknown" if null
            email: booking.userEmail || "N/A", // Fallback to "N/A" if email is null
            route: booking.flightNumber, // Use flight number as route for now
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
            // Additional fields for modal
            passengersDetails: booking.passengers,
            payment: booking.payment,
            updatedAt: booking.updatedAt,
          }));
          setBookings(mappedBookings);
        } else {
          toast.error("Không thể tải danh sách đặt vé");
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Lỗi khi tải danh sách đặt vé");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
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

  const getAvailableStatusActions = (currentStatus) => {
    const actions = [];

    if (currentStatus === "Pending") {
      actions.push(
        {
          status: "Confirmed",
          label: TEXT.confirmBooking,
          icon: CheckCircle,
          color: "text-green-600",
        },
        {
          status: "Cancelled",
          label: TEXT.cancelBooking,
          icon: XCircle,
          color: "text-red-600",
        }
      );
    } else if (currentStatus === "Confirmed") {
      actions.push({
        status: "Cancelled",
        label: TEXT.cancelBooking,
        icon: XCircle,
        color: "text-red-600",
      });
    }
    // If Cancelled, no actions available

    return actions;
  };

  // Event handlers
  const handleViewBooking = (booking) => {
    setState((prev) => ({
      ...prev,
      selectedBooking: booking,
      showDetailsModal: true,
    }));
  };

  const handleDeleteBooking = (booking) => {
    if (window.confirm(`${TEXT.confirmDelete} ${booking.bookingRef}?`)) {
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
      toast.success(TEXT.deleteSuccess);
    }
  };

  const handleUpdateStatus = async (booking, newStatus) => {
    const statusText =
      newStatus === "Confirmed" ? TEXT.statusConfirmed : TEXT.statusCancelled;
    const actionText =
      newStatus === "Confirmed" ? TEXT.confirmBooking : TEXT.cancelBooking;

    if (
      window.confirm(
        `${TEXT.confirmStatusChange} ${actionText.toLowerCase()} ${
          TEXT.statusChangeTo
        }`
      )
    ) {
      try {
        const updateData = {
          status: newStatus.toUpperCase(), // API expects uppercase: CONFIRMED, CANCELLED
        };

        const response = await bookingApi.updateBooking(booking.id, updateData);

        if (response.success) {
          // Update local state
          setBookings((prev) =>
            prev.map((b) =>
              b.id === booking.id ? { ...b, status: newStatus } : b
            )
          );
          toast.success(TEXT.statusUpdateSuccess);
        } else {
          toast.error(TEXT.statusUpdateError);
        }
      } catch (error) {
        console.error("Error updating booking status:", error);
        toast.error(TEXT.statusUpdateError);
      }
    }
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

  const handleExport = (format) => {
    const filters = {
      status: state.statusFilter,
      searchQuery: state.searchQuery,
    };
    exportBookings(filteredBookings, format, filters);
    toast.success(`${TEXT.exportSuccess} ${format.toUpperCase()}`);
  };

  const handleAdvancedSearch = (query) => {
    setState((prev) => ({
      ...prev,
      searchQuery: query,
      currentPage: 1,
    }));
  };

  const handleAdvancedFilterChange = (filters) => {
    setState((prev) => ({
      ...prev,
      advancedFilters: filters,
      currentPage: 1,
    }));
  };

  // Filter and pagination logic
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const searchFields = [
        booking.customer,
        booking.bookingRef,
        booking.email,
        booking.route,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !state.searchQuery ||
        searchFields.includes(state.searchQuery.toLowerCase());

      const matchesStatus =
        state.statusFilter === "all" ||
        booking.status.toLowerCase() === state.statusFilter.toLowerCase();

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
        matchesStatus &&
        matchesAdvancedStatus &&
        matchesClass &&
        matchesPassengers
      );
    });
  }, [bookings, state.searchQuery, state.statusFilter, state.advancedFilters]);

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
      <BookingMetrics bookings={bookings} />

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

            {/* Export Button */}
            <ExportButton entity="bookings" />
          </div>

          {/* Bookings Table */}
          <div className="border rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">
                  Đang tải danh sách đặt vé...
                </p>
              </div>
            ) : (
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
                          <div className="font-medium">{booking.customer}</div>
                          <div className="text-sm text-gray-500">
                            {booking.email}
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

                          {/* Status Update Dropdown */}
                          {getAvailableStatusActions(booking.status).length >
                            0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title={TEXT.updateStatus}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {getAvailableStatusActions(booking.status).map(
                                  (action) => (
                                    <DropdownMenuItem
                                      key={action.status}
                                      onClick={() =>
                                        handleUpdateStatus(
                                          booking,
                                          action.status
                                        )
                                      }
                                      className={`cursor-pointer ${action.color}`}
                                    >
                                      <action.icon className="h-4 w-4 mr-2" />
                                      {action.label}
                                    </DropdownMenuItem>
                                  )
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteBooking(booking)}
                            title={TEXT.deleteBooking}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Enhanced Pagination */}
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
