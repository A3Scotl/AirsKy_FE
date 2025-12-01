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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
  Calendar as CalendarIcon,
  CalendarCheck,
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
  Star,
  Award,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/apis/auth-api";
import { userApi } from "@/apis/user-api";
import { loyaltyApi } from "@/apis/loyalty-api";
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

  // Form submission states
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  // Initial data for comparison
  const [initialProfileData, setInitialProfileData] = useState({});
  const [initialPasswordData, setInitialPasswordData] = useState({});
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

  // Calendar state for date of birth
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Validation errors
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // Admin statistics
  const [adminStats, setAdminStats] = useState({
    lastPasswordChange: "2024-12-15",
    handledTickets: 89,
  });

  // Loyalty state
  const [loyaltyStats, setLoyaltyStats] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

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

  // Set initial data when profile data is loaded
  useEffect(() => {
    if (profileData && Object.keys(profileData).length > 0 && !loadingProfile) {
      setInitialProfileData({ ...profileData });
    }
  }, [profileData, loadingProfile]);

  // Set initial password data
  useEffect(() => {
    setInitialPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }, []);

  // Get loyalty tier display info based on enum value
  const getLoyaltyTierDisplay = (tier) => {
    switch (tier) {
      case "PLATINUM":
        return {
          name: "Platinum",
          icon: Shield,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        };
      case "GOLD":
        return {
          name: "Gold",
          icon: Award,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
        };
      case "SILVER":
        return {
          name: "Silver",
          icon: Star,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        };
      case "STANDARD":
      default:
        return {
          name: "Standard",
          icon: User,
          color: "text-orange-600",
          bgColor: "bg-orange-100",
        };
    }
  };

  // Validation functions
  const validateProfileField = (field, value) => {
    const errors = { ...profileErrors };

    switch (field) {
      case "firstName":
        if (!value.trim()) {
          errors.firstName = "Họ không được để trống";
        } else if (value.trim().length < 2) {
          errors.firstName = "Họ phải có ít nhất 2 ký tự";
        } else {
          delete errors.firstName;
        }
        break;
      case "lastName":
        if (!value.trim()) {
          errors.lastName = "Tên không được để trống";
        } else if (value.trim().length < 2) {
          errors.lastName = "Tên phải có ít nhất 2 ký tự";
        } else {
          delete errors.lastName;
        }
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          errors.email = "Email không được để trống";
        } else if (!emailRegex.test(value)) {
          errors.email = "Email không hợp lệ";
        } else {
          delete errors.email;
        }
        break;
      case "phone":
        const phoneRegex = /^[0-9+\-\s()]+$/;
        if (!value.trim()) {
          errors.phone = "Số điện thoại không được để trống";
        } else if (!phoneRegex.test(value)) {
          errors.phone = "Số điện thoại không hợp lệ";
        } else if (value.replace(/\D/g, "").length < 10) {
          errors.phone = "Số điện thoại phải có ít nhất 10 chữ số";
        } else {
          delete errors.phone;
        }
        break;
      case "dateOfBirth":
        if (!value) {
          errors.dateOfBirth = "Ngày sinh không được để trống";
        } else {
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 18) {
            errors.dateOfBirth = "Bạn phải từ 18 tuổi trở lên";
          } else if (age > 120) {
            errors.dateOfBirth = "Ngày sinh không hợp lệ";
          } else {
            delete errors.dateOfBirth;
          }
        }
        break;
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordField = (field, value) => {
    const errors = { ...passwordErrors };

    switch (field) {
      case "currentPassword":
        if (!value) {
          errors.currentPassword = "Mật khẩu hiện tại không được để trống";
        } else {
          delete errors.currentPassword;
        }
        break;
      case "newPassword":
        if (!value) {
          errors.newPassword = "Mật khẩu mới không được để trống";
        } else if (value.length < 8) {
          errors.newPassword = "Mật khẩu mới phải có ít nhất 8 ký tự";
        } else if (
          !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value)
        ) {
          errors.newPassword =
            "Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt";
        } else if (value === passwordData.currentPassword) {
          errors.newPassword =
            "Mật khẩu mới không được giống mật khẩu hiện tại";
        } else {
          delete errors.newPassword;
        }
        break;
      case "confirmPassword":
        if (!value) {
          errors.confirmPassword = "Xác nhận mật khẩu không được để trống";
        } else if (value !== passwordData.newPassword) {
          errors.confirmPassword = "Mật khẩu xác nhận không khớp";
        } else {
          delete errors.confirmPassword;
        }
        break;
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if profile data has changed
  const hasProfileChanged = () => {
    return JSON.stringify(profileData) !== JSON.stringify(initialProfileData);
  };

  // Check if password data has changed (only check if newPassword is filled)
  const hasPasswordChanged = () => {
    return (
      passwordData.newPassword.trim() !== "" &&
      passwordData.confirmPassword.trim() !== "" &&
      passwordData.currentPassword.trim() !== ""
    );
  };

  // Handle profile form changes with validation
  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    validateProfileField(field, value);
  };

  // Handle password form changes with validation
  const handlePasswordFieldChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    validatePasswordField(field, value);

    // Disable confirm password field when new password is empty
    if (field === "newPassword") {
      if (!value.trim()) {
        setPasswordData((prev) => ({ ...prev, confirmPassword: "" }));
        setPasswordErrors((prev) => {
          const errors = { ...prev };
          delete errors.confirmPassword;
          return errors;
        });
      }
    }
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    // Validate all profile fields
    const isValid = Object.keys(profileData).every((field) =>
      validateProfileField(field, profileData[field])
    );

    if (!isValid) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    setIsProfileSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật thông tin");
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validate all password fields
    const isValid = Object.keys(passwordData).every((field) =>
      validatePasswordField(field, passwordData[field])
    );

    if (!isValid) {
      toast.error("Vui lòng kiểm tra lại mật khẩu");
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Đổi mật khẩu thành công");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đổi mật khẩu");
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  // Fetch loyalty stats
  useEffect(() => {
    const fetchLoyaltyStats = async () => {
      try {
        setLoyaltyLoading(true);
        const stats = await loyaltyApi.getLoyaltyStats();
        setLoyaltyStats(stats);
      } catch (error) {
        console.error("Failed to fetch loyalty stats:", error);
        toast.error("Không thể tải thông tin điểm thưởng");
      } finally {
        setLoyaltyLoading(false);
      }
    };

    if (user) {
      fetchLoyaltyStats();
    }
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

  // Loyalty handlers
  const handleCheckTierUpgrade = async () => {
    try {
      setLoyaltyLoading(true);
      const updatedStats = await loyaltyApi.checkAndUpgradeTier();
      setLoyaltyStats(updatedStats);
      toast.success("Đã kiểm tra và cập nhật hạng thành viên!");
    } catch (error) {
      console.error("Failed to check tier upgrade:", error);
      toast.error("Không thể kiểm tra nâng hạng");
    } finally {
      setLoyaltyLoading(false);
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Đang tải thông tin profile...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center flex-wrap gap-3 justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Trang cá nhân
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
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
                  <AvatarFallback className="text-xl font-bold bg-blue-100 dark:bg-blue-900">
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
                <h2 className="text-2xl font-bold dark:text-white">
                  {profileData.firstName} {profileData.lastName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {profileData.email}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className={getStatusColor(profileData.status)}>
                    {profileData.status === "Active" && (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {profileData.status}
                  </Badge>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {profileData.id}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto p-1">
            <TabsTrigger
              value="profile"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-3"
            >
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-center">Thông tin</span>
            </TabsTrigger>
            <TabsTrigger
              value="loyalty"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-3"
            >
              <Award className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-center">Điểm thưởng</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-3"
            >
              <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-center">Bảo mật</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-3"
            >
              <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-center">Thông báo</span>
            </TabsTrigger>
            <TabsTrigger
              value="session"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-3"
            >
              <Database className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-center">Session</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-3"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-center">Cài đặt</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Information Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <User className="h-5 w-5" />
                    Thông tin cá nhân
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Cập nhật thông tin cá nhân và thông tin liên hệ của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="firstName"
                          className="dark:text-gray-300"
                        >
                          Họ
                        </Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          className="dark:text-black"
                          disabled={isProfileSubmitting}
                          onChange={(e) =>
                            handleProfileChange("firstName", e.target.value)
                          }
                        />
                        {profileErrors.firstName && (
                          <p className="text-sm text-red-500">
                            {profileErrors.firstName}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="lastName"
                          className="dark:text-gray-300"
                        >
                          Tên
                        </Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          className="dark:text-black"
                          disabled={isProfileSubmitting}
                          onChange={(e) =>
                            handleProfileChange("lastName", e.target.value)
                          }
                        />
                        {profileErrors.lastName && (
                          <p className="text-sm text-red-500">
                            {profileErrors.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="dark:text-gray-300">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        className="dark:text-black"
                        disabled={isProfileSubmitting}
                        onChange={(e) =>
                          handleProfileChange("email", e.target.value)
                        }
                      />
                      {profileErrors.email && (
                        <p className="text-sm text-red-500">
                          {profileErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="dark:text-gray-300">
                        Số điện thoại
                      </Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        className="dark:text-black"
                        disabled={isProfileSubmitting}
                        onChange={(e) =>
                          handleProfileChange("phone", e.target.value)
                        }
                      />
                      {profileErrors.phone && (
                        <p className="text-sm text-red-500">
                          {profileErrors.phone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="dateOfBirth"
                        className="dark:text-gray-300"
                      >
                        Ngày sinh
                      </Label>
                      <Popover
                        open={calendarOpen}
                        onOpenChange={setCalendarOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "flex-1 justify-start text-left font-normal dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
                              !profileData.dateOfBirth &&
                                "text-muted-foreground"
                            )}
                            disabled={isProfileSubmitting}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {profileData.dateOfBirth ? (
                              format(
                                new Date(profileData.dateOfBirth),
                                "dd/MM/yyyy"
                              )
                            ) : (
                              <span>Chọn ngày</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              profileData.dateOfBirth
                                ? new Date(profileData.dateOfBirth)
                                : undefined
                            }
                            onSelect={(date) => {
                              handleProfileChange(
                                "dateOfBirth",
                                date ? format(date, "yyyy-MM-dd") : ""
                              );
                              setCalendarOpen(false);
                            }}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            captionLayout="dropdown"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {profileErrors.dateOfBirth && (
                        <p className="text-sm text-red-500">
                          {profileErrors.dateOfBirth}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isProfileSubmitting}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isProfileSubmitting
                        ? "Đang cập nhật"
                        : "Cập nhật thông tin"}
                    </Button>
                  </form>

                  {/* Avatar Upload Section */}
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      <Label className="text-base font-medium dark:text-gray-300">
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
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Đã chọn: {avatarFile.name} (
                        {(avatarFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Shield className="h-5 w-5" />
                    Thông tin quản trị
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Thông tin về vai trò và quyền hạn của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Phòng ban
                      </Label>
                      <p className="text-sm font-semibold dark:text-white">
                        {profileData.department}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Ngày tham gia
                      </Label>
                      <div className="text-sm font-semibold flex items-center gap-1 dark:text-white">
                        <CalendarCheck className="h-4 w-4" />
                        {profileData.joinDate}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Lần đăng nhập cuối
                      </Label>
                      <p className="text-sm font-semibold flex items-center gap-1 dark:text-white">
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

          {/* Loyalty Tab */}
          <TabsContent value="loyalty">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Award className="h-5 w-5" />
                  Chương trình điểm thưởng
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Theo dõi điểm thưởng và hạng thành viên của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loyaltyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="dark:text-gray-300">
                      Đang tải thông tin...
                    </span>
                  </div>
                ) : loyaltyStats ? (
                  <div className="space-y-6">
                    {/* Current Tier */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-800">
                      <div className="flex items-center space-x-3">
                        {(() => {
                          const tierInfo = getLoyaltyTierDisplay(
                            loyaltyStats.currentTier
                          );
                          const IconComponent = tierInfo.icon;
                          return (
                            <>
                              <div
                                className={`p-2 rounded-full ${tierInfo.bgColor}`}
                              >
                                <IconComponent
                                  className={`h-6 w-6 ${tierInfo.color}`}
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-lg dark:text-white">
                                  {tierInfo.name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Hạng thành viên hiện tại
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <Button
                        onClick={handleCheckTierUpgrade}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg dark:border-gray-600">
                        <div className="flex items-center space-x-2 mb-2">
                          <Star className="h-5 w-5 text-yellow-500" />
                          <span className="font-medium dark:text-gray-300">
                            Điểm thưởng
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {loyaltyStats.currentPoints?.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          điểm
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg dark:border-gray-600">
                        <div className="flex items-center space-x-2 mb-2">
                          <Plane className="h-5 w-5 text-blue-500" />
                          <span className="font-medium dark:text-gray-300">
                            Chuyến bay hoàn thành
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {loyaltyStats.completedBookings?.toLocaleString() ||
                            0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          chuyến
                        </p>
                      </div>
                    </div>

                    {/* Next Tier Progress */}
                    {loyaltyStats.nextTier &&
                      loyaltyStats.nextTierRequirements && (
                        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-600">
                          <h4 className="font-semibold mb-3 flex items-center dark:text-white">
                            <Award className="h-5 w-5 mr-2 text-purple-500" />
                            Tiến độ nâng hạng tiếp theo
                          </h4>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm dark:text-gray-300">
                                Hạng{" "}
                                {
                                  getLoyaltyTierDisplay(loyaltyStats.nextTier)
                                    .name
                                }
                              </span>
                              <span className="text-sm font-medium dark:text-white">
                                {Math.round(
                                  (loyaltyStats.overallProgress || 0) * 100
                                )}
                                %
                              </span>
                            </div>

                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
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
                                <span className="text-gray-600 dark:text-gray-400">
                                  Điểm cần thêm:
                                </span>
                                <span className="font-medium ml-1 dark:text-white">
                                  {Math.max(
                                    0,
                                    (loyaltyStats.nextTierRequirements.points ||
                                      0) - (loyaltyStats.currentPoints || 0)
                                  )}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">
                                  Chuyến bay cần thêm:
                                </span>
                                <span className="font-medium ml-1 dark:text-white">
                                  {Math.max(
                                    0,
                                    (loyaltyStats.nextTierRequirements
                                      .bookings || 0) -
                                      (loyaltyStats.completedBookings || 0)
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Tier Benefits */}
                    <div className="p-4 border rounded-lg dark:border-gray-600">
                      <h4 className="font-semibold mb-3 dark:text-white">
                        Quyền lợi hạng{" "}
                        {getLoyaltyTierDisplay(loyaltyStats.currentTier).name}
                      </h4>
                      <div className="space-y-2 text-sm">
                        {loyaltyStats.currentTier === "PLATINUM" && (
                          <>
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-blue-500" />
                              <span className="dark:text-gray-300">
                                Ưu tiên check-in và chọn ghế
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-blue-500" />
                              <span className="dark:text-gray-300">
                                Miễn phí hành lý ký gửi
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-blue-500" />
                              <span className="dark:text-gray-300">
                                Phòng chờ hạng thương gia
                              </span>
                            </div>
                          </>
                        )}
                        {loyaltyStats.currentTier === "GOLD" && (
                          <>
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="dark:text-gray-300">
                                Ưu tiên check-in
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="dark:text-gray-300">
                                Giảm 20% hành lý thêm
                              </span>
                            </div>
                          </>
                        )}
                        {loyaltyStats.currentTier === "SILVER" && (
                          <>
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-gray-500" />
                              <span className="dark:text-gray-300">
                                Giảm 10% hành lý thêm
                              </span>
                            </div>
                          </>
                        )}
                        {loyaltyStats.currentTier === "STANDARD" && (
                          <>
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-orange-500" />
                              <span className="dark:text-gray-300">
                                Tích điểm cho mỗi chuyến bay
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Không thể tải thông tin điểm thưởng
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Key className="h-5 w-5" />
                    Đổi mật khẩu
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Cập nhật mật khẩu của bạn để giữ cho tài khoản của bạn an
                    toàn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="currentPassword"
                        className="dark:text-gray-300"
                      >
                        Mật khẩu hiện tại
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          className="dark:text-black"
                          disabled={isPasswordSubmitting}
                          onChange={(e) =>
                            handlePasswordFieldChange(
                              "currentPassword",
                              e.target.value
                            )
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
                          disabled={isPasswordSubmitting}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="text-sm text-red-500">
                          {passwordErrors.currentPassword}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="newPassword"
                        className="dark:text-gray-300"
                      >
                        Mật khẩu mới
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          className="dark:text-black"
                          disabled={isPasswordSubmitting}
                          onChange={(e) =>
                            handlePasswordFieldChange(
                              "newPassword",
                              e.target.value
                            )
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
                          disabled={isPasswordSubmitting}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="text-sm text-red-500">
                          {passwordErrors.newPassword}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="dark:text-gray-300"
                      >
                        Xác nhận mật khẩu mới
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          className="dark:text-black"
                          disabled={
                            isPasswordSubmitting ||
                            !passwordData.newPassword.trim()
                          }
                          onChange={(e) =>
                            handlePasswordFieldChange(
                              "confirmPassword",
                              e.target.value
                            )
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
                          disabled={
                            isPasswordSubmitting ||
                            !passwordData.newPassword.trim()
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="text-sm text-red-500">
                          {passwordErrors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md dark:bg-gray-800 dark:text-gray-400">
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
                      disabled={isPasswordSubmitting}
                      className="w-full"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      {isPasswordSubmitting
                        ? "Đang đổi mật khẩu"
                        : "Đổi mật khẩu"}
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
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Bell className="h-5 w-5" />
                  Tùy chọn thông báo
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Cấu hình cách bạn muốn nhận thông báo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium dark:text-gray-300">
                      Tùy chọn giao tiếp
                    </h4>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="dark:text-gray-300">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
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
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium dark:text-gray-300">
                      Thông báo hệ thống
                    </h4>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="dark:text-gray-300">
                          Thông báo chuyến bay
                        </Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
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
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Settings className="h-5 w-5" />
                  Tùy chọn tài khoản
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Cấu hình sở thích tài khoản và cài đặt hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="dark:text-gray-300">Ngôn ngữ</Label>
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
                      <Label className="dark:text-gray-300">Chủ đề</Label>
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
                  <h4 className="font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Cảnh báo quan trọng
                  </h4>
                  <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3 bg-red-50 dark:bg-red-900/20">
                    <div>
                      <h5 className="font-medium dark:text-white">
                        Vô hiệu hóa tài khoản
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Tạm thời vô hiệu hóa quyền truy cập quản trị viên của
                        bạn
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
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
