/**
 * Utility functions và constants cho export functionality
 */

/**
 * Danh sách các trường kỹ thuật sẽ bị loại bỏ khi export
 */
export const TECHNICAL_FIELDS = [
  "createdAt",
  "updatedAt",
  "deletedAt",
  "isActive",
  "delete",
  "deleted",
];

/**
 * Lọc bỏ các trường kỹ thuật khỏi danh sách fields
 * @param {Array} fields - Danh sách fields gốc (mảng các object)
 * @returns {Array} - Danh sách fields đã lọc
 */
export const filterTechnicalFields = (fields) => {
  return fields.filter(
    (fieldObj) => !TECHNICAL_FIELDS.includes(fieldObj.field)
  );
};

/**
 * Định nghĩa các entity và fields có thể export
 */
export const ENTITY_CONFIGS = {
  blogs: {
    displayName: "Blog",
    fields: [
      { field: "id", displayName: "Mã" },
      { field: "title", displayName: "Tiêu đề" },
      { field: "content", displayName: "Nội dung" },
      { field: "excerpt", displayName: "Tóm tắt" },
      { field: "featuredImage", displayName: "Hình ảnh nổi bật" },
      { field: "isPublished", displayName: "Đã xuất bản" },
      { field: "viewCount", displayName: "Lượt xem" },
      { field: "likeCount", displayName: "Lượt thích" },
      { field: "categories", displayName: "Danh mục" },
    ],
  },
  users: {
    displayName: "Người dùng",
    fields: [
      { field: "id", displayName: "Mã" },
      { field: "email", displayName: "Email" },
      { field: "phone", displayName: "Số điện thoại" },
      { field: "role", displayName: "Vai trò" },
      { field: "lastLogin", displayName: "Đăng nhập cuối" },
    ],
  },
  bookings: {
    displayName: "Đặt vé",
    fields: [
      { field: "id", displayName: "Mã" },
      { field: "user", displayName: "Người dùng" },
      { field: "flight", displayName: "Chuyến bay" },
      { field: "passengers", displayName: "Hành khách" },
      { field: "totalPrice", displayName: "Tổng tiền" },
      { field: "status", displayName: "Trạng thái" },
      { field: "bookingDate", displayName: "Ngày đặt" },
      { field: "paymentStatus", displayName: "Thanh toán" },
    ],
  },
  airlines: {
    displayName: "Hãng hàng không",
    fields: [
      { field: "airlineId", displayName: "Mã" },
      { field: "airlineName", displayName: "Tên" },
      { field: "airlineCode", displayName: "Mã IATA" },
      { field: "contact", displayName: "Liên hệ" },
      { field: "thumbnail", displayName: "Logo" },
    ],
  },
  airports: {
    displayName: "Sân bay",
    fields: [
      { field: "airportId", displayName: "Mã" },
      { field: "airportName", displayName: "Tên" },
      { field: "airportCode", displayName: "Mã IATA" },
      { field: "cityNames", displayName: "Thành phố" },
      { field: "thumbnail", displayName: "Logo" },
      { field: "country", displayName: "Quốc gia" },
      { field: "gates", displayName: "Cổng" },
    ],
  },
  countries: {
    displayName: "Quốc gia",
    fields: [
      { field: "countryId", displayName: "Mã" },
      { field: "countryName", displayName: "Tên" },
      { field: "countryCode", displayName: "Mã ISO" },
      { field: "thumbnail", displayName: "Hình ảnh" },
    ],
  },
  aircrafts: {
    displayName: "Máy bay",
    fields: [
      { field: "aircraftId", displayName: "Mã" },
      { field: "aircraftCode", displayName: "Model" },
      { field: "aircraftName", displayName: "Tên máy bay" },
      { field: "totalSeats", displayName: "Sức chứa" },
      { field: "seatLayout", displayName: "Hình thức ghế" },
    ],
  },
  flights: {
    displayName: "Chuyến bay",
    fields: [
      { field: "id", displayName: "Mã" },
      { field: "flightNumber", displayName: "Số hiệu" },
      { field: "airline", displayName: "Hãng hàng không" },
      { field: "departureAirport", displayName: "Sân bay đi" },
      { field: "arrivalAirport", displayName: "Sân bay đến" },
      { field: "departureTime", displayName: "Giờ khởi hành" },
      { field: "arrivalTime", displayName: "Giờ đến" },
      { field: "duration", displayName: "Thời gian bay" },
      { field: "price", displayName: "Giá vé" },
      { field: "status", displayName: "Trạng thái" },
    ],
  },
  deals: {
    displayName: "Khuyến mãi",
    fields: [
      { field: "dealId", displayName: "Mã" },
      { field: "dealCode", displayName: "Code giảm giá" },
      { field: "title", displayName: "Tiêu đề" },
      { field: "description", displayName: "Mô tả" },
      { field: "discountPercentage", displayName: "Phần trăm giảm" },
      { field: "validFrom", displayName: "Ngày bắt đầu" },
      { field: "validTo", displayName: "Ngày kết thúc" },
      { field: "status", displayName: "Trạng thái" },
    ],
  },
  payments: {
    displayName: "Thanh toán",
    fields: [
      { field: "id", displayName: "Mã" },
      { field: "booking", displayName: "Đặt vé" },
      { field: "amount", displayName: "Số tiền" },
      { field: "method", displayName: "Phương thức" },
      { field: "status", displayName: "Trạng thái" },
      { field: "transactionId", displayName: "Mã giao dịch" },
      { field: "paymentDate", displayName: "Ngày thanh toán" },
    ],
  },
};

/**
 * Lấy cấu hình export cho một entity
 * @param {string} entity - Tên entity
 * @returns {Object} - Cấu hình export với fields đã lọc
 */
export const getEntityExportConfig = (entity) => {
  const config = ENTITY_CONFIGS[entity];
  if (!config) {
    return null;
  }

  const filteredFields = filterTechnicalFields(config.fields);

  return {
    ...config,
    fields: filteredFields,
    // Tạo danh sách field names cho backend
    fieldNames: filteredFields.map((f) => f.field),
    // Tạo danh sách display names cho UI
    displayNames: filteredFields.map((f) => f.displayName),
  };
};

/**
 * Lấy danh sách tất cả entity có thể export
 * @returns {string[]} - Danh sách tên entity
 */
export const getExportableEntities = () => {
  return Object.keys(ENTITY_CONFIGS);
};
