import { apiHandler } from "@/utils/api-handler";

export const loyaltyApi = {
  // Lấy thông tin loyalty stats của user hiện tại
  getLoyaltyStats: async () => {
    const response = await apiHandler("get", "/loyalty/stats");
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message);
    }
  },

  // Kiểm tra và nâng hạng loyalty cho user hiện tại
  checkAndUpgradeTier: async () => {
    const response = await apiHandler("post", "/loyalty/check-upgrade");
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message);
    }
  },

  // API admin để lấy loyalty stats của một user cụ thể
  adminGetLoyaltyStats: async (userId) => {
    const response = await apiHandler("get", `/loyalty/admin/stats/${userId}`);
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message);
    }
  },

  // API admin để kiểm tra nâng hạng cho một user cụ thể
  adminCheckUpgrade: async (userId) => {
    const response = await apiHandler(
      "post",
      `/loyalty/admin/check-upgrade/${userId}`
    );
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message);
    }
  },
};

export default loyaltyApi;
