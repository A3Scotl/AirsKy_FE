import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến check-in
 */
export const checkinApi = {
  /**
   * Tìm booking và thông tin hành khách để check-in
   * @param {string} bookingCode - Mã booking
   * @param {string} fullName - Họ tên đầy đủ của hành khách
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  lookupBookingForCheckin: async (bookingCode, fullName) => {
    const queryParams = new URLSearchParams();
    queryParams.append("bookingCode", bookingCode);
    queryParams.append("fullName", fullName);
    const queryString = queryParams.toString();
    return apiHandler("get", `/bookings/lookup?${queryString}`);
  },

  /**
   * Lấy danh sách hành khách đủ điều kiện check-in (Backup method)
   * @param {string} bookingCode - Mã booking
   * @param {string} fullName - Họ tên đầy đủ của hành khách
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getCheckinEligiblePassengers: async (bookingCode, fullName) => {
    const queryParams = new URLSearchParams();
    queryParams.append("bookingCode", bookingCode);
    queryParams.append("fullName", fullName);
    const queryString = queryParams.toString();
    return apiHandler("get", `/bookings/checkin-eligible?${queryString}`);
  },

  /**
   * Tạo check-in mới
   * @param {Object} checkinData - Dữ liệu check-in với cấu trúc: { bookingId, passengerId, seatNumber, ticketPrice }
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createCheckin: async (checkinData) => {
    console.log("🚀 Creating checkin with data:", checkinData);
    return apiHandler("post", "/checkins", checkinData);
  },

  /**
   * Lấy thông tin ghế có sẵn cho chuyến bay
   * @param {number} flightId - ID của chuyến bay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAvailableSeats: async (flightId) => {
    return apiHandler("get", `/flights/${flightId}/seats`);
  },
};
