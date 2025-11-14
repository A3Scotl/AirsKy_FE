import axiosInstance from "./axios-instance";
import { toast } from "sonner";

/**
 * Hàm dùng chung để gọi API
 * @param {'get' | 'post' | 'put' | 'delete' | 'patch'} method - HTTP method
 * @param {string} url - Endpoint
 * @param {any} [data] - Body hoặc params (tuỳ method)
 * @param {object} [config] - Axios config (headers, etc.)
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export const apiHandler = async (method, url, data = null, config = {}) => {
  try {
    const isGetLike = method === "get" || method === "delete";

    // Special handling for FormData to ensure proper headers
    if (data instanceof FormData) {
      config = {
        ...config,
        headers: {
          ...config.headers,
          // Don't set Content-Type for FormData - let browser set it automatically
        },
      };

      for (let [key, value] of data.entries()) {
        if (value instanceof File) {

        } else {

        }
      }
    }

    const response = isGetLike
      ? await axiosInstance[method](url, { ...config, params: data })
      : await axiosInstance[method](url, data, {
          ...config,
          // Ensure headers are properly merged for FormData
          headers:
            data instanceof FormData
              ? { ...config.headers } // Don't include Content-Type for FormData
              : config.headers,
        });

    return {
      success: true,
      data: response?.data || response,
      message: response?.message || "Thành công",
      error: null,
    };
  } catch (error) {
    console.error(
      `[apiHandler] API call failed: ${method.toUpperCase()} ${url}`,
      error
    );

    // Handle error from axios interceptor (custom error object) - check this first
    if (error && typeof error === "object" && error.success === false) {

      return {
        success: false,
        data: error.data, // This should contain the actual backend error data
        message: error.message || "Lỗi không xác định",
        error: error.error || error.message || "Unknown Error",
      };
    }

    // Handle network errors, timeouts, etc. (no response and no success field)
    if (
      error &&
      typeof error === "object" &&
      !error.response &&
      !("success" in error)
    ) {

      return {
        success: false,
        data: null,
        message: error.message || "Lỗi kết nối mạng hoặc timeout",
        error: error.message || "Network Error",
      };
    }

    // Handle standard axios error
    const errorData = error?.response?.data;
    const message =
      errorData?.message || error?.message || "Lỗi không xác định";
    const errorDetail = errorData?.error || errorData?.message;

    // Xử lý thông báo riêng cho tài khoản bị khóa
    if (errorDetail === "Account is deactivated") {
      toast.error(
        "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để mở khóa."
      );
    } else if (
      errorDetail !== "Booking not found" &&
      !message?.toLowerCase().includes("booking not found") &&
      message !== "Đã xảy ra lỗi không mong muốn"
    ) {
      // Only show toast for non-booking-not-found errors
      toast.error(message);
    }

    return {
      success: false,
      data: errorData, // Return full error data so we can access all fields like timestamp, path, etc.
      message,
      error: errorDetail || message, // Ensure error field is always present
    };
  }
};

/**
 * Generic fetch handler
 * @param {object} params
 * @param {Function} params.apiCall - Hàm gọi API
 * @param {Function} params.setData - Hàm cập nhật state
 * @param {Function} [params.setLoading] - Hàm cập nhật trạng thái loading
 * @param {string} [params.errorMessage] - Thông báo lỗi tuỳ chỉnh
 */
export const handleFetch = async ({
  apiCall,
  setData,
  setLoading,
  errorMessage = "Không thể tải dữ liệu",
}) => {
  try {
    if (setLoading) setLoading(true);
    const response = await apiCall();

    if (response.success) {
      setData(response.data || []);
    } else {
      toast.error(`${errorMessage}: ${response.message}`);
    }
  } catch (error) {
    toast.error(`${errorMessage}: ${error.message}`);
  } finally {
    if (setLoading) setLoading(false);
  }
};
