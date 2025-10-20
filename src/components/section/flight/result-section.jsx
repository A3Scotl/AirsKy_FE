"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/ui/pagination";
import {
  ArrowRight,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plane,
  X,
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback, useRef, useReducer } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { SearchForm } from "../../common/search-form";
import { FlightFilters } from "./filter-section";
import { FlightFlexSearch } from "../../common/flight-flex-search";
import { FlightCard } from "../../common/flight-card";
import { useSearch } from "../../../contexts/search-context";
import { flightApi } from "../../../apis/flight-api";
import { Skeleton } from "@/components/ui/skeleton";

import {
  FLIGHTS_PER_PAGE,
  DEFAULT_FILTERS,
  FLIGHT_TABS,
  FARE_OPTIONS,
  getDepartureTimeSlot,
} from "./flight-constants.jsx";
import { EmptyState } from "./flight-components.jsx";

const MIN_BOOKING_LEAD_TIME = 24 * 60 * 60 * 1000;

const FlightCardSkeleton = () => (
  <Card className="p-4">
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <div className="sm:border-l sm:pl-4 flex flex-col items-end justify-between w-full sm:w-48">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  </Card>
);


export function FlightSearchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { searchCriteria, updateSearchCriteria, clearSearchCriteria } =
    useSearch();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState("ALL");
  const [tripTypeFilter, setTripTypeFilter] = useState(null);
  const [tabExpandedFlights, setTabExpandedFlights] = useState({});
  const [selectedFares, setSelectedFares] = useState({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [tabPages, setTabPages] = useState({});
  const [showAllCombinations, setShowAllCombinations] = useState(false);

  const [allItineraries, setAllItineraries] = useState([]);
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [flightsLoaded, setFlightsLoaded] = useState(false);

  const resultsRef = useRef(null);

  useEffect(() => {
    if (!flightsLoaded && !loading) {
      loadAllFlights();
    }
  }, [flightsLoaded, loading]);

  useEffect(() => {
    if (
      allFlights.length > 0 &&
      flightsLoaded &&
      !loading &&
      allItineraries.length === 0
    ) {
      filterFlightsByTripType(allFlights, "ALL");
    }
  }, [allFlights, flightsLoaded, loading, allItineraries.length]);

  useEffect(() => {
    setTabPages((prev) => ({
      ...prev,
      [activeTab]: 1,
    }));
  }, [filters, searchCriteria, activeTab, tripTypeFilter]);

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

  useEffect(() => {
    if (
      !loading &&
      allItineraries.length === 0 &&
      allFlights.length === 0 &&
      !flightsLoaded
    ) {
      if (
        location.state?.flightsData &&
        location.state?.flightsData.length > 0
      ) {
        const firstFlight = location.state.flightsData[0];

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
          passengers: { adults: 1, children: 0, infants: 0 },
          travelClass: "Phổ thông",
        };

        updateSearchCriteria(extractedSearchCriteria);

        processFlightsData(location.state.flightsData);
      } else if (searchCriteria) {
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

  const getLowestPrice = useCallback((flight) => {
    if (flight.flightTravelClasses && flight.flightTravelClasses.length > 0) {
      const prices = flight.flightTravelClasses
        .map((tc) => tc.customPrice || tc.price || tc.basePrice || 0)
        .filter((price) => price > 0);
      return prices.length > 0 ? Math.min(...prices) : flight.priceNumeric || 0;
    }
    return flight.priceNumeric || 0;
  }, []);

  const filterFlightsByTripType = useCallback((flights, tripType) => {
    let filteredFlights = [];
    const normalizedTripType = tripType.toUpperCase();

    if (normalizedTripType === "ONE_WAY") {
      filteredFlights = flights.filter(
        (flight) => (flight.tripType || "").toUpperCase() === "ONE_WAY"
      );
    } else if (normalizedTripType === "ROUND_TRIP") {
      const roundTripFlights = flights.filter(
        (flight) =>
          (flight.tripType || "").toUpperCase() === "ROUND_TRIP" ||
          (flight.type || "").toUpperCase() === "ROUND_TRIP"
      );

      if (roundTripFlights.length === 0) {
        const oneWayFlights = flights.filter(
          (flight) =>
            (flight.tripType || "").toUpperCase() === "ONE_WAY" ||
            (flight.type || "").toUpperCase() === "ONE_WAY" ||
            (!flight.tripType && !flight.type)
        );

        const routeGroups = {};
        oneWayFlights.forEach((flight) => {
          const routeKey = `${flight.departureAirport?.airportCode}-${flight.arrivalAirport?.airportCode}`;
          if (!routeGroups[routeKey]) {
            routeGroups[routeKey] = [];
          }
          routeGroups[routeKey].push(flight);
        });

        const flightPairs = [];
        Object.keys(routeGroups).forEach((routeKey) => {
          const [dep, arr] = routeKey.split("-");
          const returnRouteKey = `${arr}-${dep}`;

          if (
            routeGroups[returnRouteKey] &&
            routeGroups[routeKey].length > 0 &&
            routeGroups[returnRouteKey].length > 0
          ) {
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
        const flightPairs = [];
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

            flightPairs.push({
              outbound,
              inbound,
            });

            processedFlights.add(flight.flightId);
            processedFlights.add(matchingReturnFlight.flightId);
          } else {
            flightPairs.push({
              outbound: flight,
              inbound: null,
            });
            processedFlights.add(flight.flightId);
          }
        }

        filteredFlights = flightPairs;
      }
    } else if (normalizedTripType === "ALL") {
      filteredFlights = flights;
    } else {
      filteredFlights = flights.filter(
        (flight) => (flight.tripType || "").toUpperCase() === "ONE_WAY"
      );
    }

    let itineraries = [];

    if (normalizedTripType === "ROUND_TRIP") {
      itineraries = filteredFlights.map((pair, index) => {
        if (pair.inbound) {
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
      const oneWayFlights = flights.filter(
        (flight) => (flight.tripType || "").toUpperCase() === "ONE_WAY"
      );

      const roundTripFlights = flights.filter(
        (flight) =>
          (flight.tripType || "").toUpperCase() === "ROUND_TRIP" ||
          (flight.type || "").toUpperCase() === "ROUND_TRIP"
      );

      const oneWayItineraries = oneWayFlights.map((flight, index) => ({
        itineraryId: `oneway-${flight.flightId || index}`,
        tripType: "ONE_WAY",
        legs: [flight],
        totalPrice: getLowestPrice(flight),
        totalDuration: flight.duration || 0,
        totalStops: flight.stopsList?.length || 0,
      }));

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

      itineraries = [...oneWayItineraries, ...roundTripItineraries];
    } else {
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
  }, []);

  const handleTripTypeChange = useCallback((newTripType) => {
    setActiveTab((prevActiveTab) => {
      if (prevActiveTab !== newTripType) {
        setTabExpandedFlights((prev) => ({
          ...prev,
          [newTripType]: new Set(),
        }));

        setTabPages((prev) => ({
          ...prev,
          [newTripType]: 1,
        }));

        return newTripType;
      }

      return prevActiveTab;
    });
  }, []);

  const loadAllFlights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await flightApi.getAllFlights({ size: 100 });

      if (response.success && response.data?.content) {
        setAllFlights(response.data.content);
        setTabExpandedFlights({});
        setTabPages({});
      } else {
        setAllFlights([]);
        setAllItineraries([]);
      }
    } catch (err) {
      setError("Không thể tải danh sách chuyến bay");
      setAllFlights([]);
      setAllItineraries([]);
    } finally {
      setLoading(false);
      setFlightsLoaded(true);
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
      if (itinerary.tripType === "MULTI_CITY") {
        const selectedFare = FARE_OPTIONS.find((fare) => fare.id === fareData);

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

        const legIds = itinerary.legs
          .map((leg) => leg.id || leg.flightId)
          .join("-");
        const multiCityFlightId = `multi-city-${legIds}`;

        const flightNumbers = itinerary.legs
          .map((leg) => leg.flightNumber)
          .join(" → ");

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
      } else if (
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

  const handleSearch = useCallback(
    async (searchData) => {
      setLoading(true);
      setError(null);

      const formatDateForAPI = (dateInput) => {
        if (!dateInput) return null;
        const date = new Date(dateInput);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const formatted = `${year}-${month}-${day}`;
        return formatted;
      };

      try {
        let requestData = {};

        if (searchData.tripType === "ONE_WAY") {
          const fromAirports = searchData.fromLocations || [searchData.from];
          const toAirports = searchData.toLocations || [searchData.to];

          if (fromAirports.length === 1 && toAirports.length === 1) {
            requestData = {
              tripType: "ONE_WAY",
              departureAirportId:
                fromAirports[0]?.airportId || fromAirports[0]?.id,
              arrivalAirportId: toAirports[0]?.airportId || toAirports[0]?.id,
              outboundDepartureDate: formatDateForAPI(searchData.departDate),
            };
          } else {
            const combinations = [];
            fromAirports.forEach((from) => {
              toAirports.forEach((to) => {
                if (from?.airportId !== to?.airportId) {
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
              combinations: combinations,
            };
          }
        } else if (searchData.tripType === "ROUND_TRIP") {
          const fromAirports = searchData.fromLocations || [searchData.from];
          const toAirports = searchData.toLocations || [searchData.to];

          if (fromAirports.length === 1 && toAirports.length === 1) {
            requestData = {
              tripType: "ROUND_TRIP",
              departureAirportId:
                fromAirports[0]?.airportId || fromAirports[0]?.id,
              arrivalAirportId: toAirports[0]?.airportId || toAirports[0]?.id,
              outboundDepartureDate: formatDateForAPI(searchData.departDate),
              returnDate: formatDateForAPI(searchData.returnDate),
            };
          } else {
            const combinations = [];
            fromAirports.forEach((from) => {
              toAirports.forEach((to) => {
                if (from?.airportId !== to?.airportId) {
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
              combinations: combinations,
            };
          }
        } else if (searchData.tripType === "MULTI_CITY") {
          if (
            !searchData.multiCityTrips ||
            searchData.multiCityTrips.length === 0
          ) {
            setError("Không có thông tin chặng bay nào để tìm kiếm");
            return;
          }

          const segmentPromises = searchData.multiCityTrips.map(
            async (trip, segmentIndex) => {
              const fromAirports = trip.fromLocations || [];
              const toAirports = trip.toLocations || [];

              if (
                fromAirports.length === 0 ||
                toAirports.length === 0 ||
                !trip.departDate
              ) {
                return [];
              }

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
                      }
                    } catch (error) {}
                  }
                }
              }

              return segmentFlights;
            }
          );

          try {
            const allSegmentFlights = await Promise.all(segmentPromises);

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

            setAllItineraries(formattedItineraries);
            setAllFlights([]);
            setFlightsLoaded(true);
            return;
          } catch (error) {
            setError(
              "Lỗi khi tìm kiếm chuyến bay đa thành phố: " + error.message
            );
            return;
          }
        }

        const response = await flightApi.searchUnifiedFlights(requestData);

        if (response.success) {
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
                routeInfo: `${
                  flight.departureAirport?.airportCode || "N/A"
                } → ${flight.arrivalAirport?.airportCode || "N/A"}`,
              })
            );
          } else if (
            searchData.tripType === "ROUND_TRIP" &&
            response.data.roundTripPairs
          ) {
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

              const routeInfo = combination
                .map(
                  (flight) =>
                    `${flight.departureAirport?.airportCode || "N/A"} → ${
                      flight.arrivalAirport?.airportCode || "N/A"
                    }`
                )
                .join(" → ");

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
                segments: combination.length,
              };
            });
          }

          setAllItineraries(itineraries);
          setFlightsLoaded(true);

          setTripTypeFilter(searchData.tripType);

          const updatedSearchCriteria = {
            ...searchData,
            fromLocations:
              searchData.fromLocations ||
              (searchData.from ? [searchData.from] : []),
            toLocations:
              searchData.toLocations || (searchData.to ? [searchData.to] : []),
            from: searchData.fromLocations?.[0] || searchData.from,
            to: searchData.toLocations?.[0] || searchData.to,
          };

          updateSearchCriteria(updatedSearchCriteria);

          setTabExpandedFlights({});
          setTabPages({});

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

  const processFlightsData = useCallback((flights) => {
    setLoading(true);
    setError(null);

    try {
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

      setFilters(DEFAULT_FILTERS);

      setTabExpandedFlights({});
      setTabPages({});

      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    } catch (err) {
      setError("Có lỗi xảy ra khi xử lý dữ liệu chuyến bay");
      setAllItineraries([]);
      setLoading(false);
    }
  }, []);

  const filteredAndSortedItineraries = useMemo(() => {
    let filtered = allItineraries.filter((itinerary) => {
      const itineraryPrice = itinerary.totalPrice;
      if (
        itineraryPrice != null &&
        (itineraryPrice < filters.priceRange[0] ||
          itineraryPrice > filters.priceRange[1])
      ) {
        return false;
      }

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

      if (filters.aircraft && filters.aircraft.length > 0) {
        const itineraryAircrafts = new Set();

        itinerary.legs.forEach((leg) => {
          const aircraftInfo =
            leg.aircraft ||
            leg.aircraftId ||
            leg.aircraftName ||
            leg.aircraftCode;

          if (aircraftInfo) {
            if (typeof aircraftInfo === "object") {
              const name = aircraftInfo.aircraftName || aircraftInfo.name;
              const code = aircraftInfo.aircraftCode || aircraftInfo.code;
              if (name) itineraryAircrafts.add(name);
              if (code) itineraryAircrafts.add(code);
            } else {
              itineraryAircrafts.add(String(aircraftInfo));
            }
          }
        });

        if (itineraryAircrafts.size > 0) {
          const hasMatchingAircraft = filters.aircraft.some(
            (selectedAircraft) =>
              itineraryAircrafts.has(selectedAircraft) ||
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

      if (filters.duration && filters.duration.length > 0) {
        const totalDuration = itinerary.totalDuration || 0;
        let durationCategory = "";
        if (totalDuration <= 180) {
          durationCategory = "short";
        } else if (totalDuration <= 360) {
          durationCategory = "medium";
        } else {
          durationCategory = "long";
        }

        if (!filters.duration.includes(durationCategory)) {
          return false;
        }
      }

      if (filters.departureTime && filters.departureTime.length > 0) {
        const firstLegDepartureTime = itinerary.legs[0]?.departureTime;

        if (firstLegDepartureTime) {
          const firstLegTimeSlot = getDepartureTimeSlot(firstLegDepartureTime);

          if (firstLegTimeSlot) {
            if (!filters.departureTime.includes(firstLegTimeSlot)) {
              return false;
            }
          }
        }
      }

      const departureTime = new Date(
        itinerary.legs[0]?.departureTime
      ).getTime();
      const currentTime = new Date().getTime();
      if (departureTime - currentTime < MIN_BOOKING_LEAD_TIME) {
        return false;
      }

      return true;
    });

    const hasSearchResults = tripTypeFilter && allItineraries.length > 0;
    const hasMultiCityResults = allItineraries.some(
      (itinerary) => itinerary.tripType === "MULTI_CITY"
    );

    if (hasSearchResults && !hasMultiCityResults) {
      filtered = filtered.filter((itinerary) => {
        if (!tripTypeFilter) return true;
        if (tripTypeFilter === "ONE_WAY" && itinerary.tripType !== "ONE_WAY") {
          return false;
        }
        if (
          tripTypeFilter === "ROUND_TRIP" &&
          itinerary.tripType !== "ROUND_TRIP"
        ) {
          return false;
        }
        if (
          tripTypeFilter === "MULTI_CITY" &&
          itinerary.tripType !== "MULTI_CITY"
        ) {
          return false;
        }

        return true;
      });
    } else if (hasMultiCityResults) {
      filtered = filtered.filter(
        (itinerary) => itinerary.tripType === "MULTI_CITY"
      );
    } else {
      filtered = filtered.filter((itinerary) => {
        if (activeTab === "ALL" || activeTab === "all") return true;
        if (activeTab === "ONE_WAY" && itinerary.tripType !== "ONE_WAY")
          return false;
        if (activeTab === "ROUND_TRIP" && itinerary.tripType !== "ROUND_TRIP")
          return false;

        return true;
      });
    }

    if (activeTab === "domestic" || activeTab === "international") {
      const targetType =
        activeTab === "domestic" ? "DOMESTIC" : "INTERNATIONAL";

      filtered = filtered.filter((itinerary) => {
        const allLegsMatchType = itinerary.legs.every((leg) => {
          const legType = leg.type || leg.flightType;
          return legType === targetType;
        });

        if (!allLegsMatchType) {
          return false;
        }
        return true;
      });
    }

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
  }, [allItineraries, filters, activeTab, tripTypeFilter]);

  const currentTabs = useMemo(() => {
    if (allItineraries.length > 0 && tripTypeFilter) {
      return FLIGHT_TABS;
    } else if (allItineraries.length > 0) {
      return [
        ...FLIGHT_TABS,
        { key: "ONE_WAY", label: "Một chiều" },
        { key: "ROUND_TRIP", label: "Khứ hồi" },
      ];
    } else {
      return FLIGHT_TABS;
    }
  }, [allItineraries.length, tripTypeFilter]);
  const searchFormInitialValues = useMemo(() => {
    if (!searchCriteria) {
      return {
        tripType: "ONE_WAY",
        passengers: {
          adults: 1,
          children: 0,
          infants: 0,
        },
        travelClass: "Phổ thông",
      };
    }

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
      const getPrimaryCity = (location) => {
        if (!location) return "N/A";
        if (typeof location === "string") return location;

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
      <div className="relative">
        <div
          className="h-72 bg-cover bg-center bg-no-repeat relative"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1713396124163-21d4ea332d90?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDIyfHx8ZW58MHx8fHx8')`,
          }}
        >
          <div className="absolute inset-0 bg-opacity-50"></div>
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-3xl font-bold mb-2 pt-8">
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


      {searchCriteria && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 ">
          <FlightFlexSearch
            searchCriteria={searchCriteria}
            allFlights={allItineraries.flatMap((it) => it.legs)}
            onDateSelect={(dateSelection) => {
              if (
                typeof dateSelection === "object" &&
                dateSelection.departDate
              ) {
                const updatedCriteria = {
                  ...searchCriteria,
                  departDate: dateSelection.departDate,
                  returnDate: dateSelection.returnDate,
                };
                handleSearch(updatedCriteria);
              } else {
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

      <div
        ref={resultsRef}
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8"
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
                        setAllItineraries([]);
                        setFlightsLoaded(false);
                        setActiveTab("ALL");
                        setTripTypeFilter(null);
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

            <div className="space-y-3 sm:space-y-4">
              {loading ? (
                <>
                  <FlightCardSkeleton />
                  <FlightCardSkeleton />
                  <FlightCardSkeleton />
                </>
              ) : totalItineraries > 0 ? (
                currentItineraries.map((itinerary) => (
                  <FlightCard
                    key={itinerary.itineraryId}
                    flight={itinerary}
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
