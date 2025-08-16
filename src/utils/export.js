// Generic Export utilities for all data types (booking, flight, customer, user, payment, etc.)
export const exportFormats = {
  CSV: "csv",
  JSON: "json",
  EXCEL: "xlsx",
};

// Generic CSV export function that works with any data structure
export const exportToCSV = (data, config = {}) => {
  const {
    filename = "data_export",
    columns = null, // Auto-detect if not provided
    headers = null, // Auto-generate if not provided
    customFormatters = {}, // Custom formatting functions for specific fields
    excludeFields = [], // Fields to exclude from export
  } = config;

  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Auto-detect columns if not provided
  const detectedColumns =
    columns ||
    Object.keys(data[0] || {}).filter((key) => !excludeFields.includes(key));

  // Auto-generate headers if not provided
  const csvHeaders =
    headers || detectedColumns.map((col) => formatHeaderName(col));

  // Helper function to format field values
  const formatFieldValue = (value, fieldName) => {
    // Apply custom formatter if exists
    if (customFormatters[fieldName]) {
      return customFormatters[fieldName](value);
    }

    // Default formatting based on value type
    if (value === null || value === undefined) {
      return "";
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    // Escape quotes and wrap in quotes for CSV safety
    return `"${String(value).replace(/"/g, '""')}"`;
  };

  const csvContent = [
    csvHeaders.join(","),
    ...data.map((row) =>
      detectedColumns.map((col) => formatFieldValue(row[col], col)).join(",")
    ),
  ].join("\n");

  downloadFile(csvContent, `${filename}.csv`, "text/csv");
};

// Helper function to format header names (camelCase to Title Case)
const formatHeaderName = (fieldName) => {
  return fieldName
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
};

// Generic JSON export function
export const exportToJSON = (data, config = {}) => {
  const {
    filename = "data_export",
    pretty = true, // Pretty print JSON
    metadata = {}, // Additional metadata to include
  } = config;

  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const exportData = {
    data: data,
    metadata: {
      totalRecords: data.length,
      exportDate: new Date().toISOString(),
      exportedBy: "Admin Dashboard",
      ...metadata,
    },
  };

  const jsonContent = pretty
    ? JSON.stringify(exportData, null, 2)
    : JSON.stringify(exportData);

  downloadFile(jsonContent, `${filename}.json`, "application/json");
};

// Generic export function that works with any data type and filters
export const exportData = (data, format = "csv", config = {}) => {
  const {
    entityType = "data", // booking, flight, customer, user, payment, etc.
    filters = {},
    filename = null,
    ...otherConfig
  } = config;

  let filteredData = [...data];

  // Apply generic filters
  if (filters.status && filters.status !== "all") {
    filteredData = filteredData.filter(
      (item) => item.status?.toLowerCase() === filters.status.toLowerCase()
    );
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filteredData = filteredData.filter((item) => {
      // Search across all string fields
      return Object.values(item).some(
        (value) =>
          typeof value === "string" && value.toLowerCase().includes(query)
      );
    });
  }

  if (filters.dateRange && filters.dateField) {
    const { start, end, dateField } = filters;
    filteredData = filteredData.filter((item) => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= start && itemDate <= end;
    });
  }

  // Generate filename with timestamp if not provided
  const timestamp = new Date().toISOString().split("T")[0];
  const finalFilename = filename || `${entityType}_export_${timestamp}`;

  const exportConfig = {
    filename: finalFilename,
    ...otherConfig,
  };

  // Export based on format
  switch (format) {
    case exportFormats.CSV:
      exportToCSV(filteredData, exportConfig);
      break;
    case exportFormats.JSON:
      exportToJSON(filteredData, exportConfig);
      break;
    default:
      exportToCSV(filteredData, exportConfig);
  }
};

