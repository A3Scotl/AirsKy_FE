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

      // Prepare data to send to backend including avatar URL
      const googleLoginData = {
        idToken: response.credential,
        avatarUrl: decoded.picture, // Send Google avatar URL to backend
        firstName: decoded.given_name,
        lastName: decoded.family_name,
      };

      console.log("🚀 Sending Google login data to backend:", googleLoginData);

      const result = await authApi.googleLogin(googleLoginData);

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

          // Also decode Google credential to get profile picture
          const googleDecoded = jwtDecode(response.credential);
          console.log("🔍 Google Profile Data:", {
            email: googleDecoded.email,
            name: googleDecoded.name,
            picture: googleDecoded.picture,
            hasPicture: !!googleDecoded.picture,
          });

          const userData = {
            id: decoded.id || decoded.sub,
            email: decoded.sub || googleDecoded.email,
            role: decoded.role,
            exp: decoded.exp,
            // Store Google profile information as fallback
            googleAvatar: googleDecoded.picture,
            // Use database data if available, otherwise Google data
            firstName: result.data.firstName || googleDecoded.given_name,
            lastName: result.data.lastName || googleDecoded.family_name,
            fullName:
              result.data.firstName && result.data.lastName
                ? `${result.data.firstName} ${result.data.lastName}`.trim()
                : googleDecoded.name,
            // Avatar: prioritize database, fallback to Google
            avatar: result.data.avatar || googleDecoded.picture,
          };

          console.log("💾 User Data to be saved:", userData);
          console.log("🖼️ Google Avatar URL:", userData.googleAvatar);
          console.log("🔍 Google decoded picture:", googleDecoded.picture);
          console.log("📥 Backend avatar response:", result.data.avatar);

          // Ensure googleAvatar is properly set
          if (!userData.googleAvatar && googleDecoded.picture) {
            userData.googleAvatar = googleDecoded.picture;
            console.log("🔧 Fixed Google avatar:", userData.googleAvatar);
          }

          login(userData);
          toast.success("Đăng nhập Google thành công!");

          // After successful login, fetch complete user profile from database
          // This ensures we get updated firstName, lastName, and avatar from database
          try {
            console.log(
              "🔄 Fetching complete user profile from database after Google login..."
            );
            const profileResult = await authApi.me();

            if (profileResult.success && profileResult.data) {
              console.log("✅ Database profile fetched:", profileResult.data);
              console.log("🔍 Database avatar:", profileResult.data.avatar);
              console.log(
                "🔍 Database firstName:",
                profileResult.data.firstName
              );
              console.log("🔍 Database lastName:", profileResult.data.lastName);

              // Update user data with database information, keeping Google avatar as fallback
              const completeUserData = {
                ...userData, // Keep existing data including googleAvatar
                ...profileResult.data, // Override with database data
                // Ensure database avatar takes priority, but keep googleAvatar for fallback
                googleAvatar: googleDecoded.picture, // Keep Google avatar as fallback
              };

              console.log("� Data merge details:");
              console.log("  - Google userData:", {
                firstName: userData.firstName,
                lastName: userData.lastName,
                avatar: userData.avatar,
                googleAvatar: userData.googleAvatar,
              });
              console.log("  - Database profileResult.data:", {
                firstName: profileResult.data.firstName,
                lastName: profileResult.data.lastName,
                avatar: profileResult.data.avatar,
              });
              console.log("  - Final completeUserData:", {
                firstName: completeUserData.firstName,
                lastName: completeUserData.lastName,
                avatar: completeUserData.avatar,
                googleAvatar: completeUserData.googleAvatar,
              });
              login(completeUserData); // Update with complete data
            } else {
              console.warn(
                "⚠️ Could not fetch database profile, using Google data only"
              );
            }
          } catch (profileError) {
            console.error("❌ Error fetching database profile:", profileError);
            // Continue with Google data only
          }

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
