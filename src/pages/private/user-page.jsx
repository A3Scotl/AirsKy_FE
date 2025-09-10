import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Download,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UserTable from "@/components/admin/users/user-table";
import UserFormModal from "@/components/admin/users/user-form-modal";
import UserDetailsModal from "@/components/admin/users/user-details-modal";
import { userApi } from "@/apis/user-api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch users from API with server-side filtering and pagination
  const fetchUsers = async (params = {}) => {
    try {
      setLoading(true);
      const apiParams = {
        page: params.page ?? pagination.page,
        size: params.size ?? pagination.size,
        search: params.search ?? searchQuery,
      };

      // Add status filter if not 'all'
      if (statusFilter !== "all") {
        apiParams.active = statusFilter === "Hoạt động";
      }

      // Add role filter if not 'all'
      if (roleFilter !== "all") {
        apiParams.role = roleFilter;
      }

      const response = await userApi.getAllUsers(apiParams);

      console.log("User API Response:", response);
      console.log("Current User:", currentUser);
      console.log("Current User ID:", currentUser?.id);
      console.log("Current User type of ID:", typeof currentUser?.id);

      if (response.success && response.data?.content) {
        // Filter out current admin user
        const filteredUsers = response.data.content.filter(
          (user) => user?.id?.toString() !== currentUser?.id?.toString()
        );

        console.log("Original content:", response.data.content.length, "users");
        console.log("Filtered Users:", filteredUsers.length, "users");
        console.log("Current user ID:", currentUser?.id);
        console.log(
          "User IDs in content:",
          response.data.content.map((u) => u.id)
        );

        const transformedUsers = filteredUsers.map((user) => ({
          id: user?.id?.toString() || "N/A",
          name:
            `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "N/A",
          email: user?.email || "N/A",
          phone: user?.phone || "N/A",
          role: user?.role || "CUSTOMER",
          status: user?.active ? "Hoạt động" : "Đã khóa",
          active: user?.active,
          avatar: null,
          joinDate: user?.createdAt
            ? new Date(user.createdAt).toISOString().split("T")[0]
            : "N/A",
          lastLogin: user?.lastLogin
            ? new Date(user.lastLogin).toISOString()
            : null,
          totalBookings: 0, // TODO: Fetch from API if available
          totalSpent: 0, // TODO: Fetch from API if available
          country: "", // TODO: Fetch from API if available
          verifiedEmail: user?.verified || false,
          preferences: {
            newsletter: false,
            smsNotifications: false,
            specialOffers: false,
          },
        }));

        console.log(
          "Setting users to state:",
          transformedUsers.length,
          "users"
        );
        console.log("Users state before set:", users.length, "users");

        setUsers(transformedUsers);

        setPagination({
          page: response.data?.pageable?.pageNumber ?? 0,
          size: response.data?.pageable?.pageSize ?? 10,
          totalElements: response.data?.totalElements ?? 0,
          totalPages: response.data?.totalPages ?? 0,
        });

        // Calculate stats from response or users
        const totalCustomers = response.data?.totalElements ?? 0;
        const activeCustomers =
          transformedUsers?.filter((u) => u.active).length ?? 0;
        const newRegistrations =
          transformedUsers?.filter(
            (u) =>
              u.joinDate !== "N/A" &&
              new Date(u.joinDate) >
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length ?? 0; // Last 30 days, adjust as needed

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
    if (window.confirm(`Bạn có chắc chắn muốn xóa khách hàng ${user.name}?`)) {
      try {
        const response = await userApi.deleteUser(user.id);
        if (response.success) {
          toast.success("Xóa khách hàng thành công");
          fetchUsers();
        } else {
          toast.error("Không thể xóa khách hàng: " + response.message);
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Lỗi khi xóa khách hàng");
      }
      setShowDetailsModal(false);
    }
  };

  const handleSuspendUser = async (user) => {
    const newActive = !user.active;
    const action = newActive ? "mở khóa" : "khóa";

    console.log(
      "Toggle user:",
      user.name,
      "from",
      user.active,
      "to",
      newActive
    );

    if (
      window.confirm(
        `Bạn có chắc chắn muốn ${action} tài khoản của khách hàng ${user.name}?`
      )
    ) {
      try {
        const response = await userApi.toggleActive(user.id, {
          active: newActive,
        });

        console.log("Toggle response:", response);

        if (response.success) {
          toast.success(
            `${
              action.charAt(0).toUpperCase() + action.slice(1)
            } tài khoản thành công`
          );
          fetchUsers(); // Refresh the list
        } else {
          toast.error(
            `Không thể ${action} tài khoản: ` +
              (response.message || "Lỗi không xác định")
          );
        }
      } catch (error) {
        console.error("Error toggling user status:", error);
        toast.error(`Lỗi khi ${action} tài khoản`);
      }
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setModalMode("add");
    setShowUserModal(true);
  };

  const handleSaveUser = async (userData, isEdit) => {
    try {
      let response;
      if (isEdit) {
        response = await userApi.updateUser(selectedUser.id, userData);
      } else {
        // Implement createUser if available
        // response = await userApi.createUser(userData);
        // For now:
        toast.info("Chức năng tạo khách hàng chưa được triển khai");
        setShowUserModal(false);
        return;
      }

      if (response.success) {
        toast.success(`Cập nhật khách hàng thành công`);
        fetchUsers();
        setShowUserModal(false);
      } else {
        toast.error(`Không thể cập nhật khách hàng: ` + response.message);
      }
    } catch (error) {
      console.error(`Error saving user:`, error);
      toast.error(`Lỗi khi lưu khách hàng`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý khách hàng
          </h1>
          <p className="text-gray-600">
            Quản lý khách hàng, vai trò và cài đặt tài khoản
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="hidden sm:flex">
            <Download className="h-4 w-4 mr-2" />
            Xuất
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleAddUser}
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm khách hàng
          </Button>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Tổng khách hàng
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
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
                <p className="text-sm font-medium text-gray-600">
                  Khách hàng hoạt động
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
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
                <p className="text-sm font-medium text-gray-600">
                  Đăng ký mới (30 ngày)
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
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

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý khách hàng</CardTitle>
              <CardDescription>
                Xem và quản lý tất cả tài khoản khách hàng và chi tiết của họ
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
                    className="pl-10"
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
                    <SelectItem value="CUSTOMER">Khách hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">
                    Đang tải danh sách khách hàng...
                  </span>
                </div>
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
                  pagination={pagination}
                  onPageChange={(newPage) => fetchUsers({ page: newPage })}
                  onPageSizeChange={(newSize) =>
                    fetchUsers({ size: newSize, page: 0 })
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
      />
    </div>
  );
};

export default AdminUsers;
