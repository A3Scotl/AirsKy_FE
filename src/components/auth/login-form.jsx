"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/apis/auth-api";
import GoogleLoginButton from "./google-login-button";

const errorMessages = {
  EMAIL_NOT_VERIFIED: "Vui lòng xác minh email trước khi đăng nhập.",
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng. Vui lòng thử lại.",
};

export default function LoginForm({ setCurrentView }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const response = await authApi.login(formData);

    if (response.success) {
      const token = response.data?.accessToken;
      localStorage.setItem("token", token);

      const decoded = jwtDecode(token);
      const userData = {
        email: decoded.sub,
        role: decoded.role,
        exp: decoded.exp,
      };

      login(userData);
      toast.success(response.message);
      navigate("/");
    } else {
      const errorKey = Object.keys(errorMessages).find((key) =>
        response.message.includes(key)
      );
      toast.error(errorKey ? errorMessages[errorKey] : response.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Chào mừng trở lại
                </h2>
                <p className="text-gray-600">
                  Vui lòng đăng nhập vào tài khoản của bạn
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ Email
                  </label>
                  <Input
                    type="email"
                    placeholder="Nhập địa chỉ email của bạn"
                    className="w-full"
                    value={formData.email}
                    onChange={handleInputChange("email")}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu của bạn"
                      className="w-full pr-10"
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
                    <span className="px-2 bg-white text-gray-500">HOẶC</span>
                  </div>
                </div>

                <GoogleLoginButton disabled={loading} />

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
