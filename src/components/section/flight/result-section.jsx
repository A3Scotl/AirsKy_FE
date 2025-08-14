"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SearchForm } from "../../common/search-form";
import { FlightFilters } from "./filter-section";
import DealsSection from "./deal-section";

// Formatting utilities
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatFlightDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

/**
 * @typedef {Object} Flight
 * @property {string} id
 * @property {string} airline
 * @property {string} airlineLogo
 * @property {string} from
 * @property {string} fromCode
 * @property {string} to
 * @property {string} toCode
 * @property {string} date
 * @property {number} priceNumeric
 * @property {string} type
 * @property {string} departureTime
 * @property {string} duration
 */

const allFlights = [
  {
    id: "1",
    airline: "VietJet Air",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2021/02/VietJet-Air-Logo.png",
    from: "Ho Chi Minh City",
    fromCode: "SGN",
    to: "Bangkok",
    toCode: "BKK",
    date: "2025-08-26",
    priceNumeric: 57,
    type: "One Way",
    departureTime: "08:30",
    duration: "80",
  },
  {
    id: "2",
    airline: "Scoot",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2020/03/Scoot-Logo.png",
    from: "Ho Chi Minh City",
    fromCode: "SGN",
    to: "Singapore",
    toCode: "SIN",
    date: "2025-08-23",
    priceNumeric: 45,
    type: "One Way",
    departureTime: "14:15",
    duration: "125",
  },
  {
    id: "3",
    airline: "AirAsia",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2020/03/AirAsia-Logo.png",
    from: "Ho Chi Minh City",
    fromCode: "SGN",
    to: "Kuala Lumpur",
    toCode: "KUL",
    date: "2025-09-10",
    priceNumeric: 51,
    type: "One Way",
    departureTime: "19:45",
    duration: "135",
  },
  {
    id: "4",
    airline: "Vietnam Airlines",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2021/02/Vietnam-Airlines-Logo.png",
    from: "Hanoi",
    fromCode: "HAN",
    to: "Singapore",
    toCode: "SIN",
    date: "2025-08-30",
    priceNumeric: 86,
    type: "One Way",
    departureTime: "06:20",
    duration: "180",
  },
  {
    id: "5",
    airline: "Jetstar Pacific",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2020/03/Jetstar-Logo.png",
    from: "Ho Chi Minh City",
    fromCode: "SGN",
    to: "Da Nang",
    toCode: "DAD",
    date: "2025-08-20",
    priceNumeric: 33,
    type: "One Way",
    departureTime: "11:30",
    duration: "75",
  },
  {
    id: "6",
    airline: "Thai AirAsia",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2020/03/Thai-AirAsia-Logo.png",
    from: "Bangkok",
    fromCode: "DMK",
    to: "Ho Chi Minh City",
    toCode: "SGN",
    date: "2025-09-11",
    priceNumeric: 50,
    type: "One Way",
    departureTime: "16:40",
    duration: "90",
  },
  {
    id: "7",
    airline: "Emirates",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2020/03/Emirates-Logo.png",
    from: "Ho Chi Minh City",
    fromCode: "SGN",
    to: "Dubai",
    toCode: "DXB",
    date: "2025-08-15",
    priceNumeric: 504,
    type: "One Way",
    departureTime: "22:15",
    duration: "420",
  },
  {
    id: "8",
    airline: "Singapore Airlines",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2020/03/Singapore-Airlines-Logo.png",
    from: "Singapore",
    fromCode: "SIN",
    to: "Tokyo",
    toCode: "NRT",
    date: "2025-08-20",
    priceNumeric: 342,
    type: "One Way",
    departureTime: "13:25",
    duration: "390",
  },
  {
    id: "9",
    airline: "VietJet Air",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2021/02/VietJet-Air-Logo.png",
    from: "Hanoi",
    fromCode: "HAN",
    to: "Ho Chi Minh City",
    toCode: "SGN",
    date: "2025-08-25",
    priceNumeric: 48,
    type: "One Way",
    departureTime: "07:00",
    duration: "120",
  },
  {
    id: "10",
    airline: "Bamboo Airways",
    airlineLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Bamboo_Airways_logo.svg/1024px-Bamboo_Airways_logo.svg.png",
    from: "Da Nang",
    fromCode: "DAD",
    to: "Seoul",
    toCode: "ICN",
    date: "2025-09-05",
    priceNumeric: 196,
    type: "One Way",
    departureTime: "09:45",
    duration: "240",
  },
  {
    id: "11",
    airline: "Qatar Airways",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2020/03/Qatar-Airways-Logo.png",
    from: "Ho Chi Minh City",
    fromCode: "SGN",
    to: "Doha",
    toCode: "DOH",
    date: "2025-08-28",
    priceNumeric: 608,
    type: "One Way",
    departureTime: "01:30",
    duration: "480",
  },
  {
    id: "12",
    airline: "AirAsia",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2020/03/AirAsia-Logo.png",
    from: "Kuala Lumpur",
    fromCode: "KUL",
    to: "Bangkok",
    toCode: "BKK",
    date: "2025-09-01",
    priceNumeric: 27,
    type: "One Way",
    departureTime: "18:20",
    duration: "95",
  },
];

