import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Activity,
  Shield,
  Crown,
  CheckCircle,
  XCircle,
  Clock,
  Plane,
  CreditCard,
  MapPinIcon,
  UserCheck,
  AlertTriangle,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const UserDetailsModal = ({
  open,
  onClose,
  user,
  currentUser,
  onEditUser,
  onSuspendUser,
  onDeleteUser,
}) => {
  if (!user) return null;

  const getStatusBadge = (status) => {
    const variants = {
      Active: "bg-green-100 text-green-800 border-green-200",
      Suspended: "bg-red-100 text-red-800 border-red-200",
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getRoleBadge = (role) => {
    const variants = {
      Customer: "bg-blue-100 text-blue-800",
      Premium: "bg-purple-100 text-purple-800",
      Admin: "bg-orange-100 text-orange-800",
    };
    return variants[role] || "bg-gray-100 text-gray-800";
  };

  const getRoleIcon = (role) => {
    const icons = {
      Customer: User,
      Premium: Crown,
      Admin: Shield,
    };
    return icons[role] || User;
  };

  const getStatusIcon = (status) => {
    const icons = {
      Active: CheckCircle,
      Suspended: XCircle,
      Pending: Clock,
    };
    return icons[status] || CheckCircle;
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLastLogin = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  const StatusIcon = getStatusIcon(user.status);
  const RoleIcon = getRoleIcon(user.role);

  // Mock data for recent bookings and activities
  const recentBookings = [
    {
      id: "BK001",
      route: "HAN → SGN",
      date: "2024-01-15",
      status: "Completed",
      amount: 1500000,
    },
    {
      id: "BK002",
      route: "SGN → DAD",
      date: "2024-01-10",
      status: "Cancelled",
      amount: 2200000,
    },
    {
      id: "BK003",
      route: "HAN → HPH",
      date: "2024-01-05",
      status: "Completed",
      amount: 800000,
    },
  ];

  const recentActivities = [
    {
      action: "Profile updated",
      date: "2024-01-15 10:30",
      description: "Changed contact information",
    },
    {
      action: "Booking created",
      date: "2024-01-15 09:15",
      description: "Created booking BK001",
    },
    {
      action: "Login",
      date: "2024-01-15 09:00",
      description: "Logged in from Vietnam",
    },
    {
      action: "Password changed",
      date: "2024-01-10 14:20",
      description: "Password successfully updated",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-sm text-gray-500">ID: {user.id}</p>
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <StatusIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge
                      variant="outline"
                      className={`${getStatusBadge(user.status)} mt-1`}
                    >
                      {user.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <RoleIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <Badge
                      variant="outline"
                      className={`${getRoleBadge(user.role)} mt-1`}
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Total Spent</p>
                    <p className="text-lg font-bold text-green-600">
                      ${user.totalSpent?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Personal Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{user.email}</p>
                          {user.verifiedEmail && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{user.phone}</p>
                      </div>
                    </div>

                    
                  
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Account Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Join Date</p>
                        <p className="font-medium">
                          {formatDate(user.joinDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Last Login</p>
                        <p className="font-medium">
                          {formatLastLogin(user.lastLogin)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Plane className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Total Bookings</p>
                        <p className="font-medium">{user.totalBookings}</p>
                      </div>
                    </div>

                    {user.memberSince && (
                      <div className="flex items-center space-x-3">
                        <UserCheck className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Member Since</p>
                          <p className="font-medium">
                            {formatDate(user.memberSince)}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>
                    Latest booking history for this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Plane className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="font-medium">{booking.route}</p>
                            <p className="text-sm text-gray-500">
                              {booking.id} • {formatDate(booking.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              booking.status === "Completed"
                                ? "default"
                                : booking.status === "Cancelled"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {booking.status}
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            ${booking.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    User activity and account changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-gray-500">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {activity.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-orange-600">
                      Account Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => onEditUser && onEditUser(user)}
                      disabled={user?.email === currentUser?.email}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User Details
                    </Button>

                    {user.status === "Active" ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-orange-600 border-orange-200"
                        onClick={() => onSuspendUser && onSuspendUser(user)}
                        disabled={user?.email === currentUser?.email}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Suspend Account
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-green-600 border-green-200"
                        onClick={() => onSuspendUser && onSuspendUser(user)}
                        disabled={user?.email === currentUser?.email}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activate Account
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => onDeleteUser && onDeleteUser(user)}
                      disabled={user?.email === currentUser?.email}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Delete User Account
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      This action cannot be undone. All user data will be
                      permanently deleted.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
