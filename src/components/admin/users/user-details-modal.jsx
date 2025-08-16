import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Edit3,
  Eye,
  EyeOff,
  Shield,
  Crown,
  Calendar,
  CreditCard,
  Activity,
  Settings,
  Camera,
  Trash2,
  ExternalLink,
  Clock,
  DollarSign,
  Plane,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const UserDetailsModal = ({ open, onClose, userData: initialUserData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const countries = [
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
  ];

  // Mock booking data
  const recentBookings = [
    {
      id: "BK001",
      flight: "AA 1234",
      route: "NYC → LAX",
      date: "2024-01-15",
      status: "Completed",
      amount: 450,
    },
    {
      id: "BK002",
      flight: "DL 5678",
      route: "LAX → MIA",
      date: "2024-01-20",
      status: "Upcoming",
      amount: 320,
    },
    {
      id: "BK003",
      flight: "UA 9012",
      route: "MIA → SEA",
      date: "2024-01-10",
      status: "Cancelled",
      amount: 380,
    },
  ];

  useEffect(() => {
    if (initialUserData) {
      setUserData(initialUserData);
      setFormData({
        firstName: initialUserData.name?.split(" ")[0] || "",
        lastName: initialUserData.name?.split(" ").slice(1).join(" ") || "",
        email: initialUserData.email || "",
        phone: initialUserData.phone || "",
        country: initialUserData.country || "",
        role: initialUserData.role || "Customer",
        status: initialUserData.status || "Active",
      });
    }
  }, [initialUserData]);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName?.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName?.trim())
      newErrors.lastName = "Last name is required";
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.phone?.trim()) newErrors.phone = "Phone number is required";
    if (!formData.country) newErrors.country = "Country is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const updatedUser = {
        ...userData,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        role: formData.role,
        status: formData.status,
      };

      setUserData(updatedUser);
      setIsEditing(false);
      console.log("Updated user:", updatedUser);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: userData.name?.split(" ")[0] || "",
      lastName: userData.name?.split(" ").slice(1).join(" ") || "",
      email: userData.email || "",
      phone: userData.phone || "",
      country: userData.country || "",
      role: userData.role || "Customer",
      status: userData.status || "Active",
    });
    setErrors({});
    setIsEditing(false);
  };

  const getRoleIcon = (role) => {
    const icons = {
      Customer: User,
      Premium: Crown,
      Admin: Shield,
    };
    return icons[role] || User;
  };

  const getStatusColor = (status) => {
    const colors = {
      Active: "bg-green-100 text-green-800",
      Inactive: "bg-gray-100 text-gray-800",
      Suspended: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getBookingStatusColor = (status) => {
    const colors = {
      Completed: "bg-green-100 text-green-800",
      Upcoming: "bg-blue-100 text-blue-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (!open || !userData) return null;

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
            <Avatar className="h-10 w-10">
              <AvatarImage src={userData.avatar} />
              <AvatarFallback>
                {userData.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {userData.name}
              </h2>
              <p className="text-sm text-gray-500">User ID: {userData.id}</p>
            </div>
            <Badge className={getStatusColor(userData.status)}>
              {userData.status}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Plane className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {userData.totalBookings || 0}
                        </p>
                        <p className="text-xs text-gray-500">Total Bookings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          ${userData.totalSpent || 0}
                        </p>
                        <p className="text-xs text-gray-500">Total Spent</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-purple-100 p-3 rounded-full">
                        <Clock className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {userData.lastLogin
                            ? new Date(userData.lastLogin).toLocaleDateString()
                            : "Never"}
                        </p>
                        <p className="text-xs text-gray-500">Last Login</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Personal Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) =>
                            handleInputChange("firstName", e.target.value)
                          }
                          className={errors.firstName ? "border-red-500" : ""}
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.firstName}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) =>
                            handleInputChange("lastName", e.target.value)
                          }
                          className={errors.lastName ? "border-red-500" : ""}
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.lastName}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          className={errors.phone ? "border-red-500" : ""}
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Select
                          value={formData.country}
                          onValueChange={(value) =>
                            handleInputChange("country", value)
                          }
                        >
                          <SelectTrigger
                            className={errors.country ? "border-red-500" : ""}
                          >
                            <SelectValue />
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
                          <p className="text-red-500 text-xs mt-1">
                            {errors.country}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) =>
                            handleInputChange("role", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["Customer", "Premium", "Admin"].map((role) => {
                              const Icon = getRoleIcon(role);
                              return (
                                <SelectItem key={role} value={role}>
                                  <div className="flex items-center space-x-2">
                                    <Icon className="h-4 w-4" />
                                    <span>{role}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="status">Status</Label>
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
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="Suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label>Email</Label>
                        <p className="font-medium">{userData.email}</p>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <p className="font-medium">{userData.phone}</p>
                      </div>
                      <div>
                        <Label>Country</Label>
                        <p className="font-medium">{userData.country}</p>
                      </div>
                      <div>
                        <Label>Role</Label>
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const Icon = getRoleIcon(userData.role);
                            return <Icon className="h-4 w-4" />;
                          })()}
                          <span className="font-medium">{userData.role}</span>
                        </div>
                      </div>
                      <div>
                        <Label>Join Date</Label>
                        <p className="font-medium">
                          {userData.joinDate
                            ? new Date(userData.joinDate).toLocaleDateString()
                            : "Unknown"}
                        </p>
                      </div>
                      <div>
                        <Label>Email Verified</Label>
                        <Badge
                          variant={
                            userData.emailVerified ? "default" : "secondary"
                          }
                        >
                          {userData.emailVerified ? "Verified" : "Unverified"}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>
                    Latest booking history and transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 p-2 rounded">
                            <Plane className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{booking.flight}</p>
                            <p className="text-sm text-gray-500">
                              {booking.route}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${booking.amount}</p>
                          <p className="text-sm text-gray-500">
                            {booking.date}
                          </p>
                        </div>
                        <Badge
                          className={getBookingStatusColor(booking.status)}
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {recentBookings.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No bookings found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                  <CardDescription>
                    Recent user activities and system events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 pb-3 border-b">
                      <div className="bg-green-100 p-2 rounded-full">
                        <Activity className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Account created</p>
                        <p className="text-sm text-gray-500">
                          {userData.joinDate
                            ? new Date(userData.joinDate).toLocaleString()
                            : "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pb-3 border-b">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Last login</p>
                        <p className="text-sm text-gray-500">
                          {userData.lastLogin
                            ? new Date(userData.lastLogin).toLocaleString()
                            : "Never"}
                        </p>
                      </div>
                    </div>

                    <div className="text-center py-4 text-gray-500">
                      Activity history would be displayed here
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage user preferences and account settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive booking confirmations and updates
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive SMS alerts for important updates
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Marketing Communications</Label>
                      <p className="text-sm text-gray-500">
                        Receive promotional offers and deals
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="pt-4">
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
