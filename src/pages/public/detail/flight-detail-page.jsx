"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { flightApi } from "@/apis/flight-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import FlightRouteMap from "@/components/common/flight-route-map";
import {
  Clock,
  Plane,
  MapPin,
  Calendar,
  Luggage,
  Star,
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle,
  Wifi,
  Monitor,
  Utensils,
  Zap,
  Package,
  Headphones,
  Bed,
  Map,
  ArrowRightLeft,
  ChevronRight,
} from "lucide-react";

// Utility functions for date/time formatting
const formatTime = (dateTimeString, options = {}) => {
  if (!dateTimeString) return "N/A";

  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    });
  } catch (error) {
    console.warn("[formatTime] Error formatting time:", error);
    return "N/A";
  }
};

const formatDate = (dateTimeString, options = {}) => {
  if (!dateTimeString) return "N/A";

  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      ...options,
    });
  } catch (error) {
    console.warn("[formatDate] Error formatting date:", error);
    return "N/A";
  }
};

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return "N/A";

  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return "N/A";

    const time = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const dateStr = date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `${time} - ${dateStr}`;
  } catch (error) {
    console.warn("[formatDateTime] Error formatting date time:", error);
    return "N/A";
  }
};

const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return "N/A";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    // Handle minutes only
    if (mins === 30) {
      return "nửa tiếng";
    } else {
      return `${mins} phút`;
    }
  } else if (mins === 0) {
    // Handle hours only
    if (hours === 1) {
      return "1 tiếng";
    } else {
      return `${hours} tiếng`;
    }
  } else {
    // Handle both hours and minutes
    const hourText = hours === 1 ? "1 tiếng" : `${hours} tiếng`;
    if (mins === 30) {
      return `${hourText} rưỡi`;
    } else {
      return `${hourText} ${mins} phút`;
    }
  }
};

// Helper function to get flight legs for map
const getFlightLegs = (flightData) => {
  if (!flightData) return [];

  // Helper to create segments for a flight with stops
  const createSegments = (flight, dep, arr) => {
    const segments = [];
    const stops = flight.stopsList || [];

    if (stops.length === 0) {
      // Direct flight
      segments.push({
        from: dep,
        to: arr,
        flight: flight,
      });
    } else {
      // Flight with stops
      let currentDep = dep;

      stops.forEach((stop, index) => {
        segments.push({
          from: currentDep,
          to: {
            city: stop.airportName,
            airportName: stop.airportName,
            code: stop.airportCode,
            time: stop.arrivalTime,
          },
          flight: flight,
          isStop: true,
          stopIndex: index,
        });

        currentDep = {
          city: stop.airportName,
          airportName: stop.airportName,
          code: stop.airportCode,
          time: stop.arrivalTime,
        };
      });

      // Final segment to arrival
      segments.push({
        from: currentDep,
        to: arr,
        flight: flight,
      });
    }

    return segments;
  };

  if (flightData.isRoundTrip) {
    return [
      {
        ...flightData.outboundFlight,
        direction: "Outbound",
        flight: flightData.outboundFlight,
        dep:
          flightData.outboundFlight.departure ||
          flightData.outboundFlight.departureAirport,
        arr:
          flightData.outboundFlight.arrival ||
          flightData.outboundFlight.arrivalAirport,
        segments: createSegments(
          flightData.outboundFlight,
          flightData.outboundFlight.departure ||
            flightData.outboundFlight.departureAirport,
          flightData.outboundFlight.arrival ||
            flightData.outboundFlight.arrivalAirport
        ),
      },
      {
        ...flightData.returnFlight,
        direction: "Inbound",
        flight: flightData.returnFlight,
        dep:
          flightData.returnFlight.departure ||
          flightData.returnFlight.departureAirport,
        arr:
          flightData.returnFlight.arrival ||
          flightData.returnFlight.arrivalAirport,
        segments: createSegments(
          flightData.returnFlight,
          flightData.returnFlight.departure ||
            flightData.returnFlight.departureAirport,
          flightData.returnFlight.arrival ||
            flightData.returnFlight.arrivalAirport
        ),
      },
    ];
  } else if (flightData.isMultiCity) {
    return flightData.multiCityLegs.map((leg, index) => ({
      ...leg,
      direction: `Leg ${index + 1}`,
      flight: leg,
      dep: leg.departure || leg.departureAirport,
      arr: leg.arrival || leg.arrivalAirport,
      segments: createSegments(
        leg,
        leg.departure || leg.departureAirport,
        leg.arrival || leg.arrivalAirport
      ),
    }));
  } else {
    // One-way flight
    return [
      {
        ...flightData,
        direction: "Outbound",
        flight: flightData,
        dep: flightData.departure || flightData.departureAirport,
        arr: flightData.arrival || flightData.arrivalAirport,
        segments: createSegments(
          flightData,
          flightData.departure || flightData.departureAirport,
          flightData.arrival || flightData.arrivalAirport
        ),
      },
    ];
  }
};

// Helper function to get airport coordinates map
const getAirportCoordsMap = (flightData) => {
  if (!flightData) return {};

  const coordsMap = {};

  const addAirport = (airport) => {
    if (airport && airport.code) {
      // Let FlightRouteMap handle coordinate resolution
      coordsMap[airport.code] = {
        lat: airport.lat || 0,
        lon: airport.lon || 0,
        name: airport.city || airport.airportName || airport.code,
        code: airport.code,
      };
    }
  };

  const addStops = (flight) => {
    const stops = flight.stopsList || [];
    stops.forEach((stop) => {
      if (stop.airportCode) {
        coordsMap[stop.airportCode] = {
          lat: 0, // FlightRouteMap will resolve actual coordinates
          lon: 0,
          name: stop.airportName || stop.airportCode,
          code: stop.airportCode,
        };
      }
    });
  };

  if (flightData.isRoundTrip) {
    addAirport(
      flightData.outboundFlight?.departure ||
        flightData.outboundFlight?.departureAirport
    );
    addAirport(
      flightData.outboundFlight?.arrival ||
        flightData.outboundFlight?.arrivalAirport
    );
    addStops(flightData.outboundFlight);
    addAirport(
      flightData.returnFlight?.departure ||
        flightData.returnFlight?.departureAirport
    );
    addAirport(
      flightData.returnFlight?.arrival ||
        flightData.returnFlight?.arrivalAirport
    );
    addStops(flightData.returnFlight);
  } else if (flightData.isMultiCity) {
    flightData.multiCityLegs.forEach((leg) => {
      addAirport(leg.departure || leg.departureAirport);
      addAirport(leg.arrival || leg.arrivalAirport);
      addStops(leg);
    });
  } else {
    addAirport(flightData.departure || flightData.departureAirport);
    addAirport(flightData.arrival || flightData.arrivalAirport);
    addStops(flightData);
  }

  return coordsMap;
};

// Helper function to get processed search data
const getProcessedSearchData = (flightData) => {
  if (!flightData) return { tripType: "one_way" };

  if (flightData.isRoundTrip) {
    return {
      tripType: "round_trip",
      from:
        flightData.outboundFlight?.departure?.code ||
        flightData.outboundFlight?.departureAirport?.code ||
        flightData.fromCode,
      to:
        flightData.outboundFlight?.arrival?.code ||
        flightData.outboundFlight?.arrivalAirport?.code ||
        flightData.toCode,
      returnFrom:
        flightData.returnFlight?.departure?.code ||
        flightData.returnFlight?.departureAirport?.code ||
        flightData.toCode,
      returnTo:
        flightData.returnFlight?.arrival?.code ||
        flightData.returnFlight?.arrivalAirport?.code ||
        flightData.fromCode,
      // Add the actual flight objects for the map component
      outboundFlight: flightData.outboundFlight,
      returnFlight: flightData.returnFlight,
    };
  } else if (flightData.isMultiCity) {
    return {
      tripType: "multi_city",
      legs: flightData.multiCityLegs.map((leg) => ({
        from: leg.departure?.code || leg.departureAirport?.code,
        to: leg.arrival?.code || leg.arrivalAirport?.code,
        stops: leg.stopsList?.map((stop) => stop.airportCode) || [],
      })),
      // Add multiCityFlights for route map compatibility
      multiCityFlights: flightData.multiCityLegs.map((leg) => ({
        content: [leg], // Wrap each leg in content array
      })),
    };
  } else {
    return {
      tripType: "one_way",
      from:
        flightData.departure?.code ||
        flightData.departureAirport?.code ||
        flightData.fromCode,
      to:
        flightData.arrival?.code ||
        flightData.arrivalAirport?.code ||
        flightData.toCode,
      stops: flightData.stopsList?.map((stop) => stop.airportCode) || [],
    };
  }
};

// Helper function to combine travel classes from round trip flights
const combineRoundTripClasses = (outboundClasses, inboundClasses) => {
  if (!outboundClasses && !inboundClasses) return [];
  if (!outboundClasses) return inboundClasses;
  if (!inboundClasses) return outboundClasses;

  // Create an object to store classes by classId for easy lookup
  const combinedClasses = {};

  // Add outbound classes
  outboundClasses.forEach((cls) => {
    const key =
      cls.travelClass?.classId || cls.travelClass?.className || cls.id;
    combinedClasses[key] = {
      ...cls,
      direction: "outbound",
      combinedPrice: cls.customPrice || cls.price || 0,
      outboundPrice: cls.customPrice || cls.price || 0,
    };
  });

  // Add or merge inbound classes
  inboundClasses.forEach((cls) => {
    const key =
      cls.travelClass?.classId || cls.travelClass?.className || cls.id;
    const existing = combinedClasses[key];

    if (existing) {
      // If class exists in both directions, combine prices
      existing.combinedPrice =
        (existing.outboundPrice || 0) + (cls.customPrice || cls.price || 0);
      existing.inboundPrice = cls.customPrice || cls.price || 0;
      existing.availableSeats = Math.min(
        existing.availableSeats,
        cls.availableSeats || 0
      );
    } else {
      // If class only exists in inbound, add it
      combinedClasses[key] = {
        ...cls,
        direction: "inbound",
        combinedPrice: cls.customPrice || cls.price || 0,
        inboundPrice: cls.customPrice || cls.price || 0,
      };
    }
  });

  return Object.values(combinedClasses);
};

// Helper function to detect flight type
const detectFlightType = (flight) => {
  const isItinerary = flight.tripType && flight.legs;
  const isRoundTrip =
    isItinerary && flight.tripType === "ROUND_TRIP" && flight.legs?.length >= 2;
  const isRoundTripDirect =
    !isItinerary &&
    flight.tripType === "ROUND_TRIP" &&
    flight.outboundFlight &&
    flight.returnFlight;

  // Handle multi-city detection - check both itinerary format and direct format
  const isMultiCityItinerary =
    isItinerary && flight.tripType === "MULTI_CITY" && flight.legs?.length > 1;
  const isMultiCityDirect =
    !isItinerary &&
    (flight.type === "MULTI_CITY" || flight.businessName === "Multi-City") &&
    flight.stopsList &&
    flight.stopsList.length > 0;

  const isMultiCity = isMultiCityItinerary || isMultiCityDirect;

  return {
    isItinerary,
    isRoundTrip,
    isRoundTripDirect,
    isMultiCity,
    isMultiCityItinerary,
    isMultiCityDirect,
  };
};

