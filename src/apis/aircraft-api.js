import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến máy bay (aircraft)
 */
export const aircraftApi = {
  /**
   * Lấy tất cả máy bay (Admin only, phân trang)
   * @param {{ page?: number, size?: number, sort?: string }} params
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllAircrafts: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/aircrafts?${queryString}` : "/aircrafts";
    return apiHandler("get", endpoint);
  },

  /**
   * Lấy thông tin máy bay theo ID
   * @param {number} id - ID của máy bay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAircraft: async (id) => {
    return apiHandler("get", `/aircrafts/${id}`);
  },

  /**
   * Tạo máy bay mới (Admin only)
   * @param {{
   *   aircraftCode: string,
   *   aircraftName: string,
   *   totalSeats: number,
   *   seatLayout?: string
   * }} aircraftData - Dữ liệu máy bay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createAircraft: async (aircraftData) => {
    return apiHandler("post", "/aircrafts", aircraftData);
  },

  /**
   * Cập nhật máy bay (Admin only)
   * @param {number} id - ID của máy bay
   * @param {{
   *   aircraftCode: string,
   *   aircraftName: string,
   *   totalSeats: number,
   *   seatLayout?: string
   * }} aircraftData - Dữ liệu máy bay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateAircraft: async (id, aircraftData) => {
    return apiHandler("put", `/aircrafts/${id}`, aircraftData);
  },

  /**
   * Xóa máy bay (Admin only)
   * @param {number} id - ID của máy bay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  deleteAircraft: async (id) => {
    return apiHandler("delete", `/aircrafts/${id}`);
  },
};
