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
  { key: "roundtrip", label: "Khứ hồi" },
  { key: "oneway", label: "Một chiều" },
  { key: "multicity", label: "Nhiều thành phố" },
];

const PASSENGER_TYPES = [
  { key: "adults", label: "Người lớn", sub: "12+ tuổi", min: 1 },
  { key: "children", label: "Trẻ em", sub: "2–11 tuổi", min: 0 },
  { key: "infants", label: "Em bé", sub: "< 2 tuổi", min: 0 },
];

const TRAVEL_CLASSES = [
  "Phổ thông",
  "Phổ thông cao cấp",
  "Thương gia",
  "Hạng nhất",
];

// Date Picker Component
function DatePicker({ date, onSelect, placeholder, disabled = false }) {
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
          {date ? (
            format(date, "dd/MM/yyyy")
          ) : (
            <span className="dark:text-white">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          disabled={(date) => date < new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function SearchForm({ onSearch, initialValues }) {
  const [tripType, setTripType] = useState("roundtrip");
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

  // Update form when initialValues change
  useEffect(() => {
    if (initialValues) {
      console.log("SearchForm received initialValues:", initialValues);
      console.log("initialValues.from:", initialValues.from);
      console.log("initialValues.to:", initialValues.to);

      if (initialValues.tripType) setTripType(initialValues.tripType);
      if (initialValues.passengers) setPassengers(initialValues.passengers);
      if (initialValues.travelClass) setTravelClass(initialValues.travelClass);

      // Handle departure date
      if (initialValues.departDate) {
        const departDate =
          initialValues.departDate instanceof Date
            ? initialValues.departDate
            : new Date(initialValues.departDate);
        setDepartDate(departDate);
      }

      // Handle return date
      if (initialValues.returnDate) {
        const returnDate =
          initialValues.returnDate instanceof Date
            ? initialValues.returnDate
            : new Date(initialValues.returnDate);
        setReturnDate(returnDate);
      }

      // Handle from/to locations - support multiple selections
      if (initialValues.from) {
        if (Array.isArray(initialValues.from)) {
          // Handle array of locations (multiple selections)
          const processedLocations = initialValues.from
            .map((location) => {
              if (typeof location === "string") {
                // Parse "City (CODE)" format
                const match = location.match(/^(.+)\s*\(([^)]+)\)$/);
                if (match) {
                  return {
                    city: match[1].trim(),
                    airportCode: match[2],
                    displayName: location,
                  };
                }
              } else if (typeof location === "object" && location.airportCode) {
                // Already in object format
                return location;
              }
              return location;
            })
            .filter((location) => location && location.airportCode); // Filter out invalid locations

          // Remove duplicates from processed locations
          const uniqueProcessedLocations = processedLocations.filter(
            (location, index, self) =>
              index ===
              self.findIndex((loc) => loc.airportCode === location.airportCode)
          );

          // Only update if the processed locations are different from current ones
          const currentFromCodes = fromLocations
            .map((loc) => loc.airportCode)
            .sort();
          const newFromCodes = uniqueProcessedLocations
            .map((loc) => loc.airportCode)
            .sort();
          const fromChanged =
            JSON.stringify(currentFromCodes) !== JSON.stringify(newFromCodes);

          if (fromChanged) {
            console.log("Updating fromLocations:", uniqueProcessedLocations);
            setFromLocations(uniqueProcessedLocations);
          }
        } else if (typeof initialValues.from === "string") {
          // Parse "City (CODE)" format
          const match = initialValues.from.match(/^(.+)\s*\(([^)]+)\)$/);
          if (match) {
            const newLocation = {
              city: match[1].trim(),
              airportCode: match[2],
              displayName: initialValues.from,
            };

            // Only update if different from current
            const currentFromCodes = fromLocations.map(
              (loc) => loc.airportCode
            );
            if (!currentFromCodes.includes(newLocation.airportCode)) {
              setFromLocations([newLocation]);
            }
          }
        } else if (
          typeof initialValues.from === "object" &&
          initialValues.from.airportCode
        ) {
          // Only update if different from current
          const currentFromCodes = fromLocations.map((loc) => loc.airportCode);
          if (!currentFromCodes.includes(initialValues.from.airportCode)) {
            setFromLocations([initialValues.from]);
          }
        }
      }

      if (initialValues.to) {
        if (Array.isArray(initialValues.to)) {
          // Handle array of locations (multiple selections)
          const processedLocations = initialValues.to
            .map((location) => {
              if (typeof location === "string") {
                // Parse "City (CODE)" format
                const match = location.match(/^(.+)\s*\(([^)]+)\)$/);
                if (match) {
                  return {
                    city: match[1].trim(),
                    airportCode: match[2],
                    displayName: location,
                  };
                }
              } else if (typeof location === "object" && location.airportCode) {
                // Already in object format
                return location;
              }
              return location;
            })
            .filter((location) => location && location.airportCode); // Filter out invalid locations

          // Remove duplicates from processed locations
          const uniqueProcessedLocations = processedLocations.filter(
            (location, index, self) =>
              index ===
              self.findIndex((loc) => loc.airportCode === location.airportCode)
          );

          // Only update if the processed locations are different from current ones
          const currentToCodes = toLocations
            .map((loc) => loc.airportCode)
            .sort();
          const newToCodes = uniqueProcessedLocations
            .map((loc) => loc.airportCode)
            .sort();
          const toChanged =
            JSON.stringify(currentToCodes) !== JSON.stringify(newToCodes);

          if (toChanged) {
            console.log("Updating toLocations:", uniqueProcessedLocations);
            setToLocations(uniqueProcessedLocations);
          }
        } else if (typeof initialValues.to === "string") {
          // Parse "City (CODE)" format
          const match = initialValues.to.match(/^(.+)\s*\(([^)]+)\)$/);
          if (match) {
            const newLocation = {
              city: match[1].trim(),
              airportCode: match[2],
              displayName: initialValues.to,
            };

            // Only update if different from current
            const currentToCodes = toLocations.map((loc) => loc.airportCode);
            if (!currentToCodes.includes(newLocation.airportCode)) {
              setToLocations([newLocation]);
            }
          }
        } else if (
          typeof initialValues.to === "object" &&
          initialValues.to.airportCode
        ) {
          // Only update if different from current
          const currentToCodes = toLocations.map((loc) => loc.airportCode);
          if (!currentToCodes.includes(initialValues.to.airportCode)) {
            setToLocations([initialValues.to]);
          }
        }
      }
    }
  }, [initialValues]);

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

  const handleReset = () => {
    setTripType("roundtrip");
    setFromLocations([]);
    setToLocations([]);
    setDepartDate(undefined);
    setReturnDate(undefined);
    setMultiTrips([
      { from: [], to: [], date: null },
      { from: [], to: [], date: null },
    ]);
    setPassengers({
      adults: 1,
      children: 0,
      infants: 0,
    });
    setTravelClass("Phổ thông");

    // Optional: Show a brief success message
    console.log("Form reset successfully");
  };

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
      tripType !== "roundtrip"
    );
  };

  const handleSearch = () => {
    // Clear previous errors
    setValidationErrors([]);

    if (onSearch) {
      // Support multiple from/to locations - create all combinations
      const fromLocs =
        Array.isArray(fromLocations) && fromLocations.length > 0
          ? fromLocations
          : [];
      const toLocs =
        Array.isArray(toLocations) && toLocations.length > 0 ? toLocations : [];

      // Create all combinations of from-to pairs (only if we have both from and to)
      const searchCombinations = [];
      if (fromLocs.length > 0 && toLocs.length > 0) {
        fromLocs.forEach((fromLoc) => {
          toLocs.forEach((toLoc) => {
            // Skip if from and to are the same airport
            if (fromLoc.airportCode !== toLoc.airportCode) {
              searchCombinations.push({
                from: fromLoc,
                to: toLoc,
                departDate,
                returnDate,
              });
            }
          });
        });
      }

      const criteria = {
        tripType,
        from: fromLocs.length === 1 ? fromLocs[0] : fromLocs, // Keep backward compatibility
        to: toLocs.length === 1 ? toLocs[0] : toLocs, // Keep backward compatibility
        departDate,
        returnDate,
        passengers,
        travelClass,
        multiTrips: tripType === "multicity" ? multiTrips : null,
        searchCombinations, // All from-to combinations
      };

      console.log("Search criteria:", criteria);
      onSearch(criteria);
    }
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm dark:bg-gray-400/100 p-6 max-w-5xl mx-auto">
      <div className="space-y-6">
        {/* Validation Errors - Hidden since we removed validation */}
        {/* {validationErrors.length > 0 && (
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
        )} */}

        {/* Tabs + Passenger Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center flex-wrap gap-1">
            {TRIP_TYPES.map((tab) => (
              <div
                key={tab.key}
                onClick={() => setTripType(tab.key)}
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
        {tripType === "roundtrip" && (
          <div className="grid md:grid-cols-5 gap-4">
            <AirportAutocomplete
              placeholder="Từ đâu?"
              value={fromLocations}
              onChange={setFromLocations}
              // country="Vietnam"
            />
            <AirportAutocomplete
              placeholder="Đến đâu?"
              value={toLocations}
              onChange={setToLocations}
            />
            <DatePicker
              date={departDate}
              onSelect={setDepartDate}
              placeholder="Ngày đi"
            />
            <DatePicker
              date={returnDate}
              onSelect={setReturnDate}
              placeholder="Ngày về"
            />
            <Button
              className="bg-blue-500 text-white hover:bg-blue-600"
              onClick={handleSearch}
            >
              Tìm chuyến bay
            </Button>
          </div>
        )}

        {/* One Way Form */}
        {tripType === "oneway" && (
          <div className="grid md:grid-cols-4 gap-4">
            <AirportAutocomplete
              placeholder="Từ đâu?"
              value={fromLocations}
              onChange={setFromLocations}
              country="Vietnam"
            />
            <AirportAutocomplete
              placeholder="Đến đâu?"
              value={toLocations}
              onChange={setToLocations}
            />
            <DatePicker
              date={departDate}
              onSelect={setDepartDate}
              placeholder="Ngày đi"
            />
            <Button
              className="bg-blue-500 text-white hover:bg-blue-600"
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

        {/* Multi-city Form */}
        {tripType === "multicity" && (
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
                className="bg-blue-500 text-white hover:bg-blue-600 w-full sm:w-auto sm:ml-auto"
                onClick={handleSearch}
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
