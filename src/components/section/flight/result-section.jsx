"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Pagination from "@/components/ui/pagination";
import {
  ArrowRight,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plane,
  X,
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { SearchForm } from "../../common/search-form";
import { FlightFilters } from "./filter-section";
import DealsSection from "./deal-section";
import { FlightFlexSearch } from "../../common/flight-flex-search";
import { FlightCard } from "../../common/flight-card";
import { useSearch } from "../../../contexts/search-context";

import {
  FLIGHTS_PER_PAGE,
  DEFAULT_FILTERS,
  FLIGHT_TABS,
  FARE_OPTIONS,
  getDepartureTimeSlot,
} from "./flight-constants.jsx";
import { useFlightData } from "../../../hooks/use-flight-search.js";
import { EmptyState } from "./flight-components.jsx";

// Main Component
export function FlightSearchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { searchCriteria, updateSearchCriteria, clearSearchCriteria } =
    useSearch();
  const { allFlights, loading, error } = useFlightData(searchCriteria);

  // Debug: Log when allFlights changes
  useEffect(() => {
    console.log("📊 Result Section: allFlights updated:", {
      totalFlights: allFlights.length,
      hasFlights: allFlights.length > 0,
      firstFlight: allFlights[0] || null,
      searchCriteria: searchCriteria,
    });
    if (allFlights.length > 0) {
      console.log("✅ Result Section: Flights received from flight hook!");
    }
  }, [allFlights, searchCriteria]);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedFlights, setExpandedFlights] = useState(new Set());
  const [selectedFares, setSelectedFares] = useState({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllCombinations, setShowAllCombinations] = useState(false);

  // Ref for results section to scroll to
  const resultsRef = useRef(null);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchCriteria, activeTab]);

  // Reset showAllCombinations when search criteria changes
  useEffect(() => {
    setShowAllCombinations(false);
  }, [searchCriteria]);

  // Scroll to results section when flights are loaded
  useEffect(() => {
    if (allFlights.length > 0 && resultsRef.current && !loading) {
      console.log("📍 Scrolling to results section");
      resultsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [allFlights.length, loading]);

  const handleSearch = useCallback(
    (criteria) => {
      console.log(
        "🎯 RESULT PAGE: handleSearch called with criteria:",
        criteria
      );
      console.log("🎯 RESULT PAGE: Current location state:", location.state);

      console.log("🔍 Search criteria received from form:", criteria);

      // Only clear location state if we're coming from a destination click
      // and the new search is significantly different
      const shouldClearLocationState =
        location.state?.searchCriteria &&
        (criteria.from !== location.state.searchCriteria.from ||
          criteria.to !== location.state.searchCriteria.to);

      console.log("🔄 Location state decision:", {
        hasLocationState: !!location.state?.searchCriteria,
        shouldClearLocationState,
        locationFrom: location.state?.searchCriteria?.from,
        newFrom: criteria.from,
        locationTo: location.state?.searchCriteria?.to,
        newTo: criteria.to,
      });

      if (shouldClearLocationState && window.history.replaceState) {
        console.log(
          "🧹 Clearing location state due to different search criteria"
        );
        window.history.replaceState({}, "", window.location.pathname);
      }

      // Update URL params to sync with search criteria
      const urlParams = new URLSearchParams();
      if (criteria.from) {
        const fromValue =
          typeof criteria.from === "string"
            ? criteria.from
            : criteria.from.airportCode
            ? `${criteria.from.city} (${criteria.from.airportCode})`
            : "";
        if (fromValue) urlParams.set("from", fromValue);
      }
      if (criteria.to) {
        const toValue =
          typeof criteria.to === "string"
            ? criteria.to
            : criteria.to.airportCode
            ? `${criteria.to.city} (${criteria.to.airportCode})`
            : "";
        if (toValue) urlParams.set("to", toValue);
      }
      if (criteria.departDate) {
        // Use local date to avoid timezone conversion issues
        const localDate = new Date(criteria.departDate);
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, "0");
        const day = String(localDate.getDate()).padStart(2, "0");
        const localDateString = `${year}-${month}-${day}`;
        urlParams.set("departDate", localDateString);
      }
      if (criteria.returnDate) {
        // Use local date to avoid timezone conversion issues
        const localDate = new Date(criteria.returnDate);
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, "0");
        const day = String(localDate.getDate()).padStart(2, "0");
        const localDateString = `${year}-${month}-${day}`;
        urlParams.set("returnDate", localDateString);
      }
      if (criteria.tripType) {
        urlParams.set("tripType", criteria.tripType);
      }
      if (criteria.passengers) {
        urlParams.set("passengers", JSON.stringify(criteria.passengers));
      }

      console.log("🔗 URL params to be set:", urlParams.toString());

      // Update URL without triggering navigation
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.replaceState({}, "", newUrl);

      // Update search criteria in context
      updateSearchCriteria(criteria);

      // Auto-scroll to results section after search submission
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100); // Small delay to ensure DOM updates
    },
    [location.state, updateSearchCriteria]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setActiveTab("all");
    setCurrentPage(1);
  }, []);

  const toggleDetails = useCallback((flightId) => {
    setExpandedFlights((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(flightId)) {
        newSet.delete(flightId);
      } else {
        newSet.add(flightId);
      }
      return newSet;
    });
  }, []);

  const handleSelectFare = useCallback((flightId, fareId) => {
    setSelectedFares((prev) => ({ ...prev, [flightId]: fareId }));
  }, []);

  const handleProceedToBooking = useCallback(
    (flight, fareId) => {
      const selectedFare = FARE_OPTIONS.find((fare) => fare.id === fareId);
      localStorage.setItem("selectedFlight", JSON.stringify(flight));
      localStorage.setItem("selectedFare", JSON.stringify(selectedFare));
      navigate("/booking-stepper", {
        state: { flight, selectedFare },
      });
    },
    [navigate]
  );

  const filteredAndSortedFlights = useMemo(() => {
    let filtered = allFlights.filter((flight) => {
      // Price filter
      if (
        flight.priceNumeric < filters.priceRange[0] ||
        flight.priceNumeric > filters.priceRange[1]
      ) {
        return false;
      }

      // Airline filter
      if (
        filters.airlines.length > 0 &&
        !filters.airlines.includes(flight.airline)
      ) {
        return false;
      }

      // Departure time filter
      if (filters.departureTime.length > 0) {
        const flightTimeSlot = getDepartureTimeSlot(flight.departureTime);
        if (!filters.departureTime.includes(flightTimeSlot)) {
          return false;
        }
      }

      return true;
    });

    // Remove duplicates
    filtered = filtered.filter((flight, index, self) => {
      return index === self.findIndex((f) => f.id === flight.id);
    });

    // Tab filter
    filtered = filtered.filter((flight) => {
      if (activeTab === "all") return true;
      if (activeTab === "domestic" && flight.type !== "DOMESTIC") return false;
      if (activeTab === "international" && flight.type !== "INTERNATIONAL")
        return false;
      if (activeTab === "one-way" && flight.type !== "ONE_WAY") return false;
      return true;
    });

    // Group round-trip flights by roundTripGroupId
    const groupedFlights = [];
    const processedGroupIds = new Set();

    filtered.forEach((flight) => {
      if (
        flight.roundTripGroupId &&
        flight.tripType === "ROUND_TRIP" &&
        !processedGroupIds.has(flight.roundTripGroupId)
      ) {
        // Find all flights with the same roundTripGroupId
        const roundTripGroup = filtered.filter(
          (f) =>
            f.roundTripGroupId === flight.roundTripGroupId &&
            f.tripType === "ROUND_TRIP"
        );

        if (roundTripGroup.length === 2) {
          // Determine outbound and return based on departure airport
          // The flight departing from the original departure airport is outbound
          const originalDepartureAirportId =
            searchCriteria?.from?.airportId || searchCriteria?.from?.id;

          let outboundFlight, returnFlight;

          if (originalDepartureAirportId) {
            outboundFlight = roundTripGroup.find(
              (f) =>
                f.departureAirport?.airportId === originalDepartureAirportId
            );
            returnFlight = roundTripGroup.find(
              (f) =>
                f.departureAirport?.airportId !== originalDepartureAirportId
            );
          } else {
            // Fallback: assume first flight is outbound, second is return
            outboundFlight = roundTripGroup[0];
            returnFlight = roundTripGroup[1];
          }

          if (outboundFlight && returnFlight) {
            groupedFlights.push({
              ...outboundFlight,
              isRoundTripDisplay: true,
              outboundFlight,
              returnFlight,
              combinedPrice:
                (outboundFlight.basePrice || 0) + (returnFlight.basePrice || 0),
              id: `roundtrip-${flight.roundTripGroupId}`,
              flightId: `roundtrip-${flight.roundTripGroupId}`,
            });
            processedGroupIds.add(flight.roundTripGroupId);
          } else {
            // If we can't properly identify outbound/return, add them separately
            roundTripGroup.forEach((f) => groupedFlights.push(f));
            processedGroupIds.add(flight.roundTripGroupId);
          }
        } else {
          // Single flight or incomplete round-trip group
          groupedFlights.push(flight);
          processedGroupIds.add(flight.roundTripGroupId);
        }
      } else if (!flight.roundTripGroupId || flight.tripType !== "ROUND_TRIP") {
        // Regular single flights
        groupedFlights.push(flight);
      }
    });

    // Sort flights
    groupedFlights.sort((a, b) => {
      // For round-trip groups, use combined price
      const priceA = a.isRoundTripDisplay
        ? a.combinedPrice
        : a.priceNumeric || a.basePrice || 0;
      const priceB = b.isRoundTripDisplay
        ? b.combinedPrice
        : b.priceNumeric || b.basePrice || 0;

      switch (filters.sortBy) {
        case "price-asc":
          return priceA - priceB;
        case "price-desc":
          return priceB - priceA;
        case "departure-asc":
          return a.departureTime.localeCompare(b.departureTime);
        case "departure-desc":
          return b.departureTime.localeCompare(a.departureTime);
        default:
          return 0;
      }
    });

    return groupedFlights;
  }, [allFlights, filters, activeTab]);

  console.log("📊 DEBUG: Filtering results:", {
    allFlightsLength: allFlights.length,
    filteredLength: filteredAndSortedFlights.length,
    filters,
    activeTab,
  });

  // Prepare initial values for SearchForm
  const searchFormInitialValues = useMemo(() => {
    if (!searchCriteria) return null;

    return {
      tripType: searchCriteria.tripType || "oneway",
      passengers: searchCriteria.passengers || {
        adults: 1,
        children: 0,
        infants: 0,
      },
      travelClass: searchCriteria.travelClass || "Phổ thông",
      departDate: searchCriteria.departDate,
      returnDate: searchCriteria.returnDate,
      from: searchCriteria.from,
      to: searchCriteria.to,
    };
  }, [searchCriteria]);

  // Pagination calculations
  const totalFlights = filteredAndSortedFlights.length;
  const totalPages = Math.ceil(totalFlights / FLIGHTS_PER_PAGE);
  const startIndex = (currentPage - 1) * FLIGHTS_PER_PAGE;
  const currentFlights = filteredAndSortedFlights.slice(
    startIndex,
    startIndex + FLIGHTS_PER_PAGE
  );

  console.log("currentFlights", currentFlights);
  console.log("📊 DEBUG: Flight rendering info:", {
    totalFlights,
    currentFlightsLength: currentFlights.length,
    hasCurrentFlights: currentFlights.length > 0,
    firstFlight: currentFlights[0] || "No flights",
    loading,
    error,
  });

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const getResultsTitle = useCallback(() => {
    if (!searchCriteria) {
      return {
        title:
          totalFlights > 0
            ? "Các chuyến bay phổ biến"
            : "Tìm chuyến bay phù hợp",
        showExpandButton: false,
      };
    }

    // Ensure from and to are strings
    const from = (() => {
      if (typeof searchCriteria.from === "string") return searchCriteria.from;
      if (
        searchCriteria.from &&
        typeof searchCriteria.from === "object" &&
        searchCriteria.from.city
      ) {
        return searchCriteria.from.city;
      }
      return "";
    })();
    const to = (() => {
      if (typeof searchCriteria.to === "string") return searchCriteria.to;
      if (
        searchCriteria.to &&
        typeof searchCriteria.to === "object" &&
        searchCriteria.to.city
      ) {
        return searchCriteria.to.city;
      }
      return "";
    })();

    if (from === "Việt Nam" && to && to !== "Việt Nam") {
      return {
        title: `Chuyến bay từ Việt Nam đến ${to}`,
        showExpandButton: false,
      };
    }

    if (to === "Việt Nam" && from && from !== "Việt Nam") {
      return {
        title: `Chuyến bay từ ${from} đến Việt Nam`,
        showExpandButton: false,
      };
    }

    if (searchCriteria.searchCombinations?.length > 1) {
      // Helper function to get primary city name
      const getPrimaryCity = (location) => {
        if (!location) return "N/A";
        if (typeof location === "string") return location;

        // Extract primary city name from city string (before first comma)
        if (location.city && typeof location.city === "string") {
          return location.city.split(",")[0].trim();
        }

        return location.airportCode || "N/A";
      };

      const displayCount = showAllCombinations
        ? searchCriteria.searchCombinations.length
        : 3;
      const combinationsText = searchCriteria.searchCombinations
        .slice(0, displayCount)
        .map((combo) => {
          const fromCity = getPrimaryCity(combo.from);
          const toCity = getPrimaryCity(combo.to);

          return `${fromCity} → ${toCity}`;
        })
        .join(", ");

      const remaining = searchCriteria.searchCombinations.length - displayCount;
      const remainingText = remaining > 0 ? ` và ${remaining} tuyến khác` : "";

      return {
        title: `Chuyến bay: ${combinationsText}${remainingText} (${searchCriteria.searchCombinations.length} tuyến)`,
        showExpandButton: searchCriteria.searchCombinations.length > 3,
      };
    }

    if (from && to) {
      return {
        title: `Chuyến bay từ ${from} đến ${to}`,
        showExpandButton: false,
      };
    }

    if (from) {
      return {
        title: `Chuyến bay nội địa từ ${from}`,
        showExpandButton: false,
      };
    }

    return {
      title: "Khám phá các chuyến bay giá tốt",
      showExpandButton: false,
    };
  }, [searchCriteria, totalFlights, showAllCombinations]);

  return (
    <div className="mx-auto">
      {/* Search Form with Background Image */}
      <div className="relative mb-12">
        <div
          className="h-80 bg-cover bg-center bg-no-repeat relative"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1713396124163-21d4ea332d90?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDIyfHx8ZW58MHx8fHx8')`,
          }}
        >
          <div className="absolute inset-0 bg-opacity-50"></div>
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-3xl font-bold mb-2">
                Tìm chuyến bay của bạn
              </h1>
              <p className="text-lg opacity-90">
                Khám phá thế giới với những ưu đãi tuyệt vời
              </p>
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl px-4 z-20">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200">
            <SearchForm
              onSearch={handleSearch}
              initialValues={searchFormInitialValues}
            />
          </div>
        </div>
      </div>

      <DealsSection />

      {/* Debug Panel - Chỉ hiển thị trong development */}
      {/* {process.env.NODE_ENV === "development" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">
              🔍 Debug: Search Criteria Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <strong className="text-yellow-700">Source:</strong>
                <span className="ml-2 text-yellow-600">
                  {location.state?.searchCriteria
                    ? "🎯 Destination Click"
                    : searchParams.get("from") || searchParams.get("to")
                    ? "🔗 URL Params (Home Page)"
                    : searchCriteria
                    ? "📱 Context"
                    : "📋 Default (No Criteria)"}
                </span>
              </div>
              <div>
                <strong className="text-yellow-700">API Call:</strong>
                <span className="ml-2 text-yellow-600">
                  {!searchCriteria
                    ? "getAllFlights({ size: 200 })"
                    : searchCriteria.searchCombinations?.length > 1
                    ? `Multiple searches: ${searchCriteria.searchCombinations.length} combinations`
                    : typeof searchCriteria.from === "string" &&
                      typeof searchCriteria.to === "string" &&
                      !searchCriteria.from.includes("(") &&
                      !searchCriteria.to.includes("(")
                    ? `findFlightsBetweenCountries("${searchCriteria.from}", "${searchCriteria.to}", { size: 50 })`
                    : searchCriteria.tripType === "oneway"
                    ? "searchOneWayFlights({ departureAirportId, arrivalAirportId, date, size: 100 })"
                    : searchCriteria.tripType === "roundtrip"
                    ? "searchRoundTripFlights({ departureAirportId, arrivalAirportId, outboundDate, returnDate, size: 100 })"
                    : "getAllFlights({ size: 200 })"}
                </span>
              </div>
              <div>
                <strong className="text-yellow-700">From:</strong>
                <span className="ml-2 text-yellow-600">
                  "
                  {typeof searchCriteria?.from === "string"
                    ? searchCriteria.from
                    : JSON.stringify(searchCriteria?.from) || "N/A"}
                  "
                </span>
              </div>
              <div>
                <strong className="text-yellow-700">To:</strong>
                <span className="ml-2 text-yellow-600">
                  "
                  {typeof searchCriteria?.to === "string"
                    ? searchCriteria.to
                    : JSON.stringify(searchCriteria?.to) || "N/A"}
                  "
                </span>
              </div>
              <div>
                <strong className="text-yellow-700">Trip Type:</strong>
                <span className="ml-2 text-yellow-600">
                  {searchCriteria?.tripType || "N/A"}
                </span>
              </div>
              <div>
                <strong className="text-yellow-700">Combinations:</strong>
                <span className="ml-2 text-yellow-600">
                  {searchCriteria?.searchCombinations?.length || 0} combinations
                  {showAllCombinations && " (showing all)"}
                </span>
              </div>
              <div>
                <strong className="text-yellow-700">Airport IDs:</strong>
                <span className="ml-2 text-yellow-600">
                  {searchCriteria?.from && searchCriteria?.to
                    ? "Processed by flight hook"
                    : "N/A"}
                </span>
              </div>
              <div>
                <strong className="text-yellow-700">Passengers:</strong>
                <span className="ml-2 text-yellow-600">
                  {searchCriteria?.passengers
                    ? JSON.stringify(searchCriteria.passengers)
                    : "N/A"}
                </span>
              </div>
              <div>
                <strong className="text-yellow-700">URL Params:</strong>
                <span className="ml-2 text-yellow-600">
                  from="{searchParams.get("from")}", to="
                  {searchParams.get("to")}"
                </span>
              </div>
              <div>
                <strong className="text-yellow-700">Location State:</strong>
                <span className="ml-2 text-yellow-600">
                  {location.state?.searchCriteria
                    ? "Has criteria"
                    : "No criteria"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Flight Flex Search - Chỉ hiển thị khi có search criteria */}
      {searchCriteria && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 pt-16">
          <FlightFlexSearch
            searchCriteria={searchCriteria}
            allFlights={allFlights}
            onDateSelect={(dateSelection) => {
              if (
                typeof dateSelection === "object" &&
                dateSelection.departDate
              ) {
                // Round trip selection
                const updatedCriteria = {
                  ...searchCriteria,
                  departDate: dateSelection.departDate,
                  returnDate: dateSelection.returnDate,
                };
                handleSearch(updatedCriteria);
              } else {
                // One way selection
                const updatedCriteria = {
                  ...searchCriteria,
                  departDate: dateSelection,
                };
                handleSearch(updatedCriteria);
              }
            }}
          />
        </div>
      )}

      {/* Results Section */}
      <div ref={resultsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="hidden lg:block w-80 flex-shrink-0">
            <FlightFilters
              filters={filters}
              onFiltersChange={setFilters}
              onReset={handleResetFilters}
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {getResultsTitle().title}
                  </h2>
                  {getResultsTitle().showExpandButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowAllCombinations(!showAllCombinations)
                      }
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      {showAllCombinations ? "Thu gọn" : "Xem thêm"}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {searchCriteria && totalFlights > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={clearSearchCriteria}
                      title="Xóa tiêu chí tìm kiếm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  <p className="text-xs sm:text-sm text-gray-600">
                    {totalFlights > 0 && (
                      <>
                        {totalFlights} chuyến bay tìm thấy
                        {searchCriteria?.searchCombinations?.length > 1 && (
                          <span className="text-blue-600">
                            {" "}
                            từ {searchCriteria.searchCombinations.length} tuyến
                          </span>
                        )}
                        <span className="ml-2">
                          (Trang {currentPage} / {totalPages})
                        </span>
                      </>
                    )}
                    {totalFlights === 0 &&
                      searchCriteria &&
                      "Không có chuyến bay nào"}
                    {totalFlights === 0 &&
                      !searchCriteria &&
                      "Sử dụng form tìm kiếm để bắt đầu"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="lg:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Bộ lọc
                  </Button>
                </div>

                <div className="flex gap-1 sm:gap-2 overflow-x-auto">
                  {FLIGHT_TABS.map((tab) => (
                    <Button
                      key={tab.key}
                      variant="outline"
                      size="sm"
                      className={`whitespace-nowrap text-xs sm:text-sm ${
                        activeTab === tab.key
                          ? "bg-blue-50 text-blue-600 border-blue-200"
                          : ""
                      }`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Filters Drawer */}
            {showMobileFilters && (
              <div className="lg:hidden mb-4">
                <div className="bg-white border rounded-lg p-4">
                  <FlightFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onReset={handleResetFilters}
                  />
                </div>
              </div>
            )}

            {/* Error Display */}
            {/* {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Lỗi tải dữ liệu
                    </h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Thử lại
                    </Button>
                  </div>
                </div>
              </div>
            )} */}

            {/* Flight Results List */}
            <div className="space-y-3 sm:space-y-4">
              {loading ? (
                <EmptyState type="loading" />
              ) : totalFlights > 0 ? (
                currentFlights.map((flight, index) => (
                  <FlightCard
                    key={`flight-${flight.id}-${index}`}
                    flight={flight}
                    expandedFlights={expandedFlights}
                    selectedFares={selectedFares}
                    onToggleDetails={toggleDetails}
                    onSelectFare={handleSelectFare}
                    onProceedToBooking={handleProceedToBooking}
                  />
                ))
              ) : !searchCriteria ? (
                <EmptyState
                  type="noSearch"
                  onAction={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                />
              ) : (
                <EmptyState
                  type="noResults"
                  onAction={clearSearchCriteria}
                  actionText="Tìm chuyến bay khác"
                />
              )}
            </div>

            {/* Pagination */}
            {totalFlights > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={FLIGHTS_PER_PAGE}
                totalItems={totalFlights}
                onPageChange={handlePageChange}
                showPageSizeSelector={false}
                showFirstLast={false}
                maxVisiblePages={5}
                className="mt-6 sm:mt-8"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlightSearchResults;
