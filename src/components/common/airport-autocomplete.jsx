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
  open: externalOpen,
  onOpenChange,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocations, setSelectedLocations] = useState(value || []);
  const [showingNearby, setShowingNearby] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync selectedLocations with external value prop
  useEffect(() => {
    setSelectedLocations(value || []);
  }, [value]);

  // Use external open state if provided, otherwise use internal
  const isOpen = externalOpen !== undefined ? externalOpen : internalIsOpen;
  const setIsOpen = (value) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalIsOpen(value);
    }
  };

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

  // Load all airports on mount if not loaded
  useEffect(() => {
    if (allAirports.length === 0 && !isLoading) {
      searchAirports("");
    }
  }, [allAirports.length, isLoading, searchAirports]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
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
    let results = [];

    if (searchTerm.length >= 2) {
      results = searchResults; // Kết quả tìm kiếm
    } else if (showingNearby && searchResults.length > 0) {
      results = searchResults; // Kết quả "gần tôi"
    } else {
      results = allAirports; // Danh sách mặc định
    }

    // Nếu có search term, sắp xếp kết quả để matching items hiện lên đầu
    if (searchTerm.length >= 2) {
      const upperTerm = searchTerm.toUpperCase().trim();
      const exactMatches = [];
      const partialMatches = [];
      const others = [];

      results.forEach((dest) => {
        const cityNamesStr = Array.isArray(dest.cityNames)
          ? dest.cityNames.join(" ").toUpperCase()
          : String(dest.city || "").toUpperCase();
        const airportCodeStr = String(dest.airportCode || "").toUpperCase();
        const airportNameStr = String(dest.airportName || "").toUpperCase();

        // Exact matches (ưu tiên cao nhất)
        if (
          airportCodeStr === upperTerm ||
          (Array.isArray(dest.cityNames) &&
            dest.cityNames[0]?.toUpperCase() === upperTerm)
        ) {
          exactMatches.push(dest);
        }
        // Partial matches
        else if (
          airportCodeStr.includes(upperTerm) ||
          cityNamesStr.includes(upperTerm) ||
          airportNameStr.includes(upperTerm)
        ) {
          partialMatches.push(dest);
        }
        // Others
        else {
          others.push(dest);
        }
      });

      results = [...exactMatches, ...partialMatches, ...others];
    }

    // Sắp xếp để các sân bay đã select luôn hiển thị ở đầu (nếu không có search term)
    if (selectedLocations.length > 0 && searchTerm.length < 2) {
      const selectedCodes = selectedLocations.map((loc) => loc.airportCode);
      const selectedResults = results.filter((dest) =>
        selectedCodes.includes(dest.airportCode)
      );
      const unselectedResults = results.filter(
        (dest) => !selectedCodes.includes(dest.airportCode)
      );

      return [...selectedResults, ...unselectedResults];
    }

    return results;
  };

  // Parse search term to extract city and airport code
  const parseSearchTerm = (term) => {
    const trimmed = term.trim();

    // Check if format is "City (CODE)"
    const bracketMatch = trimmed.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (bracketMatch) {
      const cityName = bracketMatch[1].trim();
      const airportCode = bracketMatch[2].trim().toUpperCase();

      return {
        cityName,
        airportCode,
        displayName: `${cityName} (${airportCode})`,
      };
    }

    // Check if it's just an airport code (3 letters)
    if (/^[A-Z]{3}$/.test(trimmed.toUpperCase())) {

      return {
        cityName: trimmed.toUpperCase(),
        airportCode: trimmed.toUpperCase(),
        displayName: trimmed.toUpperCase(),
      };
    }

    // Default: treat as city name, try to find matching airport
    const upperTerm = trimmed.toUpperCase();
    const matchingAirport = allAirports.find((airport) => {
      const cityNamesStr = Array.isArray(airport.cityNames)
        ? airport.cityNames.join(" ").toUpperCase()
        : String(airport.city || "").toUpperCase();
      const airportCodeStr = String(airport.airportCode || "").toUpperCase();
      const airportNameStr = String(airport.airportName || "").toUpperCase();

      // Ưu tiên tìm theo airport code trước
      if (airportCodeStr === upperTerm) return true;

      // Sau đó tìm theo tên thành phố (cityNames[0] hoặc city)
      if (cityNamesStr.includes(upperTerm)) return true;

      // Cuối cùng tìm theo tên sân bay
      if (airportNameStr.includes(upperTerm)) return true;

      return false;
    });

    if (matchingAirport) {

      const primaryCityName =
        Array.isArray(matchingAirport.cityNames) &&
        matchingAirport.cityNames.length > 0
          ? matchingAirport.cityNames[0]
          : matchingAirport.city || trimmed;

      return {
        cityName: primaryCityName,
        airportCode: matchingAirport.airportCode,
        airportId: matchingAirport.airportId,
        displayName: `${primaryCityName} (${matchingAirport.airportCode})`,
      };
    }

    // Fallback: create custom location

    return {
      cityName: trimmed,
      airportCode: trimmed.toUpperCase(),
      displayName: trimmed,
    };
  };

  const handleLocationSelect = (location) => {
    // Lấy tên thành phố chính từ cityNames[0] hoặc city
    const primaryCityName =
      Array.isArray(location.cityNames) && location.cityNames.length > 0
        ? location.cityNames[0]
        : location.city || location.cityName || "Unknown";

    // Đảm bảo dữ liệu được chuẩn hóa đúng cách
    const normalizedLocation = {
      airportId: location.airportId,
      airportCode: location.airportCode,
      cityNames:
        Array.isArray(location.cityNames) && location.cityNames.length > 0
          ? location.cityNames
          : [primaryCityName],
      city: primaryCityName,
      country: location.country || "Vietnam",
      airportName:
        location.airportName ||
        location.displayName ||
        `${primaryCityName} (${location.airportCode})`,
      displayName: `${primaryCityName} (${location.airportCode})`,
    };

    if (!multiple) {
      const newSelection = [normalizedLocation];
      setSelectedLocations(newSelection);
      onChange(newSelection);
      setSearchTerm("");
      // Delay closing dropdown to ensure state updates are processed
      setTimeout(() => setIsOpen(false), 100);
      return;
    }

    const isAlreadySelected = selectedLocations.some(
      (loc) => loc.airportCode === normalizedLocation.airportCode
    );

    let newSelection;
    if (isAlreadySelected) {
      // If already selected, remove it (toggle behavior)
      newSelection = selectedLocations.filter(
        (loc) => loc.airportCode !== normalizedLocation.airportCode
      );
    } else {
      // If not selected, add it
      newSelection = [...selectedLocations, normalizedLocation];
    }

    setSelectedLocations(newSelection);
    onChange(newSelection);
    setSearchTerm("");
    // Delay closing dropdown to ensure state updates are processed
    setTimeout(() => setIsOpen(false), 100);
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

      const parsed = parseSearchTerm(searchTerm);

      const customLocation = {
        airportId: parsed.airportId,
        airportCode: parsed.airportCode,
        cityNames: [parsed.cityName],
        city: parsed.cityName,
        country: parsed.airportId ? "Vietnam" : "Tùy chỉnh",
        airportName: parsed.displayName,
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
        className={`min-h-[40px] w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 cursor-text transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 ${
          disabled ? "bg-gray-50 cursor-not-allowed" : ""
        }`}
        onClick={(e) => { e.stopPropagation(); !disabled && setIsOpen(true); }}
        onFocus={(e) => { e.stopPropagation(); !disabled && setIsOpen(true); }}
        tabIndex={0}
      >
        {/* Selected locations */}
        {multiple && (
          <div className="flex flex-wrap gap-1 mb-1">
            {selectedLocations.map((location, index) => (
              <span
                key={`selected-${location.airportCode}-${index}`}
                className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
              >
                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                <span className="hidden sm:inline">
                  {location.city} ({location.airportCode})
                </span>
                <span className="sm:hidden">{location.airportCode}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveLocation(location.airportCode);
                  }}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center">
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
            className="flex-1 border-none outline-none bg-transparent text-xs sm:text-sm placeholder-gray-400"
          />
          {searchTerm.trim() && (
            <button
              onClick={() => {
                const parsed = parseSearchTerm(searchTerm);
                const customLocation = {
                  airportId: parsed.airportId,
                  airportCode: parsed.airportCode,
                  cityNames: [parsed.cityName],
                  city: parsed.cityName,
                  country: parsed.airportId ? "Vietnam" : "Tùy chỉnh",
                  airportName: parsed.displayName,
                };

                handleLocationSelect(customLocation);
              }}
              className="ml-1 sm:ml-2 text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium"
              title="Thêm địa điểm này"
            >
              <span className="hidden sm:inline">Thêm</span>
              <span className="sm:hidden">+</span>
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute w-full sm:w-96 top-full mt-1 bg-white border border-gray-200 dark:bg-black rounded-lg shadow-xl max-h-80 overflow-y-auto z-[999999] ring-1 ring-black/5">
          {/* Header */}
          {searchTerm === "" && (
            <div className="p-2 sm:p-3 border-b bg-gray-50 dark:bg-black dark:text-white">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-xs sm:text-sm text-gray-700 dark:text-white flex items-center">
                  <Plane className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
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
                    <span className="hidden sm:inline">
                      {isLoading ? "Đang tìm..." : "Gần tôi"}
                    </span>
                    <span className="sm:hidden">
                      {isLoading ? "..." : "Gần"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Search header */}
          {searchTerm.length >= 2 && (
            <div className="p-2 sm:p-3 border-b bg-blue-50">
              <h4 className="font-medium text-xs sm:text-sm text-blue-700 flex items-center">
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                    <span className="text-xs sm:text-sm">Đang tìm kiếm...</span>
                  </>
                ) : (
                  <>
                    <Plane className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">
                      Kết quả cho "{searchTerm}"
                    </span>
                  </>
                )}
              </h4>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-2 sm:p-3 text-xs sm:text-sm text-red-600 bg-red-50 border-b">
              Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.
            </div>
          )}

          {/* Results */}
          {isLoading || (isOpen && destinationsToShow().length === 0) ? (
            <div className="p-2 sm:p-3 text-center text-xs sm:text-sm text-gray-500">
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto mb-2" />
              <span>Đang tải danh sách sân bay...</span>
            </div>
          ) : destinationsToShow().length > 0 ? (
            destinationsToShow().map((destination) => {
              const isSelected = selectedLocations.some(
                (loc) => loc.airportCode === destination.airportCode
              );
              return (
                <div
                  key={`search-result-${destination.airportCode}-${destination.city}`}
                  onClick={() => handleLocationSelect(destination)}
                  className={`p-2 sm:p-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b last:border-b-0 transition-colors ${
                    isSelected ? "bg-blue-50 dark:bg-gray-800" : ""
                  }`}
                >
                  <div className="flex items-start">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-xs sm:text-sm dark:text-white text-gray-900 truncate">
                          {Array.isArray(destination.cityNames) &&
                          destination.cityNames.length > 0
                            ? destination.cityNames[0]
                            : destination.city || "Unknown"}{" "}
                          ({destination.airportCode})
                        </div>
                        {destination.distance && (
                          <div className="text-xs text-blue-600 bg-blue-50 px-1 sm:px-2 py-0.5 sm:py-1 rounded font-medium ml-1 sm:ml-2 flex-shrink-0">
                            {destination.distance.toFixed(1)} km
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {destination.airportName || destination.airport},{" "}
                        {destination.country}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="text-blue-500 text-xs font-medium ml-1 sm:ml-2">
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : !isLoading && searchTerm.length >= 2 ? (
            <div className="p-3 sm:p-4 text-xs sm:text-sm text-gray-500 text-center">
              <div className="mb-2">
                Không tìm thấy sân bay nào cho "{searchTerm}"
              </div>
              <div className="text-xs text-gray-400 mb-2">Bạn có thể:</div>
              <div className="text-xs text-blue-600 leading-relaxed">
                • Nhập "Tên thành phố (MÃ)" (VD: "Hanoi (HAN)")
                <br />• Nhập chỉ "MÃ" (VD: "HAN")
                {/* <br />
                • Nhập tên thành phố để tìm tự động */}
                {/* <br />• Nhấn Enter hoặc nút "Thêm" để tạo địa điểm tùy chỉnh */}
              </div>
            </div>
          ) : !isLoading && searchTerm.length > 0 && searchTerm.length < 2 ? (
            <div className="p-2 sm:p-3 text-xs sm:text-sm text-gray-500 text-center">
              Nhập ít nhất 2 ký tự để tìm kiếm
            </div>
          ) : null}

          {/* Loading state */}
          {isLoading && destinationsToShow.length === 0 && (
            <div className="p-3 sm:p-4 text-center">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin mx-auto text-blue-500" />
              <div className="text-xs sm:text-sm text-gray-500 mt-2">
                Đang tìm kiếm...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AirportAutocomplete;
