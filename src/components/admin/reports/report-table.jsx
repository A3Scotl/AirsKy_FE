import React, { useState, useMemo, useEffect } from "react";
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

const ReportTable = ({ type, dateRange }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [minLoyaltyPoints, setMinLoyaltyPoints] = useState("");
  const [maxLoyaltyPoints, setMaxLoyaltyPoints] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [userBookingsCount, setUserBookingsCount] = useState(new Map());

  // Helper functions để chuyển đổi enum values
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
      case "ONE_WAY":
        return "Một chiều";
      default:
        return type || "Nội địa";
    }
  };

  // Fetch data từ API dựa trên loại báo cáo
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let result;

        switch (type) {
          case "bookings":
            result = await bookingApi.getAllBookings({
              page: 0,
              size: 1000, // Lấy nhiều dữ liệu cho báo cáo
              sort: "createdAt,desc",
            });
            if (result.success) {
              setData(result.data.content || result.data || []);
            } else {
              setError("Không thể tải dữ liệu đặt vé");
            }
            break;

          case "customers":
          case "users":
            result = await userApi.getAllUsers({
              page: 0,
              size: 1000,
              sort: "createdAt,desc",
            });
            if (result.success) {
              setData(result.data.content || result.data || []);
            } else {
              setError("Không thể tải dữ liệu người dùng");
            }
            break;

          case "flights":
            result = await flightApi.getAllFlights({
              page: 0,
              size: 1000,
              sort: "departureTime,desc",
            });
            if (result.success) {
              setData(result.data.content || result.data || []);
            } else {
              setError("Không thể tải dữ liệu chuyến bay");
            }
            break;

          case "airlines":
            result = await airlineApi.getAllAirlines({
              page: 0,
              size: 1000,
            });
            if (result.success) {
              setData(result.data.content || result.data || []);
            } else {
              setError("Không thể tải dữ liệu hãng hàng không");
            }
            break;

          case "airports":
            result = await airportApi.getAllAirports({
              page: 0,
              size: 1000,
            });
            if (result.success) {
              setData(result.data.content || result.data || []);
            } else {
              setError("Không thể tải dữ liệu sân bay");
            }
            break;

          case "overview":
          case "revenue":
          default:
            // Cho overview và revenue, cần fetch nhiều data sources
            const [bookingsResult, usersResult, flightsResult] =
              await Promise.all([
                bookingApi.getAllBookings({
                  page: 0,
                  size: 1000,
                  sort: "createdAt,desc",
                }),
                userApi.getAllUsers({ page: 0, size: 1000 }),
                flightApi.getAllFlights({ page: 0, size: 1000 }),
              ]);

            if (
              bookingsResult.success &&
              usersResult.success &&
              flightsResult.success
            ) {
              setData({
                bookings:
                  bookingsResult.data.content || bookingsResult.data || [],
                users: usersResult.data.content || usersResult.data || [],
                flights: flightsResult.data.content || flightsResult.data || [],
              });
            } else {
              setError("Không thể tải dữ liệu tổng quan");
            }
            break;
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
        setError("Lỗi kết nối đến máy chủ");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [type]);

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

  // Available filter options for different report types
  const getFilterOptions = () => {
    const commonFilters = {
      status: [
        { value: "all", label: "Tất cả trạng thái", count: 0 },
        { value: "confirmed", label: "Đã xác nhận", count: 0 },
        { value: "pending", label: "Đang chờ", count: 0 },
        { value: "cancelled", label: "Đã hủy", count: 0 },
        { value: "completed", label: "Hoàn thành", count: 0 },
      ],
      dateRange: [
        { value: "all", label: "Tất cả thời gian" },
        { value: "today", label: "Hôm nay" },
        { value: "week", label: "7 ngày qua" },
        { value: "month", label: "30 ngày qua" },
        { value: "quarter", label: "3 tháng qua" },
      ],
    };

    const typeSpecific = {
      bookings: {
        ...commonFilters,
        amount: {
          min: 0,
          max: 5000,
          step: 100,
          description: "Khoảng giá trị đặt vé bằng VND (giá vé)",
        },
      },
      customers: {
        ...commonFilters,
        customerType: [
          { value: "all", label: "Tất cả loại khách hàng" },
          { value: "VIP", label: "VIP" },
          { value: "Premium", label: "Cao cấp" },
          { value: "Standard", label: "Tiêu chuẩn" },
          { value: "Basic", label: "Cơ bản" },
        ],
        amount: {
          min: 0,
          max: 50000,
          step: 1000,
          description: "Khoảng chi tiêu bằng VND (giá trị trọn đời)",
        },
        loyaltyPoints: {
          min: 0,
          max: 10000,
          step: 100,
          description: "Khoảng điểm thưởng (số điểm tích lũy)",
        },
      },
      revenue: {
        ...commonFilters,
        amount: {
          min: 0,
          max: 200000,
          step: 5000,
          description: "Khoảng doanh thu bằng VND (doanh thu hàng ngày/tháng)",
        },
      },
      flights: {
        ...commonFilters,
        amount: {
          min: 0,
          max: 100000,
          step: 2000,
          description: "Khoảng doanh thu chuyến bay bằng VND (mỗi chuyến bay)",
        },
      },
    };

    return typeSpecific[type] || commonFilters;
  };

  // Xử lý dữ liệu dựa trên loại báo cáo
  const processData = () => {
    if (!data || (Array.isArray(data) && data.length === 0)) return [];

    switch (type) {
      case "bookings":
        return data.map((booking) => ({
          id: booking.bookingId,
          bookingCode: `BK${booking.bookingId}`,
          customerName: booking.userEmail || "N/A",
          customerEmail: booking.userEmail || "N/A",
          flightNumber:
            booking.flightNumber || `FL${booking.flightId}` || "N/A",
          route: "N/A", // Không có thông tin tuyến bay trong dữ liệu mới
          bookingDate: formatDateVN(booking.createdAt || booking.bookingDate),
          flightDate: "N/A", // Không có thông tin ngày bay trong dữ liệu mới
          status: getBookingStatusName(booking.status),
          totalAmount: booking.totalAmount || 0,
          travelClass: booking.travelClass || "N/A",
          passengerCount: booking.passengers?.length || 1,
          paymentMethod: booking.payment?.method || "N/A",
          tripType: "N/A", // Không có thông tin loại chuyến bay trong dữ liệu mới
        }));

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
            user.fullName ||
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            "N/A",
          email: user.email || "N/A",
          phone: user.phone || user.phoneNumber || "N/A",
          role: getRoleName(user.role),
          status: user.status || "active",
          joinDate: formatDateVN(user.createdAt),
          totalBookings: userBookingsCount.get(user.id) || 0,
          totalSpent: userSpendingMap.get(user.id) || 0,
          loyaltyPoints: user.loyaltyPoints || 0,
          loyaltyTier: getLoyaltyTierName(user.loyaltyTier),
          lastLogin: user.lastLogin
            ? formatDateTimeVN(user.lastLogin)
            : "Chưa đăng nhập",
          authProvider: getAuthProviderName(user.authProvider),
        }));

      case "flights":
        return data.map((flight) => ({
          id: flight.id,
          flightNumber: flight.flightNumber || `FL${flight.id}`,
          airlineName: flight.airline?.name || flight.airlineName || "N/A",
          route: `${flight.departureAirport?.code || "DEP"} → ${
            flight.arrivalAirport?.code || "ARR"
          }`,
          departureTime: formatDateTimeVN(flight.departureTime),
          arrivalTime: formatDateTimeVN(flight.arrivalTime),
          duration: flight.duration || "N/A",
          status: getFlightStatusName(flight.status),
          aircraftModel:
            flight.aircraft?.model || flight.aircraftModel || "N/A",
          totalSeats: flight.totalSeats || flight.capacity || 0,
          availableSeats: flight.availableSeats || 0,
          bookedSeats:
            flight.bookedSeats ||
            flight.totalSeats - flight.availableSeats ||
            0,
          price: flight.price || flight.basePrice || 0,
          revenue: flight.revenue || 0,
          flightType: getFlightTypeName(flight.type),
        }));

      case "airlines":
        return data.map((airline) => ({
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
        }));

      case "airports":
        return data.map((airport) => ({
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
        }));

      case "overview":
        // Tổng hợp dữ liệu theo ngày cho tổng quan
        const overviewMap = new Map();
        const bookings = Array.isArray(data) ? data : data.bookings || [];
        const users = Array.isArray(data) ? [] : data.users || [];
        const flights = Array.isArray(data) ? [] : data.flights || [];

        // Xử lý đặt vé cho tổng quan
        bookings.forEach((booking) => {
          const date = formatDateVN(booking.createdAt || booking.bookingDate);
          if (!overviewMap.has(date)) {
            overviewMap.set(date, {
              date,
              revenue: 0,
              bookings: 0,
              customers: new Set(),
              flights: new Set(),
              successRate: 0,
              totalCount: 0,
            });
          }
          const day = overviewMap.get(date);
          // Lấy giá trị booking một cách thống nhất
          const bookingAmount =
            booking.totalAmount || booking.totalPrice || booking.price || 0;
          day.revenue += bookingAmount;
          day.bookings += 1;
          day.customers.add(booking.userId || booking.customerId);
          day.flights.add(booking.flightId);

          // Kiểm tra booking đã xác nhận (CONFIRMED) - có thể là string hoặc number
          const isConfirmed =
            booking.status === 1 ||
            booking.status === "CONFIRMED" ||
            booking.status === "confirmed";
          if (isConfirmed) {
            day.successRate += 1;
          }
          day.totalCount += 1;
        });

        return Array.from(overviewMap.values()).map((day) => ({
          id: day.date,
          date: day.date,
          revenue: day.revenue,
          bookings: day.bookings,
          customers: day.customers.size,
          flights: day.flights.size,
          successRate:
            day.totalCount > 0
              ? ((day.successRate / day.totalCount) * 100).toFixed(1)
              : "0.0",
        }));

      case "revenue":
        // Xử lý dữ liệu doanh thu theo ngày
        const revenueMap = new Map();
        const revenueBookings = Array.isArray(data)
          ? data
          : data.bookings || [];

        revenueBookings.forEach((booking) => {
          // Tính tất cả booking (không chỉ confirmed) để có dữ liệu đầy đủ
          const date = formatDateVN(booking.createdAt || booking.bookingDate);
          if (!revenueMap.has(date)) {
            revenueMap.set(date, {
              date,
              revenue: 0,
              bookings: 0,
              confirmedBookings: 0,
            });
          }
          const day = revenueMap.get(date);
          const bookingAmount =
            booking.totalAmount || booking.totalPrice || booking.price || 0;
          day.revenue += bookingAmount;
          day.bookings += 1;

          // Đếm booking đã xác nhận
          if (booking.status === 1 || booking.status === "CONFIRMED") {
            day.confirmedBookings += 1;
          }
        });

        return Array.from(revenueMap.values()).map((day) => {
          // Tính chi phí (giả định 25% của doanh thu cho chi phí vận hành)
          const cost = day.revenue * 0.25;
          const profit = day.revenue - cost;
          const roi = cost > 0 ? (profit / cost) * 100 : 0;

          // Xác định trạng thái dựa trên lợi nhuận và số lượng booking
          let status = "Thấp";
          if (profit > 5000000 && day.confirmedBookings > 5) {
            status = "Cao";
          } else if (profit > 2000000 && day.confirmedBookings > 2) {
            status = "Trung bình";
          }

          return {
            id: day.date,
            date: day.date,
            revenue: day.revenue,
            cost: cost,
            profit: profit,
            roi: Math.round(roi * 100) / 100, // Làm tròn 2 chữ số thập phân
            status: status,
            bookingCount: day.bookings,
            confirmedBookings: day.confirmedBookings,
          };
        });

      default:
        return [];
    }
  };

  const rawData = useMemo(() => processData(), [type, data]);

  // Filter and search data with enhanced filtering
  const filteredData = useMemo(() => {
    let filtered = rawData;

    // Status filter
    if (filterStatus !== "all" && filtered[0]?.status) {
      filtered = filtered.filter((row) => row.status === filterStatus);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filtered = filtered.filter((row) => {
        const amount =
          row.value || row.revenue || row.totalSpent || row.totalSpent || 0;
        const min = minAmount ? parseFloat(minAmount) : 0;
        const max = maxAmount ? parseFloat(maxAmount) : Infinity;
        return amount >= min && amount <= max;
      });
    }

    // Loyalty points range filter (for customers)
    if ((minLoyaltyPoints || maxLoyaltyPoints) && type === "customers") {
      filtered = filtered.filter((row) => {
        const points = row.loyaltyPoints || 0;
        const min = minLoyaltyPoints ? parseFloat(minLoyaltyPoints) : 0;
        const max = maxLoyaltyPoints ? parseFloat(maxLoyaltyPoints) : Infinity;
        return points >= min && points <= max;
      });
    }

    // Date range filter
    if (filterDateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (filterDateRange) {
        case "today":
          filterDate.setDate(now.getDate());
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setDate(now.getDate() - 30);
          break;
        case "quarter":
          filterDate.setDate(now.getDate() - 90);
          break;
      }

      filtered = filtered.filter((row) => {
        const rowDate = new Date(row.date || row.bookingDate || row.joinDate);
        return rowDate >= filterDate;
      });
    }

    return filtered;
  }, [
    rawData,
    filterStatus,
    minAmount,
    maxAmount,
    minLoyaltyPoints,
    maxLoyaltyPoints,
    filterDateRange,
    type,
  ]);

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

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  // Get headers based on type - Vietnamese labels
  const getHeaders = () => {
    const headers = {
      overview: [
        "Ngày",
        "Doanh Thu",
        "Đặt Vé",
        "Khách Hàng",
        "Chuyến Bay",
        "Tỷ Lệ Thành Công",
      ],
      revenue: [
        "Ngày",
        "Doanh Thu",
        "Chi Phí",
        "Lợi Nhuận",
        "ROI",
        "Trạng Thái",
      ],
      bookings: [
        "Mã Đặt Vé",
        "Khách Hàng",
        "Chuyến Bay",
        "Ngày Đặt",
        "Giá Trị",
        "Trạng Thái",
      ],
      customers: [
        "Khách Hàng",
        "Email",
        "Đặt Vé",
        "Tổng Chi Tiêu",
        "Điểm Thưởng",
        "Ngày Tham Gia",
        "Loại",
      ],
      flights: [
        "Mã Chuyến Bay",
        "Tuyến Bay",
        "Ngày",
        "Doanh Thu",
        "Hành Khách",
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

  // Map Vietnamese headers to data keys
  const getDataKey = (header, type) => {
    const keyMappings = {
      overview: {
        Ngày: "date",
        "Doanh Thu": "revenue",
        "Đặt Vé": "bookings",
        "Khách Hàng": "customers",
        "Chuyến Bay": "flights",
        "Tỷ Lệ Thành Công": "successRate",
      },
      revenue: {
        Ngày: "date",
        "Doanh Thu": "revenue",
        "Chi Phí": "cost",
        "Lợi Nhuận": "profit",
        ROI: "roi",
        "Trạng Thái": "status",
      },
      bookings: {
        "Mã Đặt Vé": "bookingCode",
        "Khách Hàng": "customerName",
        "Chuyến Bay": "flightNumber",
        "Ngày Đặt": "bookingDate",
        "Giá Trị": "totalAmount",
        "Trạng Thái": "status",
      },
      customers: {
        "Khách Hàng": "fullName",
        Email: "email",
        "Đặt Vé": "totalBookings",
        "Tổng Chi Tiêu": "totalSpent",
        "Điểm Thưởng": "loyaltyPoints",
        "Ngày Tham Gia": "joinDate",
        Loại: "loyaltyTier",
      },
      flights: {
        "Mã Chuyến Bay": "flightNumber",
        "Tuyến Bay": "route",
        Ngày: "flightDate",
        "Doanh Thu": "revenue",
        "Hành Khách": "passengerCount",
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
            {
              label: "Chi phí",
              value: formatCurrency(row.cost),
            },
            {
              label: "Lợi nhuận",
              value: formatCurrency(row.profit),
              icon: TrendingUp,
            },
            { label: "ROI", value: `${row.roi}%` },
            { label: "Trạng thái", value: row.status },
            { label: "Tổng đặt vé", value: `${row.bookingCount} đặt vé` },
            {
              label: "Đặt vé xác nhận",
              value: `${row.confirmedBookings} đặt vé`,
            },
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="capitalize flex items-center gap-2">
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
            <p className="text-sm text-muted-foreground mt-1">
              Lọc theo trạng thái, khoảng thời gian và khoảng giá trị.{" "}
              {getFilterOptions().amount?.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Xuất CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Enhanced Filters - Removed Search */}
        <div className="space-y-4 mb-6">
          {/* Basic filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1" />
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 hàng</SelectItem>
                <SelectItem value="25">25 hàng</SelectItem>
                <SelectItem value="50">50 hàng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <Label htmlFor="status-filter">Lọc theo trạng thái</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="pending">Đang chờ</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-filter">Lọc theo ngày</Label>
              <Select
                value={filterDateRange}
                onValueChange={setFilterDateRange}
              >
                <SelectTrigger id="date-filter">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thời gian</SelectItem>
                  <SelectItem value="today">Hôm nay</SelectItem>
                  <SelectItem value="week">7 ngày qua</SelectItem>
                  <SelectItem value="month">30 ngày qua</SelectItem>
                  <SelectItem value="quarter">3 tháng qua</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="min-amount">
                Giá trị tối thiểu (VND)
                {getFilterOptions().amount && (
                  <span className="text-xs text-muted-foreground ml-2">
                    Khoảng: 0 -{getFilterOptions().amount.max.toLocaleString()}
                  </span>
                )}
              </Label>
              <Input
                id="min-amount"
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                min="0"
                max={getFilterOptions().amount?.max}
                step={getFilterOptions().amount?.step || 100}
              />
            </div>

            <div>
              <Label htmlFor="max-amount">
                Giá trị tối đa (VND)
                {getFilterOptions().amount && (
                  <span className="text-xs text-muted-foreground ml-2">
                    Đề xuất: {getFilterOptions().amount.max.toLocaleString()}
                  </span>
                )}
              </Label>
              <Input
                id="max-amount"
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                min="0"
                max={getFilterOptions().amount?.max}
                step={getFilterOptions().amount?.step || 100}
              />
            </div>

            {/* Loyalty Points Filter - chỉ hiển thị cho customers */}
            {type === "customers" && getFilterOptions().loyaltyPoints && (
              <>
                <div>
                  <Label htmlFor="min-loyalty-points">
                    Điểm thưởng tối thiểu
                    <span className="text-xs text-muted-foreground ml-2">
                      Khoảng: 0 -{" "}
                      {getFilterOptions().loyaltyPoints.max.toLocaleString()}
                    </span>
                  </Label>
                  <Input
                    id="min-loyalty-points"
                    type="number"
                    placeholder="0"
                    value={minLoyaltyPoints}
                    onChange={(e) => setMinLoyaltyPoints(e.target.value)}
                    min="0"
                    max={getFilterOptions().loyaltyPoints.max}
                    step={getFilterOptions().loyaltyPoints.step || 100}
                  />
                </div>

                <div>
                  <Label htmlFor="max-loyalty-points">
                    Điểm thưởng tối đa
                    <span className="text-xs text-muted-foreground ml-2">
                      Đề xuất:{" "}
                      {getFilterOptions().loyaltyPoints.max.toLocaleString()}
                    </span>
                  </Label>
                  <Input
                    id="max-loyalty-points"
                    type="number"
                    placeholder="Không giới hạn"
                    value={maxLoyaltyPoints}
                    onChange={(e) => setMaxLoyaltyPoints(e.target.value)}
                    min="0"
                    max={getFilterOptions().loyaltyPoints.max}
                    step={getFilterOptions().loyaltyPoints.step || 100}
                  />
                </div>
              </>
            )}
          </div>

          {/* Filter summary */}
          {(filterStatus !== "all" ||
            filterDateRange !== "all" ||
            minAmount ||
            maxAmount ||
            minLoyaltyPoints ||
            maxLoyaltyPoints) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              Bộ lọc đã áp dụng - Hiển thị {filteredData.length} /{" "}
              {rawData.length} kết quả
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterStatus("all");
                  setFilterDateRange("all");
                  setMinAmount("");
                  setMaxAmount("");
                  setMinLoyaltyPoints("");
                  setMaxLoyaltyPoints("");
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {getHeaders().map((header) => (
                  <TableHead
                    key={header}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort(header.toLowerCase())}
                  >
                    <div className="flex items-center gap-2">
                      {header}
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-[80px]">Chi Tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, index) => (
                <TableRow key={row.id || index} className="hover:bg-muted/50">
                  {getHeaders().map((header) => {
                    const key = getDataKey(header, type);
                    let value = row[key];

                    // Special formatting based on column type
                    if (
                      header.includes("Doanh Thu") ||
                      header.includes("Chi Phí") ||
                      header.includes("Lợi Nhuận") ||
                      header.includes("Giá Trị") ||
                      header.includes("Tổng Chi Tiêu") ||
                      header.includes("Giá Trị Trung Bình")
                    ) {
                      value = formatCurrency(value);
                    } else if (header === "ROI") {
                      value = `${value}%`;
                    } else if (header === "Trạng Thái") {
                      return (
                        <TableCell key={header}>
                          {getStatusBadge(value)}
                        </TableCell>
                      );
                    } else if (header === "Tỷ Lệ Thành Công") {
                      value = `${value}%`;
                    } else if (header === "Loại") {
                      return (
                        <TableCell key={header}>
                          {getStatusBadge(value)}
                        </TableCell>
                      );
                    } else if (header === "Khách Hàng") {
                      value = row[key];
                      return (
                        <TableCell key={header}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{value}</span>
                          </div>
                        </TableCell>
                      );
                    }

                    return <TableCell key={header}>{value}</TableCell>;
                  })}
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRow(row)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DetailModal row={selectedRow} />
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={sortedData.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setItemsPerPage}
          showPageSizeSelector={false}
          showFirstLast={false}
          showInfo={true}
        />
      </CardContent>
    </Card>
  );
};

export default ReportTable;
