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

  // Refs to prevent unnecessary re-renders and API calls
  const searchCriteriaRef = useRef(searchCriteria);
  const allFlightsRef = useRef(allFlights);
  const priceCache = useRef(new Map());
  const pendingRequests = useRef(new Set());
  const abortController = useRef(new AbortController());

  const isRoundTrip = searchCriteria?.tripType === "roundtrip";

  // Format price helper
  const formatPrice = useCallback((price) => {
    if (price === null || price === undefined || price === 0) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }, []);

  // Extract airport IDs - memoized and cached
  const getAirportIds = useCallback(async () => {
    if (airportIds) return airportIds;

    let departureId = searchCriteria?.departureAirportId;
    let arrivalId = searchCriteria?.arrivalAirportId;

    // Extract from objects
    if (!departureId && searchCriteria?.from?.airportId) {
      departureId = searchCriteria.from.airportId;
    }
    if (!arrivalId && searchCriteria?.to?.airportId) {
      arrivalId = searchCriteria.to.airportId;
    }

    // Extract from airport codes (only if needed)
    if (!departureId || !arrivalId) {
      const extractCode = (str) => {
        if (typeof str === "string") {
          const match = str.match(/\b([A-Z]{3})\b/);
          return match ? match[1] : null;
        }
        return null;
      };

      try {
        if (!departureId) {
          const code = extractCode(searchCriteria?.from);
          if (code) {
            const response = await airportApi.getAirportByCode(code);
            if (response.success) departureId = response.data.airportId;
          }
        }

        if (!arrivalId) {
          const code = extractCode(searchCriteria?.to);
          if (code) {
            const response = await airportApi.getAirportByCode(code);
            if (response.success) arrivalId = response.data.airportId;
          }
        }
      } catch (error) {
        console.error("Error fetching airport IDs:", error);
      }
    }

    const result = { departureId, arrivalId };
    setAirportIds(result);
    return result;
  }, [searchCriteria, airportIds]);

  // Generate dates based on offset
  const generateDates = useMemo(() => {
    const baseDate = searchCriteria?.departDate
      ? new Date(searchCriteria.departDate)
      : new Date();
    const returnDate = searchCriteria?.returnDate
      ? new Date(searchCriteria.returnDate)
      : null;

    const dates = [];
    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() - 3 + dateOffset * 7);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);

      if (currentDate < today) continue;

      const formatted = currentDate.toISOString().split("T")[0];

      dates.push({
        date: currentDate,
        formatted,
        display: isRoundTrip
          ? (() => {
              // Nếu có ngày về, tạo khoảng từ ngày đi đến ngày về
              if (returnDate) {
                const departDay = currentDate.getDate();
                const returnDay = returnDate.getDate();
                const departMonth = currentDate.getMonth();
                const returnMonth = returnDate.getMonth();

                // Nếu cùng tháng
                if (departMonth === returnMonth) {
                  const monthName = currentDate.toLocaleDateString("vi-VN", {
                    month: "short",
                  });
                  return `${departDay}-${returnDay} ${monthName}`;
                } else {
                  // Nếu khác tháng
                  const departMonthName = currentDate.toLocaleDateString(
                    "vi-VN",
                    { month: "short" }
                  );
                  const returnMonthName = returnDate.toLocaleDateString(
                    "vi-VN",
                    { month: "short" }
                  );
                  return `${departDay} ${departMonthName} - ${returnDay} ${returnMonthName}`;
                }
              } else {
                // Nếu không có ngày về, tạo khoảng 7 ngày từ ngày hiện tại
                const endDate = new Date(currentDate);
                endDate.setDate(currentDate.getDate() + 6);

                // Đảm bảo không vượt quá tháng hiện tại
                const currentMonth = currentDate.getMonth();
                const currentYear = currentDate.getFullYear();
                const lastDayOfMonth = new Date(
                  currentYear,
                  currentMonth + 1,
                  0
                ).getDate();

                if (endDate.getDate() > lastDayOfMonth) {
                  endDate.setDate(lastDayOfMonth);
                }

                const startDay = currentDate.getDate();
                const endDay = endDate.getDate();
                const monthName = currentDate.toLocaleDateString("vi-VN", {
                  month: "short",
                });

                return `${startDay}-${endDay} ${monthName}`;
              }
            })()
          : currentDate.toLocaleDateString("vi-VN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            }),
        isToday: currentDate.getTime() === today.getTime(),
        price: null,
        loading: false,
        error: false,
      });
    }
    return dates;
  }, [searchCriteria?.departDate, dateOffset, isRoundTrip]);

  // Extract price from flight - simplified
  const extractFlightPrice = useCallback((flight) => {
    const priceFields = ["basePrice", "priceNumeric", "price", "totalPrice"];
    for (const field of priceFields) {
      let price = flight[field] || flight.pricing?.[field];
      if (typeof price === "string") {
        price = parseFloat(price.replace(/[^\d.]/g, ""));
      }
      if (price > 0) return price;
    }
    return null;
  }, []);

  // Get price from allFlights - optimized
  const getPriceFromAllFlights = useCallback(
    (dateObj, departureId, arrivalId) => {
      if (!allFlights.length || !departureId || !arrivalId) return null;

      const targetDateStr = dateObj.formatted;
      const cacheKey = `${targetDateStr}_${departureId}_${arrivalId}`;

      if (priceCache.current.has(cacheKey)) {
        return priceCache.current.get(cacheKey);
      }

      const matchingFlights = allFlights.filter((flight) => {
        if (!flight.departureTime) return false;

        const flightDateStr = new Date(flight.departureTime)
          .toISOString()
          .split("T")[0];
        const dateMatch = flightDateStr === targetDateStr;

        const flightDepartureId =
          flight.departureAirport?.airportId || flight.departureAirportId;
        const flightArrivalId =
          flight.arrivalAirport?.airportId || flight.arrivalAirportId;
        const airportMatch =
          String(flightDepartureId) === String(departureId) &&
          String(flightArrivalId) === String(arrivalId);

        return dateMatch && airportMatch;
      });

      if (matchingFlights.length === 0) {
        priceCache.current.set(cacheKey, null);
        return null;
      }

      const prices = matchingFlights
        .map((flight) => extractFlightPrice(flight))
        .filter((price) => price !== null);

      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      priceCache.current.set(cacheKey, minPrice);
      return minPrice;
    },
    [allFlights, extractFlightPrice]
  );

  // Fetch price from API - with debouncing and request deduplication
  const fetchPriceFromAPI = useCallback(
    async (dateObj, departureId, arrivalId) => {
      const requestKey = `${dateObj.formatted}_${departureId}_${arrivalId}`;

      if (pendingRequests.current.has(requestKey)) {
        return null; // Request already pending
      }

      pendingRequests.current.add(requestKey);

      try {
        const params = {
          departureAirportId: departureId,
          arrivalAirportId: arrivalId,
          startTime: dateObj.formatted,
          endTime: dateObj.formatted,
          page: 0,
          size: 50, // Reduced size for better performance
        };

        const response = await flightApi.searchFlights(params);

        if (response.success && response.data?.content?.length > 0) {
          const prices = response.data.content
            .map((flight) => extractFlightPrice(flight))
            .filter((price) => price !== null);

          return prices.length > 0 ? Math.min(...prices) : null;
        }
        return null;
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(
            `Error fetching price for ${dateObj.formatted}:`,
            error
          );
        }
        return null;
      } finally {
        pendingRequests.current.delete(requestKey);
      }
    },
    [extractFlightPrice]
  );

  // Update prices - optimized with batching and caching
  const updatePrices = useCallback(async () => {
    if (!dates.length) return;

    const ids = await getAirportIds();
    if (!ids.departureId || !ids.arrivalId) {
      setError(
        "Thiếu thông tin sân bay. Vui lòng chọn lại điểm đi và điểm đến."
      );
      return;
    }

    setLoading(true);
    setError(null);

    // Cancel previous requests
    abortController.current.abort();
    abortController.current = new AbortController();

    const updatedDates = [...dates];
    let hasChanges = false;

    // First pass: try to get prices from allFlights (fast)
    for (let i = 0; i < updatedDates.length; i++) {
      const dateObj = updatedDates[i];
      const priceFromFlights = getPriceFromAllFlights(
        dateObj,
        ids.departureId,
        ids.arrivalId
      );

      if (priceFromFlights !== null && dateObj.price !== priceFromFlights) {
        updatedDates[i] = {
          ...dateObj,
          price: priceFromFlights,
          loading: false,
          error: false,
        };
        hasChanges = true;
      } else if (dateObj.price === null) {
        updatedDates[i] = { ...dateObj, loading: true };
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setDates(updatedDates);
    }

    // Second pass: fetch missing prices from API in batches
    const datesToFetch = updatedDates.filter((d) => d.price === null);

    if (datesToFetch.length > 0) {
      const batchSize = 3;
      const batches = [];

      for (let i = 0; i < datesToFetch.length; i += batchSize) {
        batches.push(datesToFetch.slice(i, i + batchSize));
      }

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        try {
          const batch = batches[batchIndex];
          const batchPromises = batch.map(async (dateObj) => {
            const price = await fetchPriceFromAPI(
              dateObj,
              ids.departureId,
              ids.arrivalId
            );
            return { formatted: dateObj.formatted, price, error: false };
          });

          const results = await Promise.allSettled(batchPromises);

          setDates((prevDates) =>
            prevDates.map((dateObj) => {
              const result = results.find(
                (r) =>
                  r.status === "fulfilled" &&
                  r.value.formatted === dateObj.formatted
              );

              if (result) {
                return {
                  ...dateObj,
                  price: result.value.price,
                  loading: false,
                  error: result.value.error,
                };
              }
              return dateObj;
            })
          );

          // Add delay between batches
          if (batchIndex < batches.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        } catch (error) {
          if (error.name !== "AbortError") {
            console.error("Batch error:", error);
          }
        }
      }
    }

    setLoading(false);
  }, [dates, getAirportIds, getPriceFromAllFlights, fetchPriceFromAPI]);

  // Initialize dates
  useEffect(() => {
    setDates(generateDates);

    // Auto-select date from search criteria
    if (searchCriteria?.departDate && generateDates.length > 0) {
      const baseDate = new Date(searchCriteria.departDate);
      const formatted = baseDate.toISOString().split("T")[0];
      const selected = generateDates.find((d) => d.formatted === formatted);
      setSelectedDate(selected || null);
    }
  }, [generateDates, searchCriteria?.departDate]);

  // Update prices when needed - with debouncing
  useEffect(() => {
    if (dates.length === 0) return;

    // Check if search criteria or allFlights have meaningfully changed
    const criteriaChanged =
      JSON.stringify(searchCriteria) !==
      JSON.stringify(searchCriteriaRef.current);
    const flightsChanged = allFlights.length !== allFlightsRef.current.length;

    if (criteriaChanged || flightsChanged) {
      searchCriteriaRef.current = searchCriteria;
      allFlightsRef.current = allFlights;

      const timeoutId = setTimeout(() => {
        updatePrices();
      }, 500); // Debounce API calls

      return () => clearTimeout(timeoutId);
    }
  }, [dates.length, searchCriteria, allFlights.length, updatePrices]);

  // Handle date selection
  const handleDateSelect = useCallback(
    (dateObj) => {
      setSelectedDate(dateObj);
      if (onDateSelect) {
        onDateSelect(isRoundTrip ? { departDate: dateObj.date } : dateObj.date);
      }
    },
    [isRoundTrip, onDateSelect]
  );

  // Navigation
  const moveDateRange = useCallback(
    (direction) => {
      const newOffset = dateOffset + (direction === "prev" ? -1 : 1);
      if (newOffset >= 0 && newOffset <= 12) {
        // Max 3 months
        setDateOffset(newOffset);
        setSelectedDate(null);
        priceCache.current.clear(); // Clear cache when changing date range
      }
    },
    [dateOffset]
  );

  // Manual refresh
  const handleRefresh = useCallback(() => {
    priceCache.current.clear();
    setError(null);
    updatePrices();
  }, [updatePrices]);

  // Cleanup
  useEffect(() => {
    return () => {
      abortController.current.abort();
    };
  }, []);

  if (!searchCriteria) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>
            Vui lòng chọn điểm khởi hành và điểm đến để xem giá vé linh hoạt
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chọn {isRoundTrip ? "khoảng ngày" : "ngày"} khởi hành linh hoạt
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          So sánh giá vé theo ngày để tìm chuyến bay giá rẻ nhất
        </p>
      </div>

      <div className="p-4">
        <div className="relative">
          {/* Navigation */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveDateRange("prev")}
              disabled={dateOffset === 0}
              className="bg-white/90 hover:bg-white shadow-md h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveDateRange("next")}
              disabled={dateOffset >= 12}
              className="bg-white/90 hover:bg-white shadow-md h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Swiper
            modules={[Pagination]}
            spaceBetween={12}
            slidesPerView={1}
            pagination={{ clickable: true, el: ".swiper-pagination" }}
            breakpoints={{
              640: { slidesPerView: 3 },
              768: { slidesPerView: 5 },
              1024: { slidesPerView: 7 },
            }}
            className="pb-8 px-12"
          >
            {dates.map((dateObj, index) => (
              <SwiperSlide key={`${dateObj.formatted}-${index}`}>
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedDate?.formatted === dateObj.formatted
                      ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : dateObj.error
                      ? "bg-red-50 dark:bg-red-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => handleDateSelect(dateObj)}
                >
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {dateObj.display}
                    </div>

                    {dateObj.loading ? (
                      <div className="flex justify-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    ) : dateObj.error ? (
                      <div className="text-xs text-red-500 py-2">
                        Lỗi tải giá
                      </div>
                    ) : (
                      <div
                        className={`text-sm font-semibold ${
                          dateObj.price
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {formatPrice(dateObj.price)}
                      </div>
                    )}

                    {dateObj.isToday && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        Hôm nay
                      </Badge>
                    )}
                    {selectedDate?.formatted === dateObj.formatted && (
                      <Badge
                        variant="default"
                        className="text-xs mt-1 bg-blue-500"
                      >
                        Đã chọn
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="swiper-pagination flex justify-center mt-4"></div>
        </div>

        {/* Loading/Error States */}
        {loading && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Đang tải giá vé...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="text-xs ml-2"
              >
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {/* Selected Date Summary */}
        {selectedDate && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Ngày khởi hành: {selectedDate.display}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Giá thấp nhất: {formatPrice(selectedDate.price)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(null)}
                className="text-xs"
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
