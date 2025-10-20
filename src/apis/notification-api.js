import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến quản lý thông báo (notifications)
 */
export const notificationApi = {
  /**
   * Tạo thông báo mới (Admin only)
   * @param {object} notificationData - Thông tin thông báo
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createNotification: async (notificationData) => {
    return apiHandler("post", "/notifications", notificationData);
  },

  /**
   * Cập nhật thông báo (Admin only)
   * @param {number} id - ID thông báo
   * @param {object} notificationData - Thông tin thông báo
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateNotification: async (id, notificationData) => {
    return apiHandler("put", `/notifications/${id}`, notificationData);
  },

  /**
   * Xoá thông báo (Admin only)
   * @param {number} id - ID thông báo
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  deleteNotification: async (id) => {
    return apiHandler("delete", `/notifications/${id}`);
  },

  /**
   * Lấy thông tin thông báo theo ID
   * @param {number} id - ID thông báo
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getNotificationById: async (id) => {
    return apiHandler("get", `/notifications/${id}`);
  },

  /**
   * Lấy tất cả thông báo (Admin only)
   * @param {object} params - Query parameters
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllNotifications: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/notifications?${queryString}`
      : "/notifications";
    return apiHandler("get", endpoint);
  },

  /**
   * Lấy thông báo của user theo ID
   * @param {number} userId - ID người dùng
   * @param {object} params - Query parameters
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getUserNotifications: async (userId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/notifications/user/${userId}?${queryString}`
      : `/notifications/user/${userId}`;
    return apiHandler("get", endpoint);
  },

  /**
   * Lấy thông báo chưa đọc của user
   * @param {number} userId - ID người dùng
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getUnreadNotifications: async (userId) => {
    return apiHandler("get", `/notifications/user/${userId}/unread`);
  },

  /**
   * Đánh dấu thông báo đã đọc
   * @param {number} userId - ID người dùng
   * @param {Array<number>} notificationIds - Danh sách ID thông báo
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  markAsRead: async (userId, notificationIds) => {
    return apiHandler(
      "put",
      `/notifications/user/${userId}/mark-read`,
      notificationIds
    );
  },

  /**
   * Đánh dấu tất cả thông báo đã đọc
   * @param {number} userId - ID người dùng
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  markAllAsRead: async (userId) => {
    return apiHandler("put", `/notifications/user/${userId}/mark-read-all`);
  },

  /**
   * Lấy số lượng thông báo chưa đọc
   * @param {number} userId - ID người dùng
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getUnreadCount: async (userId) => {
    return apiHandler("get", `/notifications/user/${userId}/count-unread`);
  },

  /**
   * Broadcast notification to all users (Admin only)
   * @param {object} notificationData - Notification data
   * @param {string} notificationData.type - Notification type
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {string|number} notificationData.relatedId - Related ID (optional)
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  broadcastNotification: async (notificationData) => {
    return apiHandler("post", "/notifications/broadcast", notificationData);
  },

  /**
   * Cleanup old read notifications (Admin only)
   * @param {number} daysOld - Number of days old (default: 30)
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  cleanupOldNotifications: async (daysOld = 30) => {
    return apiHandler("delete", `/notifications/cleanup?daysOld=${daysOld}`);
  },
};

/**
 * Notification types enum
 */
export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: "BOOKING_CONFIRMED",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  CHECKIN_SUCCESSFUL: "CHECKIN_SUCCESSFUL",
  FLIGHT_DELAYED: "FLIGHT_DELAYED",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
  SYSTEM_ANNOUNCEMENT: "SYSTEM_ANNOUNCEMENT",
};

/**
 * Notification type labels (Vietnamese)
 */
export const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.BOOKING_CONFIRMED]: "Đặt vé thành công",
  [NOTIFICATION_TYPES.PAYMENT_SUCCESS]: "Thanh toán thành công",
  [NOTIFICATION_TYPES.PAYMENT_FAILED]: "Thanh toán thất bại",
  [NOTIFICATION_TYPES.CHECKIN_SUCCESSFUL]: "Check-in thành công",
  [NOTIFICATION_TYPES.FLIGHT_DELAYED]: "Chuyến bay bị trễ",
  [NOTIFICATION_TYPES.BOOKING_CANCELLED]: "Đặt vé đã hủy",
  [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: "Thông báo hệ thống",
};

/**
 * Get notification settings for user
 */
export const getNotificationSettings = async (userId) => {
  return await apiHandler("get", `/notifications/settings/${userId}`);
};

/**
 * Update notification settings for user
 */
export const updateNotificationSettings = async (userId, settings) => {
  return await apiHandler("put", `/notifications/settings/${userId}`, settings);
};

/**
 * Mark notifications as read by type
 */
export const markAsReadByType = async (userId, type) => {
  return await apiHandler("put", `/notifications/mark-read-by-type`, {
    userId,
    type,
  });
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (userId, timeRange = "7d") => {
  return await apiHandler(
    "get",
    `/notifications/stats/${userId}?timeRange=${timeRange}`
  );
};
