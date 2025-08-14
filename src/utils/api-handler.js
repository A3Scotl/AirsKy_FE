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
    const response = isGetLike
      ? await axiosInstance[method](url, { ...config, params: data })
      : await axiosInstance[method](url, data, config);
    return {
      success: true,
      data: response.data || response,
      message: response.message || "Thành công",
    };
  } catch (error) {
    const message = error?.message || "Lỗi không xác định";
    toast.error(message);
    return {
      success: false,
      data: null,
      message,
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