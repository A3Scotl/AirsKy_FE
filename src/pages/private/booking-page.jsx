import React, { useState, useMemo } from "react";
import {
  Download,
  Eye,
  Trash2,
  MapPin,
  User,
  FileText,
  BarChart3,
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

// Import modal components
import BookingDetailsModal from "@/components/admin/bookings/booking-details-modal";
import BookingMetrics from "@/components/admin/bookings/booking-metrics";
import AdvancedSearch from "@/components/common/advanced-search";

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

  // Mock booking data with Vietnamese content
  const [bookings, setBookings] = useState([
    {
      id: "BK001",
      bookingRef: "AS24001",
      customer: "Nguyễn Văn Minh",
      email: "nguyen.van.minh@email.com",
      route: "Hà Nội (HAN) → Hồ Chí Minh (SGN)",
      departure: "2024-01-20 08:30",
      arrival: "2024-01-20 11:45",
      passengers: 2,
      class: "Economy",
      status: "Confirmed",
      amount: "2.500.000 VNĐ",
      bookingDate: "2024-01-15 14:30",
    },
    {
      id: "BK002",
      bookingRef: "AS24002",
      customer: "Trần Thị Lan",
      email: "tran.thi.lan@email.com",
      route: "Đà Nẵng (DAD) → Hà Nội (HAN)",
      departure: "2024-01-22 15:20",
      arrival: "2024-01-22 19:35",
      passengers: 1,
      class: "Business",
      status: "Pending",
      amount: "4.200.000 VNĐ",
      bookingDate: "2024-01-16 09:15",
    },
    {
      id: "BK003",
      bookingRef: "AS24003",
      customer: "Phạm Minh Tuấn",
      email: "pham.minh.tuan@email.com",
      route: "Cần Thơ (VCA) → Hà Nội (HAN)",
      departure: "2024-01-25 12:00",
      arrival: "2024-01-25 20:15",
      passengers: 3,
      class: "Economy",
      status: "Cancelled",
      amount: "3.600.000 VNĐ",
      bookingDate: "2024-01-14 16:45",
    },
    {
      id: "BK004",
      bookingRef: "AS24004",
      customer: "Lê Thị Hương",
      email: "le.thi.huong@email.com",
      route: "Hồ Chí Minh (SGN) → Hà Nội (HAN)",
      departure: "2024-01-28 10:15",
      arrival: "2024-01-28 18:30",
      passengers: 1,
      class: "First",
      status: "Confirmed",
      amount: "6.800.000 VNĐ",
      bookingDate: "2024-01-17 11:20",
    },
    {
      id: "BK005",
      bookingRef: "AS24005",
      customer: "Hoàng Văn Đức",
      email: "hoang.van.duc@email.com",
      route: "Nha Trang (CXR) → Hồ Chí Minh (SGN)",
      departure: "2024-01-30 07:45",
      arrival: "2024-01-30 12:50",
      passengers: 2,
      class: "Economy",
      status: "Confirmed",
      amount: "1.800.000 VNĐ",
      bookingDate: "2024-01-18 13:10",
    },
  ]);

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap">
                  <Download className="h-4 w-4 mr-2" />
                  {TEXT.export}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleExport(exportFormats.CSV)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {TEXT.exportCSV}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExport(exportFormats.JSON)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {TEXT.exportJSON}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    exportBookingSummary(filteredBookings);
                    toast.success("Xuất báo cáo tổng hợp thành công");
                  }}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {TEXT.exportSummary}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bookings Table */}
          <div className="border rounded-lg overflow-hidden">
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
