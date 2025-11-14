import { useState, useEffect } from "react";
import { authApi } from "@/apis/auth-api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

/**
 * Custom hook để quản lý user profile data
 * @returns {Object} { userProfile, loading, error, refetch }
 */
export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchUserProfile = async () => {
    // Check if user is authenticated
    if (!user) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await authApi.me();

      if (response.success) {

        // Merge Google avatar from auth context if API doesn't have it
        let mergedProfile = { ...response.data };
        if (!mergedProfile.googleAvatar && user?.googleAvatar) {

          mergedProfile.googleAvatar = user.googleAvatar;
        }

        setUserProfile(mergedProfile);
      } else {
        // Handle specific API errors
        if (response.message.includes("INVALID_CREDENTIALS")) {
          toast.error("Session expired. Please login again.");
          logout();
          navigate("/auth");
        } else {
          const errorMessage = response.message || "Failed to load profile";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      const errorMessage = "Failed to load profile. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  // Function để refresh profile data
  const refetch = () => {
    fetchUserProfile();
  };

  return {
    userProfile,
    loading,
    error,
    refetch,
  };
};

/**
 * Utility functions để format user data
 */
export const userProfileUtils = {
  /**
   * Tạo initials từ tên người dùng
   */
  getUserInitials: (userProfile) => {
    if (!userProfile) return "U";

    const firstName = userProfile.firstName || "";
    const lastName = userProfile.lastName || "";

    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    }

    if (firstName) return firstName.charAt(0).toUpperCase();
    if (lastName) return lastName.charAt(0).toUpperCase();
    if (userProfile.email) return userProfile.email.charAt(0).toUpperCase();

    return "U";
  },

  /**
   * Tạo display name từ thông tin user
   */
  getDisplayName: (userProfile) => {
    if (!userProfile) return "Unknown User";

    const firstName = userProfile.firstName || "";
    const lastName = userProfile.lastName || "";

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    if (firstName) return firstName;
    if (lastName) return lastName;

    return userProfile.email || "Unknown User";
  },

  /**
   * Format ngày tham gia
   */
  getJoinDate: (userProfile) => {
    if (!userProfile || !userProfile.createdAt) {
      return "Recently joined";
    }

    try {
      return new Date(userProfile.createdAt).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Recently joined";
    }
  },

  /**
   * Get avatar URL with multiple fallback options
   */
  getAvatarUrl: (userProfile) => {
    if (!userProfile) return null;

    // Try database avatar first
    if (userProfile.avatar) {

      return userProfile.avatar;
    }
    if (userProfile.profilePicture) {

      return userProfile.profilePicture;
    }

    // Try Google avatar from auth context (highest priority for Google users)
    if (userProfile.googleAvatar) {
      // Add CORS-friendly parameters to Google avatar URL
      let googleAvatarUrl = userProfile.googleAvatar;
      if (googleAvatarUrl.includes("googleusercontent.com")) {
        // Add size parameter if not present
        if (!googleAvatarUrl.includes("=s")) {
          googleAvatarUrl += "=s96-c";
        }

      } else {

      }
      return googleAvatarUrl;
    }

    // Try to get from token (if available)
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);

        // Check for Google avatar fields
        if (decoded.picture) return decoded.picture;
        if (decoded.avatar) return decoded.avatar;
        if (decoded.avatar_url) return decoded.avatar_url;
        if (decoded.photo) return decoded.photo;
      } catch (error) {
        console.warn("Failed to decode token for avatar:", error);
      }
    }

    // Fallback to Gravatar based on email
    if (userProfile.email) {
      return userProfileUtils.getGravatarUrl(userProfile.email);
    }

    return null;
  },

  /**
   * Generate Gravatar URL from email
   */
  getGravatarUrl: (email, size = 80) => {
    if (!email) return null;

    // Create MD5-like hash for Gravatar (simplified version)
    let hash = 0;
    const cleanEmail = email.toLowerCase().trim();

    for (let i = 0; i < cleanEmail.length; i++) {
      const char = cleanEmail.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to hex and pad
    const hexHash = Math.abs(hash).toString(16).padStart(8, "0");

    // Return Gravatar URL with identicon fallback
    return `https://www.gravatar.com/avatar/${hexHash}?d=identicon&s=${size}`;
  },

  /**
   * Get UI Avatars fallback (alternative to Gravatar)
   */
  getUIAvatarUrl: (userProfile, size = 80) => {
    if (!userProfile) return null;

    const name = userProfileUtils.getDisplayName(userProfile);
    const backgroundColor = userProfileUtils.getAvatarColor(userProfile);

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&size=${size}&background=${backgroundColor}&color=fff&bold=true`;
  },

  /**
   * Generate consistent color for avatar based on email
   */
  getAvatarColor: (userProfile) => {
    if (!userProfile || !userProfile.email) return "007bff";

    const colors = [
      "007bff",
      "28a745",
      "dc3545",
      "ffc107",
      "17a2b8",
      "6f42c1",
      "e83e8c",
      "fd7e14",
      "20c997",
      "6c757d",
    ];

    let hash = 0;
    for (let i = 0; i < userProfile.email.length; i++) {
      hash = userProfile.email.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  },

  /**
   * Get best available avatar URL with all fallbacks
   */
  getBestAvatarUrl: (userProfile, size = 80) => {

    // Try main avatar methods
    const avatarUrl = userProfileUtils.getAvatarUrl(userProfile);
    if (avatarUrl) {

      return avatarUrl;
    }

    // Try UI Avatars as final fallback
    const uiAvatarUrl = userProfileUtils.getUIAvatarUrl(userProfile, size);

    return uiAvatarUrl;
  },

  /**
   * Format phone number
   */
  getFormattedPhone: (userProfile) => {
    if (!userProfile || !userProfile.phone) return null;

    const phone = userProfile.phone;
    // Basic phone formatting - có thể customize theo format mong muốn
    if (phone.length === 10 && phone.startsWith("0")) {
      return `0${phone.slice(1, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}`;
    }

    return phone;
  },

  /**
   * Get user role display text
   */
  getRoleDisplay: (userProfile) => {
    if (!userProfile || !userProfile.role) return "User";

    const roleMap = {
      ADMIN: "Administrator",
      USER: "User",
      MODERATOR: "Moderator",
    };

    return roleMap[userProfile.role] || userProfile.role;
  },

  /**
   * Check if profile is complete
   */
  isProfileComplete: (userProfile) => {
    if (!userProfile) return false;

    const requiredFields = ["firstName", "lastName", "email"];
    return requiredFields.every(
      (field) => userProfile[field] && userProfile[field].trim() !== ""
    );
  },

  /**
   * Get missing profile fields
   */
  getMissingFields: (userProfile) => {
    if (!userProfile) return ["firstName", "lastName", "email", "phone"];

    const allFields = {
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone Number",
    };

    const missingFields = [];

    Object.entries(allFields).forEach(([key, label]) => {
      if (!userProfile[key] || userProfile[key].trim() === "") {
        missingFields.push(label);
      }
    });

    return missingFields;
  },
};
