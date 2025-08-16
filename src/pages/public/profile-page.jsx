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
import { Plane, Heart, User, Settings } from "lucide-react";

// Import tab components
import MyBookingsTab from "../../components/section/profile/my-bookings-tab";
import FavouritesTab from "@/components/section/profile/favourites-tab";
import AccountTab from "@/components/section/profile/account-tab";
import SettingsTab from "@/components/section/profile/settings-tab";

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState("my-booking");

  // Fake user data
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "https://github.com/shadcn.png",
    joined: "January 2023",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="md:col-span-1">
            <Card className="sticky top-8">
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
                <p className="text-sm text-gray-500 mt-2">
                  Member since {user.joined}
                </p>
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
                    My Bookings
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
                    Favourites
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      activeTab === "account" ? "bg-blue-100 text-blue-600" : ""
                    }`}
                    onClick={() => setActiveTab("account")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      activeTab === "setting" ? "bg-blue-100 text-blue-600" : ""
                    }`}
                    onClick={() => setActiveTab("setting")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </nav>
              </div>
            </Card>
          </div>

          {/* Right Content */}
          <div className="md:col-span-3">
            {activeTab === "my-booking" && <MyBookingsTab />}
            {activeTab === "favourite" && <FavouritesTab />}
            {activeTab === "account" && <AccountTab user={user} />}
            {activeTab === "setting" && <SettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
