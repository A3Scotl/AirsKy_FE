import React, { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Plane,
  MapPin,
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  Layers,
} from "lucide-react";
import {
  extractDepartureTime,
  extractArrivalTime,
  formatTimeHHMM,
} from "../../utils/date-utils";

// Custom CSS for Leaflet-specific styling
const customMapStyles = `
  .leaflet-container { border-radius: 16px; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1); border: 2px solid rgba(255, 255, 255, 0.1); }
  .leaflet-popup-content-wrapper { border-radius: 12px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); }
  .leaflet-popup-tip { background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); }
  .leaflet-control-container .leaflet-control { border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
  .airport-marker { transition: transform 0.3s ease; }
  .airport-marker:hover { transform: scale(1.1); }
  .flight-path { filter: drop-shadow(0 2px 6px rgba(37, 99, 235, 0.3)); transition: opacity 0.3s ease; }
  .flight-path:hover { opacity: 1 !important; filter: drop-shadow(0 4px 12px rgba(37, 99, 235, 0.5)); }
  .route-label { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 11px; white-space: nowrap; pointer-events: none; }
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
`;

// Inject custom styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = customMapStyles;
  document.head.appendChild(styleSheet);
}

// Fix Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

// Color palettes for different trip types
const colors = {
  one_way: "#2563eb",
  outbound: "#2563eb",
  inbound: "#10b981",
  multi: ["#2563eb", "#10b981", "#ef4444", "#a855f7", "#eab308"],
};

