import { useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/apis/auth-api";

export default function RegisterForm({ setCurrentView }) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    return () => clearInterval(timer); // Cleanup timer on unmount
  }, [countdown]);

  const handleBackClick = () => {
    window.history.back();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!agreeTerms) {
      toast.error("You must agree to the terms and conditions");
      return;
    }
    setLoading(true);
    const response = await authApi.register({ email, password, firstName, lastName, phone });
    if (response.success) {
      toast.success("Registration successful. Please enter the OTP sent to your email.");
      setStep(2);
      setCountdown(60); // Start 60-second countdown
      setIsResendDisabled(true); // Disable resend button
    } else {
      toast.error(response.message);
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    const response = await authApi.verifyOtpRegistration({ email, otpCode });
    if (response.success) {
      toast.success("Account verified successfully.");
      setCurrentView("login");
    } else {
      toast.error(response.message);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setLoading(true);
    const response = await authApi.resendOtpCode({ email });
    if (response.success) {
      toast.success("OTP resent successfully.");
      setCountdown(60); // Reset countdown
      setIsResendDisabled(true); // Disable button again
    } else {
      toast.error(response.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
            <div className="w-16"></div> {/* Spacer for center alignment */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
                <p className="text-gray-600">Join AirSky and start your journey</p>
              </div>

              {step === 1 ? (
                <form className="space-y-6" onSubmit={handleRegister}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <Input
                      type="text"
                      placeholder="Enter your first name"
                      className="w-full"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <Input
                      type="text"
                      placeholder="Enter your last name"
                      className="w-full"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      className="w-full"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        className="w-full pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="w-full pr-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" checked={agreeTerms} onCheckedChange={setAgreeTerms} />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Terms & Conditions
                      </a>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Account"}
                  </Button>

                  <div className="text-center mt-6">
                    <span className="text-gray-600">Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => setCurrentView("login")}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <form className="space-y-6" onSubmit={handleVerify}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">OTP Code</label>
                    <Input
                      type="text"
                      placeholder="Enter OTP code"
                      className="w-full"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify"}
                  </Button>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={handleResend}
                      className={`text-blue-600 hover:underline ${isResendDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={loading || isResendDisabled}
                    >
                      {isResendDisabled ? `Resend OTP in ${countdown}s` : "Resend OTP"}
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