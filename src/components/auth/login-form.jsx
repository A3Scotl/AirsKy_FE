"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/apis/auth-api";
// Import GoogleLoginButton lazily to avoid initialization issues
const GoogleLoginButton = lazy(() => import("./google-login-button"));

const errorMessages = {
  EMAIL_NOT_VERIFIED: "Vui lòng xác minh email trước khi đăng nhập.",
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng. Vui lòng thử lại.",
};

export default function LoginForm({ setCurrentView }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGoogleLogin, setShowGoogleLogin] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  // Delay Google login button to avoid initialization conflicts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGoogleLogin(true);
    }, 1000); // Delay 1 second

    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("🔐 Attempting login with:", {
        email: formData.email,
        password: "***",
      });

      const response = await authApi.login(formData);
      console.log("📡 Login API response:", response);

      if (response.success) {
        // Try multiple token field names
        const token =
          response.data?.accessToken ||
          response.data?.token ||
          response.data?.access_token ||
          response.data?.Token;

        if (!token) {
          console.error("❌ No token found in response:", response.data);
          toast.error("Không nhận được token từ server");
          return;
        }

        console.log("💾 Saving token to localStorage");
        localStorage.setItem("token", token);

        console.log("🔍 Decoding JWT token...");
        const decoded = jwtDecode(token);
        console.log("📝 Decoded JWT:", decoded);

        // Try multiple user ID sources
        const userData = {
          id:
            response.data?.user?.id ||
            response.data?.id ||
            decoded.id ||
            decoded.sub ||
            decoded.user_id,
          email: decoded.sub || decoded.email || formData.email,
          role: decoded.role || response.data?.user?.role || "USER",
          exp: decoded.exp,
        };

        console.log("👤 Final user data:", userData);

        login(userData);
        toast.success(response.message || "Đăng nhập thành công!");
        navigate("/");
      } else {
        console.error("❌ Login failed:", response);
        const errorKey = Object.keys(errorMessages).find((key) =>
          response.message?.includes(key)
        );
        toast.error(
          errorKey
            ? errorMessages[errorKey]
            : response.message || "Đăng nhập thất bại"
        );
      }
    } catch (error) {
      console.error("💥 Login error:", error);
      toast.error("Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-600 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Quay lại
            </button>
            <h1 className="text-xl font-bold text-blue-600">AirSky</h1>
            <div className="w-16" />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex items-center justify-center p-4 py-12 flex-1">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Chào mừng trở lại
                </h2>
                <p className="text-gray-600">
                  Vui lòng đăng nhập vào tài khoản của bạn
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Địa chỉ Email
                  </label>
                  <Input
                    type="email"
                    placeholder="Nhập địa chỉ email của bạn"
                    className="w-full dark:text-gray-900"
                    value={formData.email}
                    onChange={handleInputChange("email")}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu của bạn"
                      className="w-full pr-10 dark:text-gray-900"
                      value={formData.password}
                      onChange={handleInputChange("password")}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setCurrentView("reset")}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  disabled={loading}
                >
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-[#171717] text-gray-500">
                      Hoặc
                    </span>
                  </div>
                </div>

                <div className="w-full">
                  {showGoogleLogin ? (
                    <Suspense
                      fallback={
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          disabled={true}
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Đang tải Google Sign-In...
                        </Button>
                      }
                    >
                      <GoogleLoginButton disabled={loading} />
                    </Suspense>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={true}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Chuẩn bị Google Sign-In...
                    </Button>
                  )}
                </div>

                <div className="text-center mt-6">
                  <span className="text-gray-600">Chưa có tài khoản? </span>
                  <button
                    type="button"
                    onClick={() => setCurrentView("register")}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Đăng ký
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
