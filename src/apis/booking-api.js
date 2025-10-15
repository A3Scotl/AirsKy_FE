import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến đặt vé (Booking)
 */
export const bookingApi = {
  /**
   * Tạo mới một booking
   * @param {Object} bookingData - Dữ liệu đặt vé, khớp với BookingRequest DTO
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createBooking: async (bookingData) => {
    return apiHandler("post", "/bookings", bookingData);
  },

  /**
   * Cập nhật một booking theo ID
   * @param {number} id - ID của booking
   * @param {Object} bookingData - Dữ liệu cập nhật
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateBooking: async (id, bookingData) => {
    return apiHandler("put", `/bookings/${id}`, bookingData);
  },

  /**
   * Lấy thông tin booking theo ID
   * @param {number} id - ID của booking
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getBooking: async (id) => {
    return apiHandler("get", `/bookings/${id}`);
  },

  /**
   * Lấy tất cả booking (có phân trang)
   * @param {{ page?: number, size?: number, sort?: string }} params - Tham số phân trang
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllBookings: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/bookings?${queryString}` : "/bookings";
    return apiHandler("get", endpoint);
  },

  /**
   * Xóa một booking theo ID
   * @param {number} id - ID của booking
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  deleteBooking: async (id) => {
    return apiHandler("delete", `/bookings/${id}`);
  },

  /**
   * Tìm booking theo mã booking và tên hành khách
   * @param {string} bookingCode - Mã booking
   * @param {string} fullName - Họ tên đầy đủ của hành khách
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  lookupBooking: async (bookingCode, fullName) => {
    const queryParams = new URLSearchParams();
    queryParams.append("bookingCode", bookingCode);
    queryParams.append("fullName", fullName);
    const queryString = queryParams.toString();
    return apiHandler("get", `/bookings/lookup?${queryString}`);
  },

  /**
   * Tính toán thay đổi ghế
   * @param {Object} seatChangeData - Dữ liệu tính toán thay đổi ghế
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  calculateSeatChange: async (seatChangeData) => {
    return apiHandler(
      "post",
      "/bookings/calculate-seat-change",
      seatChangeData
    );
  },

  /**
   * Cập nhật tổng tiền booking
   * @param {number} id - ID của booking
   * @param {Object} updateData - Dữ liệu cập nhật tổng tiền
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateBookingTotal: async (id, updateData) => {
    return apiHandler("put", `/bookings/${id}/update-total`, updateData);
  },

  /**
   * Xử lý check-in
   * @param {Object} checkinData - Dữ liệu check-in với cấu trúc: { bookingCode, passengerId, passengerFullName }
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  processCheckin: async (checkinData) => {
    return apiHandler("put", "/bookings/checkin", checkinData);
  },
};
