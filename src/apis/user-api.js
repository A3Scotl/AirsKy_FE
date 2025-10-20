import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến quản lý người dùng
 */
export const userApi = {
  /**
   * Lấy danh sách tất cả người dùng với phân trang (Admin only)
   * @param {{
   *   page?: number,
   *   size?: number,
   *   sort?: string,
   *   search?: string
   * }} params - Tham số phân trang và tìm kiếm
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllUsers: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    if (params.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/users?${queryString}` : "/users";

    return apiHandler("get", endpoint);
  },

  /**
   * Lấy thông tin chi tiết một người dùng (Admin only)
   * @param {number} id - ID của người dùng
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getUserById: async (id) => {
    return apiHandler("get", `/users/${id}`);
  },

  /**
   * Cập nhật thông tin người dùng (Form-data)
   * @param {number} id - ID của người dùng
   * @param {FormData} formData - FormData chứa thông tin cập nhật
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateUser: async (id, formData) => {
    return apiHandler("put", `/users/${id}`, formData);
  },

  /**
   * Xóa mềm người dùng (Admin only)
   * @param {number} id - ID của người dùng
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  deleteUser: async (id) => {
    return apiHandler("delete", `/users/${id}`);
  },

  /**
   * Lấy danh sách booking của một user theo ID
   * @param {number} id - ID của người dùng
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getBookingsByUserId: async (id) => {
    return apiHandler("get", `/users/${id}/bookings`);
  },

  /**
   * toogle active user
   * @param {number} id - ID của người dùng
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  toggleActive: async (id) => {
    return apiHandler("patch", `/users/${id}/toggle-active`);
  },

  /**
   * Cập nhật vai trò của người dùng (Admin only)
   * @param {number} id - ID của người dùng
   * @param {string} role - Vai trò mới (ví dụ: 'ADMIN', 'CUSTOMER')
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateUserRole: async (id, role) => {
    const endpoint = `/users/${id}/role?role=${role}`;
    return apiHandler("patch", endpoint);
  },
};