// Helper function to build common flight properties
const buildCommonFlightProperties = (processedFlight) => {
  // Build departure object
  processedFlight.departure = {
    city:
      processedFlight.departureAirport?.airportName ||
      processedFlight.departureAirport?.cityNames?.[0] ||
      processedFlight.departureAirport?.cityName ||
      "N/A",
    airportName: processedFlight.departureAirport?.airportName || "N/A",
    code:
      processedFlight.departureAirport?.airportCode ||
      processedFlight.fromCode ||
      "N/A",
    time: formatTime(processedFlight.departureTime),
    date: formatDate(processedFlight.departureTime),
  };

  // Build arrival object
  processedFlight.arrival = {
    city:
      processedFlight.arrivalAirport?.airportName ||
      processedFlight.arrivalAirport?.cityNames?.[0] ||
      processedFlight.arrivalAirport?.cityName ||
      "N/A",
    airportName: processedFlight.arrivalAirport?.airportName || "N/A",
    code:
      processedFlight.arrivalAirport?.airportCode ||
      processedFlight.toCode ||
      "N/A",
    time: formatTime(processedFlight.arrivalTime),
    date: formatDate(processedFlight.arrivalTime),
  };

  // Format duration
  processedFlight.duration = formatDuration(processedFlight.duration);

  return processedFlight;
};

// Helper function to normalize flight data
const normalizeFlightData = (flight) => {
  // Detect flight type
  const flightType = detectFlightType(flight);
  const { isRoundTrip, isRoundTripDirect, isMultiCity } = flightType;

  let processedFlight;

  if (isRoundTrip) {
    // Handle round-trip itinerary with legs array
    const outbound = flight.legs[0];
    const returnFlight = flight.legs[1];

    processedFlight = {
      // Basic flight info
      id:
        outbound.flightId ||
        flight.itineraryId ||
        flight.flightId ||
        Date.now().toString(),
      flightId:
        outbound.flightId ||
        flight.itineraryId ||
        flight.flightId ||
        Date.now().toString(),
      flightNumber: `${outbound.flightNumber || "N/A"} / ${
        returnFlight.flightNumber || "N/A"
      }`,

      // Airline info
      airline: outbound.airline?.airlineName || outbound.airlineName || "N/A",
      airlineName:
        outbound.airline?.airlineName || outbound.airlineName || "N/A",
      airlineLogo:
        outbound.airline?.thumbnail ||
        outbound.airline?.logo ||
        "/placeholder.svg",

      // Round-trip specific data
      isRoundTrip: true,
      tripType: "ROUND_TRIP",
      outboundFlight: normalizeFlightData(outbound),
      returnFlight: normalizeFlightData(returnFlight),
      totalPrice: flight.totalPrice || 0,

      // Use outbound for primary display
      departureTime: outbound.departureTime,
      departureAirport: outbound.departureAirport || {},
      from: outbound.departureAirport?.airportCode || outbound.from || "N/A",
      fromCode:
        outbound.departureAirport?.airportCode || outbound.fromCode || "N/A",

      arrivalTime: returnFlight.arrivalTime,
      arrivalAirport: returnFlight.arrivalAirport || {},
      to: returnFlight.arrivalAirport?.airportCode || returnFlight.to || "N/A",
      toCode:
        returnFlight.arrivalAirport?.airportCode ||
        returnFlight.toCode ||
        "N/A",

      // Combined duration
      duration: (outbound.duration || 0) + (returnFlight.duration || 0),

      // Travel classes - combine both directions
      flightTravelClasses: combineRoundTripClasses(
        outbound.flightTravelClasses || [],
        returnFlight.flightTravelClasses || []
      ),

      // Status and availability
      status: outbound.status || "Scheduled",
      availableSeats: Math.min(
        outbound.availableSeats || 0,
        returnFlight.availableSeats || 0
      ),
      totalSeats: Math.min(
        outbound.totalSeats || 0,
        returnFlight.totalSeats || 0
      ),
    };
  } else if (isRoundTripDirect) {
    const outbound = flight.outboundFlight;
    const returnFlight = flight.returnFlight;

    processedFlight = {
      // Basic flight info
      id: flight.itineraryId || flight.flightId || Date.now().toString(),
      flightId: flight.itineraryId || flight.flightId || Date.now().toString(),
      flightNumber:
        flight.flightNumber ||
        `${outbound.flightNumber || "N/A"} / ${
          returnFlight.flightNumber || "N/A"
        }`,

      // Airline info
      airline:
        flight.airline ||
        outbound.airline?.airlineName ||
        outbound.airlineName ||
        "N/A",
      airlineName:
        flight.airlineName ||
        outbound.airline?.airlineName ||
        outbound.airlineName ||
        "N/A",
      airlineLogo:
        flight.airlineLogo ||
        outbound.airline?.thumbnail ||
        outbound.airline?.logo ||
        "/placeholder.svg",

      // Round-trip specific data
      isRoundTrip: true,
      tripType: "ROUND_TRIP",
      outboundFlight: normalizeFlightData(outbound),
      returnFlight: normalizeFlightData(returnFlight),
      totalPrice:
        flight.totalPrice || flight.priceNumeric || flight.basePrice || 0,

      // Use outbound for primary display
      departureTime: outbound.departureTime,
      departureAirport: outbound.departureAirport || {},
      from: outbound.departureAirport?.airportCode || outbound.from || "N/A",
      fromCode:
        outbound.departureAirport?.airportCode || outbound.fromCode || "N/A",

      arrivalTime: returnFlight.arrivalTime,
      arrivalAirport: returnFlight.arrivalAirport || {},
      to: returnFlight.arrivalAirport?.airportCode || returnFlight.to || "N/A",
      toCode:
        returnFlight.arrivalAirport?.airportCode ||
        returnFlight.toCode ||
        "N/A",

      // Combined duration
      duration: (outbound.duration || 0) + (returnFlight.duration || 0),

      // Travel classes - combine both directions
      flightTravelClasses: combineRoundTripClasses(
        outbound.flightTravelClasses || [],
        returnFlight.flightTravelClasses || []
      ),

      // Status and availability
      status: flight.status || outbound.status || "Scheduled",
      availableSeats:
        flight.availableSeats ||
        Math.min(
          outbound.availableSeats || 0,
          returnFlight.availableSeats || 0
        ),
      totalSeats:
        flight.totalSeats ||
        Math.min(outbound.totalSeats || 0, returnFlight.totalSeats || 0),

      // Additional fields
      gate: flight.gate || outbound.gate,
      terminal: flight.terminal || outbound.terminal,
      stops: flight.stops || outbound.stops,
      stopsList: flight.stopsList || outbound.stopsList || [],
      aircraft: flight.aircraft || outbound.aircraft,
      type: flight.type || outbound.type,
      businessName: flight.businessName || outbound.businessName,
    };
  } else if (flightType.isMultiCityDirect) {
    // Handle multi-city direct (with stopsList but no legs array)
    const stopsList = flight.stopsList || [];
    const totalStops = stopsList.length;

    processedFlight = {
      // Basic flight info
      id: flight.flightId || flight.id || Date.now().toString(),
      flightId: flight.flightId || flight.id || Date.now().toString(),
      flightNumber: `${totalStops + 1} chặng`, // departure + stops + arrival

      // Airline info
      airline: flight.airline || "Multiple Airlines",
      airlineName: flight.airlineName || "Multiple Airlines",
      airlineLogo: flight.airlineLogo || "/placeholder.svg",

      // Multi-city specific data
      isMultiCity: true,
      tripType: "MULTI_CITY",
      type: "MULTI_CITY",
      businessName: flight.businessName || "Multi-City",

      // Create legs from stopsList
      multiCityLegs: [], // Will be populated below
      totalPrice: flight.totalPrice || flight.price || flight.basePrice || 0,

      // Use original departure and final arrival
      departureTime: flight.departureTime,
      departureAirport: flight.departureAirport || {},
      from: flight.departureAirport?.airportCode || flight.from || "N/A",
      fromCode:
        flight.departureAirport?.airportCode || flight.fromCode || "N/A",

      arrivalTime: flight.arrivalTime,
      arrivalAirport: flight.arrivalAirport || {},
      to: flight.arrivalAirport?.airportCode || flight.to || "N/A",
      toCode: flight.arrivalAirport?.airportCode || flight.toCode || "N/A",

      // Total duration
      duration: flight.duration || 0,

      // Travel classes
      flightTravelClasses: flight.flightTravelClasses || [],

      // Status and availability
      status: flight.status || "Scheduled",
      availableSeats: flight.availableSeats || 0,
      totalSeats: flight.totalSeats || 0,

      // Additional fields
      gate: flight.gate || "TBA",
      terminal: flight.terminal || "TBA",
      stops: totalStops,
      stopsList: stopsList,
      aircraft: flight.aircraft || "Multiple Aircraft",
    };

    // Create legs from stopsList
    let currentDeparture = {
      city:
        flight.departureAirport.airportName ||
        flight.departureAirport?.cityNames?.[0] ||
        flight.departureAirport?.cityName ||
        "N/A",
      airportName: flight.departureAirport?.airportName || "N/A",
      code: flight.departureAirport?.airportCode || flight.fromCode || "N/A",
      time: formatDateTime(flight.departureTime),
    };

    stopsList.forEach((stop, index) => {
      const leg = {
        id: `leg-${index + 1}`,
        flightNumber: `${flight.flightNumber || "N/A"}-${index + 1}`,
        airline: flight.airline || "N/A",
        airlineName: flight.airlineName || "N/A",
        airlineLogo: flight.airlineLogo || "/placeholder.svg",

        departure: currentDeparture,
        departureTime: currentDeparture.time,
        departureAirport: flight.departureAirport,

        arrival: {
          city: stop.airportName,
          airportName: stop.airportName,
          code: stop.airportCode,
          time: formatDateTime(stop.arrivalTime),
        },
        arrivalTime: stop.arrivalTime,
        arrivalAirport: {
          airportCode: stop.airportCode,
          airportName: stop.airportName,
          cityName: stop.airportName,
        },

        duration: formatDuration(stop.duration) || 0,
        stops: 0,
        stopsList: [],
        aircraft: flight.aircraft || "Boeing 737",

        from: currentDeparture.code,
        fromCode: currentDeparture.code,
        to: stop.airportCode,
        toCode: stop.airportCode,

        price: flight.price || 0,
        basePrice: flight.basePrice || 0,
        availableSeats: flight.availableSeats || 0,
        totalSeats: flight.totalSeats || 0,
        status: flight.status || "Scheduled",

        flightTravelClasses: flight.flightTravelClasses || [],
      };

      processedFlight.multiCityLegs.push(leg);

      // Update current departure for next leg
      currentDeparture = {
        city: stop.airportName,
        airportName: stop.airportName,
        code: stop.airportCode,
        time:
          formatDateTime(stop.departureTime) ||
          formatDateTime(stop.arrivalTime),
      };
    });

    // Add final leg to destination
    const finalLeg = {
      id: `leg-${totalStops + 1}`,
      flightNumber: `${flight.flightNumber || "N/A"}-${totalStops + 1}`,
      airline: flight.airline || "N/A",
      airlineName: flight.airlineName || "N/A",
      airlineLogo: flight.airlineLogo || "/placeholder.svg",

      departure: currentDeparture,
      departureTime: currentDeparture.time,
      departureAirport: flight.departureAirport,

      arrival: {
        city:
          flight.arrivalAirport.airportName ||
          flight.arrivalAirport?.cityNames?.[0] ||
          flight.arrivalAirport?.cityName ||
          "N/A",
        airportName: flight.arrivalAirport?.airportName || "N/A",
        code: flight.arrivalAirport?.airportCode || flight.toCode || "N/A",
        time: formatDateTime(flight.arrivalTime),
      },
      arrivalTime: flight.arrivalTime,
      arrivalAirport: flight.arrivalAirport,

      duration: 0, // Calculate if needed
      stops: 0,
      stopsList: [],
      aircraft: flight.aircraft || "Boeing 737",

      from: currentDeparture.code,
      fromCode: currentDeparture.code,
      to: flight.arrivalAirport?.airportCode || flight.toCode || "N/A",
      toCode: flight.arrivalAirport?.airportCode || flight.toCode || "N/A",

      price: flight.price || 0,
      basePrice: flight.basePrice || 0,
      availableSeats: flight.availableSeats || 0,
      totalSeats: flight.totalSeats || 0,
      status: flight.status || "Scheduled",

      flightTravelClasses: flight.flightTravelClasses || [],
    };

    processedFlight.multiCityLegs.push(finalLeg);
  } else if (isMultiCity) {
    // Handle multi-city itinerary
    const firstLeg = flight.legs[0];
    const lastLeg = flight.legs[flight.legs.length - 1];

    processedFlight = {
      // Basic flight info
      id:
        firstLeg.flightId ||
        flight.itineraryId ||
        flight.flightId ||
        Date.now().toString(),
      flightId:
        firstLeg.flightId ||
        flight.itineraryId ||
        flight.flightId ||
        Date.now().toString(),
      flightNumber: `${flight.legs.length} chặng`,

      // Airline info
      airline:
        firstLeg.airline?.airlineName ||
        firstLeg.airlineName ||
        "Multiple Airlines",
      airlineName:
        firstLeg.airline?.airlineName ||
        firstLeg.airlineName ||
        "Multiple Airlines",
      airlineLogo:
        firstLeg.airline?.thumbnail ||
        firstLeg.airline?.logo ||
        "/placeholder.svg",

      // Multi-city specific data
      isMultiCity: true,
      tripType: "MULTI_CITY",
      multiCityLegs: flight.legs.map((leg) => normalizeFlightData(leg)),
      totalPrice: flight.totalPrice || 0,

      // Use first and last leg for primary display
      departureTime: firstLeg.departureTime,
      departureAirport: firstLeg.departureAirport || {},
      from: firstLeg.departureAirport?.airportCode || firstLeg.from || "N/A",
      fromCode:
        firstLeg.departureAirport?.airportCode || firstLeg.fromCode || "N/A",

      arrivalTime: lastLeg.arrivalTime,
      arrivalAirport: lastLeg.arrivalAirport || {},
      to: lastLeg.arrivalAirport?.airportCode || lastLeg.to || "N/A",
      toCode: lastLeg.arrivalAirport?.airportCode || lastLeg.toCode || "N/A",

      // Total duration
      duration: flight.legs.reduce(
        (total, leg) => total + (leg.duration || 0),
        0
      ),

      // Travel classes - use first leg as representative
      flightTravelClasses: firstLeg.flightTravelClasses || [],

      // Status and availability
      status: "Scheduled",
      availableSeats: Math.min(
        ...flight.legs.map((leg) => leg.availableSeats || 0)
      ),
      totalSeats: Math.min(...flight.legs.map((leg) => leg.totalSeats || 0)),
    };
  } else {
    // Handle single flight (one-way or direct flight)
    processedFlight = {
      // Basic flight info
      id: flight.flightId || flight.id || Date.now().toString(),
      flightId: flight.flightId || flight.id || Date.now().toString(),
      flightNumber: flight.flightNumber || "N/A",

      // Airline info
      airline: flight.airline?.airlineName || flight.airlineName || "N/A",
      airlineName: flight.airline?.airlineName || flight.airlineName || "N/A",
      airlineLogo:
        flight.airline?.thumbnail ||
        flight.airline?.logo ||
        flight.airlineLogo ||
        "/placeholder.svg",

      // Departure info
      departureTime: flight.departureTime,
      departureAirport: flight.departureAirport || {},
      from: flight.departureAirport?.airportCode || flight.from || "N/A",
      fromCode:
        flight.departureAirport?.airportCode || flight.fromCode || "N/A",

      // Arrival info
      arrivalTime: flight.arrivalTime,
      arrivalAirport: flight.arrivalAirport || {},
      to: flight.arrivalAirport?.airportCode || flight.to || "N/A",
      toCode: flight.arrivalAirport?.airportCode || flight.toCode || "N/A",

      // Flight details
      duration: flight.duration || 0,
      stops: flight.stops || flight.stopsList || [],
      stopsList: flight.stopsList || [],

      // Aircraft info - handle both object and string formats
      aircraft:
        typeof flight.aircraft === "object" && flight.aircraft !== null
          ? flight.aircraft.aircraftName ||
            flight.aircraft.aircraftCode ||
            "Boeing 737"
          : flight.aircraft || "Boeing 737",

      // Pricing
      price: flight.basePrice || flight.priceNumeric || flight.price || 0,
      basePrice: flight.basePrice || flight.priceNumeric || flight.price || 0,

      // Status and availability
      status: flight.status || "Scheduled",
      availableSeats: flight.availableSeats || 0,
      totalSeats: flight.totalSeats || 0,

      // Additional info
      gate: flight.gate || "TBA",
      terminal: flight.terminal || "TBA",
      type: flight.type || "ONE_WAY",

      // Travel classes
      flightTravelClasses: flight.flightTravelClasses || [],

      // Additional fields for compatibility
      businessName: flight.businessName || "",
    };
  }

  // Build common flight properties
  processedFlight = buildCommonFlightProperties(processedFlight);

  console.log("[normalizeFlightData] Processed flight data:", processedFlight);
  return processedFlight;
};

