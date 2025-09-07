// Constants and utilities for flight search results
export const FLIGHTS_PER_PAGE = 6;

export const DEFAULT_FILTERS = {
  priceRange: [100000, 10000000],
  airlines: [],
  departureTime: [],
  sortBy: "price-asc",
};

export const FLIGHT_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "domestic", label: "Nội địa" },
  { key: "international", label: "Quốc tế" },
];

export const FARE_OPTIONS = [
  {
    id: "basic",
    name: "Phổ thông cơ bản",
    price: 1200000,
    features: [
      { included: true, text: "Hành lý xách tay" },
      { included: false, text: "Hành lý ký gửi" },
      { included: false, text: "Chọn chỗ ngồi" },
      { included: false, text: "Đổi/hủy vé" },
    ],
  },
  {
    id: "main",
    name: "Phổ thông tiêu chuẩn",
    price: 1800000,
    recommended: true,
    features: [
      { included: true, text: "Hành lý xách tay" },
      { included: true, text: "1 hành lý ký gửi" },
      { included: true, text: "Chọn chỗ ngồi trước" },
      { included: true, text: "Đổi vé (có phí)" },
    ],
  },
  {
    id: "first",
    name: "Thương gia",
    price: 4200000,
    features: [
      { included: true, text: "Hành lý xách tay" },
      { included: true, text: "2 hành lý ký gửi" },
      { included: true, text: "Chọn chỗ ngồi miễn phí" },
      { included: true, text: "Đổi/hủy vé miễn phí" },
      { included: true, text: "Suất ăn cao cấp" },
    ],
  },
];

export const getDepartureTimeSlot = (time) => {
  const hour = Number.parseInt(time.split(":")[0]);
  if (hour >= 0 && hour < 6) return "early-morning";
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
};
