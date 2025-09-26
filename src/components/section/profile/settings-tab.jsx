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
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  DollarSign,
  Bell,
  Mail,
  Smartphone,
  Plane,
  Moon,
  RefreshCw,
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
    promotionalEmails: false,
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
    // Gọi API để lưu cài đặt (ví dụ: POST /api/settings)
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
    <div className=" space-y-6">
      {/* Cài đặt chung */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            Cài đặt chung
          </CardTitle>
          <CardDescription>Chọn ngôn ngữ, tiền tệ và múi giờ</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Ngôn ngữ</Label>
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
          <div>
            <Label>Tiền tệ</Label>
            <Select
              value={settings.currency}
              onValueChange={(value) => handleSelectChange("currency", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn tiền tệ" />
              </SelectTrigger>
              <SelectContent>
                {settingsConfig.currencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Múi giờ</Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => handleSelectChange("timezone", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn múi giờ" />
              </SelectTrigger>
              <SelectContent>
                {settingsConfig.timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Thông báo */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Tùy chọn thông báo
          </CardTitle>
          <CardDescription>Quản lý thông báo chuyến bay và vé</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>Thông báo Email</span>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={() => handleSwitchChange("emailNotifications")}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-green-600" />
                <span>Thông báo SMS</span>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={() => handleSwitchChange("smsNotifications")}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Plane className="h-4 w-4 text-blue-600" />
                <span>Nhắc nhở chuyến bay</span>
              </div>
              <Switch
                checked={settings.flightReminders}
                onCheckedChange={() => handleSwitchChange("flightReminders")}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-orange-600" />
                <span>Email khuyến mãi</span>
              </div>
              <Switch
                checked={settings.promotionalEmails}
                onCheckedChange={() => handleSwitchChange("promotionalEmails")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chế độ giao diện */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Moon className="h-5 w-5" />
            Chế độ giao diện
          </CardTitle>
          <CardDescription>Chọn giao diện sáng hoặc tối</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <Moon className="h-4 w-4 text-gray-600" />
              <span>Chế độ tối</span>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={() => handleSwitchChange("darkMode")}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleResetSettings}>
            <RefreshCw className="mr-2 h-4 w-4" /> Đặt lại
          </Button>
          <Button onClick={saveSettings}>Lưu thay đổi</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SettingsTab;
