import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến mã giảm giá (deal)
 */
export const dealApi = {
  /**
   * Tạo deal mới (Admin only)
   * @param {FormData} dealData - Dữ liệu deal (multipart/form-data)
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createDeal: async (dealData) => {
    return apiHandler("post", "/deals", dealData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**
   * Cập nhật deal (Admin only)
   * @param {number} id - ID của deal
   * @param {FormData} dealData - Dữ liệu deal (multipart/form-data)
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateDeal: async (id, dealData) => {
    return apiHandler("put", `/deals/${id}`, dealData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**
   * Lấy deal theo ID (Admin only)
   * @param {number} id
   */
  getDealById: async (id) => {
    return apiHandler("get", `/deals/${id}`);
  },

  /**
   * Lấy deal theo mã code
   * @param {string} dealCode
   */
  getDealByCode: async (dealCode) => {
    return apiHandler("get", `/deals/code/${dealCode}`);
  },

  /**
   * Lấy tất cả deal (Admin only, phân trang)
   * @param {{ page?: number, size?: number, sort?: string }} params
   */
  getAllDeals: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/deals?${queryString}` : "/deals";
    return apiHandler("get", endpoint);
  },

  /**
   * Lấy tất cả deal đang hoạt động (public, phân trang)
   * @param {{ page?: number, size?: number, sort?: string }} params
   */
  getActiveDeals: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/deals/active?${queryString}`
      : "/deals/active";
    return apiHandler("get", endpoint);
  },

  /**
   * Lấy deal theo route (public, phân trang)
   * @param {{ departureAirportId?: number, arrivalAirportId?: number, page?: number, size?: number }} params
   */
  getDealsByRoute: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.departureAirportId)
      queryParams.append("departureAirportId", params.departureAirportId);
    if (params.arrivalAirportId)
      queryParams.append("arrivalAirportId", params.arrivalAirportId);
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/deals/route?${queryString}`
      : "/deals/route";
    return apiHandler("get", endpoint);
  },

  /**
   * Xóa deal (Admin only)
   * @param {number} id
   */
  deleteDeal: async (id) => {
    return apiHandler("delete", `/deals/${id}`);
  },

  /**
   * Kích hoạt deal (Admin only)
   * @param {number} id
   */
  activateDeal: async (id) => {
    return apiHandler("put", `/deals/${id}/activate`);
  },

  /**
   * Vô hiệu hóa deal (Admin only)
   * @param {number} id
   */
  deactivateDeal: async (id) => {
    return apiHandler("put", `/deals/${id}/deactivate`);
  },

  /**
   * Kiểm tra mã code đã tồn tại chưa (Admin only)
   * @param {string} dealCode
   */
  checkCodeExists: async (dealCode) => {
    return apiHandler("get", `/deals/check-code/${dealCode}`);
  },

  /**
   * Áp dụng deal cho booking (Admin/User)
   * @param {{ dealCode: string, bookingId: number, orderAmount: number }} data
   */
  applyDeal: async (data) => {
    const params = new URLSearchParams();
    params.append("dealCode", data.dealCode);
    params.append("bookingId", data.bookingId);
    params.append("orderAmount", data.orderAmount);
    return apiHandler("post", `/deals/apply?${params.toString()}`);
  },

  /**
   * Kiểm tra user có thể sử dụng deal không (Admin/User)
   * @param {string} dealCode
   */
  canUserUseDeal: async (dealCode) => {
    return apiHandler("get", `/deals/can-use/${dealCode}`);
  },

  /**
   * Lấy lịch sử sử dụng deal theo dealId (Admin only, phân trang)
   * @param {number} dealId
   * @param {{ page?: number, size?: number }} params
   */
  getDealUsageHistory: async (dealId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/deals/${dealId}/usage-history?${queryString}`
      : `/deals/${dealId}/usage-history`;
    return apiHandler("get", endpoint);
  },

  /**
   * Lấy lịch sử sử dụng deal của user hiện tại (Admin/User, phân trang)
   * @param {{ page?: number, size?: number }} params
   */
  getMyDealUsageHistory: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/deals/my-usage-history?${queryString}`
      : "/deals/my-usage-history";
    return apiHandler("get", endpoint);
  },
};
