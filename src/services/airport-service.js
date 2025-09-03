import { airportApi } from "@/apis/airport-api";
import {
  findNearestAirports,
  getCurrentLocation,
} from "@/utils/location-utils";

/**
 * Service xử lý logic liên quan đến sân bay
 */
class AirportService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 phút
    this.allAirports = []; // Cache tất cả sân bay
    this.lastFetchTime = 0; // Reset để force fetch lại
  }

  /**
   * Lấy tất cả sân bay từ API (với cache)
   * @returns {Promise<Array>}
   */
  async getAllAirportsData() {
    const now = Date.now();

    try {
      // Thử lấy với size lớn hơn
      const response = await airportApi.getAllAirports({
        size: 5000, // Tăng size để đảm bảo lấy hết
        page: 0,
      });

      if (response.success && response.data) {
        // Handle cả trường hợp data là array hoặc có pagination
        const airports = Array.isArray(response.data)
          ? response.data
          : response.data.content || response.data.data || [];

        this.allAirports = airports.map((airport) =>
          this.formatAirportForUI(airport)
        );
        this.lastFetchTime = now;

        return this.allAirports;
      }
    } catch (error) {
      console.error("Failed to fetch all airports:", error);
    }

    return this.allAirports; // Trả về cache cũ nếu có lỗi
  }

  /**
   * Tìm kiếm sân bay với logic frontend
   * @param {string} query - Từ khóa tìm kiếm
   * @param {object} options - Tùy chọn tìm kiếm
   * @returns {Promise<Array>}
   */
  async searchAirports(query, options = {}) {
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
      // Lấy tất cả sân bay
      const allAirports = await this.getAllAirportsData();

      // Filter theo query
      const searchTerm = query.toLowerCase();
      let filteredAirports = allAirports.filter(
        (airport) =>
          airport.city?.toLowerCase().includes(searchTerm) ||
          airport.airportCode?.toLowerCase().includes(searchTerm) ||
          airport.code?.toLowerCase().includes(searchTerm) ||
          airport.airportName?.toLowerCase().includes(searchTerm) ||
          airport.airport?.toLowerCase().includes(searchTerm) ||
          airport.country?.toLowerCase().includes(searchTerm)
      );

      // Filter theo country nếu có
      if (options.country) {
        filteredAirports = filteredAirports.filter((airport) =>
          airport.country?.toLowerCase().includes(options.country.toLowerCase())
        );
      }

      // Limit kết quả
      const limitedResults = filteredAirports.slice(0, options.limit || 10);

      // Cache kết quả
      this.cache.set(cacheKey, {
        data: limitedResults,
        timestamp: Date.now(),
      });

      return limitedResults;
    } catch (error) {
      console.error("Airport search error:", error);
      return [];
    }
  }

  /**
   * Lấy tất cả sân bay từ database
   * @param {object} options - Tùy chọn
   * @returns {Promise<Array>}
   */
  async getAllAirports(options = {}) {
    const cacheKey = `all_airports_${JSON.stringify(options)}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const allAirports = await this.getAllAirportsData();

      let filteredAirports = allAirports;

      // Lọc theo quốc gia nếu có
      if (options.country) {
        filteredAirports = allAirports.filter((airport) =>
          airport.country?.toLowerCase().includes(options.country.toLowerCase())
        );
      }

      // Lọc chỉ lấy sân bay active
      filteredAirports = filteredAirports.filter(
        (airport) => airport.active === true
      );

      // Limit kết quả
      const limitedResults = filteredAirports.slice(0, options.limit || 100);

      this.cache.set(cacheKey, {
        data: limitedResults,
        timestamp: Date.now(),
      });

      return limitedResults;
    } catch (error) {
      console.error("Get all airports error:", error);
      return [];
    }
  }

  /**
   * Backward compatibility - alias for getAllAirports
   * @deprecated Use getAllAirports instead
   */
  async getPopularAirports(options = {}) {
    return this.getAllAirports(options);
  }

  /**
   * Tìm sân bay gần vị trí hiện tại
   * @param {number} latitude - Vĩ độ của user
   * @param {number} longitude - Kinh độ của user
   * @param {object} options - Tùy chọn
   * @returns {Promise<Array>} Danh sách sân bay gần nhất
   */
  async getNearbyAirports(latitude, longitude, options = {}) {
    const cacheKey = `nearby_${latitude}_${longitude}_${JSON.stringify(
      options
    )}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log("Service: Dùng cache cho nearby airports");
        return cached.data;
      }
    }

    try {
      const allAirports = await this.getAllAirportsData();

      // Lọc theo country nếu có
      let filteredAirports = allAirports;
      if (options.country) {
        filteredAirports = allAirports.filter((airport) =>
          airport.country?.toLowerCase().includes(options.country.toLowerCase())
        );
        console.log(
          `Service: Lọc theo country '${options.country}': ${filteredAirports.length} sân bay`
        );
      }

      const nearbyAirports = await findNearestAirports(
        filteredAirports,
        latitude,
        longitude,
        options.limit || 10
      );

      nearbyAirports.forEach((airport, index) => {
        console.log(
          `  ${index + 1}. ${airport.airportCode} - ${airport.distance}km`
        );
      });

      // Cache kết quả
      this.cache.set(cacheKey, {
        data: nearbyAirports,
        timestamp: Date.now(),
      });

      return nearbyAirports;
    } catch (error) {
      console.error("❌ Service: Lỗi tìm sân bay gần:", error);
      return [];
    }
  }

  /**
   * Tìm sân bay gần vị trí hiện tại của user (auto-detect location)
   * @param {object} options - Tùy chọn
   * @returns {Promise<Array>} Danh sách sân bay gần nhất
   */
  async getNearbyAirportsFromCurrentLocation(options = {}) {
    try {
      const userLocation = await getCurrentLocation();

      const nearbyAirports = await this.getNearbyAirports(
        userLocation.lat,
        userLocation.lon,
        options
      );

      return nearbyAirports;
    } catch (error) {
      console.error("❌ Lỗi lấy vị trí hiện tại:", error);
      console.log("🔄 Fallback: trả về sân bay Việt Nam");
      // Fallback: trả về sân bay Việt Nam
      return this.getAllAirports({ country: "Vietnam", limit: 10 });
    }
  }

  /**
   * Format dữ liệu sân bay cho UI
   * @param {object} airport - Dữ liệu sân bay từ API
   * @returns {object}
   */
  formatAirportForUI(airport) {
    // Đổ trực tiếp dữ liệu từ database, không mapping
    return {
      airportId: airport.airportId,
      airportCode:
        airport.airportCode ||
        airport.code ||
        airport.iataCode ||
        airport.icaoCode,
      airportName: airport.airportName || airport.name || airport.airport,
      city:
        airport.city ||
        airport.cityNames ||
        airport.cityName ||
        airport.airportName ||
        "Unknown",
      cityName:
        airport.cityNames || airport.cityName || airport.city || "Unknown", // Thêm trường cityName
      cityNames:
        airport.cityNames || airport.cityName || airport.city || "Unknown", // Thêm trường cityNames
      country: airport.country || airport.countryName || "Unknown",
      thumbnail: airport.thumbnail || "", // Thêm thumbnail
      // Giữ tương thích với format cũ
      code:
        airport.airportCode ||
        airport.code ||
        airport.iataCode ||
        airport.icaoCode,
      airport: airport.airportName || airport.name,
      gates: airport.gates || [],
      active: airport.active !== false,
      latitude: airport.latitude,
      longitude: airport.longitude,
      timezone: airport.timezone,
      popular: airport.popular || false,
      createdAt: airport.createdAt,
      updatedAt: airport.updatedAt,
    };
  }

  /**
   * Kết hợp tìm kiếm local và API (hiện tại chỉ dùng API data)
   * @param {string} query - Từ khóa
   * @param {Array} localData - Dữ liệu local (fallback)
   * @param {object} options - Tùy chọn
   * @returns {Promise<Array>}
   */
  async combineSearchResults(query, localData = [], options = {}) {
    try {
      // Ưu tiên dữ liệu từ API
      const apiResults = await this.searchAirports(query, options);

      if (apiResults.length > 0) {
        return apiResults;
      }

      // Fallback to local data nếu API không có kết quả
      return this.searchLocalData(query, localData, options.limit || 10);
    } catch (error) {
      console.error("Combined search error:", error);
      // Fallback to local search
      return this.searchLocalData(query, localData, options.limit || 10);
    }
  }

  /**
   * Tìm kiếm trong dữ liệu local (fallback)
   * @param {string} query - Từ khóa
   * @param {Array} data - Dữ liệu local
   * @param {number} limit - Giới hạn kết quả
   * @returns {Array}
   */
  searchLocalData(query, data, limit = 10) {
    if (!query || !Array.isArray(data)) return [];

    const searchTerm = query.toLowerCase();

    return data
      .filter(
        (item) =>
          item.city?.toLowerCase().includes(searchTerm) ||
          item.airportCode?.toLowerCase().includes(searchTerm) ||
          item.code?.toLowerCase().includes(searchTerm) ||
          item.airportName?.toLowerCase().includes(searchTerm) ||
          item.airport?.toLowerCase().includes(searchTerm) ||
          item.country?.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit);
  }

  /**
   * Xóa cache
   */
  clearCache() {
    this.cache.clear();
    this.allAirports = [];
    this.lastFetchTime = 0;
  }
}

// Export singleton instance
export const airportService = new AirportService();
