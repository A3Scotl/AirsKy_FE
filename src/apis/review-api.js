import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến quản lý đánh giá chuyến bay
 */
export const reviewApi = {
  /**
   * Tạo đánh giá mới
   * @param {Object} reviewData - Dữ liệu đánh giá
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createReview: async (reviewData) => {
    return apiHandler("post", "/reviews", reviewData);
  },

  /**
   * Cập nhật thông tin đánh giá
   * @param {number} id - ID của đánh giá
   * @param {Object} reviewData - Dữ liệu đánh giá cập nhật
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateReview: async (id, reviewData) => {
    return apiHandler("put", `/reviews/${id}`, reviewData);
  },

  /**
   * Lấy thông tin chi tiết một đánh giá
   * @param {number} id - ID của đánh giá
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getReviewById: async (id) => {
    return apiHandler("get", `/reviews/${id}`);
  },

  /**
   * Lấy danh sách tất cả đánh giá với phân trang
   * @param {{
   *   page?: number,
   *   size?: number,
   *   sort?: string,
   *   search?: string,
   *   isApproved?: boolean,
   *   flightId?: number,
   *   userId?: number,
   *   rating?: number,
   *   dateFrom?: string,
   *   dateTo?: string
   * }} params - Tham số phân trang và lọc
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllReviews: async (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add pagination params
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);

    // Add filter params
    if (params.search) queryParams.append("search", params.search);
    if (params.isApproved !== undefined)
      queryParams.append("isApproved", params.isApproved);
    if (params.flightId) queryParams.append("flightId", params.flightId);
    if (params.userId) queryParams.append("userId", params.userId);
    if (params.rating) queryParams.append("rating", params.rating);
    if (params.dateFrom) queryParams.append("dateFrom", params.dateFrom);
    if (params.dateTo) queryParams.append("dateTo", params.dateTo);

    const queryString = queryParams.toString();
    const url = queryString ? `/reviews?${queryString}` : "/reviews";

    return apiHandler("get", url);
  },

  /**
   * Xóa đánh giá
   * @param {number} id - ID của đánh giá
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  deleteReview: async (id) => {
    return apiHandler("delete", `/reviews/${id}`);
  },

  /**
   * Ẩn đánh giá
   * @param {number} id - ID của đánh giá
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  hideReview: async (id) => {
    return apiHandler("put", `/reviews/${id}/hide`);
  },

  /**
   * Lấy đánh giá theo chuyến bay
   * @param {number} flightId - ID của chuyến bay
   * @param {{
   *   page?: number,
   *   size?: number,
   *   sort?: string,
   *   isApproved?: boolean
   * }} params - Tham số phân trang
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getReviewsByFlight: async (flightId, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    if (params.isApproved !== undefined)
      queryParams.append("isApproved", params.isApproved);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/reviews/flight/${flightId}?${queryString}`
      : `/reviews/flight/${flightId}`;

    return apiHandler("get", url);
  },

  /**
   * Lấy đánh giá theo người dùng
   * @param {number} userId - ID của người dùng
   * @param {{
   *   page?: number,
   *   size?: number,
   *   sort?: string,
   *   isApproved?: boolean
   * }} params - Tham số phân trang
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getReviewsByUser: async (userId, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    if (params.isApproved !== undefined)
      queryParams.append("isApproved", params.isApproved);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/reviews/user/${userId}?${queryString}`
      : `/reviews/user/${userId}`;

    return apiHandler("get", url);
  },

  /**
   * Lấy điểm đánh giá trung bình của chuyến bay
   * @param {number} flightId - ID của chuyến bay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAverageRating: async (flightId) => {
    return apiHandler("get", `/reviews/flight/${flightId}/average-rating`);
  },

  /**
   * Kiểm tra xem người dùng đã đánh giá booking chưa
   * @param {number} bookingId - ID của booking
   * @param {number} userId - ID của người dùng
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  hasUserReviewedBooking: async (bookingId, userId) => {
    return apiHandler("get", `/reviews/check/${bookingId}/${userId}`);
  },

  /**
   * Lấy thống kê đánh giá
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getReviewStats: async () => {
    return apiHandler("get", "/reviews/stats");
  },

  /**
   * Lấy reviews theo chuyến bay của một booking
   * @param {number} bookingId - ID của booking
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getReviewsByBookingFlight: async (bookingId) => {
    return apiHandler("get", `/reviews/booking/${bookingId}`);
  },

  /**
   * Lấy review request của user cho một booking cụ thể
   * @param {number} bookingId - ID của booking
   * @param {number} userId - ID của user
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getMyReviewForBooking: async (bookingId, userId) => {
    return apiHandler(
      "get",
      `/reviews/booking/${bookingId}/my-review?userId=${userId}`
    );
  },

  /**
   * Duyệt đánh giá
   * @param {number} id - ID của đánh giá
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  approveReview: async (id) => {
    return apiHandler("put", `/reviews/${id}/approve`);
  },

  /**
   * Từ chối đánh giá
   * @param {number} id - ID của đánh giá
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  rejectReview: async (id) => {
    return apiHandler("put", `/reviews/${id}/reject`);
  },

  getReviewsByRoute: async (departureCode, arrivalCode) => {
    return apiHandler(
      "get",
      `/reviews/route?departureCode=${departureCode}&arrivalCode=${arrivalCode}`
    );
  },
};
