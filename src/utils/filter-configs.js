// Predefined filter configurations for different entity types

// Booking filters configuration
export const bookingFilters = [
  {
    key: "status",
    label: "Trạng Thái",
    type: "select",
    placeholder: "Tất Cả Trạng Thái",
    options: [
      { value: "confirmed", label: "Đã Xác Nhận" },
      { value: "pending", label: "Chờ Xử Lý" },
      { value: "cancelled", label: "Đã Hủy" },
    ],
  },
  {
    key: "class",
    label: "Hạng Vé",
    type: "select",
    placeholder: "Tất Cả Hạng Vé",
    options: [
      { value: "Economy", label: "Phổ Thông" },
      { value: "Business", label: "Thương Gia" },
      { value: "First", label: "Hạng Nhất" },
    ],
  },
  {
    key: "passengers",
    label: "Số Hành Khách",
    type: "number",
    placeholder: "Bất kỳ số lượng",
    options: [
      { value: "1", label: "1 Hành Khách" },
      { value: "2", label: "2 Hành Khách" },
      { value: "3", label: "3 Hành Khách" },
      { value: "4+", label: "4+ Hành Khách" },
    ],
  },
  {
    key: "bookingDate",
    label: "Ngày Đặt Vé",
    type: "date",
    placeholder: "Chọn ngày đặt vé",
  },
];

// Flight filters configuration
export const flightFilters = [
  {
    key: "status",
    label: "Flight Status",
    type: "select",
    placeholder: "All Status",
    options: [
      { value: "scheduled", label: "Scheduled" },
      { value: "delayed", label: "Delayed" },
      { value: "cancelled", label: "Cancelled" },
      { value: "completed", label: "Completed" },
      { value: "boarding", label: "Boarding" },
    ],
  },
  {
    key: "airline",
    label: "Airline",
    type: "select",
    placeholder: "All Airlines",
    options: [
      { value: "vietnam_airlines", label: "Vietnam Airlines" },
      { value: "jetstar", label: "Jetstar" },
      { value: "vietjet", label: "VietJet Air" },
      { value: "bamboo", label: "Bamboo Airways" },
      { value: "pacific", label: "Pacific Airlines" },
    ],
  },
  {
    key: "aircraft",
    label: "Aircraft Type",
    type: "select",
    placeholder: "All Aircraft",
    options: [
      { value: "boeing_737", label: "Boeing 737" },
      { value: "airbus_a320", label: "Airbus A320" },
      { value: "boeing_787", label: "Boeing 787" },
      { value: "airbus_a350", label: "Airbus A350" },
      { value: "boeing_777", label: "Boeing 777" },
    ],
  },
  {
    key: "departureDate",
    label: "Departure Date",
    type: "date",
    placeholder: "Select departure date",
  },
  {
    key: "capacity",
    label: "Capacity Range",
    type: "select",
    placeholder: "Any capacity",
    options: [
      { value: "small", label: "Small (< 150 seats)" },
      { value: "medium", label: "Medium (150-300 seats)" },
      { value: "large", label: "Large (> 300 seats)" },
    ],
  },
];

// Customer filters configuration
export const customerFilters = [
  {
    key: "status",
    label: "Account Status",
    type: "select",
    placeholder: "All Status",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "suspended", label: "Suspended" },
      { value: "pending", label: "Pending Verification" },
    ],
  },
  {
    key: "tier",
    label: "Customer Tier",
    type: "select",
    placeholder: "All Tiers",
    options: [
      { value: "bronze", label: "Bronze" },
      { value: "silver", label: "Silver" },
      { value: "gold", label: "Gold" },
      { value: "platinum", label: "Platinum" },
      { value: "diamond", label: "Diamond" },
    ],
  },
  {
    key: "nationality",
    label: "Nationality",
    type: "select",
    placeholder: "All Countries",
    options: [
      { value: "VN", label: "Vietnam" },
      { value: "US", label: "United States" },
      { value: "GB", label: "United Kingdom" },
      { value: "AU", label: "Australia" },
      { value: "JP", label: "Japan" },
      { value: "KR", label: "South Korea" },
      { value: "CN", label: "China" },
      { value: "SG", label: "Singapore" },
    ],
  },
  {
    key: "registrationDate",
    label: "Registration Date",
    type: "date",
    placeholder: "Select registration date",
  },
  {
    key: "totalBookings",
    label: "Total Bookings",
    type: "select",
    placeholder: "Any number",
    options: [
      { value: "0", label: "No bookings" },
      { value: "1-5", label: "1-5 bookings" },
      { value: "6-10", label: "6-10 bookings" },
      { value: "11-20", label: "11-20 bookings" },
      { value: "20+", label: "20+ bookings" },
    ],
  },
];

