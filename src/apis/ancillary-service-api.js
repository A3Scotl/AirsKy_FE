import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến quản lý dịch vụ đi kèm (Ancillary Services)
 */
export const ancillaryServiceApi = {
  /**
   * Tạo dịch vụ đi kèm mới (ADMIN only)
   * @param {Object} serviceData - Dữ liệu dịch vụ
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createService: async (serviceData) => {
    return apiHandler("post", "/ancillary-services", serviceData);
  },

  /**
   * Cập nhật thông tin dịch vụ đi kèm (ADMIN only)
   * @param {number} id - ID của dịch vụ
   * @param {Object} serviceData - Dữ liệu dịch vụ cập nhật
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateService: async (id, serviceData) => {
    return apiHandler("put", `/ancillary-services/${id}`, serviceData);
  },

  /**
   * Lấy thông tin chi tiết một dịch vụ đi kèm
   * @param {number} id - ID của dịch vụ
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getServiceById: async (id) => {
    return apiHandler("get", `/ancillary-services/${id}`);
  },

  /**
   * Lấy danh sách tất cả dịch vụ đi kèm với phân trang và lọc
   * @param {{
   *   page?: number,
   *   size?: number,
   *   sortBy?: string,
   *   sortDir?: string,
   *   serviceType?: string,
   *   activeOnly?: boolean
   * }} params - Tham số phân trang và lọc
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllServices: async (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add pagination params
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortDir) queryParams.append("sortDir", params.sortDir);

    // Add filter params
    if (params.serviceType)
      queryParams.append("serviceType", params.serviceType);
    if (params.activeOnly !== undefined)
      queryParams.append("activeOnly", params.activeOnly);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/ancillary-services?${queryString}`
      : "/ancillary-services";

    return apiHandler("get", url);
  },

  /**
   * Lấy danh sách tất cả dịch vụ đang hoạt động (không phân trang)
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllActiveServices: async () => {
    return apiHandler("get", "/ancillary-services/active");
  },

  /**
   * Tìm kiếm dịch vụ theo tên
   * @param {string} name - Tên dịch vụ cần tìm
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  searchServicesByName: async (name) => {
    const queryParams = new URLSearchParams();
    queryParams.append("name", name);
    return apiHandler(
      "get",
      `/ancillary-services/search?${queryParams.toString()}`
    );
  },

  /**
   * Lấy danh sách tất cả loại dịch vụ
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getServiceTypes: async () => {
    return apiHandler("get", "/ancillary-services/types");
  },

  /**
   * Xóa dịch vụ đi kèm (ADMIN only)
   * @param {number} id - ID của dịch vụ
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  deleteService: async (id) => {
    return apiHandler("delete", `/ancillary-services/${id}`);
  },

  /**
   * Chuyển đổi trạng thái hoạt động của dịch vụ (ADMIN only)
   * @param {number} id - ID của dịch vụ
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  toggleActiveStatus: async (id) => {
    return apiHandler("patch", `/ancillary-services/${id}/toggle-status`);
  },

  /**
   * Lấy danh sách các loại dịch vụ có sẵn
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getServiceTypes: async () => {
    return apiHandler("get", "/ancillary-services/types");
  },

  /**
   * Lấy dịch vụ theo loại dịch vụ với phân trang
   * @param {string} serviceType - Loại dịch vụ
   * @param {{
   *   page?: number,
   *   size?: number,
   *   sortBy?: string,
   *   sortDir?: string
   * }} params - Tham số phân trang
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getServicesByType: async (serviceType, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortDir) queryParams.append("sortDir", params.sortDir);

    queryParams.append("serviceType", serviceType);

    return apiHandler("get", `/ancillary-services?${queryParams.toString()}`);
  },

  /**
   * Lấy dịch vụ phù hợp cho booking (dựa trên loại chuyến bay, hạng vé, v.v.)
   * @param {{
   *   flightType?: string,
   *   travelClass?: string,
   *   passengerTypes?: string[]
   * }} criteria - Tiêu chí lọc dịch vụ
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getRecommendedServices: async (criteria = {}) => {
    // Lấy tất cả dịch vụ active và filter phía client
    // Hoặc có thể tạo endpoint riêng ở backend để filter
    return this.getAllActiveServices();
  },
};

/**
 * Helper function để lấy thông tin loại dịch vụ
 * @param {string} serviceType - Key của loại dịch vụ
 * @param {Object} serviceTypes - Object chứa các loại dịch vụ từ API
 * @returns {Object} - Object chứa icon và vietnameseName
 */
export const getServiceTypeInfo = (serviceType, serviceTypes = {}) => {
  // Ưu tiên sử dụng data từ API
  if (serviceTypes[serviceType]) {
    return serviceTypes[serviceType];
  }

  // Fallback chỉ khi không có data từ API
  const fallbackMap = {
    // Existing types
    baggage: { icon: "🧳", vietnameseName: "Hành Lý" },
    meal: { icon: "🍽️", vietnameseName: "Bữa Ăn" },
    MEAL: { icon: "🍽️", vietnameseName: "Bữa Ăn" },
    seat: { icon: "💺", vietnameseName: "Ghế Ngồi" },
    SEAT: { icon: "💺", vietnameseName: "Ghế Ngồi" },
    entertainment: { icon: "🎬", vietnameseName: "Giải Trí" },
    ENTERTAINMENT: { icon: "🎬", vietnameseName: "Giải Trí" },
    wifi: { icon: "📶", vietnameseName: "Internet" },
    WIFI: { icon: "📶", vietnameseName: "Internet" },
    insurance: { icon: "🛡️", vietnameseName: "Bảo Hiểm" },
    TRAVEL_INSURANCE: { icon: "🛡️", vietnameseName: "Bảo Hiểm Du Lịch" },
    priority: { icon: "⭐", vietnameseName: "Ưu Tiên" },
    PRIORITY_BOARDING: { icon: "⭐", vietnameseName: "Lên Máy Bay Ưu Tiên" },
    pet: { icon: "🐾", vietnameseName: "Thú Cưng" },
    PET_TRANSPORT: { icon: "🐾", vietnameseName: "Vận Chuyển Thú Cưng" },
    special_assistance: { icon: "♿", vietnameseName: "Hỗ Trợ Đặc Biệt" },
    SPECIAL_ASSISTANCE: { icon: "♿", vietnameseName: "Hỗ Trợ Đặc Biệt" },
    // New types from API
    LOUNGE_ACCESS: { icon: "🏢", vietnameseName: "Truy Cập Phòng Chờ" },
    EXTRA_LEGROOM: { icon: "🦵", vietnameseName: "Không Gian Chân Thêm" },
    INFANT_MEAL: { icon: "👶", vietnameseName: "Bữa Ăn Trẻ Em" },
    OTHER: { icon: "📋", vietnameseName: "Khác" },
  };

  return fallbackMap[serviceType] || { icon: "📋", vietnameseName: "Khác" };
};
