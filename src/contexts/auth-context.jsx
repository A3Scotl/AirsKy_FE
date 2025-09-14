import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext({
  user: null,
  loading: false,
  login: () => {},
  logout: () => {},
  checkTokenExpiry: () => {},
  handleTokenExpired: () => {},
  refreshToken: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      // Try to load from localStorage first
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setLoading(false);
          return;
        } catch (error) {
          console.error("Error parsing saved user:", error);
          localStorage.removeItem("user");
        }
      }

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const isTokenExpired = decoded.exp * 1000 < Date.now();

        if (isTokenExpired) {
          toast.warning("Phiên của bạn đã hết hạn");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          navigate("/");
          return;
        }

        const userData = {
          id: decoded.id || decoded.sub, // Add id field
          email: decoded.sub,
          role: decoded.role,
          exp: decoded.exp,
          googleAvatar: decoded.picture || decoded.avatar,
          firstName: decoded.given_name,
          lastName: decoded.family_name,
          fullName: decoded.name,
        };

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (error) {
        // console.error("Token decoding error:", error);
        toast.error("Token không hợp lệ");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [navigate]);

  // Check token expiry every 5 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkTokenExpiry();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  // Handle case when user data is cleared due to 401 error
  useEffect(() => {
    const handleStorageChange = () => {
      const currentToken = localStorage.getItem("token");
      const currentUser = localStorage.getItem("user");

      if (!currentToken && !currentUser && user) {
        // User data was cleared (possibly due to 401), logout
        setUser(null);
        toast.warning("Phiên của bạn đã hết hạn, vui lòng đăng nhập lại");
        navigate("/");
      }
    };

    // Listen for storage changes (in case of multi-tab scenario)
    window.addEventListener("storage", handleStorageChange);

    // Also check periodically in case of same-tab API calls
    const checkInterval = setInterval(handleStorageChange, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [user, navigate]);

  // Function để check token expiry
  const checkTokenExpiry = () => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    try {
      const decoded = jwtDecode(token);
      const isTokenExpired = decoded.exp * 1000 < Date.now();

      if (isTokenExpired) {
        handleTokenExpired();
        return false;
      }
      return true;
    } catch (error) {
      console.error("Token validation error:", error);
      handleTokenExpired();
      return false;
    }
  };

  // Function xử lý khi token hết hạn
  const handleTokenExpired = () => {
    toast.warning("Phiên của bạn đã hết hạn, vui lòng đăng nhập lại");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    if (token) {
      localStorage.setItem("token", token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    toast.info("Bạn đã đăng xuất thành công");
    navigate("/");
  };

  // Function để refresh token (có thể implement sau)
  const refreshToken = async () => {
    // TODO: Implement token refresh logic
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        checkTokenExpiry,
        handleTokenExpired,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