// Helper function to format stops display
const formatStops = (stops) => {
  if (!stops) return "N/A";

  // Handle different formats of stops
  if (typeof stops === "string") {
    if (
      stops.toLowerCase() === "non_stop" ||
      stops.toLowerCase() === "bay thẳng"
    ) {
      return "Bay thẳng";
    }
    return stops;
  }

  // Handle array format
  if (Array.isArray(stops)) {
    if (stops.length === 0) return "Bay thẳng";
    return `${stops.length} điểm dừng`;
  }

  // Handle number format
  if (typeof stops === "number") {
    if (stops === 0) return "Bay thẳng";
    return `${stops} điểm dừng`;
  }

  return stops;
};

const FlightDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // Get flight ID from URL
  const [selectedFare, setSelectedFare] = useState(null);
  const [outboundFare, setOutboundFare] = useState(null);
  const [returnFare, setReturnFare] = useState(null);
  const [flightData, setFlightData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fareOptions, setFareOptions] = useState([]);
  const [fareSelectionStep, setFareSelectionStep] = useState("outbound"); // 'outbound' or 'return'
  const [selectedFares, setSelectedFares] = useState({}); // Track fares like RoundTripFareSelection

  // Stepper configuration for round-trip
  const roundTripSteps = [
    { title: "Chọn vé đi" },
    { title: "Chọn vé về" },
    { title: "Xác nhận" },
  ];

  // Get flight data from location state or fetch from API
  useEffect(() => {
    const getFlightData = async () => {
      try {
        setLoading(true);

        // First try to get data from location state
        if (location.state && location.state.flight) {
          const flight = location.state.flight;

          // Handle different flight data structures
          let flightToProcess = flight;

          // If flight has originalFlight (from suggestion section), use that
          if (flight.originalFlight) {
            console.log("[FlightDetail] Using originalFlight from suggestion");
            flightToProcess = flight.originalFlight;
          }

          // Transform flight data to match expected structure
          const transformedFlight = normalizeFlightData(flightToProcess);
          console.log(
            "[FlightDetail] Transformed flight data:",
            transformedFlight
          );

          setFlightData(transformedFlight);
          setLoading(false);
          return;
        }

        // If no state data, try to fetch from API using flight ID
        if (id) {
          console.log(
            "[FlightDetail] No state data, trying to fetch from API with ID:",
            id
          );

          try {
            const response = await flightApi.getFlightById(id);
            console.log("[FlightDetail] API response:", response);

            if (response.success && response.data) {
              // Transform flight data to match expected structure
              const transformedFlight = normalizeFlightData(response.data);
              console.log(
                "[FlightDetail] API transformed flight data:",
                transformedFlight
              );

              setFlightData(transformedFlight);
              setLoading(false);
              return;
            } else {
              console.error(
                "[FlightDetail] API call failed:",
                response.message
              );
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error(
              "[FlightDetail] Error fetching flight from API:",
              error
            );
            setLoading(false);
            return;
          }
        }

        // If no ID and no state data, show error
        console.error("[FlightDetail] No flight ID or flight data provided");
        setLoading(false);
      } catch (error) {
        console.error("[FlightDetail] Error loading flight data:", error);
        setLoading(false);
      }
    };

    getFlightData();
  }, [location.state, id]);

  // Load fare options from flight data
  const loadFareOptions = (flight) => {
    try {
      console.log(
        "[FlightDetail] Loading fare options from flight data:",
        flight
      );

      if (!flight || !flight.flightTravelClasses) {
        console.warn(
          "[FlightDetail] No flight travel classes found, using fallback"
        );
        // Fallback to default fare options if no flightTravelClasses
        setFareOptions([
          {
            id: "economy",
            name: "Phổ thông",
            price: flight?.price || flight?.basePrice || 299000,
            recommended: false,
            availableSeats: 15,
            features: [
              { included: true, text: "Hành lý xách tay (7kg)" },
              { included: false, text: "Hành lý ký gửi (23kg)" },
              { included: false, text: "Dịch vụ ăn uống" },
              { included: true, text: "Chọn chỗ ngồi" },
              { included: false, text: "Giải trí trên máy bay" },
            ],
          },
        ]);
        return;
      }

      // Set flightTravelClasses directly - no transformation needed
      setFareOptions(flight.flightTravelClasses);
      console.log(
        "[FlightDetail] Set fare options from flightTravelClasses:",
        flight.flightTravelClasses
      );
    } catch (error) {
      console.error("[FlightDetail] Error loading fare options:", error);
      // Use fallback fare options
      setFareOptions([
        {
          id: "economy",
          name: "Phổ thông",
          price: flight?.price || flight?.basePrice || 299000,
          recommended: false,
          availableSeats: 15,
          features: [
            { included: true, text: "Hành lý xách tay (7kg)" },
            { included: false, text: "Hành lý ký gửi (23kg)" },
            { included: false, text: "Dịch vụ ăn uống" },
            { included: true, text: "Chọn chỗ ngồi" },
            { included: false, text: "Giải trí trên máy bay" },
          ],
        },
      ]);
    }
  };

  // Load fare options when flight data is available
  useEffect(() => {
    if (flightData) {
      loadFareOptions(flightData);
    }
  }, [flightData]);

  // Handle fare selection for different flight types
  const handleSelectFare = (fareId) => {
    if (flightData?.isRoundTrip) {
      // For round-trip, use selectedFares object like RoundTripFareSelection
      const key =
        fareSelectionStep === "outbound"
          ? `${flightData.itineraryId || flightData.id}-outbound`
          : `${flightData.itineraryId || flightData.id}-return`;

      setSelectedFares((prev) => ({
        ...prev,
        [key]: fareId,
      }));

      // Auto-advance to next step for outbound, stay on return
      if (fareSelectionStep === "outbound") {
        setFareSelectionStep("return");
      }
    } else {
      // For one-way or multi-city, use single fare selection
      setSelectedFare(fareId);
    }
  };

  const handleSelectOutboundFare = (fareId) => {
    setOutboundFare(fareId);
    // Don't automatically move to return step - wait for user to click "Next"
  };

  const handleSelectReturnFare = (fareId) => {
    setReturnFare(fareId);
    // Stay on return step - user can proceed to booking when ready
  };

  const handleResetFareSelection = () => {
    setOutboundFare(null);
    setReturnFare(null);
    setSelectedFare(null);
    setSelectedFares({});
    setFareSelectionStep("outbound"); // Reset to first step
  };

  const handleBackToOutbound = () => {
    setReturnFare(null);
    setFareSelectionStep("outbound");
  };

  const handleNextToReturn = () => {
    if (outboundFare) {
      setFareSelectionStep("return");
    }
  };

  // Helper functions like RoundTripFareSelection
  const handleNext = () => {
    if (fareSelectionStep === "outbound") {
      setFareSelectionStep("return");
    }
  };

  const handlePrev = () => {
    if (fareSelectionStep === "return") {
      setFareSelectionStep("outbound");
    }
  };

  const handleProceedToBooking = (flight, fareId) => {
    console.log(
      "[FlightDetail] handleProceedToBooking called with flight and fareId:",
      flight,
      fareId
    );

    if (!flight) {
      console.error("[FlightDetail] No flight data available");
      alert("Không có dữ liệu chuyến bay. Vui lòng tải lại trang.");
      return;
    }

    let bookingFlightData;

    if (flight.isRoundTrip) {
      // Handle round-trip booking
      const outboundFareId =
        selectedFares[`${flight.itineraryId || flight.id}-outbound`];
      const returnFareId =
        selectedFares[`${flight.itineraryId || flight.id}-return`];

      if (!outboundFareId || !returnFareId) {
        alert("Vui lòng chọn hạng vé cho cả chuyến đi và chuyến về.");
        return;
      }

      const outboundFareData = flight.outboundFlight?.flightTravelClasses?.find(
        (fare) => fare.id === outboundFareId
      );
      const returnFareData = flight.returnFlight?.flightTravelClasses?.find(
        (fare) => fare.id === returnFareId
      );

      if (!outboundFareData || !returnFareData) {
        console.error("[FlightDetail] Round-trip fares not found");
        alert("Không tìm thấy thông tin hạng vé đã chọn.");
        return;
      }

      bookingFlightData = {
        ...flight,
        selectedOutboundFare: outboundFareData,
        selectedReturnFare: returnFareData,
        outboundFareId: outboundFareId,
        returnFareId: returnFareId,
        totalPrice: outboundFareData.customPrice + returnFareData.customPrice,
      };
    } else {
      // Handle one-way or multi-city booking
      const selectedFareData = flight.flightTravelClasses?.find(
        (fare) => fare.id === fareId
      );

      if (!selectedFareData) {
        console.error("[FlightDetail] Selected fare not found:", fareId);
        alert("Không tìm thấy thông tin hạng vé đã chọn.");
        return;
      }

      bookingFlightData = {
        ...flight,
        selectedFare: selectedFareData,
        fareId: fareId,
      };
    }

    console.log(
      "[FlightDetail] Prepared bookingFlightData:",
      bookingFlightData
    );

    // Store in localStorage and navigate
    localStorage.setItem("selectedFlight", JSON.stringify(bookingFlightData));
    localStorage.setItem(
      "selectedFare",
      JSON.stringify(
        bookingFlightData.selectedFare || bookingFlightData.selectedOutboundFare
      )
    );

    // Navigate with state as backup
    navigate("/booking-stepper", { state: { flightData: bookingFlightData } });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700">
      {/* Loading State */}
      {loading && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Đang tải thông tin chuyến bay...
            </h3>
            <p className="text-sm text-gray-600">Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      )}

      {/* No Flight Data State */}
      {!loading && !flightData && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Không tìm thấy thông tin chuyến bay
            </h3>
            <p className="text-gray-600 mb-4">
              Thông tin chuyến bay không khả dụng hoặc đã bị xóa.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Quay lại trang chủ
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && flightData && (
        <>
          {/* Hero Section */}
          <div
            className="h-96 bg-cover bg-center relative pt-12"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80')",
            }}
          >
            <div className="absolute inset-0 bg-black/80 "></div>
            <div className="relative z-10 h-full flex items-center justify-center text-white">
              <div className="text-center max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-center flex-wrap gap-4 mb-4">
                  <img
                    src={flightData.airlineLogo || "/placeholder.svg"}
                    alt={flightData.airline}
                    className="w-auto h-12 rounded bg-white p-1 object-cover"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg";
                    }}
                  />
                  <h1 className="text-4xl font-bold">
                    {flightData.isRoundTrip ? (
                      <>
                        <span>Khứ hồi: </span>
                        {flightData.outboundFlight?.departure?.city ||
                          flightData.from ||
                          "N/A"}{" "}
                        <ArrowRightLeft className="inline w-6 h-6 mx-2" />{" "}
                        {flightData.outboundFlight?.arrival?.city ||
                          flightData.to ||
                          "N/A"}
                      </>
                    ) : (
                      <>
                        {flightData.departure?.city || flightData.from || "N/A"}{" "}
                        → {flightData.arrival?.city || flightData.to || "N/A"}
                      </>
                    )}
                  </h1>
                </div>
                <p className="text-xl mb-2">
                  {flightData.airline || "N/A"} Chuyến bay{" "}
                  {flightData.flightNumber || "N/A"}
                </p>
                <div className="flex items-center justify-center gap-8 text-lg">
                  {flightData.isRoundTrip ? (
                    <>
                      <div className="text-center">
                        <div className="font-semibold text-blue-300">
                          Chuyến đi
                        </div>
                        <span>
                          {flightData.outboundFlight?.departure?.time || "N/A"}{" "}
                          - {flightData.outboundFlight?.arrival?.time || "N/A"}
                        </span>
                        <div className="text-sm text-blue-200">
                          {flightData.outboundFlight?.departure?.date || "N/A"}
                        </div>
                      </div>
                      <span>•</span>
                      <div className="text-center">
                        <div className="font-semibold text-green-300">
                          Chuyến về
                        </div>
                        <span>
                          {flightData.returnFlight?.departure?.time || "N/A"} -{" "}
                          {flightData.returnFlight?.arrival?.time || "N/A"}
                        </span>
                        <div className="text-sm text-green-200">
                          {flightData.returnFlight?.departure?.date || "N/A"}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <span>
                        {flightData.departure?.time || "N/A"} -{" "}
                        {flightData.arrival?.time || "N/A"}
                      </span>
                      <span>•</span>
                      <span>{flightData.duration || "N/A"}</span>
                      <span>•</span>
                      <span>{formatStops(flightData.stops) || "N/A"}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto py-8 px-4">
            {/* Flight Summary Card */}
            <Card className="mb-8 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="w-6 h-6 text-blue-600" />
                  Thông tin chuyến bay
                </CardTitle>
              </CardHeader>
              <CardContent>
                {flightData.isRoundTrip ? (
                  // Round-trip flight summary
                  <div className="space-y-6">
                    {/* Outbound Flight */}
                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h3 className="font-semibold text-lg text-blue-800">
                          Chuyến đi
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {flightData.outboundFlight?.departure?.code} →{" "}
                          {flightData.outboundFlight?.arrival?.code}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg">
                          <MapPin className="w-6 h-6 mb-2 text-blue-600" />
                          <h4 className="font-semibold text-sm">Khởi hành</h4>
                          <p className="font-bold text-blue-800">
                            {flightData.outboundFlight?.departure?.city ||
                              "N/A"}{" "}
                            (
                            {flightData.outboundFlight?.departure?.code ||
                              "N/A"}
                            )
                          </p>
                          <p className="text-xs text-gray-600">
                            {flightData.outboundFlight?.departure?.time ||
                              "N/A"}
                          </p>
                        </div>
                        <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg">
                          <Plane className="w-6 h-6 mb-2 text-blue-600" />
                          <h4 className="font-semibold text-sm">Chi tiết</h4>
                          <p className="font-bold text-blue-800">
                            {flightData.outboundFlight?.flightNumber || "N/A"}
                          </p>
                          <p className="text-xs text-gray-600">
                            {flightData.outboundFlight?.duration || "N/A"}
                          </p>
                        </div>
                        <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg">
                          <MapPin className="w-6 h-6 mb-2 text-blue-600" />
                          <h4 className="font-semibold text-sm">Đến</h4>
                          <p className="font-bold text-blue-800">
                            {flightData.outboundFlight?.arrival?.city || "N/A"}{" "}
                            ({flightData.outboundFlight?.arrival?.code || "N/A"}
                            )
                          </p>
                          <p className="text-xs text-gray-600">
                            {flightData.outboundFlight?.arrival?.time || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Return Flight */}
                    <div className="border-l-4 border-green-500 pl-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h3 className="font-semibold text-lg text-green-800">
                          Chuyến về
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {flightData.returnFlight?.departure?.code} →{" "}
                          {flightData.returnFlight?.arrival?.code}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col items-center text-center p-3 bg-green-50 rounded-lg">
                          <MapPin className="w-6 h-6 mb-2 text-green-600" />
                          <h4 className="font-semibold text-sm">Khởi hành</h4>
                          <p className="font-bold text-green-800">
                            {flightData.returnFlight?.departure?.city || "N/A"}{" "}
                            ({flightData.returnFlight?.departure?.code || "N/A"}
                            )
                          </p>
                          <p className="text-xs text-gray-600">
                            {flightData.returnFlight?.departure?.time || "N/A"}
                          </p>
                        </div>
                        <div className="flex flex-col items-center text-center p-3 bg-green-50 rounded-lg">
                          <Plane className="w-6 h-6 mb-2 text-green-600" />
                          <h4 className="font-semibold text-sm">Chi tiết</h4>
                          <p className="font-bold text-green-800">
                            {flightData.returnFlight?.flightNumber || "N/A"}
                          </p>
                          <p className="text-xs text-gray-600">
                            {flightData.returnFlight?.duration || "N/A"}
                          </p>
                        </div>
                        <div className="flex flex-col items-center text-center p-3 bg-green-50 rounded-lg">
                          <MapPin className="w-6 h-6 mb-2 text-green-600" />
                          <h4 className="font-semibold text-sm">Đến</h4>
                          <p className="font-bold text-green-800">
                            {flightData.returnFlight?.arrival?.city || "N/A"} (
                            {flightData.returnFlight?.arrival?.code || "N/A"})
                          </p>
                          <p className="text-xs text-gray-600">
                            {flightData.returnFlight?.arrival?.time || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Total Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            Tổng thời gian
                          </h4>
                          <p className="text-sm text-gray-600">Khứ hồi</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">
                            {flightData.duration || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600">Bay thẳng</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : flightData.isMultiCity ? (
                  <div className="space-y-6">
                    {/* Multi-city Header */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                          <Plane className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-purple-800">
                          Chuyến bay đa chặng
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-purple-600 border-purple-600"
                        >
                          {flightData.multiCityLegs?.length || 0} chặng
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-700">
                          {flightData.from} → {flightData.to}
                        </span>
                        <span className="text-purple-700 font-medium">
                          Tổng: {flightData.duration || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Multi-city Legs */}
                    {flightData.multiCityLegs?.map((leg, legIndex) => {
                      // Tạo danh sách các điểm (departure -> stops -> arrival) cho tuyến đường
                      const routePoints = [
                        leg.departure,
                        ...(leg.stopsList || []),
                        leg.arrival,
                      ].filter((point) => point?.code); // Loại bỏ điểm không hợp lệ

                      return (
                        <div
                          key={legIndex}
                          className="border-l-4 border-purple-500 pl-6"
                        >
                          {/* Route Display */}
                          <div className="flex items-center gap-2 mb-4 flex-wrap">
                            {routePoints.map((point, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <span className="font-semibold text-gray-800">
                                  {point.city || point.code || "N/A"}
                                </span>
                                {index < routePoints.length - 1 && (
                                  <ArrowRight className="w-4 h-4 text-gray-500" />
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Leg Details */}
                          <div className="relative mb-6">
                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-purple-200"></div>
                            {routePoints.map((point, index) => {
                              if (index === routePoints.length - 1) return null; // Bỏ qua điểm cuối (sẽ hiển thị riêng)

                              const isStop =
                                index > 0 && index < routePoints.length - 1;
                              const nextPoint = routePoints[index + 1];
                              const departureTime =
                                index === 0
                                  ? leg.departure?.time
                                  : calculateDepartureTime(
                                      point.arrivalTime,
                                      point.stopDuration
                                    );
                              const arrivalTime = isStop
                                ? point.arrivalTime
                                : leg.arrival?.time;

                              return (
                                <div
                                  key={index}
                                  className="flex items-start space-x-4 mb-4 relative z-10"
                                >
                                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    {isStop ? (
                                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                    ) : (
                                      <MapPin className="w-5 h-5 text-purple-600" />
                                    )}
                                  </div>
                                  <div className="flex-grow">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-gray-800">
                                        {point.city || point.code || "N/A"} →{" "}
                                        {nextPoint.city ||
                                          nextPoint.code ||
                                          "N/A"}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-xs text-purple-600 border-purple-600"
                                      >
                                        {leg.flightNumber || "N/A"}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      <span>
                                        Khởi hành: {departureTime || "N/A"}
                                      </span>{" "}
                                      | <span>Đến: {arrivalTime || "N/A"}</span>
                                      {isStop && point.stopDuration && (
                                        <>
                                          {" | "}
                                          <span>
                                            Thời gian dừng: {point.stopDuration}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Multi-city Summary */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-bold text-purple-800 mb-3">
                        Tổng quan chuyến bay đa chặng
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <h5 className="font-semibold text-purple-800">
                            Tổng chặng
                          </h5>
                          <p className="text-lg font-bold text-purple-600">
                            {flightData.multiCityLegs?.length || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <h5 className="font-semibold text-purple-800">
                            Tổng thời gian
                          </h5>
                          <p className="text-lg font-bold text-purple-600">
                            {flightData.duration || "N/A"}
                          </p>
                        </div>
                        <div className="text-center">
                          <h5 className="font-semibold text-purple-800">
                            Tổng điểm dừng
                          </h5>
                          <p className="text-lg font-bold text-purple-600">
                            {flightData.stops || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <h5 className="font-semibold text-purple-800">
                            Loại chuyến bay
                          </h5>
                          <Badge
                            variant="outline"
                            className="text-purple-600 border-purple-600"
                          >
                            Đa chặng
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // One-way flight summary
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                      <MapPin className="w-8 h-8 mb-3 text-blue-600" />
                      <h3 className="font-semibold text-lg">Khởi hành</h3>
                      <p className="font-bold">
                        {flightData.departure?.city || flightData.from || "N/A"}{" "}
                        (
                        {flightData.departure?.code ||
                          flightData.fromCode ||
                          "N/A"}
                        )
                      </p>
                      <p className="text-sm text-gray-600">
                        {flightData.departure?.time || "N/A"},{" "}
                        {flightData.departure?.date || "N/A"}
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                      <Plane className="w-8 h-8 mb-3 text-blue-600" />
                      <h3 className="font-semibold text-lg">
                        Chi tiết chuyến bay
                      </h3>
                      <p className="font-bold">
                        {flightData.duration || "N/A"} •{" "}
                        {formatStops(flightData.stops) || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Máy bay: {flightData.aircraft || "N/A"}
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                      <MapPin className="w-8 h-8 mb-3 text-blue-600" />
                      <h3 className="font-semibold text-lg">Đến nơi</h3>
                      <p className="font-bold">
                        {flightData.arrival?.city || flightData.to || "N/A"} (
                        {flightData.arrival?.code || flightData.toCode || "N/A"}
                        )
                      </p>
                      <p className="text-sm text-gray-600">
                        {flightData.arrival?.time || "N/A"},{" "}
                        {flightData.arrival?.date || "N/A"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fare Selection Section */}
            <div className="mt-4 border-t pt-4 bg-gray-50 dark:bg-gray-800 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-4 rounded-b-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                  {flightData?.isRoundTrip
                    ? "Chọn hạng vé cho chuyến bay khứ hồi"
                    : flightData?.isMultiCity
                    ? "Chọn hạng vé cho chuyến bay đa chặng"
                    : "Chọn loại vé phù hợp"}
                </h3>
                {(selectedFares[
                  `${flightData?.itineraryId || flightData?.id}-outbound`
                ] ||
                  selectedFares[
                    `${flightData?.itineraryId || flightData?.id}-return`
                  ] ||
                  outboundFare ||
                  returnFare) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFareSelection}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Đặt lại lựa chọn
                  </Button>
                )}
              </div>

              {flightData?.isRoundTrip ? (
                // Round-trip fare selection with stepper
                <div className="space-y-6">
                  {/* Step Indicator */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          fareSelectionStep === "outbound"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        1
                      </div>
                      <div className="text-sm font-medium">Chọn vé đi</div>
                      <div className="w-8 h-0.5 bg-gray-300"></div>
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          fareSelectionStep === "return"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        2
                      </div>
                      <div className="text-sm font-medium">Chọn vé về</div>
                    </div>
                    {fareSelectionStep === "return" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBackToOutbound}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                        Quay lại
                      </Button>
                    )}
                  </div>

                  {/* Current Step Content */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-200">
                      {fareSelectionStep === "outbound"
                        ? "Chọn hạng vé chuyến đi"
                        : "Chọn hạng vé chuyến về"}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {fareSelectionStep === "outbound"
                        ? `${flightData.outboundFlight?.departure?.code} → ${flightData.outboundFlight?.arrival?.code}`
                        : `${flightData.returnFlight?.departure?.code} → ${flightData.returnFlight?.arrival?.code}`}
                    </p>
                  </div>

                  {/* Fare Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {(fareSelectionStep === "outbound"
                      ? flightData.outboundFlight?.flightTravelClasses
                      : flightData.returnFlight?.flightTravelClasses
                    )?.map((travelClass, index) => {
                      const isRecommended = index === 0;
                      const currentKey =
                        fareSelectionStep === "outbound"
                          ? `${
                              flightData.itineraryId || flightData.id
                            }-outbound`
                          : `${flightData.itineraryId || flightData.id}-return`;
                      const currentFare = selectedFares[currentKey];

                      return (
                        <FareOption
                          key={`${fareSelectionStep}-${travelClass.id}`}
                          fare={{
                            id: travelClass.id,
                            name:
                              travelClass.travelClass?.className ||
                              `Hạng ${index + 1}`,
                            price: travelClass.customPrice,
                            recommended: isRecommended,
                            features: [
                              { included: true, text: "Hành lý xách tay" },
                              {
                                included:
                                  travelClass.travelClass?.benefits
                                    ?.toLowerCase()
                                    .includes("ký gửi") || false,
                                text: "Hành lý ký gửi",
                              },
                              {
                                included:
                                  travelClass.travelClass?.benefits
                                    ?.toLowerCase()
                                    .includes("chỗ ngồi") || false,
                                text: "Chọn chỗ ngồi",
                              },
                              {
                                included:
                                  travelClass.travelClass?.changeable || false,
                                text: "Đổi vé",
                              },
                              {
                                included:
                                  travelClass.travelClass?.refundable || false,
                                text: "Hoàn tiền",
                              },
                            ],
                            availableSeats: travelClass.availableSeats,
                          }}
                          flight={flightData}
                          isSelected={currentFare === travelClass.id}
                          onSelect={() => handleSelectFare(travelClass.id)}
                          showProceedButton={false}
                        />
                      );
                    })}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {fareSelectionStep === "outbound" &&
                        selectedFares[
                          `${flightData.itineraryId || flightData.id}-outbound`
                        ] && (
                          <span className="text-green-600">
                            ✓ Đã chọn hạng vé chuyến đi
                          </span>
                        )}
                      {fareSelectionStep === "return" &&
                        selectedFares[
                          `${flightData.itineraryId || flightData.id}-return`
                        ] && (
                          <span className="text-green-600">
                            ✓ Đã chọn hạng vé chuyến về
                          </span>
                        )}
                    </div>

                    <div className="flex space-x-3">
                      {fareSelectionStep === "outbound" &&
                        selectedFares[
                          `${flightData.itineraryId || flightData.id}-outbound`
                        ] && (
                          <Button
                            onClick={handleNext}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Tiếp tục chọn vé về
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}

                      {fareSelectionStep === "return" &&
                        selectedFares[
                          `${flightData.itineraryId || flightData.id}-outbound`
                        ] &&
                        selectedFares[
                          `${flightData.itineraryId || flightData.id}-return`
                        ] && (
                          <Button
                            onClick={() =>
                              handleProceedToBooking(
                                flightData,
                                selectedFares[
                                  `${
                                    flightData.itineraryId || flightData.id
                                  }-outbound`
                                ]
                              )
                            }
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                          >
                            Đặt vé ngay
                            <Plane className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                    </div>
                  </div>

                  {/* Notification when both fares are selected */}
                  {selectedFares[
                    `${flightData.itineraryId || flightData.id}-outbound`
                  ] &&
                    selectedFares[
                      `${flightData.itineraryId || flightData.id}-return`
                    ] && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-green-800">
                              Hoàn thành chọn vé khứ hồi
                            </h4>
                            <p className="text-sm text-green-700">
                              Bạn đã chọn hạng vé cho cả chuyến đi và chuyến về.
                              Bấm "Đặt vé ngay" để tiếp tục đặt vé.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              ) : flightData?.isMultiCity ? (
                // Multi-city fare selection
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <h4 className="font-semibold text-purple-800">
                        Chọn hạng vé cho tất cả các chặng
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {flightData.multiCityLegs?.length || 0} chặng
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {flightData.flightTravelClasses?.map(
                        (travelClass, index) => {
                          const isRecommended = index === 0;
                          return (
                            <FareOption
                              key={travelClass.id}
                              fare={{
                                id: travelClass.id,
                                name:
                                  travelClass.travelClass?.className ||
                                  `Hạng ${index + 1}`,
                                price: travelClass.customPrice,
                                recommended: isRecommended,
                                features: [
                                  { included: true, text: "Hành lý xách tay" },
                                  {
                                    included:
                                      travelClass.travelClass?.benefits
                                        ?.toLowerCase()
                                        .includes("ký gửi") || false,
                                    text: "Hành lý ký gửi",
                                  },
                                  {
                                    included:
                                      travelClass.travelClass?.benefits
                                        ?.toLowerCase()
                                        .includes("chỗ ngồi") || false,
                                    text: "Chọn chỗ ngồi",
                                  },
                                  {
                                    included:
                                      travelClass.travelClass?.changeable ||
                                      false,
                                    text: "Đổi vé",
                                  },
                                  {
                                    included:
                                      travelClass.travelClass?.refundable ||
                                      false,
                                    text: "Hoàn tiền",
                                  },
                                ],
                                availableSeats: travelClass.availableSeats,
                              }}
                              flight={flightData}
                              isSelected={selectedFare === travelClass.id}
                              onSelect={() => handleSelectFare(travelClass.id)}
                              onProceedToBooking={handleProceedToBooking}
                            />
                          );
                        }
                      )}
                    </div>
                  </div>

                  {selectedFare && flightData?.flightTravelClasses && (
                    <FareSummary
                      fare={
                        flightData.flightTravelClasses?.find(
                          (tc) => tc.id === selectedFare
                        )
                          ? {
                              id: flightData.flightTravelClasses.find(
                                (tc) => tc.id === selectedFare
                              ).id,
                              name:
                                flightData.flightTravelClasses.find(
                                  (tc) => tc.id === selectedFare
                                ).travelClass?.className || "Hạng vé",
                              price: flightData.flightTravelClasses.find(
                                (tc) => tc.id === selectedFare
                              ).customPrice,
                            }
                          : null
                      }
                      onProceedToBooking={() =>
                        handleProceedToBooking(flightData, selectedFare)
                      }
                    />
                  )}
                </div>
              ) : (
                // One-way fare selection
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {flightData?.flightTravelClasses &&
                  flightData.flightTravelClasses.length > 0 ? (
                    flightData.flightTravelClasses.map((travelClass, index) => {
                      const isRecommended =
                        index === 0 ||
                        travelClass.customPrice ===
                          Math.min(
                            ...flightData.flightTravelClasses.map(
                              (tc) => tc.customPrice
                            )
                          );

                      return (
                        <FareOption
                          key={travelClass.id}
                          fare={{
                            id: travelClass.id,
                            name:
                              travelClass.travelClass?.className ||
                              `Hạng ${index + 1}`,
                            price: travelClass.customPrice,
                            recommended: isRecommended,
                            features: [
                              { included: true, text: "Hành lý xách tay" },
                              {
                                included:
                                  travelClass.travelClass?.benefits
                                    ?.toLowerCase()
                                    .includes("ký gửi") ||
                                  travelClass.travelClass?.benefits
                                    ?.toLowerCase()
                                    .includes("luggage") ||
                                  false,
                                text: "Hành lý ký gửi",
                              },
                              {
                                included:
                                  travelClass.travelClass?.benefits
                                    ?.toLowerCase()
                                    .includes("chỗ ngồi") ||
                                  travelClass.travelClass?.benefits
                                    ?.toLowerCase()
                                    .includes("seat") ||
                                  false,
                                text: "Chọn chỗ ngồi",
                              },
                              {
                                included:
                                  travelClass.travelClass?.changeable || false,
                                text: "Đổi vé",
                              },
                              {
                                included:
                                  travelClass.travelClass?.refundable || false,
                                text: "Hoàn tiền",
                              },
                            ],
                            availableSeats: travelClass.availableSeats,
                            benefits: travelClass.travelClass?.benefits,
                          }}
                          flight={flightData}
                          isSelected={selectedFare === travelClass.id}
                          onSelect={() => handleSelectFare(travelClass.id)}
                          onProceedToBooking={handleProceedToBooking}
                        />
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <p>Không có thông tin hạng vé cho chuyến bay này</p>
                      <p className="text-sm mt-2">
                        Vui lòng liên hệ với hãng hàng không để biết thêm chi
                        tiết
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* One-way fare summary */}
              {!flightData?.isRoundTrip &&
                !flightData?.isMultiCity &&
                selectedFare &&
                flightData?.flightTravelClasses && (
                  <FareSummary
                    fare={
                      flightData.flightTravelClasses?.find(
                        (tc) => tc.id === selectedFare
                      )
                        ? {
                            id: flightData.flightTravelClasses.find(
                              (tc) => tc.id === selectedFare
                            ).id,
                            name:
                              flightData.flightTravelClasses.find(
                                (tc) => tc.id === selectedFare
                              ).travelClass?.className || "Hạng vé",
                            price: flightData.flightTravelClasses.find(
                              (tc) => tc.id === selectedFare
                            ).customPrice,
                          }
                        : null
                    }
                    onProceedToBooking={() =>
                      handleProceedToBooking(flightData, selectedFare)
                    }
                  />
                )}
            </div>

            {/* Flight Information Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-600">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-50 dark:bg-gray-300 rounded-t-lg border-b">
                  <TabsTrigger value="details" className="text-sm">
                    Chi tiết chuyến bay
                  </TabsTrigger>
                  <TabsTrigger
                    value="route-map"
                    className="text-sm flex items-center"
                  >
                    <Map className="w-4 h-4 mr-1" />
                    Bản đồ tuyến bay
                  </TabsTrigger>
                  <TabsTrigger value="policies" className="text-sm">
                    Chính sách
                  </TabsTrigger>
                  <TabsTrigger value="amenities" className="text-sm">
                    Tiện ích
                  </TabsTrigger>
                </TabsList>

                <div className="p-6">
                  <TabsContent value="details" className="mt-0">
                    {flightData.isRoundTrip ? (
                      // Round-trip flight details
                      <div className="space-y-8">
                        {/* Outbound Flight Details */}
                        <div className="border-l-4 border-blue-500 pl-6">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                            <h3 className="text-xl font-bold text-blue-800">
                              Chuyến đi
                            </h3>
                            <Badge
                              variant="outline"
                              className="text-blue-600 border-blue-600"
                            >
                              {flightData.outboundFlight?.departure?.code} →{" "}
                              {flightData.outboundFlight?.arrival?.code}
                            </Badge>
                          </div>

                          <div className="relative mb-6">
                            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-blue-200"></div>

                            <div className="flex items-start space-x-4 mb-8">
                              <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center relative z-10">
                                <Plane className="w-8 h-8 text-blue-600" />
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Khởi hành
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className="text-green-600 border-green-600"
                                  >
                                    Đúng giờ
                                  </Badge>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                                  {flightData.outboundFlight?.departure?.time ||
                                    "N/A"}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {flightData.outboundFlight?.departure?.date ||
                                    "N/A"}
                                </p>
                                <p className="text-lg font-medium text-gray-800 mt-1 dark:text-gray-300">
                                  {flightData.outboundFlight?.departure?.city ||
                                    "N/A"}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {flightData.outboundFlight?.terminal || "TBA"}
                                  , Cổng{" "}
                                  {flightData.outboundFlight?.gate || "TBA"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 mb-8 ml-8">
                              <div className="flex-grow border-l-2 border-dashed border-blue-300 pl-4">
                                <div className="bg-blue-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">
                                      Thời gian bay
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                      {flightData.outboundFlight?.duration ||
                                        "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-sm text-gray-600">
                                      Máy bay
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                      {flightData.outboundFlight?.aircraft ||
                                        "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center relative z-10">
                                <MapPin className="w-8 h-8 text-green-600" />
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Đến nơi
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className="text-green-600 border-green-600"
                                  >
                                    Đúng giờ
                                  </Badge>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                                  {flightData.outboundFlight?.arrival?.time ||
                                    "N/A"}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {flightData.outboundFlight?.arrival?.date ||
                                    "N/A"}
                                </p>
                                <p className="text-lg font-medium text-gray-800 mt-1 dark:text-gray-300">
                                  {flightData.outboundFlight?.arrival?.city ||
                                    "N/A"}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Terminal{" "}
                                  {flightData.outboundFlight?.terminal || "TBA"}
                                  , Cổng{" "}
                                  {flightData.outboundFlight?.gate || "TBA"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Outbound Flight Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-800 mb-3">
                                Thông tin chuyến bay
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Số hiệu:
                                  </span>
                                  <span className="font-medium">
                                    {flightData.outboundFlight?.flightNumber ||
                                      "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Loại máy bay:
                                  </span>
                                  <span className="font-medium">
                                    {flightData.outboundFlight?.aircraft ||
                                      "N/A"}
                                  </span>
                                </div>

                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Hãng bay:
                                  </span>
                                  <span className="font-medium">
                                    {flightData.outboundFlight?.airline ||
                                      "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-800 mb-3">
                                Thời gian làm thủ tục
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Check-in online:
                                  </span>
                                  <span className="font-medium">
                                    24h trước giờ bay
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Check-in sân bay:
                                  </span>
                                  <span className="font-medium">
                                    2h trước giờ bay
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Lên máy bay:
                                  </span>
                                  <span className="font-medium">
                                    30p trước giờ bay
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Đóng cổng:
                                  </span>
                                  <span className="font-medium">
                                    10p trước giờ bay
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Return Flight Details */}
                        <div className="border-l-4 border-green-500 pl-6">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                            <h3 className="text-xl font-bold text-green-800">
                              Chuyến về
                            </h3>
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                            >
                              {flightData.returnFlight?.departure?.code} →{" "}
                              {flightData.returnFlight?.arrival?.code}
                            </Badge>
                          </div>

                          <div className="relative mb-6">
                            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-green-200"></div>

                            <div className="flex items-start space-x-4 mb-8">
                              <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center relative z-10">
                                <Plane className="w-8 h-8 text-green-600" />
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Khởi hành
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className="text-green-600 border-green-600"
                                  >
                                    Đúng giờ
                                  </Badge>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                                  {flightData.returnFlight?.departure?.time ||
                                    "N/A"}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {flightData.returnFlight?.departure?.date ||
                                    "N/A"}
                                </p>
                                <p className="text-lg font-medium text-gray-800 mt-1 dark:text-gray-300">
                                  {flightData.returnFlight?.departure?.city ||
                                    "N/A"}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {flightData.returnFlight?.terminal || "TBA"},
                                  Cổng {flightData.returnFlight?.gate || "TBA"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 mb-8 ml-8">
                              <div className="flex-grow border-l-2 border-dashed border-green-300 pl-4">
                                <div className="bg-green-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">
                                      Thời gian bay
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                      {flightData.returnFlight?.duration ||
                                        "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-sm text-gray-600">
                                      Máy bay
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                      {flightData.returnFlight?.aircraft ||
                                        "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center relative z-10">
                                <MapPin className="w-8 h-8 text-blue-600" />
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Đến nơi
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className="text-green-600 border-green-600"
                                  >
                                    Đúng giờ
                                  </Badge>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                                  {flightData.returnFlight?.arrival?.time ||
                                    "N/A"}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {flightData.returnFlight?.arrival?.date ||
                                    "N/A"}
                                </p>
                                <p className="text-lg font-medium text-gray-800 mt-1 dark:text-gray-300">
                                  {flightData.returnFlight?.arrival?.city ||
                                    "N/A"}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Terminal{" "}
                                  {flightData.returnFlight?.terminal || "TBA"},
                                  Cổng {flightData.returnFlight?.gate || "TBA"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Return Flight Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-green-50 rounded-lg p-4">
                              <h4 className="font-semibold text-green-800 mb-3">
                                Thông tin chuyến bay
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Số hiệu:
                                  </span>
                                  <span className="font-medium">
                                    {flightData.returnFlight?.flightNumber ||
                                      "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Loại máy bay:
                                  </span>
                                  <span className="font-medium">
                                    {flightData.returnFlight?.aircraft || "N/A"}
                                  </span>
                                </div>

                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Hãng bay:
                                  </span>
                                  <span className="font-medium">
                                    {flightData.returnFlight?.airline || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-green-50 rounded-lg p-4">
                              <h4 className="font-semibold text-green-800 mb-3">
                                Thời gian làm thủ tục
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Check-in online:
                                  </span>
                                  <span className="font-medium">
                                    24h trước giờ bay
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Check-in sân bay:
                                  </span>
                                  <span className="font-medium">
                                    2h trước giờ bay
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Lên máy bay:
                                  </span>
                                  <span className="font-medium">
                                    30p trước giờ bay
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Đóng cổng:
                                  </span>
                                  <span className="font-medium">
                                    10p trước giờ bay
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Round-trip Summary */}
                        <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <div className="w-5 h-5 bg-gray-600 rounded-full mr-3"></div>
                            Tổng quan chuyến bay khứ hồi
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                              <p className="text-sm text-gray-600">
                                Tổng thời gian
                              </p>
                              <p className="text-xl font-bold text-gray-800">
                                {flightData.duration || "N/A"}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Hãng bay</p>
                              <p className="text-xl font-bold text-gray-800">
                                {flightData.airline || "N/A"}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600">
                                Loại chuyến bay
                              </p>
                              <p className="text-xl font-bold text-gray-800">
                                Khứ hồi
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : flightData.isMultiCity ? (
                      // Multi-city flight details
                      <div className="space-y-8">
                        {/* Multi-city Header */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                              <Plane className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-purple-800">
                              Chi tiết chuyến bay đa chặng
                            </h3>
                            <Badge
                              variant="outline"
                              className="text-purple-600 border-purple-600"
                            >
                              {flightData.multiCityLegs?.length || 0} chặng
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-purple-700 font-medium">
                                Tuyến bay:
                              </span>
                              <p className="text-purple-600">
                                {flightData.from} → {flightData.to}
                              </p>
                            </div>
                            <div>
                              <span className="text-purple-700 font-medium">
                                Tổng thời gian:
                              </span>
                              <p className="text-purple-600">
                                {flightData.duration || "N/A"}
                              </p>
                            </div>
                            <div>
                              <span className="text-purple-700 font-medium">
                                Hãng bay:
                              </span>
                              <p className="text-purple-600">
                                {flightData.airline || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Multi-city Legs Details */}
                        {flightData.multiCityLegs?.map((leg, legIndex) => (
                          <div
                            key={legIndex}
                            className="border-l-4 border-purple-500 pl-6"
                          >
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Chặng {legIndex + 1}: {leg.departure?.city} →{" "}
                                {leg.arrival?.city}
                              </h3>
                              <Badge
                                variant="outline"
                                className="text-purple-600 border-purple-600"
                              >
                                {leg.airline}
                              </Badge>
                            </div>

                            <div className="relative mb-8">
                              <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-purple-200"></div>

                              {/* Departure Section */}
                              <div className="flex items-start space-x-6 mb-8">
                                <div className="flex-shrink-0 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center relative z-10">
                                  <MapPin className="w-8 h-8 text-purple-600" />
                                </div>
                                <div className="flex-grow">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                      Khởi hành
                                    </h4>
                                    <Badge
                                      variant="outline"
                                      className="text-purple-600 border-purple-600"
                                    >
                                      {leg.departure?.code} →{" "}
                                      {leg.arrival?.code}
                                    </Badge>
                                  </div>
                                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-300">
                                    {leg.departure?.time}
                                  </p>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    {leg.departure?.date}
                                  </p>
                                  <p className="text-lg font-medium text-gray-800 mt-1 dark:text-gray-300">
                                    {leg.departure?.city}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Terminal {leg.terminal || "TBA"}, Cổng{" "}
                                    {leg.gate || "TBA"}
                                  </p>
                                </div>
                              </div>

                              {/* Flight Section */}
                              <div className="flex items-start space-x-6 mb-8">
                                <div className="flex-shrink-0 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center relative z-10">
                                  <Plane className="w-8 h-8 text-purple-600" />
                                </div>
                                <div className="flex-grow">
                                  <div className="bg-purple-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-purple-800 mb-3">
                                      Thông tin chuyến bay
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Số hiệu:
                                        </span>
                                        <span className="font-medium">
                                          {leg.flightNumber || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Hãng bay:
                                        </span>
                                        <span className="font-medium">
                                          {leg.airline || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Máy bay:
                                        </span>
                                        <span className="font-medium">
                                          {leg.aircraft || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Thời gian bay:
                                        </span>
                                        <span className="font-medium">
                                          {leg.duration || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Hạng ghế:
                                        </span>
                                        <span className="font-medium">
                                          {leg.travelClass || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Trạng thái:
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-green-600 border-green-600"
                                        >
                                          {leg.status || "ON_TIME"}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Stops Section */}
                              {leg.stopsList && leg.stopsList.length > 0 && (
                                <div className="mb-8">
                                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 dark:text-white">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    Điểm dừng ({leg.stopsList.length})
                                  </h4>
                                  <div className="space-y-4">
                                    {leg.stopsList.map((stop, stopIndex) => (
                                      <div
                                        key={stopIndex}
                                        className="flex items-start space-x-6"
                                      >
                                        <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center relative z-10">
                                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        </div>
                                        <div className="flex-grow">
                                          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                            <div className="flex items-center justify-between mb-2">
                                              <h5 className="font-semibold text-gray-900">
                                                {stop.airportName} (
                                                {stop.airportCode})
                                              </h5>
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                Điểm dừng {stopIndex + 1}
                                              </Badge>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                              <div>
                                                <span className="text-gray-600">
                                                  Thời gian đến:
                                                </span>
                                                <p className="font-medium">
                                                  {stop.arrivalTime || "N/A"}
                                                </p>
                                              </div>
                                              <div>
                                                <span className="text-gray-600">
                                                  Thời gian dừng:
                                                </span>
                                                <p className="font-medium">
                                                  {stop.stopDuration || "N/A"}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Arrival Section */}
                              <div className="flex items-start space-x-6">
                                <div className="flex-shrink-0 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center relative z-10">
                                  <MapPin className="w-8 h-8 text-purple-600" />
                                </div>
                                <div className="flex-grow">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                      Đến nơi
                                    </h4>
                                    <Badge
                                      variant="outline"
                                      className="text-purple-600 border-purple-600"
                                    >
                                      {leg.arrival?.code}
                                    </Badge>
                                  </div>
                                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-300">
                                    {leg.arrival?.time}
                                  </p>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    {leg.arrival?.date}
                                  </p>
                                  <p className="text-lg font-medium text-gray-800 mt-1 dark:text-gray-300">
                                    {leg.arrival?.city}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Terminal {leg.arrival?.terminal || "TBA"},
                                    Cổng {leg.arrival?.gate || "TBA"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Leg Amenities */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-purple-50 rounded-lg p-4">
                                <h4 className="font-semibold text-purple-800 mb-3">
                                  Tiện nghi & Dịch vụ
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Wifi:</span>
                                    <span className="font-medium">
                                      {leg.wifi ? "Có" : "Không"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Bữa ăn:
                                    </span>
                                    <span className="font-medium">
                                      {leg.meal ? "Có" : "Không"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Giải trí:
                                    </span>
                                    <span className="font-medium">
                                      {leg.entertainment ? "Có" : "Không"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">USB:</span>
                                    <span className="font-medium">
                                      {leg.usb ? "Có" : "Không"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-purple-50 rounded-lg p-4">
                                <h4 className="font-semibold text-purple-800 mb-3">
                                  Thông tin bổ sung
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Ghế trống:
                                    </span>
                                    <span className="font-medium text-green-600">
                                      {leg.availableSeats || "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Giá vé:
                                    </span>
                                    <span className="font-medium text-purple-600">
                                      {leg.price
                                        ? `${leg.price.toLocaleString()} VND`
                                        : "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Liên hệ:
                                    </span>
                                    <span className="font-medium">
                                      {leg.contact || "19001100"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Website:
                                    </span>
                                    <span className="font-medium text-blue-600">
                                      {leg.website || "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Multi-city Summary */}
                        <div className="bg-gray-50 rounded-lg p-6 dark:bg-gray-800">
                          <h3 className="text-xl font-bold text-gray-900 mb-4 dark:text-white">
                            Tổng quan chuyến bay đa chặng
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Tổng chặng
                              </p>
                              <p className="text-xl font-bold text-gray-800 dark:text-gray-300">
                                {flightData.multiCityLegs?.length || 0}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Tổng thời gian
                              </p>
                              <p className="text-xl font-bold text-gray-800 dark:text-gray-300">
                                {flightData.duration || "N/A"}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Tổng điểm dừng
                              </p>
                              <p className="text-xl font-bold text-gray-800 dark:text-gray-300">
                                {flightData.stops || 0}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Loại chuyến bay
                              </p>
                              <Badge
                                variant="outline"
                                className="text-purple-600 border-purple-600"
                              >
                                Đa chặng
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // One-way flight details (existing code)
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                            Lịch trình chuyến bay
                          </h3>
                          <div className="relative">
                            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200"></div>

                            <div className="flex items-start space-x-4 mb-8">
                              <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center relative z-10">
                                <Plane className="w-8 h-8 text-blue-600" />
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Khởi hành
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className="text-green-600 border-green-600"
                                  >
                                    Đúng giờ
                                  </Badge>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                                  {flightData?.departure?.time || "N/A"}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {flightData?.departure?.date || "N/A"}
                                </p>
                                <p className="text-lg font-medium text-gray-800 mt-1 dark:text-gray-300">
                                  {flightData?.departure?.city ||
                                    flightData?.from ||
                                    "N/A"}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {flightData?.terminal || "TBA"}, Cổng{" "}
                                  {flightData?.gate || "TBA"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 mb-8 ml-8">
                              <div className="flex-grow border-l-2 border-dashed border-gray-300 pl-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">
                                      Thời gian bay
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                      {flightData.duration}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-sm text-gray-600">
                                      Máy bay
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                      {flightData.aircraft}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center relative z-10">
                                <MapPin className="w-8 h-8 text-green-600" />
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Đến nơi
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className="text-green-600 border-green-600"
                                  >
                                    Đúng giờ
                                  </Badge>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                                  {flightData?.arrival?.time || "N/A"}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {flightData?.arrival?.date || "N/A"}
                                </p>
                                <p className="text-lg font-medium text-gray-800 mt-1 dark:text-gray-300">
                                  {flightData?.arrival?.city ||
                                    flightData?.to ||
                                    "N/A"}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Terminal {flightData?.terminal || "TBA"}, Cổng{" "}
                                  {flightData?.gate || "TBA"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                              Thông tin chuyến bay
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-white">
                                  Số hiệu chuyến bay:
                                </span>
                                <span className="font-medium">
                                  {flightData.flightNumber}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-white">
                                  Loại máy bay:
                                </span>
                                <span className="font-medium">
                                  {flightData.aircraft}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-white">
                                  Vận hành bởi:
                                </span>
                                <span className="font-medium">
                                  {flightData.airline}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                              Thông tin làm thủ tục
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-white">
                                  Check-in online:
                                </span>
                                <span className="font-medium">
                                  24h trước giờ bay
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-white">
                                  Check-in sân bay:
                                </span>
                                <span className="font-medium">
                                  2h trước giờ bay
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-white">
                                  Lên máy bay:
                                </span>
                                <span className="font-medium">
                                  30p trước giờ bay
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-white ">
                                  Đóng cổng:
                                </span>
                                <span className="font-medium">
                                  10p trước giờ bay
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="route-map" className="mt-0">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center dark:text-white">
                          Bản đồ tuyến bay trực quan{" "}
                          <span className="text-gray-400">
                            {" "}
                            (mô phỏng đường bay dựa trên các điểm đến cụ thể đã
                            được xác định trước đó)
                          </span>
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Xem đường bay từ{" "}
                          {flightData.departure?.city || flightData.from} đến{" "}
                          {flightData.arrival?.city || flightData.to} trên bản
                          đồ với khoảng cách và thông tin chi tiết của chuyến
                          bay{" "}
                          <span className="font-semibold text-green-500">
                            {flightData.flightNumber || "N/A"}{" "}
                          </span>
                          .
                        </p>

                        {/* Flight Route Map */}
                        <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                          {(() => {
                            const legs = getFlightLegs(flightData);
                            const coords = getAirportCoordsMap(flightData);
                            const processed =
                              getProcessedSearchData(flightData);
                            console.log("FlightRouteMap Debug:", {
                              flightData: flightData,
                              legsCount: legs.length,
                              coordsCount: Object.keys(coords).length,
                              legs: legs,
                              coords: coords,
                              processed: processed,
                              note: "Coordinates will be resolved by FlightRouteMap using airport codes",
                            });
                            return legs.length > 0 &&
                              Object.keys(coords).length > 0 ? (
                              <FlightRouteMap
                                flightInfo={flightData}
                                legs={legs}
                                coordsMap={coords}
                                processedSearchData={processed}
                                height="500px"
                                showFlightPath={true}
                                showAirportInfo={true}
                                showFlightInfo={true}
                                showLegend={true}
                                showControls={true}
                                className="w-full"
                              />
                            ) : (
                              <div className="h-[500px] flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                  <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                    Không thể tải bản đồ
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    Không có đủ thông tin để hiển thị đường bay
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Additional flight route information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                              <h4 className="font-semibold text-green-800">
                                Sân bay khởi hành
                              </h4>
                            </div>
                            <p className="text-sm font-medium text-gray-800">
                              {flightData.departure?.city || flightData.from} (
                              {flightData.departure?.code ||
                                flightData.fromCode}
                              )
                            </p>
                            <p className="text-xs text-gray-600">
                              Khởi hành:{" "}
                              {flightData.departure?.time ||
                                flightData.departureTime}{" "}
                              •{" "}
                              {flightData.departure?.date ||
                                flightData.departureDate}
                            </p>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <Plane className="w-4 h-4 text-blue-600 mr-2" />
                              <h4 className="font-semibold text-blue-800">
                                Thông tin chuyến bay
                              </h4>
                            </div>
                            <p className="text-sm font-medium text-gray-800">
                              {flightData.flightNumber || "N/A"} •{" "}
                              {flightData.aircraft || "N/A"}
                            </p>
                            <p className="text-xs text-gray-600">
                              Thời gian bay: {flightData.duration || "N/A"} •{" "}
                              {formatStops(flightData.stops)}
                            </p>
                          </div>

                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                              <h4 className="font-semibold text-red-800">
                                Sân bay đến
                              </h4>
                            </div>
                            <p className="text-sm font-medium text-gray-800">
                              {flightData.arrival?.city || flightData.to} (
                              {flightData.arrival?.code || flightData.toCode})
                            </p>
                            <p className="text-xs text-gray-600">
                              Đến nơi:{" "}
                              {flightData.arrival?.time ||
                                flightData.arrivalTime}{" "}
                              •{" "}
                              {flightData.arrival?.date ||
                                flightData.arrivalDate}
                            </p>
                          </div>
                        </div>

                        {/* Map features info */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-2">
                            Tính năng bản đồ:
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Check className="w-4 h-4 text-green-500 mr-2" />
                              <span>Zoom và pan tương tác</span>
                            </div>
                            <div className="flex items-center">
                              <Check className="w-4 h-4 text-green-500 mr-2" />
                              <span>Đường bay thực tế</span>
                            </div>
                            <div className="flex items-center">
                              <Check className="w-4 h-4 text-green-500 mr-2" />
                              <span>Thông tin sân bay chi tiết</span>
                            </div>
                            <div className="flex items-center">
                              <Check className="w-4 h-4 text-green-500 mr-2" />
                              <span>Khoảng cách chính xác</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="policies" className="mt-0">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                          Chính sách hành lý
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <Package className="w-5 h-5 text-blue-600 mr-2" />
                              <h4 className="font-semibold">
                                Hành lý xách tay
                              </h4>
                            </div>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                              <li>• Trọng lượng tối đa: 7kg</li>
                              <li>• Kích thước tối đa: 56 x 36 x 23 cm</li>
                              <li>• 1 kiện bao gồm trong tất cả vé</li>
                              <li>• Phải vừa ngăn hành lý trên đầu</li>
                            </ul>
                          </div>

                          <div className="border rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <Luggage className="w-5 h-5 text-blue-600 mr-2" />
                              <h4 className="font-semibold">Hành lý ký gửi</h4>
                            </div>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                              <li>• Phổ thông: 1 x 23kg bao gồm</li>
                              <li>• Thương gia: 2 x 32kg bao gồm</li>
                              <li>• Kích thước tối đa: 158cm tổng</li>
                              <li>• Có thể mua thêm hành lý</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                          Hủy & Thay đổi
                        </h3>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center mb-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                            <h4 className="font-semibold text-yellow-800">
                              Thông báo quan trọng
                            </h4>
                          </div>
                          <p className="text-sm text-yellow-700">
                            Điều kiện vé thay đổi theo loại vé. Vui lòng xem quy
                            định cụ thể trước khi đặt.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">
                              Phổ thông cơ bản
                            </h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                              <li>• Không được thay đổi</li>
                              <li>• Không hoàn tiền</li>
                              <li>• Không chuyển nhượng</li>
                            </ul>
                          </div>

                          <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">
                              Phổ thông tiêu chuẩn
                            </h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                              <li>
                                • Thay đổi: phí 3.600.000₫ + chênh lệch giá vé
                              </li>
                              <li>• Hủy: phí 4.800.000₫</li>
                              <li>• Hủy miễn phí trong 24h</li>
                            </ul>
                          </div>

                          <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">Thương gia</h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                              <li>
                                • Thay đổi miễn phí (áp dụng chênh lệch giá)
                              </li>
                              <li>• Hủy miễn phí đến 2h trước</li>
                              <li>• Hoàn tiền đầy đủ trong 24h</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="amenities" className="mt-0">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                          Dịch vụ trên chuyến bay
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[
                            {
                              icon: Wifi,
                              title: "Wi-Fi miễn phí",
                              desc: "Internet tốc độ cao miễn phí",
                            },
                            {
                              icon: Monitor,
                              title: "Giải trí",
                              desc: "Màn hình cá nhân với 1000+ lựa chọn",
                            },
                            {
                              icon: Utensils,
                              title: "Ẩm thực",
                              desc: "Bữa ăn cao cấp và đồ uống hảo hạng",
                            },
                            {
                              icon: Headphones,
                              title: "Âm thanh cao cấp",
                              desc: "Tai nghe chống ồn được cung cấp",
                            },
                            {
                              icon: Bed,
                              title: "Thoải mái",
                              desc: "Gối đầu điều chỉnh và chăn",
                            },
                            {
                              icon: Zap,
                              title: "Ổ cắm điện",
                              desc: "Cổng USB và điện tại mỗi ghế",
                            },
                          ].map((amenity, idx) => (
                            <div
                              key={idx}
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center mb-2">
                                <amenity.icon className="w-6 h-6 text-blue-600 mr-3" />
                                <h4 className="font-semibold">
                                  {amenity.title}
                                </h4>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {amenity.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                          Cấu hình ghế ngồi
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold mb-3 dark:text-gray-900">
                                Hạng phổ thông
                              </h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Khoảng cách ghế: 31-32 inch</li>
                                <li>• Độ rộng ghế: 17-18 inch</li>
                                <li>• Cấu hình 3-3-3</li>
                                <li>• Gối đầu điều chỉnh</li>
                              </ul>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-3 dark:text-gray-900">
                                Hạng thương gia
                              </h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Khoảng cách ghế: 60+ inch</li>
                                <li>• Độ rộng ghế: 21 inch</li>
                                <li>• Cấu hình 2-2-2</li>
                                <li>• Ghế nằm phẳng</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Component: Fare Option
const FareOption = ({
  fare,
  flight,
  isSelected,
  onSelect,
  onProceedToBooking,
}) => (
  <div
    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
      isSelected
        ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
        : "hover:border-blue-300 hover:shadow-sm"
    } ${
      fare.recommended
        ? "bg-gradient-to-br from-blue-50 to-indigo-50 relative"
        : "bg-white"
    }`}
    onClick={() => onSelect(flight.id, fare.id)}
  >
    {fare.recommended && (
      <Badge className="absolute -top-2 right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
        Khuyến nghị
      </Badge>
    )}

    <div className="mb-4">
      <h4 className="font-bold text-gray-900 text-lg mb-1">{fare.name}</h4>
      <p className="text-2xl font-bold text-blue-600 mb-1">
        {new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(fare.price)}
      </p>
      <p className="text-xs text-gray-500">mỗi hành khách</p>
      {fare.availableSeats && (
        <p className="text-xs text-orange-600 mt-1">
          Còn {fare.availableSeats} ghế trống
        </p>
      )}
    </div>

    <div className="space-y-2 mb-4">
      {fare.features.map((feature, idx) => (
        <div key={idx} className="flex items-start text-sm">
          <span
            className={`mr-2 mt-0.5 font-bold ${
              feature.included ? "text-green-500" : "text-red-400"
            }`}
          >
            {feature.included ? "✓" : "✗"}
          </span>
          <span
            className={`${
              feature.included ? "text-gray-700" : "text-gray-500"
            }`}
          >
            {feature.text}
          </span>
        </div>
      ))}
    </div>

    {isSelected ? (
      <Button
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
        onClick={(e) => {
          e.stopPropagation();
          onProceedToBooking(flight, fare.id);
        }}
      >
        Tiếp tục đặt vé
        <Plane className="w-4 h-4 ml-2" />
      </Button>
    ) : (
      <Button
        variant="outline"
        className="w-full border-gray-300 hover:border-blue-400 hover:text-blue-600"
        onClick={(e) => e.stopPropagation()}
      >
        Chọn loại vé này
      </Button>
    )}
  </div>
);

// Component: Fare Summary
const FareSummary = ({ fare, onProceedToBooking }) => (
  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-green-800">
          {fare.name} đã được chọn
        </p>
        <p className="text-xs text-green-600 mt-1">
          Tổng cộng:{" "}
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(fare.price)}
        </p>
      </div>
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white font-semibold"
        onClick={onProceedToBooking}
      >
        Đặt ngay
        <Plane className="w-4 h-4 ml-1" />
      </Button>
    </div>
  </div>
);

// Component: Round Trip Fare Summary
const RoundTripFareSummary = ({
  flightData,
  outboundFareId,
  returnFareId,
  onProceedToBooking,
  onBack,
}) => {
  const outboundFare = flightData.flightTravelClasses?.find(
    (fare) => fare.id === outboundFareId
  );
  const returnFare = flightData.flightTravelClasses?.find(
    (fare) => fare.id === returnFareId
  );

  const outboundPrice =
    outboundFare?.outboundPrice || outboundFare?.customPrice || 0;
  const returnPrice = returnFare?.inboundPrice || returnFare?.customPrice || 0;
  const totalPrice = outboundPrice + returnPrice;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="border rounded-lg p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Quay lại
        </Button>
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-green-800 text-lg">
            Xác nhận lựa chọn hạng vé
          </h4>
        </div>
      </div>

      <div className="space-y-4">
        {/* Outbound flight summary */}
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-semibold text-blue-800">Chuyến đi</span>
              <Badge variant="outline" className="text-xs">
                {flightData.outboundFlight?.departure?.code} →{" "}
                {flightData.outboundFlight?.arrival?.code}
              </Badge>
            </div>
            <span className="font-bold text-blue-600">
              {formatCurrency(outboundPrice)}
            </span>
          </div>
          <p className="text-sm text-gray-600 ml-5">
            {outboundFare?.travelClass?.className || "Hạng vé"} •{" "}
            {outboundFare?.availableSeats || 0} ghế trống
          </p>
        </div>

        {/* Return flight summary */}
        <div className="bg-white rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="font-semibold text-red-800">Chuyến về</span>
              <Badge variant="outline" className="text-xs">
                {flightData.returnFlight?.departure?.code} →{" "}
                {flightData.returnFlight?.arrival?.code}
              </Badge>
            </div>
            <span className="font-bold text-red-600">
              {formatCurrency(returnPrice)}
            </span>
          </div>
          <p className="text-sm text-gray-600 ml-5">
            {returnFare?.travelClass?.className || "Hạng vé"} •{" "}
            {returnFare?.availableSeats || 0} ghế trống
          </p>
        </div>

        {/* Total price */}
        <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-green-800">Tổng cộng</p>
              <p className="text-sm text-green-600">Cho 2 chuyến bay khứ hồi</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(totalPrice)}
              </p>
              <p className="text-xs text-green-600">mỗi hành khách</p>
            </div>
          </div>
        </div>

        {/* Proceed to booking button */}
        <div className="flex justify-end pt-4">
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3"
            onClick={() => onProceedToBooking(flightData, outboundFareId)}
          >
            Tiếp tục đặt vé
            <Plane className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FlightDetail;
