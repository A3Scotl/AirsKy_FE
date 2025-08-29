// Performance optimization utilities for booking management

import { useMemo, useCallback, useState, useEffect } from "react";

// Debounce hook for search functionality
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized booking filter function
export const useBookingFilters = (bookings, searchQuery, filters) => {
  return useMemo(() => {
    return bookings.filter((booking) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        booking.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.route.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        !filters.status ||
        filters.status === "all" ||
        booking.status.toLowerCase() === filters.status.toLowerCase();

      // Class filter
      const matchesClass =
        !filters.class ||
        filters.class === "all" ||
        booking.class.toLowerCase() === filters.class.toLowerCase();

      // Passenger filter
      const matchesPassengers =
        !filters.passengers ||
        filters.passengers === "all" ||
        (filters.passengers === "4+" && booking.passengers >= 4) ||
        (filters.passengers !== "4+" &&
          booking.passengers === parseInt(filters.passengers));

      // Date range filter
      const matchesDateRange =
        !filters.dateRange ||
        (() => {
          const bookingDate = new Date(booking.departure);
          const { start, end } = filters.dateRange;
          return bookingDate >= start && bookingDate <= end;
        })();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesClass &&
        matchesPassengers &&
        matchesDateRange
      );
    });
  }, [bookings, searchQuery, filters]);
};

// Memoized pagination logic
export const usePagination = (data, currentPage, itemsPerPage) => {
  return useMemo(() => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      paginatedData,
      totalPages,
      totalItems: data.length,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, data.length),
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [data, currentPage, itemsPerPage]);
};

// Optimized sorting function
export const useSortedData = (data, sortConfig) => {
  return useMemo(() => {
    if (!sortConfig.key) return data;

    const sortedData = [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;

      // Handle different data types
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sortedData;
  }, [data, sortConfig]);
};

// Helper function to get nested object values
const getNestedValue = (obj, path) => {
  return path.split(".").reduce((current, key) => current?.[key], obj);
};

// Memoized booking statistics
export const useBookingStats = (bookings) => {
  return useMemo(() => {
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(
      (b) => b.status === "Confirmed"
    ).length;
    const pendingBookings = bookings.filter(
      (b) => b.status === "Pending"
    ).length;
    const cancelledBookings = bookings.filter(
      (b) => b.status === "Cancelled"
    ).length;

    const totalRevenue = bookings
      .filter((b) => b.status === "Confirmed")
      .reduce((sum, booking) => {
        const amount = parseFloat(booking.amount.replace(/[^0-9.-]+/g, ""));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    const totalPassengers = bookings
      .filter((b) => b.status === "Confirmed")
      .reduce((sum, booking) => sum + booking.passengers, 0);

    const averageBookingValue =
      confirmedBookings > 0 ? totalRevenue / confirmedBookings : 0;

    const confirmedRate =
      totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;
    const cancellationRate =
      totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    const bookingsByClass = {
      Economy: bookings.filter((b) => b.class === "Economy").length,
      Business: bookings.filter((b) => b.class === "Business").length,
      First: bookings.filter((b) => b.class === "First").length,
    };

    const bookingsByRoute = bookings.reduce((acc, booking) => {
      acc[booking.route] = (acc[booking.route] || 0) + 1;
      return acc;
    }, {});

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue,
      totalPassengers,
      averageBookingValue,
      confirmedRate,
      cancellationRate,
      bookingsByClass,
      bookingsByRoute,
    };
  }, [bookings]);
};

// Callback hooks for performance optimization
export const useOptimizedHandlers = (setters) => {
  const handlers = {};

  Object.keys(setters).forEach((key) => {
    handlers[key] = useCallback(
      (...args) => {
        setters[key](...args);
      },
      [setters[key]]
    );
  });

  return handlers;
};
