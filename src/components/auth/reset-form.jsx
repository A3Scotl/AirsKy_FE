import { useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/apis/auth-api";

export default function ResetForm({ setCurrentView }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
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

  const handleBackClick = () => {
    window.history.back();
  };

  const handleSendReset = async (e) => {
    e.preventDefault();

    // Basic email validation
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.forgotPasswordRequest({ email });
      if (response.success) {
        toast.success(
          "Verification code sent to your email. Please check your inbox."
        );
        setStep(2);
        setCountdown(60);
        setIsResendDisabled(true);
      } else {
        // Handle specific error cases
        if (
          response.message.toLowerCase().includes("user not found") ||
          response.message.toLowerCase().includes("email not found")
        ) {
          toast.error("No account found with this email address.");
        } else {
          toast.error(response.message || "Failed to send verification code");
        }
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error(
        "An error occurred while sending verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();

    // Validation
    if (!otpCode || otpCode.length < 4) {
      toast.error("Please enter a valid OTP code");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.resetPassword({
        email,
        otpCode: otpCode.trim(),
        newPassword,
      });

      if (response.success) {
        toast.success(
          "Password reset successfully! You can now log in with your new password."
        );
        setCurrentView("login");
      } else {
        // Handle specific error cases
        if (
          response.message.toLowerCase().includes("invalid") &&
          response.message.toLowerCase().includes("otp")
        ) {
          toast.error("Invalid or expired OTP code. Please request a new one.");
        } else if (response.message.toLowerCase().includes("expired")) {
          toast.error("OTP code has expired. Please request a new one.");
        } else {
          toast.error(response.message || "Failed to reset password");
        }
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error(
        "An error occurred while resetting password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const response = await authApi.resendOtpCode({ email });
      if (response.success) {
        toast.success("New verification code sent to your email successfully.");
        setCountdown(60);
        setIsResendDisabled(true);
      } else {
        toast.error(response.message || "Failed to resend verification code");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error(
        "An error occurred while resending verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={handleBackClick}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <h1 className="text-xl font-bold text-blue-600">AirSky</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Reset Your Password
                </h2>
                <p className="text-gray-600">
                  {step === 1
                    ? "Enter your email address and we'll send you a verification code to reset your password."
                    : `We've sent a verification code to ${email}. Please check your email and enter the code below.`}
                </p>
              </div>

              {step === 1 ? (
                <form className="space-y-6" onSubmit={handleSendReset}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      className="w-full"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <div className="text-center mt-6">
                    <button
                      type="button"
                      onClick={() => setCurrentView("login")}
                      className="text-blue-600 hover:underline font-medium inline-flex items-center"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Log In
                    </button>
                  </div>
                </form>
              ) : (
                <form className="space-y-6" onSubmit={handleReset}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OTP Code
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter 6-digit verification code"
                      className="w-full"
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(
                          e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      maxLength={6}
                      required
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      Check your email for the verification code. It may take a
                      few minutes to arrive.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password (min 6 characters)"
                        className="w-full pr-10"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {newPassword && newPassword.length < 6 && (
                      <p className="text-red-500 text-xs mt-1">
                        Password must be at least 6 characters
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmNewPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        className="w-full pr-10"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmNewPassword(!showConfirmNewPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showConfirmNewPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {confirmNewPassword &&
                      newPassword !== confirmNewPassword && (
                        <p className="text-red-500 text-xs mt-1">
                          Passwords do not match
                        </p>
                      )}
                    {confirmNewPassword &&
                      newPassword === confirmNewPassword &&
                      confirmNewPassword.length >= 6 && (
                        <p className="text-green-500 text-xs mt-1">
                          Passwords match
                        </p>
                      )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
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
                        ? `Resend OTP in ${countdown}s`
                        : "Resend OTP"}
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
