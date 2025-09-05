import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Shield,
  Crown,
  Calendar,
  Activity,
  CreditCard,
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
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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
    country: "",
    role: "Customer",
    password: "",
    confirmPassword: "",
    emailVerified: false,
    sendWelcomeEmail: true,
    enableNotifications: true,
    // Additional fields for edit mode
    status: "Active",
    address: "",
    dateOfBirth: "",
    gender: "",
    occupation: "",
    emergencyContact: "",
    accountNotes: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Populate form data when in edit mode
  useEffect(() => {
    if (isEditMode) {
      setFormData({
        firstName: user.firstName || user.name?.split(" ")[0] || "",
        lastName:
          user.lastName || user.name?.split(" ").slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.phone || "",
        country: user.country || "",
        role: user.role || "Customer",
        password: "", // Never populate password in edit mode
        confirmPassword: "",
        emailVerified: user.emailVerified || false,
        sendWelcomeEmail: false, // Only relevant for new users
        enableNotifications:
          user.enableNotifications || user.preferences?.newsletter || true,
        status: user.status || "Active",
        address: user.address || "",
        dateOfBirth: user.dateOfBirth || "",
        gender: user.gender || "",
        occupation: user.occupation || "",
        emergencyContact: user.emergencyContact || "",
        accountNotes: user.accountNotes || "",
      });
    } else {
      setFormData(initialFormData);
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

  // Countries list
  const countries = [
    "Vietnam",
    "United States",
    "Canada",
    "United Kingdom",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "South Korea",
    "Singapore",
    "India",
    "Brazil",
    "Mexico",
    "Thailand",
    "Malaysia",
    "Philippines",
    "Indonesia",
  ];

  const statusOptions = [
    { value: "Active", label: "Active", color: "bg-green-100 text-green-800" },
    {
      value: "Inactive",
      label: "Inactive",
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "Suspended",
      label: "Suspended",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "Pending",
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
    },
  ];

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
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "country",
    ];

    // Password is only required for add mode
    if (!isEditMode) {
      requiredFields.push("password");
    }

    requiredFields.forEach((field) => {
      if (!formData[field]?.trim()) {
        const fieldName =
          field.charAt(0).toUpperCase() +
          field.slice(1).replace(/([A-Z])/g, " $1");
        newErrors[field] = `${fieldName} is required`;
      }
    });

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation (only for add mode or when password is provided in edit)
    if (!isEditMode || formData.password) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    // Phone validation
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Date of birth validation (edit mode)
    if (isEditMode && formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        newErrors.dateOfBirth = "Please enter a valid date of birth";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const processedData = {
        ...formData,
        id: isEditMode ? user.id : `USR${Date.now()}`,
        name: `${formData.firstName} ${formData.lastName}`,
        // Only include password if it was provided
        ...(formData.password ? { password: formData.password } : {}),
        // Remove confirmPassword from final data
        confirmPassword: undefined,
        // Set timestamps
        joinDate: isEditMode
          ? user.joinDate
          : new Date().toISOString().split("T")[0],
        lastLogin: isEditMode ? user.lastLogin : new Date().toISOString(),
        totalBookings: isEditMode ? user.totalBookings : 0,
        totalSpent: isEditMode ? user.totalSpent : 0,
        avatar: isEditMode ? user.avatar : null,
        preferences: {
          newsletter: formData.enableNotifications,
          smsNotifications: formData.enableNotifications,
          specialOffers: true,
        },
        createdAt: isEditMode ? user.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onSave(processedData, isEditMode);
      onClose();
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
        country: user.country || "",
        role: user.role || "Customer",
        password: "",
        confirmPassword: "",
        emailVerified: user.emailVerified || false,
        sendWelcomeEmail: false,
        enableNotifications:
          user.enableNotifications || user.preferences?.newsletter || true,
        status: user.status || "Active",
        address: user.address || "",
        dateOfBirth: user.dateOfBirth || "",
        gender: user.gender || "",
        occupation: user.occupation || "",
        emergencyContact: user.emergencyContact || "",
        accountNotes: user.accountNotes || "",
      });
    } else {
      setFormData(initialFormData);
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
      Customer: "Standard user with basic booking privileges",
      Premium: "Enhanced features and priority support",
      Admin: "Full system access and management capabilities",
    };
    return descriptions[role] || "";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {isEditMode ? (
              <Edit className="h-6 w-6 text-blue-600" />
            ) : (
              <Plus className="h-6 w-6 text-blue-600" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? "Edit User" : "Add New User"}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditMode
                  ? `Update ${user?.name || user?.email || ""} information`
                  : "Enter user details to create a new account"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Personal Information</span>
              </CardTitle>
              <CardDescription>
                Basic personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  placeholder="Enter first name"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  placeholder="Enter last name"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                  className={errors.email ? "border-red-500" : ""}
                  disabled={isEditMode} // Usually email shouldn't be editable
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange("country", value)}
                >
                  <SelectTrigger
                    className={errors.country ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <p className="text-red-500 text-xs mt-1">{errors.country}</p>
                )}
              </div>

              {/* Additional fields for edit mode */}
              {isEditMode && (
                <>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        handleInputChange("dateOfBirth", e.target.value)
                      }
                      className={errors.dateOfBirth ? "border-red-500" : ""}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        handleInputChange("gender", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        <SelectItem value="Prefer not to say">
                          Prefer not to say
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={(e) =>
                        handleInputChange("occupation", e.target.value)
                      }
                      placeholder="Enter occupation"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) =>
                        handleInputChange("emergencyContact", e.target.value)
                      }
                      placeholder="Emergency contact number"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      placeholder="Enter full address"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Account Settings</span>
              </CardTitle>
              <CardDescription>
                User role, status and account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">User Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Customer">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div>Customer</div>
                            <div className="text-xs text-gray-500">
                              {getRoleDescription("Customer")}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="Premium">
                        <div className="flex items-center space-x-2">
                          <Crown className="h-4 w-4" />
                          <div>
                            <div>Premium</div>
                            <div className="text-xs text-gray-500">
                              {getRoleDescription("Premium")}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="Admin">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <div>
                            <div>Admin</div>
                            <div className="text-xs text-gray-500">
                              {getRoleDescription("Admin")}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status field - only show in edit mode */}
                {isEditMode && (
                  <div>
                    <Label htmlFor="status">Account Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleInputChange("status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center">
                              <Badge className={`${status.color} mr-2`}>
                                {status.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Password fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">
                    Password {!isEditMode && "*"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      placeholder={
                        isEditMode
                          ? "Leave blank to keep current password"
                          : "Enter password"
                      }
                      className={errors.password ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">
                    Confirm Password {(!isEditMode || formData.password) && "*"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      placeholder="Confirm password"
                      className={errors.confirmPassword ? "border-red-500" : ""}
                      disabled={isEditMode && !formData.password}
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
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {isEditMode ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update User
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create User
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