// Custom Icons
const createDivIcon = (bgGradient, svgFill, svgPath) =>
  new L.DivIcon({
    html: `<div class="airport-marker" style="background: ${bgGradient}; border: 3px solid #ffffff; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
      <div style="background: #ffffff; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center;">
        <svg width="10" height="10" fill="${svgFill}" viewBox="0 0 24 24"><path d="${svgPath}"/></svg>
      </div>
    </div>`,
    className: "custom-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

const departureIcon = createDivIcon(
  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  "#10b981",
  "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
);

const arrivalIcon = createDivIcon(
  "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  "#ef4444",
  "M9 11H1l4-4h14l-4 4H9zm-4 2h4v6l1.5 1.5L12 19l1.5 1.5L15 19v-6h4l-4-4H1l4 4z"
);

const stopIcon = createDivIcon(
  "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
  "#eab308",
  "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6h2V7zm0 8h-2v2h2v-2z"
);

const createPlaneIcon = (bgGradient) =>
  new L.DivIcon({
    html: `<div style="background: ${bgGradient}; border: 3px solid #ffffff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); animation: pulse 2s infinite;">
      <svg width="14" height="14" fill="#ffffff" viewBox="0 0 24 24" style="transform: rotate(-45deg);"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
    </div>`,
    className: "plane-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

// Utility Functions
const createCurvedPath = (start, end, steps = 100, direction = "outbound") => {

  if (
    !start?.lat ||
    !end?.lat ||
    !start?.lon ||
    !end?.lon ||
    isNaN(start.lat) ||
    isNaN(start.lon) ||
    isNaN(end.lat) ||
    isNaN(end.lon)
  ) {

    return [];
  }

  const latlngs = [];
  const dLat = (end.lat - start.lat) / steps;
  const dLon = (end.lon - start.lon) / steps;
  const offsetSign = direction === "outbound" ? 1 : -1;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = start.lat + dLat * i;
    const lon = start.lon + dLon * i;
    const offset = Math.sin(t * Math.PI) * 0.5 * offsetSign;
    latlngs.push([lat + offset, lon + offset]);
  }

  return latlngs;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getAirportCoords = async (airport) => {

  const airportName =
    typeof airport === "string"
      ? airport
      : airport?.airportName || airport?.name;
  const airportCode =
    typeof airport === "string"
      ? airport
      : airport?.airportCode || airport?.code;
  const lat = parseFloat(airport?.lat || airport?.latitude);
  const lon = parseFloat(airport?.lon || airport?.longitude);

  // Initialize cache if not exists
  if (!getAirportCoords.cache) {
    getAirportCoords.cache = new Map();

    // Load from localStorage if available
    try {
      const cached = localStorage.getItem("airportCoordsCache");
      if (cached) {
        const parsedCache = JSON.parse(cached);
        Object.entries(parsedCache).forEach(([key, value]) => {
          getAirportCoords.cache.set(key, value);
        });

      }
    } catch (error) {
      console.warn("Failed to load airport cache from localStorage:", error);
    }
  }

  // Check memory cache first
  if (airportCode && getAirportCoords.cache.has(airportCode)) {

    return getAirportCoords.cache.get(airportCode);
  }

  // Priority order for coordinate resolution:
  // 1. Existing coordinates (from flight data) - FASTEST
  // 2. Cached coordinates (memory + localStorage) - FAST
  // 3. OpenStreetMap API - RELIABLE but SLOWER
  // 4. Fallback coordinates (0,0) - ENSURES APP NEVER BREAKS

  if (lat && lon && !isNaN(lat) && !isNaN(lon)) {

    const result = { lat, lon, name: airportName, code: airportCode };
    // Cache the result
    if (airportCode) {
      getAirportCoords.cache.set(airportCode, result);
      saveCacheToLocalStorage();
    }
    return result;
  }

  // Try multiple search queries for better results
  const searchQueries = [
    `${airportName} airport`,
    `${airportCode} airport`,
    airportName,
    `${airportCode} ${airportName}`,
  ];

  for (const query of searchQueries) {
    try {

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=3&countrycodes=VN,TH,SG,MY,HK,TW,JP,KR`,
        {
          headers: {
            "User-Agent": "FlightBookingApp/1.0",
            "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
          },
          signal: AbortSignal.timeout(8000), // 8 second timeout
        }
      );

      if (!response.ok) {
        console.warn(`Query "${query}" failed with status: ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (data.length > 0) {
        // Find the best match (prefer airports)
        let bestMatch = data[0];

        // Look for airport-specific results
        for (const result of data) {
          if (
            result.type === "aerodrome" ||
            result.class === "aeroway" ||
            result.display_name.toLowerCase().includes("airport") ||
            result.display_name.toLowerCase().includes("sân bay")
          ) {
            bestMatch = result;
            break;
          }
        }

        const result = {
          lat: parseFloat(bestMatch.lat),
          lon: parseFloat(bestMatch.lon),
          name: bestMatch.display_name.split(",")[0] || airportName,
          code: airportCode,
        };

        // Cache the result
        if (airportCode) {
          getAirportCoords.cache.set(airportCode, result);
          saveCacheToLocalStorage();
        }

        return result;
      }
    } catch (error) {
      console.warn(`Query "${query}" failed:`, error);
      continue;
    }
  }

  // If all queries failed, try a broader search without country filter
  try {

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        airportName + " airport"
      )}&limit=5`,
      {
        headers: {
          "User-Agent": "FlightBookingApp/1.0",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    const data = await response.json();

    if (data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        name: data[0].display_name.split(",")[0] || airportName,
        code: airportCode,
      };

      // Cache the result
      if (airportCode) {
        getAirportCoords.cache.set(airportCode, result);
        saveCacheToLocalStorage();
      }

      return result;
    }
  } catch (error) {
    console.error("Broader search also failed:", error);
  }

  // Final fallback: return default coordinates to prevent app crashes

  const fallbackResult = {
    lat: 0,
    lon: 0,
    name: airportName,
    code: airportCode,
  };

  // Cache the fallback result too (to avoid repeated API calls for same airport)
  if (airportCode) {
    getAirportCoords.cache.set(airportCode, fallbackResult);
    saveCacheToLocalStorage();
  }

  return fallbackResult;
};

// Helper function to save cache to localStorage
const saveCacheToLocalStorage = () => {
  try {
    if (getAirportCoords.cache && getAirportCoords.cache.size > 0) {
      const cacheObject = {};
      getAirportCoords.cache.forEach((value, key) => {
        cacheObject[key] = value;
      });
      localStorage.setItem("airportCoordsCache", JSON.stringify(cacheObject));

    }
  } catch (error) {
    console.warn("Failed to save airport cache to localStorage:", error);
  }
};

// Map Control Panel Component
const FlightInfoOverlay = ({ processedSearchData, legs, coordsMap }) => {
  const tripType = processedSearchData?.tripType || "one_way";
  const groupedLegs = legs.reduce((acc, leg, index) => {
    const direction =
      tripType === "round_trip"
        ? leg.direction || (index === 0 ? "Outbound" : "Inbound")
        : tripType === "multi_city"
        ? `Chặng ${index + 1}`
        : "Chuyến bay";
    acc[direction] = acc[direction] || [];
    acc[direction].push({ ...leg, originalIndex: index });
    return acc;
  }, {});

  const getTripTypeDisplay = () =>
    ({
      one_way: {
        title: "Chuyến bay một chiều",
        subtitle: "Bay thẳng",
        icon: "→",
        color: "green",
      },
      round_trip: {
        title: "Chuyến bay khứ hồi",
        subtitle: "Chiều đi và về",
        icon: "↔️",
        color: "blue",
      },
      multi_city: {
        title: "Chuyến bay đa thành phố",
        subtitle: `${legs.length} chặng bay`,
        icon: "🔄",
        color: "purple",
      },
    }[tripType] || {
      title: "Chuyến bay",
      subtitle: "",
      icon: "→",
      color: "green",
    });

  const tripInfo = getTripTypeDisplay();

  return (
    <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-gray-100/50 max-w-md max-h-[70vh] overflow-y-auto z-[1000]">
      <div className="flex items-center space-x-3 mb-6">
        <div
          className={`p-3 bg-gradient-to-br ${
            tripInfo.color === "green"
              ? "from-green-500 to-green-600"
              : tripInfo.color === "blue"
              ? "from-blue-500 to-blue-600"
              : tripInfo.color === "purple"
              ? "from-purple-500 to-purple-600"
              : "from-gray-500 to-gray-600"
          } rounded-xl`}
        >
          <span className="text-2xl">{tripInfo.icon}</span>
        </div>
        <div>
          <h2 className="font-bold text-xl text-gray-800">{tripInfo.title}</h2>
          <p className="text-sm text-gray-600">{tripInfo.subtitle}</p>
        </div>
      </div>
      {tripType === "round_trip" && legs.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl mb-6 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-blue-800">
              Chuyến bay khứ hồi
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {legs.length} chuyến bay
            </span>
          </div>
          {["Outbound", "Inbound"].map((dir) => {
            const leg = legs.find((l) => l.direction === dir);
            if (!leg) return null;
            return (
              <div
                key={dir}
                className={`bg-white/80 p-3 rounded-lg mb-3 border ${
                  dir === "Outbound" ? "border-blue-200" : "border-green-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        dir === "Outbound" ? "bg-blue-500" : "bg-green-500"
                      }`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${
                        dir === "Outbound" ? "text-blue-800" : "text-green-800"
                      }`}
                    >
                      {dir === "Outbound" ? "Chiều đi" : "Chiều về"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {leg.flight?.duration ? `${leg.flight.duration}` : "N/A"}
                  </div>
                </div>
                <div className="text-sm text-gray-700 ml-4 mb-1 font-semibold">
                  {leg.dep?.code} → {leg.arr?.code}{" "}
                  <span
                    className={`text-xs ml-2 ${
                      dir === "Outbound" ? "text-blue-600" : "text-green-600"
                    }`}
                  >
                    ({leg.flight?.flightNumber})
                  </span>
                </div>

                <div className="text-xs text-gray-500 ml-4">
                  {(() => {
                    const departureTime =
                      leg.flight?.departureTime ||
                      leg?.departureTime ||
                      leg?.flightInfo?.departureTime;
                    return departureTime &&
                      !isNaN(new Date(departureTime).getTime())
                      ? new Date(departureTime).toLocaleString("vi-VN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A";
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="space-y-4">
        {Object.entries(groupedLegs).map(([direction, directionLegs]) => (
          <div key={direction} className="space-y-3">
            {Object.keys(groupedLegs).length > 1 && (
              <div className="flex items-center space-x-2">
                <div
                  className={`h-px flex-1 ${
                    direction === "Outbound"
                      ? "bg-blue-300"
                      : direction === "Inbound"
                      ? "bg-green-300"
                      : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    direction === "Outbound"
                      ? "bg-blue-100 text-blue-700"
                      : direction === "Inbound"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {direction === "Outbound"
                    ? "✈️ Chiều đi"
                    : direction === "Inbound"
                    ? "🔙 Chiều về"
                    : direction}
                </div>
                <div
                  className={`h-px flex-1 ${
                    direction === "Outbound"
                      ? "bg-blue-300"
                      : direction === "Inbound"
                      ? "bg-green-300"
                      : "bg-gray-300"
                  }`}
                ></div>
              </div>
            )}
            {directionLegs.map((leg) => {
              const segmentsArray = Array.isArray(leg.segments)
                ? leg.segments
                : [];
              const totalDistance = segmentsArray.reduce(
                (sum, seg) =>
                  sum +
                  calculateDistance(
                    coordsMap[seg.from.code]?.lat || 0,
                    coordsMap[seg.from.code]?.lon || 0,
                    coordsMap[seg.to.code]?.lat || 0,
                    coordsMap[seg.to.code]?.lon || 0
                  ),
                0
              );
              return (
                <div
                  key={leg.originalIndex}
                  className={`p-4 rounded-xl border transition-all hover:shadow-md bg-gradient-to-r ${
                    direction === "Outbound"
                      ? "from-blue-50 to-blue-100 border-blue-200"
                      : direction === "Inbound"
                      ? "from-green-50 to-green-100 border-green-200"
                      : "from-gray-50 to-gray-100 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          direction === "Outbound"
                            ? "bg-blue-500"
                            : direction === "Inbound"
                            ? "bg-green-500"
                            : "bg-gray-500"
                        }`}
                      ></div>
                      <span className="font-semibold text-gray-800">
                        {leg.flight?.flightNumber || "N/A"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {leg.flight?.duration ? `${leg.flight.duration}` : "N/A"}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold text-green-600">
                        {leg.dep?.code || leg.dep?.airportCode || "N/A"}
                      </div>
                      <div className="text-xs text-gray-600">
                        {leg.dep?.cityNames?.[0] ||
                          leg.dep?.airportName ||
                          leg.dep?.name ||
                          "Chưa xác định"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 bg-white/80 px-2 py-1 rounded">
                        {(() => {
                          const departureTime = extractDepartureTime(leg);

                          return formatTimeHHMM(departureTime);
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center px-3">
                      <div
                        className={`w-8 h-0.5 rounded-full ${
                          direction === "Outbound"
                            ? "bg-blue-400"
                            : direction === "Inbound"
                            ? "bg-green-400"
                            : "bg-gray-400"
                        }`}
                      ></div>
                      <ArrowRight
                        className={`w-4 h-4 mx-2 ${
                          direction === "Outbound"
                            ? "text-blue-500"
                            : direction === "Inbound"
                            ? "text-green-500"
                            : "text-gray-500"
                        }`}
                      />
                      <div
                        className={`w-8 h-0.5 rounded-full ${
                          direction === "Outbound"
                            ? "bg-blue-400"
                            : direction === "Inbound"
                            ? "bg-green-400"
                            : "bg-gray-400"
                        }`}
                      ></div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold text-red-600">
                        {leg.arr?.code || leg.arr?.airportCode || "N/A"}
                      </div>
                      <div className="text-xs text-gray-600">
                        {leg.arr?.cityNames?.[0] ||
                          leg.arr?.airportName ||
                          leg.arr?.name ||
                          "Chưa xác định"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 bg-white/80 px-2 py-1 rounded">
                        {(() => {
                          const arrivalTime = extractArrivalTime(leg);

                          return formatTimeHHMM(arrivalTime);
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <div className="text-sm font-medium text-gray-800 mb-2">
                      Thông tin chuyến bay
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Mã chuyến:</span>
                        <span className="font-semibold text-gray-800 ml-1">
                          {leg.flight?.flightNumber || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Thời gian bay:</span>
                        <span className="font-semibold text-gray-800 ml-1">
                          {leg.flight?.duration || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/80 p-2 rounded-lg">
                      <div className="flex items-center space-x-1 mb-1">
                        <Plane className="w-3 h-3 text-blue-500" />
                        <span className="font-medium text-gray-600">
                          Hãng bay
                        </span>
                      </div>
                      <div className="font-semibold text-blue-700">
                        {leg.flight?.airline?.airlineName ||
                          leg.flight?.airlineName ||
                          "Hãng chưa xác định"}
                      </div>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg">
                      <div className="flex items-center space-x-1 mb-1">
                        <MapPin className="w-3 h-3 text-purple-500" />
                        <span className="font-medium text-gray-600">
                          Quãng đường
                        </span>
                      </div>
                      <div className="font-semibold text-purple-700">
                        {totalDistance.toFixed(0)} km
                      </div>
                    </div>
                  </div>
                  {Array.isArray(leg.stops) && leg.stops.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-2">
                        Điểm dừng ({leg.stops.length}):
                      </div>
                      {leg.stops.map((stop, sIndex) => (
                        <div
                          key={sIndex}
                          className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-1"
                        >
                          {stop.airportCode} - {stop.airportName} (
                          {stop.stopDuration})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Map Legend Component
const MapLegend = ({ tripType, legs }) => {
  const tripInfo = {
    one_way: {
      title: "Chuyến bay một chiều",
      description: "Bay thẳng",
      icon: "→",
      color: "green",
    },
    round_trip: {
      title: "Chuyến bay khứ hồi",
      description: "Chuyến đi và về",
      icon: "↔️",
      color: "blue",
    },
    multi_city: {
      title: "Chuyến bay đa thành phố",
      description: `${legs.length} chặng bay`,
      icon: "🔄",
      color: "purple",
    },
  }[tripType] || {
    title: "Chuyến bay",
    description: "",
    icon: "→",
    color: "green",
  };

  return (
    <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-lg p-4 rounded-2xl shadow-xl border border-gray-100/50 max-w-xs z-[1000] transition-transform hover:scale-105">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold text-gray-800">
          Chú thích bản đồ
        </span>
      </div>
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Sân bay
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            <span className="text-xs text-gray-700">Khởi hành</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            <span className="text-xs text-gray-700">Đến</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            <span className="text-xs text-gray-700">Điểm dừng</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Đường bay
          </div>
          {tripType === "round_trip" && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                <div>
                  <span className="text-xs text-gray-700 font-medium">
                    Chiều đi
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                  style={{ borderStyle: "dashed", borderWidth: "1px" }}
                ></div>
                <div>
                  <span className="text-xs text-gray-700 font-medium">
                    Chiều về
                  </span>
                </div>
              </div>
            </>
          )}
          {tripType === "multi_city" &&
            legs.map((leg, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-8 h-1 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${
                      colors.multi[index % colors.multi.length]
                    }, ${colors.multi[index % colors.multi.length]}aa)`,
                  }}
                ></div>
                <div>
                  <span className="text-xs text-gray-700 font-medium">
                    Chặng {index + 1}
                  </span>
                </div>
              </div>
            ))}
          {tripType === "one_way" && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
              <span className="text-xs text-gray-700 font-medium">
                Tuyến bay
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Map Toggle Controls Component
const MapToggleControls = ({
  showFlightInfo,
  setShowFlightInfo,
  showLegend,
  setShowLegend,
}) => (
  <div className="absolute top-4 right-4 flex flex-col space-y-2 z-[1000]">
    <button
      onClick={() => setShowFlightInfo(!showFlightInfo)}
      className="bg-white/95 backdrop-blur-lg p-3 rounded-xl shadow-xl border border-gray-100/50 hover:bg-gray-50 transition-all"
      title="Toggle thông tin chuyến bay"
    >
      {showFlightInfo ? (
        <EyeOff className="w-5 h-5 text-gray-700" />
      ) : (
        <Eye className="w-5 h-5 text-gray-700" />
      )}
    </button>
    <button
      onClick={() => setShowLegend(!showLegend)}
      className="bg-white/95 backdrop-blur-lg p-3 rounded-xl shadow-xl border border-gray-100/50 hover:bg-gray-50 transition-all"
      title="Toggle chú thích bản đồ"
    >
      {showLegend ? (
        <Layers className="w-5 h-5 text-gray-700" />
      ) : (
        <Info className="w-5 h-5 text-gray-700" />
      )}
    </button>
  </div>
);

// Main Component
const FlightRouteMap = ({
  searchData,
  flightInfo,
  // support both old prop names and new prop-prefixed names
  processedSearchData,
  legs,
  coordsMap,
  propProcessedSearchData,
  propLegs,
  propCoordsMap,
  className = "",
  height = "600px",
  showFlightPath = true,
  showAirportInfo = true,
}) => {
  const mapRef = useRef(null);
  const [mapLegs, setMapLegs] = useState([]);
  const [mapCoordsMap, setMapCoordsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFlightInfo, setShowFlightInfo] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  // Normalize incoming props - accept either plain or prop-prefixed names
  const _processedSearchDataProp =
    propProcessedSearchData ?? processedSearchData ?? null;
  const _legsProp = propLegs ?? legs ?? null;
  const _coordsMapProp = propCoordsMap ?? coordsMap ?? null;

  // Debug logging

  // Compute a single processed search data object from either searchData, flightInfo or the provided processed search data prop
  const finalProcessedSearchData = useMemo(() => {

    if (_processedSearchDataProp) {

      return _processedSearchDataProp;
    }
    const data =
      searchData ||
      (flightInfo && {
        tripType: "one_way",
        oneWayFlights: { content: [flightInfo] },
      }) ||
      null;

    return data;
  }, [searchData, flightInfo, _processedSearchDataProp]);

  useEffect(() => {
    const parseLegs = async () => {
      setLoading(true);
      setError(null);

      // Debug log all props first (using normalized props)

      // If we have props data, use it but resolve coordinates
      if (_legsProp && _coordsMapProp && finalProcessedSearchData) {

        // Check if legs has the expected structure or needs transformation
        let processedLegs = _legsProp;

        // If legs is an array of raw flight objects (like multi-city legs), transform them
        if (
          Array.isArray(_legsProp) &&
          _legsProp.length > 0 &&
          _legsProp[0].flightNumber &&
          !_legsProp[0].flight
        ) {

          processedLegs = _legsProp.map((rawLeg, index) => {
            // Try to extract departure and arrival info from the raw leg
            const depCode =
              rawLeg.departureAirportCode ||
              rawLeg.from ||
              rawLeg.departure?.code;
            const arrCode =
              rawLeg.arrivalAirportCode || rawLeg.to || rawLeg.arrival?.code;

            return {
              flight: {
                ...rawLeg,
                flightNumber: rawLeg.flightNumber,
                airlineName: rawLeg.airlineName || rawLeg.airline,
                duration: rawLeg.duration,
                departureTime: rawLeg.departureTime,
                arrivalTime: rawLeg.arrivalTime,
                aircraft: rawLeg.aircraft || {
                  aircraftName: rawLeg.aircraftName || "Unknown",
                },
                airline: {
                  airlineName: rawLeg.airlineName || rawLeg.airline,
                  airlineLogo: rawLeg.airlineLogo,
                },
              },
              dep: _coordsMapProp?.[depCode] || {
                code: depCode,
                airportName:
                  rawLeg.departureAirportName || `Airport ${depCode}`,
                cityNames: [rawLeg.departureCity || depCode],
                airportCode: depCode,
              },
              arr: _coordsMapProp?.[arrCode] || {
                code: arrCode,
                airportName: rawLeg.arrivalAirportName || `Airport ${arrCode}`,
                cityNames: [rawLeg.arrivalCity || arrCode],
                airportCode: arrCode,
              },
              stops: Array.isArray(rawLeg.stops) ? rawLeg.stops : [],
              direction:
                finalProcessedSearchData?.tripType === "multi_city"
                  ? `Chặng ${index + 1}`
                  : rawLeg.direction || "Outbound",
              segments: [],
            };
          });

        }

        // Resolve coordinates for all airports in coordsMap
        const resolveCoordsPromises = Object.entries(_coordsMapProp).map(
          async ([code, airport]) => {

            // If airport already has valid coordinates, use them
            if (
              airport.lat &&
              airport.lon &&
              airport.lat !== 0 &&
              airport.lon !== 0
            ) {

              return { code, coords: airport };
            }

            // Otherwise, resolve coordinates using airport code
            try {

              const resolvedCoords = await getAirportCoords({
                code: code,
                airportName: airport.name,
                airportCode: code,
              });

              return { code, coords: resolvedCoords };
            } catch (error) {
              console.error(
                `❌ Failed to resolve coordinates for ${code}:`,
                error
              );
              // Fallback to original coordinates
              return { code, coords: airport };
            }
          }
        );

        try {
          const resolvedCoordsResults = await Promise.allSettled(
            resolveCoordsPromises
          );

          const resolvedCoordsMap = {};

          resolvedCoordsResults.forEach((result, index) => {

            if (result.status === "fulfilled") {
              const { code, coords } = result.value;
              resolvedCoordsMap[code] = coords;

            } else {
              console.error(`❌ Result ${index} rejected:`, result.reason);
            }
          });

          setMapLegs(processedLegs);
          setMapCoordsMap(resolvedCoordsMap);
          setLoading(false);
        } catch (error) {
          console.error("❌ Error in Promise.allSettled:", error);
          // Fallback to original data
          setMapLegs(processedLegs);
          setMapCoordsMap(_coordsMapProp);
          setLoading(false);
        }

        return;
      }

      if (!finalProcessedSearchData) {
        setLoading(false);
        return;
      }

      try {
        const tripType = finalProcessedSearchData.tripType;
        let parsedLegs = [];
        const allAirports = new Set();

        if (tripType === "one_way") {
          const flights = finalProcessedSearchData.oneWayFlights?.content || [];
          parsedLegs = flights
            .filter(
              (flight) =>
                flight && flight.departureAirport && flight.arrivalAirport
            )
            .map((flight) => ({
              flight,
              dep: flight.departureAirport,
              arr: flight.arrivalAirport,
              stops: Array.isArray(flight.stopsList) ? flight.stopsList : [],
              direction: "Outbound",
              segments: [],
            }));
        } else if (tripType === "round_trip") {

          const pairs = finalProcessedSearchData.roundTripPairs || [];

          // Handle direct outboundFlight and returnFlight structure
          if (
            finalProcessedSearchData.outboundFlight &&
            finalProcessedSearchData.returnFlight
          ) {

            parsedLegs = [
              {
                flight: finalProcessedSearchData.outboundFlight,
                dep: finalProcessedSearchData.outboundFlight
                  ?.departureAirport || {
                  code: finalProcessedSearchData.from,
                  airportName:
                    finalProcessedSearchData.outboundFlight?.departure
                      ?.airportName ||
                    finalProcessedSearchData.outboundFlight?.departureAirport
                      ?.airportName ||
                    `Airport ${finalProcessedSearchData.from}`,
                  cityNames: [
                    finalProcessedSearchData.outboundFlight?.departure?.city ||
                      finalProcessedSearchData.outboundFlight?.departureAirport
                        ?.city ||
                      finalProcessedSearchData.from,
                  ],
                },
                arr: finalProcessedSearchData.outboundFlight
                  ?.arrivalAirport || {
                  code: finalProcessedSearchData.to,
                  airportName:
                    finalProcessedSearchData.outboundFlight?.arrival
                      ?.airportName ||
                    finalProcessedSearchData.outboundFlight?.arrivalAirport
                      ?.airportName ||
                    `Airport ${finalProcessedSearchData.to}`,
                  cityNames: [
                    finalProcessedSearchData.outboundFlight?.arrival?.city ||
                      finalProcessedSearchData.outboundFlight?.arrivalAirport
                        ?.city ||
                      finalProcessedSearchData.to,
                  ],
                },
                stops: Array.isArray(
                  finalProcessedSearchData.outboundFlight?.stopsList
                )
                  ? finalProcessedSearchData.outboundFlight.stopsList
                  : [],
                direction: "Outbound",
                segments: [],
              },
              {
                flight: finalProcessedSearchData.returnFlight,
                dep: finalProcessedSearchData.returnFlight
                  ?.departureAirport || {
                  code:
                    finalProcessedSearchData.returnFrom ||
                    finalProcessedSearchData.to,
                  airportName:
                    finalProcessedSearchData.returnFlight?.departure
                      ?.airportName ||
                    finalProcessedSearchData.returnFlight?.departureAirport
                      ?.airportName ||
                    `Airport ${
                      finalProcessedSearchData.returnFrom ||
                      finalProcessedSearchData.to
                    }`,
                  cityNames: [
                    finalProcessedSearchData.returnFlight?.departure?.city ||
                      finalProcessedSearchData.returnFlight?.departureAirport
                        ?.city ||
                      finalProcessedSearchData.returnFrom ||
                      finalProcessedSearchData.to,
                  ],
                },
                arr: finalProcessedSearchData.returnFlight?.arrivalAirport || {
                  code:
                    finalProcessedSearchData.returnTo ||
                    finalProcessedSearchData.from,
                  airportName:
                    finalProcessedSearchData.returnFlight?.arrival
                      ?.airportName ||
                    finalProcessedSearchData.returnFlight?.arrivalAirport
                      ?.airportName ||
                    `Airport ${
                      finalProcessedSearchData.returnTo ||
                      finalProcessedSearchData.from
                    }`,
                  cityNames: [
                    finalProcessedSearchData.returnFlight?.arrival?.city ||
                      finalProcessedSearchData.returnFlight?.arrivalAirport
                        ?.city ||
                      finalProcessedSearchData.returnTo ||
                      finalProcessedSearchData.from,
                  ],
                },
                stops: Array.isArray(
                  finalProcessedSearchData.returnFlight?.stopsList
                )
                  ? finalProcessedSearchData.returnFlight.stopsList
                  : [],
                direction: "Inbound",
                segments: [],
              },
            ];
          } else if (pairs.length > 0 && pairs[0].outbound && pairs[0].return) {
            parsedLegs = [
              {
                flight: pairs[0].outbound,
                dep: pairs[0].outbound.departureAirport,
                arr: pairs[0].outbound.arrivalAirport,
                stops: Array.isArray(pairs[0].outbound.stopsList)
                  ? pairs[0].outbound.stopsList
                  : [],
                direction: "Outbound",
                segments: [],
              },
              {
                flight: pairs[0].return,
                dep: pairs[0].return.departureAirport,
                arr: pairs[0].return.arrivalAirport,
                stops: Array.isArray(pairs[0].return.stopsList)
                  ? pairs[0].return.stopsList
                  : [],
                direction: "Inbound",
                segments: [],
              },
            ];
          } else if (
            processedSearchData.outboundFlight &&
            processedSearchData.returnFlight
          ) {

            parsedLegs = [
              {
                flight: processedSearchData.outboundFlight,
                dep: processedSearchData.outboundFlight.departure,
                arr: processedSearchData.outboundFlight.arrival,
                stops: Array.isArray(
                  processedSearchData.outboundFlight.stopsList
                )
                  ? processedSearchData.outboundFlight.stopsList
                  : [],
                direction: "Outbound",
                segments: [],
              },
              {
                flight: processedSearchData.returnFlight,
                dep: processedSearchData.returnFlight.departure,
                arr: processedSearchData.returnFlight.arrival,
                stops: Array.isArray(processedSearchData.returnFlight.stopsList)
                  ? processedSearchData.returnFlight.stopsList
                  : [],
                direction: "Inbound",
                segments: [],
              },
            ];
          } else {

          }
        } else if (tripType === "multi_city") {
          // Check if we have direct legs for multi-city
          if (_legsProp && Array.isArray(_legsProp) && _legsProp.length > 0) {

            parsedLegs = _legsProp.map((leg, index) => ({
              flight: leg,
              dep: leg.departureAirport ||
                _coordsMapProp?.[leg.departureAirportCode || leg.from] || {
                  code: leg.departureAirportCode || leg.from,
                  airportName:
                    leg.departureAirportName ||
                    `Airport ${leg.departureAirportCode || leg.from}`,
                  cityNames: [
                    leg.departureCity || leg.departureAirportCode || leg.from,
                  ],
                  airportCode: leg.departureAirportCode || leg.from,
                },
              arr: leg.arrivalAirport ||
                _coordsMapProp?.[leg.arrivalAirportCode || leg.to] || {
                  code: leg.arrivalAirportCode || leg.to,
                  airportName:
                    leg.arrivalAirportName ||
                    `Airport ${leg.arrivalAirportCode || leg.to}`,
                  cityNames: [
                    leg.arrivalCity || leg.arrivalAirportCode || leg.to,
                  ],
                  airportCode: leg.arrivalAirportCode || leg.to,
                },
              stops: Array.isArray(leg.stops) ? leg.stops : [],
              direction: `Chặng ${index + 1}`,
              segments: [],
            }));
          } else {
            const multiCityFlights = processedSearchData.multiCityFlights || [];
            parsedLegs = multiCityFlights.flatMap((seg, segIndex) =>
              (seg.content || [])
                .filter(
                  (flight) =>
                    flight && flight.departureAirport && flight.arrivalAirport
                )
                .map((flight, index) => ({
                  flight,
                  dep: flight.departureAirport,
                  arr: flight.arrivalAirport,
                  stops: Array.isArray(flight.stopsList)
                    ? flight.stopsList
                    : [],
                  direction: `Chặng ${segIndex + 1}`,
                  segments: [],
                }))
            );
          }
        }

        parsedLegs.forEach((leg, legIndex) => {

          allAirports.add(JSON.stringify(leg.dep));

          // Ensure leg.stops is an array before calling forEach
          const stopsArray = Array.isArray(leg.stops) ? leg.stops : [];
          stopsArray.forEach((stop) =>
            allAirports.add(
              JSON.stringify({
                ...stop,
                airportName: stop.airportName,
                code: stop.airportCode,
              })
            )
          );
          allAirports.add(JSON.stringify(leg.arr));
          let current = leg.dep;
          leg.segments = stopsArray.map((stop) => {
            const segment = {
              from: current,
              to: {
                ...stop,
                code: stop.airportCode,
                airportName: stop.airportName,
                timeFrom: stop.departureTime,
                timeTo: stop.arrivalTime,
              },
            };
            current = {
              ...stop,
              code: stop.airportCode,
              airportName: stop.airportName,
            };
            return segment;
          });
          leg.segments.push({
            from: current,
            to: leg.arr,
          });
        });

        const coordsPromises = Array.from(allAirports).map(async (str) => {
          const airport = JSON.parse(str);
          const coords = await getAirportCoords(airport);
          return { code: airport.airportCode || airport.code, coords };
        });

        const coordsResults = await Promise.allSettled(coordsPromises);
        const newCoordsMap = {};
        coordsResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value?.coords) {
            newCoordsMap[result.value.code] = result.value.coords;
          }
        });

        setCoordsMap(newCoordsMap);
        setMapLegs(parsedLegs);

      } catch (err) {
        setError("Không thể phân tích dữ liệu chuyến bay.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (finalProcessedSearchData) parseLegs();
  }, [finalProcessedSearchData, _legsProp, _coordsMapProp]);

  useEffect(() => {
    if (mapRef.current && Object.keys(coordsMap).length > 0) {
      const validPoints = Object.values(coordsMap)
        .filter((c) => c?.lat && c?.lon && !isNaN(c.lat) && !isNaN(c.lon))
        .map((c) => [c.lat, c.lon]);
      if (validPoints.length > 0) {
        mapRef.current.fitBounds(L.latLngBounds(validPoints), {
          padding: [50, 50],
          maxZoom: 10,
        });
      }
    }
  }, [coordsMap]);

  useEffect(() => {

    if (
      !mapRef.current ||
      !showFlightPath ||
      mapLegs.length === 0 ||
      Object.keys(mapCoordsMap).length === 0 ||
      loading
    ) {

      return;
    }

    const map = mapRef.current;
    const cleanup = [];

    mapLegs.forEach((leg, legIndex) => {

      const tripType = processedSearchData?.tripType || "one_way";
      const isInbound = leg.direction === "Inbound";
      const color =
        tripType === "round_trip"
          ? isInbound
            ? colors.inbound
            : colors.outbound
          : tripType === "multi_city"
          ? colors.multi[legIndex % colors.multi.length]
          : colors.one_way;
      const weight =
        tripType === "round_trip"
          ? isInbound
            ? 3
            : 5
          : tripType === "multi_city"
          ? 3
          : 4;
      const opacity =
        tripType === "round_trip"
          ? isInbound
            ? 0.7
            : 0.9
          : tripType === "multi_city"
          ? 0.8
          : 0.9;
      const dashArray =
        tripType === "round_trip" && isInbound ? "10, 10" : null;
      const bgGradient = `linear-gradient(135deg, ${color}, ${color}cc)`;
      const legPlaneIcon = createPlaneIcon(bgGradient);

      if (tripType === "round_trip" || tripType === "multi_city") {
        const segmentsArray = Array.isArray(leg.segments) ? leg.segments : [];
        const midPoint = segmentsArray[Math.floor(segmentsArray.length / 2)];
        if (
          midPoint &&
          mapCoordsMap[midPoint.from.code]?.lat &&
          mapCoordsMap[midPoint.from.code]?.lon
        ) {
          const directionLabel =
            tripType === "round_trip"
              ? isInbound
                ? "Chuyến về"
                : "Chuyến đi"
              : `Chặng ${legIndex + 1}`;
          const label = L.divIcon({
            html: `<div class="route-label bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border-2 text-sm font-bold text-center" style="color: ${color}; border-color: ${color}60;"><div class="flex items-center space-x-1"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg><span>${directionLabel}</span></div></div>`,
            className: "route-label-icon",
            iconSize: [100, 30],
            iconAnchor: [50, 15],
          });
          const routeLabel = L.marker(
            [
              mapCoordsMap[midPoint.from.code].lat,
              mapCoordsMap[midPoint.from.code].lon,
            ],
            { icon: label }
          ).addTo(map);
          cleanup.push(() => map.removeLayer(routeLabel));
        }
      }

      let fullPath = [];
      const segmentsArray = Array.isArray(leg.segments) ? leg.segments : [];

      segmentsArray.forEach((seg, segIndex) => {

        const fromCoords = mapCoordsMap[seg.from.code];
        const toCoords = mapCoordsMap[seg.to.code];
        if (fromCoords && toCoords && fromCoords !== toCoords) {

          const segPath = createCurvedPath(
            fromCoords,
            toCoords,
            100,
            leg.direction
          );
          fullPath = fullPath.concat(segPath.slice(1));
          const line = L.polyline(segPath, {
            weight,
            opacity,
            color,
            dashArray,
            className: "flight-path",
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);

          if (tripType === "round_trip") {
            const shadowLine = L.polyline(segPath, {
              weight: weight + 2,
              opacity: 0.3,
              color: "#000000",
              className: "flight-path-shadow",
              lineCap: "round",
              lineJoin: "round",
            }).addTo(map);
            cleanup.push(() => map.removeLayer(shadowLine));
          }
          cleanup.push(() => map.removeLayer(line));
        } else {

        }
      });

      if (fullPath.length > 0) {

        const animatedMarker = L.marker(fullPath[0], {
          icon: legPlaneIcon,
        }).addTo(map);
        cleanup.push(() => map.removeLayer(animatedMarker));
        let i = 0;
        const interval = setInterval(() => {
          if (i < fullPath.length - 1) {
            i++;
            animatedMarker.setLatLng(fullPath[i]);
          } else {
            i = 0;
            animatedMarker.setLatLng(fullPath[0]);
          }
        }, 50);
        cleanup.push(() => clearInterval(interval));

        animatedMarker.bindPopup(`
          <div class="p-4 text-center max-w-xs">
            <div class="flex items-center justify-center space-x-2 mb-3">
              <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background: ${bgGradient}; border: 2px solid ${color};"><svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(0deg);"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg></div>
              <div><div class="font-bold text-gray-800 text-lg">${
                leg.flight?.flightNumber || "N/A"
              }</div><div class="text-xs text-gray-500">${
          tripType === "round_trip"
            ? isInbound
              ? "Chuyến về"
              : "Chuyến đi"
            : "Chuyến bay"
        }</div></div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3 mb-3">
              <div class="text-sm text-gray-600 mb-1">${
                leg.flight?.aircraft || "Máy bay chưa xác định"
              }</div>
              <div class="text-xs text-gray-500">Thời gian bay: ${
                leg.flight?.duration ? leg.flight.duration + " phút" : "N/A"
              }</div>
              <div class="text-xs text-gray-500 mt-1">Hãng: ${
                leg.flight?.airline?.airlineName ||
                leg.flight?.airlineName ||
                "Hãng chưa xác định"
              }</div>
            </div>
            <div class="flex justify-between text-xs text-gray-600">
              <div class="text-left"><div class="font-semibold">${
                leg.dep?.airportCode || leg.dep?.code || "N/A"
              }</div><div>${(() => {
          const departureTime = leg.flight?.departureTime || leg?.departureTime;
          return departureTime && !isNaN(new Date(departureTime).getTime())
            ? new Date(departureTime).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "N/A";
        })()}</div></div>
              <div class="text-right"><div class="font-semibold">${
                leg.arr?.airportCode || leg.arr?.code || "N/A"
              }</div><div>${(() => {
          const arrivalTime = leg.flight?.arrivalTime || leg?.arrivalTime;
          return arrivalTime && !isNaN(new Date(arrivalTime).getTime())
            ? new Date(arrivalTime).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "N/A";
        })()}</div></div>
            </div>
          </div>
        `);
      }
    });

    return () => cleanup.forEach((fn) => fn());
  }, [
    mapRef,
    mapLegs,
    mapCoordsMap,
    finalProcessedSearchData,
    showFlightPath,
    loading,
  ]);

  const renderMarkers = useMemo(() => {

    if (mapLegs.length === 0 || Object.keys(mapCoordsMap).length === 0)
      return null;

    const airportData = new Map();
    mapLegs.forEach((leg, legIndex) => {

      if (leg.dep?.airportCode)
        airportData.set(leg.dep.airportCode, { ...leg.dep, type: "departure" });

      // Ensure leg.stops is an array before calling forEach
      const stopsArray = Array.isArray(leg.stops) ? leg.stops : [];

      stopsArray.forEach((stop, stopIndex) => {

        if (stop?.airportCode) {
          const existing = airportData.get(stop.airportCode) || {};
          airportData.set(stop.airportCode, {
            ...stop,
            type: existing.type === "departure" ? "connection" : "stop",
          });
        }
      });

      if (leg.arr?.airportCode) {
        const existing = airportData.get(leg.arr.airportCode) || {};
        airportData.set(leg.arr.airportCode, {
          ...leg.arr,
          type: existing.type === "departure" ? "connection" : "arrival",
        });
      }
    });

    return Array.from(airportData.entries())
      .map(([code, data]) => {
        const coords = mapCoordsMap[code];
        if (
          !coords?.lat ||
          !coords?.lon ||
          isNaN(coords.lat) ||
          isNaN(coords.lon)
        )
          return null;

        const icon =
          data.type === "departure"
            ? departureIcon
            : data.type === "arrival"
            ? arrivalIcon
            : stopIcon;

        return (
          <Marker
            key={`${code}-${data.type}`}
            position={[coords.lat, coords.lon]}
            icon={icon}
          >
            <Popup>
              <div className="p-4 min-w-[280px]">
                <div className="flex items-center space-x-2 mb-3">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      data.type === "departure"
                        ? "bg-green-500"
                        : data.type === "arrival"
                        ? "bg-red-500"
                        : data.type === "connection"
                        ? "bg-blue-500"
                        : "bg-yellow-500"
                    }`}
                  ></div>
                  <div className="text-lg font-bold text-gray-800">{code}</div>
                </div>
                <div className="text-sm text-gray-600 mb-3 font-medium">
                  {coords.name}
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded text-center font-medium mb-3 ${
                    data.type === "departure"
                      ? "text-green-700 bg-green-50"
                      : data.type === "arrival"
                      ? "text-red-700 bg-red-50"
                      : data.type === "connection"
                      ? "text-blue-700 bg-blue-50"
                      : "text-yellow-700 bg-yellow-50"
                  }`}
                >
                  {data.type === "departure"
                    ? "✈️ Sân bay khởi hành"
                    : data.type === "arrival"
                    ? "🎯 Sân bay đến"
                    : data.type === "connection"
                    ? "🔄 Điểm trung chuyển"
                    : "⏸️ Điểm dừng"}
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-600">Vị trí:</span>
                    <span className="font-mono text-gray-800">
                      {coords.lat?.toFixed(4) || "N/A"},{" "}
                      {coords.lon?.toFixed(4) || "N/A"}
                    </span>
                  </div>
                  {data.cityNames && data.cityNames.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Thành phố:</span>
                      <span className="font-medium text-gray-800">
                        {data.cityNames[0]}
                      </span>
                    </div>
                  )}
                  {data.countryName && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Quốc gia:</span>
                      <span className="font-medium text-gray-800">
                        {data.countryName}
                      </span>
                    </div>
                  )}
                  {data.airportName && data.airportName !== coords.name && (
                    <div className="flex items-center space-x-2">
                      <Plane className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-600">Tên sân bay:</span>
                      <span className="font-medium text-gray-800">
                        {data.airportName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <div className="bg-white px-3 py-2 rounded-lg shadow-md border border-gray-200 max-w-xs">
                <div className="font-semibold text-gray-800 mb-1">{code}</div>
                <div className="text-xs text-gray-600 mb-1">{coords.name}</div>
                <div className="text-xs text-gray-500 mb-1">
                  📍 {coords.lat?.toFixed(3) || "N/A"},{" "}
                  {coords.lon?.toFixed(3) || "N/A"}
                </div>
                <div className="text-xs mt-1 text-blue-600 font-medium">
                  {data.type === "departure"
                    ? "Khởi hành"
                    : data.type === "arrival"
                    ? "Đến"
                    : data.type === "connection"
                    ? "Trung chuyển"
                    : "Dừng"}
                </div>
              </div>
            </Tooltip>
          </Marker>
        );
      })
      .filter(Boolean);
  }, [legs, coordsMap]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 flex items-center justify-center z-10 rounded-xl">
          <div className="text-center bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20">
            <div className="relative mb-4">
              <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin mx-auto"></div>
              <div
                className="absolute inset-0 w-12 h-12 border-4 border-t-blue-500 rounded-full animate-spin"
                style={{ animationDirection: "reverse" }}
              ></div>
              <Plane className="absolute inset-0 w-6 h-6 text-blue-500 m-auto animate-pulse" />
            </div>
            <p className="text-lg font-semibold text-gray-800">
              Đang tải bản đồ...
            </p>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>
        </div>
      )}
      <MapContainer
        center={[16.0583, 108.2772]}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        className="rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {renderMarkers}
      </MapContainer>
      {!loading && (
        <MapToggleControls
          showFlightInfo={showFlightInfo}
          setShowFlightInfo={setShowFlightInfo}
          showLegend={showLegend}
          setShowLegend={setShowLegend}
        />
      )}
      {showFlightInfo && legs.length > 0 && !loading && (
        <FlightInfoOverlay
          processedSearchData={processedSearchData}
          legs={legs}
          coordsMap={coordsMap}
        />
      )}
      {showLegend && !loading && (
        <MapLegend
          tripType={processedSearchData?.tripType || "one_way"}
          legs={legs}
        />
      )}
    </div>
  );
};

export default FlightRouteMap;
