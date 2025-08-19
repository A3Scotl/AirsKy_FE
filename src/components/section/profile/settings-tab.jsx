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
    language: "vi",
    currency: "VND",
    timezone: "GMT+7",
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    flightReminders: true,
    priceAlerts: true,
    promotionalEmails: true,
    darkMode: false,
  });

  const settingsConfig = {
    languages: [
      { value: "vi", label: "Tiếng Việt" },
      { value: "en", label: "English" },
      { value: "zh", label: "中文" },
      { value: "ja", label: "日本語" },
    ],
    currencies: [
      { value: "VND", label: "VND (₫)" },
      { value: "USD", label: "USD ($)" },
      { value: "EUR", label: "EUR (€)" },
      { value: "JPY", label: "JPY (¥)" },
    ],
    timezones: [
      { value: "GMT+7", label: "GMT+7 (Việt Nam)" },
      { value: "GMT+0", label: "GMT+0 (UTC)" },
      { value: "GMT+1", label: "GMT+1 (Châu Âu)" },
      { value: "GMT+8", label: "GMT+8 (Singapore)" },
      { value: "GMT+9", label: "GMT+9 (Nhật Bản)" },
    ],
  };

  const handleSwitchChange = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    console.log("Cài đặt đã lưu:", settings);
    // Gọi API để lưu cài đặt
  };

  const handleResetSettings = () => {
    setSettings({
      language: "vi",
      currency: "VND",
      timezone: "GMT+7",
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      flightReminders: true,
      priceAlerts: true,
      promotionalEmails: false,
      darkMode: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Cài đặt chung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cài đặt chung
          </CardTitle>
          <CardDescription>
            Cấu hình các tùy chọn cơ bản và cài đặt khu vực
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Ngôn ngữ
              </Label>
              <Select
                value={settings.language}
                onValueChange={(value) => handleSelectChange("language", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngôn ngữ" />
                </SelectTrigger>
                <SelectContent>
                  {settingsConfig.languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Tiền tệ
              </Label>
              <Select
                value={settings.currency}
                onValueChange={(value) => handleSelectChange("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tiền tệ" />
                </SelectTrigger>
                <SelectContent>
                  {settingsConfig.currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Múi giờ
              </Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => handleSelectChange("timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn múi giờ" />
                </SelectTrigger>
                <SelectContent>
                  {settingsConfig.timezones.map((timezone) => (
                    <SelectItem key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Chế độ tối
                </Label>
                <p className="text-sm text-muted-foreground">
                  Bật giao diện tối cho ứng dụng
                </p>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={() => handleSwitchChange("darkMode")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cài đặt thông báo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Tùy chọn thông báo
          </CardTitle>
          <CardDescription>
            Quản lý cách bạn nhận thông báo về chuyến bay và đặt vé
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">Thông báo qua Email</p>
                    <p className="text-sm text-gray-500">
                      Nhận thông báo qua email
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
                    <p className="font-medium">Thông báo SMS</p>
                    <p className="text-sm text-gray-500">
                      Nhận thông báo qua tin nhắn
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
                    <p className="font-medium">Thông báo đẩy</p>
                    <p className="text-sm text-gray-500">
                      Nhận thông báo trên trình duyệt
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
                    <p className="font-medium">Nhắc nhở chuyến bay</p>
                    <p className="text-sm text-gray-500">
                      Nhắc nhở check-in và khởi hành
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
                    <p className="font-medium">Cảnh báo giá</p>
                    <p className="text-sm text-gray-500">
                      Thông báo khi giá vé giảm
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
                    <p className="font-medium">Email khuyến mãi</p>
                    <p className="text-sm text-gray-500">
                      Ưu đãi và khuyến mãi đặc biệt
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
    </div>
  );
};

export default SettingsTab;
