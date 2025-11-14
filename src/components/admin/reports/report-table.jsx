import React, { useState, useMemo, useEffect, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Pagination from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Filter,
  Download,
  Eye,
  ArrowUpDown,
  Info,
  Calendar,
  DollarSign,
  Users,
  Plane,
  TrendingUp,
  MapPin,
} from "lucide-react";
import {
  formatCurrencyVND,
  formatDateVN,
  formatDateTimeVN,
} from "@/utils/currency-utils";
import { format } from "date-fns";
import {
  BOOKING_STATUS_NAMES,
  SEAT_CLASS_NAMES,
  PAYMENT_METHOD_NAMES,
} from "@/utils/flight-booking-utils";
import { bookingApi } from "@/apis/booking-api";
import { userApi } from "@/apis/user-api";
import { flightApi } from "@/apis/flight-api";
import { airlineApi } from "@/apis/airline-api";
import { airportApi } from "@/apis/airport-api";
import OverviewExportButton from "./overview-export-button";
import ReportExportButton from "./report-export-button";

// Helper functions moved outside component for better performance
const getBookingStatusName = (status) => {
  if (typeof status === "string") {
    switch (status.toUpperCase()) {
      case "CONFIRMED":
        return "Đã xác nhận";
      case "PENDING":
        return "Đang chờ";
      case "CANCELLED":
        return "Đã hủy";
      case "COMPLETED":
        return "Hoàn thành";
      default:
        return status;
    }
  } else {
    // Fallback for numeric status
    switch (status) {
      case 0:
        return "Đang chờ";
      case 1:
        return "Đã xác nhận";
      case 2:
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  }
};

const getRoleName = (role) => {
  switch (role) {
    case "ADMIN":
      return "Quản trị viên";
    case "BUSINESS":
      return "Doanh nghiệp";
    case "CUSTOMER":
      return "Khách hàng";
    case "FLIGHT_MANAGER":
      return "Quản lý chuyến bay";
    case "STAFF":
      return "Nhân viên";
    default:
      return role || "Khách hàng";
  }
};

const getLoyaltyTierName = (tier) => {
  switch (tier) {
    case "GOLD":
      return "Vàng";
    case "PLATINUM":
      return "Bạch kim";
    case "SILVER":
      return "Bạc";
    case "STANDARD":
      return "Tiêu chuẩn";
    default:
      return tier || "Tiêu chuẩn";
  }
};

const getAuthProviderName = (provider) => {
  switch (provider) {
    case "FACEBOOK":
      return "Facebook";
    case "GOOGLE":
      return "Google";
    case "LOCAL":
      return "Địa phương";
    default:
      return provider || "Địa phương";
  }
};

// Helper function to preserve Unicode characters in table display
const preserveUnicode = (text) => {
  if (typeof text !== "string") return text;
  return text;
};

const getFlightStatusName = (status) => {
  switch (status) {
    case "CANCELLED":
      return "Đã hủy";
    case "DELAYED":
      return "Trễ";
    case "DEPARTED":
      return "Đã khởi hành";
    case "ON_TIME":
      return "Đúng giờ";
    default:
      return status || "Đã lên lịch";
  }
};

const getTripTypeName = (type) => {
  switch (type) {
    case "MULTI_CITY":
      return "Đa thành phố";
    case "ONE_WAY":
      return "Một chiều";
    case "ROUND_TRIP":
      return "Khứ hồi";
    default:
      return type || "Một chiều";
  }
};

const getFlightTypeName = (type) => {
  switch (type) {
    case "DOMESTIC":
      return "Nội địa";
    case "INTERNATIONAL":
      return "Quốc tế";
    default:
      return type || "Nội địa";
  }
};

// Helper function to get data key - moved here to be accessible
const getDataKey = (header, type) => {
  const keyMappings = {
    overview: {
      Ngày: "date",
      "Tổng Doanh Thu": "revenue",
      "Tổng Đặt Vé": "bookings",
      "Tổng Khách Hàng": "customers",
      "Tổng Chuyến Bay": "flights",
      "TB/Đặt Vé": "avgRevenuePerBooking",
      "Tỷ Lệ Thành Công": "successRate",
    },
    revenue: {
      Ngày: "date",
      "Doanh Thu": "revenue",
      "Số Đặt Vé": "bookings",
      // "Khách Hàng Mới": "newCustomers",
      "TB Doanh Thu/Vé": "avgRevenuePerBooking",
      "Tỷ Lệ Xác Nhận": "confirmationRate",
    },
    bookings: {
      "Mã Đặt Vé": "bookingCode",
      "Khách Hàng": "customerName",
      "Tuyến Bay": "route",
      "Ngày Đặt": "bookingDate",
      "Số Hành Khách": "passengerCount",
      "Tổng Tiền": "totalAmount",
      "Phương Thức": "paymentMethod",
      "Trạng Thái": "status",
    },
    customers: {
      "Khách Hàng": "fullName",
      Email: "email",
      "Số Điện Thoại": "phone",
      "Vai Trò": "role",
      "Xác Minh": "verified",
      "Hạng Thành Viên": "loyaltyTier",
      "Điểm Thưởng": "loyaltyPoints",
      "Ngày Tham Gia": "joinDate",
      "Trạng Thái": "status",
    },
    flights: {
      "Mã Chuyến Bay": "flightNumber",
      "Hãng Hàng Không": "airlineName",
      "Tuyến Bay": "route",
      "Khởi Hành": "departureTime",
      Đến: "arrivalTime",
      "Thời Lượng": "duration",
      "Loại Chuyến": "flightType",
      "Ghế Đặt/Tổng": "seatOccupancy",
      "Tỷ Lệ Lấp Đầy": "occupancyRate",
      "Doanh Thu": "revenue",
      "Trạng Thái": "status",
    },
    airlines: {
      "Tên Hãng": "airlineName",
      "Mã Hãng": "airlineCode",
      "Số Lượng Máy Bay": "fleetSize",
      "Số Lượng Chuyến Bay": "totalFlights",
      "Doanh Thu": "revenue",
      "Trạng Thái": "status",
    },
    airports: {
      "Tên Sân Bay": "airportName",
      "Mã Sân Bay": "airportCode",
      "Thành Phố": "city",
      "Quốc Gia": "country",
      "Nhà Ga": "terminals",
      "Trạng Thái": "status",
    },
  };
  return (
    keyMappings[type]?.[header] || header.toLowerCase().replace(/\s+/g, "")
  );
};

// Memoized table row component for better performance
const TableRowItem = memo(({ row, headers, type, onRowClick }) => {
  return (
    <TableRow key={row.id} className="hover:bg-muted/50">
      {headers.map((header) => {
        const key = getDataKey(header, type);
        let value = row[key];

        // Debug log for date field
        if (header === "Ngày" && (type === "overview" || type === "revenue")) {

        }

        // Format dữ liệu theo từng loại
        if (
          key.includes("Amount") ||
          key.includes("amount") ||
          key.includes("revenue") ||
          key.includes("cost") ||
          key.includes("profit") ||
          key.includes("price") ||
          key.includes("totalSpent") ||
          key === "totalAmount" ||
          key === "revenue" ||
          key === "cost" ||
          key === "profit" ||
          key === "avgRevenuePerBooking"
        ) {
          value = formatCurrencyVND(value || 0);
        } else if (
          key === "date" &&
          (type === "overview" || type === "revenue")
        ) {
          // Ngày ở overview và revenue đã được format sẵn, không cần format lại
          value = value || "Chưa có dữ liệu";
        } else if (
          key.includes("Date") ||
          key.includes("date") ||
          key === "createdAt" ||
          key === "bookingDate" ||
          key === "joinDate"
        ) {
          // Chỉ format các trường ngày khác chưa được format
          value = value ? formatDateVN(value) : "Chưa có dữ liệu";
        } else if (key === "status" && type === "bookings") {
          value = getBookingStatusName(value);
        } else if (
          key === "role" &&
          (type === "customers" || type === "users")
        ) {
          value = getRoleName(value);
        }

        return (
          <TableCell key={header} className="font-medium">
            {key === "customerName" || key === "name" ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback>
                    {(value || "N/A").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {preserveUnicode(value) || "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {row.customerEmail || row.email || ""}
                  </div>
                </div>
              </div>
            ) : key === "status" ? (
              <Badge
                variant={
                  value === "Đã xác nhận" || value === "Hoàn thành"
                    ? "default"
                    : value === "Đang chờ"
                    ? "secondary"
                    : "destructive"
                }
              >
                {preserveUnicode(value) || "N/A"}
              </Badge>
            ) : (
              preserveUnicode(value) || "N/A"
            )}
          </TableCell>
        );
      })}
      <TableCell>
        <Button variant="ghost" size="sm" onClick={() => onRowClick(row)}>
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

// (getDataKey is defined later with type-aware mappings)

const ReportTable = ({
  type,
  dateRange,
  realData,
  isLoading: externalLoading,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset to page 1 when changing type or items per page
  useEffect(() => {
    setCurrentPage(1);
  }, [type, itemsPerPage]);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use external loading state when provided (for synchronized loading with charts)
  const actualIsLoading =
    externalLoading !== undefined ? externalLoading : isLoading;
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [userBookingsCount, setUserBookingsCount] = useState(new Map());

  useEffect(() => {
    // Use realData from parent if available, otherwise fetch from API
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // If realData is provided, use it (for overview/revenue/aggregate views)
        if (realData) {
          // Filter data based on dateRange if provided
          let filteredData = realData;
          if (dateRange?.from && dateRange?.to) {
            const fromDate = new Date(dateRange.from);
            const toDate = new Date(dateRange.to);

            if (type === "overview" || type === "revenue") {
              // Filter bookings by date
              filteredData = {
                ...realData,
                bookings: (realData.bookings || []).filter((booking) => {
                  const bookingDate = new Date(
                    booking.createdAt || booking.bookingDate
                  );
                  return bookingDate >= fromDate && bookingDate <= toDate;
                }),
              };
            } else {
              // Filter other types by appropriate date field
              const dateField =
                type === "customers"
                  ? "createdAt"
                  : type === "flights"
                  ? "departureTime"
                  : "createdAt";
              const dataArray =
                realData[type === "customers" ? "users" : type] || [];
              filteredData = {
                ...realData,
                [type === "customers" ? "users" : type]: dataArray.filter(
                  (item) => {
                    const itemDate = new Date(item[dateField]);
                    return itemDate >= fromDate && itemDate <= toDate;
                  }
                ),
              };
            }
          }

          setData(filteredData);
          // Set totalItems based on the filtered data type
          const totalCount =
            type === "overview" || type === "revenue"
              ? filteredData.bookings?.length || 0
              : filteredData[type === "customers" ? "users" : type]?.length ||
                0;
          setTotalItems(totalCount);
          setIsLoading(false);
          return;
        }

        // Server-side pagination for individual table types
        const serverPagedTypes = [
          "bookings",
          "customers",
          "users",
          "flights",
          "airlines",
          "airports",
        ];

        if (serverPagedTypes.includes(type)) {
          const pageParam = Math.max(0, currentPage - 1);
          const sizeParam = itemsPerPage;
          let result;

          // Prepare date parameters if dateRange is provided
          const dateParams = {};
          if (dateRange?.from && dateRange?.to) {
            dateParams.fromDate = dateRange.from.toISOString().split("T")[0];
            dateParams.toDate = dateRange.to.toISOString().split("T")[0];
          }

          switch (type) {
            case "bookings":
              result = await bookingApi.getAllBookings({
                page: pageParam,
                size: sizeParam,
                sort: "createdAt,desc",
                ...dateParams,
              });
              break;
            case "customers":
            case "users":
              result = await userApi.getAllUsers({
                page: pageParam,
                size: sizeParam,
                sort: "createdAt,desc",
                ...dateParams,
              });
              break;
            case "flights":
              result = await flightApi.getAllFlights({
                page: pageParam,
                size: sizeParam,
                sort: "departureTime,desc",
                ...dateParams,
              });
              break;
            case "airlines":
              result = await airlineApi.getAllAirlines({
                page: pageParam,
                size: sizeParam,
                ...dateParams,
              });
              break;
            case "airports":
              result = await airportApi.getAllAirports({
                page: pageParam,
                size: sizeParam,
                ...dateParams,
              });
              break;
            default:
              result = await bookingApi.getAllBookings({
                page: pageParam,
                size: sizeParam,
                ...dateParams,
              });
          }

          if (result.success) {
            const respData = result.data || {};
            const content =
              respData.content || (Array.isArray(respData) ? respData : []);

            setData(content);
            const total =
              respData.totalElements ||
              respData.totalItems ||
              respData.total ||
              content.length;
            setTotalItems(Number(total) || content.length);
          } else {
            setError("Không thể tải dữ liệu");
            setData([]);
            setTotalItems(0);
          }
        }
      } catch (e) {
        setError(e.message || "Lỗi khi tải dữ liệu");
        setData([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [type, currentPage, itemsPerPage, realData, dateRange]);

  // Fetch bookings count for users when data is loaded
  useEffect(() => {
    const fetchUserBookingsCount = async () => {
      if (
        (type === "customers" || type === "users") &&
        Array.isArray(data) &&
        data.length > 0
      ) {
        const bookingsCountMap = new Map();

        // Fetch bookings count for each user
        await Promise.all(
          data.map(async (user) => {
            try {
              const result = await userApi.getBookingsByUserId(user.id);
              if (result.success) {
                const bookings = result.data || [];
                bookingsCountMap.set(user.id, bookings.length);
              } else {
                bookingsCountMap.set(user.id, 0);
              }
            } catch (error) {
              console.error(
                `Error fetching bookings for user ${user.id}:`,
                error
              );
              bookingsCountMap.set(user.id, 0);
            }
          })
        );

        setUserBookingsCount(bookingsCountMap);
      }
    };

    fetchUserBookingsCount();
  }, [data, type]);

  // Xử lý dữ liệu dựa trên loại báo cáo
  const processData = useCallback(() => {
    if (!data || (Array.isArray(data) && data.length === 0)) return [];

    switch (type) {
      case "bookings":
        return (Array.isArray(data) ? data : data.bookings || []).map(
          (booking) => {
            // Tìm ngày đặt vé với nhiều fallback - GIỮ NGUYÊN RAW VALUE
            const bookingDateValue =
              booking.bookingDate ||
              booking.booking_date ||
              booking.createdAt ||
              booking.created_at ||
              booking.orderDate ||
              booking.order_date;

            // Tìm ngày chuyến bay - GIỮ NGUYÊN RAW VALUE
            const flightDateValue =
              booking.flightSegments?.length > 0 &&
              booking.flightSegments[0].departureTime
                ? booking.flightSegments[0].departureTime
                : booking.departureTime ||
                  booking.departure_time ||
                  booking.flightDate ||
                  booking.flight_date;

            return {
              id: booking.bookingId || booking.booking_id || booking.id,
              bookingCode:
                booking.bookingCode ||
                booking.booking_code ||
                `BK${booking.bookingId || booking.id}`,
              customerName:
                booking.contactName ||
                booking.contact_name ||
                booking.customerName ||
                booking.customer_name ||
                booking.userEmail ||
                booking.user_email ||
                "N/A",
              customerEmail:
                booking.contactEmail ||
                booking.contact_email ||
                booking.userEmail ||
                booking.user_email ||
                booking.customerEmail ||
                booking.customer_email ||
                "N/A",
              flightNumber:
                booking.flightNumber ||
                booking.flight_number ||
                booking.flight?.flightNumber ||
                "N/A",
              route:
                booking.flightSegments?.length > 0
                  ? `${
                      booking.flightSegments[0].departureAirport?.airportCode ||
                      booking.flightSegments[0].departure_airport_code
                    } - ${
                      booking.flightSegments[0].arrivalAirport?.airportCode ||
                      booking.flightSegments[0].arrival_airport_code
                    }`
                  : booking.route ||
                    `${booking.departureAirportCode || "N/A"} - ${
                      booking.arrivalAirportCode || "N/A"
                    }`,
              bookingDate: bookingDateValue, // Giữ raw value để format sau
              flightDate: flightDateValue, // Giữ raw value để format sau
              status: getBookingStatusName(booking.status),
              totalAmount:
                booking.totalAmount ||
                booking.total_amount ||
                booking.totalPrice ||
                booking.total_price ||
                booking.amount ||
                0,
              travelClass:
                booking.travelClass ||
                booking.travel_class ||
                booking.seatClass ||
                booking.seat_class ||
                "N/A",
              passengerCount:
                booking.passengers?.length ||
                booking.passengerCount ||
                booking.passenger_count ||
                1,
              paymentMethod:
                booking.payment?.paymentMethod ||
                booking.paymentMethod ||
                booking.payment_method ||
                "N/A",
              tripType:
                booking.flightSegments?.length > 1 ? "Khứ hồi" : "Một chiều",
            };
          }
        );

      case "customers":
      case "users":
        // Tính tổng chi tiêu từ bookings data (chỉ booking đã xác nhận)
        const userSpendingMap = new Map();
        const allBookings = Array.isArray(data) ? [] : data.bookings || [];

        allBookings.forEach((booking) => {
          if (booking.userId && booking.status === 1) {
            // CONFIRMED
            const userId = booking.userId;
            const amount = booking.totalPrice || booking.price || 0;
            userSpendingMap.set(
              userId,
              (userSpendingMap.get(userId) || 0) + amount
            );
          }
        });

        return (Array.isArray(data) ? data : data.users || []).map((user) => ({
          id: user.id,
          fullName:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() || "N/A",
          email: user.email || "N/A",
          phone: user.phone || "N/A",
          role: getRoleName(user.role),
          status: user.active ? "Hoạt động" : "Không hoạt động",
          joinDate: user.createdAt
            ? formatDateVN(user.createdAt)
            : "Chưa có dữ liệu",
          totalBookings: userBookingsCount.get(user.id) || 0,
          totalSpent: userSpendingMap.get(user.id) || 0,
          loyaltyPoints: user.loyaltyPoints || 0,
          loyaltyTier: getLoyaltyTierName(user.loyaltyTier),
          lastLogin: user.lastLogin
            ? formatDateTimeVN(user.lastLogin)
            : "Chưa đăng nhập",
          authProvider: getAuthProviderName(user.authProvider),
          verified: user.verified ? "Đã xác minh" : "Chưa xác minh",
        }));

      case "flights":
        return (Array.isArray(data) ? data : data.flights || []).map(
          (flight) => {
            // Tính doanh thu từ các lớp ghế đã đặt với nhiều fallback
            const computedRevenue =
              flight.flightTravelClasses?.reduce((sum, travelClass) => {
                const classRevenue =
                  (travelClass.price || 0) *
                  (travelClass.bookedSeat || travelClass.booked_seat || 0);
                return sum + classRevenue;
              }, 0) || 0;

            // Fallback cho revenue: computed từ travel classes, hoặc trường revenue trực tiếp, hoặc 0
            const finalRevenue =
              computedRevenue ||
              flight.revenue ||
              flight.totalRevenue ||
              flight.total_revenue ||
              0;

            // Tính bookedSeats với fallback
            const computedBookedSeats =
              flight.flightTravelClasses?.reduce(
                (sum, travelClass) =>
                  sum +
                  (travelClass.bookedSeat || travelClass.booked_seat || 0),
                0
              ) || 0;
            const finalBookedSeats =
              computedBookedSeats ||
              flight.bookedSeats ||
              flight.booked_seats ||
              flight.reservedSeats ||
              0;

            // Tính tổng ghế
            const totalSeats =
              flight.aircraft?.totalSeats ||
              flight.totalSeats ||
              flight.total_seats ||
              flight.flightTravelClasses?.reduce(
                (sum, travelClass) => sum + (travelClass.capacity || 0),
                0
              ) ||
              0;

            return {
              id: flight.flightId || flight.id,
              flightNumber:
                flight.flightNumber ||
                flight.flight_number ||
                `FL${flight.flightId || flight.id}`,
              airlineName:
                flight.airline?.airlineName ||
                flight.airline?.name ||
                flight.airlineName ||
                "N/A",
              route: `${
                flight.departureAirport?.airportCode ||
                flight.departure_airport_code ||
                "N/A"
              } → ${
                flight.arrivalAirport?.airportCode ||
                flight.arrival_airport_code ||
                "N/A"
              }`,
              departureTime:
                flight.departureTime || flight.departure_time
                  ? formatDateTimeVN(
                      flight.departureTime || flight.departure_time
                    )
                  : "Chưa có dữ liệu",
              arrivalTime:
                flight.arrivalTime || flight.arrival_time
                  ? formatDateTimeVN(flight.arrivalTime || flight.arrival_time)
                  : "Chưa có dữ liệu",
              duration: flight.duration ? `${flight.duration} phút` : "N/A",
              status: getFlightStatusName(flight.status),
              seatOccupancy: `${finalBookedSeats}/${totalSeats}`,
              occupancyRate:
                totalSeats > 0
                  ? `${Math.round((finalBookedSeats / totalSeats) * 100)}%`
                  : "0%",
              revenue: finalRevenue,
              flightType: getFlightTypeName(flight.type || flight.flightType),
              gate: flight.gate || "N/A",
              terminal: flight.terminal || "N/A",
              createdAt:
                flight.createdAt || flight.created_at
                  ? formatDateVN(flight.createdAt || flight.created_at)
                  : "Chưa có dữ liệu",
            };
          }
        );

      case "airlines":
        return (Array.isArray(data) ? data : data.airlines || []).map(
          (airline) => ({
            id: airline.id,
            airlineName: airline.name || "N/A",
            airlineCode: airline.code || airline.iataCode || "N/A",
            country: airline.country || "N/A",
            status: airline.status || "active",
            totalFlights: airline.totalFlights || 0,
            activeFlights: airline.activeFlights || 0,
            fleetSize: airline.fleetSize || 0,
            foundedYear: airline.founded || "N/A",
            website: airline.website || "N/A",
          })
        );

      case "airports":
        return (Array.isArray(data) ? data : data.airports || []).map(
          (airport) => ({
            id: airport.id,
            airportName: airport.name || "N/A",
            airportCode: airport.code || airport.iataCode || "N/A",
            city: airport.city || "N/A",
            country: airport.country || "N/A",
            airportType: airport.type || "domestic",
            status: airport.status || "active",
            timezone: airport.timezone || "UTC+7",
            runways: airport.runways || 0,
            terminals: airport.terminals || 0,
          })
        );

      case "overview":
        // TỔNG QUAN TỔNG HỢP - Khác với Revenue (theo ngày)
        const bookings = Array.isArray(data) ? data : data.bookings || [];
        const users = Array.isArray(data) ? [] : data.users || [];
        const flights = Array.isArray(data) ? [] : data.flights || [];

        // Tạo tổng hợp theo CATEGORY thay vì theo ngày
        const overviewCategories = [
          {
            id: "total-revenue",
            date: "Tổng Doanh Thu",
            revenue: bookings.reduce(
              (sum, booking) =>
                sum +
                (booking.totalAmount ||
                  booking.totalPrice ||
                  booking.price ||
                  0),
              0
            ),
            bookings: bookings.length,
            customers: new Set(bookings.map((b) => b.userId || b.customerId))
              .size,
            flights: flights.length,
            avgRevenuePerBooking:
              bookings.length > 0
                ? bookings.reduce(
                    (sum, booking) =>
                      sum +
                      (booking.totalAmount ||
                        booking.totalPrice ||
                        booking.price ||
                        0),
                    0
                  ) / bookings.length
                : 0,
            successRate:
              bookings.length > 0
                ? (
                    (bookings.filter(
                      (b) => b.status === 1 || b.status === "CONFIRMED"
                    ).length /
                      bookings.length) *
                    100
                  ).toFixed(1) + "%"
                : "0.0%",
          },
          {
            id: "confirmed-bookings",
            date: "Đặt Vé Xác Nhận",
            revenue: bookings
              .filter((b) => b.status === 1 || b.status === "CONFIRMED")
              .reduce(
                (sum, booking) =>
                  sum +
                  (booking.totalAmount ||
                    booking.totalPrice ||
                    booking.price ||
                    0),
                0
              ),
            bookings: bookings.filter(
              (b) => b.status === 1 || b.status === "CONFIRMED"
            ).length,
            customers: new Set(
              bookings
                .filter((b) => b.status === 1 || b.status === "CONFIRMED")
                .map((b) => b.userId || b.customerId)
            ).size,
            flights: new Set(
              bookings
                .filter((b) => b.status === 1 || b.status === "CONFIRMED")
                .map((b) => b.flightId)
            ).size,
            avgRevenuePerBooking: (() => {
              const confirmedBookings = bookings.filter(
                (b) => b.status === 1 || b.status === "CONFIRMED"
              );
              return confirmedBookings.length > 0
                ? confirmedBookings.reduce(
                    (sum, booking) =>
                      sum +
                      (booking.totalAmount ||
                        booking.totalPrice ||
                        booking.price ||
                        0),
                    0
                  ) / confirmedBookings.length
                : 0;
            })(),
            successRate: "100.0%",
          },
          {
            id: "active-flights",
            date: "Chuyến Bay Hoạt Động",
            revenue: (() => {
              const activeFlightIds = flights
                .filter((f) => new Date(f.departureTime) > new Date())
                .map((f) => f.flightId || f.id);
              return bookings
                .filter((b) => activeFlightIds.includes(b.flightId))
                .reduce(
                  (sum, booking) =>
                    sum +
                    (booking.totalAmount ||
                      booking.totalPrice ||
                      booking.price ||
                      0),
                  0
                );
            })(),
            bookings: (() => {
              const activeFlightIds = flights
                .filter((f) => new Date(f.departureTime) > new Date())
                .map((f) => f.flightId || f.id);
              return bookings.filter((b) =>
                activeFlightIds.includes(b.flightId)
              ).length;
            })(),
            customers: (() => {
              const activeFlightIds = flights
                .filter((f) => new Date(f.departureTime) > new Date())
                .map((f) => f.flightId || f.id);
              return new Set(
                bookings
                  .filter((b) => activeFlightIds.includes(b.flightId))
                  .map((b) => b.userId || b.customerId)
              ).size;
            })(),
            flights: flights.filter(
              (f) => new Date(f.departureTime) > new Date()
            ).length,
            avgRevenuePerBooking: (() => {
              const activeFlightIds = flights
                .filter((f) => new Date(f.departureTime) > new Date())
                .map((f) => f.flightId || f.id);
              const activeBookings = bookings.filter((b) =>
                activeFlightIds.includes(b.flightId)
              );
              return activeBookings.length > 0
                ? activeBookings.reduce(
                    (sum, booking) =>
                      sum +
                      (booking.totalAmount ||
                        booking.totalPrice ||
                        booking.price ||
                        0),
                    0
                  ) / activeBookings.length
                : 0;
            })(),
            successRate: (() => {
              const activeFlightIds = flights
                .filter((f) => new Date(f.departureTime) > new Date())
                .map((f) => f.flightId || f.id);
              const activeBookings = bookings.filter((b) =>
                activeFlightIds.includes(b.flightId)
              );
              return activeBookings.length > 0
                ? (
                    (activeBookings.filter(
                      (b) => b.status === 1 || b.status === "CONFIRMED"
                    ).length /
                      activeBookings.length) *
                    100
                  ).toFixed(1) + "%"
                : "0.0%";
            })(),
          },
          {
            id: "new-customers",
            date: "Khách Hàng Mới",
            revenue: (() => {
              // Customers created within date range
              const dateRangeMs = 30 * 24 * 60 * 60 * 1000; // 30 days
              const cutoffDate = new Date(Date.now() - dateRangeMs);
              const newUserIds = users
                .filter((u) => new Date(u.createdAt) > cutoffDate)
                .map((u) => u.id);
              return bookings
                .filter((b) => newUserIds.includes(b.userId))
                .reduce(
                  (sum, booking) =>
                    sum +
                    (booking.totalAmount ||
                      booking.totalPrice ||
                      booking.price ||
                      0),
                  0
                );
            })(),
            bookings: (() => {
              const dateRangeMs = 30 * 24 * 60 * 60 * 1000;
              const cutoffDate = new Date(Date.now() - dateRangeMs);
              const newUserIds = users
                .filter((u) => new Date(u.createdAt) > cutoffDate)
                .map((u) => u.id);
              return bookings.filter((b) => newUserIds.includes(b.userId))
                .length;
            })(),
            customers: users.filter((u) => {
              const dateRangeMs = 30 * 24 * 60 * 60 * 1000;
              const cutoffDate = new Date(Date.now() - dateRangeMs);
              return new Date(u.createdAt) > cutoffDate;
            }).length,
            flights: (() => {
              const dateRangeMs = 30 * 24 * 60 * 60 * 1000;
              const cutoffDate = new Date(Date.now() - dateRangeMs);
              const newUserIds = users
                .filter((u) => new Date(u.createdAt) > cutoffDate)
                .map((u) => u.id);
              return new Set(
                bookings
                  .filter((b) => newUserIds.includes(b.userId))
                  .map((b) => b.flightId)
              ).size;
            })(),
            avgRevenuePerBooking: (() => {
              const dateRangeMs = 30 * 24 * 60 * 60 * 1000;
              const cutoffDate = new Date(Date.now() - dateRangeMs);
              const newUserIds = users
                .filter((u) => new Date(u.createdAt) > cutoffDate)
                .map((u) => u.id);
              const newCustomerBookings = bookings.filter((b) =>
                newUserIds.includes(b.userId)
              );
              return newCustomerBookings.length > 0
                ? newCustomerBookings.reduce(
                    (sum, booking) =>
                      sum +
                      (booking.totalAmount ||
                        booking.totalPrice ||
                        booking.price ||
                        0),
                    0
                  ) / newCustomerBookings.length
                : 0;
            })(),
            successRate: (() => {
              const dateRangeMs = 30 * 24 * 60 * 60 * 1000;
              const cutoffDate = new Date(Date.now() - dateRangeMs);
              const newUserIds = users
                .filter((u) => new Date(u.createdAt) > cutoffDate)
                .map((u) => u.id);
              const newCustomerBookings = bookings.filter((b) =>
                newUserIds.includes(b.userId)
              );
              return newCustomerBookings.length > 0
                ? (
                    (newCustomerBookings.filter(
                      (b) => b.status === 1 || b.status === "CONFIRMED"
                    ).length /
                      newCustomerBookings.length) *
                    100
                  ).toFixed(1) + "%"
                : "0.0%";
            })(),
          },
        ];

        return overviewCategories;

      case "revenue":
        // Xử lý dữ liệu doanh thu theo ngày
        const revenueMap = new Map();
        const revenueBookings = Array.isArray(data)
          ? data
          : data.bookings || [];

        revenueBookings.forEach((booking) => {
          // Tính tất cả booking (không chỉ confirmed) để có dữ liệu đầy đủ
          const bookingDateRaw =
            booking.createdAt ||
            booking.created_at ||
            booking.bookingDate ||
            booking.booking_date;
          if (!bookingDateRaw) return; // Skip nếu không có ngày

          const isoKey = format(new Date(bookingDateRaw), "yyyy-MM-dd");
          const displayDate = formatDateVN(bookingDateRaw);

          if (!revenueMap.has(isoKey)) {
            revenueMap.set(isoKey, {
              date: displayDate,
              isoKey: isoKey,
              revenue: 0,
              bookings: 0,
              confirmedBookings: 0,
              customers: new Set(),
            });
          }
          const day = revenueMap.get(isoKey);
          const bookingAmount =
            booking.totalAmount || booking.totalPrice || booking.price || 0;
          day.revenue += bookingAmount;
          day.bookings += 1;
          day.customers.add(booking.userId || booking.customerId);

          // Đếm booking đã xác nhận
          if (booking.status === 1 || booking.status === "CONFIRMED") {
            day.confirmedBookings += 1;
          }
        });

        // Tính toán khách hàng mới từ users data nếu có
        const revenueUsers = Array.isArray(data) ? [] : data.users || [];
        const usersByDate = new Map();
        revenueUsers.forEach((user) => {
          const userDateRaw = user.createdAt || user.created_at;
          if (!userDateRaw) return;
          const isoKey = format(new Date(userDateRaw), "yyyy-MM-dd");
          if (!usersByDate.has(isoKey)) {
            usersByDate.set(isoKey, 0);
          }
          usersByDate.set(isoKey, usersByDate.get(isoKey) + 1);
        });

        const revenueResult = Array.from(revenueMap.values())
          .sort((a, b) => a.isoKey.localeCompare(b.isoKey))
          .map((day) => {
            const newCustomers = usersByDate.get(day.isoKey) || 0;
            const avgRevenuePerBooking =
              day.bookings > 0 ? day.revenue / day.bookings : 0;
            const confirmationRate =
              day.bookings > 0
                ? (day.confirmedBookings / day.bookings) * 100
                : 0;

            return {
              id: day.isoKey,
              date: day.date,
              revenue: day.revenue,
              bookings: day.bookings,
              // newCustomers: newCustomers, // Removed as requested
              avgRevenuePerBooking: avgRevenuePerBooking,
              confirmationRate: `${confirmationRate.toFixed(1)}%`,
            };
          });

        return revenueResult;

      default:
        return [];
    }
  }, [type, data, userBookingsCount]);

  const rawData = useMemo(() => processData(), [processData]);

  // Data is already filtered by dateRange in fetchData, no need for additional filtering
  const filteredData = useMemo(() => {
    return rawData;
  }, [rawData]);

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    return sorted;
  }, [filteredData, sortBy, sortOrder]);

  // Pagination logic
  const paginationData = useMemo(() => {
    const serverPagedTypes = [
      "bookings",
      "customers",
      "users",
      "flights",
      "airlines",
      "airports",
    ];

    if (serverPagedTypes.includes(type) && !realData) {
      // Server-side pagination: API returns paginated results
      const totalPages =
        itemsPerPage > 0 ? Math.ceil((totalItems || 0) / itemsPerPage) : 1;
      const startIndex = (currentPage - 1) * itemsPerPage;
      // For server pagination, use the data directly as it's already paginated
      const paginatedData = sortedData;
      return { totalPages, startIndex, paginatedData, isServerPaged: true };
    }

    // Client-side pagination for realData or aggregated views
    const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = sortedData.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    return { totalPages, startIndex, paginatedData, isServerPaged: false };
  }, [sortedData, currentPage, itemsPerPage, totalItems, type, realData]);

  const { totalPages, startIndex, paginatedData } = paginationData;

  // Get headers based on type - Vietnamese labels
  const getHeaders = () => {
    const headers = {
      overview: [
        "Ngày",
        "Tổng Doanh Thu",
        "Tổng Đặt Vé",
        "Tổng Khách Hàng",
        "Tổng Chuyến Bay",
        "TB/Đặt Vé",
        "Tỷ Lệ Thành Công",
      ],
      revenue: [
        "Ngày",
        "Doanh Thu",
        "Số Đặt Vé",
        // "Khách Hàng Mới",
        "TB Doanh Thu/Vé",
        "Tỷ Lệ Xác Nhận",
      ],
      bookings: [
        "Mã Đặt Vé",
        "Khách Hàng",
        "Tuyến Bay",
        "Ngày Đặt",
        "Số Hành Khách",
        "Tổng Tiền",
        "Phương Thức",
        "Trạng Thái",
      ],
      customers: [
        "Khách Hàng",
        "Email",
        "Số Điện Thoại",
        "Vai Trò",
        "Xác Minh",
        "Hạng Thành Viên",
        "Điểm Thưởng",
        "Ngày Tham Gia",
        "Trạng Thái",
      ],
      flights: [
        "Mã Chuyến Bay",
        "Hãng Hàng Không",
        "Tuyến Bay",
        "Khởi Hành",
        "Đến",
        "Thời Lượng",
        "Loại Chuyến",
        "Ghế Đặt/Tổng",
        "Tỷ Lệ Lấp Đầy",
        "Doanh Thu",
        "Trạng Thái",
      ],
      airlines: [
        "Tên Hãng",
        "Mã Hãng",
        "Số Lượng Máy Bay",
        "Số Lượng Chuyến Bay",
        "Doanh Thu",
        "Trạng Thái",
      ],
      airports: [
        "Tên Sân Bay",
        "Mã Sân Bay",
        "Thành Phố",
        "Quốc Gia",
        "Nhà Ga",
        "Trạng Thái",
      ],
    };
    return headers[type] || headers.overview;
  };

  // getDataKey is already defined above

  const formatCurrency = (amount) => {
    return formatCurrencyVND(amount);
  };

  const getStatusBadge = (status) => {
    const statusLabels = {
      ...BOOKING_STATUS_NAMES,
      scheduled: "Đã lên lịch",
      delayed: "Trì hoãn",
      high: "Cao",
      normal: "Bình thường",
      low: "Thấp",
      VIP: "VIP",
      Premium: "Cao cấp",
      Standard: "Tiêu chuẩn",
      Basic: "Cơ bản",
      Cao: "Hiệu suất cao",
      "Trung bình": "Hiệu suất trung bình",
      Thấp: "Hiệu suất thấp",
    };

    const variants = {
      confirmed: "default",
      pending: "secondary",
      cancelled: "destructive",
      completed: "default",
      scheduled: "secondary",
      delayed: "secondary",
      high: "default",
      normal: "secondary",
      low: "destructive",
      VIP: "default",
      Premium: "secondary",
      Standard: "outline",
      Basic: "outline",
      Cao: "default",
      "Trung bình": "secondary",
      Thấp: "destructive",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const exportData = () => {
    const headers = getHeaders();
    const csv = [
      headers.join(","),
      ...sortedData.map((row) =>
        headers
          .map((header) => {
            const key = getDataKey(header, type);
            return row[key] || "";
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Detail Modal Component
  const DetailModal = ({ row, onClose }) => {
    if (!row) return null;

    const getDetailFields = () => {
      switch (type) {
        case "bookings":
          return [
            { label: "Mã đặt vé", value: row.bookingCode, icon: Calendar },
            { label: "Tên khách hàng", value: row.customerName, icon: Users },
            { label: "Email", value: row.customerEmail },
            { label: "Số điện thoại", value: row.phoneNumber },
            { label: "Mã chuyến bay", value: row.flightNumber, icon: Plane },
            { label: "Tuyến bay", value: row.route, icon: MapPin },
            { label: "Thời gian khởi hành", value: row.departureTime },
            { label: "Ngày đặt vé", value: row.bookingDate },
            {
              label: "Giá trị",
              value: formatCurrency(row.totalAmount),
              icon: DollarSign,
            },
            { label: "Phương thức thanh toán", value: row.paymentMethod },
            { label: "Trạng thái", value: row.status },
            { label: "Ghi chú", value: row.notes },
          ];
        case "customers":
          return [
            { label: "Tên khách hàng", value: row.fullName, icon: Users },
            { label: "Email", value: row.email },
            {
              label: "Số lượng đặt vé",
              value: `${row.totalBookings || 0} đặt vé`,
            },
            {
              label: "Tổng chi tiêu",
              value: formatCurrency(row.totalSpent),
              icon: DollarSign,
            },
            { label: "Điểm thưởng", value: `${row.loyaltyPoints || 0} điểm` },
            { label: "Cấp độ thành viên", value: row.loyaltyTier },
            { label: "Ngày tham gia", value: row.joinDate },
            { label: "Nhà cung cấp xác thực", value: row.authProvider },
          ];
        case "flights":
          return [
            { label: "Mã chuyến bay", value: row.flightNumber, icon: Plane },
            { label: "Tuyến bay", value: row.route, icon: MapPin },
            { label: "Thời gian khởi hành", value: row.departureTime },
            { label: "Thời gian đến", value: row.arrivalTime },
            { label: "Hãng bay", value: row.airlineName },
            { label: "Số lượng hành khách", value: row.passengerCount },
            {
              label: "Doanh thu",
              value: formatCurrency(row.revenue),
              icon: DollarSign,
            },
            { label: "Tỷ lệ lấp đầy", value: `${row.occupancyRate}%` },
            { label: "Trạng thái", value: row.status },
          ];
        case "airlines":
          return [
            { label: "Tên hãng", value: row.airlineName, icon: Plane },
            { label: "Mã hãng", value: row.airlineCode },
            { label: "Số lượng máy bay", value: row.fleetSize },
            { label: "Số lượng chuyến bay", value: row.totalFlights },
            {
              label: "Doanh thu",
              value: formatCurrency(row.revenue),
              icon: DollarSign,
            },
            { label: "Trạng thái", value: row.status },
          ];
        case "airports":
          return [
            { label: "Tên sân bay", value: row.airportName, icon: MapPin },
            { label: "Mã sân bay", value: row.airportCode },
            { label: "Thành phố", value: row.city },
            { label: "Quốc gia", value: row.country },
            { label: "Nhà ga", value: row.terminals },
            { label: "Trạng thái", value: row.status },
          ];
        case "revenue":
          return [
            { label: "Ngày", value: row.date, icon: Calendar },
            {
              label: "Doanh thu",
              value: formatCurrency(row.revenue),
              icon: DollarSign,
            },

            // { label: "Trạng thái", value: row.status },
            { label: "Tổng đặt vé", value: `${row.bookingCount} đặt vé` },
            // {
            //   label: "Đặt vé xác nhận",
            //   value: `${row.confirmedBookings} đặt vé`,
            // },
          ];
        default:
          return Object.entries(row).map(([key, value]) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value:
              typeof value === "number" && key.includes("doanhThu")
                ? formatCurrency(value)
                : value,
          }));
      }
    };

    return (
      <DialogContent className="max-w-[95vw] sm:max-w-[80vw] md:max-w-xl lg:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            {type === "bookings"
              ? "Chi tiết đặt vé"
              : type === "customers"
              ? "Chi tiết khách hàng"
              : "Chi tiết báo cáo"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getDetailFields().map((field, index) => (
              <div key={index} className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  {field.icon && <field.icon className="h-4 w-4" />}
                  {field.label}
                </Label>
                <div className="text-sm font-medium bg-muted/50 p-2 rounded">
                  {field.label === "Status"
                    ? getStatusBadge(field.value)
                    : field.value || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    );
  };

  return (
    <Card className="dark:bg-gray-900 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="capitalize flex items-center gap-2 dark:text-white">
              {type === "bookings" && <Calendar className="h-5 w-5" />}
              {type === "customers" && <Users className="h-5 w-5" />}
              {type === "flights" && <Plane className="h-5 w-5" />}
              {type === "revenue" && <DollarSign className="h-5 w-5" />}
              {type === "bookings"
                ? "Đặt vé"
                : type === "customers"
                ? "Khách hàng"
                : type === "flights"
                ? "Chuyến bay"
                : type === "revenue"
                ? "Doanh thu"
                : type}{" "}
              Chi tiết báo cáo
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 dark:text-gray-400"></p>
          </div>
          <div className="flex items-center gap-2">
            {/* Chỉ hiển thị nút export cho 4 tab: revenue, bookings, customers, flights */}
            {(type === "revenue" ||
              type === "bookings" ||
              type === "customers" ||
              type === "flights") && (
              <ReportExportButton
                reportType={type}
                data={sortedData}
                dateRange={dateRange}
                variant="outline"
                size="sm"
                isLoading={externalLoading}
              />
            )}

            {/* Nút Export cho tab Tổng Quan */}
            {type === "overview" && (
              <OverviewExportButton
                rawData={data}
                processedData={filteredData}
                dateRange={dateRange}
                variant="outline"
                size="sm"
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Simple Pagination Control */}
        <div className="flex items-center justify-between mb-6">
          {/* <div className="text-sm text-muted-foreground">
            {dateRange?.from && dateRange?.to && (
              <span>
                Dữ liệu từ {format(new Date(dateRange.from), "dd/MM/yyyy")} đến {format(new Date(dateRange.to), "dd/MM/yyyy")}
              </span>
            )}
          </div> */}
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => setItemsPerPage(Number(value))}
          >
            <SelectTrigger className="w-[120px] dark:bg-gray-800 dark:border-gray-600 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
              <SelectItem
                value="10"
                className="dark:text-white dark:focus:bg-gray-700"
              >
                10 hàng
              </SelectItem>
              <SelectItem
                value="25"
                className="dark:text-white dark:focus:bg-gray-700"
              >
                25 hàng
              </SelectItem>
              <SelectItem
                value="50"
                className="dark:text-white dark:focus:bg-gray-700"
              >
                50 hàng
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                {getHeaders().map((header) => (
                  <TableHead
                    key={header}
                    className="cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-800 dark:text-white"
                    onClick={() => handleSort(header.toLowerCase())}
                  >
                    <div className="flex items-center gap-2">
                      {header}
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-[80px] dark:text-white">
                  Chi Tiết
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actualIsLoading ? (
                // Loading skeleton
                Array.from({ length: itemsPerPage }).map((_, index) => (
                  <TableRow
                    key={`loading-${index}`}
                    className="dark:border-gray-700"
                  >
                    {getHeaders().map((header, colIndex) => (
                      <TableCell
                        key={`loading-${index}-${colIndex}`}
                        className="dark:border-gray-700"
                      >
                        <div className="h-4 bg-muted dark:bg-gray-700 animate-pulse rounded"></div>
                      </TableCell>
                    ))}
                    <TableCell className="dark:border-gray-700">
                      <div className="h-8 w-8 bg-muted dark:bg-gray-700 animate-pulse rounded"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow className="dark:border-gray-700">
                  <TableCell
                    colSpan={getHeaders().length + 1}
                    className="text-center py-8 text-red-500 dark:text-red-400"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow className="dark:border-gray-700">
                  <TableCell
                    colSpan={getHeaders().length + 1}
                    className="text-center py-8 text-muted-foreground dark:text-gray-400"
                  >
                    Không có dữ liệu để hiển thị
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRowItem
                    key={row.id || index}
                    row={row}
                    headers={getHeaders()}
                    type={type}
                    onRowClick={setSelectedRow}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={
            paginationData.isServerPaged ? totalItems : sortedData.length
          }
          onPageChange={setCurrentPage}
          onPageSizeChange={setItemsPerPage}
          showPageSizeSelector={false}
          showFirstLast={false}
          showInfo={true}
        />
      </CardContent>

      {/* Detail Modal */}
      {selectedRow && (
        <Dialog open={!!selectedRow} onOpenChange={() => setSelectedRow(null)}>
          <DetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />
        </Dialog>
      )}
    </Card>
  );
};

export default memo(ReportTable);
