"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
}) {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateOffset, setDateOffset] = useState(0);
  const [airportIds, setAirportIds] = useState(null);
  const [pricesByDate, setPricesByDate] = useState({});

  // Refs for optimization
  const searchCriteriaRef = useRef(searchCriteria);
  const allFlightsRef = useRef(allFlights);
  const priceCache = useRef(new Map());
  const pendingRequests = useRef(new Set());
  const abortController = useRef(new AbortController());
  const swiperRef = useRef(null);
  const hasFetchedRef = useRef(new Set()); // Track fetched dates

  const isRoundTrip = searchCriteria?.tripType === "roundtrip";

  // Format price helper
  const formatPrice = useCallback((price) => {
    if (price == null || price === 0) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }, []);

  // Extract airport IDs - memoized
  const getAirportIds = useCallback(async () => {
    if (airportIds) return airportIds;

    let departureId = searchCriteria?.departureAirportId;
    let arrivalId = searchCriteria?.arrivalAirportId;

    if (!departureId) {
      departureId =
        searchCriteria?.fromLocations?.[0]?.airportId ||
        searchCriteria?.from?.airportId;
    }

    if (!arrivalId) {
      arrivalId =
        searchCriteria?.toLocations?.[0]?.airportId ||
        searchCriteria?.to?.airportId;
    }

    const extractCode = (str) => str?.match?.(/\b([A-Z]{3})\b/)?.[1];

    if (!departureId || !arrivalId) {
      try {
        if (!departureId) {
          const code =
            extractCode(searchCriteria?.fromLocations?.[0]) ||
            extractCode(searchCriteria?.from);
          if (code) {
            const response = await airportApi.getAirportByCode(code);
            if (response.success) departureId = response.data.airportId;
          }
        }

        if (!arrivalId) {
          const code =
            extractCode(searchCriteria?.toLocations?.[0]) ||
            extractCode(searchCriteria?.to);
          if (code) {
            const response = await airportApi.getAirportByCode(code);
            if (response.success) arrivalId = response.data.airportId;
          }
        }
      } catch (err) {
        console.error("Error fetching airport IDs:", err);
      }
    }

    const result = { departureId, arrivalId };
    setAirportIds(result);
    return result;
  }, [searchCriteria, airportIds]);

  // Parse date helper function
  const parseDate = useCallback((dateValue) => {
    if (!dateValue) return new Date();

    let parsed;
    if (typeof dateValue === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        const [year, month, day] = dateValue.split("-").map(Number);
        parsed = new Date(year, month - 1, day);
      } else {
        parsed = new Date(dateValue);
      }
    } else if (dateValue instanceof Date) {
      parsed = dateValue;
    } else {
      parsed = new Date();
    }

    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }, []);

  // Generate dates - optimized for local time, and restore prices from cache
  const generateDates = useMemo(() => {
    const baseDate = parseDate(searchCriteria?.departDate);
    const returnDate = parseDate(searchCriteria?.returnDate);

    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(baseDate);
    startDate.setDate(baseDate.getDate() - 3 + dateOffset * 7);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      if (currentDate < today) continue;

      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      const formatted = `${year}-${month}-${day}`;

      const display = isRoundTrip
        ? (() => {
            const endDate = new Date(currentDate);
            endDate.setDate(currentDate.getDate() + 6);
            const startDay = currentDate.getDate();
            const endDay = endDate.getDate();
            const monthName = currentDate.toLocaleDateString("vi-VN", {
              month: "short",
            });
            const containsUserRange =
              currentDate <= baseDate && endDate >= returnDate;
            return `${startDay}-${endDay} ${monthName}${
              containsUserRange ? " ✓" : ""
            }`;
          })()
        : currentDate.toLocaleDateString("vi-VN", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });

      const cachedPrice = pricesByDate[formatted] ?? null;
      const cachedError = cachedPrice == null;

      dates.push({
        date: currentDate,
        formatted,
        display,
        isToday: currentDate.getTime() === today.getTime(),
        price: cachedPrice,
        loading: false,
        error: cachedError,
      });
    }

    return dates;
  }, [
    searchCriteria?.departDate,
    searchCriteria?.returnDate,
    dateOffset,
    isRoundTrip,
    pricesByDate,
    parseDate,
  ]);

  // Extract price from flight
  const extractFlightPrice = useCallback((flight) => {
    const price =
      flight.basePrice ||
      flight.priceNumeric ||
      flight.price ||
      flight.totalPrice ||
      flight.pricing?.basePrice ||
      flight.pricing?.priceNumeric ||
      flight.pricing?.price ||
      flight.pricing?.totalPrice;

    return typeof price === "string"
      ? parseFloat(price.replace(/[^\d.]/g, ""))
      : price > 0
      ? price
      : null;
  }, []);

  // Manual parse date from departureTime assuming "DD/MM/YYYY [HH:mm:ss]" format
  const parseFlightDateStr = useCallback((departureTime) => {
    if (!departureTime) return null;
    const datePart = departureTime.split(" ")[0];
    const parts = datePart.split(/[/.-]/);
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(Number);
    if (
      isNaN(day) ||
      isNaN(month) ||
      isNaN(year) ||
      day < 1 ||
      day > 31 ||
      month < 1 ||
      month > 12
    )
      return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  }, []);

  // Get price from allFlights
  const getPriceFromAllFlights = useCallback(
    (dateObj, departureId, arrivalId) => {
      const cacheKey = `${dateObj.formatted}_${departureId}_${arrivalId}`;
      if (priceCache.current.has(cacheKey))
        return priceCache.current.get(cacheKey);

      const targetDateStr = dateObj.formatted;
      const matchingFlights = allFlights.filter((flight) => {
        const flightDateStr = parseFlightDateStr(flight.departureTime);
        if (!flightDateStr) return false;
        const dateMatch = flightDateStr === targetDateStr;
        const depId =
          flight.departureAirport?.airportId || flight.departureAirportId;
        const arrId =
          flight.arrivalAirport?.airportId || flight.arrivalAirportId;
        const airportMatch =
          String(depId) === String(departureId) &&
          String(arrId) === String(arrivalId);
        return dateMatch && airportMatch;
      });

      const prices = matchingFlights.map(extractFlightPrice).filter(Boolean);
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      priceCache.current.set(cacheKey, minPrice);
      return minPrice;
    },
    [allFlights, extractFlightPrice, parseFlightDateStr]
  );

  // Fetch price from API
  const fetchPriceFromAPI = useCallback(
    async (dateObj, departureId, arrivalId) => {
      const requestKey = `${dateObj.formatted}_${departureId}_${arrivalId}`;
      if (pendingRequests.current.has(requestKey)) return null;
      pendingRequests.current.add(requestKey);

      try {
        const requestBody = {
          tripType: isRoundTrip ? "ROUND_TRIP" : "ONE_WAY",
          departureAirportId: parseInt(departureId),
          arrivalAirportId: parseInt(arrivalId),
          outboundDepartureDate: dateObj.formatted,
        };

        if (isRoundTrip) {
          const retDate = new Date(searchCriteria?.returnDate || dateObj.date);
          if (!searchCriteria?.returnDate)
            retDate.setDate(retDate.getDate() + 7);
          requestBody.returnDate = `${retDate.getFullYear()}-${String(
            retDate.getMonth() + 1
          ).padStart(2, "0")}-${String(retDate.getDate()).padStart(2, "0")}`;
        }

        const response = await flightApi.searchUnifiedFlights(requestBody, {
          page: 0,
          size: 50,
        });

        if (response.success && response.data) {
          let flights = isRoundTrip
            ? response.data.roundTripPairs?.map((pair) => ({
                totalPrice:
                  (pair.outbound.basePrice || 0) +
                  (pair.inbound.basePrice || 0),
              })) || []
            : response.data.oneWayFlights?.content || [];

          const prices = flights.map(extractFlightPrice).filter(Boolean);
          return prices.length > 0 ? Math.min(...prices) : null;
        }
        return null;
      } catch (err) {
        if (err.name !== "AbortError") console.error("API error:", err);
        return null;
      } finally {
        pendingRequests.current.delete(requestKey);
      }
    },
    [extractFlightPrice, isRoundTrip, searchCriteria?.returnDate]
  );

  // Update prices
  const updatePrices = useCallback(async () => {
    if (!dates.length || loading) return;

    const ids = await getAirportIds();
    if (!ids.departureId || !ids.arrivalId) {
      setError(
        "Thiếu thông tin sân bay. Vui lòng chọn lại điểm đi và điểm đến."
      );
      return;
    }

    setLoading(true);
    setError(null);
    abortController.current.abort();
    abortController.current = new AbortController();

    const updatedDates = [...dates];
    let hasChanges = false;

    for (let i = 0; i < updatedDates.length; i++) {
      const dateObj = updatedDates[i];
      if (dateObj.price != null || hasFetchedRef.current.has(dateObj.formatted))
        continue;

      const priceFromFlights = getPriceFromAllFlights(
        dateObj,
        ids.departureId,
        ids.arrivalId
      );
      if (priceFromFlights != null) {
        updatedDates[i] = {
          ...dateObj,
          price: priceFromFlights,
          loading: false,
          error: false,
        };
        setPricesByDate((prev) => ({
          ...prev,
          [dateObj.formatted]: priceFromFlights,
        }));
        hasFetchedRef.current.add(dateObj.formatted);
        hasChanges = true;
      } else {
        updatedDates[i] = { ...dateObj, loading: true };
        hasChanges = true;
      }
    }

    if (hasChanges) setDates(updatedDates);

    const datesToFetch = updatedDates.filter(
      (d) => d.price == null && !hasFetchedRef.current.has(d.formatted)
    );
    if (datesToFetch.length) {
      const batchSize = 3;
      for (let i = 0; i < datesToFetch.length; i += batchSize) {
        const batch = datesToFetch.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(async (dateObj) => {
            const price = await fetchPriceFromAPI(
              dateObj,
              ids.departureId,
              ids.arrivalId
            );
            hasFetchedRef.current.add(dateObj.formatted);
            return {
              formatted: dateObj.formatted,
              price,
              error: price == null,
            };
          })
        );

        setDates((prev) => {
          const newDates = prev.map((d) => {
            const res = results.find((r) => r.formatted === d.formatted);
            return res
              ? { ...d, price: res.price, loading: false, error: res.error }
              : d;
          });
          results.forEach((res) => {
            if (res.price != null) {
              setPricesByDate((prevPrices) => ({
                ...prevPrices,
                [res.formatted]: res.price,
              }));
            }
          });
          return newDates;
        });

        if (i + batchSize < datesToFetch.length)
          await new Promise((res) => setTimeout(res, 300));
      }
    }

    setLoading(false);
  }, [
    dates,
    getAirportIds,
    getPriceFromAllFlights,
    fetchPriceFromAPI,
    loading,
  ]);

  // Validate criteria
  const hasValidSearchCriteria = useMemo(() => {
    if (!searchCriteria) return false;
    const hasDep =
      searchCriteria.departureAirportId ||
      searchCriteria.fromLocations?.[0]?.airportId ||
      searchCriteria.from?.airportId ||
      (searchCriteria.fromLocations?.[0] || searchCriteria.from)?.match?.(
        /\b([A-Z]{3})\b/
      );
    const hasArr =
      searchCriteria.arrivalAirportId ||
      searchCriteria.toLocations?.[0]?.airportId ||
      searchCriteria.to?.airportId ||
      (searchCriteria.toLocations?.[0] || searchCriteria.to)?.match?.(
        /\b([A-Z]{3})\b/
      );
    return hasDep && hasArr;
  }, [searchCriteria]);

  // Initialize dates and auto-select
  useEffect(() => {
    const newDates = generateDates;
    setDates(newDates);

    if (searchCriteria?.departDate && newDates.length) {
      const baseDate = parseDate(searchCriteria.departDate);
      const formatted = `${baseDate.getFullYear()}-${String(
        baseDate.getMonth() + 1
      ).padStart(2, "0")}-${String(baseDate.getDate()).padStart(2, "0")}`;
      const selected = newDates.find((d) => d.formatted === formatted);
      setSelectedDate(selected || null);

      const selectedIndex = newDates.findIndex(
        (d) => d.formatted === formatted
      );
      if (selectedIndex !== -1 && swiperRef.current) {
        swiperRef.current.slideTo(selectedIndex);
      }
    }
  }, [generateDates, searchCriteria?.departDate, parseDate]);

  // Trigger price update when search criteria, flights, or dates change
  useEffect(() => {
    if (!dates.length || !hasValidSearchCriteria) return;

    const criteriaChanged =
      JSON.stringify(searchCriteria) !==
      JSON.stringify(searchCriteriaRef.current);
    const flightsChanged = allFlights.length !== allFlightsRef.current.length;

    if (
      criteriaChanged ||
      flightsChanged ||
      dates.some(
        (d) => d.price == null && !hasFetchedRef.current.has(d.formatted)
      )
    ) {
      searchCriteriaRef.current = searchCriteria;
      allFlightsRef.current = allFlights;

      if (criteriaChanged) {
        priceCache.current.clear();
        setPricesByDate({});
        hasFetchedRef.current.clear();
      }

      updatePrices();
    }
  }, [
    dates,
    searchCriteria,
    allFlights.length,
    hasValidSearchCriteria,
    updatePrices,
  ]);

  useEffect(() => () => abortController.current.abort(), []);

  if (!hasValidSearchCriteria) return null;

  // Find overall min price for highlighting
  const minOverallPrice = Math.min(
    ...dates.map((d) => d.price || Infinity).filter(Boolean)
  );

  const handleRefresh = useCallback(() => {
    priceCache.current.clear();
    setPricesByDate({});
    hasFetchedRef.current.clear();
    setError(null);
    updatePrices();
  }, [updatePrices]);

  // Handle date selection
  const handleDateSelect = useCallback(
    (dateObj) => {
      setSelectedDate(dateObj);
      onDateSelect?.(isRoundTrip ? { departDate: dateObj.date } : dateObj.date);
    },
    [isRoundTrip, onDateSelect]
  );

  // Navigation
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
                Chọn {isRoundTrip ? "khoảng ngày" : "ngày"} khởi hành linh hoạt
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                So sánh giá vé theo ngày để tìm chuyến bay giá rẻ nhất
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
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20">
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
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
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
                    selectedDate?.formatted === dateObj.formatted
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
                      {selectedDate?.formatted === dateObj.formatted && (
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

        {selectedDate && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200/50 dark:border-green-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Ngày khởi hành: {selectedDate.display}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    
                    {selectedDate.price && selectedDate.price > 0
                      ? `Giá thấp nhất: ${formatPrice(selectedDate.price)}`
                      : "Không có chuyến - Vui lòng chọn ngày khác hoặc tham khảo các chuyến bay khác bên dưới"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(null)}
                className="text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Đặt lại
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
