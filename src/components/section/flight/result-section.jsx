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
import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  useReducer,
} from "react";
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
  const [selectedOutboundFares, setSelectedOutboundFares] = useState({});
  const [selectedReturnFares, setSelectedReturnFares] = useState({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [tabPages, setTabPages] = useState({});
  const [showAllCombinations, setShowAllCombinations] = useState(false);

  const [roundTripStep, setRoundTripStep] = useState("outbound"); // 'outbound' or 'return'
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState(null);

  const [allItineraries, setAllItineraries] = useState([]);
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [flightsLoaded, setFlightsLoaded] = useState(false);

  // Track if we're in flex search update mode
  const [isFlexSearchUpdate, setIsFlexSearchUpdate] = useState(false);

  const resultsRef = useRef(null);

  useEffect(() => {
    if (
      allFlights.length > 0 &&
      flightsLoaded &&
      !loading &&
      allItineraries.length === 0
    ) {
      filterFlightsByTripType(allFlights, "ALL", searchCriteria);
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

  const filterFlightsByTripType = useCallback(
    (flights, tripType, searchCriteria) => {
      // Filter flights that depart at least 1 hour from now
      const now = new Date();
      const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      let filteredFlights = flights.filter((flight) => {
        const departureTime = new Date(flight.departureTime);
        return departureTime >= fourHoursFromNow;
      });

      const normalizedTripType = tripType.toUpperCase();

      if (normalizedTripType === "ONE_WAY") {
        filteredFlights = filteredFlights.filter(
          (flight) => (flight.tripType || "").toUpperCase() === "ONE_WAY"
        );
      } else if (normalizedTripType === "ROUND_TRIP") {
        // For round trip, show flights based on current step
        if (roundTripStep === "outbound") {
          filteredFlights = filteredFlights.filter(
            (flight) => flight.direction === "outbound"
          );
        } else if (roundTripStep === "return") {
          filteredFlights = filteredFlights.filter(
            (flight) => flight.direction === "return"
          );
        }
      } else if (normalizedTripType === "MULTI_CITY") {
        filteredFlights = filteredFlights.filter(
          (flight) => (flight.tripType || "").toUpperCase() === "MULTI_CITY"
        );
      } else if (normalizedTripType === "ALL") {
        // For ALL, include all filtered flights
      }

      let itineraries = [];

      if (normalizedTripType === "ROUND_TRIP") {
        // Create separate itineraries for outbound and return flights
        itineraries = filteredFlights.map((flight, index) => ({
          itineraryId: `${flight.direction}-${flight.flightId || index}`,
          tripType: "ROUND_TRIP",
          direction: flight.direction,
          legs: [flight],
          totalPrice: getLowestPrice(flight),
          totalDuration: flight.duration || 0,
          totalStops: flight.stopsList?.length || 0,
        }));
      } else if (normalizedTripType === "ALL") {
        const oneWayFlights = filteredFlights.filter(
          (flight) => (flight.tripType || "").toUpperCase() === "ONE_WAY"
        );

        const roundTripFlights = filteredFlights.filter(
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

        const roundTripItineraries = roundTripFlights.map((flight, index) => ({
          itineraryId: `roundtrip-${flight.flightId || index}`,
          tripType: "ROUND_TRIP",
          legs: [flight],
          totalPrice: getLowestPrice(flight),
          totalDuration: flight.duration || 0,
          totalStops: flight.stopsList?.length || 0,
        }));

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
    },
    [getLowestPrice, searchCriteria]
  );

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

  const handleSelectFare = useCallback(
    (itineraryId, fareId) => {
      const itinerary = allItineraries.find(
        (i) => i.itineraryId === itineraryId
      );
      if (itinerary && itinerary.direction === "outbound") {
        setSelectedOutboundFares((prev) => ({
          ...prev,
          [itineraryId]: fareId,
        }));
      } else if (itinerary && itinerary.direction === "return") {
        setSelectedReturnFares((prev) => ({ ...prev, [itineraryId]: fareId }));
      } else {
        setSelectedFares((prev) => ({ ...prev, [itineraryId]: fareId }));
      }
    },
    [allItineraries]
  );

  const handleRoundTripBooking = useCallback(() => {
    const outboundItineraryId = Object.keys(selectedOutboundFares)[0];
    const returnItineraryId = Object.keys(selectedReturnFares)[0];
    const outboundItinerary = allItineraries.find(
      (i) => i.itineraryId === outboundItineraryId
    );
    const returnItinerary = allItineraries.find(
      (i) => i.itineraryId === returnItineraryId
    );
    const outboundFareId = selectedOutboundFares[outboundItineraryId];
    const returnFareId = selectedReturnFares[returnItineraryId];

    if (!outboundItinerary || !returnItinerary) return;

    // Create combined round trip flight
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
      return date.toLocaleString("vi-VN");
    };

    const formatCurrencyVND = (amount) => {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount);
    };

    const outboundFlight = outboundItinerary.legs[0];
    const returnFlight = returnItinerary.legs[0];

    const selectedFlight = {
      type: "ROUND_TRIP",
      tripType: "ROUND_TRIP",
      flightId: `roundtrip-${outboundFlight.flightId}-${returnFlight.flightId}`,
      flightNumber: `${outboundFlight.flightNumber} / ${returnFlight.flightNumber}`,
      airline: outboundFlight.airline?.airlineName || outboundFlight.airline,
      airlineName:
        outboundFlight.airline?.airlineName || outboundFlight.airline,
      airlineLogo:
        outboundFlight.airline?.thumbnail || outboundFlight.airline?.logo,

      outboundFlight: {
        id: outboundFlight.flightId,
        flightId: outboundFlight.flightId,
        flightNumber: outboundFlight.flightNumber,
        airline: outboundFlight.airline?.airlineName || outboundFlight.airline,
        airlineName:
          outboundFlight.airline?.airlineName || outboundFlight.airline,
        airlineLogo:
          outboundFlight.airline?.thumbnail || outboundFlight.airline?.logo,
        selectedClass: FARE_OPTIONS.find((fare) => fare.id === outboundFareId),
        departureTime: formatTimeVN(outboundFlight.departureTime),
        arrivalTime: formatTimeVN(outboundFlight.arrivalTime),
        departureDate: formatDateVN(outboundFlight.departureTime),
        arrivalDate: formatDateVN(outboundFlight.arrivalTime),
        from:
          outboundFlight.departureAirport?.airportCode || outboundFlight.from,
        to: outboundFlight.arrivalAirport?.airportCode || outboundFlight.to,
        departureAirport: {
          code:
            outboundFlight.departureAirport?.airportCode || outboundFlight.from,
          name:
            outboundFlight.departureAirport?.airportName ||
            outboundFlight.departureAirport?.name,
          city:
            outboundFlight.departureAirport?.city ||
            outboundFlight.departureAirport?.cityNames?.[0],
          airportName:
            outboundFlight.departureAirport?.airportName ||
            outboundFlight.departureAirport?.name,
        },
        arrivalAirport: {
          code: outboundFlight.arrivalAirport?.airportCode || outboundFlight.to,
          name:
            outboundFlight.arrivalAirport?.airportName ||
            outboundFlight.arrivalAirport?.name,
          city:
            outboundFlight.arrivalAirport?.city ||
            outboundFlight.arrivalAirport?.cityNames?.[0],
          airportName:
            outboundFlight.arrivalAirport?.airportName ||
            outboundFlight.arrivalAirport?.name,
        },
        duration: outboundFlight.duration,
        aircraft: outboundFlight.aircraft || outboundFlight.aircraftName,
        aircraftName: outboundFlight.aircraftName || outboundFlight.aircraft,
        aircraftInfo:
          outboundFlight.aircraft && typeof outboundFlight.aircraft === "object"
            ? outboundFlight.aircraft
            : null,
        seatLayout: outboundFlight.aircraft?.seatLayout || null,
        totalSeats: outboundFlight.aircraft?.totalSeats || null,
        aircraftId: outboundFlight.aircraft?.aircraftId || null,
        aircraftCode: outboundFlight.aircraft?.aircraftCode || null,
        stops: outboundFlight.stops || 0,
        segmentIndex: 0,
        segmentLabel: "Chuyến đi",
      },

      returnFlight: {
        id: returnFlight.flightId,
        flightId: returnFlight.flightId,
        flightNumber: returnFlight.flightNumber,
        airline: returnFlight.airline?.airlineName || returnFlight.airline,
        airlineName: returnFlight.airline?.airlineName || returnFlight.airline,
        airlineLogo:
          returnFlight.airline?.thumbnail || returnFlight.airline?.logo,
        selectedClass: FARE_OPTIONS.find((fare) => fare.id === returnFareId),
        departureTime: formatTimeVN(returnFlight.departureTime),
        arrivalTime: formatTimeVN(returnFlight.arrivalTime),
        departureDate: formatDateVN(returnFlight.departureTime),
        arrivalDate: formatDateVN(returnFlight.arrivalTime),
        from: returnFlight.departureAirport?.airportCode || returnFlight.from,
        to: returnFlight.arrivalAirport?.airportCode || returnFlight.to,
        departureAirport: {
          code: returnFlight.departureAirport?.airportCode || returnFlight.from,
          name:
            returnFlight.departureAirport?.airportName ||
            returnFlight.departureAirport?.name,
          city:
            returnFlight.departureAirport?.city ||
            returnFlight.departureAirport?.cityNames?.[0],
          airportName:
            returnFlight.departureAirport?.airportName ||
            returnFlight.departureAirport?.name,
        },
        arrivalAirport: {
          code: returnFlight.arrivalAirport?.airportCode || returnFlight.to,
          name:
            returnFlight.arrivalAirport?.airportName ||
            returnFlight.arrivalAirport?.name,
          city:
            returnFlight.arrivalAirport?.city ||
            returnFlight.arrivalAirport?.cityNames?.[0],
          airportName:
            returnFlight.arrivalAirport?.airportName ||
            returnFlight.arrivalAirport?.name,
        },
        duration: returnFlight.duration,
        aircraft: returnFlight.aircraft || returnFlight.aircraftName,
        aircraftName: returnFlight.aircraftName || returnFlight.aircraft,
        aircraftInfo:
          returnFlight.aircraft && typeof returnFlight.aircraft === "object"
            ? returnFlight.aircraft
            : null,
        seatLayout: returnFlight.aircraft?.seatLayout || null,
        totalSeats: returnFlight.aircraft?.totalSeats || null,
        aircraftId: returnFlight.aircraft?.aircraftId || null,
        aircraftCode: returnFlight.aircraft?.aircraftCode || null,
        stops: returnFlight.stops || 0,
        segmentIndex: 1,
        segmentLabel: "Chuyến về",
      },

      totalDuration:
        (outboundFlight.duration || 0) + (returnFlight.duration || 0),
      segmentCount: 2,

      selectedClass: FARE_OPTIONS.find((fare) => fare.id === outboundFareId), // Use outbound fare for display
      totalPrice:
        (outboundItinerary.totalPrice || 0) + (returnItinerary.totalPrice || 0),
      formattedTotalPrice: formatCurrencyVND(
        (outboundItinerary.totalPrice || 0) + (returnItinerary.totalPrice || 0)
      ),
      currency: "VND",
      passengers: 1,
      bookingDate: formatDateTimeVN(new Date()),
    };

    localStorage.setItem("selectedFlight", JSON.stringify(selectedFlight));
    navigate("/booking");
  }, [selectedOutboundFares, selectedReturnFares, allItineraries, navigate]);

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

  const handleRoundTripFlightSelection = useCallback(
    (itinerary) => {
      if (roundTripStep === "outbound") {
        // Select outbound flight and move to return step
        setSelectedOutboundFlight(itinerary);
        setRoundTripStep("return");

        // Filter and show return flights
        const returnItineraries = allFlights
          .filter((flight) => flight.direction === "return")
          .map((flight, index) => {
            const lowestPrice = getLowestPrice(flight);

            return {
              itineraryId: `return-${flight.flightId || index}`,
              tripType: "ROUND_TRIP",
              direction: "return",
              legs: [flight],
              totalPrice: lowestPrice,
              totalDuration: flight.duration || 0,
              totalStops: flight.stopsList?.length || 0,
            };
          });

        setAllItineraries(returnItineraries);
        setTabPages((prev) => ({ ...prev, [activeTab]: 1 }));
      } else if (roundTripStep === "return") {
        // Select return flight and proceed to booking
        const outboundItinerary = selectedOutboundFlight;
        const returnItinerary = itinerary;

        // Create combined round trip flight data
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

        const formatCurrencyVND = (amount) => {
          return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(amount);
        };

        const outboundFlight = outboundItinerary.legs[0];
        const returnFlight = returnItinerary.legs[0];

        const selectedFlight = {
          type: "ROUND_TRIP",
          tripType: "ROUND_TRIP",
          flightId: `roundtrip-${outboundFlight.flightId}-${returnFlight.flightId}`,
          flightNumber: `${outboundFlight.flightNumber} / ${returnFlight.flightNumber}`,
          airline:
            outboundFlight.airline?.airlineName || outboundFlight.airline,
          airlineName:
            outboundFlight.airline?.airlineName || outboundFlight.airline,
          airlineLogo:
            outboundFlight.airline?.thumbnail || outboundFlight.airline?.logo,

          outboundFlight: {
            id: outboundFlight.flightId,
            flightId: outboundFlight.flightId,
            flightNumber: outboundFlight.flightNumber,
            airline:
              outboundFlight.airline?.airlineName || outboundFlight.airline,
            airlineName:
              outboundFlight.airline?.airlineName || outboundFlight.airline,
            airlineLogo:
              outboundFlight.airline?.thumbnail || outboundFlight.airline?.logo,
            departureTime: formatTimeVN(outboundFlight.departureTime),
            arrivalTime: formatTimeVN(outboundFlight.arrivalTime),
            departureDate: formatDateVN(outboundFlight.departureTime),
            arrivalDate: formatDateVN(outboundFlight.arrivalTime),
            from:
              outboundFlight.departureAirport?.airportCode ||
              outboundFlight.from,
            to: outboundFlight.arrivalAirport?.airportCode || outboundFlight.to,
            departureAirport: {
              code:
                outboundFlight.departureAirport?.airportCode ||
                outboundFlight.from,
              name:
                outboundFlight.departureAirport?.airportName ||
                outboundFlight.departureAirport?.name,
              city:
                outboundFlight.departureAirport?.city ||
                outboundFlight.departureAirport?.cityNames?.[0],
              airportName:
                outboundFlight.departureAirport?.airportName ||
                outboundFlight.departureAirport?.name,
            },
            arrivalAirport: {
              code:
                outboundFlight.arrivalAirport?.airportCode || outboundFlight.to,
              name:
                outboundFlight.arrivalAirport?.airportName ||
                outboundFlight.arrivalAirport?.name,
              city:
                outboundFlight.arrivalAirport?.city ||
                outboundFlight.arrivalAirport?.cityNames?.[0],
              airportName:
                outboundFlight.arrivalAirport?.airportName ||
                outboundFlight.arrivalAirport?.name,
            },
            duration: outboundFlight.duration,
            aircraft: outboundFlight.aircraft || outboundFlight.aircraftName,
            aircraftName:
              outboundFlight.aircraftName || outboundFlight.aircraft,
            aircraftInfo:
              outboundFlight.aircraft &&
              typeof outboundFlight.aircraft === "object"
                ? outboundFlight.aircraft
                : null,
            seatLayout: outboundFlight.aircraft?.seatLayout || null,
            totalSeats: outboundFlight.aircraft?.totalSeats || null,
            aircraftId: outboundFlight.aircraft?.aircraftId || null,
            aircraftCode: outboundFlight.aircraft?.aircraftCode || null,
            stops: outboundFlight.stops || 0,
            segmentIndex: 0,
            segmentLabel: "Chuyến đi",
            flightTravelClasses: outboundFlight.flightTravelClasses || [],
          },

          returnFlight: {
            id: returnFlight.flightId,
            flightId: returnFlight.flightId,
            flightNumber: returnFlight.flightNumber,
            airline: returnFlight.airline?.airlineName || returnFlight.airline,
            airlineName:
              returnFlight.airline?.airlineName || returnFlight.airline,
            airlineLogo:
              returnFlight.airline?.thumbnail || returnFlight.airline?.logo,
            departureTime: formatTimeVN(returnFlight.departureTime),
            arrivalTime: formatTimeVN(returnFlight.arrivalTime),
            departureDate: formatDateVN(returnFlight.departureTime),
            arrivalDate: formatDateVN(returnFlight.arrivalTime),
            from:
              returnFlight.departureAirport?.airportCode || returnFlight.from,
            to: returnFlight.arrivalAirport?.airportCode || returnFlight.to,
            departureAirport: {
              code:
                returnFlight.departureAirport?.airportCode || returnFlight.from,
              name:
                returnFlight.departureAirport?.airportName ||
                returnFlight.departureAirport?.name,
              city:
                returnFlight.departureAirport?.city ||
                returnFlight.departureAirport?.cityNames?.[0],
              airportName:
                returnFlight.departureAirport?.airportName ||
                returnFlight.departureAirport?.name,
            },
            arrivalAirport: {
              code: returnFlight.arrivalAirport?.airportCode || returnFlight.to,
              name:
                returnFlight.arrivalAirport?.airportName ||
                returnFlight.arrivalAirport?.name,
              city:
                returnFlight.arrivalAirport?.city ||
                returnFlight.arrivalAirport?.cityNames?.[0],
              airportName:
                returnFlight.arrivalAirport?.airportName ||
                returnFlight.arrivalAirport?.name,
            },
            duration: returnFlight.duration,
            aircraft: returnFlight.aircraft || returnFlight.aircraftName,
            aircraftName: returnFlight.aircraftName || returnFlight.aircraft,
            aircraftInfo:
              returnFlight.aircraft && typeof returnFlight.aircraft === "object"
                ? returnFlight.aircraft
                : null,
            seatLayout: returnFlight.aircraft?.seatLayout || null,
            totalSeats: returnFlight.aircraft?.totalSeats || null,
            aircraftId: returnFlight.aircraft?.aircraftId || null,
            aircraftCode: returnFlight.aircraft?.aircraftCode || null,
            stops: returnFlight.stops || 0,
            segmentIndex: 1,
            segmentLabel: "Chuyến về",
            flightTravelClasses: returnFlight.flightTravelClasses || [],
          },

          totalDuration:
            (outboundFlight.duration || 0) + (returnFlight.duration || 0),
          segmentCount: 2,
          totalPrice:
            (outboundItinerary.totalPrice || 0) +
            (returnItinerary.totalPrice || 0),
          formattedTotalPrice: formatCurrencyVND(
            (outboundItinerary.totalPrice || 0) +
              (returnItinerary.totalPrice || 0)
          ),
          currency: "VND",
          passengers: searchCriteria?.passengers || {
            adults: 1,
            children: 0,
            infants: 0,
          },
          bookingDate: formatDateVN(new Date()),
        };

        localStorage.setItem("selectedFlight", JSON.stringify(selectedFlight));
        navigate("/detail/flight-detail-page", {
          state: { flightData: selectedFlight },
        });
      }
    },
    [
      roundTripStep,
      selectedOutboundFlight,
      allFlights,
      getLowestPrice,
      searchCriteria,
      navigate,
    ]
  );

  const handleSearch = useCallback(
    async (searchData) => {
      setLoading(true);
      setError(null);

      // CRITICAL: Don't reset round trip state during flex-search date changes
      // Only reset when starting completely new search from search form
      const isFlexSearchUpdate =
        searchData?.isFlexSearchUpdate ||
        searchData?.departDate === searchCriteria?.departDate ||
        searchData?.returnDate === searchCriteria?.returnDate;

      // Update the state variable for use in filtering
      setIsFlexSearchUpdate(isFlexSearchUpdate);

      if (!isFlexSearchUpdate) {

        setRoundTripStep("outbound");
        setSelectedOutboundFlight(null);
      } else {

      }

      const formatDateForAPI = (dateInput) => {
        if (!dateInput) return null;
        const date = new Date(dateInput);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const formatted = `${year}-${month}-${day}`;
        return formatted;
      };

      // Map Vietnamese travel class names to English API values
      const mapTravelClass = (travelClass) => {
        const classMapping = {
          "Phổ thông": "ECONOMY",
          "Phổ thông cơ bản": "ECONOMY",
          "Phổ thông tiêu chuẩn": "ECONOMY",
          "Thương gia": "BUSINESS",
          "Hạng nhất": "FIRST",
          ECONOMY: "ECONOMY",
          BUSINESS: "BUSINESS",
          FIRST: "FIRST",
        };
        return classMapping[travelClass] || "ECONOMY";
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
              passengers: searchData.passengers || {
                adults: 1,
                children: 0,
                infants: 0,
              },
              travelClass: mapTravelClass(searchData.travelClass),
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
              passengers: searchData.passengers || {
                adults: 1,
                children: 0,
                infants: 0,
              },
              travelClass: mapTravelClass(searchData.travelClass),
            };
          }
        } else if (searchData.tripType === "ROUND_TRIP") {
          // For round trip, search outbound and return flights separately like one-way
          const fromAirports = searchData.fromLocations || [searchData.from];
          const toAirports = searchData.toLocations || [searchData.to];

          // Search outbound flights
          const outboundPromises = [];
          fromAirports.forEach((from) => {
            toAirports.forEach((to) => {
              if (from?.airportId !== to?.airportId) {
                const outboundRequestData = {
                  tripType: "ONE_WAY",
                  departureAirportId: from?.airportId || from?.id,
                  arrivalAirportId: to?.airportId || to?.id,
                  outboundDepartureDate: formatDateForAPI(
                    searchData.departDate
                  ),
                  passengers: searchData.passengers || {
                    adults: 1,
                    children: 0,
                    infants: 0,
                  },
                  travelClass: mapTravelClass(searchData.travelClass),
                };
                outboundPromises.push(
                  flightApi.searchUnifiedFlights(outboundRequestData)
                );
              }
            });
          });

          // Search return flights
          const returnPromises = [];
          fromAirports.forEach((from) => {
            toAirports.forEach((to) => {
              if (from?.airportId !== to?.airportId) {
                const returnRequestData = {
                  tripType: "ONE_WAY",
                  departureAirportId: to?.airportId || to?.id, // Reverse direction for return
                  arrivalAirportId: from?.airportId || from?.id,
                  outboundDepartureDate: formatDateForAPI(
                    searchData.returnDate
                  ),
                  passengers: searchData.passengers || {
                    adults: 1,
                    children: 0,
                    infants: 0,
                  },
                  travelClass: mapTravelClass(searchData.travelClass),
                };
                returnPromises.push(
                  flightApi.searchUnifiedFlights(returnRequestData)
                );
              }
            });
          });

          try {
            const [outboundResponses, returnResponses] = await Promise.all([
              Promise.all(outboundPromises),
              Promise.all(returnPromises),
            ]);

            const outboundFlights = outboundResponses
              .filter(
                (response) =>
                  response.success && response.data.oneWayFlights?.content
              )
              .flatMap((response) => response.data.oneWayFlights.content)
              .map((flight) => ({ ...flight, direction: "outbound" }));

            const returnFlights = returnResponses
              .filter(
                (response) =>
                  response.success && response.data.oneWayFlights?.content
              )
              .flatMap((response) => response.data.oneWayFlights.content)
              .map((flight) => ({ ...flight, direction: "return" }));

            // Store flights in state for step-by-step selection
            setAllFlights([...outboundFlights, ...returnFlights]);

            // Create itineraries for outbound flights first
            const outboundItineraries = outboundFlights.map((flight, index) => {
              const lowestPrice = getLowestPrice(flight);

              return {
                itineraryId: `outbound-${flight.flightId || index}`,
                tripType: "ROUND_TRIP",
                direction: "outbound",
                legs: [flight],
                totalPrice: lowestPrice,
                totalDuration: flight.duration || 0,
                totalStops: flight.stopsList?.length || 0,
              };
            });

            setAllItineraries(outboundItineraries);
            setFlightsLoaded(true);

            const updatedSearchCriteria = {
              ...searchData,
              fromLocations:
                searchData.fromLocations ||
                (searchData.from ? [searchData.from] : []),
              toLocations:
                searchData.toLocations ||
                (searchData.to ? [searchData.to] : []),
              from: searchData.fromLocations?.[0] || searchData.from,
              to: searchData.toLocations?.[0] || searchData.to,
            };

            updateSearchCriteria(updatedSearchCriteria);
            setTripTypeFilter(searchData.tripType);

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

            return;
          } catch (error) {
            setError("Lỗi khi tìm kiếm chuyến bay khứ hồi: " + error.message);
            return;
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
                        passengers: searchData.passengers || {
                          adults: 1,
                          children: 0,
                          infants: 0,
                        },
                        travelClass: mapTravelClass(searchData.travelClass),
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

      // Filter flights based on departure time - show flights 4+ hours from now
      if (departureTime - currentTime < 4 * 60 * 60 * 1000) {
        // Filter out flights departing within 4 hours from now
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
  }, [allItineraries, filters, activeTab, tripTypeFilter, isFlexSearchUpdate]);

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

    // Handle round-trip step-specific titles
    if (searchCriteria.tripType === "ROUND_TRIP") {
      if (roundTripStep === "outbound") {
        const from = (() => {
          if (typeof searchCriteria.from === "string")
            return searchCriteria.from;
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

        return {
          title: `Chọn chuyến bay đi: ${from} → ${to}`,
          showExpandButton: false,
        };
      } else if (roundTripStep === "return") {
        const from = (() => {
          if (typeof searchCriteria.from === "string")
            return searchCriteria.from;
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

        return {
          title: `Chọn chuyến bay về: ${to} → ${from}`,
          showExpandButton: false,
        };
      }
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
  }, [searchCriteria, totalItineraries, showAllCombinations, roundTripStep]);

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

        <div className="relative z-[1000000]">
          <SearchForm
            onSearch={handleSearch}
            initialValues={searchFormInitialValues}
            onTripTypeChange={handleTripTypeChange}
            onSearchStart={() => setLoading(true)}
          />
        </div>
      </div>

      {searchCriteria && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 ">
          <FlightFlexSearch
            key={`flex-search-${roundTripStep}-${searchCriteria?.departDate}-${searchCriteria?.returnDate}`}
            searchCriteria={searchCriteria}
            allFlights={
              allFlights.length > 0
                ? allFlights
                : allItineraries.flatMap((it) => it.legs)
            }
            isReturnSelection={roundTripStep === "return"}
            onDateSelect={(dateSelection) => {

              if (
                typeof dateSelection === "object" &&
                dateSelection.departDate
              ) {
                const updatedCriteria = {
                  ...searchCriteria,
                  departDate: dateSelection.departDate,
                  returnDate: dateSelection.returnDate,
                  isFlexSearchUpdate: true, // Mark as flex search update
                };
                handleSearch(updatedCriteria);
              } else {
                const updatedCriteria = {
                  ...searchCriteria,
                  departDate: dateSelection,
                  isFlexSearchUpdate: true, // Mark as flex search update
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
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
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
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-200">
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

              {/* Round-trip flight selection UI - only show for ROUND_TRIP searches */}
              {searchCriteria?.tripType === "ROUND_TRIP" &&
                totalItineraries > 0 && (
                  <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                          <Plane className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Chọn chuyến bay khứ hồi
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Chọn chuyến bay đi và về theo từng bước
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div
                          className={`flex items-center space-x-2 ${
                            roundTripStep === "outbound"
                              ? "text-blue-600 font-semibold"
                              : "text-gray-500"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              roundTripStep === "outbound"
                                ? "bg-blue-600 text-white"
                                : selectedOutboundFlight
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {selectedOutboundFlight ? "✓" : "1"}
                          </div>
                          <span>Chọn chuyến đi</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
                        <div
                          className={`flex items-center space-x-2 ${
                            roundTripStep === "return"
                              ? "text-blue-600 font-semibold"
                              : "text-gray-500"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              roundTripStep === "return"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            2
                          </div>
                          <span>Chọn chuyến về</span>
                        </div>
                      </div>
                      {roundTripStep === "return" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {

                            setRoundTripStep("outbound");
                            // Reset return flights and show outbound flights again
                            setAllItineraries(
                              allFlights
                                .filter(
                                  (flight) => flight.direction === "outbound"
                                )
                                .map((flight, index) => ({
                                  itineraryId: `outbound-${
                                    flight.flightId || index
                                  }`,
                                  tripType: "ROUND_TRIP",
                                  direction: "outbound",
                                  legs: [flight],
                                  totalPrice: getLowestPrice(flight),
                                  totalDuration: flight.duration || 0,
                                  totalStops: flight.stopsList?.length || 0,
                                }))
                            );
                            setTabPages((prev) => ({
                              ...prev,
                              [activeTab]: 1,
                            }));
                          }}
                          className="ml-4 text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          ← Quay lại
                        </Button>
                      )}
                    </div>

                    {selectedOutboundFlight && roundTripStep === "return" && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <strong>Chuyến đi đã chọn:</strong>{" "}
                          {selectedOutboundFlight.legs[0]?.flightNumber} -{" "}
                          {
                            selectedOutboundFlight.legs[0]?.departureAirport
                              ?.airportCode
                          }{" "}
                          →{" "}
                          {
                            selectedOutboundFlight.legs[0]?.arrivalAirport
                              ?.airportCode
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

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
                searchCriteria?.tripType === "ROUND_TRIP" ? (
                  <>
                    {/* Show flights based on current step */}
                    {roundTripStep === "outbound" ? (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">
                          Chọn Chuyến Bay Đi
                        </h3>
                        <div className="space-y-3 sm:space-y-4">
                          {currentItineraries.map((itinerary) => (
                            <div
                              key={itinerary.itineraryId}
                              className="relative flex flex-row "
                            >
                              <FlightCard
                                flight={itinerary}
                                expandedFlights={
                                  tabExpandedFlights[activeTab] || new Set()
                                }
                                selectedFares={selectedOutboundFares}
                                onToggleDetails={toggleDetails}
                                onSelectFare={handleSelectFare}
                              />
                              {/* Separate select button */}
                              <div className="">
                                <Button
                                  onClick={() =>
                                    handleRoundTripFlightSelection(itinerary)
                                  }
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-full rounded-lg shadow-lg"
                                >
                                  Chọn
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">
                          Chọn Chuyến Bay Về
                        </h3>
                        <div className="space-y-3 sm:space-y-4">
                          {currentItineraries.map((itinerary) => (
                            <div
                              key={itinerary.itineraryId}
                              className="relative flex flex-row"
                            >
                              <FlightCard
                                flight={itinerary}
                                expandedFlights={
                                  tabExpandedFlights[activeTab] || new Set()
                                }
                                selectedFares={selectedReturnFares}
                                onToggleDetails={toggleDetails}
                                onSelectFare={handleSelectFare}
                              />
                              {/* Separate select button */}
                              <div className="">
                                <Button
                                  onClick={() =>
                                    handleRoundTripFlightSelection(itinerary)
                                  }
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-full py-2 rounded-lg shadow-lg"
                                >
                                  Chọn
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  currentItineraries.map((itinerary) => (
                    <FlightCard
                      key={itinerary.itineraryId}
                      flight={itinerary}
                      expandedFlights={
                        tabExpandedFlights[activeTab] || new Set()
                      }
                      selectedFares={selectedFares}
                      onToggleDetails={toggleDetails}
                      onSelectFare={handleSelectFare}
                      onProceedToBooking={handleProceedToBooking}
                    />
                  ))
                )
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
