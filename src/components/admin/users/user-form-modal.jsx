import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Save,
  Plus,
  Edit,
  Shield,
  Crown,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authApi } from "@/apis/auth-api";
import { userApi } from "@/apis/user-api";
import { toast } from "sonner";
import ImageUpload from "@/components/ui/image-upload";

const UserFormModal = ({
  open,
  onClose,
  onSave,
  user = null, // User data for edit mode
  mode = "add", // "add" or "edit"
}) => {
  const isEditMode = mode === "edit" && user;

  const initialFormData = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER",
    dateOfBirth: "",
    avatar: null,
    passportNumber: "",
    passportExpiry: "",
    loyaltyPoints: 0,
    loyaltyTier: "STANDARD",
    active: true,
    verified: true,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [avatarFile, setAvatarFile] = useState(null);
  const [errors, setErrors] = useState({});

  // Populate form data when in edit mode
  useEffect(() => {
    if (isEditMode) {
      setFormData({
        firstName: user.firstName || user.name?.split(" ")[0] || "",
        lastName:
          user.lastName || user.name?.split(" ").slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "",
        role: user.role || "CUSTOMER",
        dateOfBirth: user.dateOfBirth || "",
        avatar: user.avatar || null,
        passportNumber: user.passportNumber || "",
        passportExpiry: user.passportExpiry || "",
        loyaltyPoints: user.loyaltyPoints || 0,
        loyaltyTier: user.loyaltyTier || "STANDARD",
        active: user.active !== undefined ? user.active : true,
        verified:
          user.verifiedEmail !== undefined
            ? user.verifiedEmail
            : user.verified !== undefined
            ? user.verified
            : true,
      });
      setAvatarFile(null); // Reset avatar file
    } else {
      setFormData(initialFormData);
      setAvatarFile(null);
    }
  }, [isEditMode, user, open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setErrors({});
      if (!isEditMode) {
        setFormData(initialFormData);
      }
    }
  }, [open, isEditMode]);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields for both add and edit
    const requiredFields = ["firstName", "lastName", "email"];

    requiredFields.forEach((field) => {
      if (!formData[field]?.trim()) {
        const fieldName =
          field.charAt(0).toUpperCase() +
          field.slice(1).replace(/([A-Z])/g, " $1");
        newErrors[field] = `${fieldName} là bắt buộc`;
        toast.error(`${fieldName} là bắt buộc`);
      }
    });

    // Password required for add mode
    if (!isEditMode && !formData.password?.trim()) {
      newErrors.password = "Mật khẩu là bắt buộc";
      toast.error("Mật khẩu là bắt buộc");
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Vui lòng nhập địa chỉ email hợp lệ";
      toast.error("Vui lòng nhập địa chỉ email hợp lệ");
    }

    // Phone validation (optional field)
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Vui lòng nhập số điện thoại hợp lệ";
      toast.error("Vui lòng nhập số điện thoại hợp lệ");
    }

    // Date of birth validation (optional field)
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        newErrors.dateOfBirth = "Vui lòng nhập ngày sinh hợp lệ";
        toast.error("Vui lòng nhập ngày sinh hợp lệ");
      }
    }

    // Passport expiry validation (optional field)
    if (formData.passportExpiry) {
      const expiryDate = new Date(formData.passportExpiry);
      const today = new Date();
      if (expiryDate <= today) {
        newErrors.passportExpiry = "Ngày hết hạn hộ chiếu phải ở tương lai";
        toast.error("Ngày hết hạn hộ chiếu phải ở tương lai");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      if (!isEditMode) {
        // Call admin register API
        try {
          const registerData = {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            role: formData.role,
          };

          const response = await authApi.adminRegister(registerData);
          if (response.success) {
            // Debug log
            toast.success("Tạo người dùng thành công");
            onSave(response.data, false); // Pass the created user data
            onClose();
          } else {
            toast.error(response.message || "Tạo người dùng thất bại");
          }
        } catch (error) {
          toast.error("Lỗi khi tạo người dùng");
        }
      } else {
        // For edit, call updateUser API
        try {
          let response;

          if (avatarFile) {
            // Use FormData when avatar is being uploaded
            const formDataToSend = new FormData();

            // Add basic fields
            formDataToSend.append("firstName", formData.firstName);
            formDataToSend.append("lastName", formData.lastName);
            formDataToSend.append("email", formData.email);
            formDataToSend.append("phone", formData.phone || "");
            formDataToSend.append("role", formData.role);
            formDataToSend.append("dateOfBirth", formData.dateOfBirth || "");
            formDataToSend.append(
              "passportNumber",
              formData.passportNumber || ""
            );
            formDataToSend.append(
              "passportExpiry",
              formData.passportExpiry || ""
            );
            formDataToSend.append(
              "loyaltyPoints",
              formData.loyaltyPoints.toString()
            );
            formDataToSend.append("loyaltyTier", formData.loyaltyTier);
            formDataToSend.append("active", formData.active.toString());
            formDataToSend.append("isVerified", formData.verified.toString());

            // Add avatar file
            formDataToSend.append("avatar", avatarFile);

            response = await userApi.updateUser(user.id, formDataToSend);
          } else {
            // Use FormData for updates without avatar
            const updateData = {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone || "",
              role: formData.role,
              dateOfBirth: formData.dateOfBirth || "",
              passportNumber: formData.passportNumber || "",
              passportExpiry: formData.passportExpiry || "",
              loyaltyPoints: formData.loyaltyPoints,
              loyaltyTier: formData.loyaltyTier,
              active: formData.active,
              isVerified: formData.verified,
            };

            console.log(
              "Sending update data without avatar for user:",
              user.id,
              updateData
            );

            // Use FormData
            const formDataToSend = new FormData();
            Object.keys(updateData).forEach((key) => {
              formDataToSend.append(key, updateData[key]);
            });

            response = await userApi.updateUser(user.id, formDataToSend);
          }
          if (response.success) {
            toast.success("Cập nhật người dùng thành công");
            onSave(response.data, true);
            onClose();
          } else {
            toast.error(response.message || "Cập nhật người dùng thất bại");
          }
        } catch (error) {
          console.error("Error updating user:", error);
          toast.error("Lỗi khi cập nhật người dùng");
        }
      }
    }
  };

  const handleReset = () => {
    if (isEditMode) {
      // Reset to original user data
      setFormData({
        firstName: user.firstName || user.name?.split(" ")[0] || "",
        lastName:
          user.lastName || user.name?.split(" ").slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "",
        role: user.role || "CUSTOMER",
        dateOfBirth: user.dateOfBirth || "",
        avatar: user.avatar || null,
        passportNumber: user.passportNumber || "",
        passportExpiry: user.passportExpiry || "",
        loyaltyPoints: user.loyaltyPoints || 0,
        loyaltyTier: user.loyaltyTier || "STANDARD",
        active: user.active !== undefined ? user.active : true,
        verified:
          user.verifiedEmail !== undefined
            ? user.verifiedEmail
            : user.verified !== undefined
            ? user.verified
            : true,
      });
      setAvatarFile(null);
    } else {
      setFormData(initialFormData);
      setAvatarFile(null);
    }
    setErrors({});
  };

  const getRoleIcon = (role) => {
    const icons = {
      Customer: User,
      Premium: Crown,
      Admin: Shield,
    };
    return icons[role] || User;
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      CUSTOMER: "Người dùng tiêu chuẩn với quyền đặt vé cơ bản",
      BUSINESS: "Tài khoản doanh nghiệp với ưu đãi đặc biệt",
      FLIGHT_MANAGER: "Quản lý và giám sát các chuyến bay",
      ADMIN: "Truy cập đầy đủ hệ thống và khả năng quản lý",
      STAFF: "Chỉ xem và quản lý check-in",
    };
    return descriptions[role] || "";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 dark:bg-opacity-70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {isEditMode ? (
              <Edit className="h-6 w-6 text-blue-600" />
            ) : (
              <Plus className="h-6 w-6 text-blue-600" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditMode ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEditMode
                  ? `Cập nhật thông tin ${user?.name || user?.email || ""}`
                  : "Nhập thông tin người dùng để tạo tài khoản mới"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 dark:text-white">
                <User className="h-4 w-4" />
                <span>Thông tin cá nhân</span>
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Thông tin cá nhân cơ bản và thông tin liên hệ
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="dark:text-gray-300">
                  Tên *
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  placeholder="Nhập tên"
                  className={`text-black ${
                    errors.firstName ? "border-red-500" : ""
                  }`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName" className="dark:text-gray-300">
                  Họ *
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  placeholder="Nhập họ"
                  className={`text-black ${
                    errors.lastName ? "border-red-500" : ""
                  }`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="dark:text-gray-300">
                  Địa chỉ email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Nhập địa chỉ email"
                  className={`text-black ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  disabled={isEditMode} // Usually email shouldn't be editable
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="dark:text-gray-300">
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Nhập số điện thoại"
                  className={`text-black ${
                    errors.phone ? "border-red-500" : ""
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Avatar Upload - Full width */}
              <div className="col-span-1 md:col-span-2">
                <ImageUpload
                  label="Ảnh đại diện"
                  value={formData.avatar}
                  onChange={(url, file) => {
                    setAvatarFile(file);
                    // Update preview URL
                    setFormData((prev) => ({ ...prev, avatar: url }));
                  }}
                  placeholder="Chọn ảnh đại diện hoặc kéo thả vào đây"
                  error={errors.avatar}
                />
              </div>

              {!isEditMode && (
                <div>
                  <Label htmlFor="password">Mật khẩu *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    placeholder="Nhập mật khẩu"
                    className={`text-black ${
                      errors.password ? "border-red-500" : ""
                    }`}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="role">Vai trò người dùng</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div>Khách hàng</div>
                          <div className="text-xs text-gray-500">
                            {getRoleDescription("CUSTOMER")}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="BUSINESS">
                      <div className="flex items-center space-x-2">
                        <Crown className="h-4 w-4" />
                        <div>
                          <div>Doanh nghiệp</div>
                          <div className="text-xs text-gray-500">
                            {getRoleDescription("BUSINESS")}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="FLIGHT_MANAGER">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <div>
                          <div>Quản lý chuyến bay</div>
                          <div className="text-xs text-gray-500">
                            {getRoleDescription("FLIGHT_MANAGER")}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="ADMIN">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <div>
                          <div>Quản trị viên</div>
                          <div className="text-xs text-gray-500">
                            {getRoleDescription("ADMIN")}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="STAFF">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div>Nhân viên</div>
                          <div className="text-xs text-gray-500">
                            {getRoleDescription("STAFF")}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Additional fields for edit mode */}
              {isEditMode && (
                <>
                  <div>
                    <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        handleInputChange("dateOfBirth", e.target.value)
                      }
                      className={`text-black ${
                        errors.dateOfBirth ? "border-red-500" : ""
                      }`}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="passportNumber">Số hộ chiếu</Label>
                    <Input
                      id="passportNumber"
                      value={formData.passportNumber}
                      onChange={(e) =>
                        handleInputChange("passportNumber", e.target.value)
                      }
                      placeholder="Nhập số hộ chiếu"
                      className="text-black"
                    />
                  </div>

                  <div>
                    <Label htmlFor="passportExpiry">
                      Ngày hết hạn hộ chiếu
                    </Label>
                    <Input
                      id="passportExpiry"
                      type="date"
                      value={formData.passportExpiry}
                      onChange={(e) =>
                        handleInputChange("passportExpiry", e.target.value)
                      }
                      className={`text-black ${
                        errors.passportExpiry ? "border-red-500" : ""
                      }`}
                    />
                    {errors.passportExpiry && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.passportExpiry}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="loyaltyPoints">Điểm tích lũy</Label>
                    <Input
                      id="loyaltyPoints"
                      type="number"
                      value={formData.loyaltyPoints}
                      onChange={(e) =>
                        handleInputChange(
                          "loyaltyPoints",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      min="0"
                      className="text-black"
                    />
                  </div>

                  <div>
                    <Label htmlFor="loyaltyTier">Cấp độ thành viên</Label>
                    <Select
                      value={formData.loyaltyTier}
                      onValueChange={(value) =>
                        handleInputChange("loyaltyTier", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STANDARD">Tiêu chuẩn</SelectItem>
                        <SelectItem value="SILVER">Bạc</SelectItem>
                        <SelectItem value="GOLD">Vàng</SelectItem>
                        <SelectItem value="PLATINUM">Bạch kim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="active">Tài khoản hoạt động</Label>
                    <Select
                      value={formData.active.toString()}
                      onValueChange={(value) =>
                        handleInputChange("active", value === "true")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Hoạt động</SelectItem>
                        <SelectItem value="false">Không hoạt động</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="verified">Tài khoản đã xác minh</Label>
                    <Select
                      value={formData.verified.toString()}
                      onValueChange={(value) =>
                        handleInputChange("verified", value === "true")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Đã xác minh</SelectItem>
                        <SelectItem value="false">Chưa xác minh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Đặt lại
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {isEditMode ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Cập nhật người dùng
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Tạo người dùng
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
