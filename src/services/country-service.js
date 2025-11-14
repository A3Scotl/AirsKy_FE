import { countryApi } from "@/apis/country-api";

/**
 * Service xử lý logic liên quan đến quốc gia
 */
class CountryService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 phút
    this.allCountries = []; // Cache tất cả quốc gia
    this.lastFetchTime = 0;
  }

  /**
   * Lấy tất cả quốc gia từ API (với cache)
   * @returns {Promise<Array>}
   */
  async getAllCountriesData() {
    const now = Date.now();
    const cacheKey = "all_countries";

    // Kiểm tra cache
    if (
      this.allCountries.length > 0 &&
      now - this.lastFetchTime < this.cacheTimeout
    ) {
      return this.allCountries;
    }

    try {
      // Thử lấy với size lớn để đảm bảo lấy hết
      const response = await countryApi.getAllCountries({
        size: 1000,
        page: 0,
      });

      if (response.success && response.data) {
        // Handle cả trường hợp data là array hoặc có pagination
        const countries = Array.isArray(response.data)
          ? response.data
          : response.data.content || response.data.data || [];

        this.allCountries = countries.map((country) =>
          this.formatCountryForUI(country)
        );
        this.lastFetchTime = now;

        return this.allCountries;
      } else {
        console.warn("Failed to fetch countries:", response.message);
        return this.allCountries; // Trả về cache cũ nếu có
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
      return this.allCountries; // Trả về cache cũ nếu có
    }
  }

  /**
   * Lấy quốc gia theo ID (với cache)
   * @param {number} id - ID quốc gia
   * @returns {Promise<Object|null>}
   */
  async getCountryById(id) {
    const cacheKey = `country_${id}`;
    const now = Date.now();

    // Kiểm tra cache
    const cached = this.cache.get(cacheKey);
    if (cached && now - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await countryApi.getCountryById(id);
      if (response.success && response.data) {
        const formattedCountry = this.formatCountryForUI(response.data);
        this.cache.set(cacheKey, {
          data: formattedCountry,
          timestamp: now,
        });
        return formattedCountry;
      }
    } catch (error) {
      console.error(`Error fetching country ${id}:`, error);
    }
    return null;
  }

  /**
   * Lấy quốc gia theo mã quốc gia (với cache)
   * @param {string} countryCode - Mã quốc gia
   * @returns {Promise<Object|null>}
   */
  async getCountryByCode(countryCode) {
    const cacheKey = `country_code_${countryCode}`;
    const now = Date.now();

    // Kiểm tra cache
    const cached = this.cache.get(cacheKey);
    if (cached && now - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await countryApi.getCountryByCode(countryCode);
      if (response.success && response.data) {
        const formattedCountry = this.formatCountryForUI(response.data);
        this.cache.set(cacheKey, {
          data: formattedCountry,
          timestamp: now,
        });
        return formattedCountry;
      }
    } catch (error) {
      console.error(`Error fetching country by code ${countryCode}:`, error);
    }
    return null;
  }

  /**
   * Lấy quốc gia theo tên (với cache)
   * @param {string} countryName - Tên quốc gia
   * @returns {Promise<Object|null>}
   */
  async getCountryByName(countryName) {
    const cacheKey = `country_name_${countryName}`;
    const now = Date.now();

    // Kiểm tra cache
    const cached = this.cache.get(cacheKey);
    if (cached && now - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await countryApi.getCountryByName(countryName);
      if (response.success && response.data) {
        const formattedCountry = this.formatCountryForUI(response.data);
        this.cache.set(cacheKey, {
          data: formattedCountry,
          timestamp: now,
        });
        return formattedCountry;
      }
    } catch (error) {
      console.error(`Error fetching country by name ${countryName}:`, error);
    }
    return null;
  }

  /**
   * Tìm kiếm quốc gia theo từ khóa
   * @param {string} query - Từ khóa tìm kiếm
   * @returns {Promise<Array>}
   */
  async searchCountries(query) {
    if (!query || query.trim().length === 0) {
      return this.allCountries;
    }

    const allCountries = await this.getAllCountriesData();
    const searchTerm = query.toLowerCase().trim();

    return allCountries.filter(
      (country) =>
        country.countryName.toLowerCase().includes(searchTerm) ||
        country.countryCode.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Tạo quốc gia mới với hình ảnh
   * @param {Object} countryData - Dữ liệu quốc gia
   * @returns {Promise<Object|null>}
   */
  async createCountry(countryData) {
    try {
      const response = await countryApi.createCountryWithImage(countryData);
      if (response.success && response.data) {
        // Clear cache để fetch lại data mới
        this.clearCache();
        return this.formatCountryForUI(response.data);
      }
    } catch (error) {
      console.error("Error creating country:", error);
      throw error;
    }
    return null;
  }

  /**
   * Cập nhật quốc gia với hình ảnh
   * @param {number} id - ID quốc gia
   * @param {Object} countryData - Dữ liệu quốc gia
   * @returns {Promise<Object|null>}
   */
  async updateCountry(id, countryData) {
    try {
      const response = await countryApi.updateCountryWithImage(id, countryData);
      if (response.success && response.data) {
        // Clear cache để fetch lại data mới
        this.clearCache();
        return this.formatCountryForUI(response.data);
      }
    } catch (error) {
      console.error(`Error updating country ${id}:`, error);
      throw error;
    }
    return null;
  }

  /**
   * Xóa quốc gia
   * @param {number} id - ID quốc gia
   * @returns {Promise<boolean>}
   */
  async deleteCountry(id) {
    try {
      const response = await countryApi.deleteCountry(id);
      if (response.success) {
        // Clear cache để fetch lại data mới
        this.clearCache();
        return true;
      }
    } catch (error) {
      console.error(`Error deleting country ${id}:`, error);
      throw error;
    }
    return false;
  }

  /**
   * Format dữ liệu quốc gia cho UI
   * @param {Object} country - Dữ liệu quốc gia từ API
   * @returns {Object}
   */
  formatCountryForUI(country) {
    return {
      id: country.countryId,
      countryCode: country.countryCode,
      countryName: country.countryName,
      thumbnail: country.thumbnail,
      active: country.active,
      createdAt: country.createdAt,
      updatedAt: country.updatedAt,
      // Thêm các trường hiển thị
      displayName: `${country.countryName} (${country.countryCode})`,
    };
  }

  /**
   * Clear toàn bộ cache
   */
  clearCache() {
    this.cache.clear();
    this.allCountries = [];
    this.lastFetchTime = 0;
  }

  /**
   * Lấy danh sách quốc gia đang active
   * @returns {Promise<Array>}
   */
  async getActiveCountries() {
    const allCountries = await this.getAllCountriesData();
    return allCountries.filter((country) => country.active);
  }

  /**
   * Lấy map của quốc gia theo ID để tra cứu nhanh
   * @returns {Promise<Map>}
   */
  async getCountriesMap() {
    const countries = await this.getAllCountriesData();
    const countriesMap = new Map();
    countries.forEach((country) => {
      countriesMap.set(country.id, country);
    });
    return countriesMap;
  }
}

// Export singleton instance
export const countryService = new CountryService();
