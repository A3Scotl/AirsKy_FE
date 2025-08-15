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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Bell,
  Moon,
  Mail,
  Globe,
  MapPin,
  DollarSign,
  Plane,
  Calendar,
  Smartphone,
  Shield,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  CreditCard,
  Users,
  Info,
} from "lucide-react";

const SettingsTab = () => {
  const [settings, setSettings] = useState({
    // General Settings
    language: "english",
    currency: "usd",
    timezone: "utc",

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    flightReminders: true,
    priceAlerts: true,
    promotionalEmails: true,

    // Privacy Settings
    profileVisibility: "private",
    shareBookingHistory: false,
    allowDataAnalytics: true,

    // Booking Preferences
    defaultTripType: "roundtrip",
    preferredClass: "economy",
    seatPreference: "window",
    mealPreference: "none",

    // App Settings
    darkMode: false,
    autoSave: true,
    offlineMode: false,
  });

  const handleSwitchChange = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    console.log("Settings saved:", settings);
    // Here you would typically save to backend
  };

  const handleResetSettings = () => {
    // Reset to default values
    setSettings({
      language: "english",
      currency: "usd",
      timezone: "utc",
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      flightReminders: true,
      priceAlerts: true,
      promotionalEmails: false,
      profileVisibility: "private",
      shareBookingHistory: false,
      allowDataAnalytics: true,
      defaultTripType: "roundtrip",
      preferredClass: "economy",
      seatPreference: "window",
      mealPreference: "none",
      darkMode: false,
      autoSave: true,
      offlineMode: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Configure your basic preferences and regional settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Language
              </Label>
              <Select
                value={settings.language}
                onValueChange={(value) => handleSelectChange("language", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">🇺🇸 English</SelectItem>
                  <SelectItem value="vietnamese">🇻🇳 Tiếng Việt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Currency
              </Label>
              <Select
                value={settings.currency}
                onValueChange={(value) => handleSelectChange("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD - US Dollar</SelectItem>
                  <SelectItem value="vnd">VND - Vietnamese Dong</SelectItem>
                  <SelectItem value="eur">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timezone
              </Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => handleSelectChange("timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc">UTC (GMT+0)</SelectItem>
                  <SelectItem value="est">EST (GMT-5)</SelectItem>
                  <SelectItem value="pst">PST (GMT-8)</SelectItem>
                  <SelectItem value="jst">JST (GMT+9)</SelectItem>
                  <SelectItem value="ict">ICT (GMT+7)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Appearance
              </Label>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Dark Mode</span>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={() => handleSwitchChange("darkMode")}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Manage how you receive updates about your flights and bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">
                      Receive updates via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={() =>
                    handleSwitchChange("emailNotifications")
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-gray-500">
                      Get text messages for important updates
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={() => handleSwitchChange("smsNotifications")}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-500">
                      Browser push notifications
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={() =>
                    handleSwitchChange("pushNotifications")
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Plane className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">Flight Reminders</p>
                    <p className="text-sm text-gray-500">
                      Check-in and departure reminders
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.flightReminders}
                  onCheckedChange={() => handleSwitchChange("flightReminders")}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">Price Alerts</p>
                    <p className="text-sm text-gray-500">
                      Get notified about price drops
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.priceAlerts}
                  onCheckedChange={() => handleSwitchChange("priceAlerts")}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="font-medium">Promotional Emails</p>
                    <p className="text-sm text-gray-500">
                      Deals and special offers
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.promotionalEmails}
                  onCheckedChange={() =>
                    handleSwitchChange("promotionalEmails")
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Booking Preferences
          </CardTitle>
          <CardDescription>
            Set your default preferences for faster booking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="defaultTripType">Default Trip Type</Label>
              <Select
                value={settings.defaultTripType}
                onValueChange={(value) =>
                  handleSelectChange("defaultTripType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trip type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roundtrip">Round Trip</SelectItem>
                  <SelectItem value="oneway">One Way</SelectItem>
                  <SelectItem value="multicity">Multi City</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredClass">Preferred Class</Label>
              <Select
                value={settings.preferredClass}
                onValueChange={(value) =>
                  handleSelectChange("preferredClass", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium">Premium Economy</SelectItem>
                  <SelectItem value="business">Business Class</SelectItem>
                  <SelectItem value="first">First Class</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seatPreference">Seat Preference</Label>
              <Select
                value={settings.seatPreference}
                onValueChange={(value) =>
                  handleSelectChange("seatPreference", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select seat preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="window">Window</SelectItem>
                  <SelectItem value="aisle">Aisle</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                  <SelectItem value="any">No Preference</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mealPreference">Meal Preference</Label>
              <Select
                value={settings.mealPreference}
                onValueChange={(value) =>
                  handleSelectChange("mealPreference", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meal preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Special Meal</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="halal">Halal</SelectItem>
                  <SelectItem value="kosher">Kosher</SelectItem>
                  <SelectItem value="glutenfree">Gluten Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Control your privacy and data sharing preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium">Profile Visibility</p>
                  <p className="text-sm text-gray-500">
                    Who can see your profile information
                  </p>
                </div>
              </div>
              <Select
                value={settings.profileVisibility}
                onValueChange={(value) =>
                  handleSelectChange("profileVisibility", value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium">Share Booking History</p>
                  <p className="text-sm text-gray-500">
                    Allow sharing trip history with friends
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.shareBookingHistory}
                onCheckedChange={() =>
                  handleSwitchChange("shareBookingHistory")
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Info className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="font-medium">Allow Data Analytics</p>
                  <p className="text-sm text-gray-500">
                    Help improve our service with usage data
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.allowDataAnalytics}
                onCheckedChange={() => handleSwitchChange("allowDataAnalytics")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            App Settings
          </CardTitle>
          <CardDescription>
            Configure app behavior and performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium">Auto Save</p>
                  <p className="text-sm text-gray-500">
                    Automatically save your search preferences
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={() => handleSwitchChange("autoSave")}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Download className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium">Offline Mode</p>
                  <p className="text-sm text-gray-500">
                    Download data for offline access
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.offlineMode}
                onCheckedChange={() => handleSwitchChange("offlineMode")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleSaveSettings} className="flex-1">
              <Settings className="w-4 h-4 mr-2" />
              Save All Settings
            </Button>
            <Button
              variant="outline"
              onClick={handleResetSettings}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
            <Button variant="destructive" className="flex-1">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-center">
            <p className="text-sm text-gray-500 text-center">
              Settings are automatically synced across your devices.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
