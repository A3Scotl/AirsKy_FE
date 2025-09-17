import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến quản lý hạng vé
 */
export const classesApi = {
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
  getAllClasses: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    if (params.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/travel-classes?${queryString}`
      : "/travel-classes";

    return apiHandler("get", endpoint);
  },

  /**
   * Tạo hạng vé mới (Admin only)
   * @param {{
   *   className: string,
   *   benefits?: string,
   *   refundable: boolean,
   *   changeable: boolean,
   *   cancellationFee?: number
   * }} travelClassData - Dữ liệu hạng vé
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createTravelClass: async (travelClassData) => {
    // Ensure we don't send priceMultiplier to backend
    const { priceMultiplier, ...cleanData } = travelClassData;
    return apiHandler("post", "/travel-classes", cleanData);
  },

  /**
   * Cập nhật hạng vé (Admin only)
   * @param {number} id - ID của hạng vé
   * @param {{
   *   className: string,
   *   benefits?: string,
   *   refundable: boolean,
   *   changeable: boolean,
   *   cancellationFee?: number
   * }} travelClassData - Dữ liệu hạng vé
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateTravelClass: async (id, travelClassData) => {
    // Ensure we don't send priceMultiplier to backend
    const { priceMultiplier, ...cleanData } = travelClassData;
    return apiHandler("put", `/travel-classes/${id}`, cleanData);
  },

  /**
   * Xóa hạng vé (Admin only)
   * @param {number} id - ID của hạng vé
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  deleteTravelClass: async (id) => {
    return apiHandler("delete", `/travel-classes/${id}`);
  },
};
