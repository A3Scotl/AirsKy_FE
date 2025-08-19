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
} from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/apis/auth-api";
import { userProfileUtils } from "@/hooks/use-user-profile";

const AccountTab = ({ userProfile, onProfileUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [loading, setLoading] = useState(false);
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
    address: userProfile?.address || "",
    nationality: userProfile?.nationality || "",
    passportNumber: userProfile?.passportNumber || "",
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

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Cập nhật hồ sơ:", formData);
      toast.success("Cập nhật hồ sơ thành công!");
      setEditMode(false);
      onProfileUpdate?.();
    } catch (error) {
      console.error("Lỗi cập nhật hồ sơ:", error);
      toast.error("Cập nhật hồ sơ thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Vietnamese validation messages
    if (!passwordData.oldPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (!passwordData.newPassword) {
      toast.error("Vui lòng nhập mật khẩu mới");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }
    if (passwordData.oldPassword === passwordData.newPassword) {
      toast.error("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.changePassword({
        email: passwordData.email,
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        toast.success("Đổi mật khẩu thành công!");
        setPasswordData({
          email: userProfile?.email || "",
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordMode(false);
      } else {
        if (response.message.includes("INVALID_CREDENTIALS")) {
          toast.error("Mật khẩu hiện tại không đúng");
        } else {
          toast.error(response.message || "Đổi mật khẩu thất bại");
        }
      }
    } catch (error) {
      console.error("Lỗi đổi mật khẩu:", error);
      toast.error("Đổi mật khẩu thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialConnect = (socialName) => {
    console.log(`Kết nối ${socialName}`);
  };

  const handleSocialDisconnect = (socialName) => {
    console.log(`Ngắt kết nối ${socialName}`);
  };

  return (
    <div className="space-y-6">
      {/* Personal Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Thông Tin Cá Nhân
          </CardTitle>
          <CardDescription>
            Quản lý thông tin cá nhân và hồ sơ của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!editMode ? (
            <div className="space-y-6">
              {/* Profile Avatar and Basic Info */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage
                      src={userProfileUtils.getBestAvatarUrl(userProfile, 80)}
                      alt={userProfileUtils.getDisplayName(userProfile)}
                      onError={(e) => {
                        e.target.src = userProfileUtils.getUIAvatarUrl(
                          userProfile,
                          80
                        );
                      }}
                    />
                    <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
                      {userProfileUtils.getUserInitials(userProfile)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Avatar Source Indicator */}
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg border">
                    {(() => {
                      const avatarUrl =
                        userProfileUtils.getBestAvatarUrl(userProfile);
                      if (avatarUrl?.includes("gravatar.com")) {
                        return (
                          <div
                            className="w-4 h-4 bg-blue-500 rounded-full"
                            title="Gravatar"
                          />
                        );
                      } else if (avatarUrl?.includes("ui-avatars.com")) {
                        return (
                          <div
                            className="w-4 h-4 bg-purple-500 rounded-full"
                            title="Ảnh đại diện tự tạo"
                          />
                        );
                      } else if (
                        avatarUrl?.includes("googleapis.com") ||
                        avatarUrl?.includes("googleusercontent.com")
                      ) {
                        return (
                          <div
                            className="w-4 h-4 bg-red-500 rounded-full"
                            title="Ảnh Google"
                          />
                        );
                      } else {
                        return (
                          <div
                            className="w-4 h-4 bg-gray-500 rounded-full"
                            title="Ảnh mặc định"
                          />
                        );
                      }
                    })()}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {userProfileUtils.getDisplayName(userProfile)}
                  </h3>
                  <p className="text-gray-600">{userProfile.email}</p>

                  {/* Avatar Info */}
                  <div className="mt-2 text-sm text-gray-500">
                    Ảnh đại diện:{" "}
                    {(() => {
                      const avatarUrl =
                        userProfileUtils.getBestAvatarUrl(userProfile);
                      if (avatarUrl?.includes("gravatar.com")) {
                        return "Gravatar (dựa trên email)";
                      } else if (avatarUrl?.includes("ui-avatars.com")) {
                        return "Tạo từ tên";
                      } else if (
                        avatarUrl?.includes("googleapis.com") ||
                        avatarUrl?.includes("googleusercontent.com")
                      ) {
                        return "Ảnh tài khoản Google";
                      } else {
                        return "Ảnh mặc định";
                      }
                    })()}
                  </div>

                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      <Verified className="w-3 h-3 mr-1" />
                      Tài khoản đã xác thực
                    </Badge>
                    {userProfile.role && (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700"
                      >
                        {userProfileUtils.getRoleDisplay(userProfile)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Detailed Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Họ
                    </Label>
                    <p className="mt-1">
                      {userProfile.firstName || "Chưa cung cấp"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Tên
                    </Label>
                    <p className="mt-1">
                      {userProfile.lastName || "Chưa cung cấp"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Địa chỉ Email
                    </Label>
                    <p className="mt-1">{userProfile.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Số điện thoại
                    </Label>
                    <p className="mt-1">
                      {userProfileUtils.getFormattedPhone(userProfile) ||
                        userProfile.phone ||
                        "Chưa cung cấp"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      ID Người dùng
                    </Label>
                    <p className="mt-1 font-mono text-sm">
                      {userProfile.id || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Vai trò tài khoản
                    </Label>
                    <p className="mt-1">
                      {userProfileUtils.getRoleDisplay(userProfile)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Thành viên từ
                    </Label>
                    <p className="mt-1">
                      {userProfileUtils.getJoinDate(userProfile)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Trạng thái tài khoản
                    </Label>
                    <p className="mt-1">
                      {userProfile.isVerified !== false ? (
                        <span className="text-green-600 font-medium">
                          ✓ Đã xác thực
                        </span>
                      ) : (
                        <span className="text-orange-600 font-medium">
                          ⚠ Chờ xác thực
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setEditMode(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Chỉnh sửa hồ sơ
                </Button>
                <Button variant="outline" onClick={() => setPasswordMode(true)}>
                  <Lock className="w-4 h-4 mr-2" />
                  Cập nhật mật khẩu
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Họ</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Nhập họ của bạn"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Tên</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Nhập tên của bạn"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Địa chỉ Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className="bg-gray-50"
                    title="Không thể thay đổi email"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email không thể thay đổi vì lý do bảo mật
                  </p>
                </div>
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0123456789"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Lưu thay đổi
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  disabled={loading}
                >
                  Hủy
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Password Update Card */}
      {passwordMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Cập Nhật Mật Khẩu
            </CardTitle>
            <CardDescription>
              Thay đổi mật khẩu tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
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
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordData.newPassword &&
                  passwordData.newPassword.length < 6 && (
                    <p className="text-red-500 text-xs mt-1">
                      Mật khẩu phải có ít nhất 6 ký tự
                    </p>
                  )}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Xác nhận mật khẩu mới"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordData.confirmPassword &&
                  passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      Mật khẩu không khớp
                    </p>
                  )}
                {passwordData.confirmPassword &&
                  passwordData.newPassword === passwordData.confirmPassword &&
                  passwordData.confirmPassword.length >= 6 && (
                    <p className="text-green-500 text-xs mt-1">Mật khẩu khớp</p>
                  )}
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Cập nhật mật khẩu
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPasswordMode(false);
                    setPasswordData({
                      email: userProfile?.email || "",
                      oldPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  disabled={loading}
                >
                  Hủy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Account Security Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Bảo Mật Tài Khoản
          </CardTitle>
          <CardDescription>
            Thông tin bảo mật và chi tiết tài khoản
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Cập nhật lần cuối
                </Label>
                <p className="mt-1">
                  {userProfile.updatedAt
                    ? new Date(userProfile.updatedAt).toLocaleDateString(
                        "vi-VN",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : "Chưa từng cập nhật"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Độ hoàn thiện hồ sơ
                </Label>
                <div className="mt-1">
                  {userProfileUtils.isProfileComplete(userProfile) ? (
                    <span className="text-green-600 font-medium">
                      ✓ Hoàn thiện
                    </span>
                  ) : (
                    <div>
                      <span className="text-orange-600 font-medium">
                        ⚠ Chưa hoàn thiện
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Thiếu:{" "}
                        {userProfileUtils
                          .getMissingFields(userProfile)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Tài khoản được tạo
                </Label>
                <p className="mt-1">
                  {userProfile.createdAt
                    ? new Date(userProfile.createdAt).toLocaleDateString(
                        "vi-VN",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : "Không rõ"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Bảo mật mật khẩu
                </Label>
                <div className="mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPasswordMode(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Đổi mật khẩu
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Connections Card */}
      <Card>
        <CardHeader>
          <CardTitle>Kết Nối Mạng Xã Hội</CardTitle>
          <CardDescription>
            Kết nối tài khoản mạng xã hội để đăng nhập nhanh hơn và chia sẻ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {socialAccounts.map((account) => (
              <div
                key={account.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <account.icon className="h-6 w-6" />
                  <div>
                    <p className="font-medium">{account.name}</p>
                    {account.connected && (
                      <p className="text-sm text-gray-500">
                        {account.username}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center flex-wrap justify-end gap-2">
                  {account.connected ? (
                    <>
                      <Badge variant="success" className="mr-2 bg-green-100">
                        Đã kết nối
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-600 text-white"
                        onClick={() => handleSocialDisconnect(account.name)}
                      >
                        <Unlink className="w-4 h-4 mr-1" />
                        Ngắt kết nối
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSocialConnect(account.name)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Kết nối
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account Actions Card */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Vùng Nguy Hiểm</CardTitle>
          <CardDescription>
            Các hành động không thể hoàn tác sẽ ảnh hưởng đến tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center flex-wrap gap-2 justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-900">Xóa Tài Khoản</p>
              <p className="text-sm text-red-700">
                Khi bạn xóa tài khoản, không thể khôi phục lại. Vui lòng cân
                nhắc kỹ.
              </p>
            </div>
            <Button variant="destructive">Xóa Tài Khoản</Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-4">
          <Separator />
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
            <p className="text-sm text-gray-600">
              Cần hỗ trợ? Liên hệ với đội ngũ hỗ trợ để được trợ giúp.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AccountTab;
