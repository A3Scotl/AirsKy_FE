import axios from "axios";
import axiosInstance from "@/utils/axios-instance";

/**
 * API liên quan đến export dữ liệu
 */
export const exportApi = {
  /**
   * Export dữ liệu theo entity và format
   * @param {string} entity - Tên entity (blogs, users, etc.)
   * @param {string} format - Định dạng file (csv, xlsx, pdf)
   * @param {Object} params - Các tham số bổ sung
   * @param {Date} params.startDate - Ngày bắt đầu
   * @param {Date} params.endDate - Ngày kết thúc
   * @param {string[]} params.fields - Danh sách trường muốn export
   * @returns {Promise<Blob>} - File blob để download
   */
  exportData: async (entity, format, params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      if (params.startDate) {
        queryParams.append(
          "startDate",
          params.startDate.toISOString().split("T")[0]
        );
      }
      if (params.endDate) {
        queryParams.append(
          "endDate",
          params.endDate.toISOString().split("T")[0]
        );
      }
      if (params.fields && params.fields.length > 0) {
        params.fields.forEach((field) => queryParams.append("fields", field));
      }

      const queryString = queryParams.toString();
      const endpoint = queryString
        ? `/export/${entity}/${format}?${queryString}`
        : `/export/${entity}/${format}`;

      // Sử dụng axios trực tiếp để có thể truy cập headers
      const API_BASE_URL =
        import.meta.env.VITE_BASE_API || "http://localhost:8080/api/v1";
      const token = localStorage.getItem("token");

      const config = {
        baseURL: API_BASE_URL,
        responseType: "blob",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get(endpoint, config);

      // Debug: log response structure
      console.log("Export response:", {
        status: response.status,
        headers: response.headers,
        data: response.data,
        dataType: typeof response.data,
        isBlob: response.data instanceof Blob,
      });

      // Kiểm tra content-type để đảm bảo đây là file
      const contentType =
        response.headers?.["content-type"] ||
        response.headers?.["Content-Type"];
      if (contentType && contentType.includes("application/json")) {
        // Server trả về JSON error, cần parse để lấy message
        const text = await response.data.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || "Lỗi từ server");
        } catch (parseError) {
          throw new Error(text || "Lỗi không xác định từ server");
        }
      }

      // Kiểm tra response có phải là blob không
      if (!(response.data instanceof Blob)) {
        throw new Error("Server không trả về file hợp lệ");
      }

      // Kiểm tra kích thước blob
      if (response.data.size === 0) {
        throw new Error("File rỗng hoặc không có dữ liệu");
      }

      return response.data; // Trả về blob
    } catch (error) {
      console.error("Export error:", error);
      throw error;
    }
  },

  /**
   * Download file từ blob
   * @param {Blob} blob - File blob
   * @param {string} filename - Tên file
   */
  downloadFile: (blob, filename) => {
    try {
      // Kiểm tra blob có hợp lệ không
      if (!blob || !(blob instanceof Blob)) {
        throw new Error("Blob không hợp lệ");
      }

      // Kiểm tra kích thước blob
      if (blob.size === 0) {
        throw new Error("File rỗng");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none"; // Ẩn link

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      throw error;
    }
  },
};
