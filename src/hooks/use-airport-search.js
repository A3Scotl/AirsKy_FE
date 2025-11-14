import { useState, useEffect, useCallback } from "react";
import { serviceImplAirport } from "@/services/airport-service.js";

/**
 * Custom hook để quản lý tìm kiếm sân bay
 */
export const useAirportSearch = (options = {}) => {
  const [searchResults, setSearchResults] = useState([]);
  const [allAirports, setAllAirports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    debounceMs = 300,
    minSearchLength = 2,
    maxResults = 10,
    country = null,
    includeAll = true,
  } = options;

  // Load limited airports for initial display (only 10 airports)
  useEffect(() => {
    if (includeAll) {
      const loadInitialAirports = async () => {
        try {
          const airports = await serviceImplAirport.getAllAirports({
            country: country,
            limit: 10, // Chỉ hiển thị 10 sân bay đầu tiên
          });
          setAllAirports(airports);
        } catch (err) {
          console.error("Failed to load airports:", err);
          setError(err);
        }
      };

      loadInitialAirports();
    }
  }, [country, includeAll]);

  // Search function với debounce - tìm kiếm toàn bộ database
  const searchAirports = useCallback(
    async (query) => {
      if (!query || query.length < minSearchLength) {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Khi tìm kiếm, lấy nhiều kết quả hơn từ toàn bộ database
        const results = await serviceImplAirport.searchAirports(query, {
          limit: maxResults,
          country,
        });

        setSearchResults(results);
      } catch (err) {
        console.error("Airport search error:", err);
        setError(err);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [minSearchLength, maxResults, country]
  );

  // Debounced search
  const debouncedSearch = useCallback(
    (query) => {
      const timeoutId = setTimeout(() => {
        searchAirports(query);
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    },
    [searchAirports, debounceMs]
  );

  // Validate airport code
  const validateAirportCode = useCallback(async (code) => {
    try {
      return await serviceImplAirport.validateAirportCode(code);
    } catch (err) {
      console.error("Validate airport code error:", err);
      return false;
    }
  }, []);

  // Get nearby airports (sử dụng geocoding để tìm sân bay gần)
  const getNearbyAirports = useCallback(
    async (latitude, longitude, radius = 100) => {
      try {

        setIsLoading(true);

        let results;
        if (latitude && longitude) {
          // Nếu có tọa độ cụ thể

          results = await serviceImplAirport.getNearbyAirports(
            latitude,
            longitude,
            {
              country: country,
              limit: maxResults,
            }
          );
        } else {
          // Auto-detect vị trí hiện tại

          results =
            await serviceImplAirport.getNearbyAirportsFromCurrentLocation({
              country: country,
              limit: maxResults,
            });
        }

        // Lọc trong vòng 1000km theo yêu cầu của user
        const filteredResults = results.filter((airport) => {
          if (!airport.distance && airport.distance !== 0) return true; // Giữ lại nếu không có thông tin khoảng cách
          const distanceNum =
            typeof airport.distance === "number"
              ? airport.distance
              : parseFloat(airport.distance);
          return distanceNum <= 1000;
        });

        filteredResults.forEach((airport) => {

        });

        setSearchResults(filteredResults);
        return filteredResults;
      } catch (err) {
        console.error("❌ Hook: Lỗi nearby airports:", err);
        setError(err);

        // Fallback: trả về sân bay mặc định

        const fallbackResults = await serviceImplAirport.getAllAirports({
          country: country || "Vietnam",
          limit: maxResults,
        });

        setSearchResults(fallbackResults);
        return fallbackResults;
      } finally {
        setIsLoading(false);

      }
    },
    [maxResults, country]
  );

  // Clear search results
  const clearResults = useCallback(() => {
    setSearchResults([]);
    setError(null);
  }, []);

  // Get countries (extract từ airports data)
  const getCountries = useCallback(async () => {
    try {
      const airports = await serviceImplAirport.getAllAirportsData();
      const countries = [
        ...new Set(airports.map((airport) => airport.country)),
      ].filter(Boolean);
      return countries;
    } catch (err) {
      console.error("Get countries error:", err);
      setError(err);
      return [];
    }
  }, []);

  return {
    searchResults,
    allAirports,
    // Backward compatibility
    popularAirports: allAirports,
    isLoading,
    error,
    searchAirports: debouncedSearch,
    validateAirportCode,
    getNearbyAirports,
    clearResults,
    getCountries,
  };
};
