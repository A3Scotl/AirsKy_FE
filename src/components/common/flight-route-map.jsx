import React, { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Plane,
  MapPin,
  Clock,
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  Layers,
  Settings,
} from "lucide-react";

// Custom CSS for Leaflet-specific styling
const customMapStyles = `
  .leaflet-container {
    border-radius: 16px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.1);
  }

  .leaflet-popup-content-wrapper {
    border-radius: 12px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  .leaflet-popup-tip {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  }

  .leaflet-control-container .leaflet-control {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .airport-marker {
    transition: transform 0.3s ease;
  }

  .airport-marker:hover {
    transform: scale(1.1);
  }

  .flight-path {
    filter: drop-shadow(0 2px 6px rgba(37, 99, 235, 0.3));
    transition: opacity 0.3s ease;
  }

  .flight-path:hover {
    opacity: 1 !important;
    filter: drop-shadow(0 4px 12px rgba(37, 99, 235, 0.5));
  }

  .route-label {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-weight: 600;
    font-size: 11px;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
  }

  .route-label-icon {
    pointer-events: none;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }

  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
  }
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
  one_way: "#2563eb", // Blue
  outbound: "#2563eb", // Blue
  inbound: "#10b981", // Green
  multi: ["#2563eb", "#10b981", "#ef4444", "#a855f7", "#eab308"], // Blue, Green, Red, Purple, Yellow
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
  // Validate input coordinates
  if (
    !start ||
    !end ||
    !start.lat ||
    !start.lon ||
    !end.lat ||
    !end.lon ||
    isNaN(start.lat) ||
    isNaN(start.lon) ||
    isNaN(end.lat) ||
    isNaN(end.lon)
  ) {
    console.warn("Invalid coordinates provided to createCurvedPath:", {
      start,
      end,
    });
    return [];
  }

  const latlngs = [];
  const dLat = (end.lat - start.lat) / steps;
  const dLon = (end.lon - start.lon) / steps;
  const R = 6371; // Earth radius in km
  const lat1Rad = (start.lat * Math.PI) / 180;
  const lat2Rad = (end.lat * Math.PI) / 180;
  const dLonRad = ((end.lon - start.lon) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(dLonRad / 2) *
      Math.sin(dLonRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = start.lat + dLat * i;
    const lon = start.lon + dLon * i;
    const offsetSign = direction === "outbound" ? 1 : -1;
    const offsetLat = Math.sin(t * Math.PI) * (distance * 0.0008) * offsetSign;
    const offsetLon = Math.sin(t * Math.PI) * (distance * 0.0008) * offsetSign;
    latlngs.push([lat + offsetLat, lon + offsetLon]);
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
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getAirportCoords = async (airport) => {
  console.log("=== getAirportCoords called with ===", airport);
  // Handle both string and object inputs
  let airportName, airportCode, lat, lon;

  if (typeof airport === "string") {
    airportName = airport;
    airportCode = airport; // fallback
  } else if (airport && typeof airport === "object") {
    airportName = airport.airportName || airport.name;
    airportCode = airport.airportCode || airport.code;
    console.log("Parsed airport data:", { airportName, airportCode });
    // Check if coordinates are already available
    lat = airport.lat || airport.latitude;
    lon = airport.lon || airport.longitude;
  } else {
    console.log("Invalid airport input:", airport);
    return null;
  }

  if (!airportName) {
    console.log("No airportName available");
    return null;
  }

  // If coordinates are already available, use them
  if (lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))) {
    return {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      name: airportName,
    };
  }

  // Fallback coordinates for major airports
  const fallbackCoords = {
    // Vietnam
    HAN: { lat: 21.2212, lon: 105.807, name: "Hanoi" },
    SGN: { lat: 10.8188, lon: 106.652, name: "Ho Chi Minh City" },
    DAD: { lat: 16.0544, lon: 108.2022, name: "Da Nang" },
    CXR: { lat: 11.9981, lon: 109.2196, name: "Nha Trang" },
    VCA: { lat: 10.0858, lon: 105.7119, name: "Can Tho" },
    HPH: { lat: 20.8194, lon: 106.7247, name: "Hai Phong" },
    VII: { lat: 18.7376, lon: 105.6708, name: "Vinh" },
    PQC: { lat: 10.227, lon: 103.957, name: "Phu Quoc" },
    UIH: { lat: 13.955, lon: 109.042, name: "Quy Nhon" },
    HUI: { lat: 16.4017, lon: 107.7037, name: "Hue" },
    BKK: { lat: 13.69, lon: 100.7501, name: "Bangkok" },
    ICN: { lat: 37.5587, lon: 126.7945, name: "Seoul" },
    NRT: { lat: 35.765, lon: 140.3853, name: "Tokyo" },
    HKG: { lat: 22.308, lon: 113.9185, name: "Hong Kong" },
    SIN: { lat: 1.3644, lon: 103.9915, name: "Singapore" },
    KUL: { lat: 2.7456, lon: 101.7072, name: "Kuala Lumpur" },
    CGK: { lat: -6.1275, lon: 106.6537, name: "Jakarta" },
    MNL: { lat: 14.5086, lon: 121.0198, name: "Manila" },
    TPE: { lat: 25.0797, lon: 121.2342, name: "Taipei" },
    LAX: { lat: 33.9425, lon: -118.4081, name: "Los Angeles" },
    JFK: { lat: 40.6413, lon: -73.7781, name: "New York" },
    LHR: { lat: 51.4775, lon: -0.4614, name: "London" },
    CDG: { lat: 49.0097, lon: 2.5479, name: "Paris" },
    FRA: { lat: 50.0379, lon: 8.5622, name: "Frankfurt" },
    AMS: { lat: 52.3105, lon: 4.7683, name: "Amsterdam" },
    SYD: { lat: -33.9461, lon: 151.1772, name: "Sydney" },
  };

  // Check if we have fallback coordinates
  if (airportCode && fallbackCoords[airportCode]) {
    console.log(
      `✅ Using fallback coordinates for ${airportCode}:`,
      fallbackCoords[airportCode]
    );
    return fallbackCoords[airportCode];
  } else {
    console.log(
      `❌ No fallback coordinates found for ${airportCode}. Available fallbacks:`,
      Object.keys(fallbackCoords)
    );
  }

  // Try to fetch from external API as last resort with timeout and retry
  const fetchWithTimeout = async (url, timeout = 5000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "FlightBookingApp/1.0",
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
  };

  const fetchCoordinates = async (retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(
          `Fetching coordinates for ${airportName} from external API (attempt ${
            attempt + 1
          })`
        );
        const response = await fetchWithTimeout(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            airportName + " airport"
          )}&limit=1`,
          5000
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.length > 0 && data[0].lat && data[0].lon) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          if (!isNaN(lat) && !isNaN(lon)) {
            return {
              lat,
              lon,
              name: data[0].display_name.split(",")[0] || airportName,
            };
          }
        }

        // If API doesn't return valid data, try next attempt
        console.warn(
          `No valid coordinates found for ${airportName} (attempt ${
            attempt + 1
          })`
        );
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
      } catch (error) {
        console.error(
          `Error fetching airport coordinates (attempt ${attempt + 1}):`,
          error.message
        );

        // If it's the last attempt or a network error, break
        if (
          attempt === retries ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError")
        ) {
          break;
        }

        // Wait before retry for other errors
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    return null;
  };

  try {
    const result = await fetchCoordinates();
    if (result) {
      return result;
    }

    // If all attempts fail, return null
    console.warn(
      `Failed to fetch coordinates for ${airportName} after all attempts`
    );
    return null;
  } catch (error) {
    console.error("Error fetching airport coordinates:", error);
    // Return null instead of throwing to prevent app crash
    return null;
  }
};

