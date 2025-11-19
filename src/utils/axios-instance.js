import axios from "axios";
import axiosRetry from "axios-retry";

const API_BASE_URL =
  import.meta.env.VITE_BASE_API || "https://airsky.onrender.com/api/v1";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Retry logic
axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    const method = error?.config?.method?.toLowerCase();
    return ["get", "head"].includes(method);
  },
});

// Thêm token vào header nếu có
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData - let browser set it automatically
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Xử lý lỗi response
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Đã xảy ra lỗi không mong muốn";
    const errorDetail = error?.response?.data?.error || message;

    console.error(`Lỗi API tại ${error.config?.url}:`, message);
    return Promise.reject({
      success: false,
      message,
      error: errorDetail,
      data: error?.response?.data, // Include full error data
    });
  }
);

export default axiosInstance;
