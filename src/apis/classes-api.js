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
    const endpoint = queryString ? `/travel-classes?${queryString}` : "/travel-classes";

    return apiHandler("get", endpoint);
  },

  




};