// Map Control Panel Component
const FlightInfoOverlay = ({ processedSearchData, legs, coordsMap }) => {
  const tripType = processedSearchData?.tripType || "one_way";

  // Group legs by direction for round-trip
  const groupedLegs = legs.reduce((acc, leg, index) => {
    let direction = leg.direction;

    // For round-trip, ensure proper direction assignment
    if (tripType === "round_trip") {
      if (!direction) {
        // For round-trip, always assign Outbound since we only show outbound flight
        direction = "Outbound";
      } else if (direction === "Chuyến bay") {
        // Handle legacy data where direction might be generic
        direction = "Outbound";
      }
      console.log(`📍 Leg ${index} assigned direction: ${direction}`);
    } else if (tripType === "multi_city") {
      direction = direction || `Chặng ${index + 1}`;
    } else {
      direction = direction || "Chuyến bay";
    }

    if (!acc[direction]) acc[direction] = [];
    acc[direction].push({ ...leg, originalIndex: index });
    return acc;
  }, {});

  console.log("📊 Grouped legs result:", groupedLegs);
  console.log(
    "📈 Total legs by direction:",
    Object.keys(groupedLegs).map((key) => `${key}: ${groupedLegs[key].length}`)
  );

  const getTripTypeDisplay = () => {
    switch (tripType) {
      case "round_trip":
        return {
          title: "Chuyến bay khứ hồi",
          subtitle: "Chiều đi",
          icon: "↔️",
          color: "blue",
        };
      case "multi_city":
        return {
          title: "Chuyến bay đa thành phố",
          subtitle: `${legs.length} chặng bay`,
          icon: "🔄",
          color: "purple",
        };
      default:
        return {
          title: "Chuyến bay một chiều",
          subtitle: "Bay thẳng",
          icon: "→",
          color: "green",
        };
    }
  };

  const tripInfo = getTripTypeDisplay();

  return (
    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-gray-100/50 max-w-md transition-transform hover:scale-105 z-[1000] overflow-y-auto max-h-[80vh]">
      {/* Header with trip type */}
      <div className="flex items-center space-x-3 mb-6">
        <div
          className={`p-3 bg-gradient-to-br from-${tripInfo.color}-500 to-${tripInfo.color}-600 rounded-xl`}
        >
          <span className="text-2xl">{tripInfo.icon}</span>
        </div>
        <div>
          <h2 className="font-bold text-xl text-gray-800">{tripInfo.title}</h2>
          <p className="text-sm text-gray-600">{tripInfo.subtitle}</p>
        </div>
      </div>

      {/* Trip Summary for Round-trip */}
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

          {/* Outbound Flight Details */}
          {legs.find((l) => l.direction === "Outbound") && (
            <div className="bg-white/80 p-3 rounded-lg mb-3 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-800">
                    Chiều đi (Outbound)
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {
                    legs.find((l) => l.direction === "Outbound")?.flight
                      ?.duration
                  }{" "}
                  min
                </div>
              </div>
              <div className="text-sm text-gray-700 ml-4 mb-1 font-semibold">
                {legs.find((l) => l.direction === "Outbound")?.dep?.airportCode}{" "}
                →
                {legs.find((l) => l.direction === "Outbound")?.arr?.airportCode}
                <span className="text-xs text-blue-600 ml-2">
                  (
                  {
                    legs.find((l) => l.direction === "Outbound")?.flight
                      ?.flightNumber
                  }
                  )
                </span>
              </div>
              <div className="text-xs text-gray-500 ml-4 mb-1">
                {
                  legs.find((l) => l.direction === "Outbound")?.flight
                    ?.flightNumber
                }{" "}
                •
                {
                  legs.find((l) => l.direction === "Outbound")?.flight?.airline
                    ?.airlineName
                }
              </div>
              <div className="text-xs text-gray-500 ml-4">
                {legs.find((l) => l.direction === "Outbound")?.flight
                  ?.departureTime &&
                  new Date(
                    legs.find(
                      (l) => l.direction === "Outbound"
                    ).flight.departureTime
                  ).toLocaleDateString("vi-VN")}
              </div>
            </div>
          )}

          {/* Return Flight Details */}
          {legs.find((l) => l.direction === "Inbound") && (
            <div className="bg-white/80 p-3 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">
                    Chiều về (Inbound)
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {
                    legs.find((l) => l.direction === "Inbound")?.flight
                      ?.duration
                  }{" "}
                  min
                </div>
              </div>
              <div className="text-sm text-gray-700 ml-4 mb-1 font-semibold">
                {legs.find((l) => l.direction === "Inbound")?.dep?.airportCode}{" "}
                →{legs.find((l) => l.direction === "Inbound")?.arr?.airportCode}
                <span className="text-xs text-green-600 ml-2">
                  (
                  {
                    legs.find((l) => l.direction === "Inbound")?.flight
                      ?.flightNumber
                  }
                  )
                </span>
              </div>
              <div className="text-xs text-gray-500 ml-4 mb-1">
                {
                  legs.find((l) => l.direction === "Inbound")?.flight
                    ?.flightNumber
                }{" "}
                •
                {
                  legs.find((l) => l.direction === "Inbound")?.flight?.airline
                    ?.airlineName
                }
              </div>
              <div className="text-xs text-gray-500 ml-4">
                {legs.find((l) => l.direction === "Inbound")?.flight
                  ?.departureTime &&
                  new Date(
                    legs.find(
                      (l) => l.direction === "Inbound"
                    ).flight.departureTime
                  ).toLocaleDateString("vi-VN")}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(groupedLegs).map(([direction, directionLegs]) => (
          <div key={direction} className="space-y-3">
            {/* Direction Header */}
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

            {/* Legs in this direction */}
            {directionLegs.map((leg) => {
              const flight = leg.flight;
              const dep = leg.dep;
              const arr = leg.arr;
              const stops = leg.stops || [];
              const totalDistance = leg.segments.reduce(
                (sum, seg) =>
                  sum +
                  calculateDistance(
                    coordsMap[seg.from.airportCode]?.lat || 0,
                    coordsMap[seg.from.airportCode]?.lon || 0,
                    coordsMap[seg.to.airportCode]?.lat || 0,
                    coordsMap[seg.to.airportCode]?.lon || 0
                  ),
                0
              );

              return (
                <div
                  key={leg.originalIndex}
                  className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                    direction === "Outbound"
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
                      : direction === "Inbound"
                      ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
                      : "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
                  }`}
                >
                  {/* Flight Header */}
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
                        {flight.flightNumber}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {flight.duration} min
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold text-green-600">
                        {dep.airportCode}
                      </div>
                      <div className="text-xs text-gray-600">
                        {dep.cityNames?.[0] || dep.airportName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 bg-white/80 px-2 py-1 rounded">
                        {new Date(flight.departureTime).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>

                    <div className="flex items-center px-3">
                      <div
                        className={`w-8 h-0.5 ${
                          direction === "Outbound"
                            ? "bg-blue-400"
                            : direction === "Inbound"
                            ? "bg-green-400"
                            : "bg-gray-400"
                        } rounded-full`}
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
                        className={`w-8 h-0.5 ${
                          direction === "Outbound"
                            ? "bg-blue-400"
                            : direction === "Inbound"
                            ? "bg-green-400"
                            : "bg-gray-400"
                        } rounded-full`}
                      ></div>
                    </div>

                    <div className="text-center flex-1">
                      <div className="text-lg font-bold text-red-600">
                        {arr.airportCode}
                      </div>
                      <div className="text-xs text-gray-600">
                        {arr.cityNames?.[0] || arr.airportName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 bg-white/80 px-2 py-1 rounded">
                        {new Date(flight.arrivalTime).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Flight Info */}
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <div className="text-sm font-medium text-gray-800 mb-2">
                      Thông tin chuyến bay
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Mã chuyến:</span>
                        <span className="font-semibold text-gray-800 ml-1">
                          {flight.flightNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Thời gian bay:</span>
                        <span className="font-semibold text-gray-800 ml-1">
                          {flight.duration} min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Flight Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/80 p-2 rounded-lg">
                      <div className="flex items-center space-x-1 mb-1">
                        <Plane className="w-3 h-3 text-blue-500" />
                        <span className="font-medium text-gray-600">
                          Hãng bay
                        </span>
                      </div>
                      <div className="font-semibold text-blue-700">
                        {flight.airline?.airlineName}
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

                  {/* Stops */}
                  {stops.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-2">
                        Điểm dừng ({stops.length}):
                      </div>
                      {stops.map((stop, sIndex) => (
                        <div
                          key={sIndex}
                          className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-1"
                        >
                          {stop.airportCode} - {stop.airportName} (
                          {stop.stopDuration} min)
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

const MapLegend = ({ tripType, legs }) => {
  const getTripTypeInfo = () => {
    switch (tripType) {
      case "round_trip":
        return {
          title: "Chuyến bay khứ hồi",
          description: "Chuyến đi và về",
          icon: "↔️",
          color: "blue",
        };
      case "multi_city":
        return {
          title: "Chuyến bay đa thành phố",
          description: `${legs.length} chặng bay`,
          icon: "🔄",
          color: "purple",
        };
      default:
        return {
          title: "Chuyến bay một chiều",
          description: "Bay thẳng",
          icon: "→",
          color: "green",
        };
    }
  };

  const tripInfo = getTripTypeInfo();

  return (
    <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-lg p-4 rounded-2xl shadow-xl border border-gray-100/50 transition-transform hover:scale-105 z-[1000] max-w-xs">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-gray-800">
            Chú thích bản đồ
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Airport Markers */}
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

        {/* Flight Paths */}
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
                  <div className="text-xs text-gray-500">Outbound flight</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full opacity-75"
                  style={{ borderStyle: "dashed", borderWidth: "1px" }}
                ></div>
                <div>
                  <span className="text-xs text-gray-700 font-medium">
                    Chiều về
                  </span>
                  <div className="text-xs text-gray-500">Return flight</div>
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
                  <div className="text-xs text-gray-500">
                    Segment {index + 1}
                  </div>
                </div>
              </div>
            ))}

          {tripType === "one_way" && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
              <div>
                <span className="text-xs text-gray-700 font-medium">
                  Tuyến bay
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Round-trip specific info */}
        {tripType === "round_trip" && (
          <div className="pt-3 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Chi tiết chuyến khứ hồi
            </div>
            <div className="space-y-3 text-xs">
              {/* Outbound Flight Details */}
              {legs.find((l) => l.direction === "Outbound") && (
                <div className="bg-blue-50 p-2 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-blue-700">Chiều đi</span>
                  </div>
                  <div className="text-gray-600 ml-4 font-semibold">
                    {
                      legs.find((l) => l.direction === "Outbound")?.dep
                        ?.airportCode
                    }{" "}
                    →
                    {
                      legs.find((l) => l.direction === "Outbound")?.arr
                        ?.airportCode
                    }
                    <span className="text-xs text-blue-600 ml-2">
                      (
                      {
                        legs.find((l) => l.direction === "Outbound")?.flight
                          ?.flightNumber
                      }
                      )
                    </span>
                  </div>
                  <div className="text-gray-500 ml-4 text-xs">
                    {
                      legs.find((l) => l.direction === "Outbound")?.flight
                        ?.flightNumber
                    }
                  </div>
                </div>
              )}

              {/* Return Flight Details */}
              {legs.find((l) => l.direction === "Inbound") && (
                <div className="bg-green-50 p-2 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-700">Chiều về</span>
                  </div>
                  <div className="text-gray-600 ml-4 font-semibold">
                    {
                      legs.find((l) => l.direction === "Inbound")?.dep
                        ?.airportCode
                    }{" "}
                    →
                    {
                      legs.find((l) => l.direction === "Inbound")?.arr
                        ?.airportCode
                    }
                    <span className="text-xs text-green-600 ml-2">
                      (
                      {
                        legs.find((l) => l.direction === "Inbound")?.flight
                          ?.flightNumber
                      }
                      )
                    </span>
                  </div>
                  <div className="text-gray-500 ml-4 text-xs">
                    {
                      legs.find((l) => l.direction === "Inbound")?.flight
                        ?.flightNumber
                    }
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                <div className="text-center">
                  <div className="font-medium text-gray-700">
                    Tổng thời gian
                  </div>
                  <div className="text-gray-600">
                    {(() => {
                      const totalDuration = legs.reduce(
                        (sum, leg) => sum + (leg.flight?.duration || 0),
                        0
                      );
                      const hours = Math.floor(totalDuration / 60);
                      const minutes = totalDuration % 60;
                      return `${hours}h ${minutes}m`;
                    })()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-700">Số chuyến</div>
                  <div className="text-gray-600">{legs.length}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MapToggleControls = ({
  showFlightInfo,
  setShowFlightInfo,
  showLegend,
  setShowLegend,
}) => {
  return (
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
};

const FlightRouteMap = ({
  searchData,
  flightInfo,
  className = "",
  height = "400px",
  showFlightPath = true,
  showAirportInfo = true,
}) => {
  const mapRef = useRef(null);
  const [legs, setLegs] = useState([]);
  const [coordsMap, setCoordsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toggle states for overlays
  const [showFlightInfo, setShowFlightInfo] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  // Convert flightInfo to searchData format if needed
  const processedSearchData = useMemo(() => {
    console.log("🔍 PROCESSED SEARCH DATA INPUT:");
    console.log("- searchData:", searchData);
    console.log("- flightInfo:", flightInfo);

    if (searchData) {
      console.log("📊 Using searchData:");
      console.log("- Trip type:", searchData.tripType);
      console.log("- Has roundTripPairs:", !!searchData.roundTripPairs);
      console.log("- Has outboundFlight:", !!searchData.outboundFlight);
      console.log("- Has returnFlight:", !!searchData.returnFlight);
      if (searchData.roundTripPairs) {
        console.log(
          "- Round trip pairs count:",
          searchData.roundTripPairs.length
        );
        searchData.roundTripPairs.forEach((pair, index) => {
          console.log(`  Pair ${index}:`, {
            outbound: pair.outbound?.flightNumber,
            return: pair.return?.flightNumber,
          });
        });
      }
      return searchData;
    }
    if (flightInfo) {
      // Convert flightInfo to searchData format
      console.log("📋 Converting flightInfo to searchData format");
      return {
        tripType: "one_way", // Default to one_way for single flight
        oneWayFlights: {
          content: [flightInfo],
        },
      };
    }
    console.log("❌ No data available");
    return null;
  }, [searchData, flightInfo]);

  useEffect(() => {
    const parseLegs = async () => {
      console.log(
        "Parsing legs with processedSearchData:",
        processedSearchData
      );
      setLoading(true);
      setError(null);
      try {
        if (!processedSearchData) {
          console.log("No search data available");
          setLoading(false);
          return;
        }

        const tripType = processedSearchData.tripType;
        console.log("Trip type:", tripType);
        let parsedLegs = [];
        let allAirports = new Set();

        if (tripType === "one_way") {
          const flights = processedSearchData.oneWayFlights?.content || [];
          console.log("One way flights:", flights);
          parsedLegs = flights.map((flight) => ({
            flight,
            dep: flight.departureAirport,
            arr: flight.arrivalAirport,
            stops: flight.stopsList || [],
            direction: "Outbound",
            segments: [],
          }));
        } else if (tripType === "round_trip") {
          console.log("🔄 Processing round-trip data...");
          console.log("Full processedSearchData:", processedSearchData);
          console.log("Trip type from data:", processedSearchData.tripType);

          const pairs = processedSearchData.roundTripPairs || [];
          console.log("Round trip pairs:", pairs);
          console.log("Number of pairs:", pairs.length);

          // Handle different round trip data structures
          if (pairs.length > 0) {
            console.log(
              "📋 Using roundTripPairs structure - showing both flights"
            );
            console.log("🔍 DEBUG: First pair data:", pairs[0]);
            console.log("� DEBUG: Outbound flight data:", pairs[0]?.outbound);
            console.log("🔍 DEBUG: Return flight data:", pairs[0]?.return);
            const pair = pairs[0]; // Take first pair

            const outboundLeg = {
              flight: pair.outbound,
              dep: pair.outbound.departureAirport,
              arr: pair.outbound.arrivalAirport,
              stops: pair.outbound.stopsList || [],
              direction: "Outbound",
              segments: [],
            };

            const returnLeg = {
              flight: pair.return,
              dep: pair.return.departureAirport,
              arr: pair.return.arrivalAirport,
              stops: pair.return.stopsList || [],
              direction: "Inbound",
              segments: [],
            };

            parsedLegs = [outboundLeg, returnLeg];
            console.log("✅ Created 2 legs for round-trip:", parsedLegs.length);
            console.log("🔍 DEBUG: Outbound leg airports:", {
              dep: outboundLeg.dep?.airportCode,
              arr: outboundLeg.arr?.airportCode,
            });
            console.log("🔍 DEBUG: Return leg airports:", {
              dep: returnLeg.dep?.airportCode,
              arr: returnLeg.arr?.airportCode,
            });
          } else if (
            processedSearchData.outboundFlight &&
            processedSearchData.returnFlight
          ) {
            console.log(
              "✈️ Using direct outboundFlight structure - showing both flights"
            );
            console.log(
              "🔍 DEBUG: Outbound flight data:",
              processedSearchData.outboundFlight
            );
            console.log(
              "🔍 DEBUG: Return flight data:",
              processedSearchData.returnFlight
            );

            const outboundLeg = {
              flight: processedSearchData.outboundFlight,
              dep: processedSearchData.outboundFlight.departureAirport,
              arr: processedSearchData.outboundFlight.arrivalAirport,
              stops: processedSearchData.outboundFlight.stopsList || [],
              direction: "Outbound",
              segments: [],
            };

            const returnLeg = {
              flight: processedSearchData.returnFlight,
              dep: processedSearchData.returnFlight.departureAirport,
              arr: processedSearchData.returnFlight.arrivalAirport,
              stops: processedSearchData.returnFlight.stopsList || [],
              direction: "Inbound",
              segments: [],
            };

            parsedLegs = [outboundLeg, returnLeg];
            console.log("✅ Created 2 legs for round-trip:", parsedLegs.length);
            console.log("🔍 DEBUG: Outbound leg airports:", {
              dep: outboundLeg.dep?.airportCode,
              arr: outboundLeg.arr?.airportCode,
            });
            console.log("🔍 DEBUG: Return leg airports:", {
              dep: returnLeg.dep?.airportCode,
              arr: returnLeg.arr?.airportCode,
            });
          } else if (
            processedSearchData.flightNumber &&
            processedSearchData.flightNumber.includes("/")
          ) {
            // Handle combined flight number format like "VN3357 / VN6230" - split into two flights
            console.log(
              "🔀 Handling combined flight number format - splitting into two flights"
            );
            const flightNumbers = processedSearchData.flightNumber
              .split("/")
              .map((f) => f.trim());
            console.log("Flight numbers:", flightNumbers);

            // Check if we have valid separate flight data
            let outboundFlight = processedSearchData.outboundFlight;

            if (!outboundFlight && processedSearchData.outbound) {
              outboundFlight = processedSearchData.outbound;
            }

            // Only use separate flight data if both exist and have different airports
            if (
              outboundFlight &&
              outboundFlight.departureAirport &&
              outboundFlight.arrivalAirport &&
              outboundFlight.departureAirport.airportCode !==
                outboundFlight.arrivalAirport.airportCode
            ) {
              console.log("✅ Using valid outbound flight data");

              const outboundLeg = {
                flight: {
                  ...outboundFlight,
                  flightNumber: flightNumbers[0],
                },
                dep: outboundFlight.departureAirport,
                arr: outboundFlight.arrivalAirport,
                stops: outboundFlight.stopsList || [],
                direction: "Outbound",
                segments: [],
              };

              parsedLegs = [outboundLeg];
              console.log(
                "✅ Created 1 leg for round-trip (combined flight - outbound only):",
                parsedLegs.length
              );
            } else {
              // Create logical leg only if we have main airports
              console.log(
                "🔄 Creating logical outbound leg from main airports"
              );

              if (
                processedSearchData.departureAirport &&
                processedSearchData.arrivalAirport
              ) {
                const mainDep = processedSearchData.departureAirport;
                const mainArr = processedSearchData.arrivalAirport;

                const outboundLeg = {
                  flight: {
                    ...processedSearchData,
                    flightNumber: flightNumbers[0],
                    departureTime: processedSearchData.departureTime,
                    arrivalTime: processedSearchData.arrivalTime,
                  },
                  dep: mainDep,
                  arr: mainArr,
                  stops: processedSearchData.stopsList || [],
                  direction: "Outbound",
                  segments: [],
                };

                parsedLegs = [outboundLeg];
                console.log(
                  "✅ Created logical outbound leg:",
                  `${mainDep.airportCode}→${mainArr.airportCode}`
                );
              } else {
                console.error(
                  "❌ No airport information available for round-trip"
                );
                parsedLegs = [];
              }
            }
          } else {
            console.log("❌ No valid round-trip data structure found");
            console.log(
              "🔍 DEBUG: Available properties:",
              Object.keys(processedSearchData)
            );
            console.log(
              "🔍 DEBUG: Has outboundFlight:",
              !!processedSearchData.outboundFlight
            );
            console.log(
              "🔍 DEBUG: Has returnFlight:",
              !!processedSearchData.returnFlight
            );
            console.log(
              "🔍 DEBUG: Has roundTripPairs:",
              !!processedSearchData.roundTripPairs
            );

            // Try to create a single outbound leg as fallback
            if (processedSearchData.outboundFlight) {
              console.log("🔄 Creating fallback outbound leg");
              const outboundLeg = {
                flight: processedSearchData.outboundFlight,
                dep: processedSearchData.outboundFlight.departureAirport,
                arr: processedSearchData.outboundFlight.arrivalAirport,
                stops: processedSearchData.outboundFlight.stopsList || [],
                direction: "Outbound",
                segments: [],
              };
              parsedLegs = [outboundLeg];
              console.log("⚠️ Created 1 fallback leg for round-trip");
              console.log("🔍 DEBUG: Fallback leg airports:", {
                dep: outboundLeg.dep?.airportCode,
                arr: outboundLeg.arr?.airportCode,
              });
            } else {
              console.log("❌ No flight data available for round-trip");
              parsedLegs = [];
            }
          }

          console.log("🎯 FINAL RESULT FOR ROUND-TRIP:");
          console.log("- Trip type:", tripType);
          console.log("- Parsed legs count:", parsedLegs.length);
          console.log(
            "- Parsed legs details:",
            parsedLegs.map((leg) => ({
              direction: leg.direction,
              dep: leg.dep?.airportCode,
              arr: leg.arr?.airportCode,
              flightNumber: leg.flight?.flightNumber,
            }))
          );
        } else if (tripType === "multi_city") {
          const segments = processedSearchData.multiCityFlights || [];
          console.log("Multi city segments:", segments);
          parsedLegs = segments.flatMap((seg) =>
            seg.content.map((flight) => ({
              flight,
              dep: flight.departureAirport,
              arr: flight.arrivalAirport,
              stops: flight.stopsList || [],
              direction: "Outbound",
              segments: [],
            }))
          );
        }

        // Build segments for each leg and collect airports
        console.log("Building segments for", parsedLegs.length, "legs");
        parsedLegs.forEach((leg, legIndex) => {
          console.log(
            `Building segments for leg ${legIndex} (${leg.direction}):`,
            {
              dep: leg.dep?.airportCode,
              arr: leg.arr?.airportCode,
              stopsCount: leg.stops.length,
            }
          );

          allAirports.add(JSON.stringify(leg.dep));
          leg.stops.forEach((stop) =>
            allAirports.add(
              JSON.stringify({
                ...stop,
                airportName: stop.airportName,
                airportCode: stop.airportCode,
              })
            )
          );
          allAirports.add(JSON.stringify(leg.arr));

          let current = leg.dep;
          leg.segments = [];
          leg.stops.forEach((stop, stopIndex) => {
            const segment = {
              from: current,
              to: {
                ...stop,
                timeFrom: stop.departureTime,
                timeTo: stop.arrivalTime,
              },
            };
            leg.segments.push(segment);
            console.log(
              `Added segment ${stopIndex}: ${current?.airportCode} -> ${stop.airportCode}`
            );
            current = { ...stop };
          });

          const finalSegment = { from: current, to: leg.arr };
          leg.segments.push(finalSegment);
          console.log(
            `Added final segment: ${current?.airportCode} -> ${leg.arr?.airportCode}`
          );
          console.log(`Leg ${legIndex} has ${leg.segments.length} segments`);
        });

        // Fetch coordinates
        const uniqueAirports = Array.from(allAirports).map((str) =>
          JSON.parse(str)
        );
        console.log("Unique airports:", uniqueAirports);

        const coordsPromises = uniqueAirports.map(async (airport) => {
          console.log("Fetching coords for airport:", airport);
          try {
            const coords = await getAirportCoords(airport);
            console.log("Got coords:", coords);

            // If getAirportCoords returned null, create fallback coordinates
            if (!coords) {
              const fallbackCoords = {
                lat: 0,
                lon: 0,
                name:
                  airport.airportName ||
                  airport.name ||
                  airport.airportCode ||
                  airport.code,
                code: airport.airportCode || airport.code,
              };
              console.log(
                "Creating fallback coords for",
                airport.airportCode || airport.code,
                ":",
                fallbackCoords
              );
              return {
                code: airport.airportCode || airport.code,
                coords: fallbackCoords,
              };
            }

            return { code: airport.airportCode || airport.code, coords };
          } catch (error) {
            console.error(
              `Failed to get coords for airport ${
                airport.airportCode || airport.code
              }:`,
              error
            );
            // Create fallback coordinates on error
            const fallbackCoords = {
              lat: 0,
              lon: 0,
              name:
                airport.airportName ||
                airport.name ||
                airport.airportCode ||
                airport.code,
              code: airport.airportCode || airport.code,
            };
            console.log(
              "Creating fallback coords on error for",
              airport.airportCode || airport.code,
              ":",
              fallbackCoords
            );
            return {
              code: airport.airportCode || airport.code,
              coords: fallbackCoords,
            };
          }
        });

        const coordsResults = await Promise.allSettled(coordsPromises);
        console.log("Coords results:", coordsResults);

        const newCoordsMap = {};
        coordsResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            newCoordsMap[result.value.code] = result.value.coords;
          } else if (result.status === "rejected") {
            // Handle rejected promises with fallback
            const airport = uniqueAirports.find(
              (a) => (a.airportCode || a.code) === result.reason?.code
            );
            if (airport) {
              const fallbackCoords = {
                lat: 0,
                lon: 0,
                name:
                  airport.airportName ||
                  airport.name ||
                  airport.airportCode ||
                  airport.code,
                code: airport.airportCode || airport.code,
              };
              newCoordsMap[airport.airportCode || airport.code] =
                fallbackCoords;
              console.warn(
                `Using fallback coordinates for ${
                  airport.airportCode || airport.code
                }`
              );
            }
          }
        });

        console.log("Final coords map:", newCoordsMap);

        // Always set coords map, even if some coordinates are fallback
        setCoordsMap(newCoordsMap);
        setLegs(parsedLegs);

        console.log("🎯 FINAL SUMMARY:");
        console.log("- Trip type:", tripType);
        console.log("- Total legs created:", parsedLegs.length);
        console.log(
          "- Legs details:",
          parsedLegs.map((leg, index) => ({
            index,
            direction: leg.direction,
            dep: leg.dep?.airportCode,
            arr: leg.arr?.airportCode,
            flightNumber: leg.flight?.flightNumber,
            segments: leg.segments?.length || 0,
          }))
        );
        console.log("- Total airports collected:", allAirports.size);
        console.log(
          "- Airports:",
          Array.from(allAirports).map((str) => {
            const airport = JSON.parse(str);
            return airport.airportCode || airport.code;
          })
        );
      } catch (err) {
        setError("Không thể phân tích dữ liệu chuyến bay.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (processedSearchData) parseLegs();
  }, [processedSearchData]);

  useEffect(() => {
    if (mapRef.current && Object.keys(coordsMap).length > 0) {
      // Filter out null/undefined coordinates before creating bounds
      const validPoints = Object.values(coordsMap)
        .filter((c) => c && c.lat && c.lon && !isNaN(c.lat) && !isNaN(c.lon))
        .map((c) => [c.lat, c.lon]);

      console.log("Valid points for bounds:", validPoints);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      } else {
        console.warn("No valid coordinates available for map bounds");
      }
    }
  }, [coordsMap]);

  useEffect(() => {
    if (
      mapRef.current &&
      showFlightPath &&
      legs.length > 0 &&
      Object.keys(coordsMap).length > 0 &&
      !loading
    ) {
      const map = mapRef.current;
      const cleanup = [];

      legs.forEach((leg, legIndex) => {
        const tripType = processedSearchData?.tripType || "one_way";
        const curveDirection = "outbound";

        console.log(`🛩️ Rendering leg ${legIndex}: ${leg.direction}`);
        console.log(
          `Route: ${leg.dep?.airportCode} -> ${leg.arr?.airportCode}`
        );

        // Enhanced color and styling based on trip type
        let color, weight, opacity, dashArray;
        if (tripType === "round_trip") {
          // For round-trip, use different colors for outbound and inbound
          if (isInbound) {
            color = colors.inbound;
            weight = 3;
            opacity = 0.7;
            dashArray = "10, 10"; // Dashed for inbound
          } else {
            color = colors.outbound;
            weight = 5;
            opacity = 0.9;
            dashArray = null; // Solid for outbound
          }
          console.log(`🎨 ${leg.direction} color: ${color}, weight: ${weight}`);
        } else if (tripType === "multi_city") {
          color = colors.multi[legIndex % colors.multi.length];
          weight = 3;
          opacity = 0.8;
          dashArray = null;
        } else {
          color = colors.one_way;
          weight = 4;
          opacity = 0.9;
          dashArray = null;
        }

        const bgGradient = `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`;
        const legPlaneIcon = createPlaneIcon(bgGradient);

        // Add route label for round-trip and multi-city trips
        if (tripType === "round_trip" || tripType === "multi_city") {
          const midPoint = leg.segments[Math.floor(leg.segments.length / 2)];
          if (midPoint) {
            const midCoords = coordsMap[midPoint.from.airportCode];
            if (midCoords && midCoords.lat && midCoords.lon) {
              const directionLabel =
                tripType === "round_trip"
                  ? isInbound
                    ? "Chuyến về"
                    : "Chuyến đi"
                  : `Chặng ${legIndex + 1}`;

              const label = L.divIcon({
                html: `<div class="route-label bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border-2 text-sm font-bold text-center" style="color: ${color}; border-color: ${color}60; background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%));">
                  <div class="flex items-center space-x-1">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                    <span>${directionLabel}</span>
                  </div>
                </div>`,
                className: "route-label-icon",
                iconSize: [100, 30],
                iconAnchor: [50, 15],
              });

              const routeLabel = L.marker([midCoords.lat, midCoords.lon], {
                icon: label,
              }).addTo(map);
              cleanup.push(() => map.removeLayer(routeLabel));
            } else {
              console.warn(
                `No coordinates available for route label at ${midPoint.from.airportCode}`
              );
            }
          }
        }

        // Full path for animation
        let fullPath = [];
        leg.segments.forEach((seg, segIndex) => {
          const fromCoords = coordsMap[seg.from.airportCode];
          const toCoords = coordsMap[seg.to.airportCode];
          if (fromCoords && toCoords && fromCoords !== toCoords) {
            const segPath = createCurvedPath(
              fromCoords,
              toCoords,
              100,
              curveDirection
            );
            fullPath = fullPath.concat(segPath.slice(1)); // Concat without duplicating points

            // Draw line for segment with enhanced styling and shadow effect
            const line = L.polyline(segPath, {
              weight,
              opacity,
              color,
              dashArray,
              className: "flight-path",
              lineCap: "round",
              lineJoin: "round",
            }).addTo(map);

            // Add shadow effect for better visibility
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
          }
        });

        if (fullPath.length > 0) {
          // Enhanced animated marker with direction indicator
          const markerIcon = L.divIcon({
            html: `<div class="plane-marker" style="background: ${bgGradient}; border: 2px solid ${color}; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              <svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(0deg);">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
            </div>`,
            className: "plane-marker-icon",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          let i = 0;
          const animatedMarker = L.marker(fullPath[0], {
            icon: markerIcon,
          }).addTo(map);
          cleanup.push(() => map.removeLayer(animatedMarker));

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
                <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background: ${bgGradient}; border: 2px solid ${color};">
                  <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(0deg);">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>
                </div>
                <div>
                  <div class="font-bold text-gray-800 text-lg">${
                    leg.flight.flightNumber
                  }</div>
                  <div class="text-xs text-gray-500">${
                    tripType === "round_trip"
                      ? isInbound
                        ? "Chuyến về"
                        : "Chuyến đi"
                      : "Chuyến bay"
                  }</div>
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3 mb-3">
                <div class="text-sm text-gray-600 mb-1">${
                  leg.flight.aircraft.aircraftName
                }</div>
                <div class="text-xs text-gray-500">Thời gian bay: ${
                  leg.flight.duration
                } phút</div>
                <div class="text-xs text-gray-500 mt-1">Hãng: ${
                  leg.flight.airline.airlineName
                }</div>
              </div>
              <div class="flex justify-between text-xs text-gray-600">
                <div class="text-left">
                  <div class="font-semibold">${leg.dep.airportCode}</div>
                  <div>${new Date(leg.flight.departureTime).toLocaleTimeString(
                    "vi-VN",
                    { hour: "2-digit", minute: "2-digit" }
                  )}</div>
                </div>
                <div class="text-right">
                  <div class="font-semibold">${leg.arr.airportCode}</div>
                  <div>${new Date(leg.flight.arrivalTime).toLocaleTimeString(
                    "vi-VN",
                    { hour: "2-digit", minute: "2-digit" }
                  )}</div>
                </div>
              </div>
            </div>
          `);
        }
      });

      return () => cleanup.forEach((fn) => fn());
    }
  }, [mapRef, legs, coordsMap, processedSearchData, showFlightPath, loading]);

  // Render markers for all airports
  const renderMarkers = useMemo(() => {
    console.log("=== RENDER MARKERS CALLED ===");
    console.log("Legs:", legs);
    console.log("CoordsMap:", coordsMap);
    console.log("Trip type:", processedSearchData?.tripType);

    if (legs.length === 0 || Object.keys(coordsMap).length === 0) {
      console.log("No legs or coords available");
      return null;
    }

    const allAirports = new Set();
    legs.forEach((leg) => {
      if (leg.dep?.airportCode) allAirports.add(leg.dep.airportCode);
      leg.stops?.forEach((stop) => {
        if (stop?.airportCode) allAirports.add(stop.airportCode);
      });
      if (leg.arr?.airportCode) allAirports.add(leg.arr.airportCode);
    });

    console.log("All airports collected:", Array.from(allAirports));
    console.log("Number of markers to render:", allAirports.size);

    return Array.from(allAirports)
      .map((code) => {
        const coords = coordsMap[code];
        console.log(`Processing airport ${code}:`, coords);

        if (!coords) {
          console.log(`No coordinates for ${code}`);
          return null;
        }

        // Check if this is a fallback coordinate (lat/lon are 0)
        const isFallback = coords.lat === 0 && coords.lon === 0;

        // Additional validation for coordinate values - allow fallback coordinates
        if (
          !coords.lat ||
          !coords.lon ||
          ((isNaN(coords.lat) || isNaN(coords.lon)) && !isFallback)
        ) {
          console.log(`Invalid coordinates for ${code}:`, coords);
          return null;
        }

        // Determine airport type for different icons
        let airportType = "stop";
        let isDeparture = false;
        let isArrival = false;

        legs.forEach((leg) => {
          if (leg.dep?.airportCode === code) isDeparture = true;
          if (leg.arr?.airportCode === code) isArrival = true;
        });

        if (isDeparture && isArrival) {
          airportType = "connection"; // For round-trip or multi-city connections
        } else if (isDeparture) {
          airportType = "departure";
        } else if (isArrival) {
          airportType = "arrival";
        }

        // Select appropriate icon - handle fallback coordinates differently
        let icon;
        if (isFallback) {
          // Use a different icon for fallback coordinates
          icon = L.divIcon({
            html: `<div class="w-6 h-6 bg-orange-500 border-2 border-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
              ?
            </div>`,
            className: "fallback-marker-icon",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
        } else {
          switch (airportType) {
            case "departure":
              icon = departureIcon;
              break;
            case "arrival":
              icon = arrivalIcon;
              break;
            case "connection":
              icon = stopIcon; // Use stop icon for connections
              break;
            default:
              icon = stopIcon;
          }
        }

        return (
          <Marker key={code} position={[coords.lat, coords.lon]} icon={icon}>
            <Popup>
              <div className="p-4 min-w-[250px]">
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isFallback
                        ? "bg-orange-500"
                        : airportType === "departure"
                        ? "bg-green-500"
                        : airportType === "arrival"
                        ? "bg-red-500"
                        : airportType === "connection"
                        ? "bg-blue-500"
                        : "bg-yellow-500"
                    }`}
                  ></div>
                  <div className="text-lg font-bold text-gray-800">{code}</div>
                  {isFallback && (
                    <div className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                      ⚠️ Tọa độ dự phòng
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-2">{coords.name}</div>
                <div
                  className={`text-xs px-2 py-1 rounded ${
                    isFallback
                      ? "text-orange-600 bg-orange-50"
                      : "text-blue-600 bg-blue-50"
                  }`}
                >
                  {isFallback
                    ? "📍 Tọa độ dự phòng - cần cập nhật"
                    : airportType === "departure"
                    ? "✈️ Sân bay khởi hành"
                    : airportType === "arrival"
                    ? "🎯 Sân bay đến"
                    : airportType === "connection"
                    ? "🔄 Điểm trung chuyển"
                    : "⏸️ Điểm dừng"}
                </div>
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <div className="bg-white px-3 py-2 rounded-lg shadow-md border border-gray-200">
                <div className="font-semibold text-gray-800">{code}</div>
                <div className="text-xs text-gray-600">{coords.name}</div>
                <div
                  className={`text-xs mt-1 ${
                    isFallback ? "text-orange-600" : "text-blue-600"
                  }`}
                >
                  {isFallback
                    ? "⚠️ Dự phòng"
                    : airportType === "departure"
                    ? "Khởi hành"
                    : airportType === "arrival"
                    ? "Đến"
                    : airportType === "connection"
                    ? "Trung chuyển"
                    : "Dừng"}
                </div>
              </div>
            </Tooltip>
          </Marker>
        );
      })
      .filter(Boolean); // Remove null markers
  }, [legs, coordsMap, processedSearchData]);

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

      {/* Toggle Controls */}
      {!loading && (
        <MapToggleControls
          showFlightInfo={showFlightInfo}
          setShowFlightInfo={setShowFlightInfo}
          showLegend={showLegend}
          setShowLegend={setShowLegend}
        />
      )}

      {/* Conditional Overlays */}
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
