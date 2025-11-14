"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearch } from "@/contexts/search-context";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, RefreshCw } from "lucide-react";
import { flightApi } from "@/apis/flight-api";
import { airportApi } from "@/apis/airport-api";

export function FlightFlexSearch({
  searchCriteria,
  allFlights = [],
  onDateSelect,
  isReturnSelection = false, // New prop to indicate if selecting return flight
}) {
  const { updateSearchCriteria } = useSearch();
  // Optimized validation check
  const hasValidCriteria = useMemo(() => {
    if (!searchCriteria) return false;

    const extractAirportId = (source) => {
      if (!source) return null;
      return (
        source?.airportId ||
        (typeof source === "string" && source?.match?.(/\b([A-Z]{3})\b/)?.[1])
      );
    };

    const departureId =
      searchCriteria.departureAirportId ||
      extractAirportId(searchCriteria.from) ||
      extractAirportId(searchCriteria.fromLocations?.[0]);

    const arrivalId =
      searchCriteria.arrivalAirportId ||
      extractAirportId(searchCriteria.to) ||
      extractAirportId(searchCriteria.toLocations?.[0]);

    const hasValidIds = Boolean(departureId && arrivalId);
    // console.log('Validation check:', { departureId, arrivalId, hasValidIds, searchCriteria }); // Reduced logging
    return hasValidIds;
  }, [searchCriteria]);

  if (!hasValidCriteria) return null;

  // Optimized state management
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateOffset, setDateOffset] = useState(0);
  const [pricesByDate, setPricesByDate] = useState({});

  // Optimized refs for performance
  const priceCache = useRef(new Map());
  const pendingRequests = useRef(new Set());
  const apiRequests = useRef(new Map());
  const abortController = useRef(new AbortController());
  const swiperRef = useRef(null);
  const lastFetchedCriteria = useRef(null);

  // Simplified trip type detection
  const isRoundTrip = useMemo(() => {
    const tripType = searchCriteria?.tripType?.toUpperCase();
    return (
      tripType === "ROUND_TRIP" ||
      tripType === "ROUNDTRIP" ||
      Boolean(searchCriteria?.returnDate)
    );
  }, [searchCriteria?.tripType, searchCriteria?.returnDate]);

  // Optimized price formatter with memoization
  const formatPrice = useCallback((price) => {
    if (price == null || price === 0) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  // Simplified airport ID extraction
  const getAirportIds = useMemo(() => {
    const extractAirportId = (source) => {
      if (!source) return null;
      if (source.airportId) return source.airportId;
      if (typeof source === "string") {
        const match =
          source.match(/\(([A-Z]{3})\)/) || source.match(/\b([A-Z]{3})\b/);
        return match ? match[1] : null;
      }
      return null;
    };

    // Try to get from flights first, then searchCriteria
    let departureId = null;
    let arrivalId = null;

    if (allFlights && allFlights.length > 0) {
      const flight =
        allFlights.find((f) => f.direction === "outbound" || !f.direction) ||
        allFlights[0];
      if (flight) {
        departureId =
          flight.departureAirport?.airportId || flight.departureAirportId;
        arrivalId = flight.arrivalAirport?.airportId || flight.arrivalAirportId;
      }
    }

    if (!departureId || !arrivalId) {
      departureId =
        searchCriteria?.departureAirportId ||
        extractAirportId(searchCriteria?.from) ||
        extractAirportId(searchCriteria?.fromLocations?.[0]);
      arrivalId =
        searchCriteria?.arrivalAirportId ||
        extractAirportId(searchCriteria?.to) ||
        extractAirportId(searchCriteria?.toLocations?.[0]);
    }

    // Swap for return selection
    if (isReturnSelection) {
      [departureId, arrivalId] = [arrivalId, departureId];
    }

    return {
      departureData: departureId ? { id: departureId } : null,
      arrivalData: arrivalId ? { id: arrivalId } : null,
    };
  }, [searchCriteria, isReturnSelection, allFlights]);

  // Optimized date parser
  const parseDate = useCallback((dateValue) => {
    if (!dateValue) return new Date();

    // Handle string format YYYY-MM-DD
    if (
      typeof dateValue === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
      // Create date in local timezone to avoid timezone issues
      const [year, month, day] = dateValue.split("-").map(Number);
      const date = new Date();
      date.setFullYear(year, month - 1, day);
      date.setHours(12, 0, 0, 0);
      return date;
    }

    // Handle Date object or string
    const parsed = new Date(dateValue);
    if (isNaN(parsed.getTime())) {
      console.warn("Invalid date value:", dateValue);
      return new Date();
    }

    // Ensure we return date in local timezone
    const date = new Date(parsed);
    date.setHours(12, 0, 0, 0);
    return date;
  }, []);

  // Optimized date generation - always 7 days with search date in center
  const generateDates = useMemo(() => {
    // Use returnDate as baseDate when selecting return flight
    const baseDate =
      isReturnSelection && searchCriteria?.returnDate
        ? parseDate(searchCriteria.returnDate)
        : parseDate(searchCriteria?.departDate);

    const returnDate = isRoundTrip
      ? parseDate(searchCriteria?.returnDate)
      : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = [];
    const centerIndex = 3; // Search date always in center

    // Calculate start date (3 days before search date + offset)
    const startDate = new Date(baseDate);
    startDate.setDate(baseDate.getDate() - centerIndex + dateOffset * 7);

    // Prevent going back before today - only allow navigation within future dates
    if (startDate < today) {
      startDate.setTime(today.getTime());
    }

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const formatted =
        currentDate.getFullYear() +
        "-" +
        String(currentDate.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(currentDate.getDate()).padStart(2, "0");
      const display = currentDate.toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

      // For round-trip, calculate return date maintaining the gap (for display only)
      let returnFormatted = null;
      if (isRoundTrip && returnDate) {
        // Calculate original gap between depart and return dates
        const originalGap = Math.ceil(
          (returnDate - baseDate) / (1000 * 60 * 60 * 24)
        );
        const calculatedReturnDate = new Date(currentDate);
        calculatedReturnDate.setDate(currentDate.getDate() + originalGap);
        returnFormatted =
          calculatedReturnDate.getFullYear() +
          "-" +
          String(calculatedReturnDate.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(calculatedReturnDate.getDate()).padStart(2, "0");
      }

      // Check if selected
      const baseFormatted =
        baseDate.getFullYear() +
        "-" +
        String(baseDate.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(baseDate.getDate()).padStart(2, "0");
      const isSelected = formatted === baseFormatted;

      // Always use simple date key for one-way pricing
      const priceKey = formatted;
      const cachedPrice = pricesByDate[priceKey];

      dates.push({
        date: currentDate,
        formatted,
        returnFormatted,
        display,
        isToday:
          currentDate.getFullYear() === today.getFullYear() &&
          currentDate.getMonth() === today.getMonth() &&
          currentDate.getDate() === today.getDate(),
        isSelected,
        price: cachedPrice,
        loading: false,
        error: cachedPrice === undefined,
        priceKey,
      });
    }

    return dates;
  }, [
    searchCriteria?.departDate,
    searchCriteria?.returnDate,
    dateOffset,
    pricesByDate,
    parseDate,
    isRoundTrip,
  ]);

  // Optimized flight price extraction with availability filter
  const extractFlightPrice = useCallback((flight) => {
    // Priority: flightTravelClasses > direct price fields
    if (flight?.flightTravelClasses?.length > 0) {
      const validPrices = flight.flightTravelClasses
        .map((tc) => tc.customPrice || tc.price)
        .filter((price) => price > 0);

      if (validPrices.length > 0) return Math.min(...validPrices);
    }

    // Fallback to direct price fields
    const price = flight?.priceNumeric || flight?.price || flight?.totalPrice;

    if (typeof price === "string") {
      const numPrice = parseFloat(price.replace(/[^\d.]/g, ""));
      return numPrice > 0 ? numPrice : null;
    }

    return price > 0 ? price : null;
  }, []);

  // Optimized flight date parser
  const parseFlightDateStr = useCallback((departureTime) => {
    if (!departureTime) return null;

    const datePart = departureTime.split(" ")[0];
    const parts = datePart.split(/[/.-]/);

    if (parts.length !== 3) return null;

    const [day, month, year] = parts.map(Number);

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`;
    }

    return null;
  }, []);

  // Optimized price extraction from existing flights - always one-way logic
  const getPriceFromAllFlights = useCallback(
    (dateObj) => {
      if (!getAirportIds.departureData?.id || !getAirportIds.arrivalData?.id)
        return null;

      const cacheKey = dateObj.priceKey;
      if (priceCache.current.has(cacheKey)) {
        return priceCache.current.get(cacheKey);
      }

      // Always use one-way logic - filter flights for the specific route and date
      const matchingFlights = allFlights.filter((flight) => {
        const flightDate = parseFlightDateStr(flight.departureTime);
        const depId =
          flight.departureAirport?.airportId || flight.departureAirportId;
        const arrId =
          flight.arrivalAirport?.airportId || flight.arrivalAirportId;

        return (
          flightDate === dateObj.formatted &&
          String(depId) === String(getAirportIds.departureData.id) &&
          String(arrId) === String(getAirportIds.arrivalData.id)
        );
      });

      // Found matching flights for date

      const availablePrices = matchingFlights
        .map(extractFlightPrice)
        .filter(Boolean);
      const minPrice =
        availablePrices.length > 0 ? Math.min(...availablePrices) : null;

      if (minPrice) {
        priceCache.current.set(cacheKey, minPrice);
        // Cached min price for date
      }

      return minPrice;
    },
    [allFlights, extractFlightPrice, parseFlightDateStr, getAirportIds]
  );

  // Optimized API price fetching with batch requests
  const fetchPriceFromAPI = useCallback(
    async (dateObj) => {
      if (!getAirportIds.departureData?.id || !getAirportIds.arrivalData?.id) {
        // Missing airport IDs for API fetch
        return null;
      }

      const requestKey = dateObj.priceKey;

      // Prevent duplicate requests
      if (apiRequests.current.has(requestKey)) {
        // Using cached API request
        return apiRequests.current.get(requestKey);
      }
      if (pendingRequests.current.has(requestKey)) {
        // Request already pending
        return null;
      }

      pendingRequests.current.add(requestKey);

      try {
        let requestBody;

        // Always use one-way API calls - even for round-trip, handle each direction separately
        requestBody = {
          routes: [
            {
              departureAirportId: parseInt(getAirportIds.departureData.id),
              arrivalAirportId: parseInt(getAirportIds.arrivalData.id),
              date: dateObj.formatted,
            },
          ],
          dateRangeDays: 0,
        };

        // Calling compare-prices API
        const response = await flightApi.compareFlightPrices(requestBody);
        // API response received

        if (response?.success && response.data?.prices?.length > 0) {
          // Always extract one-way price - get minPrice for the specific route and date
          const matchingPrice = response.data.prices.find(
            (p) =>
              p.date === dateObj.formatted &&
              p.departureAirportId ===
                parseInt(getAirportIds.departureData.id) &&
              p.arrivalAirportId === parseInt(getAirportIds.arrivalData.id)
          );

          const price =
            matchingPrice?.minPrice ||
            response.data.prices[0]?.minPrice ||
            null;

          // Extracted price from API response

          // Cache the result
          if (price !== null) {
            apiRequests.current.set(requestKey, price);
          }
          return price;
        }

        // No prices found in API response
        return null;
      } catch (error) {
        console.error("API price fetch error:", error);
        return null;
      } finally {
        pendingRequests.current.delete(requestKey);
      }
    },
    [isRoundTrip, getAirportIds]
  );

  // Optimized price update function
  const updatePrices = useCallback(async () => {
    if (
      !dates.length ||
      loading ||
      !getAirportIds.departureData?.id ||
      !getAirportIds.arrivalData?.id
    ) {
      if (!getAirportIds.departureData?.id || !getAirportIds.arrivalData?.id) {
        setError(
          "Thiếu thông tin sân bay. Vui lòng chọn lại điểm đi và điểm đến."
        );
      }
      return;
    }

    // console.log('Starting price update for dates:', dates.map(d => d.formatted)); // Reduced logging
    setLoading(true);
    setError(null);

    // Cancel previous requests
    abortController.current.abort();
    abortController.current = new AbortController();

    // Set all dates to loading first
    const loadingDates = dates.map((dateObj) => ({
      ...dateObj,
      loading: dateObj.price === undefined,
      error: false,
    }));
    setDates(loadingDates);

    // Prioritize API calls for accurate pricing - fetch all dates from API
    const datesToFetch = dates.filter((d) => d.price === undefined);

    if (datesToFetch.length > 0) {
      // Fetching prices from API

      // Process in smaller batches for better performance
      const batchSize = 2;

      for (let i = 0; i < datesToFetch.length; i += batchSize) {
        const batch = datesToFetch.slice(i, i + batchSize);
        // Processing batch

        const batchResults = await Promise.all(
          batch.map(async (dateObj) => {
            try {
              // Fetching price for date
              const price = await fetchPriceFromAPI(dateObj);

              // Fallback to existing flights if API fails
              if (price === null) {
                // API failed, trying existing flights
                const fallbackPrice = getPriceFromAllFlights(dateObj);
                return {
                  priceKey: dateObj.priceKey,
                  price: fallbackPrice,
                  error: fallbackPrice === null,
                };
              }

              return { priceKey: dateObj.priceKey, price, error: false };
            } catch (error) {
              console.error(
                "Price fetch error for",
                dateObj.formatted,
                ":",
                error
              );
              // Try fallback
              const fallbackPrice = getPriceFromAllFlights(dateObj);
              return {
                priceKey: dateObj.priceKey,
                price: fallbackPrice,
                error: fallbackPrice === null,
              };
            }
          })
        );

        // Batch results processed

        // Update state with batch results
        setDates((prev) =>
          prev.map((d) => {
            const result = batchResults.find((r) => r.priceKey === d.priceKey);
            if (!result) return d;

            if (result.price !== null) {
              setPricesByDate((prevPrices) => ({
                ...prevPrices,
                [d.priceKey]: result.price,
              }));
            }

            return {
              ...d,
              price: result.price,
              loading: false,
              error: result.error,
            };
          })
        );

        // Small delay between batches
        if (i + batchSize < datesToFetch.length) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    } else {
      // console.log('No dates to fetch, all prices already cached'); // Reduced logging
    }

    setLoading(false);
  }, [
    dates,
    loading,
    getPriceFromAllFlights,
    fetchPriceFromAPI,
    getAirportIds,
  ]);

  // Improved validation with stable comparison
  const shouldUpdatePrices = useMemo(() => {
    if (!dates.length) return false;

    // Create stable criteria object
    const criteriaObj = {
      dep: getAirportIds.departureData?.id,
      arr: getAirportIds.arrivalData?.id,
      departDate:
        searchCriteria?.departDate?.toISOString?.()?.split("T")[0] ||
        searchCriteria?.departDate,
      returnDate:
        searchCriteria?.returnDate?.toISOString?.()?.split("T")[0] ||
        searchCriteria?.returnDate,
      tripType: searchCriteria?.tripType,
      isReturn: isReturnSelection,
    };

    const criteriaStr = JSON.stringify(criteriaObj);

    // Check if criteria actually changed
    const criteriaChanged = criteriaStr !== lastFetchedCriteria.current;
    const hasMissingPrices = dates.some((d) => d.price === undefined);

    if (criteriaChanged) {
      // Criteria changed - should update prices
      // console.log('Old:', lastFetchedCriteria.current); // Reduced logging
      // console.log('New:', criteriaStr); // Reduced logging
      lastFetchedCriteria.current = criteriaStr;
      return true;
    }

    if (hasMissingPrices) {
      // Missing prices detected
      return true;
    }

    return false;
  }, [
    dates.length,
    getAirportIds,
    searchCriteria?.departDate,
    searchCriteria?.returnDate,
    searchCriteria?.tripType,
    isReturnSelection,
  ]);

  // Initialize dates and handle selection - use ref to prevent loops
  const prevIsReturnSelectionRef = useRef(isReturnSelection);

  useEffect(() => {
    // Generating new dates for selection mode
    setDates(generateDates);

    // Auto-select based on search criteria
    const targetDate = generateDates.find((d) => d.isSelected);
    if (targetDate) {
      setSelectedDate(targetDate);

      // Auto-scroll to selected date
      const selectedIndex = generateDates.findIndex((d) => d.isSelected);
      if (selectedIndex !== -1 && swiperRef.current) {
        setTimeout(() => swiperRef.current?.slideTo(selectedIndex), 100);
      }
    }

    // Reset date offset when switching selection modes
    if (prevIsReturnSelectionRef.current !== isReturnSelection) {
      setDateOffset(0);
      prevIsReturnSelectionRef.current = isReturnSelection;
    }
  }, [generateDates]); // Remove isReturnSelection from deps to prevent loop

  // Update prices when criteria changes - with debounce
  useEffect(() => {
    if (shouldUpdatePrices) {
      const timer = setTimeout(() => {
        updatePrices();
      }, 50); // Reduced debounce to improve responsiveness

      return () => clearTimeout(timer);
    }
  }, [shouldUpdatePrices, updatePrices]);

  // CRITICAL: Handle return selection changes - clear cache and refresh
  useEffect(() => {
    // Selection mode effect triggered

    // Clear all caches when switching between outbound/return selection
    priceCache.current.clear();
    apiRequests.current.clear();
    pendingRequests.current.clear();
    setPricesByDate({});

    // DON'T call updatePrices directly here to avoid infinite loop
    // Let shouldUpdatePrices handle the refresh logic
  }, [isReturnSelection]); // Remove updatePrices from dependencies

  // Handle search criteria changes - this is handled by shouldUpdatePrices already
  // Removed to prevent infinite loops

  // Cleanup on unmount
  useEffect(() => () => abortController.current?.abort(), []);

  // Find overall min price for highlighting
  const minOverallPrice = useMemo(() => {
    const validPrices = dates.map((d) => d.price).filter((price) => price > 0);
    return validPrices.length > 0 ? Math.min(...validPrices) : null;
  }, [dates]);

  // Optimized refresh handler
  const handleRefresh = useCallback(() => {
    // Refreshing prices - clearing all caches
    priceCache.current.clear();
    apiRequests.current.clear();
    pendingRequests.current.clear();
    setPricesByDate({});
    setError(null);
    updatePrices();
  }, [updatePrices]);

  // Optimized date selection handler - handles both outbound and return selection
  const handleDateSelect = useCallback(
    (dateObj) => {
      setSelectedDate(dateObj);

      // Date selected

      const newCriteria = { ...searchCriteria };

      if (isReturnSelection) {
        // Selecting return flight date
        newCriteria.returnDate = new Date(dateObj.formatted + "T12:00:00");
        // Updated return date
      } else {
        // Selecting outbound flight date
        newCriteria.departDate = new Date(dateObj.formatted + "T12:00:00");
        // Updated departure date

        // Maintain return date if it exists for round-trip
        if (isRoundTrip && dateObj.returnFormatted) {
          newCriteria.returnDate = new Date(
            dateObj.returnFormatted + "T12:00:00"
          );
        }
      }

      // Final search criteria updated
      updateSearchCriteria(newCriteria);
      localStorage.setItem("searchCriteria", JSON.stringify(newCriteria));

      // Callback with appropriate data structure
      if (isRoundTrip) {
        onDateSelect?.({
          departDate: newCriteria.departDate
            ? newCriteria.departDate.toISOString().split("T")[0]
            : searchCriteria.departDate,
          returnDate: newCriteria.returnDate
            ? newCriteria.returnDate.toISOString().split("T")[0]
            : null,
          isReturnSelection,
        });
      } else {
        onDateSelect?.(dateObj.date);
      }
    },
    [
      isRoundTrip,
      onDateSelect,
      searchCriteria,
      updateSearchCriteria,
      isReturnSelection,
    ]
  );

  // Optimized navigation with bounds checking
  const moveDateRange = useCallback(
    (direction) => {
      const newOffset = dateOffset + (direction === "prev" ? -1 : 1);
      if (newOffset >= 0 && newOffset <= 12) {
        setDateOffset(newOffset);
        setSelectedDate(null);
      }
    },
    [dateOffset]
  );

  return (
    <div className="w-full bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/10 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
      <div className="p-6 border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-blue-600/5 to-indigo-600/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {isReturnSelection
                  ? "Chọn ngày về linh hoạt"
                  : "Chọn ngày khởi hành linh hoạt"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isReturnSelection
                  ? "So sánh giá vé ngày về để tìm chuyến bay giá rẻ nhất"
                  : "So sánh giá vé theo ngày để tìm chuyến bay giá rẻ nhất"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline font-medium">Làm mới</span>
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="relative">
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveDateRange("prev")}
              disabled={dateOffset === 0}
              className="bg-white/95 hover:bg-white shadow-lg border-gray-300 dark:border-gray-600 h-10 w-10 p-0 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </Button>
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveDateRange("next")}
              disabled={dateOffset >= 12}
              className="bg-white/95 hover:bg-white shadow-lg border-gray-300 dark:border-gray-600 h-10 w-10 p-0 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </Button>
          </div>

          <Swiper
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            modules={[Pagination]}
            spaceBetween={16}
            slidesPerView={1}
            pagination={{
              clickable: true,
              el: ".swiper-pagination",
              bulletClass:
                "swiper-pagination-bullet !bg-gray-300 dark:!bg-gray-600",
              bulletActiveClass: "swiper-pagination-bullet-active !bg-blue-600",
            }}
            breakpoints={{
              640: { slidesPerView: 3 },
              768: { slidesPerView: 5 },
              1024: { slidesPerView: 7 },
            }}
            className="pb-10 px-14"
          >
            {dates.map((dateObj, index) => (
              <SwiperSlide key={`${dateObj.formatted}-${index}`}>
                <Card
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-0 shadow-md ${
                    selectedDate?.formatted === dateObj.formatted ||
                    dateObj.isSelected
                      ? "ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-blue-200 dark:shadow-blue-900/50"
                      : dateObj.error
                      ? "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20"
                      : dateObj.price && dateObj.price === minOverallPrice
                      ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30"
                      : "hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50/50 dark:hover:from-gray-700 dark:hover:to-blue-900/20 bg-white dark:bg-gray-800"
                  }`}
                  onClick={() => handleDateSelect(dateObj)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {dateObj.display}
                    </div>

                    {dateObj.loading ? (
                      <div className="flex justify-center py-3">
                        <div className="animate-pulse h-5 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                      </div>
                    ) : dateObj.error ||
                      !dateObj.price ||
                      dateObj.price === 0 ? (
                      <div className="text-xs text-red-600 dark:text-red-400 py-3 font-medium">
                        Không có chuyến
                      </div>
                    ) : (
                      <div
                        className={`text-lg font-bold py-1 ${
                          dateObj.price === minOverallPrice
                            ? "text-green-600 dark:text-green-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {formatPrice(dateObj.price)}
                      </div>
                    )}

                    <div className="flex justify-center gap-1 mt-2">
                      {dateObj.isToday && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                        >
                          Hôm nay
                        </Badge>
                      )}
                      {dateObj.price && dateObj.price === minOverallPrice && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800"
                        >
                          Rẻ nhất
                        </Badge>
                      )}
                      {(selectedDate?.formatted === dateObj.formatted ||
                        dateObj.isSelected) && (
                        <Badge
                          variant="default"
                          className="text-xs px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                          Đã chọn
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="swiper-pagination flex justify-center mt-6"></div>
        </div>

        {loading && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Đang tải giá vé cho các ngày...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 rounded-xl border border-red-200/50 dark:border-red-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-red-100 dark:bg-red-900/50 rounded-full">
                  <svg
                    className="h-4 w-4 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="text-xs border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
              >
                Thử lại
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}