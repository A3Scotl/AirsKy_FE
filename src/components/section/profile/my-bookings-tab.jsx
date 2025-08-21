import React, { useState } from "react";
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
import { ChevronLeft, ChevronRight } from "lucide-react";

const MyBookingsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const bookings = [
    {
      id: "BK001",
      flight: "VN7210",
      from: "Ho Chi Minh City (SGN)",
      to: "Hanoi (HAN)",
      date: "2025-08-15",
      displayDate: "August 15, 2025",
      status: "Confirmed",
      price: 60,
    },
    {
      id: "BK002",
      flight: "VN1234",
      from: "Hanoi (HAN)",
      to: "Da Nang (DAD)",
      date: "2025-09-10",
      displayDate: "September 10, 2025",
      status: "Pending",
      price: 80,
    },
    {
      id: "BK003",
      flight: "VN5678",
      from: "Ho Chi Minh City (SGN)",
      to: "Phu Quoc (PQC)",
      date: "2025-10-05",
      displayDate: "October 5, 2025",
      status: "Cancelled",
      price: 50,
    },
    {
      id: "BK004",
      flight: "VN9012",
      from: "Da Nang (DAD)",
      to: "Ho Chi Minh City (SGN)",
      date: "2025-11-20",
      displayDate: "November 20, 2025",
      status: "Confirmed",
      price: 70,
    },
    {
      id: "BK005",
      flight: "VN2468",
      from: "Hanoi (HAN)",
      to: "Ho Chi Minh City (SGN)",
      date: "2025-12-15",
      displayDate: "December 15, 2025",
      status: "Confirmed",
      price: 85,
    },
    {
      id: "BK006",
      flight: "VN1357",
      from: "Da Nang (DAD)",
      to: "Phu Quoc (PQC)",
      date: "2025-07-22",
      displayDate: "July 22, 2025",
      status: "Pending",
      price: 65,
    },
    {
      id: "BK007",
      flight: "VN8642",
      from: "Ho Chi Minh City (SGN)",
      to: "Nha Trang (CXR)",
      date: "2025-06-30",
      displayDate: "June 30, 2025",
      status: "Confirmed",
      price: 45,
    },
    {
      id: "BK008",
      flight: "VN9753",
      from: "Hanoi (HAN)",
      to: "Phu Quoc (PQC)",
      date: "2025-05-18",
      displayDate: "May 18, 2025",
      status: "Cancelled",
      price: 75,
    },
  ];

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
    <Card>
      <CardHeader>
        <CardTitle>Đặt chỗ của tôi</CardTitle>
        <CardDescription>
          Xem và quản lý các đặt chỗ chuyến bay của bạn
        </CardDescription>
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

        {/* Bookings Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Đặt Chỗ</TableHead>
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
                      booking.status === "Confirmed"
                        ? "success"
                        : booking.status === "Pending"
                        ? "warning"
                        : "destructive"
                    }
                  >
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell>${booking.price}</TableCell>
                <TableCell className="flex">
                  <Button variant="outline" size="sm" className="mr-2">
                    Xem
                  </Button>
                  {booking.status !== "Cancelled" && (
                    <Button variant="destructive" size="sm">
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
  );
};

export default MyBookingsTab;
