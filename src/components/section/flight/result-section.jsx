"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plane,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { SearchForm } from "../../common/search-form";
import { FlightFilters } from "./filter-section";
import DealsSection from "./deal-section";
import { flightApi } from "../../../apis/flight-api";
import { airportApi } from "../../../apis/airport-api";
import { useSearch } from "../../../contexts/search-context";

// Formatting utilities
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount); // Display as-is since prices are already in VND
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatFlightDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}g ${mins}p`;
};

// Flight data will be fetched from API
// const allFlights = [ ... ]; // Removed static data

export function FlightSearchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { searchCriteria: contextSearchCriteria } = useSearch();
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [searchCriteria, setSearchCriteria] = useState(null); // Start with no search criteria
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priceRange: [100000, 10000000],
    airlines: [],
    departureTime: [],
    sortBy: "price-asc",
  });
  const [activeTab, setActiveTab] = useState("all"); // Start with all flights
  const [expandedFlights, setExpandedFlights] = useState(new Set());
  const [selectedFares, setSelectedFares] = useState({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [flightsPerPage] = useState(6); // Giảm xuống 4 để có nhiều trang hơn

  // Debug: Log when searchCriteria changes
  useEffect(() => {
    console.log("🔄 searchCriteria updated:", searchCriteria);
    console.log("🔄 searchCriteria type check:", {
      hasFrom: !!searchCriteria?.from,
      hasTo: !!searchCriteria?.to,
      fromType: typeof searchCriteria?.from,
      toType: typeof searchCriteria?.to,
      fromValue: searchCriteria?.from,
      toValue: searchCriteria?.to,
    });
  }, [searchCriteria]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchCriteria, activeTab]);

  // Get search criteria from URL params (from homepage) or location state
  useEffect(() => {
    console.log("🔍 Checking sources:");
    console.log("- URL params from:", searchParams.get("from"));
    console.log("- URL params to:", searchParams.get("to"));
    console.log("- Context:", contextSearchCriteria);
    console.log("- Location state:", location.state);

    // First priority: Location state (from destination click)
    if (location.state && location.state.searchCriteria) {
      const locationCriteria = location.state.searchCriteria;
      console.log(
        "✅ Using location state (highest priority):",
        locationCriteria
      );
      setSearchCriteria(locationCriteria);
      return;
    }

    // Second priority: URL params (from homepage search)
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const departDateParam = searchParams.get("departDate");
    const returnDateParam = searchParams.get("returnDate");
    const tripTypeParam = searchParams.get("tripType");
    const passengersParam = searchParams.get("passengers");

    if (fromParam || toParam) {
      const criteria = {
        from: fromParam,
        to: toParam,
        departDate: departDateParam ? new Date(departDateParam) : null,
        returnDate: returnDateParam ? new Date(returnDateParam) : null,
        tripType: tripTypeParam || "oneway",
        passengers: passengersParam
          ? JSON.parse(passengersParam)
          : { adults: 1, children: 0, infants: 0 },
        searchCombinations: [], // Single combination for backward compatibility
      };
      console.log("📋 Using URL params (second priority):", criteria);
      setSearchCriteria(criteria);
      return;
    }

    // Third priority: Context (fallback)
    if (contextSearchCriteria) {
      console.log("🔄 Using context (third priority):", contextSearchCriteria);
      setSearchCriteria(contextSearchCriteria);
      return;
    }

    // No valid search criteria found
    console.log("❌ No valid search criteria found from any source");
  }, [searchParams, location.state, contextSearchCriteria]);

  // Listen for context changes (when context is updated after component mount)
  useEffect(() => {
    if (
      contextSearchCriteria &&
      !searchParams.get("from") &&
      !location.state?.searchCriteria
    ) {
      console.log(
        "Context updated, setting search criteria:",
        contextSearchCriteria
      );
      setSearchCriteria(contextSearchCriteria);
    }
  }, [contextSearchCriteria, searchParams, location.state]);

  // Fetch flights based on search criteria
  useEffect(() => {
    console.log("🔍 useEffect triggered with searchCriteria:", searchCriteria);
    console.log("🔍 location.state:", location.state);

    const fetchFlightsByCriteria = async () => {
      if (!searchCriteria) {
        console.log("❌ No searchCriteria found, skipping fetch");
        return;
      }

      try {
        setLoading(true);
        let response;

        // Check if we have from and to countries for international flights (from destination click)
        console.log("🔍 Checking API call conditions:");
        console.log("- searchCriteria:", searchCriteria);
        console.log(
          "- searchCriteria.from:",
          searchCriteria?.from,
          "(type:",
          typeof searchCriteria?.from,
          ")"
        );
        console.log(
          "- searchCriteria.to:",
          searchCriteria?.to,
          "(type:",
          typeof searchCriteria?.to,
          ")"
        );
        console.log(
          "- from is string:",
          typeof searchCriteria?.from === "string"
        );
        console.log("- to is string:", typeof searchCriteria?.to === "string");

        // Check if this is a country-based search (from destination click)
        const isCountrySearch =
          (typeof searchCriteria.from === "string" &&
            searchCriteria.from === "Việt Nam") ||
          (typeof searchCriteria.from === "string" &&
            !searchCriteria.from.includes("(") &&
            !searchCriteria.from.includes(")"));

        console.log("🔍 isCountrySearch:", isCountrySearch);
        console.log(
          "🔍 searchCriteria.from contains '(': ",
          typeof searchCriteria.from === "string" &&
            searchCriteria.from.includes("(")
        );
        console.log(
          "🔍 searchCriteria.from contains ')': ",
          typeof searchCriteria.from === "string" &&
            searchCriteria.from.includes(")")
        );

        if (isCountrySearch) {
          console.log(
            `✈️ ✅ Using findFlightsBetweenCountries API for country search: ${
              typeof searchCriteria.from === "string"
                ? searchCriteria.from
                : "N/A"
            } -> ${
              typeof searchCriteria.to === "string" ? searchCriteria.to : "N/A"
            }`
          );

          // Use the between countries API
          response = await flightApi.findFlightsBetweenCountries(
            typeof searchCriteria.from === "string" ? searchCriteria.from : "", // departureCountry
            typeof searchCriteria.to === "string" ? searchCriteria.to : "", // arrivalCountry
            { page: 0, size: 1000 }
          );

          console.log(
            "📋 API Response from findFlightsBetweenCountries:",
            response
          );
        } else {
          console.log("🏙️ Using getAllFlights API for airport search");
          // For airport searches, get all flights and filter client-side
          response = await flightApi.getAllFlights({ size: 1000 });
        }

        if (response.success) {
          console.log("✅ API call successful");
          console.log("📦 Raw API response:", response);
          console.log("📦 Response data:", response.data);
          console.log("📦 Content array:", response.data?.content);
          console.log(
            "📦 Content length:",
            response.data?.content?.length || 0
          );

          // Map API data to UI format
          const mappedFlights = response.data.content.map((flight) => ({
            id: flight.flightId,
            airline: flight.airlineName || "Unknown Airline",
            airlineLogo: flight.airlineName
              ? `https://logo.clearbit.com/${flight.airlineName
                  .toLowerCase()
                  .replace(/\s+/g, "")
                  .replace(/[^a-zA-Z0-9]/g, "")}.com`
              : "https://via.placeholder.com/40x40?text=Logo",
            from: flight.from || "Unknown",
            fromCode: flight.fromCode || "UNK",
            to: flight.to || "Unknown",
            toCode: flight.toCode || "UNK",
            date: flight.departureTime
              ? new Date(flight.departureTime).toISOString().split("T")[0]
              : "",
            priceNumeric: flight.basePrice || 0,
            type: flight.type || "ONE_WAY",
            departureTime: flight.departureTime
              ? new Date(flight.departureTime).toTimeString().slice(0, 5)
              : "",
            arrivalTime: flight.arrivalTime
              ? new Date(flight.arrivalTime).toTimeString().slice(0, 5)
              : "",
            duration: flight.duration || 0,
            stops: flight.stops || "Bay thẳng",
            aircraft: flight.aircraft || "Airbus A321",
          }));

          console.log(
            "🔄 Mapped flights sample (first 3):",
            mappedFlights.slice(0, 3)
          );

          // Remove duplicates
          const uniqueFlights = mappedFlights.filter(
            (flight, index, self) =>
              index === self.findIndex((f) => f.id === flight.id)
          );

          console.log(
            `✨ Final unique flights: ${uniqueFlights.length} flights`
          );
          console.log(
            "Sample unique flights:",
            uniqueFlights.slice(0, 2).map((f) => ({
              id: f.id,
              from: f.from,
              to: f.to,
              fromCode: f.fromCode,
              toCode: f.toCode,
              airline: f.airline,
              price: f.priceNumeric,
            }))
          );

          setAllFlights(uniqueFlights);
        } else {
          console.error("Failed to fetch flights:", response.message);
        }
      } catch (error) {
        console.error("Error fetching flights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlightsByCriteria();
  }, [searchCriteria]);

  console.log("search criteria:", searchCriteria);
  // Debug component to test navigation
  const DebugInfo = () => (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
      <h3 className="font-bold text-yellow-800">🔍 Debug Info:</h3>
      <p className="text-sm text-yellow-700">
        Search Criteria: {JSON.stringify(searchCriteria, null, 2)}
      </p>
      <p className="text-sm text-yellow-700">
        Location State: {JSON.stringify(location.state, null, 2)}
      </p>
      <p className="text-sm text-yellow-700">
        Has Country Search:{" "}
        {searchCriteria?.from === "Việt Nam" && searchCriteria?.to
          ? "YES"
          : "NO"}
      </p>
    </div>
  );

  // Simplified fare options data with Vietnamese text
  const fareOptions = [
    {
      id: "basic",
      name: "Phổ thông cơ bản",
      price: 1200000,
      features: [
        { included: true, text: "Hành lý xách tay" },
        { included: false, text: "Hành lý ký gửi" },
        { included: false, text: "Chọn chỗ ngồi" },
        { included: false, text: "Đổi/hủy vé" },
      ],
    },
    {
      id: "main",
      name: "Phổ thông tiêu chuẩn",
      price: 1800000,
      recommended: true,
      features: [
        { included: true, text: "Hành lý xách tay" },
        { included: true, text: "1 hành lý ký gửi" },
        { included: true, text: "Chọn chỗ ngồi trước" },
        { included: true, text: "Đổi vé (có phí)" },
      ],
    },
    {
      id: "first",
      name: "Thương gia",
      price: 4200000,
      features: [
        { included: true, text: "Hành lý xách tay" },
        { included: true, text: "2 hành lý ký gửi" },
        { included: true, text: "Chọn chỗ ngồi miễn phí" },
        { included: true, text: "Đổi/hủy vé miễn phí" },
        { included: true, text: "Suất ăn cao cấp" },
      ],
    },
  ];

  const handleSearch = (criteria) => setSearchCriteria(criteria);
  const handleBookFlight = (flight) => setSelectedFlight(flight);
  const handleViewFlightDetails = (flight) =>
    navigate("/detail/" + flight.id, { state: { flight } });

  const handleSelectFare = (flightId, fareId) => {
    setSelectedFares((prev) => ({ ...prev, [flightId]: fareId }));
  };

  const handleProceedToBooking = (flight, fareId) => {
    const selectedFare = fareOptions.find((fare) => fare.id === fareId);
    if (!selectedFare) {
      console.error("Selected fare not found");
      return;
    }

    // Prepare flight data for booking
    const bookingFlightData = {
      ...flight,
      selectedFare: selectedFare,
      fareId: fareId,
    };

    // Store in localStorage and navigate
    localStorage.setItem("selectedFlight", JSON.stringify(bookingFlightData));
    localStorage.setItem("selectedFare", JSON.stringify(selectedFare));

    // Navigate with state as backup
    navigate("/booking-stepper", { state: { flightData: bookingFlightData } });
  };

  const handleResetFilters = () => {
    setFilters({
      priceRange: [100000, 10000000], // Từ 100k đến 10 triệu VND
      airlines: [],
      departureTime: [],
      sortBy: "price-asc",
    });
    setActiveTab("all");
    setCurrentPage(1);
  };

  const toggleDetails = (flightId) => {
    setExpandedFlights((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(flightId)) {
        newSet.delete(flightId);
      } else {
        newSet.add(flightId);
      }
      return newSet;
    });
  };

  const getDepartureTimeSlot = (time) => {
    const hour = Number.parseInt(time.split(":")[0]);
    if (hour >= 0 && hour < 6) return "early-morning";
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    return "evening";
  };

  const filteredAndSortedFlights = useMemo(() => {
    console.log("Starting flight filtering...");
    console.log("Total flights in allFlights:", allFlights.length);
    console.log(
      "Flight IDs in allFlights:",
      allFlights.map((f) => f.id)
    );

    // Check for duplicates in original data
    const flightIds = allFlights.map((f) => f.id);
    const uniqueIds = new Set(flightIds);
    if (flightIds.length !== uniqueIds.size) {
      console.warn("DUPLICATE FLIGHT IDs FOUND IN ORIGINAL DATA!");
      console.warn("Total flights:", flightIds.length);
      console.warn("Unique IDs:", uniqueIds.size);
    }

    let filtered = allFlights.filter((flight) => {
      // Price filter
      if (
        flight.priceNumeric < filters.priceRange[0] ||
        flight.priceNumeric > filters.priceRange[1]
      ) {
        return false;
      }
      return true;
    });
    console.log("After price filter:", filtered.length);

    // Airline filter
    filtered = filtered.filter((flight) => {
      if (
        filters.airlines.length > 0 &&
        !filters.airlines.includes(flight.airline)
      ) {
        return false;
      }
      return true;
    });
    console.log("After airline filter:", filtered.length);

    // Departure time filter
    filtered = filtered.filter((flight) => {
      if (filters.departureTime.length > 0) {
        const flightTimeSlot = getDepartureTimeSlot(flight.departureTime);
        if (!filters.departureTime.includes(flightTimeSlot)) {
          return false;
        }
      }
      return true;
    });
    console.log("After departure time filter:", filtered.length);

    // Search criteria filter
    console.log("Search criteria:", searchCriteria);
    console.log("Search criteria type:", typeof searchCriteria);
    if (searchCriteria) {
      console.log("Search criteria keys:", Object.keys(searchCriteria));
      console.log(
        "Search criteria from:",
        typeof searchCriteria.from === "string"
          ? searchCriteria.from
          : searchCriteria.from
      );
      console.log(
        "Search criteria to:",
        typeof searchCriteria.to === "string"
          ? searchCriteria.to
          : searchCriteria.to
      );
    }
    filtered = filtered.filter((flight) => {
      if (searchCriteria) {
        console.log(
          `Checking flight ${flight.id}: ${flight.from} (${flight.fromCode}) -> ${flight.to} (${flight.toCode})`
        );

        // Check if we have search combinations (multiple from/to pairs)
        if (
          searchCriteria.searchCombinations &&
          searchCriteria.searchCombinations.length > 0
        ) {
          console.log(
            "Filtering with",
            searchCriteria.searchCombinations.length,
            "combinations"
          );

          // Check if flight matches ANY of the search combinations
          const matchesAnyCombination = searchCriteria.searchCombinations.some(
            (combination) => {
              let fromCriteria = combination.from;
              let toCriteria = combination.to;

              console.log(
                `Checking combination: ${JSON.stringify(
                  fromCriteria
                )} -> ${JSON.stringify(toCriteria)}`
              );

              // Convert object format to string format for comparison
              if (
                fromCriteria &&
                typeof fromCriteria === "object" &&
                fromCriteria.airportCode
              ) {
                fromCriteria = `${fromCriteria.city} (${fromCriteria.airportCode})`;
              }
              if (
                toCriteria &&
                typeof toCriteria === "object" &&
                toCriteria.airportCode
              ) {
                toCriteria = `${toCriteria.city} (${toCriteria.airportCode})`;
              }

              console.log(
                `Converted combination: ${fromCriteria} -> ${toCriteria}`
              );

              // Check if flight matches this combination
              if (fromCriteria && toCriteria) {
                const fromCodeMatch = fromCriteria.match(/\(([^)]+)\)/)?.[1];
                const toCodeMatch = toCriteria.match(/\(([^)]+)\)/)?.[1];
                console.log(
                  `Extracted codes: from=${fromCodeMatch}, to=${toCodeMatch}`
                );

                // Special handling for country-based search (from destination click)
                // If criteria is a country name, do relaxed matching
                let fromMatch = false;
                let toMatch = false;

                if (fromCodeMatch) {
                  // Airport code matching (original logic)
                  fromMatch = flight.fromCode === fromCodeMatch;
                } else {
                  // Country/city name matching - relaxed
                  const fromSearchTerm = fromCriteria
                    .toLowerCase()
                    .split("(")[0]
                    .trim();
                  fromMatch =
                    flight.from.toLowerCase().includes(fromSearchTerm) ||
                    flight.fromCode.toLowerCase().includes(fromSearchTerm);
                }

                if (toCodeMatch) {
                  // Airport code matching (original logic)
                  toMatch = flight.toCode === toCodeMatch;
                } else {
                  // Country/city name matching - relaxed
                  const toSearchTerm = toCriteria
                    .toLowerCase()
                    .split("(")[0]
                    .trim();
                  toMatch =
                    flight.to.toLowerCase().includes(toSearchTerm) ||
                    flight.toCode.toLowerCase().includes(toSearchTerm);
                }

                console.log(
                  `Flight ${flight.id} from match: ${fromMatch} (${
                    flight.from
                  }/${flight.fromCode} includes ${fromCriteria
                    .toLowerCase()
                    .split("(")[0]
                    .trim()})`
                );
                console.log(
                  `Flight ${flight.id} to match: ${toMatch} (${flight.to}/${
                    flight.toCode
                  } includes ${toCriteria.toLowerCase().split("(")[0].trim()})`
                );

                const matches = fromMatch && toMatch;
                if (matches) {
                  console.log(
                    `Flight ${flight.id} matches combination: ${fromCriteria} -> ${toCriteria}`
                  );
                }
                return matches;
              }
              return false;
            }
          );

          return matchesAnyCombination;
        } else {
          // Handle single search criteria (backward compatibility)
          let fromCriteria =
            typeof searchCriteria.from === "string" ? searchCriteria.from : "";
          let toCriteria =
            typeof searchCriteria.to === "string" ? searchCriteria.to : "";

          console.log(
            `Single criteria - Raw from: ${JSON.stringify(
              fromCriteria
            )}, to: ${JSON.stringify(toCriteria)}`
          );

          // If it's an array (from AirportAutocomplete), get the first item
          if (Array.isArray(fromCriteria) && fromCriteria.length > 0) {
            fromCriteria = fromCriteria[0];
          }
          if (Array.isArray(toCriteria) && toCriteria.length > 0) {
            toCriteria = toCriteria[0];
          }

          console.log(
            `After array check - from: ${JSON.stringify(
              fromCriteria
            )}, to: ${JSON.stringify(toCriteria)}`
          );

          // If it's an object with airportCode, convert to string format
          if (
            fromCriteria &&
            typeof fromCriteria === "object" &&
            fromCriteria.airportCode
          ) {
            fromCriteria = `${fromCriteria.city} (${fromCriteria.airportCode})`;
          }
          if (
            toCriteria &&
            typeof toCriteria === "object" &&
            toCriteria.airportCode
          ) {
            toCriteria = `${toCriteria.city} (${toCriteria.airportCode})`;
          }

          console.log(
            `After object conversion - from: ${fromCriteria}, to: ${toCriteria}`
          );

          // Now filter with string format
          if (fromCriteria && toCriteria) {
            // Ensure fromCriteria and toCriteria are strings before calling .match()
            const fromCriteriaStr =
              typeof fromCriteria === "string" ? fromCriteria : "";
            const toCriteriaStr =
              typeof toCriteria === "string" ? toCriteria : "";

            const fromCodeMatch = fromCriteriaStr.match(/\(([^)]+)\)/)?.[1];
            const toCodeMatch = toCriteriaStr.match(/\(([^)]+)\)/)?.[1];
            console.log(
              `Extracted codes: from=${fromCodeMatch}, to=${toCodeMatch}`
            );

            // Special handling for country-based search (from destination click)
            // If criteria is a country name, do relaxed matching
            let fromMatch = false;
            let toMatch = false;

            if (fromCodeMatch) {
              // Airport code matching (original logic)
              fromMatch = flight.fromCode === fromCodeMatch;
            } else {
              // Country/city name matching - relaxed
              const fromSearchTerm = fromCriteriaStr
                .toLowerCase()
                .split("(")[0]
                .trim();
              fromMatch =
                flight.from.toLowerCase().includes(fromSearchTerm) ||
                flight.fromCode.toLowerCase().includes(fromSearchTerm);
            }

            if (toCodeMatch) {
              // Airport code matching (original logic)
              toMatch = flight.toCode === toCodeMatch;
            } else {
              // Country/city name matching - relaxed
              const toSearchTerm = toCriteriaStr
                .toLowerCase()
                .split("(")[0]
                .trim();
              toMatch =
                flight.to.toLowerCase().includes(toSearchTerm) ||
                flight.toCode.toLowerCase().includes(toSearchTerm);
            }

            console.log(
              `Flight ${flight.id} from match: ${fromMatch} (${flight.from}/${
                flight.fromCode
              } includes ${
                typeof fromCriteriaStr === "string"
                  ? fromCriteriaStr.toLowerCase().split("(")[0].trim()
                  : "N/A"
              })`
            );
            console.log(
              `Flight ${flight.id} to match: ${toMatch} (${flight.to}/${
                flight.toCode
              } includes ${
                typeof toCriteriaStr === "string"
                  ? toCriteriaStr.toLowerCase().split("(")[0].trim()
                  : "N/A"
              })`
            );

            if (!fromMatch || !toMatch) {
              console.log(
                `Flight ${flight.id} does NOT match criteria, filtering out`
              );
              return false;
            } else {
              console.log(`Flight ${flight.id} matches criteria, keeping`);
            }
          } else {
            console.log(`Missing from or to criteria for flight ${flight.id}`);
          }
        }
      } else {
        console.log(`No search criteria for flight ${flight.id}, keeping`);
      }
      return true;
    });
    console.log("After search criteria filter:", filtered.length);

    // Remove duplicates based on flight ID - this is crucial for multiple combinations
    console.log(
      "Flights before duplicate removal:",
      filtered.map((f) => f.id)
    );
    const uniqueFiltered = filtered.filter((flight, index, self) => {
      const isUnique = index === self.findIndex((f) => f.id === flight.id);
      if (!isUnique) {
        console.log(`Removing duplicate flight ${flight.id}`);
      }
      return isUnique;
    });
    filtered = uniqueFiltered;
    console.log("After removing duplicates:", filtered.length);
    console.log(
      "Unique flight IDs:",
      filtered.map((f) => f.id)
    );

    // Tab filter based on flight type
    filtered = filtered.filter((flight) => {
      if (activeTab === "all") {
        return true; // Show all flights
      }
      if (activeTab === "domestic" && flight.type !== "DOMESTIC") {
        return false;
      }
      if (activeTab === "international" && flight.type !== "INTERNATIONAL") {
        return false;
      }
      // For "one-way" tab, show only ONE_WAY flights
      if (activeTab === "one-way" && flight.type !== "ONE_WAY") {
        return false;
      }
      return true;
    });
    console.log("After tab filter:", filtered.length);
    console.log("Final filtered flights:", filtered);

    // Sort flights
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "price-asc":
          return a.priceNumeric - b.priceNumeric;
        case "price-desc":
          return b.priceNumeric - a.priceNumeric;
        case "departure-asc":
          return a.departureTime.localeCompare(b.departureTime);
        case "departure-desc":
          return b.departureTime.localeCompare(a.departureTime);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allFlights, filters, searchCriteria, activeTab]);

  // Calculate pagination
  const totalFlights = filteredAndSortedFlights.length;
  const totalPages = Math.ceil(totalFlights / flightsPerPage);
  const startIndex = (currentPage - 1) * flightsPerPage;
  const currentFlights = filteredAndSortedFlights.slice(
    startIndex,
    startIndex + flightsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevious = () =>
    currentPage > 1 && handlePageChange(currentPage - 1);
  const handleNext = () =>
    currentPage < totalPages && handlePageChange(currentPage + 1);

  // Memoize the initialValues to prevent unnecessary re-renders
  const searchFormInitialValues = useMemo(() => {
    if (!searchCriteria) return null;

    let fromLocations = [];
    let toLocations = [];

    if (
      searchCriteria.searchCombinations &&
      searchCriteria.searchCombinations.length > 0
    ) {
      // Extract unique from locations
      const fromSet = new Set();
      searchCriteria.searchCombinations.forEach((combo) => {
        if (combo.from && combo.from.airportCode) {
          fromSet.add(JSON.stringify(combo.from));
        }
      });
      fromLocations = Array.from(fromSet).map((item) => JSON.parse(item));

      // Extract unique to locations
      const toSet = new Set();
      searchCriteria.searchCombinations.forEach((combo) => {
        if (combo.to && combo.to.airportCode) {
          toSet.add(JSON.stringify(combo.to));
        }
      });
      toLocations = Array.from(toSet).map((item) => JSON.parse(item));
    } else {
      fromLocations =
        typeof searchCriteria.from === "string" ||
        Array.isArray(searchCriteria.from)
          ? searchCriteria.from
          : [];
      toLocations =
        typeof searchCriteria.to === "string" ||
        Array.isArray(searchCriteria.to)
          ? searchCriteria.to
          : [];
    }

    return {
      ...searchCriteria,
      from: fromLocations,
      to: toLocations,
    };
  }, [searchCriteria]);

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

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {searchCriteria
                    ? (() => {
                        // Check if we have multiple search combinations
                        if (
                          searchCriteria.searchCombinations &&
                          searchCriteria.searchCombinations.length > 1
                        ) {
                          const combinationsText =
                            searchCriteria.searchCombinations
                              .slice(0, 3) // Show max 3 combinations in title
                              .map((combo, index) => {
                                let fromDisplay = combo.from;
                                let toDisplay = combo.to;

                                // Convert object format to display format
                                if (
                                  fromDisplay &&
                                  typeof fromDisplay === "object" &&
                                  fromDisplay.airportCode
                                ) {
                                  fromDisplay = `${fromDisplay.city} (${fromDisplay.airportCode})`;
                                }
                                if (
                                  toDisplay &&
                                  typeof toDisplay === "object" &&
                                  toDisplay.airportCode
                                ) {
                                  toDisplay = `${toDisplay.city} (${toDisplay.airportCode})`;
                                }

                                return `${fromDisplay || "N/A"} → ${
                                  toDisplay || "N/A"
                                }`;
                              })
                              .join(", ");

                          const remaining =
                            searchCriteria.searchCombinations.length - 3;
                          const remainingText =
                            remaining > 0 ? ` và ${remaining} tuyến khác` : "";

                          return `Chuyến bay: ${combinationsText}${remainingText}`;
                        } else {
                          // Single search criteria (backward compatibility)
                          let fromDisplay =
                            typeof searchCriteria.from === "string"
                              ? searchCriteria.from
                              : "";
                          let toDisplay =
                            typeof searchCriteria.to === "string"
                              ? searchCriteria.to
                              : "";

                          // If it's an array (from AirportAutocomplete), get the first item
                          if (
                            Array.isArray(fromDisplay) &&
                            fromDisplay.length > 0
                          ) {
                            fromDisplay = fromDisplay[0];
                          }
                          if (
                            Array.isArray(toDisplay) &&
                            toDisplay.length > 0
                          ) {
                            toDisplay = toDisplay[0];
                          }

                          // If it's an object with airportCode, convert to display format
                          if (
                            fromDisplay &&
                            typeof fromDisplay === "object" &&
                            fromDisplay.airportCode
                          ) {
                            fromDisplay = `${fromDisplay.city} (${fromDisplay.airportCode})`;
                          }
                          if (
                            toDisplay &&
                            typeof toDisplay === "object" &&
                            toDisplay.airportCode
                          ) {
                            toDisplay = `${toDisplay.city} (${toDisplay.airportCode})`;
                          }

                          // Only show if we have both from and to
                          if (fromDisplay && toDisplay) {
                            return `Chuyến bay từ ${fromDisplay} đến ${toDisplay}`;
                          } else {
                            return "Tìm ưu đãi chuyến bay giá rẻ từ Việt Nam";
                          }
                        }
                      })()
                    : "Tìm ưu đãi chuyến bay giá rẻ từ Việt Nam"}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  {totalFlights} chuyến bay tìm thấy
                  {totalFlights > 0 && (
                    <span className="ml-2">
                      (Trang {currentPage} / {totalPages})
                    </span>
                  )}
                </p>
              </div>

              {/* Debug Info - Remove this in production */}
              <DebugInfo />

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
                  {[
                    { key: "all", label: "Tất cả" },
                    { key: "domestic", label: "Nội địa" },
                    { key: "international", label: "Quốc tế" },
                  ].map((tab) => (
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

            {/* Flight Results List */}
            <div className="space-y-3 sm:space-y-4">
              {loading ? (
                <Card className="p-6 sm:p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Đang tải chuyến bay...
                  </h3>
                  <p className="text-sm text-gray-600">
                    Vui lòng đợi trong giây lát
                  </p>
                </Card>
              ) : totalFlights === 0 ? (
                <Card className="p-6 sm:p-8 text-center">
                  <Plane className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Không tìm thấy chuyến bay
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Hãy thử điều chỉnh bộ lọc hoặc tìm kiếm khác
                  </p>
                  <Button variant="outline" onClick={handleResetFilters}>
                    Đặt lại bộ lọc
                  </Button>
                </Card>
              ) : (
                currentFlights.map((flight, index) => (
                  <Card
                    key={`flight-${flight.id}-${index}`}
                    className="p-3 sm:p-4 hover:shadow-md transition-shadow hover:bg-blue-50/30transition-bg cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      {/* Left side - Airline info and route */}
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        {/* Airline logo and name */}
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <img
                            src={flight.airlineLogo}
                            alt={flight.airline}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded object-contain bg-white p-1 border flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs sm:text-sm text-gray-900 truncate dark:text-gray-200">
                              {flight.airline}
                            </p>
                            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium truncate">
                                {flight.from} ({flight.fromCode})
                              </span>
                              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="font-medium truncate">
                                {flight.to} ({flight.toCode})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500 mt-1 flex-wrap">
                              <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full whitespace-nowrap">
                                {formatDate(flight.date)}
                              </span>
                              <span className="font-semibold text-blue-600">
                                {flight.departureTime}
                              </span>
                              <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full whitespace-nowrap">
                                {formatFlightDuration(
                                  parseInt(flight.duration)
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right side - Price and booking */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                        <div className="text-left sm:text-right">
                          <p className="text-xl sm:text-2xl font-bold text-blue-600">
                            {formatCurrency(flight.priceNumeric)}
                          </p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {flight.type}
                          </Badge>
                        </div>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 sm:px-6 sm:py-3 text-white font-semibold text-sm"
                          onClick={() => handleViewFlightDetails(flight)}
                        >
                          Đặt vé
                        </Button>
                      </div>
                    </div>

                    {/* Details Toggle */}
                    <div className="mt-4">
                      <Button
                        variant="link"
                        className="text-blue-600 p-0 hover:text-blue-800"
                        onClick={() => toggleDetails(flight.id)}
                      >
                        {expandedFlights.has(flight.id)
                          ? "Ẩn chi tiết"
                          : "Xem chi tiết"}
                        <ChevronRight
                          className={`w-4 h-4 ml-1 transition-transform ${
                            expandedFlights.has(flight.id) ? "rotate-90" : ""
                          }`}
                        />
                      </Button>

                      {expandedFlights.has(flight.id) && (
                        <div className="mt-4 border-t pt-4 bg-gray-50 dark:bg-gray-800 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-4 rounded-b-lg">
                          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-200">
                            Chọn loại vé phù hợp
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {fareOptions.map((fare) => (
                              <div
                                key={fare.id}
                                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                                  selectedFares[flight.id] === fare.id
                                    ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
                                    : "hover:border-blue-300 hover:shadow-sm"
                                } ${
                                  fare.recommended
                                    ? "bg-gradient-to-br from-blue-50 to-indigo-50 relative"
                                    : "bg-white"
                                }`}
                                onClick={() =>
                                  handleSelectFare(flight.id, fare.id)
                                }
                              >
                                {fare.recommended && (
                                  <Badge className="absolute -top-2 right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
                                    Khuyến nghị
                                  </Badge>
                                )}

                                <div className="mb-4">
                                  <h4 className="font-bold text-gray-900 text-lg mb-1">
                                    {fare.name}
                                  </h4>
                                  <p className="text-2xl font-bold text-blue-600 mb-1">
                                    {formatCurrency(fare.price)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    mỗi hành khách
                                  </p>
                                </div>

                                {/* Features List */}
                                <div className="space-y-2 mb-4">
                                  {fare.features.map((feature, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-start text-sm"
                                    >
                                      <span
                                        className={`mr-2 mt-0.5 font-bold ${
                                          feature.included
                                            ? "text-green-500"
                                            : "text-red-400"
                                        }`}
                                      >
                                        {feature.included ? "✓" : "✗"}
                                      </span>
                                      <span
                                        className={`${
                                          feature.included
                                            ? "text-gray-700"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        {feature.text}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {selectedFares[flight.id] === fare.id ? (
                                  <Button
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleProceedToBooking(flight, fare.id);
                                    }}
                                  >
                                    Tiếp tục đặt vé
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    className="w-full border-gray-300 hover:border-blue-400 hover:text-blue-600"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Chọn loại vé này
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Selected Fare Summary */}
                          {selectedFares[flight.id] && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-green-800">
                                    {
                                      fareOptions.find(
                                        (f) => f.id === selectedFares[flight.id]
                                      )?.name
                                    }{" "}
                                    đã được chọn
                                  </p>
                                  <p className="text-xs text-green-600 mt-1">
                                    Tổng cộng:{" "}
                                    {formatCurrency(
                                      fareOptions.find(
                                        (f) => f.id === selectedFares[flight.id]
                                      )?.price
                                    )}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                                  onClick={() =>
                                    handleProceedToBooking(
                                      flight,
                                      selectedFares[flight.id]
                                    )
                                  }
                                >
                                  Đặt ngay
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalFlights > 0 && totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs sm:text-sm text-gray-600">
                  Hiển thị {startIndex + 1}-
                  {Math.min(startIndex + flightsPerPage, totalFlights)}
                  trong tổng số {totalFlights} chuyến bay
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className="text-xs sm:text-sm"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Trước
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else {
                        const start = Math.max(1, currentPage - 2);
                        const end = Math.min(totalPages, start + 4);
                        const adjustedStart = Math.max(1, end - 4);
                        pageNumber = adjustedStart + i;
                      }

                      return (
                        <Button
                          key={pageNumber}
                          variant={
                            currentPage === pageNumber ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNumber)}
                          className="w-8 h-8 p-0 text-xs"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="text-xs sm:text-sm"
                  >
                    Sau
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlightSearchResults;