export function FlightSearchResults() {
  const navigate = useNavigate();
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState(null);
  const [filters, setFilters] = useState({
    priceRange: [20, 1000],
    airlines: [],
    departureTime: [],
    sortBy: "price-asc",
  });
  const [activeTab, setActiveTab] = useState("one-way");
  const [expandedFlights, setExpandedFlights] = useState(new Set());
  const [selectedFares, setSelectedFares] = useState({});

  // Fare options data
  const fareOptions = [
    {
      id: "basic",
      name: "Basic Economy",
      price: 298,
      features: [
        { included: true, text: "Personal item" },
        { included: false, text: "Carry-on" },
        { included: false, text: "Checked bag" },
        { included: false, text: "Seat selection" },
        { included: false, text: "Changes/cancellations" },
      ],
    },
    {
      id: "main",
      name: "Main Cabin",
      price: 398,
      recommended: true,
      features: [
        { included: true, text: "Personal item" },
        { included: true, text: "Carry-on" },
        { included: true, text: "1 checked bag" },
        { included: true, text: "Advance seat selection" },
        { included: true, text: "Changes (fees apply)" },
      ],
    },
    {
      id: "first",
      name: "First Class",
      price: 1298,
      features: [
        { included: true, text: "Personal item" },
        { included: true, text: "Carry-on" },
        { included: true, text: "2 checked bags" },
        { included: true, text: "Free seat selection" },
        { included: true, text: "Free changes & cancellations" },
        { included: true, text: "Premium meals, drinks" },
      ],
    },
  ];

  const handleSearch = (criteria) => {
    setSearchCriteria(criteria);
  };

  const handleBookFlight = (flight) => {
    setSelectedFlight(flight);
    setIsBookingModalOpen(true);
  };

  const handleSelectFare = (flightId, fareId) => {
    setSelectedFares((prev) => ({
      ...prev,
      [flightId]: fareId,
    }));
  };

  const handleProceedToBooking = (flight, fareId) => {
    const selectedFare = fareOptions.find((fare) => fare.id === fareId);
    // Store flight and fare data for the booking process
    localStorage.setItem("selectedFlight", JSON.stringify(flight));
    localStorage.setItem("selectedFare", JSON.stringify(selectedFare));
    // Navigate to booking stepper
    navigate("/booking-stepper");
  };

  const handleResetFilters = () => {
    setFilters({
      priceRange: [20, 1000],
      airlines: [],
      departureTime: [],
      sortBy: "price-asc",
    });
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

  const isDomestic = (flight) => {
    const vietnamCodes = ["SGN", "HAN", "DAD"];
    return (
      vietnamCodes.includes(flight.fromCode) &&
      vietnamCodes.includes(flight.toCode)
    );
  };

  const filteredAndSortedFlights = useMemo(() => {
    const filtered = allFlights.filter((flight) => {
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

      // Search criteria filter
      if (searchCriteria) {
        const fromCodeMatch = searchCriteria.from.match(/\(([^)]+)\)/)?.[1];
        const toCodeMatch = searchCriteria.to.match(/\(([^)]+)\)/)?.[1];
        const fromMatch =
          flight.from
            .toLowerCase()
            .includes(searchCriteria.from.toLowerCase().split("(")[0].trim()) ||
          flight.fromCode === fromCodeMatch;
        const toMatch =
          flight.to
            .toLowerCase()
            .includes(searchCriteria.to.toLowerCase().split("(")[0].trim()) ||
          flight.toCode === toCodeMatch;

        if (!fromMatch || !toMatch) {
          return false;
        }
      }

      // Tab filter
      if (activeTab === "domestic" && !isDomestic(flight)) {
        return false;
      }
      if (activeTab === "international" && isDomestic(flight)) {
        return false;
      }
      // For 'one-way', no additional filter since all are one-way

      return true;
    });

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
  }, [filters, searchCriteria, activeTab]);

  return (
    <div className="max-w-7xl mx-auto ">
      {/* Search Form with Background Image */}
      <div className="relative mb-12">
        {/* Background Image with Overlay */}
        <div
          className="h-80 bg-cover bg-center bg-no-repeat relative"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1713396124163-21d4ea332d90?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDIyfHx8ZW58MHx8fHx8')`,
          }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-opacity-50"></div>

          {/* Content over background */}
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-3xl font-bold mb-2">Find your flights</h1>
              <p className="text-lg opacity-90">
                Explore the world with amazing deals
              </p>
            </div>
          </div>
        </div>

       

        {/* Search Form positioned at bottom border */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl px-4 z-20">
          <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
            <SearchForm />
          </div>
        </div>
      </div>

      <DealsSection />

      {/* Results Section */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <div className="w-80 flex-shrink-0">
          <FlightFilters
            filters={filters}
            onFiltersChange={setFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Flight Results */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {searchCriteria
                  ? `Flights From ${searchCriteria.from} To ${searchCriteria.to}`
                  : "Find Cheap Flight Deals From Vietnam"}
              </h2>
              <p className="text-sm text-gray-600">
                {filteredAndSortedFlights.length} flights found
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className={`${
                  activeTab === "one-way"
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : ""
                }`}
                onClick={() => setActiveTab("one-way")}
              >
                One Way
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`${
                  activeTab === "domestic"
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : ""
                }`}
                onClick={() => setActiveTab("domestic")}
              >
                Domestic
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`${
                  activeTab === "international"
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : ""
                }`}
                onClick={() => setActiveTab("international")}
              >
                International
              </Button>
            </div>
          </div>

          {/* Flight Results List */}
          <div className="space-y-4">
            {filteredAndSortedFlights.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">
                  No flights found matching your search criteria.
                </p>
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="mt-4 bg-transparent"
                >
                  Reset Filters
                </Button>
              </Card>
            ) : (
              filteredAndSortedFlights.map((flight) => (
                <Card
                  key={flight.id}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    {/* Left side - Airline info and route */}
                    <div className="flex items-center gap-4 flex-1">
                      {/* Airline logo and name */}
                      <div className="flex items-center gap-3">
                        <img
                          src={flight.airlineLogo}
                          alt={flight.airline}
                          className="w-10 h-10 rounded object-contain bg-white p-1 border"
                        />
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {flight.airline}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">
                              {flight.from} ({flight.fromCode})
                            </span>
                            <ArrowRight className="w-4 h-4" />
                            <span className="font-medium">
                              {flight.to} ({flight.toCode})
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                              {formatDate(flight.date)}
                            </span>
                            <span className="font-semibold text-blue-600">
                              {flight.departureTime}
                            </span>
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              {formatFlightDuration(parseInt(flight.duration))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Price and booking */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(flight.priceNumeric)}
                        </p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {flight.type}
                        </Badge>
                      </div>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-white font-semibold"
                        onClick={() => handleBookFlight(flight)}
                      >
                        Detail
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>

                  {/* Details Toggle */}
                  <div className="mt-4">
                    <Button
                      variant="link"
                      className="text-blue-600 p-0"
                      onClick={() => toggleDetails(flight.id)}
                    >
                      {expandedFlights.has(flight.id) ? "Hide" : "View more"}
                    </Button>
                    {expandedFlights.has(flight.id) && (
                      <div className="mt-4 border-t pt-4">
                        <h3 className="text-lg font-semibold mb-4">
                          Choose Your Fare
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {fareOptions.map((fare) => (
                            <div
                              key={fare.id}
                              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                                selectedFares[flight.id] === fare.id
                                  ? "ring-2 ring-blue-500 bg-blue-50"
                                  : "hover:border-blue-300"
                              } ${
                                fare.recommended ? "bg-blue-50 relative" : ""
                              }`}
                              onClick={() =>
                                handleSelectFare(flight.id, fare.id)
                              }
                            >
                              {fare.recommended && (
                                <Badge className="absolute top-2 right-2 bg-blue-600 text-white">
                                  Recommended
                                </Badge>
                              )}

                              <div className="mb-3">
                                <h4 className="font-bold text-gray-900">
                                  {fare.name}
                                </h4>
                                <p className="text-xl font-bold text-blue-600">
                                  ${fare.price}
                                </p>
                                <p className="text-xs text-gray-500">
                                  per person
                                </p>
                              </div>

                              {/* Condensed Features List */}
                              <div className="space-y-1 mb-4">
                                {fare.features
                                  .slice(0, 3)
                                  .map((feature, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center text-sm"
                                    >
                                      <span
                                        className={`mr-2 ${
                                          feature.included
                                            ? "text-green-500"
                                            : "text-red-500"
                                        }`}
                                      >
                                        {feature.included ? "✓" : "✗"}
                                      </span>
                                      <span className="text-gray-700">
                                        {feature.text}
                                      </span>
                                    </div>
                                  ))}
                                {fare.features.length > 3 && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    +{fare.features.length - 3} more features
                                  </p>
                                )}
                              </div>

                              {selectedFares[flight.id] === fare.id ? (
                                <Button
                                  className="w-full bg-blue-600 text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleProceedToBooking(flight, fare.id);
                                  }}
                                >
                                  Continue to Booking
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Select Fare
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Quick Action */}
                        {selectedFares[flight.id] && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-green-800">
                                  {
                                    fareOptions.find(
                                      (f) => f.id === selectedFares[flight.id]
                                    )?.name
                                  }{" "}
                                  selected
                                </p>
                                <p className="text-xs text-green-600">
                                  Total: $
                                  {
                                    fareOptions.find(
                                      (f) => f.id === selectedFares[flight.id]
                                    )?.price
                                  }
                                </p>
                              </div>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() =>
                                  handleProceedToBooking(
                                    flight,
                                    selectedFares[flight.id]
                                  )
                                }
                              >
                                Book Now <ArrowRight className="w-4 h-4 ml-1" />
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
        </div>
      </div>
    </div>
  );
}
