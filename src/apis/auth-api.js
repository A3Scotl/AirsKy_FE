import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến xác thực người dùng
 */
export const authApi = {
  /**
   * Gửi yêu cầu đăng nhập
   * @param {{ email: string, password: string }} credentials - Thông tin đăng nhập
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  login: async (credentials) => {
    return apiHandler("post", "/auth/login", credentials);
  },
  /**
   * Gửi yêu cầu đăng kí
   * @param {{ email: string, password: string,firstName: String,lastName: String,phone:String }} credentials - Thông tin đăng kí
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  register: async (credentials) => {
    return apiHandler("post", "/auth/register", credentials);
  },
  /**
   * Xác thực otp đăng kí
   * @param {{ email: string, otpCode: String }} credentials
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  verifyOtpRegistration: async (credentials) => {
    return apiHandler("post", "/auth/verify-registration", credentials);
  },

  /**
   * Đổi mật khẩu
   * @param {{ email: string, oldPassword: String,newPassword: String }} credentials
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  changePassword: async (credentials) => {
    return apiHandler("post", "/auth/change-password", credentials);
  },
  /**
   * Quên mật khẩu --> nhập email
   * @param {{ email: string}} credentials
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  forgotPasswordRequest: async (credentials) => {
    return apiHandler("post", "/auth/forgot-password", credentials);
  },
  /**
   * Quên mật khẩu --> nhập email
   * --> nhập OtpCode đã nhận từ forgotPasswordRequest
   * --> Nhập pass mới
   * @param {{ email: string, otpCode: String,newPassword: String }} credentials
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  resetPassword: async (credentials) => {
    return apiHandler("post", "/auth/reset-password", credentials);
  },
  /**
   * Gửi lại mã xác thực
   * @param {{ email: string}} credentials
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  resendOtpCode: async (credentials) => {
    return apiHandler("post", "/auth/resend-verification", credentials);
  },

  /**
   * Gửi yêu cầu đăng xuất
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  logout: async () => {
    return apiHandler("post", "/auth/logout");
  },

  /**
   * Lấy thông tin người dùng hiện tại
   * * @param {{ email: string}} credentials
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  me: async () => {
    return apiHandler("get", "/auth/profile/me");
  },

  /**
   * Đăng nhập bằng Google
   * @param {{ idToken: string }} credentials - Thông tin đăng nhập Google
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  googleLogin: async (credentials) => {
    return apiHandler("post", "/auth/google-login", credentials);
  }
};
