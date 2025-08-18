import { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Download,
  Users,
  UserCheck,
  UserX,
  Crown,
  TrendingUp,
  Calendar,
  MapPin,
  Mail,
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

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [activeTab, setActiveTab] = useState("overview");

  // Mock user data
  const users = [
    {
      id: "USR001",
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1 (555) 123-4567",
      role: "Customer",
      status: "Active",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      joinDate: "2024-01-15",
      lastLogin: "2024-08-14 10:30",
      totalBookings: 12,
      totalSpent: 4250.0,
      country: "United States",
      verifiedEmail: true,
      preferences: {
        newsletter: true,
        smsNotifications: false,
        specialOffers: true,
      },
    },
    {
      id: "USR002",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1 (555) 234-5678",
      role: "Customer",
      status: "Active",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face",
      joinDate: "2024-02-20",
      lastLogin: "2024-08-15 08:15",
      totalBookings: 8,
      totalSpent: 2890.0,
      country: "Canada",
      verifiedEmail: true,
      preferences: {
        newsletter: true,
        smsNotifications: true,
        specialOffers: false,
      },
    },
    {
      id: "USR003",
      name: "Mike Davis",
      email: "mike.davis@email.com",
      phone: "+1 (555) 345-6789",
      role: "Premium",
      status: "Active",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      joinDate: "2023-11-10",
      lastLogin: "2024-08-13 15:45",
      totalBookings: 24,
      totalSpent: 8950.0,
      country: "United Kingdom",
      verifiedEmail: true,
      preferences: {
        newsletter: true,
        smsNotifications: true,
        specialOffers: true,
      },
    },
    {
      id: "USR004",
      name: "Emma Wilson",
      email: "emma.wilson@email.com",
      phone: "+44 20 1234 5678",
      role: "Customer",
      status: "Suspended",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      joinDate: "2024-03-05",
      lastLogin: "2024-08-10 12:20",
      totalBookings: 3,
      totalSpent: 890.0,
      country: "United Kingdom",
      verifiedEmail: false,
      preferences: {
        newsletter: false,
        smsNotifications: false,
        specialOffers: false,
      },
    },
    {
      id: "USR005",
      name: "Alex Brown",
      email: "alex.brown@email.com",
      phone: "+61 3 1234 5678",
      role: "Admin",
      status: "Active",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      joinDate: "2023-08-01",
      lastLogin: "2024-08-15 09:00",
      totalBookings: 0,
      totalSpent: 0.0,
      country: "Australia",
      verifiedEmail: true,
      preferences: {
        newsletter: true,
        smsNotifications: true,
        specialOffers: false,
      },
    },
  ];

  // User statistics
  const userStats = [
    {
      title: "Total Users",
      value: "8,429",
      change: "+12.3%",
      isPositive: true,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Active Users",
      value: "7,892",
      change: "+8.1%",
      isPositive: true,
      icon: UserCheck,
      color: "bg-green-500",
    },

    {
      title: "New Registrations",
      value: "156",
      change: "+23.4%",
      isPositive: true,
      icon: TrendingUp,
      color: "bg-orange-500",
    },
  ];

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

  const handleDeleteUser = (user) => {
    if (window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
      console.log("Delete user:", user);
      // Here you would implement the actual delete logic
      setShowDetailsModal(false);
    }
  };

  const handleSuspendUser = (user) => {
    if (window.confirm(`Are you sure you want to suspend user ${user.name}?`)) {
      console.log("Suspend user:", user);
      // Here you would implement the actual suspend logic
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setModalMode("add");
    setShowUserModal(true);
  };

  const handleSaveUser = (userData, isEdit) => {
    console.log(isEdit ? "Update user:" : "Add user:", userData);
    // Here you would implement the actual save/update logic
    setShowUserModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">
            Manage users, roles, and account settings
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="hidden sm:flex">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleAddUser}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {stat.value}
                    </p>
                    <div className="flex items-center mt-2 text-xs">
                      <TrendingUp
                        className={`h-3 w-3 mr-1 ${
                          stat.isPositive ? "text-green-500" : "text-red-500"
                        }`}
                      />
                      <span
                        className={
                          stat.isPositive ? "text-green-600" : "text-red-600"
                        }
                      >
                        {stat.change}
                      </span>
                      <span className="text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>
                  <div
                    className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage all user accounts and their details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <UserTable
                users={users}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                roleFilter={roleFilter}
                onViewUser={handleViewUser}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
                onSuspendUser={handleSuspendUser}
              />
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
