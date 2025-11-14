import { useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/apis/auth-api";

const errorMessages = {
  email: {
    notFound: "Không tìm thấy tài khoản với địa chỉ email này.",
    invalid: "Vui lòng nhập địa chỉ email hợp lệ",
  },
  otp: {
    invalid: "Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.",
    expired: "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.",
    short: "Vui lòng nhập mã OTP hợp lệ",
  },
  password: {
    mismatch: "Mật khẩu không khớp",
    short: "Mật khẩu phải có ít nhất 6 ký tự",
  },
};

const successMessages = {
  otpSent:
    "Mã xác minh đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
  passwordReset:
    "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.",
  otpResent: "Mã xác minh mới đã được gửi đến email của bạn thành công.",
};

export default function ResetForm({ setCurrentView }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    otpCode: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmNewPassword: false,
  });
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const navigate = useNavigate();

  // Countdown effect for OTP resend
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
    let value = e.target.value;
    if (field === "otpCode") {
      value = value.replace(/\D/g, "").slice(0, 6);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleError = (response, defaultMessage) => {

    // Handle new backend response format
    const fullErrorData = response.data;
    const errorMessage = response.error || response.message || "";
    const backendError =
      response.error || // Try response.error first (from interceptor)
      fullErrorData?.error ||
      fullErrorData?.message ||
      errorMessage;

    const message = backendError?.toLowerCase() || "";

    if (
      message.includes("user not found") ||
      message.includes("email not found") ||
      message.includes("email không tồn tại")
    ) {
      toast.error(errorMessages.email.notFound);
    } else if (message.includes("invalid") && message.includes("otp")) {
      toast.error(errorMessages.otp.invalid);
    } else if (message.includes("expired") || message.includes("hết hạn")) {
      toast.error(errorMessages.otp.expired);
    } else {
      toast.error(backendError || defaultMessage);
    }
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.email.includes("@")) {
      toast.error(errorMessages.email.invalid);
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.otpCode || formData.otpCode.length < 4) {
      toast.error(errorMessages.otp.short);
      return false;
    }
    if (!formData.newPassword || formData.newPassword.length < 6) {
      toast.error(errorMessages.password.short);
      return false;
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      toast.error(errorMessages.password.mismatch);
      return false;
    }
    return true;
  };

  const handleSendReset = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setLoading(true);
    try {
      const response = await authApi.forgotPasswordRequest({
        email: formData.email,
      });

      if (response.success) {
        toast.success(successMessages.otpSent);
        setStep(2);
        setCountdown(60);
        setIsResendDisabled(true);
      } else {
        handleError(response, "Không thể gửi mã xác minh");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      console.error("Forgot password error response:", error.response?.data);
      console.error("Forgot password error status:", error.response?.status);
      toast.error("Đã xảy ra lỗi khi gửi mã xác minh. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const response = await authApi.resetPassword({
        email: formData.email,
        otpCode: formData.otpCode.trim(),
        newPassword: formData.newPassword,
      });

      if (response.success) {
        toast.success(successMessages.passwordReset);
        setCurrentView("login");
      } else {
        handleError(response, "Không thể đặt lại mật khẩu");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      console.error("Reset password error response:", error.response?.data);
      console.error("Reset password error status:", error.response?.status);
      toast.error("Đã xảy ra lỗi khi đặt lại mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const response = await authApi.resendOtpCode({ email: formData.email });

      if (response.success) {
        toast.success(successMessages.otpResent);
        setCountdown(60);
        setIsResendDisabled(true);
      } else {
        handleError(response, "Không thể gửi lại mã xác minh");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      console.error("Resend OTP error response:", error.response?.data);
      console.error("Resend OTP error status:", error.response?.status);
      toast.error("Đã xảy ra lỗi khi gửi lại mã xác minh. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordField = (field, label, placeholder) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <Input
          type={showPassword[field] ? "text" : "password"}
          placeholder={placeholder}
          className="w-full pr-10"
          value={formData[field]}
          onChange={handleInputChange(field)}
          disabled={loading}
          required
          minLength={6}
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
      {/* Validation messages */}
      {field === "newPassword" &&
        formData[field] &&
        formData[field].length < 6 && (
          <p className="text-red-500 text-xs mt-1">
            Mật khẩu phải có ít nhất 6 ký tự
          </p>
        )}
      {field === "confirmNewPassword" && formData[field] && (
        <p
          className={`text-xs mt-1 ${
            formData.newPassword !== formData[field]
              ? "text-red-500"
              : formData[field].length >= 6
              ? "text-green-500"
              : "text-red-500"
          }`}
        >
          {formData.newPassword !== formData[field]
            ? "Mật khẩu không khớp"
            : formData[field].length >= 6
            ? "Mật khẩu khớp"
            : "Mật khẩu phải có ít nhất 6 ký tự"}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
            <Link to="/" className="text-xl font-bold text-blue-600">AirSky</Link>
            <div className="w-16" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Đặt lại mật khẩu
                </h2>
                <p className="text-gray-600 dark:text-gray-200">
                  {step === 1
                    ? "Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn mã xác minh để đặt lại mật khẩu."
                    : `Chúng tôi đã gửi mã xác minh đến ${formData.email}. Vui lòng kiểm tra email của bạn và nhập mã bên dưới.`}
                </p>
              </div>

              {step === 1 ? (
                <form className="space-y-6" onSubmit={handleSendReset}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="Nhập địa chỉ email của bạn"
                      className="w-full dark:text-black"
                      value={formData.email}
                      onChange={handleInputChange("email")}
                      disabled={loading}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    disabled={loading}
                  >
                    {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
                  </Button>
                  <div className="text-center mt-6">
                    <button
                      type="button"
                      onClick={() => setCurrentView("login")}
                      disabled={loading}
                      className={`text-blue-600 hover:underline font-medium inline-flex items-center ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Quay lại đăng nhập
                    </button>
                  </div>
                </form>
              ) : (
                <form className="space-y-6" onSubmit={handleReset}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã OTP
                    </label>
                    <Input
                      type="text"
                      placeholder="Nhập mã xác minh 6 chữ số"
                      className="w-full"
                      value={formData.otpCode}
                      onChange={handleInputChange("otpCode")}
                      disabled={loading}
                      maxLength={6}
                      required
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      Kiểm tra email của bạn để biết mã xác minh. Có thể mất vài
                      phút để đến nơi.
                    </p>
                  </div>

                  {renderPasswordField(
                    "newPassword",
                    "Mật khẩu mới",
                    "Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  )}
                  {renderPasswordField(
                    "confirmNewPassword",
                    "Xác nhận mật khẩu mới",
                    "Xác nhận mật khẩu mới"
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    disabled={loading}
                  >
                    {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
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
