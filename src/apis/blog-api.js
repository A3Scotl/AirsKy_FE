import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến quản lý blog và bài viết
 */
export const blogApi = {
  /**
   * Tạo bài viết mới (Admin only)
   * @param {{
   *   title: string,
   *   content: string,
   *   excerpt?: string,
   *   featuredImage?: string,
   *   featuredImageFile?: File,
   *   isPublished?: boolean,
   *   categoryIds: number[]
   * }} blogData - Thông tin bài viết
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createBlog: async (blogData) => {
    // Prepare FormData for multipart request
    const formData = new FormData();
    formData.append("title", blogData.title);
    formData.append("content", blogData.content);

    if (blogData.excerpt) {
      formData.append("excerpt", blogData.excerpt);
    }

    if (blogData.featuredImageFile instanceof File) {
      formData.append("featuredImageFile", blogData.featuredImageFile);
    } else if (blogData.featuredImage) {
      formData.append("featuredImage", blogData.featuredImage);
    }

    formData.append("isPublished", blogData.isPublished || false);
    formData.append("categoryIds", blogData.categoryIds.join(","));

    return apiHandler("post", "/blogs", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Cập nhật bài viết (Admin only)
   * @param {number} id - ID của bài viết
   * @param {{
   *   title: string,
   *   content: string,
   *   excerpt?: string,
   *   featuredImage?: string,
   *   featuredImageFile?: File,
   *   isPublished?: boolean,
   *   categoryIds: number[]
   * }} blogData - Thông tin cập nhật
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateBlog: async (id, blogData) => {
    // Prepare FormData for multipart request
    const formData = new FormData();
    formData.append("title", blogData.title);
    formData.append("content", blogData.content);

    if (blogData.excerpt) {
      formData.append("excerpt", blogData.excerpt);
    }

    if (blogData.featuredImageFile instanceof File) {
      formData.append("featuredImageFile", blogData.featuredImageFile);
    } else if (blogData.featuredImage) {
      formData.append("featuredImage", blogData.featuredImage);
    }

    formData.append("isPublished", blogData.isPublished || false);
    formData.append("categoryIds", blogData.categoryIds.join(","));

    return apiHandler("put", `/blogs/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Lấy thông tin chi tiết một bài viết theo ID
   * @param {number} id - ID của bài viết
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getBlogById: async (id) => {
    return apiHandler("get", `/blogs/${id}`);
  },

  /**
   * Lấy thông tin chi tiết một bài viết theo slug (public)
   * @param {string} slug - Slug của bài viết
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getBlogBySlug: async (slug) => {
    return apiHandler("get", `/blogs/slug/${slug}`);
  },

  /**
   * Lấy thông tin chi tiết một bài viết theo slug (admin)
   * @param {string} slug - Slug của bài viết
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getBlogBySlugAdmin: async (slug) => {
    return apiHandler("get", `/blogs/admin/${slug}`);
  },

  /**
   * Lấy danh sách tất cả bài viết đã publish (public)
   * @param {{
   *   page?: number,
   *   size?: number,
   *   sort?: string
   * }} params - Tham số phân trang
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllPublishedBlogs: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/blogs?${queryString}` : "/blogs";

    return apiHandler("get", endpoint);
  },

  /**
   * Lấy danh sách tất cả bài viết (admin)
   * @param {{
   *   page?: number,
   *   size?: number,
   *   sort?: string
   * }} params - Tham số phân trang
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllBlogs: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/blogs/admin?${queryString}`
      : "/blogs/admin";

    return apiHandler("get", endpoint);
  },

  /**
   * Lấy danh sách bài viết theo tác giả
   * @param {number} authorId - ID của tác giả
   * @param {{
   *   page?: number,
   *   size?: number,
   *   sort?: string
   * }} params - Tham số phân trang
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getBlogsByAuthor: async (authorId, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/blogs/author/${authorId}?${queryString}`
      : `/blogs/author/${authorId}`;

    return apiHandler("get", endpoint);
  },

  /**
   * Lấy danh sách bài viết theo danh mục
   * @param {string} categorySlug - Slug của danh mục
   * @param {{
   *   page?: number,
   *   size?: number,
   *   sort?: string
   * }} params - Tham số phân trang
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getBlogsByCategory: async (categorySlug, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/blogs/category/${categorySlug}?${queryString}`
      : `/blogs/category/${categorySlug}`;

    return apiHandler("get", endpoint);
  },

  /**
   * Tìm kiếm bài viết theo từ khóa
   * @param {{
   *   keyword: string,
   *   page?: number,
   *   size?: number,
   *   sort?: string
   * }} searchParams - Tham số tìm kiếm
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  searchBlogs: async (searchParams) => {
    const { keyword, ...params } = searchParams;
    const queryParams = new URLSearchParams();

    queryParams.append("keyword", keyword);
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);

    const queryString = queryParams.toString();
    const endpoint = `/blogs/search?${queryString}`;

    return apiHandler("get", endpoint);
  },

  /**
   * Xóa bài viết (Admin only)
   * @param {number} id - ID của bài viết
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  deleteBlog: async (id) => {
    return apiHandler("delete", `/blogs/${id}`);
  },

  /**
   * Đăng bài viết (Admin only)
   * @param {number} id - ID của bài viết
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  publishBlog: async (id) => {
    return apiHandler("put", `/blogs/${id}/publish`);
  },

  /**
   * Hủy đăng bài viết (Admin only)
   * @param {number} id - ID của bài viết
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  unpublishBlog: async (id) => {
    return apiHandler("put", `/blogs/${id}/unpublish`);
  },

  /**
   * Kiểm tra slug có tồn tại không
   * @param {string} slug - Slug cần kiểm tra
   * @returns {Promise<{ success: boolean, data?: boolean, message: string }>}
   */
  checkSlugExists: async (slug) => {
    return apiHandler("get", `/blogs/check-slug/${slug}`);
  },

  /**
   * Upload ảnh cho editor (Admin only)
   * @param {File} file - File ảnh cần upload
   * @returns {Promise<{ success: boolean, data?: string, message: string }>}
   */
  uploadImageForEditor: async (file) => {
    const formData = new FormData();
    formData.append("upload", file);

    return apiHandler("post", "/blogs/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Lấy danh sách bài viết phổ biến (theo số lượt xem)
   * @param {{
   *   limit?: number,
   *   days?: number
   * }} params - Tham số lọc
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getPopularBlogs: async (params = {}) => {
    // Sử dụng getAllPublishedBlogs với sort theo views
    return this.getAllPublishedBlogs({
      size: params.limit || 10,
      sort: "views,desc",
    });
  },

  /**
   * Lấy danh sách bài viết mới nhất
   * @param {{
   *   limit?: number
   * }} params - Tham số lọc
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getLatestBlogs: async (params = {}) => {
    return this.getAllPublishedBlogs({
      size: params.limit || 10,
      sort: "createdAt,desc",
    });
  },

  /**
   * Lấy danh sách bài viết liên quan (theo danh mục)
   * @param {number} blogId - ID của bài viết hiện tại
   * @param {{
   *   limit?: number
   * }} params - Tham số lọc
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getRelatedBlogs: async (blogId, params = {}) => {
    // Tạm thời sử dụng getAllPublishedBlogs, logic lọc sẽ ở component
    return this.getAllPublishedBlogs({
      size: params.limit || 5,
      sort: "createdAt,desc",
    });
  },
};
