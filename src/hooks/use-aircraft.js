import { useState, useEffect, useCallback } from "react";
import { aircraftApi } from "@/apis/aircraft-api";

/**
 * Hook tùy chỉnh để quản lý dữ liệu máy bay
 * @param {object} options - Tùy chọn
 * @param {boolean} options.autoFetch - Tự động fetch data khi mount
 * @returns {object}
 */
export const useAircraft = (options = {}) => {
  const { autoFetch = true } = options;

  const [aircrafts, setAircrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch tất cả máy bay
   */
  const fetchAircrafts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await aircraftApi.getAllAircrafts({
        size: 1000,
        page: 0,
      });

      if (response.success && response.data) {
        // Handle cả trường hợp data là array hoặc có pagination
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.content || response.data.data || [];
        setAircrafts(data);
      }
    } catch (err) {
      setError(err.message || "Lỗi khi tải dữ liệu máy bay");
      console.error("useAircraft fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tìm kiếm máy bay
   * @param {string} query - Từ khóa tìm kiếm
   */
  const searchAircrafts = useCallback(
    async (query) => {
      setLoading(true);
      setError(null);

      try {
        // Implement search logic here if API supports it
        // For now, filter locally
        const filtered = aircrafts.filter(
          (aircraft) =>
            aircraft.aircraftName.toLowerCase().includes(query.toLowerCase()) ||
            aircraft.aircraftCode.toLowerCase().includes(query.toLowerCase())
        );
        return filtered;
      } catch (err) {
        setError(err.message || "Lỗi khi tìm kiếm máy bay");
        console.error("useAircraft search error:", err);
      } finally {
        setLoading(false);
      }
    },
    [aircrafts]
  );

  // Auto fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchAircrafts();
    }
  }, [autoFetch, fetchAircrafts]);

  return {
    aircrafts,
    loading,
    error,
    fetchAircrafts,
    searchAircrafts,
  };
};
