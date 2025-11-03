import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến quản lý sân bay và tìm kiếm
 */
export const airportApi = {
  /**
   * Tạo sân bay mới (Admin only) - Sử dụng FormData cho thumbnail và gates
   * @param {{
   *   airportCode: string,
   *   airportName: string,
   *   countryId?: string|number,
   *   country?: string,
   *   cityNames?: string,
   *   thumbnail?: string,
   *   thumbnailFile?: File,
   *   thumbnailUrl?: string,
   *   active?: boolean,
   *   gates?: Array<{gateName: string, terminal: string}>
   * }} airportData - Thông tin sân bay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createAirport: async (airportData) => {
    const formData = new FormData();
    formData.append("airportCode", airportData.airportCode);
    formData.append("airportName", airportData.airportName);
    if (airportData.countryId) {
      formData.append("countryId", airportData.countryId);
    } else if (airportData.country) {
      formData.append("country", airportData.country);
    }
    if (airportData.cityNames)
      formData.append("cityNames", airportData.cityNames);

    // Xử lý thumbnail: ưu tiên file upload, sau đó mới đến URL
    if (airportData.thumbnailFile instanceof File) {
      console.log(
        "[AirportAPI] Appending file:",
        airportData.thumbnailFile.name
      );
      formData.append("thumbnail", airportData.thumbnailFile);
    } else if (airportData.thumbnailUrl) {
      console.log("[AirportAPI] Appending URL:", airportData.thumbnailUrl);
      formData.append("thumbnailUrl", airportData.thumbnailUrl);
    } else if (airportData.thumbnail) {
      console.log("[AirportAPI] Appending URL:", airportData.thumbnail);
      formData.append("thumbnailUrl", airportData.thumbnail);
    }

    formData.append(
      "active",
      airportData.active !== undefined ? airportData.active.toString() : "true"
    );

    // Xử lý gates array
    if (airportData.gates && Array.isArray(airportData.gates)) {
      airportData.gates.forEach((gate, index) => {
        if (gate.gateName) {
          formData.append(`gates[${index}].gateName`, gate.gateName);
        }
        if (gate.terminal) {
          formData.append(`gates[${index}].terminal`, gate.terminal);
        }
      });
    }

    // Debug: Log FormData contents
    console.log("[AirportAPI] FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value, `(type: ${typeof value})`);
    }

    return apiHandler("post", "/airports", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Cập nhật thông tin sân bay (Admin only) - Luôn sử dụng FormData
   * @param {number} id - ID của sân bay
   * @param {{
   *   airportCode: string,
   *   airportName: string,
   *   countryId?: string|number,
   *   country?: string,
   *   cityNames?: string,
   *   thumbnail?: string,
   *   thumbnailFile?: File,
   *   thumbnailUrl?: string,
   *   active?: boolean,
   *   gates?: Array<{gateName: string, terminal: string}>
   * }} airportData - Thông tin cập nhật
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateAirport: async (id, airportData) => {
    console.log("[AirportAPI] Updating airport:", id);
    console.log("[AirportAPI] Input data:", airportData);
    for (const [key, value] of Object.entries(airportData)) {
      console.log(`  ${key}:`, value, `(type: ${typeof value})`);
    }

    const formData = new FormData();
    formData.append("airportCode", airportData.airportCode);
    formData.append("airportName", airportData.airportName);
    if (airportData.countryId !== undefined && airportData.countryId !== null) {
      formData.append("countryId", airportData.countryId);
      console.log("[AirportAPI] Appended countryId:", airportData.countryId);
    }
    if (airportData.cityNames) {
      formData.append("cityNames", airportData.cityNames);
    }
    formData.append(
      "active",
      airportData.active !== undefined ? airportData.active.toString() : "true"
    );

    // Xử lý thumbnail: ưu tiên file upload, sau đó mới đến URL
    if (airportData.thumbnailFile instanceof File) {
      console.log(
        "[AirportAPI] Appending file:",
        airportData.thumbnailFile.name
      );
      formData.append("thumbnail", airportData.thumbnailFile);
    } else if (airportData.thumbnailUrl) {
      console.log(
        "[AirportAPI] Appending thumbnailUrl:",
        airportData.thumbnailUrl
      );
      formData.append("thumbnailUrl", airportData.thumbnailUrl);
    } else if (airportData.thumbnail) {
      console.log("[AirportAPI] Appending thumbnail:", airportData.thumbnail);
      formData.append("thumbnailUrl", airportData.thumbnail);
    }

    // Xử lý gates array - gửi dưới dạng indexed form fields cho Spring Boot binding
    if (airportData.gates && Array.isArray(airportData.gates)) {
      console.log("[AirportAPI] Processing gates:", airportData.gates);
      const validGates = airportData.gates.filter(
        (gate) => gate.gateName && gate.terminal
      );
      validGates.forEach((gate, index) => {
        formData.append(`gates[${index}].gateName`, gate.gateName);
        formData.append(`gates[${index}].terminal`, gate.terminal);
        console.log(`[AirportAPI] Appended gate ${index}:`, gate);
      });
    }

    console.log("[AirportAPI] Final FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value, `(type: ${typeof value})`);
    }

    return apiHandler("put", `/airports/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
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

    // Call getAllAirports directly using apiHandler
    const queryParams = new URLSearchParams();
    queryParams.append("size", "1000");
    if (query) queryParams.append("search", query);
    const endpoint = `/airports?${queryParams.toString()}`;

    return apiHandler("get", endpoint);
  },

  /**
   * Lấy thông tin airport từ airport code
   * @param {string} airportCode - Mã sân bay (VD: "HAN", "SGN")
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAirportByCode: async (airportCode) => {
    try {
      console.log("[AirportAPI] Getting airport by code:", airportCode);
      const response = await apiHandler("get", `/airports/code/${airportCode}`);
      console.log("[AirportAPI] getAirportByCode response:", response);

      if (response.success && response.data) {
        console.log("[AirportAPI] Found airport:", response.data);
        return {
          success: true,
          data: response.data,
          message: `Found airport for code ${airportCode}`,
        };
      }

      return {
        success: false,
        message: `Airport with code ${airportCode} not found`,
      };
    } catch (error) {
      console.error("[AirportAPI] Error getting airport by code:", error);
      return {
        success: false,
        message: `Error finding airport for code ${airportCode}: ${error.message}`,
      };
    }
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
    const queryParams = new URLSearchParams();
    queryParams.append("size", params.limit || "50");
    const endpoint = `/airports?${queryParams.toString()}`;

    return apiHandler("get", endpoint);
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
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", params.page);
    queryParams.append("size", params.size || "100");
    const endpoint = `/airports?${queryParams.toString()}`;

    return apiHandler("get", endpoint);
  },

  /**
   * Lấy danh sách các quốc gia có sân bay (sử dụng getAllAirports và extract countries)
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getCountries: async () => {
    // Sử dụng getAllAirports và extract unique countries ở service layer
    const queryParams = new URLSearchParams();
    queryParams.append("size", "1000");
    const endpoint = `/airports?${queryParams.toString()}`;

    return apiHandler("get", endpoint);
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
    const queryParams = new URLSearchParams();
    queryParams.append("size", "100");
    const endpoint = `/airports?${queryParams.toString()}`;

    return apiHandler("get", endpoint);
  },
};
