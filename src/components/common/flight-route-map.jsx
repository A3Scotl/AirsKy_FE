import React, { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Plane, MapPin, Clock, ArrowRight } from "lucide-react";

// Function to create curved flight path - Enhanced
const createCurvedPath = (start, end, steps = 100) => {
  const latlngs = [];
  const dLat = (end.lat - start.lat) / steps;
  const dLon = (end.lon - start.lon) / steps;

  // Calculate great circle distance for better curve
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

  // Create smooth curve with multiple control points
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = start.lat + dLat * i;
    const lon = start.lon + dLon * i;

    // Add sinusoidal offset for natural curve
    const offsetLat = Math.sin(t * Math.PI) * (distance * 0.001);
    const offsetLon = Math.sin(t * Math.PI) * (distance * 0.001);

    latlngs.push([lat + offsetLat, lon + offsetLon]);
  }

  return latlngs;
};

// Fix cho icon markers trong React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom airport icons - Professional design
const departureIcon = new L.DivIcon({
  html: `<div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); border: 3px solid #ffffff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4), 0 2px 4px rgba(0,0,0,0.1); position: relative;">
    <div style="background: #ffffff; border-radius: 50%; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center;">
      <svg width="8" height="8" fill="#059669" viewBox="0 0 24 24">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    </div>
    <div style="position: absolute; top: -2px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 6px solid #ffffff;"></div>
  </div>`,
  className: "departure-marker",
  iconSize: [28, 32],
  iconAnchor: [14, 32],
  popupAnchor: [0, -32],
});

const arrivalIcon = new L.DivIcon({
  html: `<div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border: 3px solid #ffffff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4), 0 2px 4px rgba(0,0,0,0.1); position: relative;">
    <div style="background: #ffffff; border-radius: 50%; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center;">
      <svg width="8" height="8" fill="#dc2626" viewBox="0 0 24 24">
        <path d="M9 11H1l4-4h14l-4 4H9zm-4 2h4v6l1.5 1.5L12 19l1.5 1.5L15 19v-6h4l-4-4H1l4 4z"/>
      </svg>
    </div>
    <div style="position: absolute; top: -2px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 6px solid #ffffff;"></div>
  </div>`,
  className: "arrival-marker",
  iconSize: [28, 32],
  iconAnchor: [14, 32],
  popupAnchor: [0, -32],
});

