import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến boarding pass
 */
export const boardingpassApi = {
  /**
   * Download boarding pass PDF
   * @param {string} fileName - Tên file boarding pass
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  downloadBoardingPass: async (fileName) => {
    return apiHandler("get", `/boarding-passes/download/${fileName}`, null, {
      responseType: "blob", // Để nhận file PDF dưới dạng blob
    });
  },
};
