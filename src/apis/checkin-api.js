import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến check-in
 */
export const checkinApi = {
  /**
   * Lấy danh sách hành khách đủ điều kiện check-in
   * @param {string} bookingCode - Mã booking
   * @param {string} fullName - Họ tên đầy đủ của hành khách
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getCheckinEligiblePassengers: async (bookingCode, fullName) => {
    const queryParams = new URLSearchParams();
    queryParams.append("bookingCode", bookingCode);
    queryParams.append("fullName", fullName);
    const queryString = queryParams.toString();
    return apiHandler("get", `/checkin-eligible?${queryString}`);
  },

  /**
   * Tạo check-in mới
   * @param {Object} checkinData - Dữ liệu check-in, khớp với CheckinRequest DTO
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createCheckin: async (checkinData) => {
    return apiHandler("post", "/checkin", checkinData);
  },
};
