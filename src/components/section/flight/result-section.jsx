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
  const [activeTab, setActiveTab] = useState("ALL"); // Flight type tabs or trip type tabs depending on context
  const [tripTypeFilter, setTripTypeFilter] = useState(null); // Trip type filter: ONE_WAY, ROUND_TRIP, null for all
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

  // Filter flights when they're first loaded (only once when all flights are loaded)
  useEffect(() => {
    if (
      allFlights.length > 0 &&
      flightsLoaded &&
      !loading &&
      allItineraries.length === 0
    ) {
      filterFlightsByTripType(allFlights, "ALL"); // Load all trip types
    }
  }, [allFlights, flightsLoaded, loading, allItineraries.length]); // Removed activeTab dependency

  // Reset page when filters change for current tab
  useEffect(() => {
    setTabPages((prev) => ({
      ...prev,
      [activeTab]: 1,
    }));
  }, [filters, searchCriteria, activeTab, tripTypeFilter]);

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
      !loading &&
      allItineraries.length === 0 &&
      allFlights.length === 0 &&
      !flightsLoaded
    ) {
      // Check if we have direct flights data from destination click
      if (
        location.state?.flightsData &&
        location.state?.flightsData.length > 0
      ) {
        // Extract search criteria from the first flight for search form compatibility
        const firstFlight = location.state.flightsData[0];

        // Helper function to format airport for search form compatibility
        const formatAirportForSearch = (airport) => {
          const primaryCityName =
            Array.isArray(airport.cityNames) && airport.cityNames.length > 0
              ? airport.cityNames[0]
              : airport.city || airport.cityName || "Unknown";

          return {
            airportId: airport.airportId,
            airportCode: airport.airportCode,
            cityNames:
              Array.isArray(airport.cityNames) && airport.cityNames.length > 0
                ? airport.cityNames
                : [primaryCityName],
            city: primaryCityName,
            country: airport.country || airport.countryName || "Vietnam",
            airportName:
              airport.airportName ||
              `${primaryCityName} (${airport.airportCode})`,
            displayName: `${primaryCityName} (${airport.airportCode})`,
          };
        };

        const extractedSearchCriteria = {
          from: formatAirportForSearch(firstFlight.departureAirport),
          to: formatAirportForSearch(firstFlight.arrivalAirport),
          tripType: "ONE_WAY",
          // Add other necessary fields for search form
          passengers: { adults: 1, children: 0, infants: 0 },
          travelClass: "Phổ thông",
        };

        // Set search criteria for search form display
        updateSearchCriteria(extractedSearchCriteria);

        // Process the flights data
        processFlightsData(location.state.flightsData);
      } else if (searchCriteria) {
        // Normal search flow
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
    updateSearchCriteria,
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
    setActiveTab("ALL");
    setTripTypeFilter(null);
    setTabPages((prev) => ({
      ...prev,
      ALL: 1,
    }));
    setTabExpandedFlights((prev) => ({
      ...prev,
      ALL: new Set(),
    }));
  }, []);

  // Helper function to get lowest price from flight travel classes
  const getLowestPrice = useCallback((flight) => {
    if (flight.flightTravelClasses && flight.flightTravelClasses.length > 0) {
      const prices = flight.flightTravelClasses
        .map((tc) => tc.customPrice || tc.price || tc.basePrice || 0)
        .filter((price) => price > 0);
      return prices.length > 0 ? Math.min(...prices) : flight.priceNumeric || 0;
    }
    return flight.priceNumeric || 0;
  }, []);

  // Filter flights by trip type and convert to itineraries
  const filterFlightsByTripType = useCallback((flights, tripType) => {
    console.log(
      `filterFlightsByTripType called with tripType: ${tripType}, flights count: ${flights.length}`
    );

    // Log tripType distribution
    const tripTypeCounts = {};
    flights.forEach((flight) => {
      const tripTypeKey = (flight.tripType || "undefined").toUpperCase();
      tripTypeCounts[tripTypeKey] = (tripTypeCounts[tripTypeKey] || 0) + 1;
    });
    console.log("Trip type distribution:", tripTypeCounts);

    let filteredFlights = [];

    // Normalize tripType to uppercase for consistent comparison
    const normalizedTripType = tripType.toUpperCase();

    if (normalizedTripType === "ONE_WAY") {
      filteredFlights = flights.filter(
        (flight) => (flight.tripType || "").toUpperCase() === "ONE_WAY"
      );
      console.log(`ONE_WAY: Found ${filteredFlights.length} flights`);
    } else if (normalizedTripType === "ROUND_TRIP") {
      // For ROUND_TRIP, we need to group flights into pairs
      const roundTripFlights = flights.filter(
        (flight) =>
          (flight.tripType || "").toUpperCase() === "ROUND_TRIP" ||
          (flight.type || "").toUpperCase() === "ROUND_TRIP"
      );
      console.log(
        `ROUND_TRIP: Found ${roundTripFlights.length} existing round trip flights`
      );
      console.log("Sample round trip flight:", roundTripFlights[0]);

      // If no round trip flights found, try to create pairs from one-way flights
      if (roundTripFlights.length === 0) {
        const oneWayFlights = flights.filter(
          (flight) =>
            (flight.tripType || "").toUpperCase() === "ONE_WAY" ||
            (flight.type || "").toUpperCase() === "ONE_WAY" ||
            (!flight.tripType && !flight.type)
        );
        console.log(
          `ROUND_TRIP: Found ${oneWayFlights.length} one-way flights to create pairs from`
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
            // If no matching flight found, treat as single-leg round trip itinerary
            console.warn(
              "No matching return flight found for:",
              flight.flightId,
              "- treating as single-leg round trip"
            );
            flightPairs.push({
              outbound: flight,
              inbound: null, // Mark as incomplete round trip
            });
            processedFlights.add(flight.flightId);
          }
        }

        filteredFlights = flightPairs;
      }
    } else if (normalizedTripType === "ALL") {
      // For ALL, include all flights regardless of trip type
      filteredFlights = flights;
      console.log(
        `ALL: Found ${filteredFlights.length} flights (all trip types)`
      );
    } else {
      // Default to ONE_WAY if unknown trip type
      filteredFlights = flights.filter(
        (flight) => (flight.tripType || "").toUpperCase() === "ONE_WAY"
      );
      console.log(
        `UNKNOWN tripType ${normalizedTripType}: Defaulting to ONE_WAY, found ${filteredFlights.length} flights`
      );
    }

    // Convert to itineraries format
    let itineraries = [];

    if (normalizedTripType === "ROUND_TRIP") {
      // For ROUND_TRIP, each pair becomes an itinerary with two legs
      itineraries = filteredFlights.map((pair, index) => {
        if (pair.inbound) {
          // Complete round trip with both legs
          return {
            itineraryId: `roundtrip-${pair.outbound.flightId}-${pair.inbound.flightId}`,
            tripType: "ROUND_TRIP",
            legs: [pair.outbound, pair.inbound],
            totalPrice:
              getLowestPrice(pair.outbound) + getLowestPrice(pair.inbound),
            totalDuration:
              (pair.outbound.duration || 0) + (pair.inbound.duration || 0),
            totalStops:
              (pair.outbound.stopsList?.length || 0) +
              (pair.inbound.stopsList?.length || 0),
          };
        } else {
          // Incomplete round trip - treat outbound as single leg
          return {
            itineraryId: `roundtrip-incomplete-${pair.outbound.flightId}`,
            tripType: "ROUND_TRIP",
            legs: [pair.outbound],
            totalPrice: getLowestPrice(pair.outbound),
            totalDuration: pair.outbound.duration || 0,
            totalStops: pair.outbound.stopsList?.length || 0,
          };
        }
      });
    } else if (normalizedTripType === "ALL") {
      // For ALL, create itineraries for all trip types
      const oneWayFlights = flights.filter(
        (flight) => (flight.tripType || "").toUpperCase() === "ONE_WAY"
      );

      const roundTripFlights = flights.filter(
        (flight) =>
          (flight.tripType || "").toUpperCase() === "ROUND_TRIP" ||
          (flight.type || "").toUpperCase() === "ROUND_TRIP"
      );

      // Create ONE_WAY itineraries
      const oneWayItineraries = oneWayFlights.map((flight, index) => ({
        itineraryId: `oneway-${flight.flightId || index}`,
        tripType: "ONE_WAY",
        legs: [flight],
        totalPrice: getLowestPrice(flight),
        totalDuration: flight.duration || 0,
        totalStops: flight.stopsList?.length || 0,
      }));

      // Create ROUND_TRIP itineraries (pair creation logic)
      const roundTripItineraries = [];
      const processedFlights = new Set();

      for (const flight of roundTripFlights) {
        if (processedFlights.has(flight.flightId)) continue;

        let matchingReturnFlight = null;
        if (flight.roundTripGroupId) {
          matchingReturnFlight = roundTripFlights.find(
            (f) =>
              f.roundTripGroupId === flight.roundTripGroupId &&
              f.flightId !== flight.flightId &&
              !processedFlights.has(f.flightId)
          );
        } else {
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
          const outbound =
            flight.departureTime < matchingReturnFlight.departureTime
              ? flight
              : matchingReturnFlight;
          const inbound =
            flight.departureTime < matchingReturnFlight.departureTime
              ? matchingReturnFlight
              : flight;

          roundTripItineraries.push({
            itineraryId: `roundtrip-${outbound.flightId}-${inbound.flightId}`,
            tripType: "ROUND_TRIP",
            legs: [outbound, inbound],
            totalPrice: getLowestPrice(outbound) + getLowestPrice(inbound),
            totalDuration: (outbound.duration || 0) + (inbound.duration || 0),
            totalStops:
              (outbound.stopsList?.length || 0) +
              (inbound.stopsList?.length || 0),
          });

          processedFlights.add(flight.flightId);
          processedFlights.add(matchingReturnFlight.flightId);
        } else {
          // Single leg round trip
          roundTripItineraries.push({
            itineraryId: `roundtrip-single-${flight.flightId}`,
            tripType: "ROUND_TRIP",
            legs: [flight],
            totalPrice: getLowestPrice(flight),
            totalDuration: flight.duration || 0,
            totalStops: flight.stopsList?.length || 0,
          });
          processedFlights.add(flight.flightId);
        }
      }

      // Combine all itineraries
      itineraries = [...oneWayItineraries, ...roundTripItineraries];
    } else {
      // For ONE_WAY, each flight is a single-leg itinerary
      itineraries = filteredFlights.map((flight, index) => ({
        itineraryId: `${normalizedTripType.toLowerCase()}-${
          flight.flightId || index
        }`,
        tripType: normalizedTripType,
        legs: [flight],
        totalPrice: getLowestPrice(flight),
        totalDuration: flight.duration || 0,
        totalStops: flight.stopsList?.length || 0,
      }));
    }

    setAllItineraries(itineraries);
    console.log(
      `Created ${itineraries.length} itineraries for tripType: ${normalizedTripType}`
    );
    console.log("filteredFlights sample:", filteredFlights.slice(0, 2));
    console.log("itineraries sample:", itineraries.slice(0, 2));
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
          // Note: This is now handled by useEffect with activeTab dependency
          // if (allFlights.length > 0 && flightsLoaded && !loading) {
          //   filterFlightsByTripType(allFlights, newTripType);
          // }

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

      console.log("All flights response:", response);

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
      // Handle multi-city fare selection
      if (itinerary.tripType === "MULTI_CITY") {
        const selectedFare = FARE_OPTIONS.find((fare) => fare.id === fareData);

        // Format datetime helper
        const formatTimeVN = (dateTime) => {
          if (!dateTime) return "";
          const date = new Date(dateTime);
          return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        };

        const formatDateVN = (dateTime) => {
          if (!dateTime) return "";
          const date = new Date(dateTime);
          return date.toLocaleDateString("vi-VN");
        };

        const formatDateTimeVN = (dateTime) => {
          if (!dateTime) return "";
          const date = new Date(dateTime);
          return (
            date.toLocaleDateString("vi-VN") +
            " " +
            date.toLocaleTimeString("vi-VN")
          );
        };

        const formatCurrencyVND = (amount) => {
          return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(amount);
        };

        // Generate multi-city flight ID with format: multi-city-{leg1Id}-{leg2Id}-...
        const legIds = itinerary.legs
          .map((leg) => leg.id || leg.flightId)
          .join("-");
        const multiCityFlightId = `multi-city-${legIds}`;

        // Generate combined flight number
        const flightNumbers = itinerary.legs
          .map((leg) => leg.flightNumber)
          .join(" → ");

        // Create multi-city selectedFlight data structure
        const selectedFlight = {
          type: "MULTI_CITY",
          tripType: "MULTI_CITY",
          flightId: multiCityFlightId,
          flightNumber: flightNumbers,
          airline:
            itinerary.legs[0]?.airline?.airlineName ||
            itinerary.legs[0]?.airline,
          airlineName:
            itinerary.legs[0]?.airline?.airlineName ||
            itinerary.legs[0]?.airline,
          airlineLogo:
            itinerary.legs[0]?.airline?.thumbnail ||
            itinerary.legs[0]?.airline?.logo,

          // All legs with complete information
          legs: itinerary.legs.map((leg, index) => ({
            id: leg.id || leg.flightId,
            flightId: leg.flightId || leg.id,
            flightNumber: leg.flightNumber,
            airline: leg.airline?.airlineName || leg.airline,
            airlineName: leg.airline?.airlineName || leg.airline,
            airlineLogo: leg.airline?.thumbnail || leg.airline?.logo,
            selectedClass: selectedFare,
            departureTime: formatTimeVN(leg.departureTime),
            arrivalTime: formatTimeVN(leg.arrivalTime),
            departureDate: formatDateVN(leg.departureTime),
            arrivalDate: formatDateVN(leg.arrivalTime),
            from: leg.departureAirport?.airportCode || leg.from,
            to: leg.arrivalAirport?.airportCode || leg.to,
            departureAirport: {
              code: leg.departureAirport?.airportCode || leg.from,
              name:
                leg.departureAirport?.airportName || leg.departureAirport?.name,
              city:
                leg.departureAirport?.city ||
                leg.departureAirport?.cityNames?.[0],
              airportName:
                leg.departureAirport?.airportName || leg.departureAirport?.name,
            },
            arrivalAirport: {
              code: leg.arrivalAirport?.airportCode || leg.to,
              name: leg.arrivalAirport?.airportName || leg.arrivalAirport?.name,
              city:
                leg.arrivalAirport?.city || leg.arrivalAirport?.cityNames?.[0],
              airportName:
                leg.arrivalAirport?.airportName || leg.arrivalAirport?.name,
            },
            duration: leg.duration,
            aircraft: leg.aircraft || leg.aircraftName,
            aircraftName: leg.aircraftName || leg.aircraft,
            // Aircraft details from API
            aircraftInfo:
              leg.aircraft && typeof leg.aircraft === "object"
                ? leg.aircraft
                : null,
            seatLayout: leg.aircraft?.seatLayout || null,
            totalSeats: leg.aircraft?.totalSeats || null,
            aircraftId: leg.aircraft?.aircraftId || null,
            aircraftCode: leg.aircraft?.aircraftCode || null,
            stops: leg.stops || 0,
            segmentIndex: index,
            segmentLabel: `Chặng ${index + 1}`,
          })),

          // Multi-city specific data
          totalDuration: itinerary.totalDuration,
          segmentCount: itinerary.legs?.length || 0,

          selectedClass: selectedFare,
          totalPrice: selectedFare?.price || itinerary.totalPrice || 0,
          formattedTotalPrice: formatCurrencyVND(
            selectedFare?.price || itinerary.totalPrice || 0
          ),
          currency: "VND",
          passengers: 1,
          bookingDate: formatDateTimeVN(new Date()),
        };

        console.log("🚀 Multi-city selectedFlight created:", selectedFlight);

        // Store in localStorage with the same key used by flight-detail-page
        localStorage.setItem("selectedFlight", JSON.stringify(selectedFlight));
        localStorage.setItem("selectedItinerary", JSON.stringify(itinerary));
        localStorage.setItem("selectedFare", JSON.stringify(selectedFare));

        navigate("/booking-stepper", {
          state: {
            itinerary,
            selectedFare,
            bookingData: selectedFlight,
          },
        });
      }
      // Handle round trip fare selection
      else if (
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
          // Handle multi-city by searching each segment separately and combining results
          console.log("MULTI_CITY search data:", searchData);
          console.log("Multi-city trips:", searchData.multiCityTrips);

          if (
            !searchData.multiCityTrips ||
            searchData.multiCityTrips.length === 0
          ) {
            setError("Không có thông tin chặng bay nào để tìm kiếm");
            return;
          }

          // Search each segment separately
          const segmentPromises = searchData.multiCityTrips.map(
            async (trip, segmentIndex) => {
              console.log(`Searching segment ${segmentIndex + 1}:`, trip);

              const fromAirports = trip.fromLocations || [];
              const toAirports = trip.toLocations || [];

              if (
                fromAirports.length === 0 ||
                toAirports.length === 0 ||
                !trip.departDate
              ) {
                console.log(`Segment ${segmentIndex + 1} missing data:`, {
                  fromAirports: fromAirports.length,
                  toAirports: toAirports.length,
                  departDate: !!trip.departDate,
                });
                return [];
              }

              // Create combinations for this segment
              const segmentFlights = [];

              for (const fromAirport of fromAirports) {
                for (const toAirport of toAirports) {
                  if (fromAirport?.airportId !== toAirport?.airportId) {
                    try {
                      const segmentRequestData = {
                        tripType: "ONE_WAY",
                        departureAirportId:
                          fromAirport?.airportId || fromAirport?.id,
                        arrivalAirportId: toAirport?.airportId || toAirport?.id,
                        outboundDepartureDate: formatDateForAPI(
                          trip.departDate
                        ),
                      };

                      console.log(
                        `Searching segment ${segmentIndex + 1} route:`,
                        segmentRequestData
                      );

                      const segmentResponse =
                        await flightApi.searchUnifiedFlights(
                          segmentRequestData
                        );

                      if (
                        segmentResponse.success &&
                        segmentResponse.data.oneWayFlights?.content
                      ) {
                        const flights =
                          segmentResponse.data.oneWayFlights.content.map(
                            (flight) => ({
                              ...flight,
                              segmentIndex,
                              segmentLabel: `Chặng ${segmentIndex + 1}`,
                            })
                          );
                        segmentFlights.push(...flights);
                        console.log(
                          `Found ${flights.length} flights for segment ${
                            segmentIndex + 1
                          } route`
                        );
                      }
                    } catch (error) {
                      console.error(
                        `Error searching segment ${segmentIndex + 1}:`,
                        error
                      );
                    }
                  }
                }
              }

              console.log(
                `Total flights found for segment ${segmentIndex + 1}:`,
                segmentFlights.length
              );
              return segmentFlights;
            }
          );

          try {
            const allSegmentFlights = await Promise.all(segmentPromises);
            console.log(
              "All segment results:",
              allSegmentFlights.map((seg, idx) => ({
                segment: idx + 1,
                flightCount: seg.length,
              }))
            );

            // Check if we have flights for all segments
            const hasFlightsInAllSegments = allSegmentFlights.every(
              (segmentFlights) => segmentFlights && segmentFlights.length > 0
            );

            if (!hasFlightsInAllSegments) {
              const segmentStatus = allSegmentFlights
                .map(
                  (flights, index) =>
                    `Chặng ${index + 1}: ${flights?.length || 0} chuyến bay`
                )
                .join(", ");

              setError(
                `Không thể tạo lịch trình đa thành phố. ${segmentStatus}. Cần có chuyến bay cho tất cả các chặng.`
              );
              setAllItineraries([]);
              setAllFlights([]);
              setFlightsLoaded(true);
              return;
            }

            // Generate all possible combinations
            const generateCombinations = (
              segmentIndex = 0,
              currentCombination = []
            ) => {
              if (segmentIndex >= allSegmentFlights.length) {
                return [currentCombination];
              }

              const combinations = [];
              const currentSegmentFlights =
                allSegmentFlights[segmentIndex] || [];

              for (const flight of currentSegmentFlights) {
                combinations.push(
                  ...generateCombinations(segmentIndex + 1, [
                    ...currentCombination,
                    flight,
                  ])
                );
              }

              return combinations;
            };

            const multiCityItineraries = generateCombinations();
            console.log(
              `Generated ${multiCityItineraries.length} multi-city combinations`
            );

            // Format multi-city itineraries for display
            const formattedItineraries = multiCityItineraries.map(
              (combination, index) => {
                const totalPrice = combination.reduce((sum, flight) => {
                  const lowestPrice = getLowestPrice(flight);
                  return sum + lowestPrice;
                }, 0);

                const totalDuration = combination.reduce((sum, flight) => {
                  return sum + (flight.duration || 0);
                }, 0);

                const totalStops = combination.reduce((sum, flight) => {
                  return sum + (flight.stopsList?.length || 0);
                }, 0);

                const firstFlight = combination[0];
                const lastFlight = combination[combination.length - 1];

                // Generate itinerary ID using actual flight IDs
                const legIds = combination
                  .map((flight) => flight.id || flight.flightId)
                  .join("-");
                const multiCityItineraryId = `multi-city-${legIds}`;

                return {
                  itineraryId: multiCityItineraryId,
                  tripType: "MULTI_CITY",
                  legs: combination,
                  allLegs: combination,
                  totalPrice,
                  lowestPrice: totalPrice,
                  totalDuration,
                  totalStops,
                  routeInfo: combination
                    .map(
                      (flight) =>
                        `${flight.departureAirport?.airportCode || "N/A"} → ${
                          flight.arrivalAirport?.airportCode || "N/A"
                        }`
                    )
                    .join(" → "),
                  multiCityLegs: combination,
                  segments: combination.length,
                  isMultiCityDisplay: true,
                  firstLeg: firstFlight,
                  lastLeg: lastFlight,
                  flightNumber: combination
                    .map((f) => f.flightNumber)
                    .join(" + "),
                  airline: firstFlight.airline,
                  airlineName:
                    firstFlight.airline?.airlineName || "Multi Airlines",
                  departureAirport: firstFlight.departureAirport,
                  arrivalAirport: lastFlight.arrivalAirport,
                  departureTime: firstFlight.departureTime,
                  arrivalTime: lastFlight.arrivalTime,
                  duration: totalDuration,
                  price: totalPrice,
                  priceNumeric: totalPrice,
                };
              }
            );

            console.log(
              "Formatted multi-city itineraries:",
              formattedItineraries
            );

            setAllItineraries(formattedItineraries);
            setAllFlights([]);
            setFlightsLoaded(true);
            return;
          } catch (error) {
            console.error("Multi-city search error:", error);
            setError(
              "Lỗi khi tìm kiếm chuyến bay đa thành phố: " + error.message
            );
            return;
          }
        }

        const response = await flightApi.searchUnifiedFlights(requestData);

        if (response.success) {
          const getLowestPrice = (flight) => {
            if (
              flight.flightTravelClasses &&
              flight.flightTravelClasses.length > 0
            ) {
              const prices = flight.flightTravelClasses
                .map((tc) => tc.customPrice || tc.price || tc.basePrice || 0)
                .filter((price) => price > 0);
              return prices.length > 0
                ? Math.min(...prices)
                : flight.priceNumeric || 0;
            }
            return flight.priceNumeric || 0;
          };

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
                totalPrice: getLowestPrice(flight),
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
                getLowestPrice(pair.outbound) + getLowestPrice(pair.inbound),
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

            // Generate all possible combinations for multi-city flights
            const combinations = generateCombinations(legs);

            itineraries = combinations.map((combination, index) => {
              const totalPrice = combination.reduce(
                (sum, flight) => sum + getLowestPrice(flight),
                0
              );
              const totalDuration = combination.reduce(
                (sum, flight) => sum + (flight.duration || 0),
                0
              );
              const totalStops = combination.reduce(
                (sum, flight) => sum + (flight.stopsList?.length || 0),
                0
              );

              // Create route info showing all segments
              const routeInfo = combination
                .map(
                  (flight) =>
                    `${flight.departureAirport?.airportCode || "N/A"} → ${
                      flight.arrivalAirport?.airportCode || "N/A"
                    }`
                )
                .join(" → ");

              // Generate itinerary ID using actual flight IDs
              const legIds = combination
                .map((flight) => flight.id || flight.flightId)
                .join("-");
              const multiCityItineraryId = `multi-city-${legIds}`;

              return {
                itineraryId: multiCityItineraryId,
                tripType: "MULTI_CITY",
                legs: combination,
                totalPrice,
                totalDuration,
                totalStops,
                routeInfo,
                segments: combination.length, // Add number of segments for display
              };
            });
          }

          setAllItineraries(itineraries);
          setFlightsLoaded(true); // Mark as loaded to prevent re-loading all flights

          // Set trip type filter to match the search trip type
          console.log("Setting tripTypeFilter to:", searchData.tripType);
          setTripTypeFilter(searchData.tripType);

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
        totalPrice: getLowestPrice(flight),
        totalDuration: flight.duration || 0,
        totalStops: flight.stopsList?.length || 0,
      }));

      setAllItineraries(itineraries);
      setLoading(false);

      // Reset filters to default when new flights are loaded
      setFilters(DEFAULT_FILTERS);

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
    console.log("Starting filteredAndSortedItineraries with:", {
      allItinerariesCount: allItineraries.length,
      activeTab,
      tripTypeFilter,
      filters,
    });

    // Log trip types distribution
    const tripTypeCounts = {};
    allItineraries.forEach((itinerary) => {
      const tripType = itinerary.tripType || "undefined";
      tripTypeCounts[tripType] = (tripTypeCounts[tripType] || 0) + 1;
    });
    console.log("Trip type distribution in allItineraries:", tripTypeCounts);

    let filtered = allItineraries.filter((itinerary) => {
      console.log(`Filtering itinerary ${itinerary.itineraryId}:`, {
        totalPrice: itinerary.totalPrice,
        priceRange: filters.priceRange,
        tripType: itinerary.tripType,
        totalStops: itinerary.totalStops,
        totalDuration: itinerary.totalDuration,
        legs: itinerary.legs.length,
      });

      // Price filter (use totalPrice) - skip if totalPrice is null/undefined
      const itineraryPrice = itinerary.totalPrice;
      if (
        itineraryPrice != null &&
        (itineraryPrice < filters.priceRange[0] ||
          itineraryPrice > filters.priceRange[1])
      ) {
        console.log(
          `Price filter removed itinerary ${itinerary.itineraryId}: price ${itineraryPrice} not in range [${filters.priceRange[0]}, ${filters.priceRange[1]}]`
        );
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

    // Determine filtering logic based on data source
    const hasSearchResults = tripTypeFilter && allItineraries.length > 0;
    const hasMultiCityResults = allItineraries.some(
      (itinerary) => itinerary.tripType === "MULTI_CITY"
    );

    if (hasSearchResults && !hasMultiCityResults) {
      // Filter search results by trip type and flight type (only for non-multi-city results)
      filtered = filtered.filter((itinerary) => {
        console.log(
          `Trip type filter check: tripTypeFilter='${tripTypeFilter}', itinerary.tripType='${itinerary.tripType}'`
        );
        if (!tripTypeFilter) return true;
        if (tripTypeFilter === "ONE_WAY" && itinerary.tripType !== "ONE_WAY") {
          console.log(
            `Filtered out ${itinerary.itineraryId}: tripType mismatch (ONE_WAY)`
          );
          return false;
        }
        if (
          tripTypeFilter === "ROUND_TRIP" &&
          itinerary.tripType !== "ROUND_TRIP"
        ) {
          console.log(
            `Filtered out ${itinerary.itineraryId}: tripType mismatch (ROUND_TRIP)`
          );
          return false;
        }
        if (
          tripTypeFilter === "MULTI_CITY" &&
          itinerary.tripType !== "MULTI_CITY"
        ) {
          console.log(
            `Filtered out ${itinerary.itineraryId}: tripType mismatch (MULTI_CITY)`
          );
          return false;
        }

        console.log(`Keeping ${itinerary.itineraryId}: tripType match`);
        return true;
      });
    } else if (hasMultiCityResults) {
      // For multi-city results, don't apply trip type filter - show all multi-city results
      console.log("Multi-city results detected, skipping trip type filter");
      filtered = filtered.filter(
        (itinerary) => itinerary.tripType === "MULTI_CITY"
      );
    } else {
      // Filter loaded flights by trip type (activeTab represents trip type)
      filtered = filtered.filter((itinerary) => {
        if (activeTab === "ALL" || activeTab === "all") return true;
        if (activeTab === "ONE_WAY" && itinerary.tripType !== "ONE_WAY")
          return false;
        if (activeTab === "ROUND_TRIP" && itinerary.tripType !== "ROUND_TRIP")
          return false;

        return true;
      });
    }

    // Flight type filtering (domestic/international) - áp dụng cho cả search results và loaded flights
    if (activeTab === "domestic" || activeTab === "international") {
      const targetType =
        activeTab === "domestic" ? "DOMESTIC" : "INTERNATIONAL";

      filtered = filtered.filter((itinerary) => {
        // Check if all legs in the itinerary match the target flight type
        const allLegsMatchType = itinerary.legs.every((leg) => {
          const legType = leg.type || leg.flightType;
          return legType === targetType;
        });

        if (!allLegsMatchType) {
          console.log(
            `Flight type filter removed itinerary ${itinerary.itineraryId}: not ${activeTab} (${targetType})`
          );
          return false;
        }
        return true;
      });
    }

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

    console.log("filteredAndSortedItineraries:", {
      activeTab,
      tripTypeFilter,
      allItinerariesCount: allItineraries.length,
      filteredCount: filtered.length,
      sampleItinerary: allItineraries[0],
      sampleFiltered: filtered[0],
    });

    return filtered;
  }, [allItineraries, filters, activeTab, tripTypeFilter]);

  // Determine which tabs to show based on whether we have search results or loaded flights
  const currentTabs = useMemo(() => {
    if (allItineraries.length > 0 && tripTypeFilter) {
      // When we have search results, show flight type tabs
      return FLIGHT_TABS;
    } else if (allItineraries.length > 0) {
      // When we have loaded flights without search, show both trip type and flight type tabs
      return [
        ...FLIGHT_TABS,
        { key: "ONE_WAY", label: "Một chiều" },
        { key: "ROUND_TRIP", label: "Khứ hồi" },
      ];
    } else {
      // When no flights loaded, show basic tabs
      return FLIGHT_TABS;
    }
  }, [allItineraries.length, tripTypeFilter]);
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
      <div className="relative">
        <div
          className="h-64 bg-cover bg-center bg-no-repeat relative"
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

        <div className="">
          <SearchForm
            onSearch={handleSearch}
            initialValues={searchFormInitialValues}
            onTripTypeChange={handleTripTypeChange}
          />
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

          <div className="flex-1 min-w-0 ">
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
                      onClick={() => {
                        clearSearchCriteria();
                        // Reset search results and trigger reload of all flights for current tab
                        setAllItineraries([]);
                        setFlightsLoaded(false);
                        // Reset activeTab về "ALL" để load tất cả trip types
                        setActiveTab("ALL");
                        setTripTypeFilter(null); // Đảm bảo không có filter trip type
                      }}
                      title="Xóa tiêu chí tìm kiếm và tải lại chuyến bay"
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
                  {currentTabs.map((tab) => (
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
