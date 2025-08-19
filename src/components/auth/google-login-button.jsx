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
      // Check if Google script is already loaded
      if (window.google && window.google.accounts) {
        console.log("Google Identity Services already loaded");
        resolve();
        return;
      }

      // Remove any existing Google script to avoid conflicts
      const existingScript = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (existingScript) {
        existingScript.remove();
      }

      // Create script element
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log("Google Identity Services script loaded successfully");

        // Wait a bit for the script to fully initialize
        setTimeout(() => {
          if (window.google && window.google.accounts) {
            resolve();
          } else {
            reject(
              new Error("Google Identity Services not available after loading")
            );
          }
        }, 100);
      };

      script.onerror = () => {
        console.error("Failed to load Google Identity Services script");
        reject(new Error("Failed to load Google script"));
      };

      // Add script to document head
      document.head.appendChild(script);
    });
  };

  const initializeGoogle = async () => {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      console.log("Starting Google initialization...");
      console.log("Client ID from env:", clientId ? "Present" : "Missing");

      if (!clientId) {
        console.error("Google Client ID not found in environment variables");
        return;
      }

      // Load Google script
      await loadGoogleScript();

      // Check if Google Identity Services is available
      if (
        !window.google ||
        !window.google.accounts ||
        !window.google.accounts.id
      ) {
        throw new Error("Google Identity Services not properly loaded");
      }

      console.log("Initializing Google Identity Services with client ID...");

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render the Google Sign-In button immediately after initialization
      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
      }

      console.log("Google Identity Services initialized successfully");
      setIsGoogleLoaded(true);
    } catch (error) {
      console.error("Google initialization error:", error);
      setIsGoogleLoaded(false);
    }
  };

  const handleGoogleResponse = async (response) => {
    setLoading(true);

    try {
      console.log("Google response received:", response);

      if (!response.credential) {
        throw new Error("No credential received from Google");
      }

      // Decode JWT to get user info for logging
      const decoded = jwtDecode(response.credential);
      console.log("Decoded Google token:", {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      });

      // Send ID token to backend for verification
      const result = await authApi.googleLogin({
        idToken: response.credential,
      });

      console.log("Backend response:", result);
      console.log("Backend success:", result.success);
      console.log("Backend data:", result.data);

      if (result.success && result.data) {
        // Debug the token structure
        console.log("Full result.data:", JSON.stringify(result.data, null, 2));
        console.log("Token data:", result.data.token);
        console.log("AccessToken data:", result.data.accessToken);
        console.log("Token type:", typeof result.data.token);
        console.log("Token value:", result.data.token);

        // Store the token in localStorage - try multiple possible keys
        let token =
          result.data.token ||
          result.data.accessToken ||
          result.data.access_token;

        console.log("Selected token:", token);
        console.log("Selected token type:", typeof token);

        if (!token || typeof token !== "string") {
          console.error("Invalid token received:", token);
          console.error(
            "Available keys in result.data:",
            Object.keys(result.data)
          );
          toast.error("Invalid token received from server");
          return;
        }

        localStorage.setItem("token", token);

        // Decode the JWT token to get user info for auth context
        try {
          const decoded = jwtDecode(token);
          console.log("Decoded token:", decoded);

          const userData = {
            email: decoded.sub,
            role: decoded.role,
            exp: decoded.exp,
          };

          // Update auth context with the decoded user data
          login(userData);

          toast.success("Google login successful!");

          // Add delay to ensure auth context is updated before navigation
          setTimeout(() => {
            window.location.href = "/";
          }, 100);
        } catch (decodeError) {
          console.error("Token decode error:", decodeError);
          toast.error("Invalid token format");
        }
      } else {
        toast.error(result.message || "Google login failed");
      }
    } catch (error) {
      console.error("Google authentication error:", error);
      toast.error("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFallbackLogin = () => {
    if (!isGoogleLoaded) {
      toast.error("Google Sign-In is not ready yet. Please wait a moment.");
      return;
    }

    // Trigger Google Sign-In popup as fallback
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Google rendered button container */}
      <div
        ref={googleButtonRef}
        className="w-full flex justify-center mb-2"
        style={{ minHeight: "40px" }}
      />

      {/* Fallback button if Google button doesn't render */}
      {/* {isGoogleLoaded && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleFallbackLogin}
          disabled={disabled || loading}
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
          {loading ? "Signing in..." : "Continue with Google"}
        </Button>
      )} */}

      {/* Loading state */}
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
          Loading Google Sign-In...
        </Button>
      )}
    </div>
  );
};

export default GoogleLoginButton;
