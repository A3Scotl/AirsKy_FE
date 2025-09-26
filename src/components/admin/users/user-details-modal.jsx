import React from "react";
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

const UserDetailsModal = ({
  open,
  onClose,
  user,
  currentUser,
  onEditUser,
  onSuspendUser,
  onDeleteUser,
}) => {
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

  // Mock data for recent bookings and activities
  const recentBookings = [
    {
      id: "BK001",
      route: "HAN → SGN",
      date: "2024-01-15",
      status: "Completed",
      amount: 1500000,
      flightNumber: "VN123",
    },
    {
      id: "BK002",
      route: "SGN → DAD",
      date: "2024-01-10",
      status: "Cancelled",
      amount: 2200000,
      flightNumber: "VN456",
    },
    {
      id: "BK003",
      route: "HAN → HPH",
      date: "2024-01-05",
      status: "Completed",
      amount: 800000,
      flightNumber: "VN789",
    },
  ];

  const recentActivities = [
    {
      action: "Cập nhật hồ sơ",
      date: "2024-01-15 10:30",
      description: "Thay đổi thông tin liên hệ",
      icon: Edit,
      color: "text-blue-500",
    },
    {
      action: "Tạo đặt chỗ",
      date: "2024-01-15 09:15",
      description: "Tạo đặt chỗ BK001",
      icon: Plane,
      color: "text-green-500",
    },
    {
      action: "Đăng nhập",
      date: "2024-01-15 09:00",
      description: "Đăng nhập từ Việt Nam",
      icon: UserCheck,
      color: "text-purple-500",
    },
    {
      action: "Đổi mật khẩu",
      date: "2024-01-10 14:20",
      description: "Cập nhật mật khẩu thành công",
      icon: Shield,
      color: "text-orange-500",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
        {/* Header với gradient background */}
        <div className="bg-gradient-to-r from-gray-500 via-gray-500 to-gray-600 text-white p-6">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Trạng thái
                    </p>
                    <Badge
                      variant="outline"
                      className={getStatusBadge(user.status)}
                    >
                      {user.status}
                    </Badge>
                  </div>
                  <StatusIcon className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Tổng chi tiêu
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {user.totalSpent?.toLocaleString("vi-VN") || 0}đ
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Tổng đặt chỗ
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {user.totalBookings || 0}
                    </p>
                  </div>
                  <Plane className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Điểm tích lũy
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {(user.loyaltyPoints || 0).toLocaleString("vi-VN")} VNĐ
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Đặt chỗ
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Hoạt động
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Tài liệu
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-500" />
                      Thông tin cá nhân
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Họ và tên</p>
                        <p className="font-medium">{user.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Email</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.email}</p>
                          {user.verifiedEmail && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Số điện thoại</p>
                        <p className="font-medium">{user.phone}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Ngày sinh</p>
                        <p className="font-medium">
                          {user.dateOfBirth
                            ? formatDate(user.dateOfBirth).split(" ")[0]
                            : "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>

                    {user.address && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Địa chỉ</p>
                        <p className="font-medium">{user.address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      Thông tin tài khoản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Ngày tham gia</p>
                        <p className="font-medium">
                          {user.joinDate}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">
                          Lần đăng nhập cuối
                        </p>
                        <p className="font-medium">
                          {formatLastLogin(user.lastLogin)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Hạng thành viên</p>
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-purple-500" />
                          <p className="font-medium">
                            {user.loyaltyTier || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Xác thực email</p>
                        <div className="flex items-center gap-2">
                          {user.verifiedEmail ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-green-600 font-medium">
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-5 w-5 text-blue-500" />
                    Lịch sử đặt chỗ
                  </CardTitle>
                  <CardDescription>
                    Các chuyến bay đã đặt của khách hàng
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Plane className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{booking.route}</p>
                            <p className="text-sm text-gray-500">
                              {booking.flightNumber} •{" "}
                              {formatDate(booking.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              booking.status === "Completed"
                                ? "default"
                                : booking.status === "Cancelled"
                                ? "destructive"
                                : "secondary"
                            }
                            className="mb-2"
                          >
                            {booking.status === "Completed"
                              ? "Hoàn thành"
                              : booking.status === "Cancelled"
                              ? "Đã hủy"
                              : booking.status}
                          </Badge>
                          <p className="text-lg font-bold text-green-600">
                            {booking.amount.toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    Nhật ký hoạt động
                  </CardTitle>
                  <CardDescription>
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
                          className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
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
                            <p className="font-semibold">{activity.action}</p>
                            <p className="text-sm text-gray-600">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      Tài liệu cá nhân
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="font-medium">Hộ chiếu</p>
                          <p className="text-sm text-gray-500">
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
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Xem
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Thống kê sử dụng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {user.totalBookings || 0}
                        </p>
                        <p className="text-sm text-gray-600">Tổng chuyến bay</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {user.totalSpent?.toLocaleString("vi-VN") || 0}đ
                        </p>
                        <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {(user.loyaltyPoints || 0).toLocaleString("vi-VN")}{" "}
                          VNĐ
                        </p>
                        <p className="text-sm text-gray-600">Điểm tích lũy</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          {user.memberSince
                            ? new Date().getFullYear() -
                              new Date(user.memberSince).getFullYear()
                            : 0}
                        </p>
                        <p className="text-sm text-gray-600">Năm thành viên</p>
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
