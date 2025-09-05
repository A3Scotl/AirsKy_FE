import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến hãng hàng không (airline)
 */
export const airlineApi = {
  /**
   * Lấy thông tin hãng hàng không theo ID
   * @param {number} id - ID của hãng hàng không
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAirline: async (id) => {
    return apiHandler("get", `/airlines/${id}`);
  },

  /**
   * Lấy tất cả hãng hàng không (Admin only, phân trang)
   * @param {{ page?: number, size?: number, sort?: string }} params
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllAirlines: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/airlines?${queryString}` : "/airlines";
    return apiHandler("get", endpoint);
  },

  /**
   * Tạo hãng hàng không mới với hình ảnh (Admin only) - Sử dụng FormData cho thumbnail
   * @param {{
   *   airlineCode: string,
   *   airlineName: string,
   *   contact?: string,
   *   thumbnail?: string,
   *   thumbnailFile?: File,
   *   active?: boolean
   * }} airlineData - Dữ liệu hãng hàng không
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createAirlineWithImage: async (airlineData) => {
    const formData = new FormData();
    formData.append("airlineCode", airlineData.airlineCode);
    formData.append("airlineName", airlineData.airlineName);
    if (airlineData.contact) formData.append("contact", airlineData.contact);

    // Xử lý thumbnail: chỉ gửi 1 loại
    if (airlineData.thumbnailFile instanceof File) {
      console.log(
        "[AirlineAPI] Appending file:",
        airlineData.thumbnailFile.name
      );
      formData.append("thumbnail", airlineData.thumbnailFile);
    } else if (airlineData.thumbnail) {
      console.log("[AirlineAPI] Appending URL:", airlineData.thumbnail);
      console.log("[AirlineAPI] URL type:", typeof airlineData.thumbnail);
      formData.append("thumbnailUrl", airlineData.thumbnail);
    }

    formData.append(
      "active",
      airlineData.active !== undefined ? airlineData.active.toString() : "true"
    );

    // Debug: Log FormData contents
    console.log("[AirlineAPI] FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value, `(type: ${typeof value})`);
    }

    return apiHandler("post", "/airlines", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**
   * Cập nhật hãng hàng không với hình ảnh (Admin only) - Sử dụng FormData cho thumbnail
   * @param {number} id - ID của hãng hàng không
   * @param {{
   *   airlineCode: string,
   *   airlineName: string,
   *   contact?: string,
   *   thumbnail?: string,
   *   thumbnailFile?: File,
   *   active?: boolean
   * }} airlineData - Dữ liệu hãng hàng không
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateAirlineWithImage: async (id, airlineData) => {
    const formData = new FormData();
    formData.append("airlineCode", airlineData.airlineCode);
    formData.append("airlineName", airlineData.airlineName);
    if (airlineData.contact) formData.append("contact", airlineData.contact);

    // Xử lý thumbnail: chỉ gửi 1 loại
    if (airlineData.thumbnailFile instanceof File) {
      formData.append("thumbnail", airlineData.thumbnailFile);
    } else if (airlineData.thumbnail) {
      formData.append("thumbnailUrl", airlineData.thumbnail);
    }

    formData.append(
      "active",
      airlineData.active !== undefined ? airlineData.active.toString() : "true"
    );

    return apiHandler("put", `/airlines/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**
   * Xóa hãng hàng không (Admin only, soft delete)
   * @param {number} id - ID của hãng hàng không
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  deleteAirline: async (id) => {
    return apiHandler("delete", `/airlines/${id}`);
  },

  /**
   * Lấy danh sách hãng hàng không đang hoạt động (public)
   * @param {{ page?: number, size?: number, sort?: string }} params
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getActiveAirlines: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/airlines/active?${queryString}`
      : "/airlines/active";
    return apiHandler("get", endpoint);
  },

  /**
   * Tìm kiếm hãng hàng không theo từ khóa
   * @param {string} keyword - Từ khóa tìm kiếm
   * @param {{ page?: number, size?: number }} params
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  searchAirlines: async (keyword, params = {}) => {
    const queryParams = new URLSearchParams();
    if (keyword) queryParams.append("keyword", keyword);
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/airlines/search?${queryString}`
      : "/airlines/search";
    return apiHandler("get", endpoint);
  },

  /**
   * Kiểm tra mã hãng hàng không đã tồn tại chưa
   * @param {string} airlineCode - Mã hãng hàng không
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  checkAirlineCodeExists: async (airlineCode) => {
    return apiHandler("get", `/airlines/check-code/${airlineCode}`);
  },

  /**
   * Lấy thống kê hãng hàng không (Admin only)
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAirlineStatistics: async () => {
    return apiHandler("get", "/airlines/statistics");
  },

  /**
   * Upload hình ảnh cho hãng hàng không (Admin only)
   * @param {FormData} imageData - File hình ảnh
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  uploadAirlineImage: async (imageData) => {
    return apiHandler("post", "/airlines/upload-image", imageData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**
   * Lấy danh sách hãng hàng không theo route (public)
   * @param {{ departureAirportId?: number, arrivalAirportId?: number, page?: number, size?: number }} params
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAirlinesByRoute: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.departureAirportId)
      queryParams.append("departureAirportId", params.departureAirportId);
    if (params.arrivalAirportId)
      queryParams.append("arrivalAirportId", params.arrivalAirportId);
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/airlines/route?${queryString}`
      : "/airlines/route";
    return apiHandler("get", endpoint);
  },
};
