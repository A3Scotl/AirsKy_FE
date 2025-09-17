/**
 * Utility functions để xử lý date/time parsing, đặc biệt cho định dạng tiếng Việt
 */

/**
 * Parse thời gian từ chuỗi có định dạng tiếng Việt
 * @param {string} timeString - Chuỗi thời gian (có thể có định dạng tiếng Việt)
 * @returns {Date|null} - Date object hoặc null nếu không parse được
 */
export const parseVietnameseTime = (timeString) => {
  if (!timeString) return null;

  try {
    // Nếu là ISO string hoặc format chuẩn, thử parse trực tiếp
    const directParse = new Date(timeString);
    if (!isNaN(directParse.getTime())) {
      return directParse;
    }

    // Xử lý định dạng tiếng Việt: "06:00 - Thứ Hai, 15 tháng 9, 2025"
    const vietnameseTimeRegex =
      /^(\d{1,2}):(\d{2})\s*-\s*.+,\s*(\d{1,2})\s*tháng\s*(\d{1,2}),\s*(\d{4})$/;
    const match = timeString.match(vietnameseTimeRegex);

    if (match) {
      const [, hours, minutes, day, month, year] = match;
      // JavaScript Date month bắt đầu từ 0
      return new Date(year, month - 1, day, hours, minutes);
    }

    // Thử parse định dạng HH:mm
    const timeOnlyRegex = /^(\d{1,2}):(\d{2})$/;
    const timeMatch = timeString.match(timeOnlyRegex);
    if (timeMatch) {
      const [, hours, minutes] = timeMatch;
      const now = new Date();
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes
      );
    }

    return null;
  } catch (error) {
    console.warn("Failed to parse Vietnamese time:", timeString, error);
    return null;
  }
};

/**
 * Format thời gian thành chuỗi HH:mm
 * @param {Date|string} date - Date object hoặc string có thể parse
 * @returns {string} - Chuỗi thời gian HH:mm hoặc "N/A"
 */
export const formatTimeHHMM = (date) => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? parseVietnameseTime(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) return "N/A";

    return dateObj.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.warn("Failed to format time:", date, error);
    return "N/A";
  }
};

/**
 * Lấy thời gian từ nhiều nguồn khác nhau với fallback
 * @param {Object} leg - Leg object chứa thông tin flight
 * @returns {string|null} - Thời gian hoặc null
 */
export const extractDepartureTime = (leg) => {
  if (!leg) return null;

  // Thử lấy từ nhiều nguồn khác nhau theo thứ tự ưu tiên
  const timeSources = [
    leg.flight?.departureTime,
    leg?.departureTime,
    leg.dep?.time,
    leg.flight?.departure?.time,
    leg.departure?.time,
  ];

  for (const timeSource of timeSources) {
    if (timeSource) {
      const parsed = parseVietnameseTime(timeSource);
      if (parsed) {
        return timeSource; // Trả về string gốc để format sau
      }
    }
  }

  return null;
};

/**
 * Lấy thời gian đến từ nhiều nguồn khác nhau với fallback
 * @param {Object} leg - Leg object chứa thông tin flight
 * @returns {string|null} - Thời gian hoặc null
 */
export const extractArrivalTime = (leg) => {
  if (!leg) return null;

  // Thử lấy từ nhiều nguồn khác nhau theo thứ tự ưu tiên
  const timeSources = [
    leg.flight?.arrivalTime,
    leg?.arrivalTime,
    leg.arr?.time,
    leg.flight?.arrival?.time,
    leg.arrival?.time,
  ];

  for (const timeSource of timeSources) {
    if (timeSource) {
      const parsed = parseVietnameseTime(timeSource);
      if (parsed) {
        return timeSource; // Trả về string gốc để format sau
      }
    }
  }

  return null;
};
