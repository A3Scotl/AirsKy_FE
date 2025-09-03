import { useState, useEffect, useCallback } from "react";
import { airlineService } from "@/services/airline-service";

/**
 * Hook tùy chỉnh để quản lý dữ liệu hãng hàng không
 * @param {object} options - Tùy chọn
 * @param {boolean} options.autoFetch - Tự động fetch data khi mount
 * @param {boolean} options.onlyActive - Chỉ lấy hãng bay đang hoạt động
 * @returns {object}
 */
export const useAirline = (options = {}) => {
  const { autoFetch = true, onlyActive = false } = options;

  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch tất cả hãng hàng không
   */
  const fetchAirlines = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let data;
      if (onlyActive) {
        data = await airlineService.getActiveAirlines();
      } else {
        data = await airlineService.getAllAirlinesData();
      }
      setAirlines(data);
    } catch (err) {
      setError(err.message || "Lỗi khi tải dữ liệu hãng bay");
      console.error("useAirline fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [onlyActive]);

  /**
   * Tìm kiếm hãng hàng không
   * @param {string} query - Từ khóa tìm kiếm
   * @param {object} searchOptions - Tùy chọn tìm kiếm
   */
  const searchAirlines = useCallback(async (query, searchOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const results = await airlineService.searchAirlines(query, searchOptions);
      return results;
    } catch (err) {
      setError(err.message || "Lỗi khi tìm kiếm hãng bay");
      console.error("useAirline search error:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh dữ liệu
   */
  const refresh = useCallback(() => {
    airlineService.clearCache();
    fetchAirlines();
  }, [fetchAirlines]);

  /**
   * Lấy hãng bay theo ID
   * @param {string|number} id - ID hãng bay
   */
  const getAirlineById = useCallback(
    (id) => {
      return airlines.find((airline) => airline.airlineId === id);
    },
    [airlines]
  );

  /**
   * Lấy hãng bay theo mã
   * @param {string} code - Mã hãng bay
   */
  const getAirlineByCode = useCallback(
    (code) => {
      return airlines.find(
        (airline) => airline.airlineCode?.toLowerCase() === code?.toLowerCase()
      );
    },
    [airlines]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchAirlines();
    }
  }, [autoFetch, fetchAirlines]);

  return {
    airlines,
    loading,
    error,
    fetchAirlines,
    searchAirlines,
    refresh,
    getAirlineById,
    getAirlineByCode,
  };
};
