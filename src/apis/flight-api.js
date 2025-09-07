import { apiHandler } from "@/utils/api-handler";

/**
 * API liên quan đến quản lý chuyến bay (flight)
 */
export const flightApi = {
  /**
   * Tạo chuyến bay mới (Admin only)
   * @param {object} flightData - Thông tin chuyến bay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  createFlight: async (flightData) => {
    return apiHandler("post", "/flights", flightData);
  },

  /**
   * Cập nhật chuyến bay (Admin only)
   * @param {number} id - ID chuyến bay
   * @param {object} flightData - Thông tin chuyến bay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  updateFlight: async (id, flightData) => {
    return apiHandler("put", `/flights/${id}`, flightData);
  },

  /**
   * Xoá chuyến bay (Admin only)
   * @param {number} id - ID chuyến bay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  deleteFlight: async (id) => {
    return apiHandler("delete", `/flights/${id}`);
  },

  /**
   * Lấy thông tin chuyến bay theo ID
   * @param {number} id - ID chuyến bay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getFlightById: async (id) => {
    return apiHandler("get", `/flights/${id}`);
  },

  /**
   * Lấy danh sách chuyến bay (phân trang)
   * @param {{ page?: number, size?: number, sort?: string }} params
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getAllFlights: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/flights?${queryString}` : "/flights";
    return apiHandler("get", endpoint);
  },

  /**
   * Tìm kiếm chuyến bay
   * @param {object} params - { departureAirportId, arrivalAirportId, startTime, endTime, status, page, size, sort }
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  searchFlights: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.departureAirportId)
      queryParams.append("departureAirportId", params.departureAirportId);
    if (params.arrivalAirportId)
      queryParams.append("arrivalAirportId", params.arrivalAirportId);
    if (params.startTime) queryParams.append("startTime", params.startTime);
    if (params.endTime) queryParams.append("endTime", params.endTime);
    if (params.status) queryParams.append("status", params.status);
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/flights/search?${queryString}`
      : "/flights/search";
    return apiHandler("get", endpoint);
  },

  /**
   * Lấy danh sách ghế theo chuyến bay
   * @param {number} flightId - ID chuyến bay
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  getSeatsByFlight: async (flightId) => {
    return apiHandler("get", `/flights/${flightId}/seats`);
  },

  /**
   * In ra các chuyến bay nội địa trong một quốc gia
   * @param {string} country - Tên quốc gia
   * @param {{ page?: number, size?: number }} params
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  findDomesticFlights: async (country, params = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append("country", country);
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    const queryString = queryParams.toString();
    const endpoint = `/flights/domestic?${queryString}`;
    return apiHandler("get", endpoint);
  },

  /**
   * Tìm kiếm chuyến bay giữa hai quốc gia
   * @param {string} departureCountry - Quốc gia khởi hành
   * @param {string} arrivalCountry - Quốc gia đến
   * @param {{ page?: number, size?: number }} params
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  findFlightsBetweenCountries: async (
    departureCountry,
    arrivalCountry,
    params = {}
  ) => {
    const queryParams = new URLSearchParams();
    queryParams.append("departureCountry", departureCountry);
    queryParams.append("arrivalCountry", arrivalCountry);
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    const queryString = queryParams.toString();
    const endpoint = `/flights/between-countries?${queryString}`;
    return apiHandler("get", endpoint);
  },

  /**
   * Tìm kiếm chuyến bay một chiều
   * @param {object} params - { departureAirportId, arrivalAirportId, date, status, page, size, sort }
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  searchOneWayFlights: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.departureAirportId !== undefined)
      queryParams.append("departureAirportId", params.departureAirportId);
    if (params.arrivalAirportId !== undefined)
      queryParams.append("arrivalAirportId", params.arrivalAirportId);
    if (params.date) queryParams.append("date", params.date);
    if (params.status) queryParams.append("status", params.status);
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/flights/search-oneway?${queryString}`
      : "/flights/search-oneway";
    return apiHandler("get", endpoint);
  },

  /**
   * Tìm kiếm chuyến bay khứ hồi
   * @param {object} params - { departureAirportId, arrivalAirportId, outboundDate, returnDate, status, page, size, sort }
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  searchRoundTripFlights: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.departureAirportId !== undefined)
      queryParams.append("departureAirportId", params.departureAirportId);
    if (params.arrivalAirportId !== undefined)
      queryParams.append("arrivalAirportId", params.arrivalAirportId);
    if (params.outboundDate)
      queryParams.append("outboundDate", params.outboundDate);
    if (params.returnDate) queryParams.append("returnDate", params.returnDate);
    if (params.status) queryParams.append("status", params.status);
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/flights/search-roundtrip?${queryString}`
      : "/flights/search-roundtrip";
    return apiHandler("get", endpoint);
  },

  /**
   * Tìm chuyến bay khứ hồi theo groupId
   * @param {string} groupId - ID nhóm chuyến bay khứ hồi
   * @param {{ page?: number, size?: number, sort?: string }} params
   * @returns {Promise<{ success: boolean, data?: any, message: string }>}
   */
  findRoundTripFlightsByGroupId: async (groupId, params = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append("groupId", groupId);
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.sort) queryParams.append("sort", params.sort);
    const queryString = queryParams.toString();
    const endpoint = `/flights/roundtrip-group?${queryString}`;
    return apiHandler("get", endpoint);
  },
};
