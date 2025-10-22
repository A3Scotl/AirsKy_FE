import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageUpload from "@/components/ui/image-upload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AlertCircle,
  Edit,
  Lock,
  User,
  Loader2,
  Eye,
  EyeOff,
  Plus,
  Unlink,
  Verified,
  Facebook,
  Twitter,
  Instagram,
  Star,
  Shield,
  Award,
  Plane,
} from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/apis/auth-api";
import { userApi } from "@/apis/user-api";
import { loyaltyApi } from "@/apis/loyalty-api";
import { userProfileUtils } from "@/hooks/use-user-profile";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";

const AccountTab = ({ userProfile, onProfileUpdate }) => {
  const { logout, user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Optimized form state
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || "",
    lastName: userProfile?.lastName || "",
    email: userProfile?.email || "",
    phone: userProfile?.phone || "",
    dateOfBirth: userProfile?.dateOfBirth || "",
    passportNumber: userProfile?.passportNumber || "",
    passportExpiry: userProfile?.passportExpiry || "",
    avatar: userProfile?.avatar || "",
  });

  const [passwordData, setPasswordData] = useState({
    email: userProfile?.email || "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Vietnamese social accounts data
  const [socialAccounts] = useState([
    {
      name: "Facebook",
      icon: Facebook,
      connected: true,
      username: "nguyen.vana",
    },
    {
      name: "Twitter",
      icon: Twitter,
      connected: false,
      username: "vana_nguyen",
    },
    { name: "Instagram", icon: Instagram, connected: false, username: "" },
  ]);

  // Loyalty state
  const [loyaltyStats, setLoyaltyStats] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

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

  // Fetch loyalty stats on component mount
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

    fetchLoyaltyStats();
  }, []);

  // Optimized handlers
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = (previewUrl, file) => {
    setAvatarFile(file);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate user ID
      if (!userProfile?.id) {
        toast.error("Không tìm thấy ID người dùng. Vui lòng thử lại.");
        setLoading(false);
        return;
      }

      // Validate required fields
      if (!formData.firstName.trim()) {
        toast.error("Vui lòng nhập họ");
        setLoading(false);
        return;
      }
      if (!formData.lastName.trim()) {
        toast.error("Vui lòng nhập tên");
        setLoading(false);
        return;
      }

      // Prepare FormData for multipart upload
      const formDataToSend = new FormData();

      // Add text fields (always include them, even if empty)
      formDataToSend.append("firstName", formData.firstName.trim());
      formDataToSend.append("lastName", formData.lastName.trim());
      formDataToSend.append("phone", formData.phone.trim());
      formDataToSend.append("dateOfBirth", formData.dateOfBirth || "");
      formDataToSend.append("passportNumber", formData.passportNumber || "");
      formDataToSend.append("passportExpiry", formData.passportExpiry || "");

      // Add avatar file if selected and valid
      if (avatarFile && avatarFile instanceof File) {
        formDataToSend.append("avatar", avatarFile);
      } else if (userProfile?.avatar) {
        // Send existing avatar URL to keep current avatar
        formDataToSend.append("existingAvatar", userProfile.avatar);
      }

      // Call API to update user with FormData
      const response = await userApi.updateUser(userProfile.id, formDataToSend);

      if (response.success) {
        toast.success("Cập nhật hồ sơ thành công!");

        // Update local form data with new values
        setFormData((prev) => ({
          ...prev,
          firstName: response.data.firstName || prev.firstName,
          lastName: response.data.lastName || prev.lastName,
          phone: response.data.phone || prev.phone,
          dateOfBirth: response.data.dateOfBirth || prev.dateOfBirth,
          passportNumber: response.data.passportNumber || prev.passportNumber,
          passportExpiry: response.data.passportExpiry || prev.passportExpiry,
          avatar: response.data.avatar || prev.avatar,
        }));

        // Clear avatar file after successful upload
        setAvatarFile(null);

        // Notify parent component
        if (onProfileUpdate) {
          onProfileUpdate(response.data);
        }

        // Update auth context to reflect changes in header
        const updatedData = {
          id: userProfile.id, // Keep user ID
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          fullName:
            `${response.data.firstName} ${response.data.lastName}`.trim(),
          avatar: response.data.avatar,
          phone: response.data.phone,
          dateOfBirth: response.data.dateOfBirth,
          passportNumber: response.data.passportNumber,
          passportExpiry: response.data.passportExpiry,
        };
        updateUser(updatedData);

        // Exit edit mode
        setEditMode(false);
      } else {
        toast.error(
          response.message || "Cập nhật hồ sơ thất bại. Vui lòng thử lại."
        );
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật hồ sơ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password fields
      if (!passwordData.oldPassword) {
        toast.error("Vui lòng nhập mật khẩu hiện tại");
        setLoading(false);
        return;
      }
      if (!passwordData.newPassword) {
        toast.error("Vui lòng nhập mật khẩu mới");
        setLoading(false);
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error("Mật khẩu xác nhận không khớp");
        setLoading(false);
        return;
      }
      if (passwordData.newPassword.length < 6) {
        toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
        setLoading(false);
        return;
      }

      // Call API to change password
      const response = await authApi.changePassword(passwordData);

      if (response.success) {
        toast.success("Đổi mật khẩu thành công!");

        // Reset password form
        setPasswordData({
          email: userProfile?.email || "",
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        // Exit password mode
        setPasswordMode(false);
      } else {
        toast.error(
          response.message || "Đổi mật khẩu thất bại. Vui lòng thử lại."
        );
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      // Call API to delete account
      const response = await userApi.deleteUser(userProfile.id);

      if (response.success) {
        toast.success("Tài khoản đã được xóa thành công!");
        logout();
        navigate("/");
      } else {
        toast.error(
          response.message || "Xóa tài khoản thất bại. Vui lòng thử lại."
        );
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa tài khoản. Vui lòng thử lại.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const loyaltyTier = getLoyaltyTierDisplay(userProfile?.loyaltyTier);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                <AvatarImage
                  src={userProfileUtils.getBestAvatarUrl(userProfile, 80)}
                  alt={userProfileUtils.getDisplayName(userProfile)}
                />
                <AvatarFallback className="bg-blue-500 text-white text-xl font-semibold">
                  {userProfileUtils.getUserInitials(userProfile)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl text-gray-900 dark:text-white">
                  {userProfileUtils.getDisplayName(userProfile)}
                </CardTitle>
                <CardDescription className="text-base">
                  {userProfile?.email}
                </CardDescription>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge
                    className={`${loyaltyTier.bgColor} ${loyaltyTier.color} border-0`}
                  >
                    <loyaltyTier.icon className="w-3 h-3 mr-1" />
                    {loyaltyTier.name}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant={editMode ? "outline" : "default"}
              onClick={() => setEditMode(!editMode)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editMode ? (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Hủy
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Personal Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <User className="mr-2 h-5 w-5" />
            Thông tin cá nhân
          </CardTitle>
          <CardDescription>
            Quản lý thông tin cá nhân và tài khoản của bạn
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {editMode ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label htmlFor="avatar">Ảnh đại diện</Label>
                <ImageUpload
                  onChange={handleAvatarUpload}
                  value={userProfile?.avatar}
                  placeholder="Chọn ảnh đại diện"
                />
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Họ *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Nhập họ"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Tên *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Nhập tên"
                    required
                  />
                </div>
              </div>

              {/* Email - Read Only */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  readOnly
                  className="bg-gray-50 dark:bg-gray-800"
                />
                <p className="text-sm text-gray-500">
                  Email không thể thay đổi
                </p>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Passport Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passportNumber">Số hộ chiếu</Label>
                  <Input
                    id="passportNumber"
                    name="passportNumber"
                    type="text"
                    value={formData.passportNumber}
                    onChange={handleInputChange}
                    placeholder="Nhập số hộ chiếu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passportExpiry">Ngày hết hạn hộ chiếu</Label>
                  <Input
                    id="passportExpiry"
                    name="passportExpiry"
                    type="date"
                    value={formData.passportExpiry}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  disabled={loading}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Họ và tên
                  </Label>
                  <p className="text-sm mt-1 font-medium">
                    {userProfileUtils.getDisplayName(userProfile)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Email
                  </Label>
                  <p className="text-sm mt-1">{userProfile?.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Số điện thoại
                  </Label>
                  <p className="text-sm mt-1">
                    {userProfile?.phone || "Chưa cập nhật"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Ngày sinh
                  </Label>
                  <p className="text-sm mt-1">
                    {formatDate(userProfile?.dateOfBirth) || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Số hộ chiếu
                  </Label>
                  <p className="text-sm mt-1">
                    {userProfile?.passportNumber || "Chưa cập nhật"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Ngày hết hạn hộ chiếu
                  </Label>
                  <p className="text-sm mt-1">
                    {formatDate(userProfile?.passportExpiry) || "Chưa cập nhật"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Hạng thành viên
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge
                      className={`${loyaltyTier.bgColor} ${loyaltyTier.color} border-0`}
                    >
                      <loyaltyTier.icon className="w-3 h-3 mr-1" />
                      {loyaltyTier.name}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center">
                <Lock className="mr-2 h-5 w-5" />
                Bảo mật tài khoản
              </CardTitle>
              <CardDescription>
                Thay đổi mật khẩu để bảo mật tài khoản của bạn
              </CardDescription>
            </div>
            <Button
              variant={passwordMode ? "outline" : "default"}
              onClick={() => setPasswordMode(!passwordMode)}
              disabled={loading}
            >
              {passwordMode ? (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Hủy
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Đổi mật khẩu
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {passwordMode && (
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Mật khẩu hiện tại *</Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    name="oldPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu hiện tại"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility("current")}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới *</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu mới"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility("new")}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility("confirm")}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPasswordMode(false)}
                  disabled={loading}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang đổi...
                    </>
                  ) : (
                    "Đổi mật khẩu"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Social Accounts Card */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mạng xã hội</CardTitle>
          <CardDescription>
            Kết nối tài khoản với các mạng xã hội
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {socialAccounts.map((account) => (
              <div
                key={account.name}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <account.icon className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{account.name}</p>
                    {account.connected && (
                      <p className="text-sm text-gray-500">
                        @{account.username}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {account.connected ? (
                    <>
                      <Badge variant="secondary" className="text-green-600">
                        <Verified className="mr-1 h-3 w-3" />
                        Đã kết nối
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Unlink className="mr-2 h-4 w-4" />
                        Ngắt kết nối
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Kết nối
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}

      {/* Loyalty Program Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Award className="mr-2 h-5 w-5 text-yellow-500" />
            Chương trình tích điểm
          </CardTitle>
          <CardDescription>
            Xem điểm thưởng và hạng thành viên của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loyaltyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Đang tải thông tin...</span>
            </div>
          ) : loyaltyStats ? (
            <div className="space-y-6">
              {/* Current Tier */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const tierInfo = getLoyaltyTierDisplay(
                      loyaltyStats.currentTier
                    );
                    const IconComponent = tierInfo.icon;
                    return (
                      <>
                        <div className={`p-2 rounded-full ${tierInfo.bgColor}`}>
                          <IconComponent
                            className={`h-6 w-6 ${tierInfo.color}`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">
                            {tierInfo.name}
                          </p>
                          <p className="text-sm text-gray-600">
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
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">Điểm thưởng</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {loyaltyStats.currentPoints?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-600">điểm</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Plane className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Chuyến bay hoàn thành</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {loyaltyStats.completedBookings?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-600">chuyến</p>
                </div>
              </div>

              {/* Next Tier Progress */}
              {loyaltyStats.nextTier && loyaltyStats.nextTierRequirements && (
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-purple-500" />
                    Tiến độ nâng hạng tiếp theo
                  </h4>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        Hạng {getLoyaltyTierDisplay(loyaltyStats.nextTier).name}
                      </span>
                      <span className="text-sm font-medium">
                        {Math.round((loyaltyStats.overallProgress || 0) * 100)}%
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
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
                            (loyaltyStats.nextTierRequirements.bookings || 0) -
                              (loyaltyStats.completedBookings || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tier Benefits */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">
                  Quyền lợi hạng{" "}
                  {getLoyaltyTierDisplay(loyaltyStats.currentTier).name}
                </h4>
                <div className="space-y-2 text-sm">
                  {loyaltyStats.currentTier === "PLATINUM" && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-blue-500" />
                        <span>Ưu tiên check-in và chọn ghế</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-blue-500" />
                        <span>Miễn phí hành lý ký gửi</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-blue-500" />
                        <span>Phòng chờ hạng thương gia</span>
                      </div>
                    </>
                  )}
                  {loyaltyStats.currentTier === "GOLD" && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>Ưu tiên check-in</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>Giảm 20% hành lý thêm</span>
                      </div>
                    </>
                  )}
                  {loyaltyStats.currentTier === "SILVER" && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-gray-500" />
                        <span>Giảm 10% hành lý thêm</span>
                      </div>
                    </>
                  )}
                  {loyaltyStats.currentTier === "STANDARD" && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-orange-500" />
                        <span>Tích điểm cho mỗi chuyến bay</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Không thể tải thông tin điểm thưởng
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Account Card */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-lg text-red-600 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            Xóa tài khoản
          </CardTitle>
          <CardDescription className="text-red-600">
            Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa
            vĩnh viễn.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleteLoading}>
                {deleteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Xóa tài khoản
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
                <AlertDialogDescription>
                  Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị
                  xóa vĩnh viễn và bạn sẽ không thể truy cập lại tài khoản này.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Xóa tài khoản
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AccountTab;