// User filters configuration (for admin user management)
export const userFilters = [
  {
    key: "status",
    label: "Account Status",
    type: "select",
    placeholder: "All Status",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "suspended", label: "Suspended" },
      { value: "pending", label: "Pending" },
    ],
  },
  {
    key: "role",
    label: "Role",
    type: "select",
    placeholder: "All Roles",
    options: [
      { value: "admin", label: "Administrator" },
      { value: "manager", label: "Manager" },
      { value: "staff", label: "Staff" },
      { value: "agent", label: "Agent" },
      { value: "customer", label: "Customer" },
    ],
  },
  {
    key: "department",
    label: "Department",
    type: "select",
    placeholder: "All Departments",
    options: [
      { value: "operations", label: "Operations" },
      { value: "customer_service", label: "Customer Service" },
      { value: "finance", label: "Finance" },
      { value: "marketing", label: "Marketing" },
      { value: "it", label: "IT Department" },
      { value: "hr", label: "Human Resources" },
    ],
  },
  {
    key: "createdDate",
    label: "Created Date",
    type: "date",
    placeholder: "Select creation date",
  },
  {
    key: "lastLogin",
    label: "Last Login",
    type: "date",
    placeholder: "Select last login date",
  },
];

// Payment filters configuration
export const paymentFilters = [
  {
    key: "status",
    label: "Payment Status",
    type: "select",
    placeholder: "All Status",
    options: [
      { value: "completed", label: "Completed" },
      { value: "pending", label: "Pending" },
      { value: "failed", label: "Failed" },
      { value: "refunded", label: "Refunded" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
  {
    key: "method",
    label: "Payment Method",
    type: "select",
    placeholder: "All Methods",
    options: [
      { value: "credit_card", label: "Credit Card" },
      { value: "debit_card", label: "Debit Card" },
      { value: "bank_transfer", label: "Bank Transfer" },
      { value: "e_wallet", label: "E-Wallet" },
      { value: "cash", label: "Cash" },
    ],
  },
  {
    key: "gateway",
    label: "Payment Gateway",
    type: "select",
    placeholder: "All Gateways",
    options: [
      { value: "vnpay", label: "VNPay" },
      { value: "momo", label: "MoMo" },
      { value: "zalopay", label: "ZaloPay" },
      { value: "paypal", label: "PayPal" },
      { value: "stripe", label: "Stripe" },
    ],
  },
  {
    key: "amount",
    label: "Amount Range",
    type: "select",
    placeholder: "Any amount",
    options: [
      { value: "0-100", label: "Under $100" },
      { value: "100-500", label: "$100 - $500" },
      { value: "500-1000", label: "$500 - $1,000" },
      { value: "1000-5000", label: "$1,000 - $5,000" },
      { value: "5000+", label: "Over $5,000" },
    ],
  },
  {
    key: "paymentDate",
    label: "Payment Date",
    type: "date",
    placeholder: "Select payment date",
  },
];

// Analytics/Reports filters configuration
export const reportFilters = [
  {
    key: "type",
    label: "Report Type",
    type: "select",
    placeholder: "All Types",
    options: [
      { value: "sales", label: "Sales Report" },
      { value: "customer", label: "Customer Report" },
      { value: "flight", label: "Flight Report" },
      { value: "financial", label: "Financial Report" },
      { value: "operational", label: "Operational Report" },
    ],
  },
  {
    key: "period",
    label: "Time Period",
    type: "select",
    placeholder: "All Periods",
    options: [
      { value: "daily", label: "Daily" },
      { value: "weekly", label: "Weekly" },
      { value: "monthly", label: "Monthly" },
      { value: "quarterly", label: "Quarterly" },
      { value: "yearly", label: "Yearly" },
    ],
  },
  {
    key: "status",
    label: "Report Status",
    type: "select",
    placeholder: "All Status",
    options: [
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
      { value: "archived", label: "Archived" },
    ],
  },
  {
    key: "generatedDate",
    label: "Generated Date",
    type: "date",
    placeholder: "Select generation date",
  },
];

// Helper function to get filter configuration by entity type
export const getFilterConfig = (entityType) => {
  const filterConfigs = {
    booking: bookingFilters,
    flight: flightFilters,
    customer: customerFilters,
    user: userFilters,
    payment: paymentFilters,
    report: reportFilters,
  };

  return filterConfigs[entityType] || [];
};

// Helper function to create custom filter configuration
export const createCustomFilter = (
  key,
  label,
  type,
  options = [],
  placeholder = ""
) => {
  return {
    key,
    label,
    type,
    options,
    placeholder: placeholder || `All ${label}`,
  };
};

// Export all filter configurations
export default {
  bookingFilters,
  flightFilters,
  customerFilters,
  userFilters,
  paymentFilters,
  reportFilters,
  getFilterConfig,
  createCustomFilter,
};
