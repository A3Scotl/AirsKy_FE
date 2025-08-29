import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến quản lý sân bay và tìm kiếm
 */
export const airportApi = {
  /**
   * Tạo sân bay mới (Admin only)
   * @param {{
   *   code: string,
   *   name: string,
   *   city: string,
   *   country: string,
   *   latitude?: number,
   *   longitude?: number,
   *   timezone?: string
   * }} airportData - Thông tin sân bay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createAirport: async (airportData) => {
    return apiHandler("post", "/airports", airportData);
  },

  /**
   * Cập nhật thông tin sân bay (Admin only)
   * @param {number} id - ID của sân bay
   * @param {{
   *   code?: string,
   *   name?: string,
   *   city?: string,
   *   country?: string,
   *   latitude?: number,
   *   longitude?: number,
   *   timezone?: string
   * }} airportData - Thông tin cập nhật
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateAirport: async (id, airportData) => {
    return apiHandler("put", `/airports/${id}`, airportData);
  },

  /**
   * Lấy thông tin chi tiết một sân bay
   * @param {number} id - ID của sân bay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAirportById: async (id) => {
    return apiHandler("get", `/airports/${id}`);
  },

  /**
   * Lấy danh sách tất cả sân bay với phân trang
   * @param {{
   *   page?: number,
   *   size?: number,
   *   sort?: string,
   *   search?: string
   * }} params - Tham số phân trang và tìm kiếm
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllAirports: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    if (params.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/airports?${queryString}` : "/airports";

    return apiHandler("get", endpoint);
  },

  /**
   * Xóa mềm sân bay (Admin only)
   * @param {number} id - ID của sân bay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  deleteAirport: async (id) => {
    return apiHandler("delete", `/airports/${id}`);
  },

  /**
   * Tìm kiếm sân bay theo từ khóa (sử dụng API getAllAirports và filter ở frontend)
   * @param {{
   *   query: string,
   *   limit?: number,
   *   country?: string
   * }} searchParams - Tham số tìm kiếm
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  searchAirports: async (searchParams) => {
    // Sử dụng getAllAirports với size lớn để lấy nhiều dữ liệu
    const { query, limit = 10, country } = searchParams;

    return this.getAllAirports({
      size: 1000, // Lấy nhiều để có thể filter
      search: query, // Nếu backend hỗ trợ search param
    });
  },

  /**
   * Lấy danh sách sân bay phổ biến (sử dụng getAllAirports và filter)
   * @param {{
   *   country?: string,
   *   limit?: number
   * }} params - Tham số lọc
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getPopularAirports: async (params = {}) => {
    // Tạm thời sử dụng getAllAirports
    return this.getAllAirports({
      size: params.limit || 50,
    });
  },

  /**
   * Lấy danh sách sân bay theo quốc gia (sử dụng getAllAirports và filter)
   * @param {string} country - Tên quốc gia
   * @param {{
   *   page?: number,
   *   size?: number
   * }} params - Tham số phân trang
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAirportsByCountry: async (country, params = {}) => {
    // Sử dụng getAllAirports và filter ở service layer
    return this.getAllAirports({
      page: params.page,
      size: params.size || 100,
    });
  },

  /**
   * Lấy danh sách các quốc gia có sân bay (sử dụng getAllAirports và extract countries)
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getCountries: async () => {
    // Sử dụng getAllAirports và extract unique countries ở service layer
    return this.getAllAirports({
      size: 1000,
    });
  },

  /**
   * Tìm kiếm sân bay gần nhất theo tọa độ (tạm thời disable vì chưa có API)
   * @param {{
   *   latitude: number,
   *   longitude: number,
   *   radius?: number,
   *   limit?: number
   * }} locationParams - Tham số vị trí
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getNearbyAirports: async (locationParams) => {
    // Tạm thời sử dụng getAllAirports, logic tính khoảng cách sẽ ở service layer
    return this.getAllAirports({
      size: 100,
    });
  },

};
