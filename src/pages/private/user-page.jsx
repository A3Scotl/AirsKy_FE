import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Download,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Loader2,
  RotateCcw,
  Award,
  Star,
  Plane,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import UserTable from "@/components/admin/users/user-table";
import UserFormModal from "@/components/admin/users/user-form-modal";
import UserDetailsModal from "@/components/admin/users/user-details-modal";
import { userApi } from "@/apis/user-api";
import { loyaltyApi } from "@/apis/loyalty-api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState("add");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [loyaltyStats, setLoyaltyStats] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  });
  const [userStats, setUserStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newRegistrations: 0,
  });

  const UserTableSkeleton = ({ rows = 10 }) => (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-5 w-full" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </TableCell>
              {Array.from({ length: 7 }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  // Fetch users from API with client-side filtering and pagination
  const fetchUsers = async (params = {}) => {
    try {
      setLoading(true);

      // If filters are applied, fetch all data for client-side filtering
      const hasFilters = statusFilter !== "all" || roleFilter !== "all";
      const apiParams = {
        page: hasFilters
          ? 0
          : params.page !== undefined
          ? params.page
          : pagination.page,
        size: hasFilters
          ? 1000
          : params.size !== undefined
          ? params.size
          : pagination.size,
        search: params.search ?? searchQuery,
      };

      const response = await userApi.getAllUsers(apiParams);

      if (response.success && response.data?.content) {

        let allUsers = response.data.content;

        let finalUsers;
        let finalPagination;

        if (hasFilters) {
          // Apply client-side filters
          let filteredUsers = allUsers;

          if (statusFilter !== "all") {
            const isActive = statusFilter === "Hoạt động";
            filteredUsers = filteredUsers.filter(
              (user) => user?.active === isActive
            );
          }

          if (roleFilter !== "all") {
            filteredUsers = filteredUsers.filter(
              (user) => user?.role === roleFilter
            );
          }

          // Implement client-side pagination for filtered results
          const pageSize = params.size ?? pagination.size;
          const totalFiltered = filteredUsers.length;
          const totalPages = Math.ceil(totalFiltered / pageSize);

          // Reset to page 0 if current page is out of bounds after filtering
          let currentPage = params.page ?? pagination.page;
          if (currentPage >= totalPages && totalPages > 0) {
            currentPage = 0;
          }

          const startIndex = currentPage * pageSize;
          const endIndex = startIndex + pageSize;
          finalUsers = filteredUsers.slice(startIndex, endIndex);

          finalPagination = {
            page: currentPage,
            size: pageSize,
            totalElements: totalFiltered,
            totalPages: totalPages,
          };
        } else {
          // No filters - use server-side pagination
          finalUsers = allUsers;
          finalPagination = {
            page: params.page ?? pagination.page,
            size: params.size ?? pagination.size,
            totalElements: response.data.totalElements || allUsers.length,
            totalPages:
              response.data.totalPages ||
              Math.ceil(
                (response.data.totalElements || allUsers.length) /
                  (params.size ?? pagination.size)
              ),
          };
        }

        // Transform users for display
        const transformedUsers = finalUsers.map((user) => ({
          id: user?.id?.toString() || "N/A",
          name:
            `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "N/A",
          email: user?.email || "N/A",
          phone: user?.phone || "N/A",
          role: user?.role || "CUSTOMER",
          status: user?.active ? "Hoạt động" : "Đã khóa",
          active: user?.active || false,
          avatar: user?.avatar || null,
          joinDate: user?.createdAt
            ? new Date(user.createdAt).toLocaleDateString("vi-VN")
            : "N/A",
          lastLogin: user?.lastLogin
            ? new Date(user.lastLogin).toISOString()
            : null,
          totalBookings: user?.totalBookings || 0,
          totalSpent: user?.totalSpent || 0,
          country: "", // TODO: Fetch from API if available
          verifiedEmail: user?.verified || false,
          preferences: {
            newsletter: false,
            smsNotifications: false,
            specialOffers: false,
          },
          loyaltyPoints: user?.loyaltyPoints || 0,
          loyaltyTier: user?.loyaltyTier || "-",
        }));

        setUsers(transformedUsers);

        setPagination(finalPagination);

        // If API didn't provide totalBookings/totalSpent for users on this page,
        // fetch per-user stats for current page to show accurate numbers in table.
        (async () => {
          try {
            const toFetch = finalUsers.map((u, idx) => ({ u, idx }));
            const statsPromises = toFetch.map(async ({ u, idx }) => {
              // Only call if backend did not include totals (check if properties exist)
              if (
                !("totalBookings" in u) ||
                !("totalSpent" in u) ||
                u.totalBookings === 0 ||
                u.totalSpent === 0
              ) {
                try {
                  const resp = await userApi.getUserBookingStats(u.id);
                  if (resp.success && resp.data) {
                    return { idx, data: resp.data };
                  }
                } catch (e) {
                  return null;
                }
              }
              return null;
            });

            const statsResults = await Promise.all(statsPromises);
            let updated = [...transformedUsers];
            let changed = false;
            statsResults.forEach((r) => {
              if (r && r.data) {
                const { idx, data } = r;
                // Map to transformedUsers index
                if (updated[idx]) {
                  updated[idx] = {
                    ...updated[idx],
                    totalBookings:
                      data.totalBookings ?? updated[idx].totalBookings,
                    totalSpent: data.totalSpent ?? updated[idx].totalSpent,
                  };
                  changed = true;
                }
              }
            });

            if (changed) setUsers(updated);
          } catch (e) {
            console.error("Failed to fetch per-user booking stats:", e);
          }
        })();

        // Calculate stats
        let totalCustomers, activeCustomers, newRegistrations;

        if (hasFilters) {
          // When filters are applied, allUsers contains all data
          totalCustomers = allUsers.length;
          activeCustomers = allUsers.filter((u) => u.active).length;
          newRegistrations = allUsers.filter(
            (u) =>
              u.createdAt &&
              new Date(u.createdAt) >
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length;
        } else {
          // When no filters, use API metadata for accurate totals
          totalCustomers = response.data.totalElements || allUsers.length;
          // For active customers and new registrations, we need to calculate from current page
          // This is approximate since we don't have full data
          activeCustomers = allUsers.filter((u) => u.active).length;
          newRegistrations = allUsers.filter(
            (u) =>
              u.createdAt &&
              new Date(u.createdAt) >
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length;
          // TODO: Consider fetching separate stats endpoint for accurate numbers
        }

        setUserStats({
          totalCustomers,
          activeCustomers,
          newRegistrations,
        });
      } else {
        toast.error(
          "Không thể tải danh sách người dùng: " +
            (response.message || "Dữ liệu không hợp lệ")
        );
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Lỗi khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers({ page: 0 });
  }, [searchQuery, statusFilter, roleFilter]);

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setModalMode("edit");
    setShowUserModal(true);
    setShowDetailsModal(false);
  };

  const handleDeleteUser = async (user) => {
    setConfirmModal({
      isOpen: true,
      title: `Xác nhận xóa người dùng`,
      description: `Bạn có chắc chắn muốn xóa vĩnh viễn người dùng "${user.name}"? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          const response = await userApi.deleteUser(user.id);
          if (response.success) {
            toast.success("Xóa người dùng thành công");
            fetchUsers();
          } else {
            toast.error("Không thể xóa người dùng: " + response.message);
          }
        } catch (error) {
          toast.error("Lỗi khi xóa người dùng");
        } finally {
          setIsActionLoading(false);
          setConfirmModal({ ...confirmModal, isOpen: false });
          setShowDetailsModal(false);
        }
      },
    });
  };

  const handleSuspendUser = async (user) => {
    const newActive = !user.active;
    const action = newActive ? "mở khóa" : "khóa";
    setConfirmModal({
      isOpen: true,
      title: `Xác nhận ${action} tài khoản`,
      description: `Bạn có chắc chắn muốn ${action} tài khoản của người dùng "${user.name}"?`,
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          const response = await userApi.toggleActive(user.id);
          if (response.success) {
            toast.success(
              `${
                action.charAt(0).toUpperCase() + action.slice(1)
              } tài khoản thành công`
            );
            fetchUsers();
          } else {
            toast.error(
              `Không thể ${action} tài khoản: ` +
                (response.message || "Lỗi không xác định")
            );
          }
        } catch (error) {
          toast.error(`Lỗi khi ${action} tài khoản`);
        } finally {
          setIsActionLoading(false);
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
    });
  };

  const handleUpdateRole = async (userId, newRole) => {
    setConfirmModal({
      isOpen: true,
      title: "Xác nhận thay đổi vai trò",
      description: `Bạn có chắc chắn muốn thay đổi vai trò của người dùng này thành ${newRole}?`,
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          const response = await userApi.updateUserRole(userId, newRole);
          if (response.success) {
            toast.success("Cập nhật vai trò người dùng thành công!");
            fetchUsers();
          } else {
            toast.error(
              "Không thể cập nhật vai trò: " +
                (response.message || "Lỗi không xác định")
            );
          }
        } catch (error) {
          toast.error("Lỗi khi cập nhật vai trò người dùng.");
        } finally {
          setIsActionLoading(false);
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
    });
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setModalMode("add");
    setShowUserModal(true);
  };

  const handleSaveUser = async (userData, isEdit) => {
    try {
      if (isEdit) {
        // userData is the response from updateUser API in modal
        toast.success("Cập nhật người dùng thành công");
        fetchUsers();
        setShowUserModal(false);
      } else {
        // For add mode, call fetchUsers to get fresh data from server
        toast.success("Tạo người dùng thành công");
        fetchUsers();
        setShowUserModal(false);
      }
    } catch (error) {
      console.error(`Error saving user:`, error);
      toast.error(`Lỗi khi lưu người dùng`);
    }
  };

  const handleRefresh = () => {
    toast.promise(fetchUsers(), {
      loading: "Đang tải lại danh sách...",
      success: "Đã cập nhật danh sách người dùng!",
      error: "Lỗi khi tải lại danh sách",
    });
  };

  // Loyalty handlers
  const handleViewLoyalty = async (user) => {
    setSelectedUser(user);
    setLoyaltyLoading(true);
    setShowLoyaltyModal(true);
    try {
      const stats = await loyaltyApi.adminGetLoyaltyStats(user.id);
      setLoyaltyStats(stats);
    } catch (error) {
      console.error("Failed to fetch loyalty stats:", error);
      toast.error("Không thể tải thông tin điểm thưởng");
      setShowLoyaltyModal(false);
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const handleCheckUpgrade = async () => {
    if (!selectedUser) return;

    try {
      setLoyaltyLoading(true);
      await loyaltyApi.adminCheckUpgrade(selectedUser.id);
      // Refresh loyalty stats after upgrade check
      const updatedStats = await loyaltyApi.adminGetLoyaltyStats(
        selectedUser.id
      );
      setLoyaltyStats(updatedStats);
      toast.success("Đã kiểm tra và cập nhật hạng thành viên!");
    } catch (error) {
      console.error("Failed to check tier upgrade:", error);
      toast.error("Không thể kiểm tra nâng hạng");
    } finally {
      setLoyaltyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between flex-wrap gap-3 items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý người dùng
          </h1>
          <p className="text-gray-600">
            Quản lý người dùng, vai trò và cài đặt tài khoản
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
   
          <Button onClick={handleAddUser} className="flex items-center gap-2 ">
            <Plus className="h-4 w-4 mr-2" />
            Thêm người dùng
          </Button>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600  dark:text-white">
                  Tổng người dùng
                </p>
                <p className="text-2xl font-bold text-gray-900  dark:text-white mt-2">
                  {userStats.totalCustomers}
                </p>
                {/* Change calculation can be added if needed */}
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-white ">
                  Tài khoản đã được kích hoạt 
                </p>
                <p className="text-2xl font-bold text-gray-900  dark:text-white mt-2">
                  {userStats.activeCustomers}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600  dark:text-white">
                  Đang hoạt động
                </p>
                <p className="text-2xl font-bold text-gray-900  dark:text-white mt-2">
                  {userStats.activeCustomers}
                </p>
                {/* Change calculation can be added if needed */}
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600  dark:text-white">
                  Đăng ký mới (30 ngày)
                </p>
                <p className="text-2xl font-bold text-gray-900  dark:text-white mt-2">
                  {userStats.newRegistrations}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Quản lý người dùng</CardTitle>
          <CardDescription>
            Xem và quản lý tất cả tài khoản người dùng và chi tiết của họ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên, email, hoặc ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:text-black"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Hoạt động">Đang hoạt động</SelectItem>
                <SelectItem value="Đã khóa">Đã khóa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Lọc theo vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                <SelectItem value="CUSTOMER">người dùng</SelectItem>
                <SelectItem value="BUSINESS">Doanh nghiệp</SelectItem>
                <SelectItem value="STAFF">Nhân viên</SelectItem>
                <SelectItem value="FLIGHT_MANAGER">
                  Quản lý chuyến bay
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <UserTableSkeleton rows={pagination.size} />
          ) : (
            <UserTable
              users={users}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              roleFilter={roleFilter}
              currentUser={currentUser}
              onViewUser={handleViewUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onSuspendUser={handleSuspendUser}
              onUpdateRole={handleUpdateRole}
              onViewLoyalty={handleViewLoyalty}
              pagination={pagination}
              onPageChange={(newPage) => fetchUsers({ page: newPage })}
              onPageSizeChange={(newSize) =>
                fetchUsers({ size: newSize, page: 0 })
              }
            />
          )}
        </CardContent>
      </Card>

      {/* User Form Modal */}
      <UserFormModal
        open={showUserModal}
        onClose={() => setShowUserModal(false)}
        onSave={handleSaveUser}
        user={selectedUser}
        mode={modalMode}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        currentUser={currentUser}
      />

      {/* Loyalty Modal */}
      <AlertDialog
        open={showLoyaltyModal}
        onOpenChange={(isOpen) => {
          setShowLoyaltyModal(isOpen);
          if (!isOpen) {
            setLoyaltyStats(null);
            setSelectedUser(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5 text-yellow-500" />
              Thông tin điểm thưởng - {selectedUser?.name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Xem và quản lý điểm thưởng và hạng thành viên
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-6">
            {loyaltyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Đang tải...</span>
              </div>
            ) : loyaltyStats ? (
              <>
                {/* Current Tier */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Award className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {loyaltyStats.currentTier === "PLATINUM"
                          ? "Platinum"
                          : loyaltyStats.currentTier === "GOLD"
                          ? "Gold"
                          : loyaltyStats.currentTier === "SILVER"
                          ? "Silver"
                          : "Standard"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Hạng thành viên hiện tại
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleCheckUpgrade}
                    disabled={loyaltyLoading}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {loyaltyLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Award className="h-4 w-4 mr-2" />
                    )}
                    Kiểm tra nâng hạng
                  </Button>
                </div>

                {/* Points and Bookings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium">Điểm thưởng</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {loyaltyStats.currentPoints?.toLocaleString() || 0}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Plane className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Chuyến bay hoàn thành</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {loyaltyStats.completedBookings?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                {/* Next Tier Progress */}
                {loyaltyStats.nextTier && loyaltyStats.nextTierRequirements && (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-semibold mb-3">
                      Tiến độ nâng hạng tiếp theo
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          Hạng{" "}
                          {loyaltyStats.nextTier === "PLATINUM"
                            ? "Platinum"
                            : loyaltyStats.nextTier === "GOLD"
                            ? "Gold"
                            : loyaltyStats.nextTier === "SILVER"
                            ? "Silver"
                            : "Standard"}
                        </span>
                        <span className="text-sm font-medium">
                          {Math.round(
                            (loyaltyStats.overallProgress || 0) * 100
                          )}
                          %
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              (loyaltyStats.overallProgress || 0) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Điểm cần thêm:</span>
                          <span className="font-medium ml-1">
                            {Math.max(
                              0,
                              (loyaltyStats.nextTierRequirements.points || 0) -
                                (loyaltyStats.currentPoints || 0)
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">
                            Chuyến bay cần thêm:
                          </span>
                          <span className="font-medium ml-1">
                            {Math.max(
                              0,
                              (loyaltyStats.nextTierRequirements.bookings ||
                                0) - (loyaltyStats.completedBookings || 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Không thể tải thông tin điểm thưởng
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Đóng</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Modal */}
      <AlertDialog
        open={confirmModal.isOpen}
        onOpenChange={(isOpen) => setConfirmModal({ ...confirmModal, isOpen })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmModal.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmModal.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmModal.onConfirm}
              disabled={isActionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
