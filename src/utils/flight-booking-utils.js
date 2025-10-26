/**
 * Utility functions cho nghiệp vụ đặt vé máy bay Việt Nam
 */

/**
 * Các loại ghế trên máy bay
 */
export const SEAT_CLASSES = {
  ECONOMY: "economy",
  PREMIUM_ECONOMY: "premium_economy",
  BUSINESS: "business",
  FIRST: "first",
};

/**
 * Tên hiển thị của các loại ghế
 */
export const SEAT_CLASS_NAMES = {
  [SEAT_CLASSES.ECONOMY]: "Phổ thông",
  [SEAT_CLASSES.PREMIUM_ECONOMY]: "Phổ thông đặc biệt",
  [SEAT_CLASSES.BUSINESS]: "Thương gia",
  [SEAT_CLASSES.FIRST]: "Hạng nhất",
};

/**
 * Các loại hành khách
 */
export const PASSENGER_TYPES = {
  ADULT: "adult",
  CHILD: "child",
  INFANT: "infant",
};

/**
 * Tên hiển thị của các loại hành khách
 */
export const PASSENGER_TYPE_NAMES = {
  [PASSENGER_TYPES.ADULT]: "Người lớn",
  [PASSENGER_TYPES.CHILD]: "Trẻ em",
  [PASSENGER_TYPES.INFANT]: "Em bé",
};

/**
 * Các trạng thái đặt vé
 */
export const BOOKING_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  REFUNDED: "refunded",
};

/**
 * Tên hiển thị của các trạng thái đặt vé
 */
export const BOOKING_STATUS_NAMES = {
  [BOOKING_STATUSES.PENDING]: "Chờ xác nhận",
  [BOOKING_STATUSES.CONFIRMED]: "Đã xác nhận",
  [BOOKING_STATUSES.CANCELLED]: "Đã hủy",
  [BOOKING_STATUSES.COMPLETED]: "Hoàn thành",
  [BOOKING_STATUSES.REFUNDED]: "Đã hoàn tiền",
};

/**
 * Các phương thức thanh toán
 */
export const PAYMENT_METHODS = {
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  BANK_TRANSFER: "bank_transfer",
  E_WALLET: "e_wallet",
  CASH: "cash",
};

/**
 * Tên hiển thị của các phương thức thanh toán
 */
export const PAYMENT_METHOD_NAMES = {
  [PAYMENT_METHODS.CREDIT_CARD]: "Thẻ tín dụng",
  [PAYMENT_METHODS.DEBIT_CARD]: "Thẻ ghi nợ",
  [PAYMENT_METHODS.BANK_TRANSFER]: "Chuyển khoản",
  [PAYMENT_METHODS.E_WALLET]: "Ví điện tử",
  [PAYMENT_METHODS.CASH]: "Tiền mặt",
};

/**
 * Các loại chuyến bay
 */
export const FLIGHT_TYPES = {
  DOMESTIC: "domestic",
  INTERNATIONAL: "international",
};

/**
 * Tên hiển thị của các loại chuyến bay
 */
export const FLIGHT_TYPE_NAMES = {
  [FLIGHT_TYPES.DOMESTIC]: "Nội địa",
  [FLIGHT_TYPES.INTERNATIONAL]: "Quốc tế",
};

/**
 * Hệ số giá theo loại hành khách (matching backend logic)
 */
export const PASSENGER_MULTIPLIERS = {
  ADULT: 1.0, // 100% of base price
  CHILD: 0.75, // 75% of base price
  INFANT: 0.1, // 10% of base price
};

/**
 * Get passenger type multiplier
 * @param {string} passengerType - Loại hành khách
 * @returns {number} - Hệ số nhân giá
 */
export const getPassengerMultiplier = (passengerType) => {
  return PASSENGER_MULTIPLIERS[passengerType] || PASSENGER_MULTIPLIERS.ADULT;
};

/**
 * Calculate total flight price for passengers with segment consideration
 * @param {number} basePrice - Giá cơ bản cho 1 segment
 * @param {Array} passengers - Danh sách hành khách
 * @param {string} flightType - Loại chuyến bay (oneway, roundtrip, multi-city)
 * @returns {number} - Tổng giá vé
 */
