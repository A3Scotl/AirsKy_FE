import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Activity,
  Shield,
  Crown,
  CheckCircle,
  XCircle,
  Clock,
  Plane,
  CreditCard,
  MapPinIcon,
  UserCheck,
  AlertTriangle,
  Edit,
  Award,
  FileText,
  TrendingUp,
  Eye,
  Ban,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { userApi } from "@/apis/user-api";
import Pagination from "@/components/ui/pagination";

const UserDetailsModal = ({
  open,
  onClose,
  user,
  currentUser,
  onEditUser,
  onSuspendUser,
  onDeleteUser,
}) => {
  const [userBookings, setUserBookings] = useState([]);
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
  });
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Fetch user bookings when modal opens
  useEffect(() => {
    if (open && user?.id) {
      fetchUserBookings();
    }
  }, [open, user?.id]);

  const fetchUserBookings = async () => {
    if (!user?.id) return;

    setLoadingBookings(true);
    try {
      const response = await userApi.getBookingsByUserId(user.id);
      if (response.success) {
        const bookings = response.data || [];
        setUserBookings(bookings);

        // Tính toán thống kê từ dữ liệu thật
        const stats = {
          totalBookings: bookings.length,
          cancelledBookings: bookings.filter(
            (booking) => booking.status === "CANCELLED"
          ).length,
          completedBookings: bookings.filter(
            (booking) =>
              booking.status === "COMPLETED" || booking.status === "CONFIRMED"
          ).length,
          totalSpent: bookings
            .filter(
              (booking) =>
                booking.status === "COMPLETED" || booking.status === "CONFIRMED"
            )
            .reduce((total, booking) => total + (booking.totalAmount || 0), 0),
        };
        setBookingStats(stats);
      }
    } catch (error) {
      console.error("Error fetching user bookings:", error);
    } finally {
      setLoadingBookings(false);
    }
  };

  // reset pagination when bookings change or modal closed/opened
  useEffect(() => {
    setPage(1);
  }, [userBookings.length, open]);

  if (!user) return null;

  const getStatusBadge = (status) => {
    const variants = {
      Active: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
      Suspended: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
      Pending:
        "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
    };
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getRoleBadge = (role) => {
    const variants = {
      Customer: "bg-blue-100 text-blue-800 border-blue-200",
      Premium: "bg-purple-100 text-purple-800 border-purple-200",
      Admin: "bg-orange-100 text-orange-800 border-orange-200",
    };
    return variants[role] || "bg-gray-100 text-gray-800";
  };

  const getRoleIcon = (role) => {
    const icons = {
      Customer: User,
      Premium: Crown,
      Admin: Shield,
    };
    return icons[role] || User;
  };

  const getStatusIcon = (status) => {
    const icons = {
      Active: CheckCircle,
      Suspended: XCircle,
      Pending: Clock,
    };
    return icons[status] || CheckCircle;
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLastLogin = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Hôm nay";
    } else if (diffDays === 1) {
      return "Hôm qua";
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  const StatusIcon = getStatusIcon(user.status);
  const RoleIcon = getRoleIcon(user.role);

  // Xử lý dữ liệu booking thật
  const totalBookingItems = userBookings.length;
  const totalBookingPages = Math.max(
    1,
    Math.ceil(totalBookingItems / pageSize)
  );

  const displayedBookings = userBookings
    .slice((page - 1) * pageSize, page * pageSize)
    .map((booking) => ({
      id: booking.bookingCode || booking.bookingId,
      route:
        booking.flightSegments?.length > 0
          ? `${booking.flightSegments[0].departureAirport?.airportCode} → ${booking.flightSegments[0].arrivalAirport?.airportCode}`
          : "N/A",
      date: booking.bookingDate
        ? new Date(booking.bookingDate).toLocaleDateString("vi-VN")
        : "N/A",
      status: booking.status,
      amount: booking.totalAmount || 0,
      flightNumber: booking.flightNumber || "N/A",
      raw: booking,
    }));

  // Tạo activities từ booking data
  const getRecentActivities = () => {
    const activities = [];

    userBookings.forEach((booking) => {
      // Activity cho việc tạo booking
      activities.push({
        action: "Tạo đặt chỗ",
        date: booking.createdAt
          ? formatDate(booking.createdAt)
          : booking.bookingDate,
        description: `Tạo đặt chỗ ${booking.bookingCode || booking.bookingId}`,
        icon: Plane,
        color: "text-green-500",
      });

      // Activity cho việc cập nhật trạng thái
      if (booking.status === "CANCELLED") {
        activities.push({
          action: "Hủy đặt chỗ",
          date: booking.updatedAt || booking.bookingDate,
          description: `Hủy đặt chỗ ${
            booking.bookingCode || booking.bookingId
          }`,
          icon: XCircle,
          color: "text-red-500",
        });
      } else if (booking.status === "COMPLETED") {
        activities.push({
          action: "Hoàn thành đặt chỗ",
          date: booking.updatedAt || booking.bookingDate,
          description: `Hoàn thành đặt chỗ ${
            booking.bookingCode || booking.bookingId
          }`,
          icon: CheckCircle,
          color: "text-blue-500",
        });
      }
    });

    // Sắp xếp theo thời gian giảm dần và lấy 5 hoạt động gần nhất
    return activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  };

  const recentBookings = displayedBookings;
  const recentActivities = getRecentActivities();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader className="sr-only">
          <DialogTitle>Thông tin chi tiết người dùng</DialogTitle>
        </DialogHeader>
        {/* Header với gradient background */}
        <div className="bg-gradient-to-r from-gray-500 via-gray-500 to-gray-600 text-white p-6 dark:from-gray-700 dark:via-gray-700 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar lớn và đẹp */}
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-white/20 shadow-lg">
                  <AvatarImage
                    src={user.avatar}
                    alt={user.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-white/10 text-white text-xl font-bold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {/* Status indicator */}
                <div className="absolute -bottom-1 -right-1">
                  <div
                    className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                      user.status === "Active"
                        ? "bg-green-500"
                        : user.status === "Suspended"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}
                  >
                    <StatusIcon className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>

              {/* Thông tin user */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <Badge
                    className={`${getRoleBadge(
                      user.role
                    )} text-black border-white/20`}
                  >
                    <RoleIcon className="h-3 w-3 mr-1" />
                    {user.role}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-blue-100">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                  <div className="text-sm">ID: {user.id}</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => onEditUser && onEditUser(user)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa thông tin
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {user.status === "Active" ? (
                    <DropdownMenuItem
                      onClick={() => onSuspendUser && onSuspendUser(user)}
                      className="text-orange-600"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Tạm ngừng tài khoản
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => onSuspendUser && onSuspendUser(user)}
                      className="text-green-600"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {user.status === "Active"
                        ? "Khóa tài khoản"
                        : "Mở khóa tài khoản"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDeleteUser && onDeleteUser(user)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa tài khoản
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="border-l-4 border-l-green-500 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Trạng thái
                    </p>
                    <Badge
                      variant="outline"
                      className={getStatusBadge(user.status)}
                    >
                      {user.status}
                    </Badge>
                  </div>
                  <StatusIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Tổng chi tiêu
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {bookingStats.totalSpent?.toLocaleString("vi-VN") || 0}đ
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Tổng đặt chỗ
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {bookingStats.totalBookings || 0}
                    </p>
                  </div>
                  <Plane className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Đã hủy
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {bookingStats.cancelledBookings || 0}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Đã hoàn thành
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {bookingStats.completedBookings || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 dark:bg-gray-800 dark:border-gray-700">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
              >
                <User className="h-4 w-4" />
                Tổng quan
              </TabsTrigger>
              <TabsTrigger
                value="bookings"
                className="flex items-center gap-2 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
              >
                <Plane className="h-4 w-4" />
                Đặt chỗ
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="flex items-center gap-2 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
              >
                <Activity className="h-4 w-4" />
                Hoạt động
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="flex items-center gap-2 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
              >
                <FileText className="h-4 w-4" />
                Tài liệu
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <User className="h-5 w-5 text-blue-500" />
                      Thông tin cá nhân
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Họ và tên
                        </p>
                        <p className="font-medium dark:text-white">
                          {user.name}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Email
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium dark:text-white">
                            {user.email}
                          </p>
                          {user.verifiedEmail && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Số điện thoại
                        </p>
                        <p className="font-medium dark:text-white">
                          {user.phone}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Ngày sinh
                        </p>
                        <p className="font-medium dark:text-white">
                          {user.dateOfBirth
                            ? formatDate(user.dateOfBirth).split(" ")[0]
                            : "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>

                    {user.address && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Địa chỉ
                        </p>
                        <p className="font-medium dark:text-white">
                          {user.address}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Account Information */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <Shield className="h-5 w-5 text-green-500" />
                      Thông tin tài khoản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Ngày tham gia
                        </p>
                        <p className="font-medium dark:text-white">
                          {user.joinDate}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Lần đăng nhập cuối
                        </p>
                        <p className="font-medium dark:text-white">
                          {formatLastLogin(user.lastLogin)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Hạng thành viên
                        </p>
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-purple-500" />
                          <p className="font-medium dark:text-white">
                            {user.loyaltyTier || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Xác thực email
                        </p>
                        <div className="flex items-center gap-2">
                          {user.verifiedEmail ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-green-600 font-medium dark:text-green-400">
                                Đã xác thực
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-600 font-medium">
                                Chưa xác thực
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Mã hội viên</p>
                        <p className="font-medium font-mono">
                          {user?.membershipCode || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Điểm tích lũy</p>
                        <p className="font-medium">{user.loyaltyPoints || 0}</p>
                      </div>
                    </div>

                    {user.passportNumber && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Số hộ chiếu</p>
                        <p className="font-medium font-mono">
                          {user.passportNumber}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Plane className="h-5 w-5 text-blue-500" />
                    Lịch sử đặt chỗ
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Các chuyến bay đã đặt của khách hàng
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingBookings ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                        Đang tải dữ liệu...
                      </span>
                    </div>
                  ) : recentBookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Plane className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p>Không có lịch sử đặt chỗ</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {recentBookings.map((booking) => {
                          const getStatusDisplay = (status) => {
                            const statusMap = {
                              CANCELLED: {
                                label: "Đã hủy",
                                variant: "destructive",
                              },
                              COMPLETED: {
                                label: "Hoàn thành",
                                variant: "default",
                              },
                              CONFIRMED: {
                                label: "Đã xác nhận",
                                variant: "secondary",
                              },
                              PENDING: {
                                label: "Chờ xử lý",
                                variant: "outline",
                              },
                            };
                            return (
                              statusMap[status] || {
                                label: status,
                                variant: "secondary",
                              }
                            );
                          };

                          const statusDisplay = getStatusDisplay(
                            booking.status
                          );

                          return (
                            <div
                              key={booking.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                  <Plane className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="font-semibold dark:text-white">
                                    {booking.route}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {booking.flightNumber} • {booking.date}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={statusDisplay.variant}
                                  className="mb-2"
                                >
                                  {statusDisplay.label}
                                </Badge>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                  {booking.amount.toLocaleString("vi-VN")}đ
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination for bookings */}
                      {totalBookingItems > pageSize && (
                        <Pagination
                          currentPage={page}
                          totalPages={totalBookingPages}
                          itemsPerPage={pageSize}
                          totalItems={totalBookingItems}
                          onPageChange={(p) => setPage(p)}
                          onPageSizeChange={(size) => {
                            setPageSize(size);
                            setPage(1);
                          }}
                          showPageSizeSelector={true}
                          showInfo={true}
                        />
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Activity className="h-5 w-5 text-purple-500" />
                    Nhật ký hoạt động
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Lịch sử hoạt động và thay đổi tài khoản
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => {
                      const ActivityIcon = activity.icon;
                      return (
                        <div
                          key={index}
                          className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.color
                              .replace("text-", "bg-")
                              .replace("-500", "-100")}`}
                          >
                            <ActivityIcon
                              className={`h-5 w-5 ${activity.color}`}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold dark:text-white">
                              {activity.action}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
                              {activity.date}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <FileText className="h-5 w-5 text-blue-500" />
                      Tài liệu cá nhân
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-600 dark:bg-gray-700">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="font-medium dark:text-white">
                            Hộ chiếu
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {user.passportNumber
                              ? "Đã cập nhật"
                              : "Chưa cập nhật"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!user.passportNumber}
                        className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Xem
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Thống kê sử dụng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {bookingStats.totalBookings || 0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Tổng đặt chỗ
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {bookingStats.totalSpent?.toLocaleString("vi-VN") ||
                            0}
                          đ
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Tổng chi tiêu
                        </p>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {bookingStats.cancelledBookings || 0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Đã hủy
                        </p>
                      </div>
                      <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {bookingStats.completedBookings || 0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Đã hoàn thành
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
