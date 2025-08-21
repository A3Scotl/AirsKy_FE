"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SearchForm } from "../../common/search-form";
import { FlightFilters } from "./filter-section";
import DealsSection from "./deal-section";

// Formatting utilities
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount * 24000); // Convert USD to VND approx
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

// Reduced flight data with Vietnamese cities
const allFlights = [
  {
    id: "1",
    airline: "VietJet Air",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2021/02/VietJet-Air-Logo.png",
    from: "TP. Hồ Chí Minh",
    fromCode: "SGN",
    to: "Bangkok",
    toCode: "BKK",
    date: "2025-08-26",
    priceNumeric: 57,
    type: "Một chiều",
    departureTime: "08:30",
    duration: "80",
  },
  {
    id: "2",
    airline: "Vietnam Airlines",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2021/02/Vietnam-Airlines-Logo.png",
    from: "Hà Nội",
    fromCode: "HAN",
    to: "Singapore",
    toCode: "SIN",
    date: "2025-08-30",
    priceNumeric: 86,
    type: "Một chiều",
    departureTime: "06:20",
    duration: "180",
  },
  {
    id: "3",
    airline: "Jetstar Pacific",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2020/03/Jetstar-Logo.png",
    from: "TP. Hồ Chí Minh",
    fromCode: "SGN",
    to: "Đà Nẵng",
    toCode: "DAD",
    date: "2025-08-20",
    priceNumeric: 33,
    type: "Một chiều",
    departureTime: "11:30",
    duration: "75",
  },
  {
    id: "4",
    airline: "Bamboo Airways",
    airlineLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Bamboo_Airways_logo.svg/1024px-Bamboo_Airways_logo.svg.png",
    from: "Đà Nẵng",
    fromCode: "DAD",
    to: "Seoul",
    toCode: "ICN",
    date: "2025-09-05",
    priceNumeric: 196,
    type: "Một chiều",
    departureTime: "09:45",
    duration: "240",
  },
  {
    id: "5",
    airline: "VietJet Air",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2021/02/VietJet-Air-Logo.png",
    from: "Hà Nội",
    fromCode: "HAN",
    to: "TP. Hồ Chí Minh",
    toCode: "SGN",
    date: "2025-08-25",
    priceNumeric: 48,
    type: "Một chiều",
    departureTime: "07:00",
    duration: "120",
  },
  {
    id: "6",
    airline: "Bamboo Airways",
    airlineLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Bamboo_Airways_logo.svg/1200px-Bamboo_Airways_logo.svg.png",
    from: "Đà Nẵng",
    fromCode: "DAD",
    to: "Seoul",
    toCode: "ICN",
    date: "2025-08-27",
    priceNumeric: 220,
    type: "Một chiều",
    departureTime: "15:30",
    duration: "300",
  },
  {
    id: "7",
    airline: "Vietnam Airlines",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2021/02/Vietnam-Airlines-Logo.png",
    from: "TP. Hồ Chí Minh",
    fromCode: "SGN",
    to: "Tokyo",
    toCode: "NRT",
    date: "2025-08-28",
    priceNumeric: 380,
    type: "Một chiều",
    departureTime: "23:45",
    duration: "360",
  },
  {
    id: "8",
    airline: "VietJet Air",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2021/02/VietJet-Air-Logo.png",
    from: "Hà Nội",
    fromCode: "HAN",
    to: "Singapore",
    toCode: "SIN",
    date: "2025-08-29",
    priceNumeric: 165,
    type: "Một chiều",
    departureTime: "11:20",
    duration: "210",
  },
  {
    id: "9",
    airline: "Jetstar Pacific",
    airlineLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Jetstar_Airways_logo.svg/1200px-Jetstar_Airways_logo.svg.png",
    from: "Cần Thơ",
    fromCode: "VCA",
    to: "Bangkok",
    toCode: "BKK",
    date: "2025-08-30",
    priceNumeric: 95,
    type: "Một chiều",
    departureTime: "14:15",
    duration: "90",
  },
  {
    id: "10",
    airline: "Vietnam Airlines",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2021/02/Vietnam-Airlines-Logo.png",
    from: "TP. Hồ Chí Minh",
    fromCode: "SGN",
    to: "Paris",
    toCode: "CDG",
    date: "2025-08-31",
    priceNumeric: 650,
    type: "Một chiều",
    departureTime: "01:30",
    duration: "780",
  },
  {
    id: "11",
    airline: "Bamboo Airways",
    airlineLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Bamboo_Airways_logo.svg/1200px-Bamboo_Airways_logo.svg.png",
    from: "Phú Quốc",
    fromCode: "PQC",
    to: "Kuala Lumpur",
    toCode: "KUL",
    date: "2025-09-01",
    priceNumeric: 140,
    type: "Một chiều",
    departureTime: "08:45",
    duration: "150",
  },
  {
    id: "12",
    airline: "VietJet Air",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2021/02/VietJet-Air-Logo.png",
    from: "Hà Nội",
    fromCode: "HAN",
    to: "Melbourne",
    toCode: "MEL",
    date: "2025-09-02",
    priceNumeric: 420,
    type: "Một chiều",
    departureTime: "17:20",
    duration: "540",
  },
];

export function FlightSearchResults() {
  const navigate = useNavigate();
  const [selectedFlight, setSelectedFlight] = useState(null);
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [flightsPerPage] = useState(4); // Giảm xuống 4 để có nhiều trang hơn

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchCriteria, activeTab]);

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
  const handleViewFlightDetails = (flight) => navigate("/detail");

  const handleSelectFare = (flightId, fareId) => {
    setSelectedFares((prev) => ({ ...prev, [flightId]: fareId }));
  };

  const handleProceedToBooking = (flight, fareId) => {
    const selectedFare = fareOptions.find((fare) => fare.id === fareId);
    localStorage.setItem("selectedFlight", JSON.stringify(flight));
    localStorage.setItem("selectedFare", JSON.stringify(selectedFare));
    navigate("/booking-stepper");
  };

  const handleResetFilters = () => {
    setFilters({
      priceRange: [20, 1000],
      airlines: [],
      departureTime: [],
      sortBy: "price-asc",
    });
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
            <SearchForm />
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
                    ? `Chuyến bay từ ${searchCriteria.from} đến ${searchCriteria.to}`
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
                    { key: "one-way", label: "Một chiều" },
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
              {totalFlights === 0 ? (
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
                currentFlights.map((flight) => (
                  <Card
                    key={flight.id}
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
                                    {formatCurrency(fare.price / 24000)}
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
                                      )?.price / 24000
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