export const calculateFlightPrice = (
  basePrice,
  passengers,
  flightType = "oneway"
) => {
  if (!basePrice || basePrice <= 0 || !passengers || passengers.length === 0)
    return 0;

  // For roundtrip flights, costs are multiplied by 2 (2 segments)
  const segmentMultiplier =
    flightType === "roundtrip" || flightType === "ROUND_TRIP" ? 2 : 1;

  const passengerTotal = passengers.reduce((total, passenger) => {
    const multiplier = getPassengerMultiplier(passenger.type);
    return total + basePrice * multiplier;
  }, 0);

  return passengerTotal * segmentMultiplier;
};

/**
 * Calculate baggage/service price with segment consideration
 * @param {number} servicePrice - Giá dịch vụ cơ bản cho 1 segment
 * @param {Array} passengers - Danh sách hành khách
 * @param {string} flightType - Loại chuyến bay (oneway, roundtrip, multi-city)
 * @returns {number} - Tổng giá dịch vụ
 */
export const calculateExtraServicePrice = (
  servicePrice,
  passengers,
  flightType = "oneway"
) => {
  if (
    !servicePrice ||
    servicePrice <= 0 ||
    !passengers ||
    passengers.length === 0
  )
    return 0;

  // For roundtrip flights, baggage/services are also multiplied by segments
  const segmentMultiplier =
    flightType === "roundtrip" || flightType === "ROUND_TRIP" ? 2 : 1;

  const passengerTotal = passengers.reduce((total, passenger) => {
    const multiplier = getPassengerMultiplier(passenger.type);
    return total + servicePrice * multiplier;
  }, 0);

  return passengerTotal * segmentMultiplier;
};

/**
 * Tính giá vé dựa trên loại ghế và hành khách
 * @param {number} basePrice - Giá cơ bản
 * @param {string} seatClass - Loại ghế
 * @param {string} passengerType - Loại hành khách
 * @returns {number} - Giá vé sau khi tính toán
 */
export const calculateTicketPrice = (basePrice, seatClass, passengerType) => {
  if (!basePrice || basePrice <= 0) return 0;

  let multiplier = 1;

  // Hệ số theo loại ghế
  switch (seatClass) {
    case SEAT_CLASSES.ECONOMY:
      multiplier = 1;
      break;
    case SEAT_CLASSES.PREMIUM_ECONOMY:
      multiplier = 1.5;
      break;
    case SEAT_CLASSES.BUSINESS:
      multiplier = 3;
      break;
    case SEAT_CLASSES.FIRST:
      multiplier = 5;
      break;
    default:
      multiplier = 1;
  }

  // Hệ số theo loại hành khách (sử dụng function thống nhất)
  const passengerMultiplier = getPassengerMultiplier(passengerType);
  multiplier *= passengerMultiplier;

  return Math.round(basePrice * multiplier);
};

/**
 * Tính thuế và phí cho vé máy bay
 * @param {number} ticketPrice - Giá vé cơ bản
 * @param {string} flightType - Loại chuyến bay
 * @returns {Object} - Chi tiết thuế và phí
 */
export const calculateTaxesAndFees = (ticketPrice, flightType) => {
  const isInternational = flightType === FLIGHT_TYPES.INTERNATIONAL;

  // Thuế sân bay
  const airportTax = isInternational ? 400000 : 100000; // VND

  // Thuế bảo vệ hành khách
  const passengerSecurityTax = isInternational ? 200000 : 0; // VND

  // Phí dịch vụ
  const serviceFee = Math.round(ticketPrice * 0.05); // 5% giá vé

  // Phí nhiên liệu (động)
  const fuelSurcharge = Math.round(ticketPrice * 0.1); // 10% giá vé

  const total = airportTax + passengerSecurityTax + serviceFee + fuelSurcharge;

  return {
    airportTax,
    passengerSecurityTax,
    serviceFee,
    fuelSurcharge,
    total,
  };
};

/**
 * Tính tổng giá trị đặt vé
 * @param {number} ticketPrice - Giá vé
 * @param {Object} taxesAndFees - Thuế và phí
 * @param {number} quantity - Số lượng vé
 * @returns {number} - Tổng giá trị
 */
export const calculateTotalBookingValue = (
  ticketPrice,
  taxesAndFees,
  quantity = 1
) => {
  const subtotal = ticketPrice * quantity;
  const totalTaxesAndFees = taxesAndFees.total * quantity;
  return subtotal + totalTaxesAndFees;
};

