import React, { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Plane, MapPin, Clock, ArrowRight } from "lucide-react";

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

// Custom airport icons
const departureIcon = new L.DivIcon({
  html: `<div style="background: #10b981; border: 3px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
  </div>`,
  className: "departure-marker",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const arrivalIcon = new L.DivIcon({
  html: `<div style="background: #ef4444; border: 3px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
      <path d="M9 11H1l4-4h14l-4 4H9zm-4 2h4v6l1.5 1.5L12 19l1.5 1.5L15 19v-6h4l-4-4H1l4 4z"/>
    </svg>
  </div>`,
  className: "arrival-marker",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// Flight route icon (moving plane)
const planeIcon = new L.DivIcon({
  html: `<div style="background: #3b82f6; border: 2px solid white; border-radius: 4px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transform: rotate(45deg);">
    <svg width="10" height="10" fill="white" viewBox="0 0 24 24" style="transform: rotate(-45deg);">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
  </div>`,
  className: "plane-marker",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Tọa độ sân bay Việt Nam (dữ liệu mẫu)
const airportCoordinates = {
  SGN: { lat: 10.8231, lon: 106.6297, name: "Sân bay Quốc tế Tân Sơn Nhất" },
  HAN: { lat: 21.2212, lon: 105.8071, name: "Sân bay Quốc tế Nội Bài" },
  DAD: { lat: 16.0439, lon: 108.1994, name: "Sân bay Quốc tế Đà Nẵng" },
  CXR: { lat: 12.0123, lon: 109.219, name: "Sân bay Cam Ranh" },
  HPH: { lat: 20.8197, lon: 106.7242, name: "Sân bay Cát Bi" },
  VCA: { lat: 10.0875, lon: 105.7117, name: "Sân bay Cần Thơ" },
  BMV: { lat: 12.6682, lon: 108.12, name: "Sân bay Buôn Ma Thuột" },
  UIH: { lat: 13.9555, lon: 109.0426, name: "Sân bay Phù Cát" },
  PQC: { lat: 10.1699, lon: 103.9937, name: "Sân bay Phú Quốc" },
  VDO: { lat: 17.5125, lon: 106.5903, name: "Sân bay Đồng Hới" },
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

// Hàm tính điểm giữa để đặt icon máy bay
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

  // Lấy tọa độ sân bay
  const getDepartureCoords = () => {
    const code = flightInfo?.departure?.code || flightInfo?.from;
    return airportCoordinates[code] || airportCoordinates["SGN"];
  };

  const getArrivalCoords = () => {
    const code = flightInfo?.arrival?.code || flightInfo?.to;
    return airportCoordinates[code] || airportCoordinates["HAN"];
  };

  const departureCoords = getDepartureCoords();
  const arrivalCoords = getArrivalCoords();
  const distance = calculateDistance(
    departureCoords.lat,
    departureCoords.lon,
    arrivalCoords.lat,
    arrivalCoords.lon
  );
  const midpoint = getMidpoint(
    departureCoords.lat,
    departureCoords.lon,
    arrivalCoords.lat,
    arrivalCoords.lon
  );

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

  // Default center (giữa Việt Nam)
  const center = [16.0583, 108.2772];

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        className="rounded-lg border border-gray-200"
      >
        {/* OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Departure Airport Marker */}
        <Marker
          position={[departureCoords.lat, departureCoords.lon]}
          icon={departureIcon}
        >
          <Popup className="airport-popup">
            <div className="min-w-[250px] p-2">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-semibold text-green-700">KHỞI HÀNH</span>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-lg">
                  {flightInfo?.departure?.city || "TP. Hồ Chí Minh"} (
                  {flightInfo?.departure?.code || "SGN"})
                </div>
                <div className="text-sm text-gray-600">
                  {departureCoords.name}
                </div>
                <div className="flex items-center space-x-4 text-sm mt-2">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>{flightInfo?.departure?.time || "05:05"}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>
                      {departureCoords.lat.toFixed(4)},{" "}
                      {departureCoords.lon.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
          <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
            <div className="text-center">
              <div className="font-semibold">
                {flightInfo?.departure?.city || "TP. Hồ Chí Minh"}
              </div>
              <div className="text-xs">
                Khởi hành: {flightInfo?.departure?.time || "05:05"}
              </div>
            </div>
          </Tooltip>
        </Marker>

        {/* Arrival Airport Marker */}
        <Marker
          position={[arrivalCoords.lat, arrivalCoords.lon]}
          icon={arrivalIcon}
        >
          <Popup className="airport-popup">
            <div className="min-w-[250px] p-2">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-semibold text-red-700">ĐẾN NƠI</span>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-lg">
                  {flightInfo?.arrival?.city || "Hà Nội"} (
                  {flightInfo?.arrival?.code || "HAN"})
                </div>
                <div className="text-sm text-gray-600">
                  {arrivalCoords.name}
                </div>
                <div className="flex items-center space-x-4 text-sm mt-2">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>{flightInfo?.arrival?.time || "07:10"}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>
                      {arrivalCoords.lat.toFixed(4)},{" "}
                      {arrivalCoords.lon.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
          <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
            <div className="text-center">
              <div className="font-semibold">
                {flightInfo?.arrival?.city || "Hà Nội"}
              </div>
              <div className="text-xs">
                Đến: {flightInfo?.arrival?.time || "07:10"}
              </div>
            </div>
          </Tooltip>
        </Marker>

        {/* Flight Path */}
        {showFlightPath && (
          <>
            {/* Flight route line */}
            <Polyline
              positions={[
                [departureCoords.lat, departureCoords.lon],
                [arrivalCoords.lat, arrivalCoords.lon],
              ]}
              color="#3b82f6"
              weight={3}
              opacity={0.8}
              dashArray="10, 10"
            />

            {/* Animated plane marker at midpoint */}
            <Marker position={[midpoint.lat, midpoint.lon]} icon={planeIcon}>
              <Popup>
                <div className="text-center p-2">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Plane className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-blue-700">
                      {flightInfo?.flightNumber || "VN7210"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {flightInfo?.aircraft || "Airbus A321"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Khoảng cách: {distance.toFixed(0)} km
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Flight Info Overlay */}
      {showAirportInfo && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border max-w-xs">
          <div className="flex items-center space-x-2 mb-3">
            <Plane className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-gray-800">
              {flightInfo?.flightNumber || "VN7210"}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-green-600 font-medium">
                {flightInfo?.departure?.code || "SGN"}
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="text-red-600 font-medium">
                {flightInfo?.arrival?.code || "HAN"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{flightInfo?.departure?.time || "05:05"}</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {flightInfo?.duration || "2g 05p"}
              </span>
              <span>{flightInfo?.arrival?.time || "07:10"}</span>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Khoảng cách:</span>
                <span className="font-medium text-gray-700">
                  {distance.toFixed(0)} km
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Máy bay:</span>
                <span className="font-medium text-gray-700">
                  {flightInfo?.aircraft || "Airbus A321"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border">
        <div className="text-xs font-semibold text-gray-700 mb-2">
          Chú thích
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Sân bay khởi hành</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Sân bay đến</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Máy bay</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-blue-500 border-dashed border-b"></div>
            <span>Tuyến bay</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightRouteMap;
