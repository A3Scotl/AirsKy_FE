import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến boarding pass
 */
export const boardingpassApi = {
  /**
   * Get boarding pass URL
   * @param {string} bookingCode - Mã booking
   * @param {number} passengerId - ID hành khách
   * @returns {Promise<{ success: boolean, data?: string, message: string }>}
   */
  getBoardingPassUrl: async (bookingCode, passengerId) => {
    return apiHandler(
      "get",
      `/boarding-passes/download/${bookingCode}/${passengerId}`
    );
  },

  /**
   * Verify QR code
   * @param {string} qrCode - Mã QR
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  verifyQRCode: async (qrCode) => {
    const queryParams = new URLSearchParams();
    queryParams.append("code", qrCode);
    return apiHandler(
      "get",
      `/boarding-passes/verify?${queryParams.toString()}`
    );
  },

  /**
   * Scan boarding pass
   * @param {string} bookingCode - Mã booking
   * @param {number} passengerId - ID hành khách
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  scanBoardingPass: async (bookingCode, passengerId) => {
    return apiHandler(
      "get",
      `/boarding-passes/scan/${bookingCode}/${passengerId}`
    );
  },

  /**
   * Download boarding pass from URL
   * @param {string} url - URL của boarding pass
   * @param {string} fileName - Tên file để tải về
   */
  downloadFromUrl: async (url, fileName = "boarding-pass.png") => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true, message: "Tải xuống thành công" };
    } catch (error) {
      console.error("Download error:", error);
      return { success: false, message: "Lỗi khi tải xuống" };
    }
  },
};
