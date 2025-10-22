import React from "react";
import {
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  UserCheck,
  UserX,
  Shield,
  Crown,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Plane,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Pagination from "@/components/ui/pagination";
import { MoreHorizontal } from "lucide-react";
import UserDetailsModal from "./user-details-modal";

const statusConfig = {
  "Hoạt động": {
    badge: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  "Đã khóa": {
    badge: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  "Đang chờ": {
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  // English fallbacks
  Active: {
    badge: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  Suspended: {
    badge: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  Pending: {
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  default: {
    badge: "bg-gray-100 text-gray-800 border-gray-200",
    icon: User,
  },
};

const roleConfig = {
  CUSTOMER: {
    label: "Khách hàng",
    badge: "bg-blue-100 text-blue-800",
    icon: User,
  },
  BUSINESS: {
    label: "Doanh nghiệp",
    badge: "bg-purple-100 text-purple-800",
    icon: Crown,
  },
  FLIGHT_MANAGER: {
    label: "Quản lý bay",
    badge: "bg-green-100 text-green-800",
    icon: Plane,
  },
  ADMIN: {
    label: "Quản trị viên",
    badge: "bg-red-100 text-red-800",
    icon: Shield,
  },
  STAFF: {
    label: "Nhân viên",
    badge: "bg-yellow-100 text-yellow-800",
    icon: Users,
  },
  default: {
    label: "Không xác định",
    badge: "bg-gray-100 text-gray-800",
    icon: User,
  },
};

const loyaltyConfig = {
  STANDARD: {
    label: "Tiêu chuẩn",
    badge: "bg-gray-100 text-gray-800",
    icon: User,
  },
  SILVER: { label: "Bạc", badge: "bg-slate-200 text-slate-800", icon: Shield },
  GOLD: { label: "Vàng", badge: "bg-amber-200 text-amber-800", icon: Crown },
  PLATINUM: {
    label: "Bạch kim",
    badge: "bg-cyan-200 text-cyan-800",
    icon: Crown,
  },
  default: { label: "-", badge: "bg-gray-100 text-gray-800", icon: User },
};

const getStyle = (config, key) => config[key] || config.default;

const UserTable = ({
  users,
  currentUser,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onSuspendUser,
  onUpdateRole,
  onViewLoyalty,
  pagination,
  onPageChange,
  onPageSizeChange,
}) => {
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatLastLogin = (dateTimeString) => {
    if (!dateTimeString) return "Chưa đăng nhập";
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    }
    return formatDate(dateTimeString);
  };

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "N/A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* User Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Hạng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Hoạt động</TableHead>
              <TableHead className="text-center">Đặt vé</TableHead>
              <TableHead className="text-right">Chi tiêu</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const statusStyle = getStyle(statusConfig, user.status);
              const roleStyle = getStyle(roleConfig, user.role);
              const loyaltyStyle = getStyle(loyaltyConfig, user.loyaltyTier);

              return (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.avatar}
                          alt={user.name || "User"}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center space-x-2">
                          <span>{user.name || "N/A"}</span>
                          {user.email === currentUser?.email && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              Tài khoản của bạn
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${roleStyle.badge} flex items-center space-x-1 w-fit`}
                    >
                      <roleStyle.icon className="h-3 w-3" />
                      <span>{roleStyle.label}</span>
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${loyaltyStyle.badge} flex items-center space-x-1 w-fit`}
                    >
                      <loyaltyStyle.icon className="h-3 w-3" />
                      <span>{loyaltyStyle.label}</span>
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${statusStyle.badge} flex items-center space-x-1 w-fit`}
                    >
                      <statusStyle.icon className="h-3 w-3" />
                      <span>{user.status}</span>
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div>Tham gia {user.joinDate}</div>
                      <div className="text-gray-500">
                        Lần cuối: {formatLastLogin(user.lastLogin)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-center">
                      <div className="font-semibold">{user.totalBookings}</div>
                      <div className="text-xs text-gray-500">đặt vé</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-right font-medium">
                      <div className="font-semibold">
                        {user.totalSpent.toLocaleString("vi-VN")} VNĐ
                      </div>
                      <div className="text-xs text-gray-500">tổng</div>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={user.email === currentUser?.email}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onViewLoyalty && onViewLoyalty(user)}
                        >
                          <Crown className="mr-2 h-4 w-4" />
                          Xem điểm thưởng
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEditUser && onEditUser(user)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />

                        {user.status === "Hoạt động" ||
                        user.status === "Active" ? (
                          <DropdownMenuItem
                            onClick={() => onSuspendUser && onSuspendUser(user)}
                            className="text-orange-600 focus:text-orange-600"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Khóa tài khoản
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => onSuspendUser && onSuspendUser(user)}
                            className="text-green-600 focus:text-green-600"
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Mở khóa tài khoản
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Thay đổi vai trò</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuLabel>
                              Chọn vai trò mới
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {Object.keys(roleConfig)
                              .filter((role) => role !== "default")
                              .map((roleKey) => (
                                <DropdownMenuItem
                                  key={roleKey}
                                  disabled={user.role === roleKey}
                                  onClick={() =>
                                    onUpdateRole &&
                                    onUpdateRole(user.id, roleKey)
                                  }
                                >
                                  {roleConfig[roleKey].label}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteUser && onDeleteUser(user)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa người dùng
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <Pagination
          currentPage={pagination.page + 1}
          totalPages={pagination.totalPages}
          itemsPerPage={pagination.size}
          totalItems={pagination.totalElements}
          onPageChange={(page) => onPageChange && onPageChange(page - 1)}
          onPageSizeChange={(size) =>
            onPageSizeChange && onPageSizeChange(size)
          }
          showPageSizeSelector={true}
          showInfo={true}
        />
      )}

      {/* No Results */}
      {users.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không tìm thấy khách hàng nào
          </h3>
          <p className="text-gray-600">
            Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc
          </p>
        </div>
      )}

      {/* User Details Modal */}
      <UserDetailsModal
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        currentUser={currentUser}
        onEditUser={(user) => {
          setShowDetailsModal(false);
          onEditUser && onEditUser(user);
        }}
        onSuspendUser={(user) => {
          setShowDetailsModal(false);
          onSuspendUser && onSuspendUser(user);
        }}
        onDeleteUser={(user) => {
          setShowDetailsModal(false);
          onDeleteUser && onDeleteUser(user);
        }}
      />
    </div>
  );
};

export default UserTable;
