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
import { flightApi } from "../../../apis/flight-api";

import {
  FLIGHTS_PER_PAGE,
  DEFAULT_FILTERS,
  FLIGHT_TABS,
  FARE_OPTIONS,
  getDepartureTimeSlot,
} from "./flight-constants.jsx";
import { EmptyState } from "./flight-components.jsx";

// Main Component
export function FlightSearchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { searchCriteria, updateSearchCriteria, clearSearchCriteria } =
    useSearch();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState("ONE_WAY");
  const [tabExpandedFlights, setTabExpandedFlights] = useState({}); // Separate expanded flights per tab
  const [selectedFares, setSelectedFares] = useState({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [tabPages, setTabPages] = useState({}); // Separate pagination per tab
  const [showAllCombinations, setShowAllCombinations] = useState(false);

  // Flight data states (changed to itineraries for better handling of multi-leg trips)
  const [allItineraries, setAllItineraries] = useState([]);
  const [allFlights, setAllFlights] = useState([]); // Store all flights for filtering
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [flightsLoaded, setFlightsLoaded] = useState(false); // Prevent multiple loads

  // Ref for results section to scroll to
  const resultsRef = useRef(null);

  // Load all flights on component mount (only once)
  useEffect(() => {
    if (!flightsLoaded && !loading) {
      loadAllFlights();
    }
  }, [flightsLoaded, loading]);

  // Filter flights when they're first loaded (only on initial load, not on tab changes)
  useEffect(() => {
    if (
      allFlights.length > 0 &&
      flightsLoaded &&
      !loading &&
      allItineraries.length === 0
    ) {
      filterFlightsByTripType(allFlights, activeTab);
    }
  }, [allFlights, flightsLoaded, loading, allItineraries.length]); // Removed activeTab to prevent double filtering

  // Reset page when filters change for current tab
  useEffect(() => {
    setTabPages((prev) => ({
      ...prev,
      [activeTab]: 1,
    }));
  }, [filters, searchCriteria, activeTab]);

  // Initialize expanded flights and pages for tabs when component mounts
  useEffect(() => {
    setTabExpandedFlights((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] || new Set(),
    }));
    setTabPages((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] || 1,
    }));
  }, [activeTab]);

  // Auto search when searchCriteria is set from destination click (only if no flights loaded)
  useEffect(() => {
    if (
      searchCriteria &&
      !loading &&
      allItineraries.length === 0 &&
      allFlights.length === 0 &&
      !flightsLoaded
    ) {
      // Check if we have direct flights data from destination click
      if (location.state?.flightsData) {
        processFlightsData(location.state.flightsData);
      } else {
        handleSearch(searchCriteria);
      }
    }
  }, [
    searchCriteria,
    location.state,
    allFlights.length,
    allItineraries.length,
    loading,
    flightsLoaded,
  ]);

  // Scroll to results section when itineraries are loaded
  useEffect(() => {
    if (allItineraries.length > 0 && resultsRef.current && !loading) {
      resultsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [allItineraries.length, loading]);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setActiveTab("ONE_WAY");
    setTabPages((prev) => ({
      ...prev,
      ONE_WAY: 1,
    }));
    setTabExpandedFlights((prev) => ({
      ...prev,
      ONE_WAY: new Set(),
    }));
  }, []);

  // Filter flights by trip type and convert to itineraries
  const filterFlightsByTripType = useCallback((flights, tripType) => {
    let filteredFlights = [];

    if (tripType === "ONE_WAY") {
      filteredFlights = flights.filter(
        (flight) =>
          flight.tripType === "ONE_WAY" || flight.tripType === "one_way"
      );
    } else if (tripType === "ROUND_TRIP") {
      // For ROUND_TRIP, we need to group flights into pairs
      const roundTripFlights = flights.filter(
        (flight) =>
          flight.tripType === "ROUND_TRIP" ||
          flight.tripType === "round_trip" ||
          flight.type === "ROUND_TRIP" ||
          flight.type === "round_trip"
      );

      // If no round trip flights found, try to create pairs from one-way flights
      if (roundTripFlights.length === 0) {
        const oneWayFlights = flights.filter(
          (flight) =>
            flight.tripType === "ONE_WAY" ||
            flight.tripType === "one_way" ||
            flight.type === "ONE_WAY" ||
            flight.type === "one_way" ||
            (!flight.tripType && !flight.type)
        );

        // Group flights by route (departure -> arrival)
        const routeGroups = {};
        oneWayFlights.forEach((flight) => {
          const routeKey = `${flight.departureAirport?.airportCode}-${flight.arrivalAirport?.airportCode}`;
          if (!routeGroups[routeKey]) {
            routeGroups[routeKey] = [];
          }
          routeGroups[routeKey].push(flight);
        });

        // Create round trip pairs from routes that have both directions
        const flightPairs = [];
        Object.keys(routeGroups).forEach((routeKey) => {
          const [dep, arr] = routeKey.split("-");
          const returnRouteKey = `${arr}-${dep}`;

          if (
            routeGroups[returnRouteKey] &&
            routeGroups[routeKey].length > 0 &&
            routeGroups[returnRouteKey].length > 0
          ) {
            // Take first flight from each direction to create a pair
            const outbound = routeGroups[routeKey][0];
            const inbound = routeGroups[returnRouteKey][0];

            flightPairs.push({
              outbound,
              inbound,
            });
          }
        });

        filteredFlights = flightPairs;
      } else {
        // Group existing round trip flights by roundTripGroupId or create pairs based on route
        const flightPairs = [];
        const processedFlights = new Set();

        for (const flight of roundTripFlights) {
          if (processedFlights.has(flight.flightId)) continue;

          // Try to find matching return flight
          let matchingReturnFlight = null;

          if (flight.roundTripGroupId) {
            // If flight has roundTripGroupId, find the matching flight
            matchingReturnFlight = roundTripFlights.find(
              (f) =>
                f.roundTripGroupId === flight.roundTripGroupId &&
                f.flightId !== flight.flightId &&
                !processedFlights.has(f.flightId)
            );
          } else {
            // If no roundTripGroupId, try to find by route (reverse direction)
            matchingReturnFlight = roundTripFlights.find(
              (f) =>
                f.departureAirport?.airportCode ===
                  flight.arrivalAirport?.airportCode &&
                f.arrivalAirport?.airportCode ===
                  flight.departureAirport?.airportCode &&
                f.flightId !== flight.flightId &&
                !processedFlights.has(f.flightId)
            );
          }

          if (matchingReturnFlight) {
            // Create a pair
            const outbound =
              flight.departureTime < matchingReturnFlight.departureTime
                ? flight
                : matchingReturnFlight;
            const inbound =
              flight.departureTime < matchingReturnFlight.departureTime
                ? matchingReturnFlight
                : flight;

            flightPairs.push({
              outbound,
              inbound,
            });

            processedFlights.add(flight.flightId);
            processedFlights.add(matchingReturnFlight.flightId);
          } else {
            // If no matching flight found, treat as single flight (shouldn't happen for round trip)
            console.warn(
              "No matching return flight found for:",
              flight.flightId
            );
          }
        }

        filteredFlights = flightPairs;
      }
    } else if (tripType === "MULTI_CITY") {
      filteredFlights = flights.filter(
        (flight) =>
          flight.tripType === "MULTI_CITY" || flight.tripType === "multi_city"
      );
    } else {
      // Default to ONE_WAY if unknown trip type
      filteredFlights = flights.filter(
        (flight) =>
          flight.tripType === "ONE_WAY" || flight.tripType === "one_way"
      );
    }

    // Convert to itineraries format
    let itineraries = [];

    if (tripType === "ROUND_TRIP") {
      // For ROUND_TRIP, each pair becomes an itinerary with two legs
      itineraries = filteredFlights.map((pair, index) => ({
        itineraryId: `roundtrip-${pair.outbound.flightId}-${
          pair.inbound.flightId || index
        }`,
        tripType: tripType,
        legs: [pair.outbound, pair.inbound],
        totalPrice:
          (pair.outbound.basePrice || 0) + (pair.inbound.basePrice || 0),
        totalDuration:
          (pair.outbound.duration || 0) + (pair.inbound.duration || 0),
        totalStops:
          (pair.outbound.stopsList?.length || 0) +
          (pair.inbound.stopsList?.length || 0),
      }));
    } else {
      // For ONE_WAY and MULTI_CITY, each flight is a single-leg itinerary
      itineraries = filteredFlights.map((flight, index) => ({
        itineraryId: `${tripType.toLowerCase()}-${flight.flightId || index}`,
        tripType: tripType,
        legs: [flight],
        totalPrice: flight.basePrice || 0,
        totalDuration: flight.duration || 0,
        totalStops: flight.stopsList?.length || 0,
      }));
    }

    setAllItineraries(itineraries);
  }, []);

  // Filter flights when they're first loaded
  const handleTripTypeChange = useCallback(
    (newTripType) => {
      setActiveTab((prevActiveTab) => {
        if (prevActiveTab !== newTripType) {
          // Reset expanded flights for the new tab
          setTabExpandedFlights((prev) => ({
            ...prev,
            [newTripType]: new Set(),
          }));

          // Reset page for the new tab
          setTabPages((prev) => ({
            ...prev,
            [newTripType]: 1,
          }));

          // Filter flights immediately when trip type changes (only if flights are loaded)
          if (allFlights.length > 0 && flightsLoaded && !loading) {
            filterFlightsByTripType(allFlights, newTripType);
          }

          return newTripType;
        }

        return prevActiveTab;
      });
    },
    [allFlights, flightsLoaded, loading]
  );

  // Load all flights from API
  const loadAllFlights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await flightApi.getAllFlights({ size: 100 });

      if (response.success && response.data?.content) {
        setAllFlights(response.data.content);

        // Reset expanded flights for all tabs when new flights are loaded
        setTabExpandedFlights({});
        setTabPages({});

        // Flights loaded successfully - filtering will happen when activeTab changes
      } else {
        console.warn("⚠️ No flights data received");
        setAllFlights([]);
        setAllItineraries([]);
      }
    } catch (err) {
      console.error("❌ Error loading flights:", err);
      setError("Không thể tải danh sách chuyến bay");
      setAllFlights([]);
      setAllItineraries([]);
    } finally {
      setLoading(false);
      setFlightsLoaded(true); // Mark as loaded to prevent re-loading
    }
  }, []);

  const toggleDetails = useCallback(
    (itineraryId) => {
      setTabExpandedFlights((prev) => {
        const currentTabExpanded = prev[activeTab] || new Set();
        const newSet = new Set(currentTabExpanded);
        if (newSet.has(itineraryId)) {
          newSet.delete(itineraryId);
        } else {
          newSet.add(itineraryId);
        }
        return {
          ...prev,
          [activeTab]: newSet,
        };
      });
    },
    [activeTab]
  );

  const handleSelectFare = useCallback((itineraryId, fareId) => {
    setSelectedFares((prev) => ({ ...prev, [itineraryId]: fareId }));
  }, []);

  const handleProceedToBooking = useCallback(
    (itinerary, fareData) => {
      // Handle round trip fare selection
      if (
        typeof fareData === "object" &&
        fareData.outbound &&
        fareData.return
      ) {
        const outboundFare = FARE_OPTIONS.find(
          (fare) => fare.id === fareData.outbound
        );
        const returnFare = FARE_OPTIONS.find(
          (fare) => fare.id === fareData.return
        );

        localStorage.setItem("selectedItinerary", JSON.stringify(itinerary));
        localStorage.setItem(
          "selectedOutboundFare",
          JSON.stringify(outboundFare)
        );
        localStorage.setItem("selectedReturnFare", JSON.stringify(returnFare));
        navigate("/booking-stepper", {
          state: {
            itinerary,
            selectedOutboundFare: outboundFare,
            selectedReturnFare: returnFare,
          },
        });
      } else {
        // Handle one way fare selection
        const selectedFare = FARE_OPTIONS.find((fare) => fare.id === fareData);
        localStorage.setItem("selectedItinerary", JSON.stringify(itinerary));
        localStorage.setItem("selectedFare", JSON.stringify(selectedFare));
        navigate("/booking-stepper", {
          state: { itinerary, selectedFare },
        });
      }
    },
    [navigate]
  );

  // Handle flight search with optimized itinerary processing
  const handleSearch = useCallback(
    async (searchData) => {
      setLoading(true);
      setError(null);

      // Helper function to format date consistently
      const formatDateForAPI = (dateInput) => {
        if (!dateInput) return null;
        const date = new Date(dateInput);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const formatted = `${year}-${month}-${day}`;
        console.log("formatDateForAPI:", {
          input: dateInput,
          inputType: typeof dateInput,
          localDateString: date.toLocaleDateString("vi-VN"),
          formatted,
        });
        return formatted;
      };

      try {
        // Prepare request data based on trip type
        let requestData = {};

        if (searchData.tripType === "ONE_WAY") {
          // Handle multiple airport combinations
          const fromAirports = searchData.fromLocations || [searchData.from];
          const toAirports = searchData.toLocations || [searchData.to];

          // If only single airport pair, use simple format as per API spec
          if (fromAirports.length === 1 && toAirports.length === 1) {
            requestData = {
              tripType: "ONE_WAY",
              departureAirportId:
                fromAirports[0]?.airportId || fromAirports[0]?.id,
              arrivalAirportId: toAirports[0]?.airportId || toAirports[0]?.id,
              outboundDepartureDate: formatDateForAPI(searchData.departDate),
            };
          } else {
            // Multiple combinations - create combinations array
            const combinations = [];
            fromAirports.forEach((from) => {
              toAirports.forEach((to) => {
                if (from?.airportId !== to?.airportId) {
                  // Avoid same airport
                  combinations.push({
                    departureAirportId: from?.airportId || from?.id,
                    arrivalAirportId: to?.airportId || to?.id,
                    outboundDepartureDate: formatDateForAPI(
                      searchData.departDate
                    ),
                  });
                }
              });
            });

            requestData = {
              tripType: "ONE_WAY",
              combinations: combinations, // Send all combinations
            };
          }
        } else if (searchData.tripType === "ROUND_TRIP") {
          // Handle multiple airport combinations for round trip
          const fromAirports = searchData.fromLocations || [searchData.from];
          const toAirports = searchData.toLocations || [searchData.to];

          // If only single airport pair, use simple format as per API spec
          if (fromAirports.length === 1 && toAirports.length === 1) {
            requestData = {
              tripType: "ROUND_TRIP",
              departureAirportId:
                fromAirports[0]?.airportId || fromAirports[0]?.id,
              arrivalAirportId: toAirports[0]?.airportId || toAirports[0]?.id,
              outboundDepartureDate: searchData.departDate
                ? (() => {
                    const date = new Date(searchData.departDate);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    return `${year}-${month}-${day}`;
                  })()
                : null,
              returnDate: searchData.returnDate
                ? (() => {
                    const date = new Date(searchData.returnDate);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    return `${year}-${month}-${day}`;
                  })()
                : null,
            };
          } else {
            // Multiple combinations - create combinations array
            const combinations = [];
            fromAirports.forEach((from) => {
              toAirports.forEach((to) => {
                if (from?.airportId !== to?.airportId) {
                  // Avoid same airport
                  combinations.push({
                    departureAirportId: from?.airportId || from?.id,
                    arrivalAirportId: to?.airportId || to?.id,
                    outboundDepartureDate: formatDateForAPI(
                      searchData.departDate
                    ),
                    returnDate: formatDateForAPI(searchData.returnDate),
                  });
                }
              });
            });

            requestData = {
              tripType: "ROUND_TRIP",
              combinations: combinations, // Send all combinations
            };
          }
        } else if (searchData.tripType === "MULTI_CITY") {
          requestData = {
            tripType: "MULTI_CITY",
            multiCityLegs:
              searchData.multiTrips?.map((trip) => ({
                departureAirportId:
                  trip.from?.[0]?.airportId || trip.from?.[0]?.id,
                arrivalAirportId: trip.to?.[0]?.airportId || trip.to?.[0]?.id,
                departureDate: formatDateForAPI(trip.date),
              })) || [],
          };
        }

        const response = await flightApi.searchUnifiedFlights(requestData);

        if (response.success) {
          // Process the response data into itineraries based on trip type
          let itineraries = [];

          if (
            searchData.tripType === "ONE_WAY" &&
            response.data.oneWayFlights?.content
          ) {
            itineraries = response.data.oneWayFlights.content.map(
              (flight, index) => ({
                itineraryId: `oneway-${flight.flightId || index}`,
                tripType: "ONE_WAY",
                legs: [flight],
                totalPrice: flight.basePrice || 0,
                totalDuration: flight.duration || 0,
                totalStops: flight.stopsList?.length || 0,
                // Add route info for display
                routeInfo: `${
                  flight.departureAirport?.airportCode || "N/A"
                } → ${flight.arrivalAirport?.airportCode || "N/A"}`,
              })
            );
          } else if (
            searchData.tripType === "ROUND_TRIP" &&
            response.data.roundTripPairs
          ) {
            // For ROUND_TRIP with combinations, each pair is an itinerary with two legs
            itineraries = response.data.roundTripPairs.map((pair, index) => ({
              itineraryId: `roundtrip-${pair.outbound.flightId || index}`,
              tripType: "ROUND_TRIP",
              legs: [pair.outbound, pair.inbound],
              totalPrice:
                (pair.outbound.basePrice || 0) + (pair.inbound.basePrice || 0),
              totalDuration:
                (pair.outbound.duration || 0) + (pair.inbound.duration || 0),
              totalStops:
                (pair.outbound.stopsList?.length || 0) +
                (pair.inbound.stopsList?.length || 0),
              // Add route info for display
              routeInfo: `${
                pair.outbound.departureAirport?.airportCode || "N/A"
              } ↔ ${pair.outbound.arrivalAirport?.airportCode || "N/A"}`,
            }));
          } else if (
            searchData.tripType === "MULTI_CITY" &&
            response.data.multiCityFlights
          ) {
            const legs = response.data.multiCityFlights.map(
              (leg) => leg.content || []
            );

            const generateCombinations = (legs, current = [], index = 0) => {
              if (index === legs.length) {
                return [current];
              }
              const combinations = [];
              for (const flight of legs[index]) {
                combinations.push(
                  ...generateCombinations(legs, [...current, flight], index + 1)
                );
              }
              return combinations;
            };

            const allCombinations = generateCombinations(legs);

            // Limit to reasonable number (e.g., 50) and sort by total price
            const limitedCombinations = allCombinations
              .map((combo, comboIndex) => {
                const totalPrice = combo.reduce(
                  (sum, f) => sum + (f.basePrice || 0),
                  0
                );
                const totalDuration = combo.reduce(
                  (sum, f) => sum + (f.duration || 0),
                  0
                );
                const totalStops = combo.reduce(
                  (sum, f) => sum + (f.stopsList?.length || 0),
                  0
                );
                return {
                  itineraryId: `multicity-${comboIndex}`,
                  tripType: "MULTI_CITY",
                  legs: combo,
                  totalPrice,
                  totalDuration,
                  totalStops,
                };
              })
              .sort((a, b) => a.totalPrice - b.totalPrice)
              .slice(0, 50); // Limit to 50 to prevent performance issues

            itineraries = limitedCombinations;
          }

          setAllItineraries(itineraries);

          // Update search criteria with proper format for SearchForm
          const updatedSearchCriteria = {
            ...searchData,
            // Ensure arrays are preserved for SearchForm compatibility
            fromLocations:
              searchData.fromLocations ||
              (searchData.from ? [searchData.from] : []),
            toLocations:
              searchData.toLocations || (searchData.to ? [searchData.to] : []),
            // Keep single values for backward compatibility
            from: searchData.fromLocations?.[0] || searchData.from,
            to: searchData.toLocations?.[0] || searchData.to,
          };

          updateSearchCriteria(updatedSearchCriteria);

          // Reset expanded flights and pages when new search results are loaded
          setTabExpandedFlights({});
          setTabPages({});

          // Scroll to results
          setTimeout(() => {
            if (resultsRef.current) {
              resultsRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }, 100);
        } else {
          setError(response.message || "Có lỗi xảy ra khi tìm kiếm chuyến bay");
          setAllItineraries([]);
        }
      } catch (err) {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
        setAllItineraries([]);
      } finally {
        setLoading(false);
      }
    },
    [updateSearchCriteria]
  );

  // Process direct flights data from destination click
  const processFlightsData = useCallback((flights) => {
    setLoading(true);
    setError(null);

    try {
      // Convert flights array to itineraries format (same as ONE_WAY processing)
      const itineraries = flights.map((flight, index) => ({
        itineraryId: `oneway-${flight.flightId || index}`,
        tripType: "ONE_WAY",
        legs: [flight],
        totalPrice: flight.basePrice || 0,
        totalDuration: flight.duration || 0,
        totalStops: flight.stopsList?.length || 0,
      }));

      setAllItineraries(itineraries);
      setLoading(false);

      // Reset expanded flights and pages when new flights are processed
      setTabExpandedFlights({});
      setTabPages({});

      // Scroll to results
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    } catch (err) {
      console.error("Error processing flights data:", err);
      setError("Có lỗi xảy ra khi xử lý dữ liệu chuyến bay");
      setAllItineraries([]);
      setLoading(false);
    }
  }, []);

  const filteredAndSortedItineraries = useMemo(() => {
    let filtered = allItineraries.filter((itinerary) => {
      // Price filter (use totalPrice)
      if (
        itinerary.totalPrice < filters.priceRange[0] ||
        itinerary.totalPrice > filters.priceRange[1]
      ) {
        return false;
      }

      // Airline filter (check if any leg matches selected airlines)
      if (filters.airlines.length > 0) {
        const itineraryAirlines = new Set(
          itinerary.legs.map((leg) => leg.airline?.airlineName || leg.airline)
        );
        if (
          !filters.airlines.some((airline) => itineraryAirlines.has(airline))
        ) {
          return false;
        }
      }

      // aircraft filter - Filter flights by aircraft type
      // This handles various data structures from the API
      if (filters.aircraft && filters.aircraft.length > 0) {
        const itineraryAircrafts = new Set();

        // Collect all possible aircraft identifiers from itinerary legs
        itinerary.legs.forEach((leg) => {
          // Try to get aircraft info from various possible fields
          const aircraftInfo =
            leg.aircraft ||
            leg.aircraftId ||
            leg.aircraftName ||
            leg.aircraftCode;

          if (aircraftInfo) {
            if (typeof aircraftInfo === "object") {
              // If aircraft is an object, try to get name/code from it
              const name = aircraftInfo.aircraftName || aircraftInfo.name;
              const code = aircraftInfo.aircraftCode || aircraftInfo.code;
              if (name) itineraryAircrafts.add(name);
              if (code) itineraryAircrafts.add(code);
            } else {
              // If aircraft is a string/number, add it directly
              itineraryAircrafts.add(String(aircraftInfo));
            }
          }
        });

        // If no aircraft info available in any leg, skip filtering
        if (itineraryAircrafts.size === 0) {
          console.warn(
            "No aircraft information available for filtering - skipping aircraft filter"
          );
        } else {
          // Check if any selected aircraft matches any aircraft in the itinerary
          const hasMatchingAircraft = filters.aircraft.some(
            (selectedAircraft) =>
              itineraryAircrafts.has(selectedAircraft) ||
              // Also check partial matches (case-insensitive)
              Array.from(itineraryAircrafts).some(
                (itineraryAircraft) =>
                  itineraryAircraft
                    .toLowerCase()
                    .includes(selectedAircraft.toLowerCase()) ||
                  selectedAircraft
                    .toLowerCase()
                    .includes(itineraryAircraft.toLowerCase())
              )
          );

          if (!hasMatchingAircraft) {
            return false;
          }
        }
      }

      // stops filter
      if (filters.stops && filters.stops.length > 0) {
        const totalStops = itinerary.totalStops || 0;
        let stopCategory = "";
        if (totalStops === 0) {
          stopCategory = "non-stop";
        } else if (totalStops === 1) {
          stopCategory = "1-stop";
        } else if (totalStops >= 2) {
          stopCategory = "2-stops";
        }

        if (!filters.stops.includes(stopCategory)) {
          return false;
        }
      }

      // duration filter
      if (filters.duration && filters.duration.length > 0) {
        const totalDuration = itinerary.totalDuration || 0;
        let durationCategory = "";
        if (totalDuration <= 180) {
          // 3 hours
          durationCategory = "short";
        } else if (totalDuration <= 360) {
          // 6 hours
          durationCategory = "medium";
        } else {
          durationCategory = "long";
        }

        if (!filters.duration.includes(durationCategory)) {
          return false;
        }
      }

      // Departure time filter - Filter flights by departure time slot
      // Supports multiple time formats: ISO string, HH:MM string, Date object, timestamp
      if (filters.departureTime && filters.departureTime.length > 0) {
        const firstLegDepartureTime = itinerary.legs[0]?.departureTime;

        if (firstLegDepartureTime) {
          const firstLegTimeSlot = getDepartureTimeSlot(firstLegDepartureTime);

          if (firstLegTimeSlot) {
            // Debug log to see what time slot is being calculated
            console.log("Departure time filter:", {
              departureTime: firstLegDepartureTime,
              calculatedSlot: firstLegTimeSlot,
              selectedSlots: filters.departureTime,
              itineraryId: itinerary.itineraryId,
            });

            if (!filters.departureTime.includes(firstLegTimeSlot)) {
              return false;
            }
          } else {
            // If unable to determine time slot, skip this filter for this itinerary
            console.warn(
              "Unable to determine time slot for departure time:",
              firstLegDepartureTime,
              "in itinerary:",
              itinerary.itineraryId
            );
          }
        } else {
          // If no departure time available, skip this filter
          console.warn(
            "No departure time available for itinerary:",
            itinerary.itineraryId
          );
        }
      }

      return true;
    });

    // Tab filter - filter by trip type or flight type
    filtered = filtered.filter((itinerary) => {
      if (activeTab === "all") return true;

      // Trip type filters
      if (activeTab === "one-way" && itinerary.tripType !== "ONE_WAY")
        return false;
      if (activeTab === "round-trip" && itinerary.tripType !== "ROUND_TRIP")
        return false;
      if (activeTab === "multi-city" && itinerary.tripType !== "MULTI_CITY")
        return false;

      // Flight type filters (domestic/international)
      if (
        activeTab === "domestic" &&
        itinerary.legs.some((leg) => leg.type !== "DOMESTIC")
      )
        return false;
      if (
        activeTab === "international" &&
        itinerary.legs.some((leg) => leg.type !== "INTERNATIONAL")
      )
        return false;

      return true;
    });

    // Sort itineraries
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "price-asc":
          return a.totalPrice - b.totalPrice;
        case "price-desc":
          return b.totalPrice - a.totalPrice;
        case "departure-asc":
          return (
            new Date(a.legs[0]?.departureTime).getTime() -
            new Date(b.legs[0]?.departureTime).getTime()
          );
        case "departure-desc":
          return (
            new Date(b.legs[0]?.departureTime).getTime() -
            new Date(a.legs[0]?.departureTime).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [allItineraries, filters, activeTab]);

  // Prepare initial values for SearchForm
  const searchFormInitialValues = useMemo(() => {
    if (!searchCriteria) {
      // Use default trip type when no search criteria
      return {
        tripType: "ONE_WAY", // Use fixed default instead of activeTab
        passengers: {
          adults: 1,
          children: 0,
          infants: 0,
        },
        travelClass: "Phổ thông",
      };
    }

    // Convert single values to arrays for SearchForm compatibility
    const fromLocations =
      searchCriteria.fromLocations ||
      (searchCriteria.from ? [searchCriteria.from] : []);
    const toLocations =
      searchCriteria.toLocations ||
      (searchCriteria.to ? [searchCriteria.to] : []);

    return {
      tripType: searchCriteria.tripType || "ONE_WAY",
      passengers: searchCriteria.passengers || {
        adults: 1,
        children: 0,
        infants: 0,
      },
      travelClass: searchCriteria.travelClass || "Phổ thông",
      departDate: searchCriteria.departDate
        ? new Date(searchCriteria.departDate)
        : null,
      returnDate: searchCriteria.returnDate
        ? new Date(searchCriteria.returnDate)
        : null,
      fromLocations: fromLocations,
      toLocations: toLocations,
      multiTrips: searchCriteria.multiTrips,
    };
  }, [searchCriteria]);

  // Pagination calculations for current tab
  const currentPage = tabPages[activeTab] || 1;
  const totalItineraries = filteredAndSortedItineraries.length;
  const totalPages = Math.ceil(totalItineraries / FLIGHTS_PER_PAGE);
  const startIndex = (currentPage - 1) * FLIGHTS_PER_PAGE;
  const currentItineraries = filteredAndSortedItineraries.slice(
    startIndex,
    startIndex + FLIGHTS_PER_PAGE
  );

  const handlePageChange = useCallback(
    (page) => {
      setTabPages((prev) => ({
        ...prev,
        [activeTab]: page,
      }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [activeTab]
  );

  const getResultsTitle = useCallback(() => {
    if (!searchCriteria) {
      return {
        title:
          totalItineraries > 0
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
  }, [searchCriteria, totalItineraries, showAllCombinations]);

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
              onTripTypeChange={handleTripTypeChange}
            />
          </div>
        </div>
      </div>

      <DealsSection />

      {/* Flight Flex Search - Chỉ hiển thị khi có search criteria */}
      {searchCriteria && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 pt-16">
          <FlightFlexSearch
            searchCriteria={searchCriteria}
            allFlights={allItineraries.flatMap((it) => it.legs)} // Pass flattened legs for flex search if needed
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
      <div
        ref={resultsRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8"
      >
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
                  {searchCriteria && totalItineraries > 0 && (
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
                    {totalItineraries > 0 && (
                      <>
                        {totalItineraries} chuyến bay tìm thấy
                        {searchCriteria?.fromLocations?.length > 1 ||
                        searchCriteria?.toLocations?.length > 1 ? (
                          <span className="text-blue-600">
                            {" "}
                            từ{" "}
                            {(searchCriteria.fromLocations?.length || 1) *
                              (searchCriteria.toLocations?.length || 1)}{" "}
                            kết hợp sân bay
                          </span>
                        ) : searchCriteria?.searchCombinations?.length > 1 ? (
                          <span className="text-blue-600">
                            {" "}
                            từ {searchCriteria.searchCombinations.length} tuyến
                          </span>
                        ) : null}
                        <span className="ml-2">
                          (Trang {currentPage} / {totalPages})
                        </span>
                      </>
                    )}
                    {totalItineraries === 0 &&
                      searchCriteria &&
                      "Không có chuyến bay nào"}
                    {totalItineraries === 0 &&
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

            {/* Itinerary Results List */}
            <div className="space-y-3 sm:space-y-4">
              {loading ? (
                <EmptyState type="loading" />
              ) : totalItineraries > 0 ? (
                currentItineraries.map((itinerary) => (
                  <FlightCard
                    key={itinerary.itineraryId}
                    flight={itinerary} // Now passing itinerary object
                    expandedFlights={tabExpandedFlights[activeTab] || new Set()}
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
            {totalItineraries > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={FLIGHTS_PER_PAGE}
                totalItems={totalItineraries}
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
