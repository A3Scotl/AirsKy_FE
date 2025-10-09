import { apiHandler } from "@/utils/api-handler";

/**
 * Payment API endpoints
 */
const paymentApi = {
  /**
   * Create a new payment
   * @param {Object} paymentData - Payment request data
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createPayment: async (paymentData) => {
    return apiHandler("post", "/payments", paymentData);
  },

  /**
   * Update an existing payment
   * @param {number} id - Payment ID
   * @param {Object} paymentData - Payment request data
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updatePayment: async (id, paymentData) => {
    return apiHandler("put", `/payments/${id}`, paymentData);
  },

  /**
   * Get payment by ID
   * @param {number} id - Payment ID
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getPayment: async (id) => {
    return apiHandler("get", `/payments/${id}`);
  },

  /**
   * Get all payments with pagination
   * @param {Object} params - Query parameters (page, size, sort, etc.)
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllPayments: async (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add pagination params
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    // if (params.sort) queryParams.append("sort", params.sort);

    // Add filter params if any
    if (params.search) queryParams.append("search", params.search);
    if (params.status) queryParams.append("status", params.status);
    if (params.paymentMethod)
      queryParams.append("paymentMethod", params.paymentMethod);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const queryString = queryParams.toString();
    const url = queryString ? `/payments?${queryString}` : "/payments";

    return apiHandler("get", url);
  },

  /**
   * Delete payment by ID
   * @param {number} id - Payment ID
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  deletePayment: async (id) => {
    return apiHandler("delete", `/payments/${id}`);
  },

  /**
   * Create a new payment for booking
   * @param {Object} paymentData - Payment request data
   * @param {number} paymentData.bookingId - Booking ID
   * @param {string} paymentData.paymentMethod - Payment method (CREDIT_CARD, PAYPAL, BANK_TRANSFER)
   * @param {number} paymentData.totalAmount - Total amount to pay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createPayment: async (paymentData) => {
    return apiHandler("post", "/payments", paymentData);
  },

  /**
   * Get payments by booking ID
   * @param {number} bookingId - Booking ID
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getPaymentsByBooking: async (bookingId) => {
    return apiHandler("get", `/payments/booking/${bookingId}`);
  },

  /**
   * Execute PayPal payment (success callback)
   * @param {string} paymentId - PayPal payment ID
   * @param {string} payerId - PayPal payer ID
   * @param {number} bookingId - Booking ID
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  executePayPalPayment: async (paymentId, payerId, bookingId) => {
    const params = new URLSearchParams({
      paymentId,
      PayerID: payerId,
      bookingId: bookingId.toString(),
    });
    return apiHandler("get", `/payments/success?${params.toString()}`);
  },

  /**
   * Handle PayPal payment cancellation
   * @param {number} bookingId - Booking ID
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  cancelPayPalPayment: async (bookingId) => {
    const params = new URLSearchParams({
      bookingId: bookingId.toString(),
    });
    return apiHandler("get", `/payments/cancel?${params.toString()}`);
  },
};

export { paymentApi };
