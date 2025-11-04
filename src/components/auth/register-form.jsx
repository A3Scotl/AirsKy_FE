import { useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/apis/auth-api";

// Validation utilities
const validationRules = {
  email: {
    required: true,
    pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{3,}$/,
    message:
      "Email không đúng định dạng. Vui lòng nhập email có dạng example@gmail.com",
  },
  password: {
    required: true,
    pattern:
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    message:
      "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
  },
  phone: {
    required: true,
    pattern: /^0[0-9]{9}$/,
    message: "Số điện thoại phải bắt đầu bằng 0 và đủ 10 số",
  },
  firstName: {
    required: true,
    minLength: 1,
    message: "Họ không được để trống",
  },
  lastName: {
    required: true,
    minLength: 1,
    message: "Tên không được để trống",
  },
  confirmPassword: {
    required: true,
    custom: (value, formData) => value === formData.password,
    message: "Mật khẩu xác nhận không khớp",
  },
  otpCode: {
    required: true,
    pattern: /^\d{6}$/,
    message: "Mã OTP phải gồm 6 chữ số",
  },
};

const validateField = (field, value, formData = {}) => {
  const rule = validationRules[field];
  if (!rule) return { isValid: true, message: "" };

  if (rule.required && (!value || value.trim() === "")) {
    return {
      isValid: false,
      message: `${
        field === "firstName"
          ? "Họ"
          : field === "lastName"
          ? "Tên"
          : field === "phone"
          ? "Số điện thoại"
          : field === "email"
          ? "Email"
          : field === "password"
          ? "Mật khẩu"
          : field === "confirmPassword"
          ? "Xác nhận mật khẩu"
          : "Mã OTP"
      } không được để trống`,
    };
  }

  if (rule.minLength && value && value.length < rule.minLength) {
    return { isValid: false, message: rule.message };
  }

  if (rule.pattern && value && !rule.pattern.test(value)) {
    return { isValid: false, message: rule.message };
  }

  if (rule.custom && !rule.custom(value, formData)) {
    return { isValid: false, message: rule.message };
  }

  return { isValid: true, message: "" };
};

const validateForm = (formData, step = 1) => {
  const errors = {};
  let isValid = true;

  if (step === 1) {
    // Validate registration fields
    [
      "firstName",
      "lastName",
      "phone",
      "email",
      "password",
      "confirmPassword",
    ].forEach((field) => {
      const result = validateField(field, formData[field], formData);
      if (!result.isValid) {
        errors[field] = result.message;
        isValid = false;
      }
    });
  } else {
    // Validate OTP field
    const result = validateField("otpCode", formData.otpCode, formData);
    if (!result.isValid) {
      errors.otpCode = result.message;
      isValid = false;
    }
  }

  return { isValid, errors };
};

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
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
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
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Mark field as touched
    setTouchedFields((prev) => ({ ...prev, [field]: true }));

    // Validate field in real-time
    const result = validateField(field, value, { ...formData, [field]: value });
    setValidationErrors((prev) => ({
      ...prev,
      [field]: result.isValid ? "" : result.message,
    }));

    // For confirm password, also validate when password changes
    if (field === "password" && touchedFields.confirmPassword) {
      const confirmResult = validateField(
        "confirmPassword",
        formData.confirmPassword,
        { ...formData, password: value }
      );
      setValidationErrors((prev) => ({
        ...prev,
        confirmPassword: confirmResult.isValid ? "" : confirmResult.message,
      }));
    }

    // For password, also validate confirm password when confirm password changes
    if (field === "confirmPassword" && touchedFields.password) {
      const confirmResult = validateField("confirmPassword", value, {
        ...formData,
        confirmPassword: value,
      });
      setValidationErrors((prev) => ({
        ...prev,
        confirmPassword: confirmResult.isValid ? "" : confirmResult.message,
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validate all fields
    const { isValid, errors } = validateForm(formData, 1);
    setValidationErrors(errors);

    if (!isValid) {
      toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
      return;
    }

    if (!agreeTerms) {
      toast.error("Bạn phải đồng ý với các điều khoản và điều kiện");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register(formData);
      console.log("Registration API response:", response);
      console.log("Response success:", response.success);
      console.log("Response data:", response.data);
      console.log("Response message:", response.message);
      console.log("Response error:", response.error);

      if (response.success) {
        console.log("Registration successful - tokens received:", {
          accessToken: response.data?.accessToken ? "***" : "missing",
          refreshToken: response.data?.refreshToken ? "***" : "missing",
        });
        toast.success(
          "Đăng ký thành công. Vui lòng nhập mã OTP được gửi đến email của bạn."
        );
        setStep(2);
        setCountdown(60);
        setIsResendDisabled(true);
        // Clear validation errors on success
        setValidationErrors({});
      } else {
        // Handle backend validation errors
        handleBackendErrors(response);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackendErrors = (response) => {
    console.log("Full backend response:", response);
    console.log("Response data:", response.data);
    console.log("Response error:", response.error);
    console.log("Response message:", response.message);

    const errorMessage = response.error || response.message || "";
    const exceptionMessage =
      response.data?.message || response.data?.error || "";

    console.log("Backend error message:", errorMessage);
    console.log("Exception message:", exceptionMessage);

    // Now response.data contains the full error response from backend
    const fullErrorData = response.data;
    const backendError =
      response.error || // Try response.error first (from interceptor)
      fullErrorData?.error ||
      fullErrorData?.message ||
      exceptionMessage ||
      errorMessage;

    console.log("Full error data:", fullErrorData);
    console.log("Backend error field:", backendError);

    // Map backend errors to field-specific errors
    const fieldErrors = {};

    if (backendError.includes("Email đã tồn tại")) {
      fieldErrors.email = "Email này đã được sử dụng";
      toast.error(
        "Email đã tồn tại trong hệ thống. Vui lòng sử dụng email khác."
      );
      setValidationErrors(fieldErrors);
      return;
    } else if (backendError.includes("Email không đúng định dạng")) {
      fieldErrors.email =
        "Email không đúng định dạng. Vui lòng nhập email có dạng example@gmail.com";
    } else if (backendError.includes("Email không tồn tại")) {
      fieldErrors.email = "Email không tồn tại hoặc không thể nhận thư";
    } else if (backendError.includes("Mật khẩu phải có ít nhất 8 ký tự")) {
      fieldErrors.password =
        "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt";
    } else if (backendError.includes("Số điện thoại phải bắt đầu bằng 0")) {
      fieldErrors.phone = "Số điện thoại phải bắt đầu bằng 0 và đủ 10 số";
    } else {
      // Generic error - show the actual error message if available
      const displayMessage = backendError || "Có lỗi xảy ra khi đăng ký";
      toast.error(displayMessage);
      return;
    }

    setValidationErrors(fieldErrors);
    toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    // Validate OTP field
    const { isValid, errors } = validateForm(formData, 2);
    setValidationErrors(errors);

    if (!isValid) {
      toast.error("Vui lòng kiểm tra lại mã OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.verifyOtpRegistration({
        email: formData.email,
        otpCode: formData.otpCode,
      });
      if (response.success) {
        toast.success("Tài khoản đã được xác minh thành công.");
        setCurrentView("login");
        // Clear validation errors on success
        setValidationErrors({});
      } else {
        // Handle OTP verification errors
        if (
          response.message?.includes("OTP") ||
          response.message?.includes("mã")
        ) {
          setValidationErrors({ otpCode: response.message });
        } else {
          toast.error(response.message);
        }
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
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

  const renderFormField = (field, type = "text") => {
    const hasError = validationErrors[field] && touchedFields[field];
    const isRequired = validationRules[field]?.required;

    return (
      <div key={field}>
        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
          {formLabels[field]}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field === "password" || field === "confirmPassword" ? (
          <div className="relative">
            <Input
              type={showPassword[field] ? "text" : "password"}
              placeholder={formPlaceholders[field]}
              className={`w-full pr-10 dark:text-gray-900 ${
                hasError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              value={formData[field]}
              onChange={handleInputChange(field)}
              onPaste={
                field === "confirmPassword"
                  ? (e) => e.preventDefault()
                  : undefined
              }
              disabled={loading}
              required={isRequired}
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
            className={`w-full dark:text-gray-900 ${
              hasError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : ""
            }`}
            value={formData[field]}
            onChange={handleInputChange(field)}
            disabled={loading}
            required={isRequired}
          />
        )}
        {hasError && (
          <p className="mt-1 text-sm text-red-600">{validationErrors[field]}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 transition-colors"
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">
                  {step === 1 ? "Tạo tài khoản" : "Xác minh tài khoản"}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
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
                    disabled={
                      loading ||
                      Object.values(validationErrors).some(
                        (error) => error !== ""
                      )
                    }
                  >
                    {loading ? "Đang tạo..." : "Tạo tài khoản"}
                  </Button>

                  <div className="text-center mt-6">
                    <span className="text-gray-600">Đã có tài khoản? </span>
                    <button
                      type="button"
                      onClick={() => setCurrentView("login")}
                      disabled={loading}
                      className={`text-blue-600 hover:underline font-medium ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
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
                    disabled={
                      loading ||
                      Object.values(validationErrors).some(
                        (error) => error !== ""
                      )
                    }
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
