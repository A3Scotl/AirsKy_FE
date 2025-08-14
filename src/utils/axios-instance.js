import axios from "axios";
import axiosRetry from "axios-retry";

const API_BASE_URL = import.meta.env.VITE_BASE_API || "http://localhost:8080/api/v1";


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
    return config;
  },
  (error) => Promise.reject(error)
);

// Xử lý lỗi response
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Đã xảy ra lỗi không mong muốn";
    console.error(`Lỗi API tại ${error.config?.url}:`, message);
    return Promise.reject({ success: false, message });
  }
);

export default axiosInstance;