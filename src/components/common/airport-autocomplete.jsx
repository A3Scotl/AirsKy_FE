import { useState, useRef, useEffect } from "react";
import { MapPin, Plane, X, Loader2, Navigation } from "lucide-react";
import { useAirportSearch } from "@/hooks/use-airport-search";

const AirportAutocomplete = ({
  placeholder = "Chọn sân bay",
  value = [],
  onChange,
  disabled = false,
  multiple = true,
  country = null,
  className = "",
  showNearby = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocations, setSelectedLocations] = useState(value || []);
  const [showingNearby, setShowingNearby] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const {
    searchResults,
    allAirports,
    isLoading,
    error,
    searchAirports,
    getNearbyAirports,
  } = useAirportSearch({
    country,
    maxResults: 10,
    debounceMs: 300,
  });

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

  // Debounced search
  useEffect(() => {
    if (searchTerm.length >= 2) {
      setShowingNearby(false); // Reset nearby state khi search
      searchAirports(searchTerm);
    }
  }, [searchTerm, searchAirports]);

  // Logic hiển thị dữ liệu
  const destinationsToShow = () => {
    if (searchTerm.length >= 2) {
      return searchResults; // Kết quả tìm kiếm
    } else if (showingNearby && searchResults.length > 0) {
      return searchResults; // Kết quả "gần tôi"
    } else {
      return allAirports; // Danh sách mặc định
    }
  };

  // Debug: Log dữ liệu hiển thị
  if (destinationsToShow.length > 0) {
    console.log(
      "🖥️ UI: Dữ liệu sẽ hiển thị:",
      destinationsToShow.length,
      "sân bay"
    );
    destinationsToShow.forEach((dest, index) => {
      console.log(`🖥️ UI ${index + 1}:`, {
        code: dest.airportCode,
        city: dest.city,
        distance: dest.distance,
        hasDistance: dest.distance !== undefined,
      });
    });
  }

  const handleLocationSelect = (location) => {
    if (!multiple) {
      setSelectedLocations([location]);
      onChange([location]);
      setSearchTerm("");
      setIsOpen(false);
      return;
    }

    const isAlreadySelected = selectedLocations.some(
      (loc) => loc.airportCode === location.airportCode
    );

    const newSelection = isAlreadySelected
      ? selectedLocations.filter(
          (loc) => loc.airportCode !== location.airportCode
        )
      : [...selectedLocations, location];

    setSelectedLocations(newSelection);
    onChange(newSelection);
    setSearchTerm("");
  };

  const handleRemoveLocation = (airportCodeToRemove) => {
    const newSelection = selectedLocations.filter(
      (loc) => loc.airportCode !== airportCodeToRemove
    );
    setSelectedLocations(newSelection);
    onChange(newSelection);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      e.preventDefault();
      const customLocation = {
        airportCode: searchTerm.toUpperCase(),
        city: searchTerm,
        country: "Tùy chỉnh",
        airport: searchTerm,
      };
      handleLocationSelect(customLocation);
    }
  };

  const handleGetNearby = async () => {
    setShowingNearby(true); // Set state để hiển thị kết quả nearby
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await getNearbyAirports(
              position.coords.latitude,
              position.coords.longitude
            );
          } catch (error) {
            console.error("Get nearby error:", error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    } else {
      // Fallback: tự động tìm sân bay gần nếu không có geolocation
      try {
        await getNearbyAirports();
      } catch (error) {
        console.error("Get nearby error:", error);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`min-h-[40px] w-full border border-gray-300 rounded-md px-3 py-2 bg-white cursor-text transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 ${
          disabled ? "bg-gray-50 cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {/* Selected locations */}
        {multiple && (
          <div className="flex flex-wrap gap-1 mb-1">
            {selectedLocations.map((location) => (
              <span
                key={location.airportCode}
                className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
              >
                <MapPin className="w-3 h-3 mr-1" />
                {location.city} ({location.airportCode})
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveLocation(location.airportCode);
                  }}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          placeholder={
            !multiple && selectedLocations.length > 0
              ? `${selectedLocations[0].city} (${selectedLocations[0].airportCode})`
              : selectedLocations.length === 0
              ? placeholder
              : ""
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          className="w-full border-none outline-none bg-transparent text-sm placeholder-gray-400"
        />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute w-96 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-9999 max-h-80 overflow-y-auto">
          {/* Header */}
          {searchTerm === "" && (
            <div className="p-3 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-gray-700 flex items-center">
                  <Plane className="w-4 h-4 mr-2" />
                  {/* Kiểm tra xem có phải kết quả nearby không */}
                  {destinationsToShow().some(
                    (dest) => dest.distance !== undefined
                  )
                    ? "Sân bay gần bạn nhất"
                    : country
                    ? `Sân bay ${country}`
                    : "Tất cả sân bay"}
                </h4>
                {showNearby && (
                  <button
                    onClick={handleGetNearby}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    disabled={isLoading}
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    {isLoading ? "Đang tìm..." : "Gần tôi"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Search header */}
          {searchTerm.length >= 2 && (
            <div className="p-3 border-b bg-blue-50">
              <h4 className="font-medium text-sm text-blue-700 flex items-center">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tìm kiếm...
                  </>
                ) : (
                  <>
                    <Plane className="w-4 h-4 mr-2" />
                    Kết quả cho "{searchTerm}"
                  </>
                )}
              </h4>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border-b">
              Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.
            </div>
          )}

          {/* Results */}
          {!isLoading && destinationsToShow().length > 0 ? (
            destinationsToShow().map((destination) => {
              const isSelected = selectedLocations.some(
                (loc) => loc.airportCode === destination.airportCode
              );
              return (
                <div
                  key={destination.airportCode}
                  onClick={() => handleLocationSelect(destination)}
                  className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors ${
                    isSelected ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {destination.city} ({destination.airportCode})
                        </div>
                        {destination.distance && (
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-medium ml-2 flex-shrink-0">
                            {destination.distance.toFixed(1)} km
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {destination.airportName || destination.airport},{" "}
                        {destination.country}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="text-blue-500 text-xs font-medium ml-2">
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : !isLoading && searchTerm.length >= 2 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              <div className="mb-2">
                Không tìm thấy sân bay nào cho "{searchTerm}"
              </div>
              <div className="text-xs text-gray-400">
                Nhấn Enter để thêm địa điểm tùy chỉnh
              </div>
            </div>
          ) : !isLoading && searchTerm.length > 0 && searchTerm.length < 2 ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              Nhập ít nhất 2 ký tự để tìm kiếm
            </div>
          ) : null}

          {/* Loading state */}
          {isLoading && destinationsToShow.length === 0 && (
            <div className="p-4 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
              <div className="text-sm text-gray-500 mt-2">Đang tìm kiếm...</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AirportAutocomplete;
