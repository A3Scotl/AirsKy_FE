import { useState } from "react";
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
} from "lucide-react";
import UserDetailsModal from "./user-details-modal";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserTable = ({
  users,
  searchQuery,
  statusFilter,
  roleFilter,
  currentUser,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onSuspendUser,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const itemsPerPage = 10;

  const getStatusBadge = (status) => {
    const variants = {
      "Hoạt động": "bg-green-100 text-green-800 border-green-200",
      "Đã khóa": "bg-red-100 text-red-800 border-red-200",
      "Đang chờ": "bg-yellow-100 text-yellow-800 border-yellow-200",
      Active: "bg-green-100 text-green-800 border-green-200",
      Suspended: "bg-red-100 text-red-800 border-red-200",
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getRoleBadge = (role) => {
    const variants = {
      CUSTOMER: "bg-blue-100 text-blue-800",
      Customer: "bg-blue-100 text-blue-800",
      Premium: "bg-purple-100 text-purple-800",
      Admin: "bg-orange-100 text-orange-800",
    };
    return variants[role] || "bg-gray-100 text-gray-800";
  };

  const getRoleIcon = (role) => {
    const icons = {
      CUSTOMER: User,
      Customer: User,
      Premium: Crown,
      Admin: Shield,
    };
    return icons[role] || User;
  };

  const getStatusIcon = (status) => {
    const icons = {
      "Hoạt động": CheckCircle,
      "Đã khóa": XCircle,
      "Đang chờ": Clock,
      Active: CheckCircle,
      Suspended: XCircle,
      Pending: Clock,
    };
    return icons[status] || CheckCircle;
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name?.toLowerCase() || "").includes(
        searchQuery?.toLowerCase() || ""
      ) ||
      (user.email?.toLowerCase() || "").includes(
        searchQuery?.toLowerCase() || ""
      ) ||
      (user.id?.toLowerCase() || "").includes(searchQuery?.toLowerCase() || "");

    const matchesStatus =
      statusFilter === "all" ||
      (user.status?.toLowerCase() || "") === statusFilter ||
      (statusFilter === "active" && user.status === "Hoạt động") ||
      (statusFilter === "suspended" && user.status === "Đã khóa");

    const matchesRole =
      roleFilter === "all" || (user.role?.toLowerCase() || "") === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
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

    if (diffDays === 0) {
      return "Hôm nay";
    } else if (diffDays === 1) {
      return "Hôm qua";
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return formatDate(dateTimeString);
    }
  };

  const getInitials = (name) => {
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
              <TableHead>Liên hệ</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Hoạt động</TableHead>
              <TableHead>Đặt vé</TableHead>
              <TableHead>Chi tiêu</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => {
              const StatusIcon = getStatusIcon(user.status);
              const RoleIcon = getRoleIcon(user.role);

              return (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-sm">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="truncate max-w-[150px]">
                          {user.email}
                        </span>
                        {user.verifiedEmail && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span>{user.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span>{user.country}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${getRoleBadge(
                        user.role
                      )} flex items-center space-x-1 w-fit`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      <span>{user.role}</span>
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${getStatusBadge(
                        user.status
                      )} flex items-center space-x-1 w-fit`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      <span>{user.status}</span>
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div>Tham gia {formatDate(user.joinDate)}</div>
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
                    <div className="text-right">
                      <div className="font-semibold">
                        ${user.totalSpent.toLocaleString()}
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
                        >
                          <span className="sr-only">Open menu</span>
                          <div className="h-4 w-4">⋯</div>
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
                          onClick={() => onEditUser && onEditUser(user)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Gửi email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === "Hoạt động" ||
                        user.status === "Active" ? (
                          <DropdownMenuItem
                            onClick={() => onSuspendUser && onSuspendUser(user)}
                            className="text-orange-600"
                            disabled={
                              user.id?.toString() ===
                              currentUser?.id?.toString()
                            }
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Khóa tài khoản
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => onSuspendUser && onSuspendUser(user)}
                            className="text-green-600"
                            disabled={
                              user.id?.toString() ===
                              currentUser?.id?.toString()
                            }
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Mở khóa tài khoản
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteUser && onDeleteUser(user)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa khách hàng
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{" "}
            {Math.min(currentPage * itemsPerPage, filteredUsers.length)} của{" "}
            {filteredUsers.length} khách hàng
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
            >
              Tiếp theo
            </Button>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredUsers.length === 0 && (
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
