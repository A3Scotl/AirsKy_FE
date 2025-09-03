import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến quản lý quốc gia (country)
 */
export const countryApi = {
  /**
   * Lấy thông tin quốc gia theo ID
   * @param {number} id - ID quốc gia
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getCountryById: async (id) => {
    return apiHandler("get", `/countries/${id}`);
  },

  /**
   * Lấy danh sách tất cả quốc gia (phân trang)
   * @param {{ page?: number, size?: number, sort?: string }} params
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllCountries: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/countries?${queryString}` : "/countries";
    return apiHandler("get", endpoint);
  },

  /**
   * Lấy thông tin quốc gia theo mã quốc gia
   * @param {string} countryCode - Mã quốc gia
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getCountryByCode: async (countryCode) => {
    return apiHandler("get", `/countries/code/${countryCode}`);
  },

  /**
   * Lấy thông tin quốc gia theo tên quốc gia
   * @param {string} countryName - Tên quốc gia
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getCountryByName: async (countryName) => {
    return apiHandler(
      "get",
      `/countries/name/${encodeURIComponent(countryName)}`
    );
  },

  /**
   * Xoá quốc gia (Admin only)
   * @param {number} id - ID quốc gia
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  deleteCountry: async (id) => {
    return apiHandler("delete", `/countries/${id}`);
  },

  /**
   * Tạo quốc gia mới với hình ảnh (Admin only)
   * @param {object} countryData - Thông tin quốc gia
   * @param {string} countryData.countryCode - Mã quốc gia
   * @param {string} countryData.countryName - Tên quốc gia
   * @param {boolean} [countryData.active=true] - Trạng thái hoạt động
   * @param {File} [countryData.thumbnail] - File hình ảnh thumbnail
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createCountryWithImage: async (countryData) => {
    const formData = new FormData();

    // Thêm các trường bắt buộc
    formData.append("countryCode", countryData.countryCode);
    formData.append("countryName", countryData.countryName);

    // Thêm trường tùy chọn
    if (countryData.active !== undefined) {
      formData.append("active", countryData.active.toString());
    }

    // Xử lý hình ảnh: File hoặc URL
    if (countryData.thumbnailFile instanceof File) {
      console.log(
        "[CountryAPI] Create - Sending file:",
        countryData.thumbnailFile.name
      );
      formData.append("thumbnail", countryData.thumbnailFile);
    } else if (countryData.thumbnail) {
      console.log("[CountryAPI] Create - Sending URL:", countryData.thumbnail);
      formData.append("thumbnailUrl", countryData.thumbnail);
    }

    // Debug: Log FormData contents
    console.log("[CountryAPI] Create FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value, `(type: ${typeof value})`);
    }

    return apiHandler("post", "/countries", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Cập nhật quốc gia với hình ảnh (Admin only)
   * @param {number} id - ID quốc gia
   * @param {object} countryData - Thông tin quốc gia
   * @param {string} countryData.countryCode - Mã quốc gia
   * @param {string} countryData.countryName - Tên quốc gia
   * @param {boolean} [countryData.active=true] - Trạng thái hoạt động
   * @param {string} [countryData.existingThumbnail] - URL hình ảnh hiện tại
   * @param {File} [countryData.thumbnail] - File hình ảnh mới
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateCountryWithImage: async (id, countryData) => {
    const formData = new FormData();

    // Thêm các trường bắt buộc
    formData.append("countryCode", countryData.countryCode);
    formData.append("countryName", countryData.countryName);

    // Thêm trường tùy chọn
    if (countryData.active !== undefined) {
      formData.append("active", countryData.active.toString());
    }

    // Xử lý hình ảnh: File, URL mới, hoặc giữ nguyên
    if (countryData.thumbnailFile instanceof File) {
      console.log(
        "[CountryAPI] Update - Sending new file:",
        countryData.thumbnailFile.name
      );
      formData.append("thumbnail", countryData.thumbnailFile);
    } else if (
      countryData.thumbnail &&
      countryData.thumbnail !== countryData.existingThumbnail
    ) {
      console.log(
        "[CountryAPI] Update - Sending new URL:",
        countryData.thumbnail
      );
      formData.append("thumbnailUrl", countryData.thumbnail);
    } else if (countryData.existingThumbnail) {
      console.log(
        "[CountryAPI] Update - Keeping existing thumbnail:",
        countryData.existingThumbnail
      );
      formData.append("thumbnailUrl", countryData.existingThumbnail);
    }

    // Debug: Log FormData contents
    console.log("[CountryAPI] Update FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value, `(type: ${typeof value})`);
    }

    return apiHandler("put", `/countries/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