// Professional plane icon
const planeIcon = new L.DivIcon({
  html: `<div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border: 2px solid #ffffff; border-radius: 8px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4), 0 2px 4px rgba(0,0,0,0.1); transform: rotate(45deg);">
    <svg width="12" height="12" fill="#ffffff" viewBox="0 0 24 24" style="transform: rotate(-45deg);">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
  </div>`,
  className: "plane-marker",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Function to get airport coordinates from external API
const getAirportCoords = async (name) => {
  if (!name || name === "N/A") return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        name + " airport"
      )}&limit=1`
    );
    const data = await response.json();
    if (data.length > 0 && data[0].lat && data[0].lon) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        return {
          lat,
          lon,
          name: data[0].display_name.split(",")[0] || name,
        };
      }
    }
  } catch (error) {
    console.error("Error fetching airport coordinates:", error);
  }
  return null;
};

// Hàm tính khoảng cách Haversine
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính Trái Đất (km)
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

// Hàm tính điểm giữa để đặt icon máy bay (dùng cho popup)
const getMidpoint = (lat1, lon1, lat2, lon2) => {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const lon1Rad = (lon1 * Math.PI) / 180;

  const Bx = Math.cos(lat2Rad) * Math.cos(dLon);
  const By = Math.cos(lat2Rad) * Math.sin(dLon);

  const lat3 = Math.atan2(
    Math.sin(lat1Rad) + Math.sin(lat2Rad),
    Math.sqrt((Math.cos(lat1Rad) + Bx) * (Math.cos(lat1Rad) + Bx) + By * By)
  );
  const lon3 = lon1Rad + Math.atan2(By, Math.cos(lat1Rad) + Bx);

  return {
    lat: (lat3 * 180) / Math.PI,
    lon: (lon3 * 180) / Math.PI,
  };
};

const FlightRouteMap = ({
  flightInfo,
  className = "",
  height = "400px",
  showFlightPath = true,
  showAirportInfo = true,
}) => {
  const mapRef = useRef(null);
  const [departureCoords, setDepartureCoords] = useState(null);
  const [arrivalCoords, setArrivalCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch airport coordinates
  useEffect(() => {
    const fetchCoords = async () => {
      const depName = flightInfo?.departure?.airportName;
      const arrName = flightInfo?.arrival?.airportName;

      if (depName && arrName) {
        const depCoords = await getAirportCoords(depName);
        const arrCoords = await getAirportCoords(arrName);
        setDepartureCoords(depCoords);
        setArrivalCoords(arrCoords);
      }
      setLoading(false);
    };

    fetchCoords();
  }, [flightInfo]);

  const distance = useMemo(() => {
    if (!departureCoords || !arrivalCoords) return 0;
    return calculateDistance(
      departureCoords.lat,
      departureCoords.lon,
      arrivalCoords.lat,
      arrivalCoords.lon
    );
  }, [departureCoords, arrivalCoords]);

  // Fit map to show both airports
  useEffect(() => {
    if (mapRef.current && departureCoords && arrivalCoords) {
      const bounds = L.latLngBounds([
        [departureCoords.lat, departureCoords.lon],
        [arrivalCoords.lat, arrivalCoords.lon],
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [departureCoords, arrivalCoords]);

  // Animation cho máy bay
  useEffect(() => {
    if (
      mapRef.current &&
      showFlightPath &&
      departureCoords &&
      arrivalCoords &&
      !loading &&
      !isNaN(departureCoords.lat) &&
      !isNaN(departureCoords.lon) &&
      !isNaN(arrivalCoords.lat) &&
      !isNaN(arrivalCoords.lon)
    ) {
      // Additional check
      if (
        !departureCoords.lat ||
        !departureCoords.lon ||
        !arrivalCoords.lat ||
        !arrivalCoords.lon
      )
        return;

      const map = mapRef.current;
      const pathLatLngs = createCurvedPath(departureCoords, arrivalCoords);
      const line = L.polyline(pathLatLngs, {
        weight: 4,
        opacity: 0.9,
        color: "#2563eb",
        lineCap: "round",
        lineJoin: "round",
        shadow: {
          color: "#000000",
          opacity: 0.3,
          offset: [2, 2],
        },
      }).addTo(map);

      const latlngs = line.getLatLngs();
      if (
        latlngs &&
        latlngs.length > 0 &&
        latlngs[0] &&
        latlngs[0].lat !== null &&
        latlngs[0].lon !== null
      ) {
        // Simple animation using setInterval
        let i = 0;
        const animatedMarker = L.marker(latlngs[0], { icon: planeIcon }).addTo(
          map
        );

        const interval = setInterval(() => {
          if (i < latlngs.length - 1) {
            i++;
            animatedMarker.setLatLng(latlngs[i]);
          } else {
            i = 0; // Loop back to start
            animatedMarker.setLatLng(latlngs[0]);
          }
        }, 50); // Animation speed

        // Popup cho animated marker
        animatedMarker.bindPopup(`
          <div className="text-center p-2">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
              <span className="font-semibold text-blue-700">${
                flightInfo?.flightNumber || "VN7210"
              }</span>
            </div>
            <div className="text-sm text-gray-600">${
              flightInfo?.aircraft || "Airbus A321"
            }</div>
            <div className="text-xs text-gray-500 mt-1">Khoảng cách: ${distance.toFixed(
              0
            )} km</div>
          </div>
        `);

        // Cleanup khi component unmount
        return () => {
          clearInterval(interval);
          map.removeLayer(line);
          map.removeLayer(animatedMarker);
        };
      } else {
        // Fallback: just add the line without animation
        return () => {
          map.removeLayer(line);
        };
      }
    }
  }, [
    mapRef,
    departureCoords,
    arrivalCoords,
    flightInfo,
    distance,
    showFlightPath,
    loading,
  ]);

  // Default center (giữa Việt Nam)
  const center = [16.0583, 108.2772];

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Đang tải bản đồ...</p>
          </div>
        </div>
      )}
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        className="rounded-xl border-2 border-gray-200 shadow-2xl"
      >
        {/* OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Departure Airport Marker */}
        {departureCoords && (
          <Marker
            position={[departureCoords.lat, departureCoords.lon]}
            icon={departureIcon}
          >
            <Popup className="airport-popup">
              <div className="min-w-[280px] p-4 bg-white rounded-lg shadow-xl border-0">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="font-bold text-green-700 text-lg">
                    KHỞI HÀNH
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="font-bold text-xl text-gray-800">
                    {flightInfo?.departure?.city || "TP. Hồ Chí Minh"}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {departureCoords.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Mã sân bay: {flightInfo?.departure?.code || "SGN"}
                  </div>
                  <div className="flex items-center space-x-4 text-sm mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">
                        {flightInfo?.departure?.time || "05:05"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-xs">
                        {departureCoords.lat.toFixed(4)},{" "}
                        {departureCoords.lon.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
            <Tooltip
              direction="top"
              offset={[0, -15]}
              opacity={0.95}
              className="custom-tooltip"
            >
              <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
                <div className="font-bold text-gray-800 text-center">
                  {flightInfo?.departure?.city || "TP. Hồ Chí Minh"}
                </div>
                <div className="text-xs text-gray-600 text-center mt-1">
                  Khởi hành: {flightInfo?.departure?.time || "05:05"}
                </div>
              </div>
            </Tooltip>
          </Marker>
        )}
        {/* Arrival Airport Marker */}
        {arrivalCoords && (
          <Marker
            position={[arrivalCoords.lat, arrivalCoords.lon]}
            icon={arrivalIcon}
          >
            <Popup className="airport-popup">
              <div className="min-w-[280px] p-4 bg-white rounded-lg shadow-xl border-0">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span className="font-bold text-red-700 text-lg">
                    ĐẾN NƠI
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="font-bold text-xl text-gray-800">
                    {flightInfo?.arrival?.city || "Hà Nội"}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {arrivalCoords.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Mã sân bay: {flightInfo?.arrival?.code || "HAN"}
                  </div>
                  <div className="flex items-center space-x-4 text-sm mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">
                        {flightInfo?.arrival?.time || "07:10"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-xs">
                        {arrivalCoords.lat.toFixed(4)},{" "}
                        {arrivalCoords.lon.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
            <Tooltip
              direction="top"
              offset={[0, -15]}
              opacity={0.95}
              className="custom-tooltip"
            >
              <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
                <div className="font-bold text-gray-800 text-center">
                  {flightInfo?.arrival?.city || "Hà Nội"}
                </div>
                <div className="text-xs text-gray-600 text-center mt-1">
                  Đến: {flightInfo?.arrival?.time || "07:10"}
                </div>
              </div>
            </Tooltip>
          </Marker>
        )}{" "}
        {/* Flight Path được xử lý trong useEffect */}
      </MapContainer>

      {/* Flight Info Overlay */}
      {showAirportInfo && departureCoords && arrivalCoords && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md p-5 rounded-xl shadow-2xl border border-gray-200 max-w-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plane className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <span className="font-bold text-gray-800 text-lg">
                {flightInfo?.flightNumber || "VN7210"}
              </span>
              <div className="text-xs text-gray-500">
                {flightInfo?.aircraft || "Airbus A321"}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="text-center">
                <span className="text-green-600 font-bold text-lg">
                  {flightInfo?.departure?.code || "SGN"}
                </span>
                <div className="text-xs text-gray-600 mt-1">
                  {flightInfo?.departure?.time || "05:05"}
                </div>
              </div>
              <div className="flex-1 mx-4 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-0.5 bg-blue-400"></div>
                  <ArrowRight className="w-4 h-4 text-blue-400" />
                  <div className="w-8 h-0.5 bg-blue-400"></div>
                </div>
              </div>
              <div className="text-center">
                <span className="text-red-600 font-bold text-lg">
                  {flightInfo?.arrival?.code || "HAN"}
                </span>
                <div className="text-xs text-gray-600 mt-1">
                  {flightInfo?.arrival?.time || "07:10"}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Thời gian bay:</span>
                <span className="font-semibold text-blue-700">
                  {flightInfo?.duration || "2g 05p"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Khoảng cách:</span>
                <span className="font-semibold text-blue-700">
                  {distance.toFixed(0)} km
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-gray-200">
        <div className="text-sm font-bold text-gray-800 mb-3">Chú thích</div>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-gradient-to-br from-green-600 to-green-700 rounded-full border-2 border-white shadow-lg"></div>
            <span className="text-sm text-gray-700">Sân bay khởi hành</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-gradient-to-br from-red-600 to-red-700 rounded-full border-2 border-white shadow-lg"></div>
            <span className="text-sm text-gray-700">Sân bay đến</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg border-2 border-white shadow-lg transform rotate-45">
              <div className="w-full h-full bg-white rounded-sm flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
            </div>
            <span className="text-sm text-gray-700">Máy bay</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-1 bg-blue-500 rounded-full shadow-sm"></div>
            <span className="text-sm text-gray-700">Tuyến bay</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightRouteMap;
