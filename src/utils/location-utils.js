/**
 * Utility functions để xử lý geocoding và tính khoảng cách
 */

// Cache để lưu tọa độ đã geocode
const geocodeCache = new Map();

/**
 * Geocode địa điểm thành tọa độ sử dụng OpenStreetMap Nominatim API (miễn phí)
 * @param {string} location - Tên địa điểm (city, country)
 * @returns {Promise<{lat: number, lon: number}>}
 */
export const geocodeLocation = async (location) => {
  if (!location) return null;

  // Kiểm tra cache
  const cacheKey = location.toLowerCase().trim();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    // Sử dụng Nominatim API (miễn phí, không cần API key)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        location
      )}&limit=1`,
      {
        headers: {
          "User-Agent": "AirSky-Flight-Booking",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };

      // Cache kết quả
      geocodeCache.set(cacheKey, coords);
      return coords;
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

/**
 * Tính khoảng cách giữa 2 điểm theo công thức Haversine
 * @param {number} lat1 - Latitude điểm 1
 * @param {number} lon1 - Longitude điểm 1
 * @param {number} lat2 - Latitude điểm 2
 * @param {number} lon2 - Longitude điểm 2
 * @returns {number} Khoảng cách tính bằng km
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Lấy vị trí hiện tại của user
 * @returns {Promise<{lat: number, lon: number}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.error("❌ Trình duyệt không hỗ trợ geolocation");
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        // console.log("🎯 Lấy được vị trí hiện tại:", location);
        // console.log("📊 Chi tiết position:", {
        //   latitude: position.coords.latitude,
        //   longitude: position.coords.longitude,
        //   accuracy: position.coords.accuracy,
        //   timestamp: new Date(position.timestamp).toLocaleString(),
        // });
        resolve(location);
      },
      (error) => {
        console.error("❌ Lỗi lấy vị trí:", error);
        console.error("Chi tiết lỗi:", {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.code === 1,
          POSITION_UNAVAILABLE: error.code === 2,
          TIMEOUT: error.code === 3,
        });
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000, // Cache for 10 minutes
      }
    );
  });
};

/**
 * Tìm sân bay gần nhất dựa trên vị trí hiện tại
 * @param {Array} airports - Danh sách sân bay
 * @param {number} userLat - Latitude của user
 * @param {number} userLon - Longitude của user
 * @param {number} limit - Số lượng sân bay trả về
 * @returns {Promise<Array>} Danh sách sân bay đã sắp xếp theo khoảng cách
 */
export const findNearestAirports = async (
  airports,
  userLat,
  userLon,
  limit = 10
) => {
  if (!airports || airports.length === 0) {
    return [];
  }

  const airportsWithDistance = [];

  // Xử lý theo batch để tránh overwhelm API
  const batchSize = 10;

  for (let i = 0; i < airports.length; i += batchSize) {
    const batch = airports.slice(i, i + batchSize);

    // Xử lý song song trong batch
    const batchPromises = batch.map(async (airport) => {
      try {
        // Tạo query string để geocode
        const locationQuery = `${airport.city}, ${airport.country}`;

        const airportCoords = await geocodeLocation(locationQuery);

        if (airportCoords) {
          const distance = calculateDistance(
            userLat,
            userLon,
            airportCoords.lat,
            airportCoords.lon
          );

          return {
            ...airport,
            distance: distance,
            coordinates: airportCoords,
          };
        } else {
          console.log(
            "⚠️ Utils: Không geocode được:",
            locationQuery,
            "cho sân bay",
            airport.airportCode
          );
          // Vẫn thêm airport nhưng với distance cao
          return {
            ...airport,
            distance: 9999,
          };
        }
      } catch (error) {
        console.error(
          `❌ Utils: Lỗi geocode sân bay ${airport.airportCode}:`,
          error
        );
        // Vẫn thêm airport nhưng không có distance
        return {
          ...airport,
          distance: 9999,
        };
      }
    });

    // Chờ batch hoàn thành
    const batchResults = await Promise.all(batchPromises);
    airportsWithDistance.push(...batchResults);

    // Delay ngắn giữa các batch để tránh rate limit
    if (i + batchSize < airports.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Sắp xếp theo khoảng cách và lấy top results
  const sortedAirports = airportsWithDistance
    .filter((airport) => airport.distance < 9999) // Chỉ lấy những sân bay có khoảng cách hợp lệ
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  sortedAirports.forEach((airport, index) => {
    console.log(
      `  ${index + 1}. ${airport.airportCode} - ${airport.city}: ${
        airport.distance
      }km`
    );
  });

  return sortedAirports;
};

/**
 * Clear geocoding cache
 */
export const clearGeocodeCache = () => {
  geocodeCache.clear();
};
