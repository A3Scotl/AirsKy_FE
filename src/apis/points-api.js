import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến quản lý đổi điểm thưởng
 */
export const pointsApi = {
  /**
   * Lấy thông tin tỷ lệ đổi điểm
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getPointsRedemptionRates: async () => {
    return apiHandler("get", "/points-redemption/rates");
  },

  /**
   * Tính giá trị giảm giá từ số điểm
   * @param {number} points - Số điểm muốn đổi
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  calculateDiscountFromPoints: async (points) => {
    return apiHandler(
      "get",
      `/points-redemption/calculate-discount?points=${points}`
    );
  },

  /**
   * Kiểm tra người dùng có thể đổi điểm không
   * @param {number} userId - ID của người dùng
   * @param {number} pointsRequired - Số điểm cần thiết
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  canRedeemPoints: async (userId, pointsRequired) => {
    return apiHandler(
      "get",
      `/points-redemption/user/${userId}/can-redeem?pointsRequired=${pointsRequired}`
    );
  },

  /**
   * Tính giá trị giảm giá từ số điểm bằng mã hội viên
   * @param {string} membershipCode - Mã hội viên
   * @param {number} points - Số điểm muốn đổi
   * @returns {Promise<{ success: boolean, data?: number, message: string }>}
   */
  calculateDiscountFromPointsByMembership: async (membershipCode, points) => {
    return apiHandler(
      "get",
      `/points-redemption/calculate-discount-by-membership?membershipCode=${membershipCode}&points=${points}`
    );
  },

  /**
   * Đổi điểm lấy voucher
   * @param {Object} redeemData - Dữ liệu đổi điểm
   * @param {number} redeemData.userId - ID người dùng
   * @param {number} redeemData.pointsToRedeem - Số điểm muốn đổi
   * @param {number} redeemData.discountAmount - Số tiền giảm giá
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  redeemPointsForDeal: async (redeemData) => {
    return apiHandler("post", "/points-redemption/redeem", redeemData);
  },

  /**
   * Lấy danh sách voucher đã đổi từ điểm của người dùng
   * @param {number} userId - ID của người dùng
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getUserPointsRedemptionDeals: async (userId) => {
    return apiHandler("get", `/points-redemption/user/${userId}/deals`);
  },
};
