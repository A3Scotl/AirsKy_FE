import { useQuery, useQueryClient } from "@tanstack/react-query";
import { flightApi } from "@/apis/flight-api";
import { bookingApi } from "@/apis/booking-api";
import { userApi } from "@/apis/user-api";
import { useChartWorker } from "./use-chart-worker";
import { useMemo, useCallback } from "react";

/**
 * Unified hook for report data with smart caching, dynamic batch sizing and Web Worker processing
 * Combines functionality from use-dashboard-reports and use-optimized-reports
 */
export const useReportsData = (options = {}) => {
  const {
    dateRange,
    period = "30days",
    mode = "dashboard", // "dashboard" | "reports" | "export"
    enabled = true,
  } = options;

  const queryClient = useQueryClient();
  const { processAllStats, isProcessing: isWorkerProcessing } =
    useChartWorker();

  // Calculate date range
  const calculatedDateRange = useMemo(() => {
    const now = new Date();
    const fromDate =
      dateRange?.from ||
      new Date(now.getTime() - getDaysFromPeriod(period) * 24 * 60 * 60 * 1000);
    const toDate = dateRange?.to || now;
    return { from: fromDate, to: toDate };
  }, [dateRange, period]);

  // Dynamic batch sizing based on mode and date range
  const batchSize = useMemo(() => {
    const daysDiff = Math.ceil(
      (calculatedDateRange.to - calculatedDateRange.from) /
        (1000 * 60 * 60 * 24)
    );

    switch (mode) {
      case "dashboard":
        return Math.min(Math.max(200, daysDiff * 5), 1000);
      case "reports":
        return Math.min(Math.max(500, daysDiff * 10), 2000);
      case "export":
        return Math.min(Math.max(1000, daysDiff * 20), 10000);
      default:
        return Math.min(Math.max(200, daysDiff * 8), 1500);
    }
  }, [calculatedDateRange, mode]);

  // Generate cache key
  const cacheKey = useMemo(() => {
    const from = calculatedDateRange.from.toDateString();
    const to = calculatedDateRange.to.toDateString();
    return ["reports-data", mode, from, to, period];
  }, [calculatedDateRange, mode, period]);

  // Main query with smart caching
  const {
    data: rawData,
    isLoading: isRawDataLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: cacheKey,
    queryFn: async () => {
      console.log(`🚀 Fetching ${mode} data...`);
      const startTime = performance.now();

      try {
        // Parallel API calls with optimized parameters
        const [flightsResult, bookingsResult, usersResult] =
          await Promise.allSettled([
            flightApi.getAllFlights({
              page: 0,
              size: batchSize,
              sort: "departureTime,desc",
              ...(mode === "export"
                ? {}
                : {
                    fromDate: calculatedDateRange.from.toISOString(),
                    toDate: calculatedDateRange.to.toISOString(),
                  }),
            }),
            bookingApi.getAllBookings({
              page: 0,
              size: batchSize,
              sort: "createdAt,desc",
              ...(mode === "export"
                ? {}
                : {
                    createdFrom: calculatedDateRange.from
                      .toISOString()
                      .split("T")[0],
                    createdTo: calculatedDateRange.to
                      .toISOString()
                      .split("T")[0],
                  }),
            }),
            userApi.getAllUsers({
              page: 0,
              size: Math.min(batchSize, mode === "dashboard" ? 500 : 2000),
              sort: "createdAt,desc",
              ...(mode === "export"
                ? {}
                : {
                    createdFrom: calculatedDateRange.from
                      .toISOString()
                      .split("T")[0],
                    createdTo: calculatedDateRange.to
                      .toISOString()
                      .split("T")[0],
                  }),
            }),
          ]);

        // Handle results safely
        const flights =
          flightsResult.status === "fulfilled" && flightsResult.value.success
            ? flightsResult.value.data?.content || []
            : [];
        const bookings =
          bookingsResult.status === "fulfilled" && bookingsResult.value.success
            ? bookingsResult.value.data?.content || []
            : [];
        const users =
          usersResult.status === "fulfilled" && usersResult.value.success
            ? usersResult.value.data?.content || []
            : [];

        // Client-side filtering for export mode (to get ALL data)
        let filteredFlights = flights;
        let filteredBookings = bookings;
        let filteredUsers = users;

        if (mode === "export") {
          filteredFlights = flights.filter((flight) => {
            const flightDate = new Date(
              flight.departureTime || flight.createdAt
            );
            return (
              flightDate >= calculatedDateRange.from &&
              flightDate <= calculatedDateRange.to
            );
          });
          filteredBookings = bookings.filter((booking) => {
            const bookingDate = new Date(
              booking.createdAt || booking.bookingDate
            );
            return (
              bookingDate >= calculatedDateRange.from &&
              bookingDate <= calculatedDateRange.to
            );
          });
          filteredUsers = users.filter((user) => {
            const userDate = new Date(user.createdAt);
            return (
              userDate >= calculatedDateRange.from &&
              userDate <= calculatedDateRange.to
            );
          });
        }

        const endTime = performance.now();
        console.log(
          `✅ ${mode} data fetched in ${(endTime - startTime).toFixed(2)}ms`
        );
        console.log(
          `📈 Data: ${filteredFlights.length} flights, ${filteredBookings.length} bookings, ${filteredUsers.length} users`
        );

        return {
          flights: filteredFlights,
          bookings: filteredBookings,
          users: filteredUsers,
          totalFlights: filteredFlights.length,
          totalBookings: filteredBookings.length,
          totalUsers: filteredUsers.length,
          dateRange: calculatedDateRange,
          fetchTime: endTime - startTime,
        };
      } catch (error) {
        console.error(`❌ Error fetching ${mode} data:`, error);
        throw error;
      }
    },
    staleTime: mode === "dashboard" ? 1 * 60 * 1000 : 5 * 60 * 1000,
    cacheTime: mode === "dashboard" ? 10 * 60 * 1000 : 15 * 60 * 1000,
    enabled: enabled && !!(calculatedDateRange.from && calculatedDateRange.to),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Process data using Web Worker for heavy calculations
  const { data: processedData, isLoading: isProcessingData } = useQuery({
    queryKey: [...cacheKey, "processed"],
    queryFn: async () => {
      if (!rawData || !processAllStats) return null;

      console.log("⚡ Processing data with Web Worker...");
      const startTime = performance.now();

      try {
        const result = await processAllStats({
          bookings: rawData.bookings.slice(0, mode === "dashboard" ? 50 : 200),
          flights: rawData.flights.slice(0, mode === "dashboard" ? 50 : 200),
          users: rawData.users.slice(0, mode === "dashboard" ? 50 : 200),
        });

        const endTime = performance.now();
        console.log(
          `🔧 Data processed in ${(endTime - startTime).toFixed(2)}ms`
        );

        return result;
      } catch (error) {
        console.warn("⚠️ Web Worker processing failed, using fallback:", error);
        return generateBasicStats(rawData);
      }
    },
    enabled: !!rawData && !isRawDataLoading,
    staleTime: 10 * 60 * 1000,
    cacheTime: 20 * 60 * 1000,
  });

  // Memoized summary calculations
  const summary = useMemo(() => {
    if (!rawData) return getEmptySummary();

    const { bookings, flights, users } = rawData;

    return {
      totalRevenue: bookings.reduce(
        (sum, booking) =>
          sum + (booking.totalAmount || booking.totalPrice || 0),
        0
      ),
      totalBookings: bookings.length,
      totalCustomers: users.length,
      totalFlights: flights.length,
      avgBookingValue:
        bookings.length > 0
          ? bookings.reduce(
              (sum, booking) =>
                sum + (booking.totalAmount || booking.totalPrice || 0),
              0
            ) / bookings.length
          : 0,
      occupancyRate: calculateOccupancyRate(flights),
    };
  }, [rawData]);

  // Prefetch related data ranges
  useMemo(() => {
    if (rawData && mode === "dashboard" && period === "30days") {
      setTimeout(() => {
        queryClient.prefetchQuery({
          queryKey: [
            "reports-data",
            "dashboard",
            calculatedDateRange.from.toDateString(),
            calculatedDateRange.to.toDateString(),
            "7days",
          ],
        });
      }, 1000);
    }
  }, [rawData, mode, period, queryClient, calculatedDateRange]);

  return {
    // Raw data
    rawData,

    // Processed data
    processedData,

    // Summary stats (fast)
    summary,

    // Loading states
    isLoading: isRawDataLoading || isProcessingData || isWorkerProcessing,
    isRawDataLoading,
    isProcessingData,

    // Error handling
    error,

    // Utilities
    refetch,

    // Performance info
    performance: {
      fetchTime: rawData?.fetchTime || 0,
      batchSize,
      mode,
    },
  };
};

// Legacy alias for backward compatibility
export const useDashboardData = () => useReportsData({ mode: "dashboard" });
export const useOptimizedReports = (dateRange, period) =>
  useReportsData({ dateRange, period, mode: "reports" });

// Helper functions
function getDaysFromPeriod(period) {
  const daysMap = {
    "7days": 7,
    "30days": 30,
    "90days": 90,
    custom: 30,
  };
  return daysMap[period] || 30;
}

function getEmptySummary() {
  return {
    totalRevenue: 0,
    totalBookings: 0,
    totalCustomers: 0,
    totalFlights: 0,
    avgBookingValue: 0,
    occupancyRate: 0,
  };
}

function calculateOccupancyRate(flights) {
  if (!flights.length) return 0;

  const totalOccupancy = flights.reduce((sum, flight) => {
    const totalSeats = flight.aircraft?.totalSeats || flight.totalSeats || 1;
    const bookedSeats = totalSeats - (flight.availableSeats || 0);
    return sum + bookedSeats / totalSeats;
  }, 0);

  return Math.round((totalOccupancy / flights.length) * 100);
}

function generateBasicStats(rawData) {
  if (!rawData) return null;

  const { bookings, flights, users } = rawData;

  return {
    revenueStats: { revenueByMonth: [] },
    bookingStats: {
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(
        (b) => b.status === "CONFIRMED" || b.status === "COMPLETED"
      ).length,
      cancelledBookings: bookings.filter((b) => b.status === "CANCELLED")
        .length,
      pendingBookings: bookings.filter((b) => b.status === "PENDING").length,
    },
    flightStats: {
      totalFlights: flights.length,
      activeFlights: flights.filter(
        (f) => new Date(f.departureTime) > new Date()
      ).length,
      completedFlights: flights.filter(
        (f) => new Date(f.departureTime) < new Date()
      ).length,
      cancelledFlights: flights.filter((f) => f.status === "CANCELLED").length,
    },
    customerStats: {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.active !== false).length,
    },
  };
}

export default useReportsData;
