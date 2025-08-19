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
  Phone,
  MapPin,
  Calendar,
  Verified,
  Facebook,
  Twitter,
  Instagram,
  Github,
  Plus,
  Unlink,
  User,
  Loader2,
  Eye,
  EyeOff,
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

  const [socialAccounts] = useState([
    { name: "Facebook", icon: Facebook, connected: true, username: "john.doe" },

    { name: "Twitter", icon: Twitter, connected: false, username: "xdoee" },
    { name: "Instagram", icon: Instagram, connected: false, username: "" },
  ]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement profile update API call
      console.log("Profile update:", formData);
      toast.success("Profile updated successfully!");
      setEditMode(false);

      // Refresh profile data
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!passwordData.oldPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (!passwordData.newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      toast.error("New password must be different from current password");
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
        toast.success("Password changed successfully!");
        setPasswordData({
          email: userProfile?.email || "",
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordMode(false);
      } else {
        // Handle specific error cases
        if (response.message.includes("INVALID_CREDENTIALS")) {
          toast.error("Current password is incorrect");
        } else {
          toast.error(response.message || "Failed to change password");
        }
      }
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialConnect = (socialName) => {
    // Simulate social media connection
    console.log(`Connecting to ${socialName}`);
  };

  const handleSocialDisconnect = (socialName) => {
    // Simulate social media disconnection
    console.log(`Disconnecting from ${socialName}`);
  };

  return (
    <div className="space-y-6">
      {/* Personal Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Manage your personal details and profile
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
                        // Fallback if main avatar fails
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

                  {/* Avatar Source Info */}
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
                            title="Generated Avatar"
                          />
                        );
                      } else if (
                        avatarUrl?.includes("googleapis.com") ||
                        avatarUrl?.includes("googleusercontent.com")
                      ) {
                        return (
                          <div
                            className="w-4 h-4 bg-red-500 rounded-full"
                            title="Google Avatar"
                          />
                        );
                      } else {
                        return (
                          <div
                            className="w-4 h-4 bg-gray-500 rounded-full"
                            title="Default Avatar"
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
                    Avatar:{" "}
                    {(() => {
                      const avatarUrl =
                        userProfileUtils.getBestAvatarUrl(userProfile);
                      if (avatarUrl?.includes("gravatar.com")) {
                        return "Gravatar (based on email)";
                      } else if (avatarUrl?.includes("ui-avatars.com")) {
                        return "Generated from name";
                      } else if (
                        avatarUrl?.includes("googleapis.com") ||
                        avatarUrl?.includes("googleusercontent.com")
                      ) {
                        return "Google account photo";
                      } else {
                        return "Default avatar";
                      }
                    })()}
                  </div>

                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      <Verified className="w-3 h-3 mr-1" />
                      Verified Account
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
                      First Name
                    </Label>
                    <p className="mt-1">
                      {userProfile.firstName || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Last Name
                    </Label>
                    <p className="mt-1">
                      {userProfile.lastName || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Email Address
                    </Label>
                    <p className="mt-1">{userProfile.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Phone Number
                    </Label>
                    <p className="mt-1">
                      {userProfileUtils.getFormattedPhone(userProfile) ||
                        userProfile.phone ||
                        "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      User ID
                    </Label>
                    <p className="mt-1 font-mono text-sm">
                      {userProfile.id || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Account Role
                    </Label>
                    <p className="mt-1">
                      {userProfileUtils.getRoleDisplay(userProfile)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Member Since
                    </Label>
                    <p className="mt-1">
                      {userProfileUtils.getJoinDate(userProfile)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Account Status
                    </Label>
                    <p className="mt-1">
                      {userProfile.isVerified !== false ? (
                        <span className="text-green-600 font-medium">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-orange-600 font-medium">
                          ⚠ Pending Verification
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setEditMode(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" onClick={() => setPasswordMode(true)}>
                  <Lock className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className="bg-gray-50"
                    title="Email cannot be changed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed for security reasons
                  </p>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
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
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  disabled={loading}
                >
                  Cancel
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
              Update Password
            </CardTitle>
            <CardDescription>Change your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="oldPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    name="oldPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
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
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your new password (min 6 characters)"
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
                      Password must be at least 6 characters
                    </p>
                  )}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm your new password"
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
                      Passwords do not match
                    </p>
                  )}
                {passwordData.confirmPassword &&
                  passwordData.newPassword === passwordData.confirmPassword &&
                  passwordData.confirmPassword.length >= 6 && (
                    <p className="text-green-500 text-xs mt-1">
                      Passwords match
                    </p>
                  )}
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Password
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
                  Cancel
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
            Account Security
          </CardTitle>
          <CardDescription>
            Security information and account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Last Updated
                </Label>
                <p className="mt-1">
                  {userProfile.updatedAt
                    ? new Date(userProfile.updatedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : "Never updated"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Profile Completeness
                </Label>
                <div className="mt-1">
                  {userProfileUtils.isProfileComplete(userProfile) ? (
                    <span className="text-green-600 font-medium">
                      ✓ Complete
                    </span>
                  ) : (
                    <div>
                      <span className="text-orange-600 font-medium">
                        ⚠ Incomplete
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Missing:{" "}
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
                  Account Created
                </Label>
                <p className="mt-1">
                  {userProfile.createdAt
                    ? new Date(userProfile.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : "Unknown"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Password Security
                </Label>
                <div className="mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPasswordMode(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Change Password
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
          <CardTitle>Social Media Connections</CardTitle>
          <CardDescription>
            Connect your social media accounts for faster login and sharing
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
                        Connected
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-600 text-white"
                        onClick={() => handleSocialDisconnect(account.name)}
                      >
                        <Unlink className="w-4 h-4 mr-1" />
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSocialConnect(account.name)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Connect
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
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that will affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center flex-wrap gap-2 justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-900">Delete Account</p>
              <p className="text-sm text-red-700">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-4">
          <Separator />
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
            <p className="text-sm text-gray-600">
              Need help? Contact our support team for assistance.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AccountTab;
