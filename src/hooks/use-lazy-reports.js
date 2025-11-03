import { useQuery, useQueryClient } from "@tanstack/react-query";
import { flightApi } from "@/apis/flight-api";
import { bookingApi } from "@/apis/booking-api";
import { userApi } from "@/apis/user-api";
import { useMemo, useCallback } from "react";

/**
 * Lazy loading hook for reports - only loads data when needed per tab
 */
export const useLazyReports = (dateRange, period = "30days") => {
  const queryClient = useQueryClient();

  // Helper to get days from period
  const getDaysFromPeriod = (period) => {
    switch (period) {
      case "7days":
        return 7;
      case "30days":
        return 30;
      case "90days":
        return 90;
      default:
        return 30;
    }
  };

  // Calculate optimized batch size
  const getBatchSize = (dateRange, period) => {
    const now = new Date();
    const fromDate =
      dateRange?.from ||
      new Date(now.getTime() - getDaysFromPeriod(period) * 24 * 60 * 60 * 1000);
    const toDate = dateRange?.to || now;
    const daysDiff = Math.ceil(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.min(Math.max(150, daysDiff * 8), 1000);
  };

  // Cache key generator
  const generateCacheKey = (type, dateRange, period) => {
    const from = dateRange?.from
      ? new Date(dateRange.from).toDateString()
      : null;
    const to = dateRange?.to ? new Date(dateRange.to).toDateString() : null;
    return ["lazy-reports", type, from, to, period || "30days"];
  };

  // 1. REVENUE DATA HOOK
  const useRevenueData = (enabled = false) => {
    return useQuery({
      queryKey: generateCacheKey("revenue", dateRange, period),
      queryFn: async () => {
        console.log("Loading Revenue data...");
        const startTime = performance.now();
        const batchSize = getBatchSize(dateRange, period);

        const now = new Date();
        const fromDate =
          dateRange?.from ||
          new Date(
            now.getTime() - getDaysFromPeriod(period) * 24 * 60 * 60 * 1000
          );
        const toDate = dateRange?.to || now;

        const bookingsResult = await bookingApi.getAllBookings({
          page: 0,
          size: batchSize,
          sort: "createdAt,desc",
        });

        const allBookings = bookingsResult.data?.content || [];
        const filteredBookings = allBookings.filter((booking) => {
          const bookingDate = new Date(
            booking.createdAt || booking.bookingDate || ""
          );
          return bookingDate >= fromDate && bookingDate <= toDate;
        });

        const endTime = performance.now();
        console.log(`Revenue data loaded in ${endTime - startTime}ms`);

        return {
          bookings: filteredBookings,
          totalBookings: filteredBookings.length,
          rawData: {
            ...bookingsResult.data,
            content: filteredBookings,
            totalElements: filteredBookings.length,
          },
          type: "revenue",
          loadTime: endTime - startTime,
        };
      },
      enabled,
      staleTime: 5 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
      retry: 2,
    });
  };

  // 2. BOOKINGS DATA HOOK
  const useBookingsData = (enabled = false) => {
    return useQuery({
      queryKey: generateCacheKey("bookings", dateRange, period),
      queryFn: async () => {
        console.log("Loading Bookings data...");
        const startTime = performance.now();
        const batchSize = getBatchSize(dateRange, period);

        const now = new Date();
        const fromDate =
          dateRange?.from ||
          new Date(
            now.getTime() - getDaysFromPeriod(period) * 24 * 60 * 60 * 1000
          );
        const toDate = dateRange?.to || now;

        const bookingsResult = await bookingApi.getAllBookings({
          page: 0,
          size: batchSize,
          sort: "createdAt,desc",
        });

        const allBookings = bookingsResult.data?.content || [];
        const filteredBookings = allBookings.filter((booking) => {
          const bookingDate = new Date(
            booking.createdAt || booking.bookingDate || ""
          );
          return bookingDate >= fromDate && bookingDate <= toDate;
        });

        const endTime = performance.now();
        console.log(`Bookings data loaded in ${endTime - startTime}ms`);

        return {
          bookings: filteredBookings,
          totalBookings: filteredBookings.length,
          rawData: {
            ...bookingsResult.data,
            content: filteredBookings,
            totalElements: filteredBookings.length,
          },
          type: "bookings",
          loadTime: endTime - startTime,
        };
      },
      enabled,
      staleTime: 5 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
      retry: 2,
    });
  };

  // 3. CUSTOMERS DATA HOOK
  const useCustomersData = (enabled = false) => {
    return useQuery({
      queryKey: generateCacheKey("customers", dateRange, period),
      queryFn: async () => {
        console.log("Loading Customers data...");
        const startTime = performance.now();
        const batchSize = getBatchSize(dateRange, period);

        const usersResult = await userApi.getAllUsers({
          page: 0,
          size: batchSize,
        });

        const endTime = performance.now();
        console.log(`Customers data loaded in ${endTime - startTime}ms`);

        return {
          users: usersResult.data?.content || [],
          totalUsers: usersResult.data?.totalElements || 0,
          rawData: usersResult.data || {},
          type: "customers",
          loadTime: endTime - startTime,
        };
      },
      enabled,
      staleTime: 10 * 60 * 1000,
      cacheTime: 20 * 60 * 1000,
      retry: 2,
    });
  };

  // 4. FLIGHTS DATA HOOK
  const useFlightsData = (enabled = false) => {
    return useQuery({
      queryKey: generateCacheKey("flights", dateRange, period),
      queryFn: async () => {
        console.log("Loading Flights data...");
        const startTime = performance.now();
        const batchSize = getBatchSize(dateRange, period);

        const now = new Date();
        const fromDate =
          dateRange?.from ||
          new Date(
            now.getTime() - getDaysFromPeriod(period) * 24 * 60 * 60 * 1000
          );
        const toDate = dateRange?.to || now;

        const flightsResult = await flightApi.getAllFlights({
          page: 0,
          size: batchSize,
          sort: "departureTime,desc",
        });

        const allFlights = flightsResult.data?.content || [];
        const filteredFlights = allFlights.filter((flight) => {
          const flightDate = new Date(
            flight.createdAt || flight.departureTime || ""
          );
          return flightDate >= fromDate && flightDate <= toDate;
        });

        const endTime = performance.now();
        console.log(`Flights data loaded in ${endTime - startTime}ms`);

        return {
          flights: filteredFlights,
          totalFlights: filteredFlights.length,
          rawData: {
            ...flightsResult.data,
            content: filteredFlights,
            totalElements: filteredFlights.length,
          },
          type: "flights",
          loadTime: endTime - startTime,
        };
      },
      enabled,
      staleTime: 5 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
      retry: 2,
    });
  };

  // 5. EXPORT DATA HOOK - Full data for export with pagination
  const useExportData = (type, enabled = false) => {
    return useQuery({
      queryKey: generateCacheKey(`${type}-export`, null, "alldata"),
      queryFn: async () => {
        console.log(`Loading ALL ${type} data for export...`);
        const startTime = performance.now();

        let allData = [];
        let page = 0;
        const pageSize = 5000; // Smaller page size for reliability
        let hasMore = true;

        try {
          while (hasMore) {
            let result;
            if (type === "bookings") {
              result = await bookingApi.getAllBookings({
                page: page,
                size: pageSize,
                sort: "createdAt,desc",
              });
            } else if (type === "customers") {
              result = await userApi.getAllUsers({
                page: page,
                size: pageSize,
                sort: "createdAt,desc",
              });
            } else if (type === "flights") {
              result = await flightApi.getAllFlights({
                page: page,
                size: pageSize,
                sort: "departureTime,desc",
              });
            }

            const pageData = result.data?.content || [];
            allData = [...allData, ...pageData];

            // Check if we have more pages
            const totalElements = result.data?.totalElements || 0;
            const currentLoaded = (page + 1) * pageSize;

            hasMore =
              currentLoaded < totalElements && pageData.length === pageSize;
            page++;

            // Safety break to prevent infinite loops
            if (page > 100) {
              // Max 500,000 records
              console.warn(`Reached maximum page limit for ${type} export`);
              break;
            }
          }

          console.log(`Loaded ${allData.length} ${type} records for export`);

          if (type === "bookings") {
            return {
              bookings: allData,
              totalBookings: allData.length,
              rawData: { content: allData, totalElements: allData.length },
              type: "bookings",
              loadTime: performance.now() - startTime,
            };
          }

          if (type === "customers") {
            return {
              users: allData,
              totalUsers: allData.length,
              rawData: { content: allData, totalElements: allData.length },
              type: "customers",
              loadTime: performance.now() - startTime,
            };
          }

          if (type === "flights") {
            return {
              flights: allData,
              totalFlights: allData.length,
              rawData: { content: allData, totalElements: allData.length },
              type: "flights",
              loadTime: performance.now() - startTime,
            };
          }
        } catch (error) {
          console.error(`Error loading ${type} data:`, error);
          // Fallback to single page load
          let result;
          if (type === "bookings") {
            result = await bookingApi.getAllBookings({
              page: 0,
              size: 10000,
              sort: "createdAt,desc",
            });
            return {
              bookings: result.data?.content || [],
              totalBookings: result.data?.totalElements || 0,
              rawData: result.data,
              type: "bookings",
              loadTime: performance.now() - startTime,
            };
          }

          if (type === "customers") {
            result = await userApi.getAllUsers({
              page: 0,
              size: 10000,
              sort: "createdAt,desc",
            });
            return {
              users: result.data?.content || [],
              totalUsers: result.data?.totalElements || 0,
              rawData: result.data,
              type: "customers",
              loadTime: performance.now() - startTime,
            };
          }

          if (type === "flights") {
            result = await flightApi.getAllFlights({
              page: 0,
              size: 10000,
              sort: "departureTime,desc",
            });
            return {
              flights: result.data?.content || [],
              totalFlights: result.data?.totalElements || 0,
              rawData: result.data,
              type: "flights",
              loadTime: performance.now() - startTime,
            };
          }
        }

        throw new Error(`Unknown export type: ${type}`);
      },
      enabled,
      staleTime: 0,
      cacheTime: 5 * 60 * 1000,
      retry: 2,
    });
  };

  // 6. OVERVIEW DATA HOOK
  const useOverviewData = (enabled = false) => {
    return useQuery({
      queryKey: generateCacheKey("overview", dateRange, period),
      queryFn: async () => {
        console.log("Loading Overview data...");
        const startTime = performance.now();
        const batchSize = Math.min(getBatchSize(dateRange, period), 300);

        const now = new Date();
        const fromDate =
          dateRange?.from ||
          new Date(
            now.getTime() - getDaysFromPeriod(period) * 24 * 60 * 60 * 1000
          );
        const toDate = dateRange?.to || now;

        const [bookingsResult, flightsResult, usersResult] =
          await Promise.allSettled([
            bookingApi.getAllBookings({
              page: 0,
              size: batchSize,
              sort: "createdAt,desc",
            }),
            flightApi.getAllFlights({
              page: 0,
              size: batchSize,
              sort: "departureTime,desc",
            }),
            userApi.getAllUsers({ page: 0, size: Math.min(batchSize, 200) }),
          ]);

        const allBookings =
          bookingsResult.status === "fulfilled"
            ? bookingsResult.value.data?.content || []
            : [];
        const filteredBookings = allBookings.filter((b) => {
          const d = new Date(b.createdAt || b.bookingDate || "");
          return d >= fromDate && d <= toDate;
        });

        const allFlights =
          flightsResult.status === "fulfilled"
            ? flightsResult.value.data?.content || []
            : [];
        const filteredFlights = allFlights.filter((f) => {
          const d = new Date(f.createdAt || f.departureTime || "");
          return d >= fromDate && d <= toDate;
        });

        const allUsers =
          usersResult.status === "fulfilled"
            ? usersResult.value.data?.content || []
            : [];

        const endTime = performance.now();
        console.log(`Overview data loaded in ${endTime - startTime}ms`);

        return {
          bookings: filteredBookings,
          flights: filteredFlights,
          users: allUsers,
          totalBookings: filteredBookings.length,
          totalFlights: filteredFlights.length,
          totalUsers: allUsers.length,
          rawData: {
            bookings: {
              ...(bookingsResult.status === "fulfilled"
                ? bookingsResult.value.data
                : {}),
              content: filteredBookings,
            },
            flights: {
              ...(flightsResult.status === "fulfilled"
                ? flightsResult.value.data
                : {}),
              content: filteredFlights,
            },
            users:
              usersResult.status === "fulfilled"
                ? usersResult.value.data
                : null,
          },
          type: "overview",
          loadTime: endTime - startTime,
        };
      },
      enabled,
      staleTime: 3 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 2,
    });
  };

  // Prefetch helper
  const prefetchData = useCallback(
    (type) => {
      const cacheKey = generateCacheKey(type, dateRange, period);
      if (!queryClient.getQueryData(cacheKey)) {
        console.log(`Prefetching ${type} data...`);
        queryClient.prefetchQuery({
          queryKey: cacheKey,
          queryFn: async () => {
            const batchSize = getBatchSize(dateRange, period);
            if (type === "revenue" || type === "bookings") {
              return bookingApi.getAllBookings({ page: 0, size: batchSize });
            }
            return null;
          },
          staleTime: 5 * 60 * 1000,
        });
      }
    },
    [queryClient, dateRange, period]
  );

  return {
    useRevenueData,
    useBookingsData,
    useCustomersData,
    useFlightsData,
    useExportData,
    useOverviewData,
    prefetchData,
    getBatchSize: () => getBatchSize(dateRange, period),
    clearCache: () => queryClient.removeQueries({ queryKey: ["lazy-reports"] }),
  };
};
