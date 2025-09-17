import { useState, useRef, useEffect } from "react";
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

const TRIP_TYPES = [
  { key: "ROUND_TRIP", label: "Khứ hồi" },
  { key: "ONE_WAY", label: "Một chiều" },
  { key: "MULTI_CITY", label: "Nhiều thành phố" },
];

const PASSENGER_TYPES = [
  { key: "adults", label: "Người lớn", sub: "12+ tuổi", min: 1 },
  { key: "children", label: "Trẻ em", sub: "2–11 tuổi", min: 0 },
  { key: "infants", label: "Em bé", sub: "< 2 tuổi", min: 0 },
];

const TRAVEL_CLASSES = ["Phổ thông", "Phổ thông cao cấp", "Thương gia"];

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
      <PopoverContent className="w-auto p-0 z-999" align="start">
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

export function SearchForm({ onSearch, initialValues, onTripTypeChange }) {
  const [tripType, setTripType] = useState("ROUND_TRIP");
  const [fromLocations, setFromLocations] = useState([]);
  const [toLocations, setToLocations] = useState([]);
  const [departDate, setDepartDate] = useState();
  const [returnDate, setReturnDate] = useState();
  const [validationErrors, setValidationErrors] = useState([]);
  const [multiTrips, setMultiTrips] = useState([
    { from: [], to: [], date: null },
    { from: [], to: [], date: null },
  ]);
  const [passengerPopup, setPassengerPopup] = useState(false);
  const [passengers, setPassengers] = useState({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [travelClass, setTravelClass] = useState("Phổ thông");

  // Track if trip type was changed by user (not programmatically)
  const tripTypeChangedByUser = useRef(false);

  // Handle initial values
  useEffect(() => {
    if (initialValues) {
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
      setMultiTrips(
        initialValues.multiTrips || [
          { from: [], to: [], date: null },
          { from: [], to: [], date: null },
        ]
      );
    }
  }, [initialValues]);

  // Notify parent when trip type changes (only if changed by user)
  useEffect(() => {
    if (onTripTypeChange && tripTypeChangedByUser.current) {
      onTripTypeChange(tripType);
    }
  }, [tripType, onTripTypeChange]);

  const updatePassenger = (type, value) => {
    setPassengers((prev) => ({
      ...prev,
      [type]: Math.max(type === "adults" ? 1 : 0, value),
    }));
  };

  const handleAddTrip = () =>
    setMultiTrips([...multiTrips, { from: [], to: [], date: null }]);

  const handleRemoveTrip = (i) => {
    if (multiTrips.length > 2) {
      setMultiTrips(multiTrips.filter((_, idx) => idx !== i));
    }
  };

  const updateMultiTrip = (index, field, value) => {
    const updatedTrips = [...multiTrips];
    updatedTrips[index][field] = value;
    setMultiTrips(updatedTrips);
  };

  const passengerSummary = `${passengers.adults} Người lớn${
    passengers.children > 0 ? `, ${passengers.children} Trẻ em` : ""
  }${
    passengers.infants > 0 ? `, ${passengers.infants} Em bé` : ""
  } - ${travelClass}`;

  // Check if form has any data to reset
  const hasDataToReset = () => {
    return (
      fromLocations.length > 0 ||
      toLocations.length > 0 ||
      departDate ||
      returnDate ||
      passengers.adults > 1 ||
      passengers.children > 0 ||
      passengers.infants > 0 ||
      travelClass !== "Phổ thông" ||
      tripType !== "ROUND_TRIP"
    );
  };

  // Check if form is valid for search
  const isFormValid = () => {
    if (tripType === "ROUND_TRIP") {
      return (
        fromLocations.length > 0 &&
        toLocations.length > 0 &&
        departDate &&
        returnDate &&
        returnDate > departDate
      );
    } else if (tripType === "ONE_WAY") {
      return fromLocations.length > 0 && toLocations.length > 0 && departDate;
    } else if (tripType === "MULTI_CITY") {
      if (!multiTrips || multiTrips.length < 2) return false;

      return multiTrips.every((trip) => {
        const hasFrom = trip.from && trip.from.length > 0;
        const hasTo = trip.to && trip.to.length > 0;
        const hasDate = trip.date;
        const notSameAirport = !(
          trip.from &&
          trip.to &&
          trip.from.some((fromLoc) =>
            trip.to.some((toLoc) => fromLoc.airportCode === toLoc.airportCode)
          )
        );

        return hasFrom && hasTo && hasDate && notSameAirport;
      });
    }
    return false;
  };

  // Handle search submission
  const handleSearch = () => {
    if (!isFormValid()) {
      return;
    }

    let searchData = {
      tripType,
      passengers,
      travelClass,
    };

    if (tripType === "ROUND_TRIP") {
      searchData = {
        ...searchData,
        fromLocations: fromLocations, // Send all selected locations
        toLocations: toLocations, // Send all selected locations
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
        fromLocations: fromLocations, // Send all selected locations
        toLocations: toLocations, // Send all selected locations
        departDate:
          departDate &&
          departDate instanceof Date &&
          !isNaN(departDate.getTime())
            ? departDate
            : null,
      };
    } else if (tripType === "MULTI_CITY") {
      searchData = {
        ...searchData,
        multiTrips,
      };
    }

    console.log("Submitting search data:", searchData);
    if (onSearch) {
      onSearch(searchData);
    }
  };

  const handleReset = () => {
    setTripType("ROUND_TRIP");
    setFromLocations([]);
    setToLocations([]);
    setDepartDate();
    setReturnDate();
    setValidationErrors([]);
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm dark:bg-gray-400/100 p-6 max-w-6xl mx-auto">
      <div className="space-y-6">
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
              onClick={() => setPassengerPopup(!passengerPopup)}
              className="min-w-[220px] w-full sm:w-auto justify-between dark:bg-gray-800"
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
              <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-full sm:w-72 min-w-[280px] z-50 left-0 sm:left-auto right-0 sm:right-auto">
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
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Class Selection */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hạng
                  </label>
                  <select
                    value={travelClass}
                    onChange={(e) => setTravelClass(e.target.value)}
                    className="w-full border border-gray-300 dark:text-gray-500 rounded-md p-2"
                  >
                    {TRAVEL_CLASSES.map((cls) => (
                      <option
                        key={cls}
                        value={cls}
                        className="dark:text-gray-500"
                      >
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  className="w-full mt-4 bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() => setPassengerPopup(false)}
                >
                  Xong
                </Button>
              </div>
            )}
          </div>

          {/* Reset Button */}
          {hasDataToReset() && (
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
          <div className="grid md:grid-cols-5 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ sân bay
              </label>
              <AirportAutocomplete
                placeholder="Chọn sân bay đi"
                value={fromLocations}
                onChange={setFromLocations}
                multiple={true}
              />
              {fromLocations.length > 1 && (
                <div className="text-xs text-blue-600 mt-1">
                  Đã chọn {fromLocations.length} sân bay đi
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến sân bay
              </label>
              <AirportAutocomplete
                placeholder="Chọn sân bay đến"
                value={toLocations}
                onChange={setToLocations}
                multiple={true}
              />
              {toLocations.length > 1 && (
                <div className="text-xs text-blue-600 mt-1">
                  Đã chọn {toLocations.length} sân bay đến
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày đi
              </label>
              <DatePicker
                date={departDate}
                onSelect={setDepartDate}
                placeholder="Chọn ngày đi"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày về
              </label>
              <DatePicker
                date={returnDate}
                onSelect={setReturnDate}
                placeholder="Chọn ngày về"
              />
            </div>

            <Button
              className="bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-6 dark:bg-blue-50 dark:text-gray-800 dark:hover:bg-blue-100"
              disabled={!isFormValid()}
              onClick={handleSearch}
            >
              {fromLocations.length > 1 || toLocations.length > 1
                ? `Tìm chuyến bay (${
                    fromLocations.length * toLocations.length
                  } kết hợp)`
                : "Tìm chuyến bay"}
            </Button>
          </div>
        )}

        {/* One Way Form */}
        {tripType === "ONE_WAY" && (
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ sân bay
              </label>
              <AirportAutocomplete
                placeholder="Chọn sân bay đi"
                value={fromLocations}
                onChange={setFromLocations}
                multiple={true}
              />
              {fromLocations.length > 1 && (
                <div className="text-xs text-blue-600 mt-1">
                  Đã chọn {fromLocations.length} sân bay đi
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến sân bay
              </label>
              <AirportAutocomplete
                placeholder="Chọn sân bay đến "
                value={toLocations}
                onChange={setToLocations}
                multiple={true}
              />
              {toLocations.length > 1 && (
                <div className="text-xs text-blue-600 mt-1">
                  Đã chọn {toLocations.length} sân bay đến
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày đi
              </label>
              <DatePicker
                date={departDate}
                onSelect={setDepartDate}
                placeholder="Chọn ngày đi"
              />
            </div>

            <Button
              className="bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-6 dark:bg-blue-50 dark:text-gray-800 dark:hover:bg-blue-100"
              onClick={handleSearch}
              disabled={!isFormValid()}
            >
              {fromLocations.length > 1 || toLocations.length > 1
                ? `Tìm chuyến bay (${
                    fromLocations.length * toLocations.length
                  } kết hợp)`
                : "Tìm chuyến bay"}
            </Button>
          </div>
        )}

        {/* Multi-city Form */}
        {tripType === "MULTI_CITY" && (
          <div className="space-y-4">
            {multiTrips.map((trip, index) => (
              <div
                key={index}
                className="space-y-3 sm:space-y-0 sm:flex sm:gap-4 sm:items-center p-3 sm:p-0 border sm:border-0 rounded-lg sm:rounded-none bg-gray-50 sm:bg-transparent"
              >
                <div className="flex items-center justify-between sm:hidden mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Chuyến bay {index + 1}
                  </span>
                  {multiTrips.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTrip(index)}
                      className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">
                    Từ
                  </label>
                  <AirportAutocomplete
                    placeholder="Từ đâu?"
                    value={trip.from}
                    onChange={(value) => updateMultiTrip(index, "from", value)}
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">
                    Đến
                  </label>
                  <AirportAutocomplete
                    placeholder="Đến đâu?"
                    value={trip.to}
                    onChange={(value) => updateMultiTrip(index, "to", value)}
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">
                    Ngày đi
                  </label>
                  <DatePicker
                    date={trip.date}
                    onSelect={(value) => updateMultiTrip(index, "date", value)}
                    placeholder="Ngày đi"
                  />
                </div>

                {multiTrips.length > 2 && (
                  <div className="hidden sm:block">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTrip(index)}
                      className="text-red-500 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
              <Button
                variant="outline"
                onClick={handleAddTrip}
                className="text-blue-500 hover:text-blue-600 border-blue-200 hover:bg-blue-50 w-full sm:w-auto"
              >
                + Thêm chuyến bay
              </Button>

              <Button
                className="bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto sm:ml-auto dark:bg-blue-50 dark:text-gray-800 dark:hover:bg-blue-100"
                onClick={handleSearch}
                disabled={!isFormValid()}
              >
                {fromLocations.length > 1 || toLocations.length > 1
                  ? `Tìm chuyến bay (${
                      fromLocations.length * toLocations.length
                    } kết hợp)`
                  : "Tìm chuyến bay"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
