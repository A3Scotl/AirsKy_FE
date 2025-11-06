"use client";

import { useState, useEffect, useCallback, useMemo, useRef, startTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, RefreshCw } from "lucide-react";
import { flightApi } from "@/apis/flight-api";
import { Skeleton } from "@/components/ui/skeleton";

const FlexSearchSkeleton = () => (
  <Card className="h-full">
    <CardContent className="p-4 text-center flex flex-col justify-between h-full">
      <Skeleton className="h-5 w-20 mx-auto mb-2" />
      <Skeleton className="h-6 w-24 mx-auto" />
    </CardContent>
  </Card>
);

export function FlightFlexSearch({
  searchCriteria,
  allFlights = [],
  onDateSelect,
  isReturnSelection = false,
}) {
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

    return Boolean(departureId && arrivalId);
  }, [searchCriteria]);

  if (!hasValidCriteria) return null;

  // Optimized state management
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateOffset, setDateOffset] = useState(0);
  const [pricesByDate, setPricesByDate] = useState({});

  // Optimized refs for performance
  const pendingRequests = useRef(new Set());
  const apiRequests = useRef(new Map());
  const abortController = useRef(new AbortController());
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
    if (price == null || price === 0) return "--";
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

    const date = new Date(parsed);
    date.setHours(12, 0, 0, 0);
    return date;
  }, []);

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

  // Pre-populate pricesByDate from allFlights (one-time computation per change)
  useEffect(() => {
    const depId = getAirportIds.departureData?.id;
    const arrId = getAirportIds.arrivalData?.id;
    if (!depId || !arrId || allFlights.length === 0) return;

    const newPrices = {};
    allFlights.forEach((flight) => {
      const dateStr = parseFlightDateStr(flight.departureTime);
      if (!dateStr) return;

      const flightDepId = flight.departureAirport?.airportId || flight.departureAirportId;
      const flightArrId = flight.arrivalAirport?.airportId || flight.arrivalAirportId;

      if (
        String(flightDepId) === String(depId) &&
        String(flightArrId) === String(arrId)
      ) {
        const price = extractFlightPrice(flight);
        if (price > 0) {
          if (!newPrices[dateStr] || price < newPrices[dateStr]) {
            newPrices[dateStr] = price;
          }
        }
      }
    });

    startTransition(() => {
      setPricesByDate((prev) => ({ ...prev, ...newPrices }));
    });
  }, [allFlights, getAirportIds, parseFlightDateStr, extractFlightPrice]);

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

  // Optimized batch API price fetching (single call for multiple dates)
  const fetchMultiplePricesFromAPI = useCallback(
    async (dateObjs) => {
      if (!getAirportIds.departureData?.id || !getAirportIds.arrivalData?.id) {
        return dateObjs.map((d) => ({ priceKey: d.priceKey, price: null }));
      }

      const requestKey = dateObjs.map((d) => d.priceKey).sort().join("-");
      if (apiRequests.current.has(requestKey)) {
        return apiRequests.current.get(requestKey);
      }
      if (pendingRequests.current.has(requestKey)) {
        return null;
      }

      pendingRequests.current.add(requestKey);

      try {
        const routes = dateObjs.map((dateObj) => ({
          departureAirportId: parseInt(getAirportIds.departureData.id),
          arrivalAirportId: parseInt(getAirportIds.arrivalData.id),
          date: dateObj.formatted,
        }));

        const requestBody = {
          routes,
          dateRangeDays: 0,
        };

        const response = await flightApi.compareFlightPrices(requestBody);

        if (response?.success && response.data?.prices?.length > 0) {
          const priceMap = new Map(
            response.data.prices.map((p) => [
              `${p.date}-${p.departureAirportId}-${p.arrivalAirportId}`,
              p.minPrice,
            ])
          );

          const results = dateObjs.map((dateObj) => {
            const key = `${dateObj.formatted}-${getAirportIds.departureData.id}-${getAirportIds.arrivalData.id}`;
            const price = priceMap.get(key) || null;
            return { priceKey: dateObj.priceKey, price };
          });

          apiRequests.current.set(requestKey, results);
          return results;
        }

        return dateObjs.map((d) => ({ priceKey: d.priceKey, price: null }));
      } catch (error) {
        console.error("Batch API price fetch error:", error);
        return dateObjs.map((d) => ({ priceKey: d.priceKey, price: null }));
      } finally {
        pendingRequests.current.delete(requestKey);
      }
    },
    [getAirportIds]
  );

  // Optimized price update function (single API call, single state update via deps)
  const updatePrices = useCallback(
    async (datesToFetch) => {
      if (
        !datesToFetch.length ||
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

      setLoading(true);
      setError(null);

      // Cancel previous requests
      abortController.current.abort();
      abortController.current = new AbortController();

      const results = await fetchMultiplePricesFromAPI(datesToFetch);

      // Collect new prices and update cache (triggers generateDates recompute once)
      // Always set price to null if no valid price to avoid infinite loops
      const newPrices = {};
      results.forEach((r) => {
        newPrices[r.priceKey] = r.price ?? null;
      });

      startTransition(() => {
        setPricesByDate((prev) => ({ ...prev, ...newPrices }));
      });

      setLoading(false);
    },
    [loading, fetchMultiplePricesFromAPI, getAirportIds]
  );

  // Initialize dates and handle selection - use ref to prevent loops
  const prevIsReturnSelectionRef = useRef(isReturnSelection);

  useEffect(() => {
    // Reset date offset when switching selection modes
    if (prevIsReturnSelectionRef.current !== isReturnSelection) {
      setDateOffset(0);
      prevIsReturnSelectionRef.current = isReturnSelection;
    }

    startTransition(() => {
      setDates(generateDates);
    });
  }, [generateDates, isReturnSelection]);

  // Effect for criteria changes: clear caches when criteria change
  useEffect(() => {
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

    if (criteriaChanged) {
      lastFetchedCriteria.current = criteriaStr;
      apiRequests.current.clear();
      pendingRequests.current.clear();
      setPricesByDate({});
    }
  }, [
    getAirportIds,
    searchCriteria?.departDate,
    searchCriteria?.returnDate,
    searchCriteria?.tripType,
    isReturnSelection,
  ]);

  // Effect for fetching missing prices when dates change
  useEffect(() => {
    if (dates.length === 0) return;

    const missing = dates.filter((d) => d.price === undefined);
    if (missing.length > 0 && !loading) {
      const timer = setTimeout(() => {
        updatePrices(missing);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [dates, loading, updatePrices]);

  // Cleanup on unmount
  useEffect(() => () => abortController.current?.abort(), []);

  // Find overall min price for highlighting
  const minOverallPrice = useMemo(() => {
    const validPrices = dates.map((d) => d.price).filter((price) => price > 0);
    return validPrices.length > 0 ? Math.min(...validPrices) : null;
  }, [dates]);

  // Optimized refresh handler
  const handleRefresh = useCallback(() => {
    // Refreshing prices - clearing caches
    apiRequests.current.clear();
    pendingRequests.current.clear();
    setPricesByDate({});
    setError(null);
  }, []);

  // Optimized date selection handler - handles both outbound and return selection
  const handleDateSelect = useCallback(
    (dateObj) => {
      const selectedDate = dateObj.date.toISOString().split("T")[0];
      if (isRoundTrip) {
        if (isReturnSelection) {
          onDateSelect?.({
            departDate: searchCriteria.departDate,
            returnDate: selectedDate,
          });
        } else {
          onDateSelect?.({
            departDate: selectedDate,
            returnDate: searchCriteria.returnDate,
          });
        }
      } else {
        onDateSelect?.(dateObj.date);
      }
    },
    [isRoundTrip, onDateSelect, searchCriteria, isReturnSelection]
  );

  // Optimized navigation with bounds checking
  const moveDateRange = useCallback(
    (direction) => {
      const newOffset = dateOffset + (direction === "prev" ? -1 : 1);
      if (newOffset < 0) return; // Prevent negative offset
      setDateOffset(newOffset);
    },
    [dateOffset]
  );

  return (
    <div className="w-full bg-gradient-to-br mt-8 from-blue-900/5 via-white to-blue-900/10 dark:from-gray-900 dark:via-blue-900/10 dark:to-black/20 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-900 dark:text-blue-300" />
            <h3 className="font-semibold text-blue-900 dark:text-white">
              {isReturnSelection
                ? "Chọn ngày về linh hoạt"
                : "Giá vé các ngày lân cận"}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="text-xs text-blue-900 dark:text-blue-300 hover:bg-blue-900/10 dark:hover:bg-blue-300/10"
          >
            <RefreshCw
              className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>

        {loading && dates.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <FlexSearchSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
              <Button
                variant="outline"
                size="icon"
                onClick={() => !loading && moveDateRange("prev")}
                disabled={dateOffset === 0 || loading}
                className="bg-white/80 hover:bg-white shadow-lg border-gray-300 dark:border-gray-600 h-8 w-8 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </Button>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
              <Button
                variant="outline"
                size="icon"
                onClick={() => !loading && moveDateRange("next")}
                disabled={loading}
                className="bg-white/80 hover:bg-white shadow-lg border-gray-300 dark:border-gray-600 h-8 w-8 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mx-8">
              {dates.map((dateObj, index) => (
                <Card
                  key={`${dateObj.formatted}-${index}`}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 animate-in slide-in-from-bottom-2 delay-[${index * 50}ms] ${
                    dateObj.isSelected
                      ? "border-blue-900 bg-blue-900/10 dark:bg-blue-300/10 dark:border-blue-300"
                      : dateObj.error
                      ? "border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 opacity-70"
                      : dateObj.price && dateObj.price === minOverallPrice
                      ? "border-green-500 bg-green-50 dark:bg-green-500/10 dark:border-green-500/50"
                      : "border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700"
                  }`}
                  onClick={() => !loading && handleDateSelect(dateObj)}
                >
                  <CardContent className="p-3 text-center h-full flex flex-col justify-between">
                    <div className="text-xs font-semibold text-blue-900 dark:text-gray-300 mb-1">
                      {dateObj.display}
                    </div>

                    {(loading && dateObj.price === undefined) ? (
                      <Skeleton className="h-5 w-16 mx-auto" />
                    ) : dateObj.error || !dateObj.price ? (
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-medium transition-opacity duration-200">
                        --
                      </div>
                    ) : (
                      <div
                        className={`text-sm font-bold transition-all duration-200 ${
                          dateObj.price === minOverallPrice
                            ? "text-green-600 dark:text-green-400"
                            : "text-blue-900 dark:text-blue-300"
                        }`}
                      >
                        {formatPrice(dateObj.price)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 text-center text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}