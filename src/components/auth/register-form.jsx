import { useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/apis/auth-api";

const formLabels = {
  firstName: "Họ",
  lastName: "Tên",
  phone: "Số điện thoại",
  email: "Địa chỉ Email",
  password: "Mật khẩu",
  confirmPassword: "Xác nhận mật khẩu",
  otpCode: "Mã OTP",
};

const formPlaceholders = {
  firstName: "Nhập họ của bạn",
  lastName: "Nhập tên của bạn",
  phone: "Nhập số điện thoại của bạn",
  email: "Nhập địa chỉ email của bạn",
  password: "Tạo mật khẩu",
  confirmPassword: "Xác nhận mật khẩu của bạn",
  otpCode: "Nhập mã OTP",
};

export default function RegisterForm({ setCurrentView }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    otpCode: "",
  });
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const navigate = useNavigate();

  // Countdown effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu không khớp");
      return;
    }
    if (!agreeTerms) {
      toast.error("Bạn phải đồng ý với các điều khoản và điều kiện");
      return;
    }

    setLoading(true);
    const response = await authApi.register(formData);
    if (response.success) {
      toast.success(
        "Đăng ký thành công. Vui lòng nhập mã OTP được gửi đến email của bạn."
      );
      setStep(2);
      setCountdown(60);
      setIsResendDisabled(true);
    } else {
      toast.error(response.message);
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    const response = await authApi.verifyOtpRegistration({
      email: formData.email,
      otpCode: formData.otpCode,
    });
    if (response.success) {
      toast.success("Tài khoản đã được xác minh thành công.");
      setCurrentView("login");
    } else {
      toast.error(response.message);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setLoading(true);
    const response = await authApi.resendOtpCode({ email: formData.email });
    if (response.success) {
      toast.success("Mã OTP đã được gửi lại thành công.");
      setCountdown(60);
      setIsResendDisabled(true);
    } else {
      toast.error(response.message);
    }
    setLoading(false);
  };

  const renderFormField = (field, type = "text") => (
    <div key={field}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {formLabels[field]}
      </label>
      {field === "password" || field === "confirmPassword" ? (
        <div className="relative">
          <Input
            type={showPassword[field] ? "text" : "password"}
            placeholder={formPlaceholders[field]}
            className="w-full pr-10"
            value={formData[field]}
            onChange={handleInputChange(field)}
            required
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility(field)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          >
            {showPassword[field] ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      ) : (
        <Input
          type={type}
          placeholder={formPlaceholders[field]}
          className="w-full"
          value={formData[field]}
          onChange={handleInputChange(field)}
          required
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
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

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {step === 1 ? "Tạo tài khoản" : "Xác minh tài khoản"}
                </h2>
                <p className="text-gray-600">
                  {step === 1
                    ? "Tham gia AirSky và bắt đầu hành trình của bạn"
                    : "Nhập mã OTP để xác minh tài khoản"}
                </p>
              </div>

              {step === 1 ? (
                <form className="space-y-6" onSubmit={handleRegister}>
                  {[
                    "firstName",
                    "lastName",
                    "phone",
                    "email",
                    "password",
                    "confirmPassword",
                  ].map((field) =>
                    renderFormField(
                      field,
                      field === "email"
                        ? "email"
                        : field === "phone"
                        ? "tel"
                        : "text"
                    )
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreeTerms}
                      onCheckedChange={setAgreeTerms}
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      Tôi đồng ý với{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Điều khoản & Điều kiện
                      </a>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    disabled={loading}
                  >
                    {loading ? "Đang tạo..." : "Tạo tài khoản"}
                  </Button>

                  <div className="text-center mt-6">
                    <span className="text-gray-600">Đã có tài khoản? </span>
                    <button
                      type="button"
                      onClick={() => setCurrentView("login")}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Đăng nhập
                    </button>
                  </div>
                </form>
              ) : (
                <form className="space-y-6" onSubmit={handleVerify}>
                  {renderFormField("otpCode")}

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    disabled={loading}
                  >
                    {loading ? "Đang xác minh..." : "Xác minh"}
                  </Button>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={handleResend}
                      className={`text-blue-600 hover:underline ${
                        isResendDisabled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={loading || isResendDisabled}
                    >
                      {isResendDisabled
                        ? `Gửi lại OTP trong ${countdown}s`
                        : "Gửi lại OTP"}
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
