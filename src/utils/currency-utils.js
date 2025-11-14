/**
 * Utility functions cho xử lý tiền tệ và định dạng Việt Nam
 */

/**
 * Format số tiền thành VND
 * @param {number} amount - Số tiền cần format
 * @param {boolean} showSymbol - Có hiển thị ký hiệu VND hay không
 * @returns {string} - Chuỗi tiền tệ đã format
 */
export const formatCurrencyVND = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? "0 VND" : "0";
  }

  try {
    const formatted = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

    return showSymbol ? formatted : formatted.replace("₫", "").trim();
  } catch (error) {
    console.warn("Failed to format VND currency:", amount, error);
    return showSymbol
      ? `${amount.toLocaleString("vi-VN")} VND`
      : amount.toLocaleString("vi-VN");
  }
};

/**
 * Format số tiền thành USD (cho các giá trị quốc tế)
 * @param {number} amount - Số tiền cần format
 * @param {boolean} showSymbol - Có hiển thị ký hiệu USD hay không
 * @returns {string} - Chuỗi tiền tệ đã format
 */
export const formatCurrencyUSD = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? "$0" : "0";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  } catch (error) {
    console.warn("Failed to format USD currency:", amount, error);
    return showSymbol
      ? `$${amount.toLocaleString("en-US")}`
      : amount.toLocaleString("en-US");
  }
};

/**
 * Chuyển đổi từ USD sang VND (tỷ giá ước tính)
 * @param {number} usdAmount - Số tiền USD
 * @param {number} exchangeRate - Tỷ giá (mặc định 23,000 VND/USD)
 * @returns {number} - Số tiền VND
 */
export const convertUSDtoVND = (usdAmount, exchangeRate = 23000) => {
  if (usdAmount === null || usdAmount === undefined || isNaN(usdAmount)) {
    return 0;
  }
  return Math.round(usdAmount * exchangeRate);
};

/**
 * Chuyển đổi từ VND sang USD
 * @param {number} vndAmount - Số tiền VND
 * @param {number} exchangeRate - Tỷ giá (mặc định 23,000 VND/USD)
 * @returns {number} - Số tiền USD
 */
export const convertVNDtoUSD = (vndAmount, exchangeRate = 23000) => {
  if (vndAmount === null || vndAmount === undefined || isNaN(vndAmount)) {
    return 0;
  }
  return Math.round((vndAmount / exchangeRate) * 100) / 100; // Làm tròn 2 chữ số thập phân
};

/**
 * Format ngày tháng theo định dạng Việt Nam
 * @param {Date|string} date - Ngày cần format
 * @param {string} format - Định dạng (short, medium, long, full)
 * @returns {string} - Chuỗi ngày tháng đã format
 */
export const formatDateVN = (date, format = "medium") => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) return "N/A";

    const options = {
      short: {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      },
      medium: {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      },
      long: {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
      full: {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    };

    return dateObj.toLocaleDateString(
      "vi-VN",
      options[format] || options.medium
    );
  } catch (error) {
    console.warn("Failed to format Vietnamese date:", date, error);
    return "N/A";
  }
};

/**
 * Format thời gian theo định dạng Việt Nam
 * @param {Date|string} date - Thời gian cần format
 * @param {boolean} showSeconds - Có hiển thị giây hay không
 * @returns {string} - Chuỗi thời gian đã format
 */
export const formatTimeVN = (date, showSeconds = false) => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) return "N/A";

    return dateObj.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: showSeconds ? "2-digit" : undefined,
    });
  } catch (error) {
    console.warn("Failed to format Vietnamese time:", date, error);
    return "N/A";
  }
};

/**
 * Format ngày giờ đầy đủ theo Việt Nam
 * @param {Date|string} date - Ngày giờ cần format
 * @returns {string} - Chuỗi ngày giờ đã format
 */
export const formatDateTimeVN = (date) => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) return "N/A";

    return dateObj.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.warn("Failed to format Vietnamese datetime:", date, error);
    return "N/A";
  }
};

/**
 * Tính tuổi từ ngày sinh
 * @param {Date|string} birthDate - Ngày sinh
 * @returns {number} - Tuổi
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return 0;

  try {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  } catch (error) {
    console.warn("Failed to calculate age:", birthDate, error);
    return 0;
  }
};

/**
 * Format số với dấu phân cách Việt Nam
 * @param {number} number - Số cần format
 * @returns {string} - Chuỗi số đã format
 */
export const formatNumberVN = (number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return "0";
  }

  try {
    return new Intl.NumberFormat("vi-VN").format(number);
  } catch (error) {
    console.warn("Failed to format Vietnamese number:", number, error);
    return number.toLocaleString("vi-VN");
  }
};

/**
 * Tính phần trăm
 * @param {number} value - Giá trị
 * @param {number} total - Tổng
 * @param {number} decimals - Số chữ số thập phân
 * @returns {string} - Chuỗi phần trăm
 */
export const formatPercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return "0%";

  try {
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
  } catch (error) {
    console.warn("Failed to format percentage:", value, total, error);
    return "0%";
  }
};