/**
 * Tính điểm thưởng cho khách hàng thân thiết
 * @param {number} bookingValue - Giá trị đặt vé
 * @param {string} membershipLevel - Cấp độ thành viên
 * @returns {number} - Số điểm thưởng
 */
export const calculateRewardPoints = (
  bookingValue,
  membershipLevel = "standard"
) => {
  const basePointsPerVND = 0.01; // 1 điểm cho mỗi 100 VND

  let multiplier = 1;

  switch (membershipLevel.toLowerCase()) {
    case "silver":
      multiplier = 1.2;
      break;
    case "gold":
      multiplier = 1.5;
      break;
    case "platinum":
      multiplier = 2;
      break;
    default:
      multiplier = 1;
  }

  return Math.floor(bookingValue * basePointsPerVND * multiplier);
};

/**
 * Kiểm tra tính hợp lệ của thông tin hành khách
 * @param {Object} passenger - Thông tin hành khách
 * @returns {Object} - Kết quả validation
 */
export const validatePassengerInfo = (passenger) => {
  const errors = [];

  if (!passenger.firstName?.trim()) {
    errors.push("Họ không được để trống");
  }

  if (!passenger.lastName?.trim()) {
    errors.push("Tên không được để trống");
  }

  if (!passenger.dateOfBirth) {
    errors.push("Ngày sinh không được để trống");
  } else {
    const birthDate = new Date(passenger.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (passenger.type === PASSENGER_TYPES.INFANT && age >= 2) {
      errors.push("Em bé phải dưới 2 tuổi");
    }

    if (passenger.type === PASSENGER_TYPES.CHILD && (age < 2 || age >= 12)) {
      errors.push("Trẻ em từ 2 đến 11 tuổi");
    }

    if (passenger.type === PASSENGER_TYPES.ADULT && age < 12) {
      errors.push("Người lớn từ 12 tuổi trở lên");
    }
  }

  if (!passenger.nationality?.trim()) {
    errors.push("Quốc tịch không được để trống");
  }

  if (!passenger.idNumber?.trim()) {
    errors.push("Số CMND/CCCD không được để trống");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Tính thời gian bay ước tính
 * @param {number} distance - Khoảng cách (km)
 * @param {number} averageSpeed - Tốc độ trung bình (km/h)
 * @returns {number} - Thời gian bay (phút)
 */
export const calculateFlightDuration = (distance, averageSpeed = 800) => {
  if (!distance || distance <= 0) return 0;

  const hours = distance / averageSpeed;
  return Math.round(hours * 60); // Convert to minutes
};

/**
 * Format thời gian bay
 * @param {number} minutes - Số phút
 * @returns {string} - Chuỗi thời gian đã format
 */
export const formatFlightDuration = (minutes) => {
  if (!minutes || minutes <= 0) return "N/A";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
};

/**
 * Kiểm tra chuyến bay nội địa hay quốc tế
 * @param {string} departureCountry - Quốc gia khởi hành
 * @param {string} arrivalCountry - Quốc gia đến
 * @returns {string} - Loại chuyến bay
 */
export const determineFlightType = (departureCountry, arrivalCountry) => {
  if (!departureCountry || !arrivalCountry) return FLIGHT_TYPES.DOMESTIC;

  // Giả sử Việt Nam là "VN"
  const vietnam = "VN";

  if (departureCountry === vietnam && arrivalCountry === vietnam) {
    return FLIGHT_TYPES.DOMESTIC;
  } else {
    return FLIGHT_TYPES.INTERNATIONAL;
  }
};

/**
 * Tính tỷ lệ hoàn tiền theo chính sách
 * @param {string} bookingStatus - Trạng thái đặt vé
 * @param {number} hoursBeforeDeparture - Số giờ trước khi khởi hành
 * @returns {number} - Tỷ lệ hoàn tiền (0-1)
 */
export const calculateRefundRate = (bookingStatus, hoursBeforeDeparture) => {
  if (bookingStatus !== BOOKING_STATUSES.CANCELLED) {
    return 0;
  }

  if (hoursBeforeDeparture >= 72) {
    return 0.9; // 90% hoàn tiền
  } else if (hoursBeforeDeparture >= 24) {
    return 0.7; // 70% hoàn tiền
  } else if (hoursBeforeDeparture >= 12) {
    return 0.5; // 50% hoàn tiền
  } else if (hoursBeforeDeparture >= 6) {
    return 0.3; // 30% hoàn tiền
  } else {
    return 0.1; // 10% hoàn tiền
  }
};
