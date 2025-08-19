"use client";

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
import { X, CalendarIcon, MapPin, Plane, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";

// Reduced popular destinations data
const POPULAR_DESTINATIONS = [
  {
    code: "HAN",
    city: "Hà Nội",
    country: "Việt Nam",
    airport: "Sân bay Quốc tế Nội Bài",
  },
  {
    code: "SGN",
    city: "TP. Hồ Chí Minh",
    country: "Việt Nam",
    airport: "Sân bay Tân Sơn Nhất",
  },
  {
    code: "DAD",
    city: "Đà Nẵng",
    country: "Việt Nam",
    airport: "Sân bay Quốc tế Đà Nẵng",
  },
  {
    code: "CXR",
    city: "Nha Trang",
    country: "Việt Nam",
    airport: "Sân bay Quốc tế Cam Ranh",
  },
  {
    code: "PQC",
    city: "Phú Quốc",
    country: "Việt Nam",
    airport: "Sân bay Quốc tế Phú Quốc",
  },
  {
    code: "HUI",
    city: "Huế",
    country: "Việt Nam",
    airport: "Sân bay Quốc tế Phú Bài",
  },
];

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

// Location Select Component
function LocationSelect({ placeholder, value, onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocations, setSelectedLocations] = useState(value || []);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSelectedLocations(value || []);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredDestinations = POPULAR_DESTINATIONS.filter((dest) =>
    [dest.city, dest.code, dest.airport].some((field) =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleLocationSelect = (location) => {
    const isAlreadySelected = selectedLocations.some(
      (loc) => loc.code === location.code
    );
    const newSelection = isAlreadySelected
      ? selectedLocations.filter((loc) => loc.code !== location.code)
      : [...selectedLocations, location];

    setSelectedLocations(newSelection);
    onChange(newSelection);
    setSearchTerm("");
  };

  const handleRemoveLocation = (codeToRemove) => {
    const newSelection = selectedLocations.filter(
      (loc) => loc.code !== codeToRemove
    );
    setSelectedLocations(newSelection);
    onChange(newSelection);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      e.preventDefault();
      const customLocation = {
        code: searchTerm.toUpperCase(),
        city: searchTerm,
        country: "Tùy chỉnh",
        airport: searchTerm,
      };
      handleLocationSelect(customLocation);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`min-h-[40px] w-full border border-gray-300 rounded-md px-3 py-2 bg-white cursor-text ${
          disabled ? "bg-gray-50 cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedLocations.map((location) => (
            <span
              key={location.code}
              className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
            >
              <MapPin className="w-3 h-3 mr-1" />
              {location.city} ({location.code})
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveLocation(location.code);
                }}
                className="ml-1 hover:bg-blue-200 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={selectedLocations.length === 0 ? placeholder : ""}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          className="w-full border-none outline-none bg-transparent text-sm"
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {searchTerm === "" && (
            <div className="p-3 border-b bg-gray-50">
              <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                <Plane className="w-4 h-4 mr-2" />
                Điểm đến phổ biến
              </h4>
            </div>
          )}

          {filteredDestinations.length > 0 ? (
            filteredDestinations.map((destination) => {
              const isSelected = selectedLocations.some(
                (loc) => loc.code === destination.code
              );
              return (
                <div
                  key={destination.code}
                  onClick={() => handleLocationSelect(destination)}
                  className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                    isSelected ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-3 mt-0.5 text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {destination.city} ({destination.code})
                      </div>
                      <div className="text-xs text-gray-500">
                        {destination.airport}, {destination.country}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="text-blue-500 text-xs font-medium">✓</div>
                    )}
                  </div>
                </div>
              );
            })
          ) : searchTerm ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              Nhấn Enter để thêm "{searchTerm}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Date Picker Component
function DatePicker({ date, onSelect, placeholder, disabled = false }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${
            !date && "text-muted-foreground"
          } ${disabled && "cursor-not-allowed opacity-50"}`}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy") : <span>{placeholder}</span>}
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

export function SearchForm() {
  const [tripType, setTripType] = useState("roundtrip");
  const [fromLocations, setFromLocations] = useState([]);
  const [toLocations, setToLocations] = useState([]);
  const [departDate, setDepartDate] = useState();
  const [returnDate, setReturnDate] = useState();
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

  return (
    <Card className="bg-white/95 backdrop-blur-sm p-6 max-w-5xl mx-auto">
      <div className="space-y-6">
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
              className="min-w-[220px] w-full sm:w-auto justify-between"
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
                      <div className="font-medium">{item.label}</div>
                      <div className="text-sm text-gray-500">{item.sub}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updatePassenger(item.key, passengers[item.key] - 1)
                        }
                      >
                        –
                      </Button>
                      <span className="w-6 text-center">
                        {passengers[item.key]}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updatePassenger(item.key, passengers[item.key] + 1)
                        }
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
                    className="w-full border border-gray-300 rounded-md p-2"
                  >
                    {TRAVEL_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
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
        </div>

        {/* Round Trip Form */}
        {tripType === "roundtrip" && (
          <div className="grid md:grid-cols-5 gap-4">
            <LocationSelect
              placeholder="Từ đâu?"
              value={fromLocations}
              onChange={setFromLocations}
            />
            <LocationSelect
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
            <Button className="bg-blue-500 text-white hover:bg-blue-600">
              Tìm chuyến bay
            </Button>
          </div>
        )}

        {/* One Way Form */}
        {tripType === "oneway" && (
          <div className="grid md:grid-cols-4 gap-4">
            <LocationSelect
              placeholder="Từ đâu?"
              value={fromLocations}
              onChange={setFromLocations}
            />
            <LocationSelect
              placeholder="Đến đâu?"
              value={toLocations}
              onChange={setToLocations}
            />
            <DatePicker
              date={departDate}
              onSelect={setDepartDate}
              placeholder="Ngày đi"
            />
            <Button className="bg-blue-500 text-white hover:bg-blue-600">
              Tìm chuyến bay
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
                  <LocationSelect
                    placeholder="Từ đâu?"
                    value={trip.from}
                    onChange={(value) => updateMultiTrip(index, "from", value)}
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">
                    Đến
                  </label>
                  <LocationSelect
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

              <Button className="bg-blue-500 text-white hover:bg-blue-600 w-full sm:w-auto sm:ml-auto">
                Tìm chuyến bay
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
