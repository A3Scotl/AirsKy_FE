import { useState, useEffect, useCallback } from "react";
import { countryService } from "@/services/country-service";

/**
 * Hook tùy chỉnh để quản lý dữ liệu quốc gia
 * @param {object} options - Tùy chọn
 * @param {boolean} options.autoFetch - Tự động fetch data khi mount
 * @param {boolean} options.onlyActive - Chỉ lấy quốc gia đang hoạt động
 * @returns {object}
 */
export const useCountry = (options = {}) => {
  const { autoFetch = true, onlyActive = false } = options;

  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch tất cả quốc gia
   */
  const fetchCountries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let data;
      if (onlyActive) {
        data = await countryService.getActiveCountries();
      } else {
        data = await countryService.getAllCountriesData();
      }
      setCountries(data);
    } catch (err) {
      setError(err.message || "Lỗi khi tải dữ liệu quốc gia");
      console.error("useCountry fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [onlyActive]);

  /**
   * Tìm kiếm quốc gia
   * @param {string} query - Từ khóa tìm kiếm
   */
  const searchCountries = useCallback(async (query) => {
    setLoading(true);
    setError(null);

    try {
      const results = await countryService.searchCountries(query);
      return results;
    } catch (err) {
      setError(err.message || "Lỗi khi tìm kiếm quốc gia");
      console.error("useCountry search error:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh dữ liệu
   */
  const refresh = useCallback(() => {
    countryService.clearCache();
    fetchCountries();
  }, [fetchCountries]);

  /**
   * Lấy quốc gia theo ID
   * @param {string|number} id - ID quốc gia
   */
  const getCountryById = useCallback(
    (id) => {
      return countries.find((country) => country.id === id);
    },
    [countries]
  );

  /**
   * Lấy quốc gia theo mã
   * @param {string} code - Mã quốc gia
   */
  const getCountryByCode = useCallback(
    (code) => {
      return countries.find(
        (country) => country.countryCode?.toLowerCase() === code?.toLowerCase()
      );
    },
    [countries]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchCountries();
    }
  }, [autoFetch, fetchCountries]);

  return {
    countries,
    loading,
    error,
    fetchCountries,
    searchCountries,
    refresh,
    getCountryById,
    getCountryByCode,
  };
};
