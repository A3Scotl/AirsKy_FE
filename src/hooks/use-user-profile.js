import { useState, useEffect } from "react";
import { authApi } from "@/apis/auth-api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
        setUserProfile(response.data);
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
      return new Date(userProfile.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    } catch (error) {
      return "Recently joined";
    }
  },

  /**
   * Get avatar URL or fallback
   */
  getAvatarUrl: (userProfile) => {
    if (!userProfile) return null;
    return userProfile.avatar || userProfile.profilePicture || null;
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
