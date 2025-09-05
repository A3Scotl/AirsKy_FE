import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến quản lý category (thể loại blog)
 */
export const categoryApi = {
  /**
   * Tạo category mới (Admin only)
   * @param {{
   *   name: string,
   *   description?: string,
   *   slug?: string
   * }} categoryData - Thông tin category
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createCategory: async (categoryData) => {
    return apiHandler("post", "/categories", categoryData);
  },

  /**
   * Cập nhật category (Admin only)
   * @param {number} categoryId - ID của category
   * @param {{
   *   name?: string,
   *   description?: string,
   *   slug?: string
   * }} categoryData - Thông tin cập nhật
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateCategory: async (categoryId, categoryData) => {
    console.log("API updateCategory called with ID:", categoryId);
    return apiHandler("put", `/categories/${categoryId}`, categoryData);
  },

  /**
   * Lấy thông tin chi tiết một category theo ID
   * @param {number} categoryId - ID của category
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getCategoryById: async (categoryId) => {
    console.log("API getCategoryById called with ID:", categoryId);
    return apiHandler("get", `/categories/${categoryId}`);
  },

  /**
   * Lấy thông tin chi tiết một category theo slug
   * @param {string} slug - Slug của category
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getCategoryBySlug: async (slug) => {
    return apiHandler("get", `/categories/slug/${slug}`);
  },

  /**
   * Lấy danh sách tất cả category với phân trang
   * @param {{
   *   page?: number,
   *   size?: number,
   *   sort?: string
   * }} params - Tham số phân trang
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllCategories: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/categories?${queryString}` : "/categories";

    return apiHandler("get", endpoint);
  },

  /**
   * Lấy danh sách tất cả category (không phân trang) - cho dropdown
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllCategoriesList: async () => {
    return apiHandler("get", "/categories/all");
  },

  /**
   * Xóa category (Admin only)
   * @param {number} categoryId - ID của category
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  deleteCategory: async (categoryId) => {
    console.log("API deleteCategory called with ID:", categoryId);
    return apiHandler("delete", `/categories/${categoryId}`);
  },

  /**
   * Kiểm tra slug có tồn tại không (Admin only)
   * @param {string} slug - Slug cần kiểm tra
   * @returns {Promise<{ success: boolean, data?: boolean, message: string }>}
   */
  checkSlugExists: async (slug) => {
    return apiHandler("get", `/categories/check-slug/${slug}`);
  },

  /**
   * Kiểm tra tên có tồn tại không (Admin only)
   * @param {string} name - Tên cần kiểm tra
   * @returns {Promise<{ success: boolean, data?: boolean, message: string }>}
   */
  checkNameExists: async (name) => {
    return apiHandler("get", `/categories/check-name/${name}`);
  },
};
