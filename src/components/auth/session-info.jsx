import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  RefreshCw,
  LogOut,
  Shield,
  Monitor,
  Globe,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Laptop,
  Eye,
  EyeOff,
  MapPin,
  Wifi,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const SessionInfo = () => {
  const { user, logout } = useAuth();
  const [sessionInfo, setSessionInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showToken, setShowToken] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    // Lấy thông tin thiết bị và trình duyệt
    const getDeviceInfo = () => {
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const language = navigator.language;

      let deviceType = "Unknown";
      let deviceIcon = Monitor;
      let browser = "Unknown";

      // Detect device type
      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        )
      ) {
        deviceType = "Mobile";
        deviceIcon = Smartphone;
      } else if (/Tablet|iPad/i.test(userAgent)) {
        deviceType = "Tablet";
        deviceIcon = Smartphone;
      } else {
        deviceType = "Desktop";
        deviceIcon = Laptop;
      }

      // Detect browser
      if (userAgent.includes("Chrome")) browser = "Chrome";
      else if (userAgent.includes("Firefox")) browser = "Firefox";
      else if (userAgent.includes("Safari")) browser = "Safari";
      else if (userAgent.includes("Edge")) browser = "Edge";
      else if (userAgent.includes("Opera")) browser = "Opera";

      setDeviceInfo({
        type: deviceType,
        browser,
        platform,
        language,
        icon: deviceIcon,
        userAgent: userAgent.substring(0, 100) + "...",
      });
    };

    getDeviceInfo();
  }, []);

  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setSessionInfo({
          status: "NO_TOKEN",
          message: "Không có phiên đăng nhập",
        });
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;
        const isExpired = decoded.exp < now;
        const totalDuration = decoded.exp - decoded.iat;
        const elapsed = now - decoded.iat;
        const progressPercent = Math.min(
          100,
          Math.max(0, (elapsed / totalDuration) * 100)
        );

        const sessionData = {
          status: isExpired ? "EXPIRED" : "ACTIVE",
          issuedAt: new Date(decoded.iat * 1000),
          expiresAt: new Date(decoded.exp * 1000),
          timeLeft: Math.max(0, decoded.exp - now),
          progressPercent,
          userInfo: {
            email: decoded.sub,
            role: decoded.role,
            id: decoded.id || decoded.sub,
          },
          tokenPreview: `${token.substring(0, 20)}...${token.substring(
            token.length - 20
          )}`,
          fullToken: token,
        };

        setSessionInfo(sessionData);
        setTimeLeft(sessionData.timeLeft);

        if (!isExpired) {
          const interval = setInterval(() => {
            const currentTime = Date.now() / 1000;
            const remaining = Math.max(0, decoded.exp - currentTime);
            const newElapsed = currentTime - decoded.iat;
            const newProgress = Math.min(
              100,
              Math.max(0, (newElapsed / totalDuration) * 100)
            );

            setTimeLeft(remaining);
            setSessionInfo((prev) => ({
              ...prev,
              timeLeft: remaining,
              progressPercent: newProgress,
            }));

            if (remaining <= 0) {
              clearInterval(interval);
              setSessionInfo((prev) => ({ ...prev, status: "EXPIRED" }));
            }
          }, 1000);

          return () => clearInterval(interval);
        }
      } catch (error) {
        setSessionInfo({
          status: "INVALID",
          message: "Phiên đăng nhập không hợp lệ",
          error: error.message,
        });
      }
    };

    checkSession();
  }, []);

  const formatTime = (seconds) => {
    if (seconds <= 0) return "Đã hết hạn";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500";
      case "EXPIRED":
        return "bg-red-500";
      case "INVALID":
        return "bg-yellow-500";
      case "NO_TOKEN":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "ACTIVE":
        return "Hoạt động";
      case "EXPIRED":
        return "Đã hết hạn";
      case "INVALID":
        return "Không hợp lệ";
      case "NO_TOKEN":
        return "Chưa đăng nhập";
      default:
        return "Không xác định";
    }
  };

  if (!sessionInfo) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Đang tải thông tin phiên...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Session Status Card */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Trạng thái phiên đăng nhập
            </CardTitle>
            <Badge
              className={`${getStatusColor(sessionInfo.status)} text-white`}
            >
              {getStatusText(sessionInfo.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {sessionInfo.status === "ACTIVE" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Thời gian sử dụng</span>
                <span>{Math.round(sessionInfo.progressPercent)}%</span>
              </div>
              <Progress value={sessionInfo.progressPercent} className="h-2" />
            </div>
          )}

          {/* Time Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Thời gian còn lại</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Hết hạn vào</p>
                <p className="text-sm text-gray-600">
                  {sessionInfo.expiresAt?.toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User & Device Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Thông tin tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">
                  {sessionInfo.userInfo.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{sessionInfo.userInfo.email}</p>
                <Badge variant="outline" className="text-xs">
                  {sessionInfo.userInfo.role}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID người dùng:</span>
                <span className="font-mono">{sessionInfo.userInfo.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đăng nhập lúc:</span>
                <span>{sessionInfo.issuedAt?.toLocaleString("vi-VN")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {deviceInfo?.icon && <deviceInfo.icon className="h-5 w-5" />}
              Thiết bị & trình duyệt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              {deviceInfo?.icon && (
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <deviceInfo.icon className="h-5 w-5 text-gray-600" />
                </div>
              )}
              <div>
                <p className="font-medium">{deviceInfo?.type || "Unknown"}</p>
                <p className="text-sm text-gray-600">
                  {deviceInfo?.browser || "Unknown"}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <span>{deviceInfo?.platform || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{deviceInfo?.language || "Unknown"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security & Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Bảo mật & Hành động
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Security Status */}
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Phiên bảo mật</p>
              <p className="text-sm text-green-600">
                Token JWT được mã hóa và xác thực
              </p>
            </div>
          </div>

          {/* Token Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Token xác thực:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="p-2 bg-gray-50 rounded font-mono text-xs break-all">
              {showToken ? sessionInfo.fullToken : sessionInfo.tokenPreview}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button onClick={logout} variant="destructive" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session Analytics */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Phân tích phiên
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(sessionInfo.progressPercent)}%
              </p>
              <p className="text-xs text-blue-600">Đã sử dụng</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {Math.floor(timeLeft / 60)}m
              </p>
              <p className="text-xs text-green-600">Còn lại</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {deviceInfo?.type === "Mobile" ? "📱" : "💻"}
              </p>
              <p className="text-xs text-purple-600">Thiết bị</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {sessionInfo.status === "ACTIVE" ? "✅" : "❌"}
              </p>
              <p className="text-xs text-orange-600">Trạng thái</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionInfo;
