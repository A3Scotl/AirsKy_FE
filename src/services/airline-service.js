import { airlineApi } from "@/apis/airline-api";

/**
 * Service xử lý logic liên quan đến hãng hàng không
 */
class AirlineService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 phút
    this.allAirlines = []; // Cache tất cả hãng bay
    this.lastFetchTime = 0; // Reset để force fetch lại
  }

  /**
   * Lấy tất cả hãng hàng không từ API (với cache)
   * @returns {Promise<Array>}
   */
  async getAllAirlinesData() {
    const now = Date.now();

    try {
      const response = await airlineApi.getAllAirlines({
        size: 1000,
        page: 0,
      });

      if (response.success && response.data) {
        // Handle cả trường hợp data là array hoặc có pagination
        const airlines = Array.isArray(response.data)
          ? response.data
          : response.data.content || response.data.data || [];

        this.allAirlines = airlines.map((airline) =>
          this.formatAirlineForUI(airline)
        );
        this.lastFetchTime = now;

        return this.allAirlines;
      }
    } catch (error) {
      console.error("Failed to fetch all airlines:", error);
    }

    return this.allAirlines; // Trả về cache cũ nếu có lỗi
  }

  /**
   * Tìm kiếm hãng hàng không với logic frontend
   * @param {string} query - Từ khóa tìm kiếm
   * @param {object} options - Tùy chọn tìm kiếm
   * @returns {Promise<Array>}
   */
  async searchAirlines(query, options = {}) {
    if (!query || query.length < 2) return [];

    const cacheKey = `search_${query.toLowerCase()}_${JSON.stringify(options)}`;

    // Kiểm tra cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Lấy tất cả hãng bay
      const allAirlines = await this.getAllAirlinesData();

      // Filter theo query
      const searchTerm = query.toLowerCase();
      let filteredAirlines = allAirlines.filter(
        (airline) =>
          airline.airlineCode?.toLowerCase().includes(searchTerm) ||
          airline.airlineName?.toLowerCase().includes(searchTerm) ||
          airline.contact?.toLowerCase().includes(searchTerm)
      );

      // Limit kết quả
      const limitedResults = filteredAirlines.slice(0, options.limit || 10);

      // Cache kết quả
      this.cache.set(cacheKey, {
        data: limitedResults,
        timestamp: Date.now(),
      });

      return limitedResults;
    } catch (error) {
      console.error("Airline search error:", error);
      return [];
    }
  }

  /**
   * Lấy tất cả hãng hàng không đang hoạt động
   * @param {object} options - Tùy chọn
   * @returns {Promise<Array>}
   */
  async getActiveAirlines(options = {}) {
    const cacheKey = `active_airlines_${JSON.stringify(options)}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const allAirlines = await this.getAllAirlinesData();

      let filteredAirlines = allAirlines.filter(
        (airline) => airline.active === true
      );

      // Limit kết quả
      const limitedResults = filteredAirlines.slice(0, options.limit || 100);

      this.cache.set(cacheKey, {
        data: limitedResults,
        timestamp: Date.now(),
      });

      return limitedResults;
    } catch (error) {
      console.error("Get active airlines error:", error);
      return [];
    }
  }

  /**
   * Format dữ liệu hãng hàng không cho UI
   * @param {object} airline - Dữ liệu hãng hàng không từ API
   * @returns {object}
   */
  formatAirlineForUI(airline) {
    // Đổ trực tiếp dữ liệu từ database, không mapping
    return {
      airlineId: airline.airlineId,
      airlineCode:
        airline.airlineCode ||
        airline.code ||
        airline.iataCode ||
        airline.icaoCode,
      airlineName: airline.airlineName || airline.name || airline.airline,
      contact: airline.contact || "",
      active: airline.active !== false,
      thumbnail: airline.thumbnail || "",
      createdAt: airline.createdAt,
      updatedAt: airline.updatedAt,
    };
  }

  /**
   * Xóa cache
   */
  clearCache() {
    this.cache.clear();
    this.allAirlines = [];
    this.lastFetchTime = 0;
  }
}

// Export singleton instance
export const airlineService = new AirlineService();
