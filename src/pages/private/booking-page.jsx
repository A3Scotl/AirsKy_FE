import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  MapPin,
  User,
  FileText,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const AdminBookings = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Mock booking data
  const [bookings, setBookings] = useState([
    {
      id: "BK001",
      bookingRef: "AS24001",
      customer: "John Smith",
      email: "john.smith@email.com",
      route: "New York (NYC) → Los Angeles (LAX)",
      departure: "2024-01-20 08:30",
      arrival: "2024-01-20 11:45",
      passengers: 2,
      class: "Economy",
      status: "Confirmed",
      amount: "$450.00",
      bookingDate: "2024-01-15 14:30",
    },
    {
      id: "BK002",
      bookingRef: "AS24002",
      customer: "Sarah Johnson",
      email: "sarah.j@email.com",
      route: "Chicago (CHI) → Miami (MIA)",
      departure: "2024-01-22 15:20",
      arrival: "2024-01-22 19:35",
      passengers: 1,
      class: "Business",
      status: "Pending",
      amount: "$780.00",
      bookingDate: "2024-01-16 09:15",
    },
    {
      id: "BK003",
      bookingRef: "AS24003",
      customer: "Mike Davis",
      email: "mike.davis@email.com",
      route: "Seattle (SEA) → Boston (BOS)",
      departure: "2024-01-25 12:00",
      arrival: "2024-01-25 20:15",
      passengers: 3,
      class: "Economy",
      status: "Cancelled",
      amount: "$920.00",
      bookingDate: "2024-01-14 16:45",
    },
    {
      id: "BK004",
      bookingRef: "AS24004",
      customer: "Emma Wilson",
      email: "emma.wilson@email.com",
      route: "Los Angeles (LAX) → New York (NYC)",
      departure: "2024-01-28 10:15",
      arrival: "2024-01-28 18:30",
      passengers: 1,
      class: "First",
      status: "Confirmed",
      amount: "$1,250.00",
      bookingDate: "2024-01-17 11:20",
    },
    {
      id: "BK005",
      bookingRef: "AS24005",
      customer: "Alex Brown",
      email: "alex.brown@email.com",
      route: "Denver (DEN) → Atlanta (ATL)",
      departure: "2024-01-30 07:45",
      arrival: "2024-01-30 12:50",
      passengers: 2,
      class: "Economy",
      status: "Confirmed",
      amount: "$580.00",
      bookingDate: "2024-01-18 13:10",
    },
  ]);

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

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleDeleteBooking = (booking) => {
    if (
      window.confirm(
        `Are you sure you want to delete booking ${booking.bookingRef}?`
      )
    ) {
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
      toast.success("Booking deleted successfully");
    }
  };

  const handleSaveBooking = (bookingData, isEdit) => {
    if (isEdit) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingData.id ? bookingData : b))
      );
    } else {
      setBookings((prev) => [...prev, bookingData]);
    }
  };

  // Enhanced pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Export handlers
  const handleExport = (format) => {
    const filters = {
      status: statusFilter,
      searchQuery: searchQuery,
    };

    exportBookings(filteredBookings, format, filters);
    toast.success(`Bookings exported as ${format.toUpperCase()}`);
  };

  const handleExportSummary = () => {
    exportBookingSummary(filteredBookings);
    toast.success("Booking summary exported");
  };

  // Advanced search handlers
  const handleAdvancedSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleAdvancedFilterChange = (filters) => {
    setAdvancedFilters(filters);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Filter and pagination logic
  const filteredBookings = bookings.filter((booking) => {
    // Basic search filter
    const matchesSearch =
      !searchQuery ||
      booking.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.route.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter (legacy support)
    const matchesStatus =
      statusFilter === "all" ||
      booking.status.toLowerCase() === statusFilter.toLowerCase();

    // Advanced filters
    const matchesAdvancedStatus =
      !advancedFilters.status ||
      advancedFilters.status === "all" ||
      booking.status.toLowerCase() === advancedFilters.status.toLowerCase();

    const matchesClass =
      !advancedFilters.class ||
      advancedFilters.class === "all" ||
      booking.class.toLowerCase() === advancedFilters.class.toLowerCase();

    const matchesPassengers =
      !advancedFilters.passengers ||
      advancedFilters.passengers === "all" ||
      (advancedFilters.passengers === "4+" && booking.passengers >= 4) ||
      (advancedFilters.passengers !== "4+" &&
        booking.passengers === parseInt(advancedFilters.passengers));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesAdvancedStatus &&
      matchesClass &&
      matchesPassengers
    );
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Booking Management
          </h1>
          <p className="text-gray-600">Manage and track all flight bookings</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <BookingMetrics bookings={bookings} />

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>
            View and manage all flight bookings in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Advanced Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <AdvancedSearch
                onSearch={handleAdvancedSearch}
                onFilterChange={handleAdvancedFilterChange}
                placeholder="Search by customer name, booking reference, email, or route..."
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
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleExport(exportFormats.CSV)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExport(exportFormats.JSON)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportSummary}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Export Summary
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bookings Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking Ref</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Passengers</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                          {new Date(booking.departure).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500">
                          {new Date(booking.departure).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
                        {booking.class}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusBadge(booking.status)}
                      >
                        {booking.status}
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
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteBooking(booking)}
                          title="Delete Booking"
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
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
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
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        booking={selectedBooking}
      />
    </div>
  );
};

export default AdminBookings;
