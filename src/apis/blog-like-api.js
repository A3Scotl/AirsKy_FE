import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến like/unlike bài viết
 */
export const blogLikeApi = {
  /**
   * Thích bài viết (User/Admin only)
   * @param {number} blogId - ID của bài viết
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  likeBlog: async (blogId) => {
    return apiHandler("post", `/blog-likes/blog/${blogId}`);
  },

  /**
   * Bỏ thích bài viết (User/Admin only)
   * @param {number} blogId - ID của bài viết
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  unlikeBlog: async (blogId) => {
    return apiHandler("delete", `/blog-likes/blog/${blogId}`);
  },

  /**
   * Kiểm tra user đã thích bài viết chưa (User/Admin only)
   * @param {number} blogId - ID của bài viết
   * @returns {Promise<{ success: boolean, data?: boolean, message: string }>}
   */
  checkIfLiked: async (blogId) => {
    return apiHandler("get", `/blog-likes/blog/${blogId}/check`);
  },

  /**
   * Lấy số lượt thích của bài viết (Public)
   * @param {number} blogId - ID của bài viết
   * @returns {Promise<{ success: boolean, data?: number, message: string }>}
   */
  getLikeCount: async (blogId) => {
    return apiHandler("get", `/blog-likes/blog/${blogId}/count`);
  },

  /**
   * Toggle like/unlike bài viết
   * @param {number} blogId - ID của bài viết
   * @returns {Promise<{ success: boolean, data?: any, message: string, isLiked: boolean }>}
   */
  toggleLike: async (blogId) => {
    try {
      const checkResult = await blogLikeApi.checkIfLiked(blogId);
      if (!checkResult.success) {
        return checkResult;
      }
      const isCurrentlyLiked = checkResult.data === true;
      let result;
      if (isCurrentlyLiked) {
        result = await blogLikeApi.unlikeBlog(blogId);
      } else {
        result = await blogLikeApi.likeBlog(blogId);
      }
      if (result.success) {
        result.isLiked = !isCurrentlyLiked;
      }
      return result;
    } catch (error) {
      return {
        success: false,
        message: "Có lỗi xảy ra khi thực hiện thao tác",
        data: null,
      };
    }
  },
};
