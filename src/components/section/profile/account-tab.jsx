import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
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
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/apis/auth-api";
import { userApi } from "@/apis/user-api";
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

  // Check if user is admin
  const isAdmin = user?.role === "ADMIN";

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

  // Optimized handlers
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = (previewUrl, file) => {
    // Store the file object for FormData submission
    setAvatarFile(file);
    // You can also store previewUrl if needed for UI display
    console.log(
      "Avatar selected:",
      file ? `File: ${file.name}` : `URL: ${previewUrl}`
    );
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
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

      console.log("Cập nhật hồ sơ:", formData);

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
        console.log(
          "✅ Avatar file added:",
          avatarFile.name,
          "Size:",
          avatarFile.size,
          "Type:",
          avatarFile.type
        );
      } else if (userProfile?.avatar) {
        // Send existing avatar URL to keep current avatar
        formDataToSend.append("existingAvatar", userProfile.avatar);
        console.log("✅ Existing avatar kept:", userProfile.avatar);
      } else {
        console.log("❌ No avatar file to add:", avatarFile);
      }

      console.log("Dữ liệu FormData:");
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value);
      }

      // Call API to update user with FormData
      console.log("🚀 Gửi request cập nhật user ID:", userProfile.id);
      console.log("📊 Request headers sẽ được set tự động cho FormData");

      const response = await userApi.updateUser(userProfile.id, formDataToSend);
      console.log("📥 Response từ API:", response);
      console.log("📋 Response data:", response.data);
      console.log("📋 Response success:", response.success);

      if (response.success) {
        console.log("Cập nhật thành công:", response.data);
        console.log("🔍 Response data avatar:", response.data.avatar);
        console.log("🔍 Response data firstName:", response.data.firstName);
        console.log("🔍 Response data lastName:", response.data.lastName);
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
        console.log("🔄 Updating auth context with:", updatedData);
        updateUser(updatedData);

        // Exit edit mode
        setEditMode(false);
      } else {
        console.error("Cập nhật thất bại:", response.message, response.error);
        toast.error(
          response.message || "Cập nhật hồ sơ thất bại. Vui lòng thử lại."
        );
      }
    } catch (error) {
      console.error("Lỗi cập nhật hồ sơ:", error);
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

      console.log("Đổi mật khẩu:", passwordData);

      // Call API to change password
      const response = await authApi.changePassword(passwordData);

      if (response.success) {
        console.log("Đổi mật khẩu thành công");
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
      console.error("Lỗi đổi mật khẩu:", error);
      toast.error("Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);

    try {
      // Call API to delete account
      const response = await userApi.deleteUser(userProfile?.id);

      if (response.success) {
        console.log("Xóa tài khoản thành công");
        toast.success("Tài khoản đã được xóa thành công!");

        // Logout user
        await logout();

        // Navigate to home page
        navigate("/");
      } else {
        toast.error(
          response.message || "Xóa tài khoản thất bại. Vui lòng thử lại."
        );
      }
    } catch (error) {
      console.error("Lỗi xóa tài khoản:", error);
      toast.error("Có lỗi xảy ra khi xóa tài khoản. Vui lòng thử lại.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to original values
    setFormData({
      firstName: userProfile?.firstName || "",
      lastName: userProfile?.lastName || "",
      email: userProfile?.email || "",
      phone: userProfile?.phone || "",
      dateOfBirth: userProfile?.dateOfBirth || "",
      passportNumber: userProfile?.passportNumber || "",
      passportExpiry: userProfile?.passportExpiry || "",
    });
    setAvatarFile(null);
    setEditMode(false);
  };

  const handleCancelPassword = () => {
    // Reset password form
    setPasswordData({
      email: userProfile?.email || "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordMode(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={
                    avatarFile && avatarFile instanceof File
                      ? URL.createObjectURL(avatarFile)
                      : userProfile?.avatar || undefined
                  }
                  alt={`${userProfile?.firstName} ${userProfile?.lastName}`}
                />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">
                  {userProfile?.firstName} {userProfile?.lastName}
                </CardTitle>
                <CardDescription>{userProfile?.email}</CardDescription>
                <Badge variant="secondary" className="mt-1">
                  {user?.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
                </Badge>
              </div>
            </div>
            <Button
              variant={editMode ? "outline" : "default"}
              onClick={() => setEditMode(!editMode)}
              disabled={loading}
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

              {/* First Name */}
              <div className="grid grid-cols-2 gap-4">
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

                {/* Last Name */}
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
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">
                  Email không thể thay đổi
                </p>
              </div>

              {/* Phone */}
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

              {/* Date of Birth */}
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

              {/* Passport Number */}
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

              {/* Passport Expiry */}
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

              {/* Loyalty Points - Read Only */}
              <div className="space-y-2">
                <Label htmlFor="loyaltyPoints">Điểm tích lũy</Label>
                <Input
                  id="loyaltyPoints"
                  name="loyaltyPoints"
                  type="text"
                  value={userProfile?.loyaltyPoints || 0}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
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
            <div className="space-y-4">
              {/* Display Profile Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Họ
                  </Label>
                  <p className="text-sm mt-1">
                    {userProfile?.firstName || "Chưa cập nhật"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Tên
                  </Label>
                  <p className="text-sm mt-1">
                    {userProfile?.lastName || "Chưa cập nhật"}
                  </p>
                </div>
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
                  {userProfile?.dateOfBirth || "Chưa cập nhật"}
                </p>
              </div>

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
                  {userProfile?.passportExpiry || "Chưa cập nhật"}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Điểm tích lũy
                </Label>
                <p className="text-sm mt-1">
                  {userProfile?.loyaltyPoints || 0} điểm
                </p>
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
              <CardTitle className="text-lg">Đổi mật khẩu</CardTitle>
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
              {/* Current Password */}
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

              {/* New Password */}
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

              {/* Confirm Password */}
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

              {/* Password Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelPassword}
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tài khoản mạng xã hội</CardTitle>
          <CardDescription>
            Kết nối tài khoản mạng xã hội để đăng nhập dễ dàng hơn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {socialAccounts.map((account) => (
              <div
                key={account.name}
                className="flex items-center justify-between p-4 border rounded-lg"
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
      </Card>

      {/* Delete Account Card */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-lg text-red-600">Xóa tài khoản</CardTitle>
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
                    <Trash2 className="mr-2 h-4 w-4" />
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
