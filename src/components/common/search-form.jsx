import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  CalendarIcon,
  MapPin,
  Plane,
  ArrowRightLeft,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import AirportAutocomplete from "./airport-autocomplete";
import { classesApi } from "@/apis/classes-api";

const TRIP_TYPES = [
  { key: "ROUND_TRIP", label: "Khứ hồi" },
  { key: "ONE_WAY", label: "Một chiều" },
  // { key: "MULTI_CITY", label: "Đa thành phố" },
];

const PASSENGER_TYPES = [
  { key: "adults", label: "Người lớn", sub: "12+ tuổi", min: 1 },
  { key: "children", label: "Trẻ em", sub: "2–11 tuổi", min: 0 },
  { key: "infants", label: "Em bé", sub: "< 2 tuổi", min: 0 },
];

// Date Picker Component
function DatePicker({ date, onSelect, placeholder, disabled = false }) {
  const handleDateSelect = (selectedDate) => {
    // Additional validation to prevent invalid dates
    if (
      selectedDate &&
      selectedDate instanceof Date &&
      !isNaN(selectedDate.getTime())
    ) {
      // Ensure the date is not in the past (with some buffer for timezone issues)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate >= today) {
        if (onSelect) {
          onSelect(selectedDate);
        }
      }
    }
  };

  return (
    <Popover className="">
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal dark:bg-gray-800 ${
            !date && "text-muted-foreground"
          } ${disabled && "cursor-not-allowed opacity-50"}`}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 dark:text-white" />
          {date && date instanceof Date && !isNaN(date.getTime()) ? (
            format(date, "dd/MM/yyyy")
          ) : (
            <span className="dark:text-white">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[10000000]" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date < today;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function SearchForm({
  onSearch,
  initialValues,
  onTripTypeChange,
  onSearchStart,
}) {
  const [tripType, setTripType] = useState("ROUND_TRIP");
  const [fromLocations, setFromLocationsInternal] = useState([]);
  const [toLocations, setToLocationsInternal] = useState([]);

  const setFromLocations = (value) => {
    setFromLocationsInternal(value);
  };

  const setToLocations = (value) => {
    setToLocationsInternal(value);
  };
  const [departDate, setDepartDate] = useState();
  const [returnDate, setReturnDate] = useState();
  const [validationErrors, setValidationErrors] = useState([]);

  const [passengerPopup, setPassengerPopup] = useState(false);
  const [fromAirportOpen, setFromAirportOpen] = useState(false);
  const [toAirportOpen, setToAirportOpen] = useState(false);
  const [passengers, setPassengers] = useState({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [travelClass, setTravelClass] = useState("Phổ thông");
  const [travelClasses, setTravelClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [swapKey, setSwapKey] = useState(0);

  // Track if trip type was changed by user (not programmatically)
  const tripTypeChangedByUser = useRef(false);

  // Track if initial values have been loaded
  const initialValuesLoaded = useRef(false);

  // Modal management functions
  const closeAllModals = () => {
    setPassengerPopup(false);
    setFromAirportOpen(false);
    setToAirportOpen(false);
  };

  const handlePassengerPopupToggle = () => {
    if (passengerPopup) {
      // If currently open, just close it
      setPassengerPopup(false);
    } else {
      // If closed, close all others first, then open passenger popup
      closeAllModals();
      setPassengerPopup(true);
    }
  };

  const handleFromAirportOpenChange = (open) => {
    setFromAirportOpen(open);
    if (open) {
      // Close other modals when opening from airport
      setPassengerPopup(false);
      setToAirportOpen(false);
    }
  };

  const handleToAirportOpenChange = (open) => {
    setToAirportOpen(open);
    if (open) {
      // Close other modals when opening to airport
      setPassengerPopup(false);
      setFromAirportOpen(false);
    }
  };

  // Handle initial values
  useEffect(() => {
    if (initialValues && !initialValuesLoaded.current) {
      initialValuesLoaded.current = true;
      tripTypeChangedByUser.current = false; // Reset flag when initialValues change
      setTripType(initialValues.tripType || "ROUND_TRIP");

      // Handle both array format (fromLocations/toLocations) and single format (from/to)
      setFromLocations(
        initialValues.fromLocations ||
          (initialValues.from ? [initialValues.from] : [])
      );
      setToLocations(
        initialValues.toLocations ||
          (initialValues.to ? [initialValues.to] : [])
      );

      setDepartDate(initialValues.departDate || undefined);
      setReturnDate(initialValues.returnDate || undefined);
      setPassengers(
        initialValues.passengers || {
          adults: 1,
          children: 0,
          infants: 0,
        }
      );
      setTravelClass(initialValues.travelClass || "Phổ thông");
    }
  }, [initialValues]);

  // Notify parent when trip type changes (only if changed by user)
  useEffect(() => {
    if (onTripTypeChange && tripTypeChangedByUser.current) {
      onTripTypeChange(tripType);
    }
  }, [tripType, onTripTypeChange]);

  // Load travel classes from API
  useEffect(() => {
    const loadTravelClasses = async () => {
      setLoadingClasses(true);
      try {
        const response = await classesApi.getAllClasses();
        if (response.success && response.data) {
          // Extract class names from the API response
          const classes =
            response.data.content?.map((item) => item.className) || [];
          setTravelClasses(classes);
          // Set default travel class if not set and classes are loaded
          if (classes.length > 0 && !travelClass) {
            setTravelClass(classes[0]);
          }
        }
      } catch (error) {
        // Fallback to default classes if API fails
        setTravelClasses(["Phổ thông", "Phổ thông cao cấp", "Thương gia"]);
      } finally {
        setLoadingClasses(false);
      }
    };

    loadTravelClasses();
  }, []);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setSearchHistory(Array.isArray(history) ? history : []);
      } catch (error) {
        console.error("Error parsing search history:", error);
        setSearchHistory([]);
      }
    }
  }, []);

  const updatePassenger = useCallback((type, value) => {
    setPassengers((prev) => ({
      ...prev,
      [type]: Math.max(type === "adults" ? 1 : 0, value),
    }));
  }, []);

  const passengerSummary = useMemo(
    () =>
      `${passengers.adults} Người lớn${
        passengers.children > 0 ? `, ${passengers.children} Trẻ em` : ""
      }${passengers.infants > 0 ? `, ${passengers.infants} Em bé` : ""} `,
    [passengers.adults, passengers.children, passengers.infants, travelClass]
  );

  // Check if form has any data to reset
  const hasDataToReset = useMemo(() => {
    if (tripType === "ONE_WAY") {
      // For one-way trips, only show reset when from, to, and depart date are filled
      return fromLocations.length > 0 && toLocations.length > 0 && departDate;
    } else {
      // For round-trip and other types, show reset when any field has data
      return (
        fromLocations.length > 0 ||
        toLocations.length > 0 ||
        departDate ||
        returnDate ||
        passengers.adults > 1 ||
        passengers.children > 0 ||
        passengers.infants > 0 ||
        travelClass !== "Phổ thông"
      );
    }
  }, [
    fromLocations.length,
    toLocations.length,
    departDate,
    returnDate,
    passengers.adults,
    passengers.children,
    passengers.infants,
    travelClass,
    tripType,
  ]);
  const isFormValid = useMemo(() => {
    // Check if any from airport is the same as any to airport
    const hasOverlappingAirports = fromLocations.some((from) =>
      toLocations.some((to) => to.airportCode === from.airportCode)
    );

    if (tripType === "ROUND_TRIP") {
      return (
        fromLocations.length > 0 &&
        toLocations.length > 0 &&
        !hasOverlappingAirports &&
        departDate &&
        returnDate &&
        returnDate > departDate
      );
    } else if (tripType === "ONE_WAY") {
      return (
        fromLocations.length > 0 &&
        toLocations.length > 0 &&
        !hasOverlappingAirports &&
        departDate
      );
    }
    return false;
  }, [tripType, fromLocations, toLocations, departDate, returnDate]);

  // Update validation errors
  useEffect(() => {
    const errors = [];
    const hasOverlappingAirports = fromLocations.some((from) =>
      toLocations.some((to) => to.airportCode === from.airportCode)
    );

    if (hasOverlappingAirports) {
      errors.push("Sân bay đi và sân bay đến không được trùng nhau");
    }

    if (
      tripType === "ROUND_TRIP" &&
      returnDate &&
      departDate &&
      returnDate <= departDate
    ) {
      errors.push("Ngày về phải sau ngày đi");
    }

    setValidationErrors(errors);
  }, [fromLocations, toLocations, tripType, departDate, returnDate]);

  // Handle search submission
  const handleSearch = useCallback(() => {
    if (!isFormValid || isSearching) {
      return;
    }

    setIsSearching(true);
    if (onSearchStart) {
      onSearchStart();
    }

    let searchData = {
      tripType,
      passengers,
      travelClass,
    };

    if (tripType === "ROUND_TRIP") {
      searchData = {
        ...searchData,
        fromLocations: fromLocations,
        toLocations: toLocations,
        departDate:
          departDate &&
          departDate instanceof Date &&
          !isNaN(departDate.getTime())
            ? departDate
            : null,
        returnDate:
          returnDate &&
          returnDate instanceof Date &&
          !isNaN(returnDate.getTime())
            ? returnDate
            : null,
      };
    } else if (tripType === "ONE_WAY") {
      searchData = {
        ...searchData,
        fromLocations: fromLocations,
        toLocations: toLocations,
        departDate:
          departDate &&
          departDate instanceof Date &&
          !isNaN(departDate.getTime())
            ? departDate
            : null,
      };
    }

    localStorage.setItem("searchData", JSON.stringify(searchData));

    // Save to search history
    const historyItem = {
      fromLocations: fromLocations,
      toLocations: toLocations,
      timestamp: new Date().toISOString(),
      id: Date.now().toString(),
    };

    setSearchHistory((prev) => {
      const newHistory = [
        historyItem,
        ...prev.filter(
          (item) =>
            !(
              JSON.stringify(item.fromLocations) ===
                JSON.stringify(historyItem.fromLocations) &&
              JSON.stringify(item.toLocations) ===
                JSON.stringify(historyItem.toLocations)
            )
        ),
      ].slice(0, 5); // Keep only 5 recent searches
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
      return newHistory;
    });

    if (onSearch) {
      onSearch(searchData);
    }

    // Reset searching state after search is initiated
    // Keep disabled for a short time to show loading state
    setTimeout(() => setIsSearching(false), 500);
  }, [
    isFormValid,
    isSearching,
    tripType,
    passengers,
    travelClass,
    fromLocations,
    toLocations,
    departDate,
    returnDate,
    onSearch,
  ]);

  const handleReset = useCallback(() => {
    setTripType("ROUND_TRIP");
    setFromLocations([]);
    setToLocations([]);
    setDepartDate();
    setReturnDate();
    setValidationErrors([]);
    setIsSearching(false);
    closeAllModals();
  }, []);

  const handleSwapAirports = useCallback(() => {
    // Only allow swap when both fields have exactly 1 airport
    if (fromLocations.length === 1 && toLocations.length === 1) {
      const tempFrom = [...fromLocations];
      const tempTo = [...toLocations];
      setFromLocations(tempTo);
      setToLocations(tempFrom);
      setSwapKey((k) => k + 1);
    }
  }, [fromLocations, toLocations]);

  const handleHistorySelect = useCallback((historyItem) => {
    setFromLocations(historyItem.fromLocations || []);
    setToLocations(historyItem.toLocations || []);
    closeAllModals();
  }, []);

  const handleRemoveHistory = useCallback((historyId) => {
    setSearchHistory((prev) => {
      const newHistory = prev.filter((item) => item.id !== historyId);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  return (
    <Card className="bg-white/95 backdrop-blur-sm dark:bg-gray-400/100 p-6 mt-4  max-w-6xl mx-auto">
      <div className="space-y-4">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
                  Vui lòng kiểm tra lại thông tin
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul role="list" className="list-disc pl-5 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs + Passenger Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center flex-wrap gap-1">
            {TRIP_TYPES.map((tab) => (
              <div
                key={tab.key}
                onClick={() => {
                  if (isSearching) return;
                  tripTypeChangedByUser.current = true;
                  setTripType(tab.key);
                }}
                className={`px-3 sm:px-4 py-2 cursor-pointer transition-colors text-sm sm:text-base rounded-md ${
                  tripType === tab.key
                    ? "bg-blue-500 text-white"
                    : "hover:bg-blue-100 text-gray-700"
                }`}
              >
                {tab.label}
              </div>
            ))}
          </div>

          {/* Passenger Button */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={handlePassengerPopupToggle}
              className="min-w-[220px] w-full sm:w-auto justify-between dark:bg-gray-800"
              disabled={isSearching}
            >
              {passengerSummary}
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 10l5 5 5-5"
                />
              </svg>
            </Button>

            {passengerPopup && (
              <div className="absolute top-full mt-2 bg-white dark:bg-gray-800 dark:text-gray-200 border border-gray-200 rounded-lg shadow-lg p-4 w-full sm:w-72 min-w-[280px] z-[99999999] left-0 sm:left-auto right-0 sm:right-auto">
                {PASSENGER_TYPES.map((item) => (
                  <div
                    key={item.key}
                    className="flex justify-between items-center py-2"
                  >
                    <div>
                      <div className="font-medium dark:text-gray-500">
                        {item.label}
                      </div>
                      <div className="text-sm text-gray-500">{item.sub}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updatePassenger(item.key, passengers[item.key] - 1)
                        }
                        className="dark:text-gray-500 dark:border-gray-600"
                        disabled={isSearching}
                      >
                        –
                      </Button>
                      <span className="w-6 text-center dark:text-gray-500 dark:border-gray-600">
                        {passengers[item.key]}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updatePassenger(item.key, passengers[item.key] + 1)
                        }
                        className="dark:text-gray-500 dark:border-gray-600"
                        disabled={isSearching}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Class Selection - Hidden but logic preserved */}
                {/* <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hạng
                  </label>
                  <Select
                    value={travelClass}
                    onValueChange={setTravelClass}
                    disabled={loadingClasses}
                  >
                    <SelectTrigger className="w-full dark:bg-gray-800 dark:text-white">
                      <SelectValue
                        placeholder={
                          loadingClasses ? "Đang tải..." : "Chọn hạng vé"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {travelClasses.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div> */}

                <Button
                  className="w-full mt-4 bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() => setPassengerPopup(false)}
                  disabled={isSearching}
                >
                  Xong
                </Button>
              </div>
            )}
          </div>

          {/* Reset Button */}
          {hasDataToReset && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-300 hover:border-red-300 transition-all duration-200 transform hover:scale-105"
                title="Làm mới tất cả các trường tìm kiếm"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Làm mới
              </Button>
            </div>
          )}
        </div>

        {/* Round Trip Form */}
        {tripType === "ROUND_TRIP" && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {/* Desktop layout: all fields in one row */}
            <div className="hidden md:flex md:col-span-5 gap-4 items-end justify-center" >
              {/* From Airport */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ sân bay
                </label>
                <AirportAutocomplete
                  key={`from-desktop-rt-${swapKey}`}
                  placeholder="Chọn sân bay đi"
                  value={fromLocations}
                  onChange={setFromLocations}
                  multiple={true}
                  open={fromAirportOpen}
                  onOpenChange={handleFromAirportOpenChange}
                  disabled={isSearching}
                />
                {fromLocations.length > 1 && (
                  <div className="text-xs text-blue-600 mt-1">
                    Đã chọn {fromLocations.length} sân bay đi
                  </div>
                )}
              </div>

              {/* Swap Button - Desktop inline */}
              <div className="flex items-center justify-center px-1 h-full pt-4">
                <div className="relative flex items-center">
                  {/* Swap button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSwapAirports}
                    disabled={
                      isSearching ||
                      fromLocations.length !== 1 ||
                      toLocations.length !== 1
                    }
                    className="h-7 w-7 p-0 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed rounded-full mx-1"
                    title="Trao đổi sân bay đi và đến (chỉ khi mỗi trường có 1 sân bay)"
                  >
                    <ArrowRightLeft className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                  </Button>
                </div>
              </div>

              {/* To Airport */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến sân bay
                </label>
                <AirportAutocomplete
                  key={`to-desktop-rt-${swapKey}`}
                  placeholder="Chọn sân bay đến"
                  value={toLocations}
                  onChange={setToLocations}
                  multiple={true}
                  open={toAirportOpen}
                  onOpenChange={handleToAirportOpenChange}
                  disabled={isSearching}
                />
                {toLocations.length > 1 && (
                  <div className="text-xs text-blue-600 mt-1">
                    Đã chọn {toLocations.length} sân bay đến
                  </div>
                )}
              </div>

              {/* Depart Date */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày đi
                </label>
                <DatePicker
                  date={departDate}
                  onSelect={setDepartDate}
                  placeholder="Chọn ngày đi"
                  disabled={isSearching}
                />
              </div>

              {/* Return Date */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày về
                </label>
                <DatePicker
                  date={returnDate}
                  onSelect={setReturnDate}
                  placeholder="Chọn ngày về"
                  disabled={isSearching}
                />
              </div>
            </div>

            {/* Mobile layout: stacked with swap button between airport fields */}
            <div className="md:hidden space-y-4">
              {/* From Airport */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ sân bay
                </label>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <AirportAutocomplete
                      key={`from-mobile-rt-${swapKey}`}
                      placeholder="Chọn sân bay đi"
                      value={fromLocations}
                      onChange={setFromLocations}
                      multiple={true}
                      open={fromAirportOpen}
                      onOpenChange={handleFromAirportOpenChange}
                      disabled={isSearching}
                    />
                    {fromLocations.length > 1 && (
                      <div className="text-xs text-blue-600 mt-1">
                        Đã chọn {fromLocations.length} sân bay đi
                      </div>
                    )}
                  </div>

                  {/* Swap Button - positioned between fields */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSwapAirports}
                    disabled={
                      isSearching ||
                      fromLocations.length !== 1 ||
                      toLocations.length !== 1
                    }
                    className={`h-8 w-8 p-0 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed rounded-full border-2 ${
                      fromLocations.length === 1 &&
                      toLocations.length === 1 &&
                      !isSearching
                        ? "border-blue-500"
                        : "border-gray-200 dark:border-gray-600"
                    }`}
                    title="Trao đổi sân bay đi và đến (chỉ khi mỗi trường có 1 sân bay)"
                  >
                    <ArrowRightLeft className="h-4 w-4 text-gray-600 dark:text-gray-400 rotate-90" />
                  </Button>
                </div>
              </div>

              {/* To Airport */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến sân bay
                </label>
                <AirportAutocomplete
                  key={`to-mobile-rt-${swapKey}`}
                  placeholder="Chọn sân bay đến"
                  value={toLocations}
                  onChange={setToLocations}
                  multiple={true}
                  open={toAirportOpen}
                  onOpenChange={handleToAirportOpenChange}
                  disabled={isSearching}
                />
                {toLocations.length > 1 && (
                  <div className="text-xs text-blue-600 mt-1">
                    Đã chọn {toLocations.length} sân bay đến
                  </div>
                )}
              </div>

              {/* Date fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày đi
                  </label>
                  <DatePicker
                    date={departDate}
                    onSelect={setDepartDate}
                    placeholder="Chọn ngày đi"
                    disabled={isSearching}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày về
                  </label>
                  <DatePicker
                    date={returnDate}
                    onSelect={setReturnDate}
                    placeholder="Chọn ngày về"
                    disabled={isSearching}
                  />
                </div>
              </div>
            </div>

            <Button
              className="bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-6 dark:bg-blue-50 dark:text-gray-800 dark:hover:bg-blue-100"
              disabled={!isFormValid || isSearching}
              onClick={handleSearch}
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tìm kiếm...
                </>
              ) : fromLocations.length > 1 || toLocations.length > 1 ? (
                `Tìm chuyến bay (${
                  fromLocations.length * toLocations.length
                } kết hợp)`
              ) : (
                "Tìm chuyến bay"
              )}
            </Button>
          </div>
        )}

        {/* One Way Form */}
        {tripType === "ONE_WAY" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Desktop layout: airport fields and date in one row */}
            <div className="hidden md:flex md:col-span-3 gap-4 items-end">
              {/* From Airport */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ sân bay
                </label>
                <AirportAutocomplete
                  key={`from-desktop-ow-${swapKey}`}
                  placeholder="Chọn sân bay đi"
                  value={fromLocations}
                  onChange={setFromLocations}
                  multiple={true}
                  open={fromAirportOpen}
                  onOpenChange={handleFromAirportOpenChange}
                  disabled={isSearching}
                />
                {fromLocations.length > 1 && (
                  <div className="text-xs text-blue-600 mt-1">
                    Đã chọn {fromLocations.length} sân bay đi
                  </div>
                )}
              </div>

              {/* Swap Button - Desktop inline */}
              <div className="flex items-center justify-center px-1 pt-6 h-full">
                <div className="relative flex items-center">
                  {/* Swap button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSwapAirports}
                    disabled={
                      isSearching ||
                      fromLocations.length !== 1 ||
                      toLocations.length !== 1
                    }
                    className="h-7 w-7 p-0 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed rounded-full mx-1"
                    title="Trao đổi sân bay đi và đến (chỉ khi mỗi trường có 1 sân bay)"
                  >
                    <ArrowRightLeft className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                  </Button>
                </div>
              </div>

              {/* To Airport */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến sân bay
                </label>
                <AirportAutocomplete
                  key={`to-desktop-ow-${swapKey}`}
                  placeholder="Chọn sân bay đến "
                  value={toLocations}
                  onChange={setToLocations}
                  multiple={true}
                  open={toAirportOpen}
                  onOpenChange={handleToAirportOpenChange}
                  disabled={isSearching}
                />
                {toLocations.length > 1 && (
                  <div className="text-xs text-blue-600 mt-1">
                    Đã chọn {toLocations.length} sân bay đến
                  </div>
                )}
              </div>

              {/* Depart Date */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày đi
                </label>
                <DatePicker
                  date={departDate}
                  onSelect={setDepartDate}
                  placeholder="Chọn ngày đi"
                  disabled={isSearching}
                />
              </div>
            </div>

            {/* Mobile layout: stacked with swap button between airport fields */}
            <div className="md:hidden space-y-4">
              {/* From Airport */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ sân bay
                </label>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <AirportAutocomplete
                      key={`from-mobile-ow-${swapKey}`}
                      placeholder="Chọn sân bay đi"
                      value={fromLocations}
                      onChange={setFromLocations}
                      multiple={true}
                      open={fromAirportOpen}
                      onOpenChange={handleFromAirportOpenChange}
                      disabled={isSearching}
                    />
                    {fromLocations.length > 1 && (
                      <div className="text-xs text-blue-600 mt-1">
                        Đã chọn {fromLocations.length} sân bay đi
                      </div>
                    )}
                  </div>

                  {/* Swap Button - positioned between fields */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSwapAirports}
                    disabled={
                      isSearching ||
                      fromLocations.length !== 1 ||
                      toLocations.length !== 1
                    }
                    className={`h-8 w-8 p-0 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed rounded-full border-2 ${
                      fromLocations.length === 1 &&
                      toLocations.length === 1 &&
                      !isSearching
                        ? "border-blue-500"
                        : "border-gray-200 dark:border-gray-600"
                    }`}
                    title="Trao đổi sân bay đi và đến (chỉ khi mỗi trường có 1 sân bay)"
                  >
                    <ArrowRightLeft className="h-4 w-4 text-gray-600 dark:text-gray-400 rotate-90" />
                  </Button>
                </div>
              </div>

              {/* To Airport */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến sân bay
                </label>
                <AirportAutocomplete
                  key={`to-mobile-ow-${swapKey}`}
                  placeholder="Chọn sân bay đến "
                  value={toLocations}
                  onChange={setToLocations}
                  multiple={true}
                  open={toAirportOpen}
                  onOpenChange={handleToAirportOpenChange}
                  disabled={isSearching}
                />
                {toLocations.length > 1 && (
                  <div className="text-xs text-blue-600 mt-1">
                    Đã chọn {toLocations.length} sân bay đến
                  </div>
                )}
              </div>

              {/* Date field */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày đi
                </label>
                <DatePicker
                  date={departDate}
                  onSelect={setDepartDate}
                  placeholder="Chọn ngày đi"
                  disabled={isSearching}
                />
              </div>
            </div>

            <Button
              className="bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-6 dark:bg-blue-50 dark:text-gray-800 dark:hover:bg-blue-100"
              onClick={handleSearch}
              disabled={!isFormValid || isSearching}
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tìm kiếm...
                </>
              ) : fromLocations.length > 1 || toLocations.length > 1 ? (
                `Tìm chuyến bay (${
                  fromLocations.length * toLocations.length
                } kết hợp)`
              ) : (
                "Tìm chuyến bay"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tìm kiếm gần đây
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleHistorySelect(item)}
              >
                <span className="text-sm font-medium">
                  {item.fromLocations?.[0]?.cityNames?.[0] ||
                    item.fromLocations?.[0]?.airportName}{" "}
                  ({item.fromLocations?.[0]?.airportCode}) -{" "}
                  {item.toLocations?.[0]?.cityNames?.[0] ||
                    item.toLocations?.[0]?.airportName}{" "}
                  ({item.toLocations?.[0]?.airportCode})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveHistory(item.id);
                  }}
                  className="text-gray-400 hover:text-red-500 p-1 h-5 w-5"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
