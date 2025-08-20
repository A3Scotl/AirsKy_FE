"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Plane,
  Heart,
  User,
  Settings,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useUserProfile, userProfileUtils } from "@/hooks/use-user-profile";

// Import tab components
import MyBookingsTab from "../../components/section/profile/my-bookings-tab";
import FavouritesTab from "@/components/section/profile/favourites-tab";
import AccountTab from "@/components/section/profile/account-tab";
import SettingsTab from "@/components/section/profile/settings-tab";
import { Navigate } from "react-router-dom";

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState("my-booking");
  const { userProfile, loading, error, refetch } = useUserProfile();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !userProfile) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="md:col-span-1">
            <Card className="sticky top-8">
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage
                    src={userProfileUtils.getBestAvatarUrl(userProfile, 96)}
                    alt={userProfileUtils.getDisplayName(userProfile)}
                    onError={(e) => {
                      // Fallback if main avatar fails
                      e.target.src = userProfileUtils.getUIAvatarUrl(
                        userProfile,
                        96
                      );
                    }}
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                    {userProfileUtils.getUserInitials(userProfile)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">
                  {userProfileUtils.getDisplayName(userProfile)}
                </CardTitle>
                <CardDescription className="text-sm">
                  {userProfile.email}
                </CardDescription>
                <p className="text-sm text-gray-500 mt-2">
                  Thành viên từ {userProfileUtils.getJoinDate(userProfile)}
                </p>
                {userProfile.phone && (
                  <p className="text-sm text-gray-500">
                    {userProfileUtils.getFormattedPhone(userProfile) ||
                      userProfile.phone}
                  </p>
                )}
                {userProfile.role && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {userProfileUtils.getRoleDisplay(userProfile)}
                    </span>
                  </div>
                )}
              </CardHeader>
              <Separator />
              <div className="p-4">
                <nav className="space-y-2">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      activeTab === "my-booking"
                        ? "bg-blue-100 text-blue-600"
                        : ""
                    }`}
                    onClick={() => setActiveTab("my-booking")}
                  >
                    <Plane className="mr-2 h-4 w-4" />
                    Chuyến bay của tôi
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      activeTab === "favourite"
                        ? "bg-blue-100 text-blue-600"
                        : ""
                    }`}
                    onClick={() => setActiveTab("favourite")}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Yêu thích
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      activeTab === "account" ? "bg-blue-100 text-blue-600" : ""
                    }`}
                    onClick={() => setActiveTab("account")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Tài khoản
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      activeTab === "setting" ? "bg-blue-100 text-blue-600" : ""
                    }`}
                    onClick={() => setActiveTab("setting")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Cài đặt
                  </Button>
                </nav>
              </div>
            </Card>
          </div>

          {/* Right Content */}
          <div className="md:col-span-3">
            {activeTab === "my-booking" && (
              <MyBookingsTab
                userProfile={userProfile}
                onProfileUpdate={refetch}
              />
            )}
            {activeTab === "favourite" && (
              <FavouritesTab
                userProfile={userProfile}
                onProfileUpdate={refetch}
              />
            )}
            {activeTab === "account" && (
              <AccountTab userProfile={userProfile} onProfileUpdate={refetch} />
            )}
            {activeTab === "setting" && (
              <SettingsTab
                userProfile={userProfile}
                onProfileUpdate={refetch}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
