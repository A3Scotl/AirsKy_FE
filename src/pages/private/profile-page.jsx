import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Key,
  Settings,
  Bell,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Save,
  Upload,
  Lock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Database,
  Users,
  Plane,
} from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/apis/auth-api";
import { userApi } from "@/apis/user-api";
import { useAuth } from "@/contexts/auth-context";
import SessionInfo from "@/components/auth/session-info";

const AdminProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [profileData, setProfileData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    role: "",
    joinDate: "",
    lastLogin: "",
    status: "Active",
    permissions: [],
    profileImage: null,
    // Additional fields from user data
    dateOfBirth: "",
    avatar: null,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    flightAlerts: true,
    systemAlerts: true,
    securityAlerts: true,
    marketingEmails: false,
  });

  const [accountSettings, setAccountSettings] = useState({
    twoFactorAuth: true,
    sessionTimeout: "30",
    timezone: "UTC-5",
    language: "English",
    theme: "light",
  });

  // Admin statistics
  const [adminStats, setAdminStats] = useState({
    lastPasswordChange: "2024-12-15",
    handledTickets: 89,
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      try {
        setLoadingProfile(true);
        const response = await authApi.me();

        if (response.success && response.data) {
          const userData = response.data;
          setProfileData({
            id: userData.id || "",
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || user.email || "",
            phone: userData.phone || "",
            address: userData.address || "",
            role: userData.role || user.role || "",
            joinDate: userData.createdAt
              ? new Date(userData.createdAt).toISOString().split("T")[0]
              : "",
            lastLogin: userData.lastLogin || "",
            status: userData.status || "Active",
            permissions: userData.permissions || [],
            profileImage: userData.profileImage || null,
            // Additional fields
            dateOfBirth: userData.dateOfBirth
              ? new Date(userData.dateOfBirth).toISOString().split("T")[0]
              : "",
            avatar: userData.avatar || null,
          });
        } else {
          toast.error("Không thể tải thông tin profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Lỗi khi tải thông tin profile");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append("firstName", profileData.firstName.trim());
      formDataToSend.append("lastName", profileData.lastName.trim());
      formDataToSend.append("phone", profileData.phone.trim());
      formDataToSend.append("dateOfBirth", profileData.dateOfBirth || "");

      // Note: Avatar is handled separately in handleAvatarUpdate

      // Call API to update user with FormData
      const response = await userApi.updateUser(profileData.id, formDataToSend);

      if (response.success) {
        toast.success("Cập nhật thông tin thành công!");

        // Update local profile data with new values
        setProfileData((prev) => ({
          ...prev,
          firstName: response.data.firstName || prev.firstName,
          lastName: response.data.lastName || prev.lastName,
          phone: response.data.phone || prev.phone,
          dateOfBirth: response.data.dateOfBirth || prev.dateOfBirth,
        }));

        // Update auth context to reflect changes
        const updatedData = {
          id: profileData.id,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          fullName:
            `${response.data.firstName} ${response.data.lastName}`.trim(),
          phone: response.data.phone,
          dateOfBirth: response.data.dateOfBirth,
        };
        updateUser(updatedData);
      } else {
        toast.error(response.message || "Cập nhật thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu mới không khớp!");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.changePassword({
        email: profileData.email,
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        toast.success("Đổi mật khẩu thành công!");
      } else {
        toast.error(response.message || "Đổi mật khẩu thất bại!");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Đổi mật khẩu thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpdate = async () => {
    if (!avatarFile) {
      toast.error("Vui lòng chọn ảnh trước!");
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for avatar upload only
      const formDataToSend = new FormData();

      // Add avatar file
      formDataToSend.append("avatar", avatarFile);

      // Call API to update user avatar
      const response = await userApi.updateUser(profileData.id, formDataToSend);

      if (response.success) {
        toast.success("Cập nhật ảnh đại diện thành công!");

        // Update profile image with server response
        if (response.data.avatar) {
          setProfileData((prev) => ({
            ...prev,
            profileImage: response.data.avatar,
            avatar: response.data.avatar,
          }));
        }

        // Clear avatar file after successful upload
        setAvatarFile(null);

        // Update auth context
        const updatedData = {
          id: profileData.id,
          avatar: response.data.avatar,
        };
        updateUser(updatedData);
      } else {
        toast.error(response.message || "Cập nhật ảnh thất bại!");
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast.error("Cập nhật ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Super Administrator":
        return "bg-red-100 text-red-800";
      case "Administrator":
        return "bg-blue-100 text-blue-800";
      case "Manager":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh hợp lệ!");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh không được vượt quá 5MB!");
        return;
      }

      setAvatarFile(file);

      // Create preview for display
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileData({ ...profileData, profileImage: event.target.result });
      };
      reader.readAsDataURL(file);

      toast.success("Ảnh đã được chọn! Nhấn 'Cập nhật ảnh' để lưu.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-red-100 text-red-800";
      case "Suspended":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Show loading state while fetching profile data
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải thông tin profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trang cá nhân</h1>
            <p className="text-gray-600 mt-1">
              Quản lý cài đặt và tùy chọn tài khoản quản trị viên của bạn
            </p>
          </div>
          <Badge className={getRoleColor(profileData.role)}>
            <Shield className="h-4 w-4 mr-1" />
            {profileData.role}
          </Badge>
        </div>

        {/* Profile Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileData.avatar} alt="Profile" />
                  <AvatarFallback className="text-xl font-bold bg-blue-100">
                    {(profileData.firstName?.[0] || "").toUpperCase()}
                    {(profileData.lastName?.[0] || "").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="profile-upload"
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  <Upload className="h-3 w-3" />
                </label>
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">
                  {profileData.firstName} {profileData.lastName}
                </h2>
                <p className="text-gray-600">{profileData.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className={getStatusColor(profileData.status)}>
                    {profileData.status === "Active" && (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {profileData.status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    ID: {profileData.id}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Thông tin cá nhân
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Bảo mật
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Thông báo
            </TabsTrigger>
            <TabsTrigger value="session" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Session
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Cài đặt
            </TabsTrigger>
          </TabsList>

          {/* Profile Information Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Thông tin cá nhân
                  </CardTitle>
                  <CardDescription>
                    Cập nhật thông tin cá nhân và thông tin liên hệ của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Họ</Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              firstName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Tên</Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              lastName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            dateOfBirth: e.target.value,
                          })
                        }
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? "Đang cập nhật" : "Cập nhật thông tin"}
                    </Button>
                  </form>

                  {/* Avatar Upload Section */}
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      <Label className="text-base font-medium">
                        Cập nhật ảnh đại diện
                      </Label>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById("avatar-upload").click()
                          }
                          disabled={isLoading}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Chọn ảnh
                        </Button>
                      </div>

                      {avatarFile && (
                        <Button
                          type="button"
                          onClick={handleAvatarUpdate}
                          disabled={isLoading}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {isLoading ? "Đang tải lên..." : "Cập nhật ảnh"}
                        </Button>
                      )}
                    </div>

                    {avatarFile && (
                      <div className="text-sm text-gray-600">
                        Đã chọn: {avatarFile.name} (
                        {(avatarFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Thông tin quản trị
                  </CardTitle>
                  <CardDescription>
                    Thông tin về vai trò và quyền hạn của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Phòng ban
                      </Label>
                      <p className="text-sm font-semibold">
                        {profileData.department}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Ngày tham gia
                      </Label>
                      <p className="text-sm font-semibold flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(profileData.joinDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Lần đăng nhập cuối
                      </Label>
                      <p className="text-sm font-semibold flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(profileData.lastLogin).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <Separator />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Đổi mật khẩu
                  </CardTitle>
                  <CardDescription>
                    Cập nhật mật khẩu của bạn để giữ cho tài khoản của bạn an
                    toàn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Mật khẩu mới</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          required
                          minLength={8}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Xác nhận mật khẩu mới
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          required
                          minLength={8}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                      <p>Yêu cầu mật khẩu:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Ít nhất 8 ký tự</li>
                        <li>Bao gồm chữ hoa và chữ thường</li>
                        <li>Bao gồm ít nhất một số</li>
                        <li>Bao gồm ít nhất một ký tự đặc biệt</li>
                      </ul>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      {isLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Tùy chọn thông báo
                </CardTitle>
                <CardDescription>
                  Cấu hình cách bạn muốn nhận thông báo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Tùy chọn giao tiếp</h4>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-gray-600">
                          Nhận thông báo qua email
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            emailNotifications: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-gray-600">
                          Nhận thông báo qua SMS
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            smsNotifications: checked,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Thông báo hệ thống</h4>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Thông báo chuyến bay</Label>
                        <p className="text-sm text-gray-600">
                          Thông báo về sự chậm trễ, hủy chuyến, cập nhật
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.flightAlerts}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            flightAlerts: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Session Tab */}
          <TabsContent value="session">
            <SessionInfo />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Tùy chọn tài khoản
                </CardTitle>
                <CardDescription>
                  Cấu hình sở thích tài khoản và cài đặt hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select
                        value={accountSettings.timezone}
                        onValueChange={(value) =>
                          setAccountSettings({
                            ...accountSettings,
                            timezone: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC-8">
                            Giờ Thái Bình Dương (UTC-8)
                          </SelectItem>
                          <SelectItem value="UTC-7">Giờ Núi (UTC-7)</SelectItem>
                          <SelectItem value="UTC-6">
                            Giờ Trung (UTC-6)
                          </SelectItem>
                          <SelectItem value="UTC-5">
                            Giờ Miền Đông (UTC-5)
                          </SelectItem>
                          <SelectItem value="UTC+0">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Ngôn ngữ</Label>
                      <Select
                        value={accountSettings.language}
                        onValueChange={(value) =>
                          setAccountSettings({
                            ...accountSettings,
                            language: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">Tiếng Anh</SelectItem>
                          <SelectItem value="Spanish">
                            Tiếng Tây Ban Nha
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Chủ đề</Label>
                      <Select
                        value={accountSettings.theme}
                        onValueChange={(value) =>
                          setAccountSettings({
                            ...accountSettings,
                            theme: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Sáng</SelectItem>
                          <SelectItem value="dark">Tối</SelectItem>
                          <SelectItem value="system">
                            Tùy Chọn Hệ thống
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Cảnh báo quan trọng
                  </h4>
                  <div className="border border-red-200 rounded-lg p-4 space-y-3">
                    <div>
                      <h5 className="font-medium">Vô hiệu hóa tài khoản</h5>
                      <p className="text-sm text-gray-600">
                        Tạm thời vô hiệu hóa quyền truy cập quản trị viên của
                        bạn
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Yêu cầu vô hiệu hóa tài khoản
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminProfilePage;
