import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext({
  user: null,
  loading: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  checkTokenExpiry: () => {},
  handleTokenExpired: () => {},
  refreshToken: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to filter only essential user data for localStorage
  const getEssentialUserData = (userData) => {
    if (!userData) return null;

    return {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      exp: userData.exp,
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: userData.fullName,
      avatar: userData.avatar,
      googleAvatar: userData.googleAvatar,
      authProvider: userData.authProvider,
    };
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      // Try to load from localStorage first
      if (savedUser) {
        try {
          const essentialUserData = JSON.parse(savedUser);

          // Set essential data first, then fetch complete profile
          setUser(essentialUserData);

          // Fetch complete profile from database
          try {
            const { authApi } = await import("@/apis/auth-api");
            const profileResult = await authApi.me();

            if (profileResult.success && profileResult.data) {
              // Merge database data with essential localStorage data
              const completeUserData = {
                ...essentialUserData, // Keep essential data
                ...profileResult.data, // Override with database data
                // Preserve Google avatar as fallback
                googleAvatar: essentialUserData.googleAvatar,
              };

              setUser(completeUserData);

              // Update localStorage with latest essential data
              const updatedEssentialData =
                getEssentialUserData(completeUserData);
              localStorage.setItem(
                "user",
                JSON.stringify(updatedEssentialData)
              );
            } else {
              console.warn(
                "⚠️ Could not fetch database profile, using localStorage data only"
              );
            }
          } catch (profileError) {
            console.error("❌ Error fetching database profile:", profileError);
            // Continue with localStorage data only
          }

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
          id: decoded.id,
          email: decoded.sub,
          role: decoded.role,
          exp: decoded.exp,
          // Preserve Google avatar from localStorage if available
          googleAvatar: decoded.picture || decoded.avatar,
          firstName: decoded.given_name,
          lastName: decoded.family_name,
          fullName: decoded.name,
        };

        // Now fetch complete profile from database to get latest firstName, lastName, avatar
        try {
          const { authApi } = await import("@/apis/auth-api");
          const profileResult = await authApi.me();

          if (profileResult.success && profileResult.data) {
            // Merge database data with existing user data
            // Database data takes priority for firstName, lastName, avatar
            const completeUserData = {
              ...userData, // Keep token data
              ...profileResult.data, // Override with database data
              // Preserve Google avatar as fallback
              googleAvatar: userData.googleAvatar,
            };

            setUser(completeUserData);

            // Save essential data only to localStorage
            const essentialData = getEssentialUserData(completeUserData);
            localStorage.setItem("user", JSON.stringify(essentialData));
          } else {
            console.warn(
              "⚠️ Could not fetch database profile, using token data only"
            );
          }
        } catch (profileError) {
          console.error("❌ Error fetching database profile:", profileError);
          // Continue with token data only
        }
      } catch (error) {
        console.error("Token decoding error:", error);
        toast.error("Token không hợp lệ");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    (async () => {
      await initializeAuth();
    })();
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
    // Only save essential user data to localStorage
    const essentialData = getEssentialUserData(userData);
    localStorage.setItem("user", JSON.stringify(essentialData));
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

  const updateUser = (updates) => {
    setUser((prevUser) => {
      const updatedUser = { ...prevUser, ...updates };
      // Only save essential user data to localStorage
      const essentialData = getEssentialUserData(updatedUser);
      localStorage.setItem("user", JSON.stringify(essentialData));
      return updatedUser;
    });
  };

  // Function để refresh token (có thể implement sau)
  const refreshToken = async () => {
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
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