// Helper function to download file
const downloadFile = (content, filename, contentType) => {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Predefined configurations for common entity types
export const entityConfigs = {
  booking: {
    headers: [
      "Booking Reference",
      "Customer Name",
      "Email",
      "Phone",
      "Route",
      "Departure Date",
      "Departure Time",
      "Arrival Date",
      "Arrival Time",
      "Passengers",
      "Class",
      "Status",
      "Amount",
      "Booking Date",
      "Payment Status",
    ],
    columns: [
      "bookingRef",
      "customer",
      "email",
      "phone",
      "route",
      "departure",
      "departure",
      "arrival",
      "arrival",
      "passengers",
      "class",
      "status",
      "amount",
      "bookingDate",
      "paymentStatus",
    ],
    customFormatters: {
      departure: (value) => (value ? new Date(value).toLocaleDateString() : ""),
      arrival: (value) => (value ? new Date(value).toLocaleDateString() : ""),
      bookingDate: (value) =>
        value ? new Date(value).toLocaleDateString() : "",
      amount: (value) => value || "$0.00",
    },
    statusField: "status",
    amountField: "amount",
    dateField: "bookingDate",
  },

  flight: {
    headers: [
      "Flight Number",
      "Airline",
      "Origin",
      "Destination",
      "Departure Time",
      "Arrival Time",
      "Duration",
      "Aircraft",
      "Capacity",
      "Available Seats",
      "Economy Price",
      "Business Price",
      "First Price",
      "Status",
    ],
    columns: [
      "flightNumber",
      "airline",
      "origin",
      "destination",
      "departureTime",
      "arrivalTime",
      "duration",
      "aircraft",
      "capacity",
      "availableSeats",
      "economyPrice",
      "businessPrice",
      "firstPrice",
      "status",
    ],
    customFormatters: {
      departureTime: (value) => (value ? new Date(value).toLocaleString() : ""),
      arrivalTime: (value) => (value ? new Date(value).toLocaleString() : ""),
      economyPrice: (value) => (value ? `$${value}` : "$0"),
      businessPrice: (value) => (value ? `$${value}` : "$0"),
      firstPrice: (value) => (value ? `$${value}` : "$0"),
    },
    statusField: "status",
    amountField: "economyPrice",
    dateField: "departureTime",
  },

  customer: {
    headers: [
      "Customer ID",
      "Full Name",
      "Email",
      "Phone",
      "Date of Birth",
      "Gender",
      "Nationality",
      "Passport Number",
      "Registration Date",
      "Total Bookings",
      "Total Spent",
      "Status",
      "Last Login",
    ],
    columns: [
      "id",
      "fullName",
      "email",
      "phone",
      "dateOfBirth",
      "gender",
      "nationality",
      "passportNumber",
      "registrationDate",
      "totalBookings",
      "totalSpent",
      "status",
      "lastLogin",
    ],
    customFormatters: {
      dateOfBirth: (value) =>
        value ? new Date(value).toLocaleDateString() : "",
      registrationDate: (value) =>
        value ? new Date(value).toLocaleDateString() : "",
      lastLogin: (value) =>
        value ? new Date(value).toLocaleString() : "Never",
      totalSpent: (value) => (value ? `$${value}` : "$0.00"),
    },
    statusField: "status",
    amountField: "totalSpent",
    dateField: "registrationDate",
  },

  user: {
    headers: [
      "User ID",
      "Username",
      "Email",
      "Full Name",
      "Role",
      "Department",
      "Status",
      "Created Date",
      "Last Login",
      "Login Count",
      "Is Active",
    ],
    columns: [
      "id",
      "username",
      "email",
      "fullName",
      "role",
      "department",
      "status",
      "createdDate",
      "lastLogin",
      "loginCount",
      "isActive",
    ],
    customFormatters: {
      createdDate: (value) =>
        value ? new Date(value).toLocaleDateString() : "",
      lastLogin: (value) =>
        value ? new Date(value).toLocaleString() : "Never",
      isActive: (value) => (value ? "Yes" : "No"),
    },
    statusField: "status",
    dateField: "createdDate",
  },

  payment: {
    headers: [
      "Payment ID",
      "Booking Reference",
      "Customer",
      "Amount",
      "Currency",
      "Payment Method",
      "Transaction ID",
      "Status",
      "Created Date",
      "Processed Date",
      "Refund Amount",
      "Gateway",
      "Fee",
    ],
    columns: [
      "id",
      "bookingRef",
      "customer",
      "amount",
      "currency",
      "paymentMethod",
      "transactionId",
      "status",
      "createdDate",
      "processedDate",
      "refundAmount",
      "gateway",
      "fee",
    ],
    customFormatters: {
      amount: (value) => (value ? `$${value}` : "$0.00"),
      refundAmount: (value) => (value ? `$${value}` : "$0.00"),
      fee: (value) => (value ? `$${value}` : "$0.00"),
      createdDate: (value) =>
        value ? new Date(value).toLocaleDateString() : "",
      processedDate: (value) =>
        value ? new Date(value).toLocaleDateString() : "",
    },
    statusField: "status",
    amountField: "amount",
    dateField: "createdDate",
  },
};

// Convenience functions for specific entity types
export const exportBookings = (data, format = "csv", filters = {}) => {
  return exportData(data, format, {
    entityType: "booking",
    filters,
    ...entityConfigs.booking,
  });
};

export const exportFlights = (data, format = "csv", filters = {}) => {
  return exportData(data, format, {
    entityType: "flight",
    filters,
    ...entityConfigs.flight,
  });
};

export const exportCustomers = (data, format = "csv", filters = {}) => {
  return exportData(data, format, {
    entityType: "customer",
    filters,
    ...entityConfigs.customer,
  });
};

export const exportUsers = (data, format = "csv", filters = {}) => {
  return exportData(data, format, {
    entityType: "user",
    filters,
    ...entityConfigs.user,
  });
};

export const exportPayments = (data, format = "csv", filters = {}) => {
  return exportData(data, format, {
    entityType: "payment",
    filters,
    ...entityConfigs.payment,
  });
};

// Convenience functions for summary exports
export const exportBookingSummary = (data) => {
  return exportSummary(data, {
    entityType: "booking",
    ...entityConfigs.booking,
  });
};

export const exportFlightSummary = (data) => {
  return exportSummary(data, {
    entityType: "flight",
    ...entityConfigs.flight,
  });
};

export const exportCustomerSummary = (data) => {
  return exportSummary(data, {
    entityType: "customer",
    ...entityConfigs.customer,
  });
};

export const exportUserSummary = (data) => {
  return exportSummary(data, {
    entityType: "user",
    ...entityConfigs.user,
  });
};

export const exportPaymentSummary = (data) => {
  return exportSummary(data, {
    entityType: "payment",
    ...entityConfigs.payment,
  });
};

// Generic summary export function for any entity type
export const exportSummary = (data, config = {}) => {
  const {
    entityType = "data",
    filename = null,
    customStats = {}, // Custom statistics functions
    statusField = "status", // Field to use for status-based stats
    amountField = "amount", // Field to use for financial calculations
    dateField = "createdAt", // Field to use for date-based analysis
  } = config;

  // Basic statistics that work for any entity
  const summary = {
    [`total${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`]:
      data.length,
    ...generateStatusStats(data, statusField),
    ...generateFinancialStats(data, amountField),
    ...generateDateStats(data, dateField),
    ...customStats, // Allow custom statistics
    exportMetadata: {
      entityType,
      exportDate: new Date().toISOString(),
      exportedBy: "Admin Dashboard",
      totalRecords: data.length,
    },
  };

  const timestamp = new Date().toISOString().split("T")[0];
  const finalFilename = filename || `${entityType}_summary_${timestamp}`;

  exportToJSON([summary], { filename: finalFilename });
};

// Helper function to generate status-based statistics
const generateStatusStats = (data, statusField) => {
  if (!data.length || !statusField) return {};

  const statusCounts = data.reduce((acc, item) => {
    const status = item[statusField]?.toLowerCase() || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const stats = {};
  Object.entries(statusCounts).forEach(([status, count]) => {
    stats[`${status}Count`] = count;
    stats[`${status}Percentage`] = ((count / data.length) * 100).toFixed(2);
  });

  return stats;
};

// Helper function to generate financial statistics
const generateFinancialStats = (data, amountField) => {
  if (!data.length || !amountField) return {};

  const validAmounts = data
    .map((item) => {
      const amount = item[amountField];
      if (typeof amount === "string") {
        return parseFloat(amount.replace(/[^0-9.-]+/g, ""));
      }
      return typeof amount === "number" ? amount : 0;
    })
    .filter((amount) => !isNaN(amount) && amount > 0);

  if (validAmounts.length === 0) return {};

  const totalAmount = validAmounts.reduce((sum, amount) => sum + amount, 0);
  const averageAmount = totalAmount / validAmounts.length;
  const maxAmount = Math.max(...validAmounts);
  const minAmount = Math.min(...validAmounts);

  return {
    totalRevenue: totalAmount,
    averageValue: averageAmount,
    maxValue: maxAmount,
    minValue: minAmount,
    recordsWithValue: validAmounts.length,
  };
};

// Helper function to generate date-based statistics
const generateDateStats = (data, dateField) => {
  if (!data.length || !dateField) return {};

  const validDates = data
    .map((item) => new Date(item[dateField]))
    .filter((date) => !isNaN(date.getTime()));

  if (validDates.length === 0) return {};

  const sortedDates = validDates.sort((a, b) => a - b);
  const oldestDate = sortedDates[0];
  const newestDate = sortedDates[sortedDates.length - 1];

  // Group by month for trend analysis
  const monthlyStats = validDates.reduce((acc, date) => {
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    acc[monthKey] = (acc[monthKey] || 0) + 1;
    return acc;
  }, {});

  return {
    oldestRecord: oldestDate.toISOString(),
    newestRecord: newestDate.toISOString(),
    dateRange: `${oldestDate.toLocaleDateString()} - ${newestDate.toLocaleDateString()}`,
    monthlyDistribution: monthlyStats,
  };
};
