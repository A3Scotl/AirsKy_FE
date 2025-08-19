"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/apis/auth-api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const GoogleLoginButton = ({ className = "", disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  // Initialize Google when component mounts
  useEffect(() => {
    initializeGoogle();
  }, []);

  const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.accounts) {
        resolve();
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setTimeout(() => {
          if (window.google && window.google.accounts) {
            resolve();
          } else {
            reject(new Error("Dịch vụ Google Identity không khả dụng"));
          }
        }, 100);
      };

      script.onerror = () => {
        reject(new Error("Không thể tải script Google"));
      };

      document.head.appendChild(script);
    });
  };

  const initializeGoogle = async () => {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!clientId) {
        return;
      }

      await loadGoogleScript();

      if (
        !window.google ||
        !window.google.accounts ||
        !window.google.accounts.id
      ) {
        throw new Error("Dịch vụ Google Identity không được tải đúng cách");
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
      }

      setIsGoogleLoaded(true);
    } catch (error) {
      setIsGoogleLoaded(false);
    }
  };

  const handleGoogleResponse = async (response) => {
    setLoading(true);

    try {
      if (!response.credential) {
        throw new Error("Không nhận được thông tin xác thực từ Google");
      }

      const decoded = jwtDecode(response.credential);

      const result = await authApi.googleLogin({
        idToken: response.credential,
      });

      if (result.success && result.data) {
        let token =
          result.data.token ||
          result.data.accessToken ||
          result.data.access_token;

        if (!token || typeof token !== "string") {
          toast.error("Token không hợp lệ từ máy chủ");
          return;
        }

        localStorage.setItem("token", token);

        try {
          const decoded = jwtDecode(token);

          const userData = {
            email: decoded.sub,
            role: decoded.role,
            exp: decoded.exp,
          };

          login(userData);
          toast.success("Đăng nhập Google thành công!");

          setTimeout(() => {
            window.location.href = "/";
          }, 100);
        } catch (decodeError) {
          toast.error("Định dạng token không hợp lệ");
        }
      } else {
        toast.error(result.message || "Đăng nhập Google thất bại");
      }
    } catch (error) {
      toast.error("Xác thực thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleFallbackLogin = () => {
    if (!isGoogleLoaded) {
      toast.error("Google Sign-In chưa sẵn sàng. Vui lòng đợi trong giây lát.");
      return;
    }

    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={googleButtonRef}
        className="w-full flex justify-center mb-2"
        style={{ minHeight: "40px" }}
      />

      {!isGoogleLoaded && (
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
      )}
    </div>
  );
};

export default GoogleLoginButton;
