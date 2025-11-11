"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { flightApi } from "@/apis/flight-api";
import {
  ancillaryServiceApi,
  getServiceTypeInfo,
} from "@/apis/ancillary-service-api";
import { handleFetch } from "@/utils/fetch-helper";
import PropTypes from "prop-types";
import { toast } from "sonner";
import { formatCurrencyVND } from "@/utils/currency-utils";
import {
  getPassengerMultiplier,
  calculateFlightPrice,
  calculateExtraServicePrice,
} from "@/utils/flight-booking-utils";
import SeatMap from "./seat-map";
import SeatSelectionWrapper from "./seat-selection-wrapper";

// Constants - Seat Type Labels (Pricing will come from backend)
const SEAT_TYPE_LABELS = {
  ACCESSIBLE: {
    label: "Ghế dành cho người khuyết tật",
    shortLabel: "AC",
    color: "bg-orange-500",
  },
  EXIT_ROW: {
    label: "Ghế hàng thoát hiểm",
    shortLabel: "ER",
    color: "bg-red-500",
  },
  EXTRA_LEGROOM: {
    label: "Chỗ để chân rộng",
    shortLabel: "EL",
    color: "bg-blue-500",
  },
  FRONT_ROW: {
    label: "Hàng đầu",
    shortLabel: "FR",
    color: "bg-purple-500",
  },
  STANDARD: {
    label: "Tiêu chuẩn",
    shortLabel: "ST",
    color: "bg-green-500",
  },
};

// Constants - Travel Class Mapping
const TRAVEL_CLASS_MAPPING = {
  1: { name: "Phổ thông", type: "ECONOMY", englishName: "Economy" },
  2: { name: "Thương gia", type: "BUSINESS", englishName: "Business" },
  3: { name: "Hạng nhất", type: "FIRST", englishName: "First Class" },
};

// Helper function to get travel class ID from className or fallback logic
const getTravelClassIdFromSeat = (seat) => {
  // First try API fields
  if (seat.travelClassId) return seat.travelClassId;
  if (seat.classId) return seat.classId;
  if (seat.travelClass?.id) return seat.travelClass.id;
  if (seat.class?.id) return seat.class.id;

  // Fallback: map from className
  const className = seat.className?.toLowerCase();
  if (className?.includes("economy") || className?.includes("phổ thông"))
    return 1;
  if (className?.includes("business") || className?.includes("thương gia"))
    return 2;
  if (className?.includes("first") || className?.includes("hạng nhất"))
    return 3;

  // Final fallback: based on row number (same logic as seat-map)
  const rowNum = parseInt(seat.seatNumber?.match(/\d+/)?.[0] || "1");
  if (rowNum <= 2 || (rowNum >= 16 && rowNum <= 17)) return 3; // First Class
  if (rowNum <= 5 || (rowNum >= 18 && rowNum <= 20)) return 2; // Business
  return 1; // Economy (default)
};

// Helper function to get travel class name
const getTravelClassName = (travelClassId) => {
  // Handle both string and number types
  const id =
    typeof travelClassId === "string" ? parseInt(travelClassId) : travelClassId;
  const result = TRAVEL_CLASS_MAPPING[id]?.name || "Không xác định";
  return result;
};

// Helper function to get seat type pricing from fixed values based on travel class
const getSeatTypePricingFromApi = (
  seatData,
  travelClass = null,
  travelClassId = null
) => {
  // Determine travel class from parameters
  let classType = null;
  if (travelClassId) {
    classType = TRAVEL_CLASS_MAPPING[travelClassId]?.type;
  } else if (travelClass?.type) {
    classType = travelClass.type;
  } else if (travelClass?.englishName) {
    // Map from englishName
    if (travelClass.englishName.toLowerCase().includes("first"))
      classType = "FIRST";
    else if (travelClass.englishName.toLowerCase().includes("business"))
      classType = "BUSINESS";
    else classType = "ECONOMY";
  }

  // Fixed pricing based on seat types and travel class (matching backend logic)
  const FIXED_SEAT_PRICING = {
    STANDARD: { price: "Miễn phí", priceValue: 0 },
    EXTRA_LEGROOM: {
      price:
        classType === "BUSINESS" || classType === "FIRST"
          ? "Miễn phí"
          : formatCurrencyVND(50000),
      priceValue: classType === "BUSINESS" || classType === "FIRST" ? 0 : 50000,
    },
    EXIT_ROW: { price: formatCurrencyVND(100000), priceValue: 100000 },
    FRONT_ROW: {
      price:
        classType === "BUSINESS" || classType === "FIRST"
          ? "Miễn phí"
          : formatCurrencyVND(75000),
      priceValue: classType === "BUSINESS" || classType === "FIRST" ? 0 : 75000,
    },
    ACCESSIBLE: {
      price: classType === "FIRST" ? "Miễn phí" : formatCurrencyVND(25000),
      priceValue: classType === "FIRST" ? 0 : 25000,
    },
  };

  const pricing = {};
  // For each seat type in our labels, use the fixed pricing
  Object.keys(SEAT_TYPE_LABELS).forEach((seatType) => {
    if (FIXED_SEAT_PRICING[seatType]) {
      pricing[seatType] = {
        ...SEAT_TYPE_LABELS[seatType],
        ...FIXED_SEAT_PRICING[seatType],
        description: SEAT_TYPE_LABELS[seatType]?.label || "Ghế tiêu chuẩn",
      };
    }
  });

  return pricing;
};

// Seat Status Pricing (for backward compatibility)
const SEAT_PRICING = {
  AVAILABLE: {
    priceVND: 0,
    priceUSD: 0,
    label: "Có sẵn",
    color: "bg-gray-500",
  },
  BOOKED: { priceVND: 0, priceUSD: 0, label: "Đã đặt", color: "bg-red-500" },
  PENDING_PAYMENT: {
    priceVND: 0,
    priceUSD: 0,
    label: "Chờ thanh toán",
    color: "bg-yellow-500",
  },
  selected: {
    priceVND: 0,
    priceUSD: 0,
    label: "Đã chọn",
    color: "bg-yellow-500",
  },
};

const BAGGAGE_PACKAGES = {
  NONE: { weight: 0, price: 0, label: "Không chọn" },
  KG_15: { weight: 15, price: 200000, label: "15kg" },
  KG_20: { weight: 20, price: 300000, label: "20kg" },
  KG_25: { weight: 25, price: 400000, label: "25kg" },
  KG_30: { weight: 30, price: 500000, label: "30kg" },
};
const SERVICE_PRICES = {
  travelInsurance: 29,
  inFlightMeal: 18,
  priorityBoarding: 12,
};

// Service type classifications based on backend logic
const PER_SEGMENT_SERVICE_TYPES = [
  "MEAL",
  "SEAT",
  "PRIORITY_BOARDING",
  "WIFI",
  "EXTRA_LEGROOM",
  "INFANT_MEAL",
];

const PER_BOOKING_SERVICE_TYPES = [
  "TRAVEL_INSURANCE",
  "LOUNGE_ACCESS",
  "ENTERTAINMENT",
  "PET_TRANSPORT",
  "SPECIAL_ASSISTANCE",
];

// Service types that should multiply by passenger count
const PER_PASSENGER_SERVICE_TYPES = ["TRAVEL_INSURANCE", "SPECIAL_ASSISTANCE"];

// Map API status to UI status
const mapApiStatusToUiStatus = (apiStatus, seatType) => {
  if (apiStatus === "BOOKED") return "occupied";
  if (apiStatus === "PENDING_PAYMENT") return "pending";

  // Map seat type to UI category
  switch (seatType) {
    case "FRONT_ROW":
      return "front";
    case "EXTRA_LEGROOM":
    case "EXIT_ROW":
      return "legroom";
    case "ACCESSIBLE":
      return "special";
    case "STANDARD":
    default:
      return "standard";
  }
};

// Skeleton component for seat selection
const SeatSkeleton = () => (
  <div className="bg-white p-6 rounded-lg border max-h-[600px] overflow-y-auto">
    <div className="text-center mb-4">
      <div className="h-6 w-24 mx-auto bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-48 mx-auto mt-2 bg-gray-200 rounded animate-pulse" />
    </div>
    <div className="max-w-md mx-auto">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex justify-center items-center gap-2 mb-2">
          {[...Array(8)].map((_, j) => (
            <div
              key={j}
              className="w-8 h-8 rounded bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Seat Legend component
const SeatLegend = ({ seatLegend }) => {
  const statusLegend = seatLegend.filter((item) => item.type === "status");
  const typeLegend = seatLegend.filter((item) => item.type === "seatType");

  return (
    <div className="mb-6">
      <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-200">
        Chú Thích Ghế
      </h4>

      {/* Travel Classes */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Hạng vé (ghế có sẵn)
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-600 rounded border border-purple-700"></div>
            <div className="text-sm">
              <div className="font-medium text-gray-700 dark:text-gray-200">
                Hạng nhất
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                First Class
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-600 rounded border border-indigo-700"></div>
            <div className="text-sm">
              <div className="font-medium text-gray-700 dark:text-gray-200">
                Thương gia
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                Business Class
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded border border-green-700"></div>
            <div className="text-sm">
              <div className="font-medium text-gray-700 dark:text-gray-200">
                Phổ thông
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                Economy Class
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seat Status */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Trạng thái ghế
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {statusLegend.map((legend) => (
            <div key={legend.status} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${legend.color} border`}></div>
              <div className="text-sm">
                <div className="font-medium text-gray-700 dark:text-gray-200">
                  {legend.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seat Types */}
      <div>
        <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Loại ghế đặc biệt
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {typeLegend.map((legend) => (
            <div key={legend.status} className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium min-w-[28px] text-center">
                {legend.shortLabel}
              </span>
              <div className="text-sm">
                <div className="font-medium text-gray-700 dark:text-gray-200">
                  {legend.label}
                </div>
                <div className="text-green-600 font-medium">{legend.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Get seat color based on travel class and status
const getSeatStatusColor = (
  seat,
  isSelected = false,
  isDisabledByClass = false
) => {
  if (isSelected) {
    return "bg-blue-500 border-blue-600 text-white"; // Selected - Blue (matching legend)
  }

  if (isDisabledByClass) {
    return "bg-gray-300 border-gray-400 text-gray-600"; // Disabled by class - Light gray
  }

  // Check seat status first - for occupied/pending seats
  const status = seat?.status;
  if (status === "OCCUPIED" || status === "BOOKED") {
    return "bg-red-500 border-red-600 text-white"; // Occupied - Red
  }

  if (status === "PENDING_PAYMENT") {
    return "bg-yellow-500 border-yellow-600 text-white"; // Pending - Yellow
  }

  // For available seats, show color based on travel class
  if (status === "AVAILABLE") {
    const travelClassId = seat?.travelClassId;
    const className = getTravelClassName(travelClassId);

    // Match travel class colors with legend (avoid blue conflict with selected state)
    if (className === "Hạng nhất") {
      return "bg-purple-600 border-purple-700 text-white"; // First Class - Purple
    } else if (className === "Thương gia") {
      return "bg-indigo-600 border-indigo-700 text-white"; // Business Class - Indigo (different from selected blue)
    } else if (className === "Phổ thông") {
      return "bg-green-600 border-green-700 text-white"; // Economy Class - Green
    }
  }

  // Default fallback
  return "bg-gray-400 border-gray-500 text-white"; // Unknown - Gray
};

// Auto assign available STANDARD seats for passengers without manual seat selection
const autoAssignStandardSeats = (
  seats,
  passengers,
  selectedSeats,
  selectedTravelClass,
  isReturn = false
) => {
  const prefix = isReturn ? "return_passenger" : "passenger";
  const autoAssigned = {};
  let needsAssignment = [];

  // Find passengers without manually selected seats
  passengers.forEach((passenger, index) => {
    const passengerKey = `${prefix}${index + 1}`;
    const existingSeat = selectedSeats[passengerKey];

    if (
      !existingSeat ||
      (typeof existingSeat === "object" && !existingSeat.seatNumber)
    ) {
      needsAssignment.push({ index, passengerKey, passenger });
    }
  });

  if (needsAssignment.length === 0) {
    return {};
  }

  // Get user's travel class info
  const userTravelClassId = selectedTravelClass?.travelClass?.id;
  const userClassName = selectedTravelClass?.travelClass?.className;

  // Filter available STANDARD seats for the user's travel class only
  const availableStandardSeats = seats.filter((seat) => {
    // Must be available
    if (seat.status !== "AVAILABLE") return false;

    // Must be STANDARD type (free)
    if (seat.seatType !== "STANDARD") return false;

    // Must match user's travel class
    const seatClassMatches =
      seat.travelClassId === userTravelClassId ||
      seat.classId === userTravelClassId ||
      seat.className === userClassName;

    if (!seatClassMatches) return false;

    // Must not be already selected
    const alreadySelected = Object.values(selectedSeats).some(
      (selectedSeat) =>
        (typeof selectedSeat === "object" &&
          selectedSeat?.seatNumber === seat.seatNumber) ||
        (typeof selectedSeat === "string" && selectedSeat === seat.seatNumber)
    );

    return !alreadySelected;
  });

  if (availableStandardSeats.length < needsAssignment.length) {
    const shortfall = needsAssignment.length - availableStandardSeats.length;
    toast.warning(
      `Chỉ có ${availableStandardSeats.length} ghế STANDARD miễn phí cho hạng ${userClassName}. ` +
        `Còn thiếu ${shortfall} ghế - bạn cần chọn ghế có phí bổ sung.`,
      { duration: 8000 }
    );
  }

  // Randomly assign available seats
  const shuffledSeats = [...availableStandardSeats].sort(
    () => Math.random() - 0.5
  );

  needsAssignment
    .slice(0, shuffledSeats.length)
    .forEach((passengerData, index) => {
      const assignedSeat = shuffledSeats[index];
      const seatTypePricing = getSeatTypePricingFromApi(
        seats,
        selectedTravelClass?.travelClass,
        selectedTravelClass?.travelClass?.id
      );

      autoAssigned[passengerData.passengerKey] = {
        seatId: assignedSeat.seatId || assignedSeat.id, // Include seatId for unique identification
        seatNumber: assignedSeat.seatNumber,
        seatType: assignedSeat.seatType,
        priceVND: 0, // STANDARD seats are free
        className: assignedSeat.className,
        passengerIndex: passengerData.index,
        autoAssigned: true,
      };
    });

  if (Object.keys(autoAssigned).length > 0) {
    toast.success(
      `Đã tự động chọn ${
        Object.keys(autoAssigned).length
      } ghế STANDARD miễn phí cho bạn!`,
      { duration: 5000 }
    );
  }

  return autoAssigned;
};

// Function to convert seat selections to booking API format
const convertSeatsToBookingFormat = (selectedSeats, passengers, flightId) => {
  const seatAssignments = [];

  passengers.forEach((passenger, index) => {
    const passengerKey = `passenger${index + 1}`;
    const seatInfo = selectedSeats[passengerKey];

    if (seatInfo) {
      let seatId, seatNumber;

      if (typeof seatInfo === "object") {
        seatId = seatInfo.seatId;
        seatNumber = seatInfo.seatNumber;
      } else if (typeof seatInfo === "string") {
        seatNumber = seatInfo;
        // For legacy format, we'll need to find seatId somehow
        console.warn(
          `⚠️ Legacy seat format for ${passengerKey}: ${seatInfo} - seatId may be missing`
        );
      }

      if (seatNumber) {
        seatAssignments.push({
          passengerIndex: index,
          flightId: flightId,
          seatId: seatId || null,
          seatNumber: seatNumber,
        });
      }
    }
  });

  return seatAssignments;
};

// Function to process extras data and prepare for booking API
const processExtrasDataForBooking = (extrasData, flight, passengers) => {
  if (!extrasData) {
    console.warn("⚠️ No extras data provided for booking");
    return null;
  }

  const finalExtrasData = { ...extrasData };

  // Convert seat selections to booking format
  if (flight.type === "ROUND_TRIP") {
    // Process outbound seats
    if (
      extrasData.selectedSeats &&
      Object.keys(extrasData.selectedSeats).length > 0
    ) {
      finalExtrasData.outboundSeatAssignments = convertSeatsToBookingFormat(
        extrasData.selectedSeats,
        passengers,
        flight.outbound?.id || flight.outbound?.flightId
      );
    }

    // Process return seats
    if (
      extrasData.selectedReturnSeats &&
      Object.keys(extrasData.selectedReturnSeats).length > 0
    ) {
      finalExtrasData.returnSeatAssignments = convertSeatsToBookingFormat(
        extrasData.selectedReturnSeats,
        passengers,
        flight.return?.id || flight.return?.flightId
      );
    }

    // Combine all seat assignments
    finalExtrasData.seatAssignments = [
      ...(finalExtrasData.outboundSeatAssignments || []),
      ...(finalExtrasData.returnSeatAssignments || []),
    ];
  } else if (flight.type === "MULTI_CITY") {
    // Process multi-city seats
    finalExtrasData.seatAssignments = [];
    const segments = flight.legs || [];

    segments.forEach((leg, segmentIndex) => {
      const segmentKey = `segment${segmentIndex}`;
      const segmentSeats = extrasData.multiCitySeats?.[segmentKey] || {};

      if (Object.keys(segmentSeats).length > 0) {
        const segmentAssignments = convertSeatsToBookingFormat(
          segmentSeats,
          passengers,
          leg.id || leg.flightId
        );
        finalExtrasData.seatAssignments.push(...segmentAssignments);
      }
    });
  } else {
    // One-way flight
    if (
      extrasData.selectedSeats &&
      Object.keys(extrasData.selectedSeats).length > 0
    ) {
      finalExtrasData.seatAssignments = convertSeatsToBookingFormat(
        extrasData.selectedSeats,
        passengers,
        flight.id || flight.flightId
      );
    } else {
      finalExtrasData.seatAssignments = [];
    }
  }

  return finalExtrasData;
};

// Get seat color based on status (consistent with legend)
const getSeatDisplayColor = (
  seat,
  isSelected = false,
  isDisabledByClass = false
) => {
  // Use status color system for consistent UI
  return getSeatStatusColor(seat, isSelected, isDisabledByClass);
};

// Load complete seat map from API for all travel classes
const loadCompleteSeatMapFromApi = async (flightId) => {
  if (!flightId) {
    console.warn("No flightId provided for seat loading");
    return [];
  }

  try {
    // Define travel class IDs (assuming these are the standard IDs in your system)
    const travelClassIds = [
      { id: 1, name: "Phổ thông", type: "ECONOMY" }, // Economy
      { id: 2, name: "Thương gia", type: "BUSINESS" }, // Business
      { id: 3, name: "Hạng nhất", type: "FIRST" }, // First Class
    ];

    // Load seats for all travel classes in parallel
    const seatPromises = travelClassIds.map(async (travelClass) => {
      try {
        const response =
          await flightApi.getSeatsFlightByFlightIdAndTravelClassId(
            flightId,
            travelClass.id
          );

        if (response.success && response.data) {
          const seats = Array.isArray(response.data) ? response.data : [];

          // Debug first seat structure

          // Ensure each seat has the correct travel class info
          return seats.map((seat) => ({
            ...seat,
            // Preserve original fields but add our normalized fields
            className: seat.className || travelClass.name,
            classType: seat.classType || travelClass.type,
            travelClassName: seat.travelClassName || travelClass.name,
            classId: seat.classId || travelClass.id,
            travelClassId: seat.travelClassId || travelClass.id,
            seatClassId: seat.seatClassId || travelClass.id, // Ensure this field exists
            // Add metadata for debugging
            _loadedFromTravelClass: travelClass.id,
            _loadedFromTravelClassName: travelClass.name,
          }));
        } else {
          console.warn(
            `⚠️ No seats found for ${travelClass.name} class (ID: ${travelClass.id})`
          );
          return [];
        }
      } catch (error) {
        console.error(`❌ Error loading ${travelClass.name} seats:`, error);
        return [];
      }
    });

    // Wait for all seat loading to complete
    const seatResults = await Promise.all(seatPromises);

    // Combine all seats from all travel classes
    const allSeats = seatResults.flat();

    // Check for seat number overlaps (same physical seat, different travel classes)
    const seatNumbers = allSeats.map((s) => s.seatNumber);
    const uniqueSeatNumbers = [...new Set(seatNumbers)];
    const hasOverlaps = seatNumbers.length !== uniqueSeatNumbers.length;

    if (hasOverlaps) {
      // Group seats by seatNumber to see the overlap
      const seatGroups = allSeats.reduce((acc, seat) => {
        if (!acc[seat.seatNumber]) acc[seat.seatNumber] = [];
        acc[seat.seatNumber].push(seat);
        return acc;
      }, {});

      // Log overlapping seats for debugging
      Object.entries(seatGroups).forEach(([seatNum, seats]) => {
        if (seats.length > 1) {
          // console.log(
          //   `🪑 Seat ${seatNum}:`,
          //   seats.map((s) => `${s.className}(ID:${s.travelClassId})`).join(", ")
          // );
        }
      });
    }
    // Count all 50 seats by their individual travel class
    const seatDistribution = {
      economy: allSeats.filter(
        (s) => s.travelClassId === 1 || s.className === "Economy"
      ).length,
      business: allSeats.filter(
        (s) => s.travelClassId === 2 || s.className === "Business"
      ).length,
      first: allSeats.filter(
        (s) => s.travelClassId === 3 || s.className === "First"
      ).length,
      available: allSeats.filter((s) => s.status === "AVAILABLE").length,
      booked: allSeats.filter((s) => s.status === "BOOKED").length,
      pending: allSeats.filter((s) => s.status === "PENDING_PAYMENT").length,
      total: allSeats.length,
    };

    return allSeats;
  } catch (error) {
    console.error("❌ Error loading complete seat map:", error);
    return [];
  }
};

// Aircraft Layout component - renders seats by row based on actual seat data
const AircraftLayout = ({
  seats,
  selectedSeats,
  passengers,
  handleSeatSelect,
  aircraftLayout = "N/A", // Default layout
  selectedTravelClass = null, // Travel class selected by user
  totalSeats = null, // Total seats from aircraft info
  flight = null, // Flight data for additional info
  flightId = null, // Flight ID for API loading
  userTravelClassId = null, // Travel class ID của user để disable ghế không phù hợp
}) => {
  const [completeSeatMap, setCompleteSeatMap] = useState(seats);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);

  // Load complete seat map from API when flightId is available (load all travel classes like SeatMap)
  useEffect(() => {
    const loadCompleteSeats = async () => {
      if (flightId && flightId !== "N/A") {
        setIsLoadingSeats(true);
        try {
          // Define travel class IDs
          const travelClassIds = [
            { id: 1, name: "Phổ thông", type: "ECONOMY" },
            { id: 2, name: "Thương gia", type: "BUSINESS" },
            { id: 3, name: "Hạng nhất", type: "FIRST" },
          ];

          console.log(
            `🔄 Loading complete seats for multi-city flight ${flightId}...`
          );

          // Load seats for all travel classes in parallel
          const seatPromises = travelClassIds.map(async (travelClass) => {
            try {
              const response =
                await flightApi.getSeatsFlightByFlightIdAndTravelClassId(
                  flightId,
                  travelClass.id
                );

              if (response.success && response.data) {
                const seatsData = Array.isArray(response.data)
                  ? response.data
                  : [];
                console.log(
                  `✅ Loaded ${seatsData.length} ${travelClass.name} seats for multi-city`
                );

                // Ensure each seat has correct travel class info
                return seatsData.map((seat) => ({
                  ...seat,
                  className: seat.className || travelClass.name,
                  travelClassId: seat.travelClassId || travelClass.id,
                  travelClassName: seat.travelClassName || travelClass.name,
                }));
              }
              return [];
            } catch (error) {
              console.error(
                `❌ Error loading ${travelClass.name} seats for multi-city:`,
                error
              );
              return [];
            }
          });

          const seatResults = await Promise.all(seatPromises);
          const allSeats = seatResults.flat();

          console.log(
            `🎯 Loaded ${allSeats.length} total seats for multi-city flight`
          );
          setCompleteSeatMap(allSeats);
        } catch (error) {
          console.error("Error loading complete seats for multi-city:", error);
          setCompleteSeatMap(seats); // Fallback to provided seats
        } finally {
          setIsLoadingSeats(false);
        }
      } else {
        // No flightId, use provided seats
        setCompleteSeatMap(seats);
      }
    };

    loadCompleteSeats();
  }, [flightId, seats]);

  // Don't filter seats - show all seats like SeatMap, but disable non-matching travel class seats
  const allSeats = useMemo(() => {
    return completeSeatMap; // Show all seats, disable logic will be in render
  }, [completeSeatMap]);

  // Group seats by row number (use allSeats instead of filteredSeats)
  const seatsByRow = allSeats.reduce((acc, seat) => {
    const rowNum = seat.seatNumber.match(/\d+/)?.[0] || "1";
    if (!acc[rowNum]) acc[rowNum] = [];
    acc[rowNum].push(seat);
    return acc;
  }, {});

  // Sort row numbers
  const sortedRowNumbers = Object.keys(seatsByRow).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );

  // Parse seat layout (e.g., "3-3", "2-4-2", "3-4-3")
  const parseSeatLayout = (layout) => {
    const sections = layout.split("-").map((num) => parseInt(num));
    const totalSeats = sections.reduce((sum, num) => sum + num, 0);

    // Generate seat letters based on layout
    const seatLetters = [];
    let currentLetter = "A";

    for (let i = 0; i < totalSeats; i++) {
      seatLetters.push(String.fromCharCode(currentLetter.charCodeAt(0) + i));
    }

    // Group letters by sections
    const letterSections = [];
    let startIndex = 0;

    for (const sectionSize of sections) {
      letterSections.push(
        seatLetters.slice(startIndex, startIndex + sectionSize)
      );
      startIndex += sectionSize;
    }

    return letterSections;
  };

  const seatSections = parseSeatLayout(aircraftLayout);

  // Show loading state while seats are being loaded
  if (isLoadingSeats) {
    return (
      <div className="aircraft-layout">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Đang tải ghế...</span>
        </div>
      </div>
    );
  }

  // Show empty state if no seats available
  if (!allSeats || allSeats.length === 0) {
    return (
      <div className="aircraft-layout">
        <div className="flex justify-center items-center py-8">
          <span className="text-gray-600">Không có ghế nào có sẵn</span>
        </div>
      </div>
    );
  }

  return (
    <div className="aircraft-layout bg-gradient-to-b from-blue-50 to-gray-100 rounded-2xl p-6 shadow-lg">
      {/* Aircraft nose - 3D design */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          {/* Main nose cone */}
          <div className="w-20 h-12 bg-gradient-to-b from-gray-200 to-gray-400 rounded-t-full flex items-center justify-center shadow-lg border-2 border-gray-300">
            <span className="text-lg">✈️</span>
          </div>
          {/* Cockpit windows */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex gap-1">
            <div className="w-3 h-2 bg-blue-400 rounded-sm shadow-inner border border-blue-500"></div>
            <div className="w-3 h-2 bg-blue-400 rounded-sm shadow-inner border border-blue-500"></div>
          </div>
          {/* Side gradient effects */}
          <div className="absolute inset-0 rounded-t-full bg-gradient-to-r from-white/30 via-transparent to-white/30"></div>
        </div>
      </div>

      {/* Aircraft body indication */}
      <div className="flex justify-center mb-4">
        <div className="w-2 h-8 bg-gradient-to-b from-gray-300 to-gray-400 shadow-sm"></div>
      </div>

      {/* Seat rows */}
      {sortedRowNumbers.map((rowNum) => {
        const rowSeats = seatsByRow[rowNum].sort((a, b) => {
          const letterA = a.seatNumber.match(/[A-Z]/)?.[0] || "A";
          const letterB = b.seatNumber.match(/[A-Z]/)?.[0] || "A";
          return letterA.localeCompare(letterB);
        });

        // Check if this row has exit row seats
        const hasExitRowSeats = rowSeats.some(
          (seat) => seat.seatType === "EXIT_ROW"
        );
        const rowNumber = parseInt(rowNum);

        return (
          <div
            key={rowNum}
            className="flex justify-center items-center gap-3 mb-4 px-4"
          >
            {/* Render seats with aircraft layout structure */}
            {seatSections.map((sectionLetters, sectionIndex) => (
              <div key={sectionIndex} className="flex items-center">
                {/* Seat section */}
                <div className="flex gap-2">
                  {sectionLetters.map((letter) => {
                    // Find ALL seats with this letter in this row
                    const seatsWithLetter = rowSeats.filter(
                      (s) => s.seatNumber.match(/[A-Z]/)?.[0] === letter
                    );

                    return seatsWithLetter.length > 0 ? (
                      <div
                        key={`${letter}-${rowNum}`}
                        className="flex flex-col gap-1"
                      >
                        {seatsWithLetter.map((seat) =>
                          renderSeatButton(
                            seat,
                            passengers,
                            selectedSeats,
                            handleSeatSelect,
                            `${rowNum}-${letter}-${seat.seatId}`,
                            selectedTravelClass
                          )
                        )}
                      </div>
                    ) : (
                      <div
                        key={`empty-${letter}-${rowNum}`}
                        className="w-14 h-14"
                      ></div>
                    );
                  })}
                </div>

                {/* Enhanced Aisle - Beautiful aircraft aisle with exit row indicators */}
                {sectionIndex < seatSections.length - 1 && (
                  <div className="flex flex-col items-center mx-6">
                    {/* Exit Row Indicator */}
                    {hasExitRowSeats && (
                      <div className="mb-2">
                        <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg border-2 border-red-700 flex items-center gap-1">
                          <span>🚪</span>
                          <span>EXIT</span>
                        </div>
                      </div>
                    )}

                    {/* Main Aisle Design */}
                    <div className="relative">
                      {/* Aisle carpet with emergency lighting effect */}
                      <div className="w-12 h-16 bg-gradient-to-b from-blue-100 via-blue-200 to-blue-100 border-l-4 border-r-4 border-blue-300 shadow-inner rounded-lg">
                        {/* Emergency lighting strips */}
                        <div className="absolute top-0 left-1 right-1 h-1 bg-gradient-to-r from-red-400 via-yellow-400 to-red-400 rounded-full shadow-lg"></div>
                        <div className="absolute bottom-0 left-1 right-1 h-1 bg-gradient-to-r from-red-400 via-yellow-400 to-red-400 rounded-full shadow-lg"></div>

                        {/* Center pattern */}
                        <div className="w-full h-full bg-gradient-to-b from-transparent via-blue-200/50 to-transparent">
                          {/* Direction arrows */}
                          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                            <div className="w-2 h-2 border-l-2 border-r-2 border-t-2 border-blue-600 transform rotate-45"></div>
                          </div>
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                            <div className="w-2 h-2 border-l-2 border-r-2 border-b-2 border-blue-600 transform rotate-45"></div>
                          </div>
                        </div>
                      </div>

                      {/* Side lighting effects */}
                      <div className="absolute -left-2 top-0 bottom-0 w-2 bg-gradient-to-b from-blue-300/50 to-transparent rounded-l-lg"></div>
                      <div className="absolute -right-2 top-0 bottom-0 w-2 bg-gradient-to-b from-blue-300/50 to-transparent rounded-r-lg"></div>
                    </div>

                    {/* Exit Row Additional Info */}
                    {hasExitRowSeats && (
                      <div className="mt-2 text-center">
                        <div className="text-xs text-gray-600 font-medium">
                          Hàng thoát hiểm
                        </div>
                        <div className="text-xs text-red-600 font-bold">
                          Không phí phụ thu
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}

      {/* Aircraft tail section */}
      <div className="flex justify-center mt-6">
        <div className="w-16 h-6 bg-gradient-to-b from-gray-300 to-gray-500 rounded-b-lg shadow-lg border-2 border-gray-400">
          <div className="w-full h-full bg-gradient-to-r from-white/20 via-transparent to-white/20 rounded-b-lg"></div>
        </div>
      </div>
    </div>
  );
};

// Helper to render seat button
const renderSeatButton = (
  seat,
  passengers,
  selectedSeats,
  handleSeatSelect,
  uniqueKey,
  selectedTravelClass = null
) => {
  const isOccupied = seat.status === "occupied" || seat.status === "BOOKED";
  const isPending =
    seat.status === "pending" || seat.status === "PENDING_PAYMENT";

  // Fix: Check if seat is selected by comparing both seatId and seatNumber for accuracy
  const isSelected = Object.values(selectedSeats).some((selectedSeat) => {
    if (
      typeof selectedSeat === "object" &&
      selectedSeat?.seatId &&
      selectedSeat?.seatNumber
    ) {
      // Compare both seatId and seatNumber for exact match
      return (
        selectedSeat.seatId === seat.seatId &&
        selectedSeat.seatNumber === seat.seatNumber
      );
    } else if (typeof selectedSeat === "string") {
      // Fallback for legacy string format - compare seatNumber only
      return selectedSeat === seat.seatNumber;
    }
    return false;
  });

  // Check if seat belongs to user's travel class (use userTravelClassId from props)
  const isInUserTravelClass =
    userTravelClassId && seat.travelClassId === userTravelClassId;
  const isDisabledByClass = userTravelClassId && !isInUserTravelClass;

  // Get seat price for tooltip (include travel class context)
  const getSeatPrice = () => {
    if (seat.priceVND) return formatCurrencyVND(seat.priceVND);
    if (seat.seatType && SEAT_TYPE_LABELS[seat.seatType]) {
      // Get travel class information from seat or selected travel class
      const travelClass = selectedTravelClass?.travelClass || seat.travelClass;
      const travelClassId = travelClass?.id || seat.travelClassId;

      return (
        getSeatTypePricingFromApi([seat], travelClass, travelClassId)[
          seat.seatType
        ]?.price || formatCurrencyVND(0)
      );
    }
    return formatCurrencyVND(0);
  };

  return (
    <TooltipProvider key={uniqueKey || seat.seatNumber}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => {
              if (isDisabledByClass) {
                toast.error(
                  `Ghế này thuộc hạng ${getTravelClassName(
                    seat.travelClassId
                  )}. Bạn chỉ có thể chọn ghế hạng ${getTravelClassName(
                    userTravelClassId
                  )}.`
                );
                return;
              }

              if (isSelected) {
                // If seat is already selected, find which passenger has it and unselect
                const passengerKey = Object.keys(selectedSeats).find((key) => {
                  const selectedSeat = selectedSeats[key];
                  if (
                    typeof selectedSeat === "object" &&
                    selectedSeat?.seatId &&
                    selectedSeat?.seatNumber
                  ) {
                    return (
                      selectedSeat.seatId === seat.seatId &&
                      selectedSeat.seatNumber === seat.seatNumber
                    );
                  } else if (typeof selectedSeat === "string") {
                    return selectedSeat === seat.seatNumber;
                  }
                  return false;
                });
                if (passengerKey) {
                  const passengerIndex =
                    parseInt(
                      passengerKey
                        .replace("passenger", "")
                        .replace("return_passenger", "")
                    ) - 1;
                  handleSeatSelect(seat.seatNumber, passengerIndex);
                }
              } else {
                // Find first available passenger slot
                const availablePassengerIndex = passengers.findIndex(
                  (_, index) => {
                    const passengerKey = `passenger${index + 1}`;
                    const selectedSeat = selectedSeats[passengerKey];
                    return (
                      !selectedSeat ||
                      (typeof selectedSeat === "object" &&
                        !selectedSeat.seatNumber) ||
                      (typeof selectedSeat === "string" && !selectedSeat)
                    );
                  }
                );

                if (availablePassengerIndex !== -1) {
                  handleSeatSelect(seat.seatNumber, availablePassengerIndex);
                } else {
                  toast.error(
                    "Tất cả hành khách đã chọn ghế cho chuyến bay này"
                  );
                }
              }
            }}
            className={`relative w-14 h-14 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 shadow-xl transform ${
              isSelected
                ? "bg-gradient-to-b from-blue-400 to-blue-600 text-white scale-110 shadow-2xl border-blue-300 ring-4 ring-blue-200 transform rotate-1 -translate-y-1"
                : isDisabledByClass
                ? `${getSeatDisplayColor(
                    seat,
                    false,
                    true
                  )} opacity-30 cursor-not-allowed border-gray-400 shadow-sm grayscale`
                : isOccupied || isPending
                ? `${getSeatDisplayColor(
                    seat,
                    false,
                    false
                  )} cursor-not-allowed shadow-inner transform translate-y-0.5`
                : `${getSeatDisplayColor(
                    seat,
                    false,
                    false
                  )} hover:scale-110 hover:shadow-2xl hover:brightness-110 hover:-translate-y-2 transition-all duration-300 cursor-pointer hover:rotate-1`
            }`}
            disabled={isOccupied || isPending || isDisabledByClass}
            title={
              isOccupied
                ? `Ghế ${seat.seatNumber} - Đã được đặt${
                    seat.bookedByUserId || seat.bookedByPassengerId
                      ? ` (ID: ${
                          seat.bookedByUserId || seat.bookedByPassengerId
                        })`
                      : ""
                  }`
                : isPending
                ? `Ghế ${seat.seatNumber} - Đang chờ thanh toán`
                : isDisabledByClass
                ? `Ghế ${seat.seatNumber} - ${seat.className} - Không thể chọn (vé của bạn là hạng ${selectedTravelClass?.travelClass?.className})`
                : `Ghế ${seat.seatNumber} - ${seat.className} - ${
                    seat.status === "AVAILABLE"
                      ? "Có sẵn"
                      : seat.status === "OCCUPIED"
                      ? "Đã được đặt"
                      : seat.status === "PENDING_PAYMENT"
                      ? "Đang chờ thanh toán"
                      : "Không xác định"
                  }`
            }
          >
            {/* Enhanced 3D Aircraft Seat Design */}
            <div
              className={`absolute inset-0 rounded-xl ${
                isSelected
                  ? "bg-gradient-to-br from-white/40 via-white/20 to-blue-500/30 shadow-inner"
                  : isOccupied || isPending
                  ? "bg-gradient-to-br from-black/20 via-black/10 to-black/30 shadow-inner"
                  : "bg-gradient-to-br from-white/30 via-white/15 to-black/25 shadow-inner"
              }`}
            />

            {/* Seat Armrests - 3D Effect */}
            <div className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-r from-black/20 to-transparent rounded-l-xl" />
            <div className="absolute right-0 top-1 bottom-1 w-1 bg-gradient-to-l from-black/20 to-transparent rounded-r-xl" />

            {/* Seat Back - 3D Effect */}
            <div className="absolute top-0 left-1 right-1 h-2 bg-gradient-to-b from-black/15 to-transparent rounded-t-xl" />

            {/* Seat Padding Effect - Enhanced */}
            <div className="absolute inset-1 rounded-lg bg-gradient-to-b from-white/15 via-white/5 to-black/10" />

            {/* Seat Content */}
            <div className="relative flex flex-col items-center z-10">
              {/* Seat Number - Smaller */}
              <span
                className={`font-bold text-xs tracking-tight ${
                  isSelected
                    ? "text-white drop-shadow-lg font-extrabold"
                    : "text-white drop-shadow-md"
                }`}
              >
                {seat.seatNumber}
              </span>

              {/* Seat Type Short Label - More Prominent */}
              {seat.seatType && SEAT_TYPE_LABELS[seat.seatType] && (
                <div className="flex flex-col items-center">
                  <span
                    className={`text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded-full border ${
                      isSelected
                        ? "text-white bg-blue-600/80 border-white/50 drop-shadow-lg"
                        : "text-white bg-black/40 border-white/30 drop-shadow-md"
                    }`}
                  >
                    {SEAT_TYPE_LABELS[seat.seatType].shortLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Selection Indicator - Enhanced 3D checkmark */}
            {isSelected && (
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-3 border-white flex items-center justify-center shadow-2xl transform rotate-12">
                <svg
                  className="w-4 h-4 text-white drop-shadow-lg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}

            {/* Seat Status Indicator - Enhanced */}
            {(isOccupied || isPending) && (
              <div
                className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-xl border-2 border-white transform rotate-12 ${
                  isPending
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                    : "bg-gradient-to-br from-red-400 to-red-600"
                }`}
              >
                <svg
                  className="w-3 h-3 text-white drop-shadow-lg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent className="bg-white border-2 border-gray-200 shadow-2xl rounded-xl p-4 max-w-xs">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">💺</span>
              <p className="font-bold text-lg text-gray-800">
                Ghế {seat.seatNumber}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">
                <span className="text-gray-600">Hạng:</span>{" "}
                <span className="text-blue-600 font-semibold">
                  {seat.className}
                </span>
              </p>

              {seat.seatType && (
                <p className="text-sm font-medium">
                  <span className="text-gray-600">Loại ghế:</span>{" "}
                  <span className="text-purple-600 font-semibold">
                    {SEAT_TYPE_LABELS[seat.seatType]?.label || seat.seatType}
                    {SEAT_TYPE_LABELS[seat.seatType] && (
                      <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                        {SEAT_TYPE_LABELS[seat.seatType].shortLabel}
                      </span>
                    )}
                  </span>
                </p>
              )}

              <p className="text-sm font-medium">
                <span className="text-gray-600">Trạng thái:</span>{" "}
                <span
                  className={`font-semibold ${
                    seat.status === "AVAILABLE"
                      ? "text-green-600"
                      : seat.status === "BOOKED" || seat.status === "OCCUPIED"
                      ? "text-red-600"
                      : seat.status === "PENDING_PAYMENT"
                      ? "text-yellow-600"
                      : "text-gray-600"
                  }`}
                >
                  {seat.status === "AVAILABLE"
                    ? "✅ Có sẵn"
                    : seat.status === "BOOKED"
                    ? "❌ Đã đặt"
                    : seat.status === "PENDING_PAYMENT"
                    ? "⏳ Đang chờ thanh toán"
                    : seat.status === "OCCUPIED"
                    ? "❌ Đã được đặt"
                    : "❓ Không xác định"}
                </span>
              </p>
            </div>

            {/* Price Display - Always show for available seats */}
            {seat.status === "AVAILABLE" && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                <p className="text-sm font-bold text-green-700 flex items-center justify-center gap-1">
                  <span>💰</span>
                  Giá: {getSeatPrice()}
                </p>
                {seat.seatType && SEAT_TYPE_LABELS[seat.seatType] && (
                  <p className="text-xs text-green-600 mt-1">
                    Phí loại ghế:{" "}
                    {SEAT_TYPE_LABELS[seat.seatType].label.toLowerCase()}
                  </p>
                )}
              </div>
            )}

            {isDisabledByClass && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
                <p className="text-sm font-bold text-orange-700 flex items-center justify-center gap-1">
                  <span>⚠️</span>
                  Không thể chọn
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Vé của bạn: {getTravelClassName(userTravelClassId)}
                </p>
              </div>
            )}

            {(seat.bookedByUserId || seat.bookedByPassengerId) && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-2">
                <p className="text-sm text-red-700">
                  <span className="font-semibold">Đã đặt:</span>{" "}
                  {seat.bookedByUserId
                    ? `User ${seat.bookedByUserId}`
                    : `Passenger ${seat.bookedByPassengerId}`}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// PropTypes for AircraftLayout
AircraftLayout.propTypes = {
  seats: PropTypes.array.isRequired,
  selectedSeats: PropTypes.object.isRequired,
  passengers: PropTypes.array.isRequired,
  handleSeatSelect: PropTypes.func.isRequired,
  aircraftLayout: PropTypes.string,
  selectedTravelClass: PropTypes.object,
  totalSeats: PropTypes.number,
  flight: PropTypes.object,
  flightId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  userTravelClassId: PropTypes.number,
};

// Selected Seats Summary
const SelectedSeatsSummary = ({ selectedSeats, getSeatPrice }) =>
  Object.keys(selectedSeats).length > 0 && (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      {Object.entries(selectedSeats).map(([passenger, seatInfo]) => {
        // Handle both new format (object) and old format (string)
        const seatNumber =
          typeof seatInfo === "object" ? seatInfo.seatNumber : seatInfo;
        const seatType =
          typeof seatInfo === "object" ? seatInfo.seatType : null;
        const seatPrice =
          typeof seatInfo === "object" ? seatInfo.priceVND : null;

        return (
          <div key={passenger} className="text-sm font-medium text-blue-800">
            <div className="flex justify-between">
              <span>
                {passenger}: {seatNumber}
              </span>
              {seatPrice !== null && (
                <span className="text-blue-600">
                  {formatCurrencyVND(seatPrice)}
                </span>
              )}
            </div>
            {seatType && (
              <div className="text-xs text-blue-600 ml-2">
                Loại: {SEAT_TYPE_LABELS[seatType]?.label || seatType}
              </div>
            )}
          </div>
        );
      })}
      <div className="border-t border-blue-200 pt-2 mt-2">
        <p className="text-sm font-bold text-blue-800">
          Tổng chi phí ghế: {formatCurrencyVND(getSeatPrice())}
        </p>
      </div>
    </div>
  );

// Multi-City Seat Selection Card
const MultiCitySeatSelectionCard = ({
  flight,
  formData,
  multiCitySeats,
  setMultiCitySeats,
  multiCitySeatData,
  multiCityLoading,
  multiCityShowSeats,
  setMultiCityShowSeats,
  seatLegend,
}) => {
  const passengers = formData.passengers;

  // Filter out INFANT passengers from seat selection
  const passengersNeedingSeats = passengers.filter(
    (passenger) => passenger.type !== "INFANT"
  );

  const handleMultiCitySeatSelect = (
    segmentIndex,
    seatNumber,
    passengerIndex
  ) => {
    const segmentKey = `segment${segmentIndex}`;
    const segmentSeatData = multiCitySeatData[segmentKey] || [];

    const seat = segmentSeatData.find((s) => s.seatNumber === seatNumber);
    if (seat?.status !== "occupied" && seat?.status !== "pending") {
      setMultiCitySeats((prev) => {
        const newSeats = { ...prev };

        // Initialize segment if not exists
        if (!newSeats[segmentKey]) {
          newSeats[segmentKey] = {};
        }

        const segmentSeats = { ...newSeats[segmentKey] };
        const passengerKey = `passenger${passengerIndex + 1}`;

        // Remove seat from other passengers in this segment
        Object.keys(segmentSeats).forEach((key) => {
          const currentSeat = segmentSeats[key];
          const currentSeatNumber =
            typeof currentSeat === "object"
              ? currentSeat?.seatNumber
              : currentSeat;
          if (currentSeatNumber === seatNumber && key !== passengerKey) {
            delete segmentSeats[key];
          }
        });

        // Toggle seat for current passenger
        const currentSeat = segmentSeats[passengerKey];
        const currentSeatNumber =
          typeof currentSeat === "object"
            ? currentSeat?.seatNumber
            : currentSeat;

        if (currentSeatNumber === seatNumber) {
          delete segmentSeats[passengerKey];
        } else {
          // Get travel class info for this segment
          const segmentTravelClass =
            flight?.legs?.[segmentIndex]?.selectedClass;

          // Get seat pricing info
          const seatTypePricing = getSeatTypePricingFromApi(
            segmentSeatData,
            segmentTravelClass?.travelClass,
            segmentTravelClass?.travelClass?.id
          );
          let seatType = seat?.seatType;

          // Fallback logic for seat type if not provided by API
          if (
            !seatType ||
            seatType === null ||
            seatType === undefined ||
            seatType === "" ||
            seatType === "null"
          ) {
            const rowNum = parseInt(seatNumber.match(/\d+/)?.[0] || "1");
            const letter = seatNumber.match(/[A-Z]/)?.[0] || "A";

            if (rowNum <= 3) {
              seatType = "FRONT_ROW";
            } else if (letter === "A" || letter === "F") {
              seatType = "EXTRA_LEGROOM";
            } else {
              seatType = "STANDARD";
            }
          }

          const baseSeatPrice = seat?.priceVND || 0;
          const seatTypePrice = seatTypePricing[seatType]?.priceValue || 0;
          const totalPrice = baseSeatPrice + seatTypePrice;

          // Store detailed seat information
          segmentSeats[passengerKey] = {
            seatNumber,
            seatType,
            priceVND: totalPrice,
            className: seat?.className || "Economy",
            passengerIndex: passengerIndex + 1,
          };
        }

        newSeats[segmentKey] = segmentSeats;
        return newSeats;
      });
    }
  };

  const getSegmentSeatPrice = (segmentIndex) => {
    const segmentKey = `segment${segmentIndex}`;
    const segmentSeats = multiCitySeats[segmentKey] || {};
    const segmentSeatData = multiCitySeatData[segmentKey] || [];

    // Get travel class info for this segment
    const segmentTravelClass = flight?.legs?.[segmentIndex]?.selectedClass;

    // Get seat type pricing for this segment
    const segmentSeatTypePricing = getSeatTypePricingFromApi(
      segmentSeatData,
      segmentTravelClass?.travelClass,
      segmentTravelClass?.travelClass?.id
    );

    return Object.values(segmentSeats).reduce((total, seatNumber) => {
      const seat = segmentSeatData.find((s) => s.seatNumber === seatNumber);
      if (!seat) return total;

      const baseSeatPrice = seat?.priceVND || 0;

      // Debug seat type determination

      // Use seat type from API first, only fallback if truly missing/empty
      let seatType = seat?.seatType;
      // Check for actual empty/null values, not just falsy strings
      if (
        !seatType ||
        seatType === null ||
        seatType === undefined ||
        seatType === "" ||
        seatType === "null"
      ) {
        console.warn(
          `⚠️ No valid seatType from API for segment seat ${seatNumber} (value: "${seat?.seatType}"), using fallback logic`
        );
        const rowNum = parseInt(seatNumber.match(/\d+/)?.[0] || "1");
        const letter = seatNumber.match(/[A-Z]/)?.[0] || "A";

        if (rowNum <= 3) {
          seatType = "FRONT_ROW";
        } else if (letter === "A" || letter === "F") {
          seatType = "EXTRA_LEGROOM";
        } else {
          seatType = "STANDARD";
        }
      } else {
        console.log(
          `✅ Using API seatType for segment seat ${seatNumber}: ${seatType}`
        );
      }

      // Get seat type price from segment's API pricing data
      const seatTypePrice = segmentSeatTypePricing[seatType]?.priceValue || 0;

      return total + baseSeatPrice + seatTypePrice;
    }, 0);
  };

  const toggleSegmentSeats = (segmentIndex) => {
    const segmentKey = `segment${segmentIndex}`;
    setMultiCityShowSeats((prev) => ({
      ...prev,
      [segmentKey]: !prev[segmentKey],
    }));
  };

  return (
    <div className="space-y-6">
      {flight.legs?.map((leg, segmentIndex) => {
        const segmentKey = `segment${segmentIndex}`;
        const segmentSeats = multiCitySeats[segmentKey] || {};
        const segmentSeatData = multiCitySeatData[segmentKey] || [];
        const isLoading = multiCityLoading[segmentKey];
        const showSeats = multiCityShowSeats[segmentKey];

        return (
          <Card key={segmentKey} className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Chọn Chỗ Ngồi - Chặng {segmentIndex + 1} (
                  {leg.departureAirport?.code || "N/A"} →{" "}
                  {leg.arrivalAirport?.code || "N/A"}) -{" "}
                  {leg.aircraftName || leg.aircraft?.aircraftName || "N/A"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSegmentSeats(segmentIndex)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {showSeats ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showSeats && (
                <div>
                  {isLoading ? (
                    <SeatSkeleton />
                  ) : (
                    <>
                      <SeatLegend seatLegend={seatLegend} />
                      <div className="bg-white p-6 rounded-lg border max-h-[600px] overflow-y-auto">
                        <div className="text-center mb-4">
                          <p className="text-sm text-gray-500 mt-2">
                            {leg.departureAirport?.airportName ||
                              leg.departureAirport?.name ||
                              leg.departureAirportName ||
                              leg.fromAirport ||
                              "N/A"}{" "}
                            →{" "}
                            {leg.arrivalAirport?.airportName ||
                              leg.arrivalAirport?.name ||
                              leg.arrivalAirportName ||
                              leg.toAirport ||
                              "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Cuộn xuống để xem thêm hàng ghế
                          </p>
                        </div>
                        <div className="max-w-lg mx-auto">
                          <AircraftLayout
                            seats={segmentSeatData}
                            selectedSeats={segmentSeats}
                            passengers={passengersNeedingSeats}
                            handleSeatSelect={(seatNumber, passengerIndex) =>
                              handleMultiCitySeatSelect(
                                segmentIndex,
                                seatNumber,
                                passengerIndex
                              )
                            }
                            aircraftLayout={leg?.seatLayout || "N/A"}
                            selectedTravelClass={leg?.selectedClass}
                            totalSeats={leg?.totalSeats}
                            flight={leg}
                            flightId={leg?.id || leg?.flightId}
                            userTravelClassId={
                              leg?.selectedClass?.travelClass?.id
                            }
                          />
                        </div>
                        <SelectedSeatsSummary
                          selectedSeats={segmentSeats}
                          getSeatPrice={() => getSegmentSeatPrice(segmentIndex)}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Seat Selection Card
const SeatSelectionCard = ({
  flight,
  formData,
  selectedSeats,
  setSelectedSeats,
  seats,
  loading,
  seatLegend,
  // New props for round-trip
  returnSeats,
  returnLoading,
  selectedReturnSeats,
  setSelectedReturnSeats,
  isRoundTrip = false,
  showOutboundSeats,
  setShowOutboundSeats,
  showReturnSeats,
  setShowReturnSeats,
  setIsUpdating,
}) => {
  const passengers = formData.passengers;

  // Filter out INFANT passengers from seat selection
  const passengersNeedingSeats = passengers.filter(
    (passenger) => passenger.type !== "INFANT"
  );

  // Filter seats based on the user's selected travel class
  const filteredSeats = useMemo(() => {
    const userTravelClassId =
      flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
        ? flight.outboundFlight?.selectedClass?.travelClass?.id ||
          flight.outbound?.selectedClass?.travelClass?.id
        : flight?.flight?.selectedClass?.travelClass?.id ||
          flight?.selectedClass?.travelClass?.id;

    if (!userTravelClassId) {
      return seats; // Fallback to show all if class is not selected
    }
    return seats.filter((seat) => seat.travelClassId === userTravelClassId);
  }, [seats, flight]);

  // Function to auto-assign seats when user proceeds without manual selection

  const handleSeatSelect = (seatNumber, passengerIndex, isReturn = false) => {
    setIsUpdating(true);

    const seatList = isReturn ? returnSeats : seats;
    const setSeats = isReturn ? setSelectedReturnSeats : setSelectedSeats;
    const passengerKey = `passenger${passengerIndex + 1}`;

    const seat = seatList.find((s) => s.seatNumber === seatNumber);
    if (!seat) {
      return;
    }

    if (seat?.status !== "AVAILABLE") {
      console.warn(
        `⚠️ Seat ${seatNumber} is not available (status: ${seat.status})`
      );
      return;
    }

    setSeats((prev) => {
      const newSeats = { ...prev };

      // Remove the seat from other passengers who might have it (within the same flight direction)
      Object.keys(newSeats).forEach((key) => {
        const existingSeat = newSeats[key];
        let hasSameSeat = false;

        if (
          typeof existingSeat === "object" &&
          existingSeat?.seatId &&
          seat?.seatId
        ) {
          // Compare by seatId for exact match (preferred)
          hasSameSeat = existingSeat.seatId === seat.seatId;
        } else if (
          typeof existingSeat === "object" &&
          existingSeat?.seatNumber
        ) {
          // Fallback to seatNumber comparison
          hasSameSeat = existingSeat.seatNumber === seatNumber;
        } else if (typeof existingSeat === "string") {
          // Legacy format - compare seatNumber only
          hasSameSeat = existingSeat === seatNumber;
        }

        if (hasSameSeat && key !== passengerKey) {
          delete newSeats[key];
        }
      });

      // Toggle seat selection for this passenger
      const currentSeat = newSeats[passengerKey];
      const currentSeatNumber =
        typeof currentSeat === "object" ? currentSeat?.seatNumber : currentSeat;

      if (currentSeatNumber === seatNumber) {
        // If clicking the same seat, deselect it
        delete newSeats[passengerKey];
      } else {
        // Get travel class info
        const selectedTravelClass =
          flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
            ? isReturn
              ? flight.returnFlight?.selectedClass ||
                flight.return?.selectedClass
              : flight.outboundFlight?.selectedClass ||
                flight.outbound?.selectedClass
            : flight?.flight?.selectedClass || flight?.selectedClass;

        // Get seat pricing info
        const seatTypePricing = getSeatTypePricingFromApi(
          seatList,
          selectedTravelClass?.travelClass,
          selectedTravelClass?.travelClass?.id
        );
        let seatType = seat?.seatType;

        // Fallback logic for seat type if not provided by API
        if (
          !seatType ||
          seatType === null ||
          seatType === undefined ||
          seatType === "" ||
          seatType === "null"
        ) {
          const rowNum = parseInt(seatNumber.match(/\d+/)?.[0] || "1");
          const letter = seatNumber.match(/[A-Z]/)?.[0] || "A";

          if (rowNum <= 3) {
            seatType = "FRONT_ROW";
          } else if (letter === "A" || letter === "F") {
            seatType = "EXTRA_LEGROOM";
          } else {
            seatType = "STANDARD";
          }
        }

        const baseSeatPrice = seat?.priceVND || 0;
        const seatTypePrice = seatTypePricing[seatType]?.priceValue || 0;
        const totalPrice = baseSeatPrice + seatTypePrice;

        // Store detailed seat information including seatId for unique identification
        newSeats[passengerKey] = {
          seatId: seat?.seatId || seat?.id, // Include seatId for unique identification
          seatNumber,
          seatType,
          priceVND: totalPrice,
          className: seat?.className || "Economy",
          passengerIndex: passengerIndex + 1,
        };
      }

      return newSeats;
    });
  };

  const getSeatPrice = (seatData, selectedSeatData) => {
    // Get travel class info
    const selectedTravelClass =
      flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
        ? flight.outboundFlight?.selectedClass || flight.outbound?.selectedClass
        : flight?.flight?.selectedClass || flight?.selectedClass;

    const seatTypePricing = getSeatTypePricingFromApi(
      seatData,
      selectedTravelClass?.travelClass,
      selectedTravelClass?.travelClass?.id
    );
    return Object.values(selectedSeatData || {}).reduce((total, seatInfo) => {
      // Handle both new format (object) and old format (string)
      let seatNumber, storedPrice;

      if (typeof seatInfo === "object" && seatInfo.seatNumber) {
        // New format - seat info already stored with pricing
        seatNumber = seatInfo.seatNumber;
        storedPrice = seatInfo.priceVND || 0;
        return total + storedPrice;
      } else if (typeof seatInfo === "string") {
        // Old format - just seat number, need to calculate price
        seatNumber = seatInfo;
      } else {
        return total;
      }

      const seat = seatData.find((s) => s.seatNumber === seatNumber);
      if (!seat) return total;

      const baseSeatPrice = seat?.priceVND || 0;

      // Use seat type from API first, only fallback if truly missing/empty
      let seatType = seat?.seatType;
      // Check for actual empty/null values, not just falsy strings
      if (
        !seatType ||
        seatType === null ||
        seatType === undefined ||
        seatType === "" ||
        seatType === "null"
      ) {
        console.warn(
          `⚠️ No valid seatType from API for ${seatNumber} (value: "${seat?.seatType}"), using fallback logic`
        );
        const rowNum = parseInt(seatNumber.match(/\d+/)?.[0] || "1");
        const letter = seatNumber.match(/[A-Z]/)?.[0] || "A";

        if (rowNum <= 3) {
          seatType = "FRONT_ROW";
        } else if (letter === "A" || letter === "F") {
          seatType = "EXTRA_LEGROOM";
        } else {
          seatType = "STANDARD";
        }
      } else {
        console.log(`✅ Using API seatType for ${seatNumber}: ${seatType}`);
      }

      const seatTypePrice = seatTypePricing[seatType]?.priceValue || 0;
      return total + baseSeatPrice + seatTypePrice;
    }, 0);
  };

  const getReturnSeatPrice = (seatData, selectedSeatData) => {
    // Get travel class info for return flight
    const selectedTravelClass =
      flight?.returnFlight?.selectedClass || flight?.return?.selectedClass;

    const seatTypePricing = getSeatTypePricingFromApi(
      seatData,
      selectedTravelClass?.travelClass,
      selectedTravelClass?.travelClass?.id
    );
    return Object.values(selectedSeatData || {}).reduce((total, seatInfo) => {
      // Handle both new format (object) and old format (string)
      let seatNumber, storedPrice;

      if (typeof seatInfo === "object" && seatInfo.seatNumber) {
        // New format - seat info already stored with pricing
        seatNumber = seatInfo.seatNumber;
        storedPrice = seatInfo.priceVND || 0;
        return total + storedPrice;
      } else if (typeof seatInfo === "string") {
        // Old format - just seat number, need to calculate price
        seatNumber = seatInfo;
      } else {
        return total;
      }

      const seat = seatData.find((s) => s.seatNumber === seatNumber);
      if (!seat) return total;

      const baseSeatPrice = seat?.priceVND || 0;

      // Use seat type from API first, only fallback if truly missing/empty
      let seatType = seat?.seatType;
      // Check for actual empty/null values, not just falsy strings
      if (
        !seatType ||
        seatType === null ||
        seatType === undefined ||
        seatType === "" ||
        seatType === "null"
      ) {
        const rowNum = parseInt(seatNumber.match(/\d+/)?.[0] || "1");
        const letter = seatNumber.match(/[A-Z]/)?.[0] || "A";

        if (rowNum <= 3) {
          seatType = "FRONT_ROW";
        } else if (letter === "A" || letter === "F") {
          seatType = "EXTRA_LEGROOM";
        } else {
          seatType = "STANDARD";
        }
      }

      const seatTypePrice = seatTypePricing[seatType]?.priceValue || 0;
      return total + baseSeatPrice + seatTypePrice;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Outbound Flight Seats */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {isRoundTrip ? "Chọn Chỗ Ngồi - Chuyến Đi" : "Chọn Chỗ Ngồi"} -{" "}
              {flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                ? flight.outboundFlight?.aircraft?.aircraftName ||
                  flight.outbound?.aircraftName ||
                  flight.outbound?.aircraft?.aircraftName ||
                  "N/A"
                : flight?.flight?.aircraftName ||
                  flight?.flight?.aircraft?.aircraftName ||
                  flight?.aircraftName ||
                  flight?.aircraft?.aircraftName ||
                  "N/A"}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOutboundSeats(!showOutboundSeats)}
              className="text-blue-600 hover:text-blue-800"
            >
              {showOutboundSeats ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showOutboundSeats && (
            <div>
              {loading ? (
                <SeatSkeleton />
              ) : (
                <>
                  <SeatLegend seatLegend={seatLegend} />

                  {/* Auto Assign Button */}
                  <div className="mb-4 flex justify-center"></div>

                  <div className="bg-white dark:bg-gray-400 p-6 rounded-lg border max-h-[600px] overflow-y-auto">
                    <div className="text-center mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Cuộn xuống để xem thêm hàng ghế
                      </p>
                    </div>
                    <div className="max-w-6xl mx-auto">
                      <SeatSelectionWrapper
                        seats={seats}
                        selectedSeats={selectedSeats}
                        passengers={passengersNeedingSeats}
                        onSeatSelect={(seatNumber, passengerIndex, isReturn) =>
                          handleSeatSelect(seatNumber, passengerIndex, false)
                        }
                        isReturnFlight={false}
                        flightTitle={`Chọn Chỗ Ngồi - ${
                          flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                            ? flight.outboundFlight?.aircraft?.aircraftName ||
                              flight.outbound?.aircraftName ||
                              flight.outbound?.aircraft?.aircraftName ||
                              "N/A"
                            : flight?.flight?.aircraftName ||
                              flight?.flight?.aircraft?.aircraftName ||
                              flight?.aircraft?.aircraftName ||
                              "N/A"
                        }`}
                        showLegend={true}
                        userTravelClassId={
                          flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                            ? flight.outboundFlight?.selectedClass?.travelClass
                                ?.id
                            : flight?.flight?.selectedClass?.travelClass?.id ||
                              flight?.selectedClass?.travelClass?.id
                        }
                      />
                    </div>
                    <SelectedSeatsSummary
                      selectedSeats={selectedSeats}
                      getSeatPrice={() => getSeatPrice(seats, selectedSeats)}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Flight Seats - Only show for round trip */}
      {isRoundTrip && (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Chọn Chỗ Ngồi - Chuyến Về -{" "}
                {flight.returnFlight?.aircraft?.aircraftName ||
                  flight.return?.aircraftName ||
                  flight.return?.aircraft?.aircraftName ||
                  "N/A"}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReturnSeats(!showReturnSeats)}
                className="text-green-600 hover:text-green-800"
              >
                {showReturnSeats ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showReturnSeats && (
              <div>
                {returnLoading ? (
                  <SeatSkeleton />
                ) : (
                  <>
                    <SeatLegend seatLegend={seatLegend} />

                    {/* Auto Assign Button for Return */}
                    <div className="mb-4 flex justify-center"></div>

                    <div className="bg-white p-6 rounded-lg border max-h-[600px] overflow-y-auto">
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-500 mt-2">
                          Cuộn xuống để xem thêm hàng ghế
                        </p>
                      </div>

                      <div className="max-w-6xl mx-auto">
                        <SeatSelectionWrapper
                          seats={returnSeats}
                          selectedSeats={selectedReturnSeats}
                          passengers={passengersNeedingSeats}
                          onSeatSelect={(
                            seatNumber,
                            passengerIndex,
                            isReturn
                          ) =>
                            handleSeatSelect(seatNumber, passengerIndex, true)
                          }
                          isReturnFlight={true}
                          flightTitle={`Chọn Chỗ Ngồi - ${
                            flight.returnFlight?.aircraft?.aircraftName ||
                            flight.return?.aircraftName ||
                            flight.return?.aircraft?.aircraftName ||
                            "N/A"
                          }`}
                          showLegend={false}
                          userTravelClassId={
                            flight.returnFlight?.selectedClass?.travelClass?.id
                          }
                        />
                      </div>
                      <SelectedSeatsSummary
                        selectedSeats={selectedReturnSeats}
                        getSeatPrice={() =>
                          getReturnSeatPrice(returnSeats, selectedReturnSeats)
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Baggage Package Selection for a single passenger
const BaggagePackageOption = ({
  passengerIndex,
  passengerType,
  selectedPackage,
  onPackageChange,
  segmentCount = 1,
}) => (
  <div className="space-y-4">
    <h4 className="font-semibold text-gray-700">
      Hành Lý Ký Gửi - Hành khách {passengerIndex + 1} (
      {passengerType === "ADULT"
        ? "Người lớn"
        : passengerType === "CHILD"
        ? "Trẻ em"
        : "Em bé"}
      )
    </h4>
    <RadioGroup
      value={selectedPackage}
      onValueChange={(value) =>
        onPackageChange(`passenger_${passengerIndex}`, value)
      }
      className="space-y-3"
    >
      {Object.entries(BAGGAGE_PACKAGES).map(([packageKey, packageInfo]) => {
        const totalPrice = packageInfo.price * segmentCount;
        return (
          <div
            key={packageKey}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem
                value={packageKey}
                id={`${passengerIndex}-${packageKey}`}
              />
              <div>
                <Label
                  htmlFor={`${passengerIndex}-${packageKey}`}
                  className="font-medium cursor-pointer"
                >
                  {packageInfo.label}
                </Label>
                <p className="text-sm text-gray-500">
                  {packageKey === "NONE"
                    ? "Chỉ bao gồm hành lý xách tay (10kg)"
                    : `Hành lý ký gửi ${packageInfo.weight}kg`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-blue-600">
                {formatCurrencyVND(packageInfo.price)}
              </span>
              {segmentCount > 1 && packageInfo.price > 0 && (
                <p className="text-xs text-gray-500">
                  {formatCurrencyVND(packageInfo.price)} × {segmentCount} chặng
                  = {formatCurrencyVND(totalPrice)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </RadioGroup>
  </div>
);

// Baggage Options Card
const BaggageOptionsCard = ({
  formData,
  baggage,
  setBaggage,
  isRoundTrip,
  expandedSections,
  setExpandedSections,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const handlePackageChange = (passenger, packageKey) => {
    setBaggage((prev) => ({
      ...prev,
      [passenger]: packageKey,
    }));
  };

  const handlePackageChangeWithLoading = (passenger, packageKey) => {
    setIsUpdating(true);
    handlePackageChange(passenger, packageKey);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tùy Chọn Hành Lý</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setExpandedSections((prev) => ({
                ...prev,
                baggage: !prev.baggage,
              }))
            }
            className="ml-2"
          >
            {expandedSections.baggage ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      {expandedSections.baggage && (
        <CardContent>
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-green-700 font-medium">
              ✅ Miễn phí: 1 túi xách tay (10kg) mỗi hành khách
            </p>
            <p className="text-xs text-green-600 mt-1">
              💡 Mỗi hành khách chọn gói hành lý riêng • Giá nhân với số chặng (
              {isRoundTrip ? "2 chặng" : "1 chặng"})
            </p>
          </div>
          <div className="space-y-4">
            {formData.passengers.map(
              (passenger, index) =>
                passenger.type !== "INFANT" && (
                  <BaggagePackageOption
                    key={`passenger_${index}`}
                    passengerIndex={index}
                    passengerType={passenger.type}
                    selectedPackage={baggage[`passenger_${index}`] || "NONE"}
                    onPackageChange={handlePackageChange}
                    segmentCount={isRoundTrip ? 2 : 1}
                  />
                )
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Multi-City Baggage Options Card
const MultiCityBaggageOptionsCard = ({
  formData,
  flight,
  multiCityBaggage,
  setMultiCityBaggage,
}) => {
  const handleMultiCityBaggageChange = (
    segmentIndex,
    passenger,
    packageKey
  ) => {
    const segmentKey = `segment${segmentIndex}`;
    setMultiCityBaggage((prev) => {
      const newBaggage = { ...prev };

      // Initialize segment if not exists
      if (!newBaggage[segmentKey]) {
        newBaggage[segmentKey] = {};
      }

      // Set the selected package for this passenger in this segment
      newBaggage[segmentKey] = {
        ...newBaggage[segmentKey],
        [passenger]: packageKey,
      };

      return newBaggage;
    });
  };

  const getSegmentBaggagePrice = (segmentIndex) => {
    const segmentKey = `segment${segmentIndex}`;
    const segmentBaggage = multiCityBaggage[segmentKey] || {};

    return Object.values(segmentBaggage).reduce((total, packageKey) => {
      const packageInfo = BAGGAGE_PACKAGES[packageKey];
      return total + (packageInfo ? packageInfo.price : 0);
    }, 0);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Tùy Chọn Hành Lý - Multi-City
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-green-700 font-medium">
            ✅ Bao gồm: 1 túi xách tay (10kg) mỗi hành khách cho mỗi chặng
          </p>
        </div>

        <div className="space-y-6">
          {flight.legs?.map((leg, segmentIndex) => {
            const segmentKey = `segment${segmentIndex}`;
            const segmentBaggage = multiCityBaggage[segmentKey] || {};

            return (
              <div key={segmentKey} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-700">
                    Chặng {segmentIndex + 1}:{" "}
                    {leg.departureAirport?.code || "N/A"} →{" "}
                    {leg.arrivalAirport?.code || "N/A"}
                  </h4>
                  <Badge variant="outline" className="text-blue-600">
                    Tổng:{" "}
                    {formatCurrencyVND(getSegmentBaggagePrice(segmentIndex))}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {formData.passengers.map((passenger, passengerIndex) => {
                    if (passenger.type === "INFANT") return null;
                    const passengerKey = `passenger${passengerIndex + 1}`;
                    const passengerBaggage =
                      segmentBaggage[passengerKey] || "NONE";

                    return (
                      <div key={passengerKey} className="space-y-3">
                        <h5 className="font-medium text-gray-700">
                          Hành khách {passengerIndex + 1} (
                          {passenger.type === "ADULT"
                            ? "Người lớn"
                            : passenger.type === "CHILD"
                            ? "Trẻ em"
                            : "Em bé"}
                          )
                        </h5>

                        {/* Baggage Package Selection */}
                        <RadioGroup
                          value={passengerBaggage || "NONE"}
                          onValueChange={(value) =>
                            handleMultiCityBaggageChange(
                              segmentIndex,
                              passengerKey,
                              value
                            )
                          }
                          className="space-y-3"
                        >
                          {Object.entries(BAGGAGE_PACKAGES).map(
                            ([packageKey, packageInfo]) => (
                              <div
                                key={packageKey}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <RadioGroupItem
                                    value={packageKey}
                                    id={`${segmentKey}-${passengerKey}-${packageKey}`}
                                  />
                                  <div>
                                    <Label
                                      htmlFor={`${segmentKey}-${passengerKey}-${packageKey}`}
                                      className="font-medium cursor-pointer"
                                    >
                                      {packageInfo.label}
                                    </Label>
                                    <p className="text-sm text-gray-500">
                                      {packageKey === "NONE"
                                        ? "Chỉ bao gồm hành lý xách tay (10kg)"
                                        : `Hành lý ký gửi ${packageInfo.weight}kg`}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-blue-600">
                                    {formatCurrencyVND(packageInfo.price)}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </RadioGroup>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Service Option
const ServiceOption = ({
  id,
  label,
  description,
  checked,
  onChange,
  price,
}) => (
  <div className="flex items-center justify-between p-4 border rounded-lg">
    <div className="flex items-center gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <div>
        <Label htmlFor={id} className="font-medium cursor-pointer">
          {label}
        </Label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
    <span className="font-bold text-blue-600">{formatCurrencyVND(price)}</span>
  </div>
);

// Enhanced Ancillary Services Card with API data
const AncillaryServicesCard = ({
  selectedServices,
  setSelectedServices,
  availableServices,
  loadingServices,
  formData,
  expandedSections,
  setExpandedSections,
}) => {
  const handleServiceChange = (
    serviceId,
    isSelected,
    passengerIndex = null
  ) => {
    console.log("handleServiceChange called:", {
      serviceId,
      isSelected,
      passengerIndex,
    });
    setSelectedServices((prev) => {
      const newServices = { ...prev };
      const serviceKey =
        passengerIndex !== null
          ? `${serviceId}_passenger${passengerIndex}`
          : `${serviceId}_booking`;

      if (isSelected) {
        newServices[serviceKey] = {
          serviceId: serviceId,
          passengerId: passengerIndex !== null ? passengerIndex + 1 : null,
          quantity: 1,
          notes: "",
        };
      } else {
        delete newServices[serviceKey];
      }

      console.log("Updated selectedServices:", newServices);
      return newServices;
    });
  };

  const isServiceSelected = (serviceId, passengerIndex = null) => {
    const serviceKey =
      passengerIndex !== null
        ? `${serviceId}_passenger${passengerIndex}`
        : `${serviceId}_booking`;
    const result = !!selectedServices[serviceKey];
    console.log("isServiceSelected called:", {
      serviceId,
      passengerIndex,
      serviceKey,
      result,
      selectedServices,
    });
    return result;
  };

  if (loadingServices) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🛎️ Dịch Vụ Đi Kèm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group services by type
  const servicesByType = availableServices.reduce((acc, service) => {
    const type = service.serviceType || "OTHER";
    if (!acc[type]) acc[type] = [];
    acc[type].push(service);
    return acc;
  }, {});

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🛎️ Dịch Vụ Đi Kèm</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setExpandedSections((prev) => ({
                ...prev,
                services: !prev.services,
              }))
            }
            className="ml-2"
          >
            {expandedSections.services ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Chọn các dịch vụ bổ sung để nâng cao trải nghiệm bay của bạn
        </p>
      </CardHeader>
      {expandedSections.services && (
        <CardContent>
          <div className="space-y-6">
            {Object.entries(servicesByType).map(([type, services]) => {
              const typeInfo = getServiceTypeInfo(type);
              return (
                <div key={type} className="space-y-3">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    {typeInfo.vietnameseName}
                  </h4>
                  <div className="space-y-3 pl-4">
                    {services.map((service) => (
                      <AncillaryServiceOption
                        key={service.serviceId}
                        service={service}
                        passengers={formData.passengers}
                        onServiceChange={handleServiceChange}
                        isSelectedProp={isServiceSelected}
                        selectedServices={selectedServices}
                        setSelectedServices={setSelectedServices}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {availableServices.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Hiện tại không có dịch vụ nào khả dụng</p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Component for individual ancillary service option
const AncillaryServiceOption = ({
  service,
  passengers,
  onServiceChange,
  isSelectedProp,
  selectedServices,
  setSelectedServices,
}) => {
  const [expandedPassengers, setExpandedPassengers] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  console.log("AncillaryServiceOption render:", {
    serviceId: service.serviceId,
    serviceName: service.serviceName,
    isSelectedProp: typeof isSelectedProp,
    selectedServices,
  });

  // Determine if service applies to individual passengers or entire booking
  const isPerPassenger = [
    "MEAL",
    "INFANT_MEAL",
    "SPECIAL_ASSISTANCE",
    "SEAT",
  ].includes(service.serviceType);

  const handleNotesChange = (serviceId, passengerIndex, notes) => {
    const serviceKey =
      passengerIndex !== null
        ? `${serviceId}_passenger${passengerIndex}`
        : `${serviceId}_booking`;

    setSelectedServices((prev) => {
      if (prev[serviceKey]) {
        return {
          ...prev,
          [serviceKey]: {
            ...prev[serviceKey],
            notes: notes,
          },
        };
      }
      return prev;
    });
  };

  const getServiceNotes = (serviceId, passengerIndex = null) => {
    const serviceKey =
      passengerIndex !== null
        ? `${serviceId}_passenger${passengerIndex}`
        : `${serviceId}_booking`;
    return selectedServices[serviceKey]?.notes || "";
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h5 className="font-medium text-gray-800 dark:text-white">
              {service.serviceName}
            </h5>
            <Badge variant="outline" className="text-xs">
              {formatCurrencyVND(service.price)}
            </Badge>
          </div>
          {service.description && (
            <p className="text-sm text-gray-600 dark:text-gray-100 mb-3">
              {service.description}
            </p>
          )}

          {isPerPassenger ? (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedPassengers(!expandedPassengers)}
                className="p-0 h-auto font-normal text-blue-600"
              >
                Chọn cho từng hành khách {expandedPassengers ? "▲" : "▼"}
              </Button>

              {expandedPassengers && (
                <div className="space-y-3 ml-4">
                  {passengers.map((passenger, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`service-${service.serviceId}-passenger-${index}`}
                          checked={(() => {
                            const checked = isSelectedProp(
                              service.serviceId,
                              index
                            );
                            console.log(
                              `Passenger checkbox ${service.serviceId}-${index}: checked =`,
                              checked
                            );
                            return checked;
                          })()}
                          onCheckedChange={(checked) =>
                            onServiceChange(service.serviceId, checked, index)
                          }
                        />
                        <Label
                          htmlFor={`service-${service.serviceId}-passenger-${index}`}
                          className="text-sm"
                        >
                          {passenger.firstName} {passenger.lastName}
                          <span className="text-gray-500 ml-1">
                            ({passenger.type})
                          </span>
                          {isSelectedProp(service.serviceId, index) && (
                            <span className="ml-2 text-xs text-blue-600">
                              📝 Có ghi chú
                            </span>
                          )}
                        </Label>
                      </div>
                      {isSelectedProp(service.serviceId, index) && (
                        <div className="ml-6 mt-2">
                          <Label className="text-xs text-gray-600 block mb-1">
                            Ghi chú đặc biệt (tùy chọn)
                          </Label>
                          <textarea
                            placeholder="Nhập ghi chú cho dịch vụ này..."
                            className="w-full text-xs p-2 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                            value={getServiceNotes(service.serviceId, index)}
                            onChange={(e) =>
                              handleNotesChange(
                                service.serviceId,
                                index,
                                e.target.value
                              )
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`service-${service.serviceId}-booking`}
                  checked={(() => {
                    const checked = isSelectedProp(service.serviceId);
                    console.log(
                      `Booking checkbox ${service.serviceId}: checked =`,
                      checked
                    );
                    return checked;
                  })()}
                  onCheckedChange={(checked) =>
                    onServiceChange(service.serviceId, checked)
                  }
                />
                <Label
                  htmlFor={`service-${service.serviceId}-booking`}
                  className="text-sm"
                >
                  Áp dụng cho toàn bộ booking
                  {isSelectedProp(service.serviceId) && (
                    <span className="ml-2 text-xs text-blue-600">
                      📝 Có ghi chú
                    </span>
                  )}
                </Label>
              </div>
              {isSelectedProp(service.serviceId) && (
                <div className="ml-6 mt-2">
                  <Label className="text-xs text-gray-600 block mb-1">
                    Ghi chú đặc biệt (tùy chọn)
                  </Label>
                  <textarea
                    placeholder="Nhập ghi chú cho dịch vụ này..."
                    className="w-full text-xs p-2 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    value={getServiceNotes(service.serviceId)}
                    onChange={(e) =>
                      handleNotesChange(service.serviceId, null, e.target.value)
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Keep the old AdditionalServicesCard for backward compatibility
const AdditionalServicesCard = ({
  additionalServices,
  setAdditionalServices,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const handleServiceChange = (service) => {
    setAdditionalServices((prev) => ({
      ...prev,
      [service]: !prev[service],
    }));
  };

  const handleServiceChangeWithLoading = (service) => {
    setIsUpdating(true);
    handleServiceChange(service);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Dịch Vụ Bổ Sung (Legacy)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ServiceOption
            id="travel-insurance"
            label="Bảo Hiểm Du Lịch"
            description="Bảo hiểm toàn diện cho chuyến đi"
            checked={additionalServices.travelInsurance}
            onChange={() => handleServiceChange("travelInsurance")}
            price={SERVICE_PRICES.travelInsurance}
          />
          <ServiceOption
            id="in-flight-meal"
            label="Suất Ăn Trên Máy Bay"
            description="Bữa ăn ngon được phục vụ trong chuyến bay"
            checked={additionalServices.inFlightMeal}
            onChange={() => handleServiceChange("inFlightMeal")}
            price={SERVICE_PRICES.inFlightMeal}
          />
          <ServiceOption
            id="priority-boarding"
            label="Lên Máy Bay Ưu Tiên"
            description="Lên máy bay trước các hành khách khác"
            checked={additionalServices.priorityBoarding}
            onChange={() => handleServiceChange("priorityBoarding")}
            price={SERVICE_PRICES.priorityBoarding}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Booking Summary Card
const BookingSummary = ({
  formData,
  getSeatPrice,
  getBaggagePrice,
  getServicesPrice,
  getAncillaryServicesPrice,
  calculateTotal,
  fare,
  flight,
  // Flight type props
  isRoundTrip = false,
  isMultiCity = false,
  getReturnSeatPrice,
}) => (
  <div className="sticky top-8">
    <Card className="shadow-lg border-2 border-blue-100">
      <CardHeader className="bg-blue-50 dark:bg-gray-600">
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-white">
          Tóm Tắt Đặt Vé
          {isMultiCity && (
            <Badge variant="secondary" className="ml-2">
              Multi-City
            </Badge>
          )}
          {isRoundTrip && !isMultiCity && (
            <Badge variant="secondary" className="ml-2">
              Khứ hồi
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Flight fares */}
          {isMultiCity ? (
            <>
              {/* Multi-city passenger pricing */}
              {formData.passengers.map((passenger, index) => {
                // For multi-city, base price is for ADULT, then multiply by passenger type
                const basePriceForAdult = flight.totalPrice || 0; // This is adult price for all segments
                const multiplier = getPassengerMultiplier(passenger.type);
                const discountedPrice = basePriceForAdult * multiplier;

                return (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">
                      1{" "}
                      {passenger.type === "ADULT"
                        ? "người lớn"
                        : passenger.type === "CHILD"
                        ? "trẻ em"
                        : "em bé"}{" "}
                      (Multi-City {flight.legs?.length || 0} chặng)
                    </span>
                    <span className="font-medium">
                      {formatCurrencyVND(discountedPrice)}
                    </span>
                  </div>
                );
              })}
            </>
          ) : isRoundTrip ? (
            <>
              {/* Round-trip passenger pricing */}
              {formData.passengers.map((passenger, index) => {
                // Base prices are for ADULT - don't divide by passenger count
                const outboundPriceForAdult =
                  flight.outboundFlight?.selectedClass?.price ||
                  flight.outboundFlight?.selectedClass?.basePrice ||
                  flight.outbound?.selectedClass?.price ||
                  flight.outbound?.selectedClass?.basePrice ||
                  0;
                const returnPriceForAdult =
                  flight.returnFlight?.selectedClass?.price ||
                  flight.returnFlight?.selectedClass?.basePrice ||
                  flight.return?.selectedClass?.price ||
                  flight.return?.selectedClass?.basePrice ||
                  0;
                const totalPriceForAdult =
                  outboundPriceForAdult + returnPriceForAdult;

                const multiplier = getPassengerMultiplier(passenger.type);
                const discountedPrice = totalPriceForAdult * multiplier;

                return (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">
                      1{" "}
                      {passenger.type === "ADULT"
                        ? "người lớn"
                        : passenger.type === "CHILD"
                        ? "trẻ em"
                        : "em bé"}{" "}
                      (Khứ hồi)
                    </span>
                    <span className="font-medium">
                      {formatCurrencyVND(discountedPrice)}
                    </span>
                  </div>
                );
              })}
            </>
          ) : (
            // One-way passenger pricing
            formData.passengers.map((passenger, index) => {
              const basePrice = flight?.flight?.selectedClass?.price || 0;
              const multiplier = getPassengerMultiplier(passenger.type);
              const discountedPrice = basePrice * multiplier;
              return (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600">
                    1{" "}
                    {passenger.type === "ADULT"
                      ? "người lớn"
                      : passenger.type === "CHILD"
                      ? "trẻ em"
                      : "em bé"}{" "}
                    (đã bao gồm thuế & phí)
                  </span>
                  <span className="font-medium">
                    {formatCurrencyVND(discountedPrice)}
                  </span>
                </div>
              );
            })
          )}

          {/* Seat selection */}
          <div className="flex justify-between">
            <span className="text-gray-600">
              {isMultiCity
                ? "Chọn chỗ ngồi (tất cả chặng)"
                : isRoundTrip
                ? "Chọn chỗ ngồi (Chuyến đi)"
                : "Chọn chỗ ngồi"}
            </span>
            <span className="font-medium">
              {formatCurrencyVND(getSeatPrice())}
            </span>
          </div>

          {/* Return seat selection for round trip (not multi-city) */}
          {isRoundTrip && !isMultiCity && (
            <div className="flex justify-between">
              <span className="text-gray-600">Chọn chỗ ngồi (Chuyến về)</span>
              <span className="font-medium">
                {formatCurrencyVND(
                  getReturnSeatPrice ? getReturnSeatPrice() : 0
                )}
              </span>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {isMultiCity ? "Hành lý (tất cả chặng)" : "Hành lý"}
              </span>
              <span className="font-medium">
                {formatCurrencyVND(getBaggagePrice())}
              </span>
            </div>
            {getBaggagePrice() > 0 && (
              <div className="text-xs text-gray-500 ml-4">
                💡 {formData.passengers.length} hành khách ×{" "}
                {isRoundTrip && !isMultiCity ? 2 : 1} chặng
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">🛎️ Dịch vụ đi kèm</span>
              <span className="font-medium">
                {formatCurrencyVND(
                  getAncillaryServicesPrice ? getAncillaryServicesPrice() : 0
                )}
              </span>
            </div>
            {getAncillaryServicesPrice && getAncillaryServicesPrice() > 0 && (
              <div className="text-xs text-gray-500 ml-4">
                💡 Bao gồm dịch vụ per-passenger và per-segment
              </div>
            )}
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between text-lg font-bold">
            <span>Tổng cộng</span>
            <span className="text-blue-600">
              {formatCurrencyVND(calculateTotal())}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Main Extras Component
const Extras = ({ flight, fare, formData, setExtrasData }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter out INFANT passengers from seat selection (they don't need seats)
  const passengersNeedingSeats = formData.passengers.filter(
    (passenger) => passenger.type !== "INFANT"
  );

  // Debug flight object structure

  // Check flight type
  const isRoundTrip = flight.type === "ROUND_TRIP";
  const isMultiCity =
    flight.type === "MULTI_CITY" || (flight.legs && flight.legs.length > 1);

  // Multi-city seat selection state - segment-based
  const [multiCitySeats, setMultiCitySeats] = useState({}); // { segment0: {}, segment1: {}, ... }
  const [multiCitySeatData, setMultiCitySeatData] = useState({}); // { segment0: [], segment1: [], ... }
  const [multiCityLoading, setMultiCityLoading] = useState({}); // { segment0: false, segment1: false, ... }
  const [multiCityShowSeats, setMultiCityShowSeats] = useState({}); // { segment0: true, segment1: true, ... }

  // Round-trip state (keep existing for backward compatibility)
  const [selectedSeats, setSelectedSeats] = useState({});
  const [selectedReturnSeats, setSelectedReturnSeats] = useState({});
  const [seats, setSeats] = useState([]);
  const [returnSeats, setReturnSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [showOutboundSeats, setShowOutboundSeats] = useState(true);
  const [showReturnSeats, setShowReturnSeats] = useState(true);

  // Collapse/Expand states for better UX
  const [expandedSections, setExpandedSections] = useState({
    baggage: true,
    seats: false,
    services: false,
  });

  // Multi-city baggage state - per segment per passenger
  const [multiCityBaggage, setMultiCityBaggage] = useState({});

  // Regular baggage state (for round-trip and one-way) - Per passenger
  const [baggage, setBaggage] = useState(
    formData.passengers.reduce(
      (acc, _, index) => ({
        ...acc,
        [`passenger_${index}`]: "NONE", // Changed to passenger_0, passenger_1, etc.
      }),
      {}
    )
  );

  // Load saved extras data from localStorage with flight validation
  useEffect(() => {
    const savedExtrasData = localStorage.getItem("extrasData");
    const currentFlightKey = `${flight?.id || "unknown"}_${Date.now()}`;

    if (savedExtrasData) {
      try {
        const parsedData = JSON.parse(savedExtrasData);

        // Check if the saved data is for the current flight
        const currentFlightId =
          flight?.id || flight?.outboundFlight?.id || flight?.flightId;
        const savedFlightId = parsedData.flightId;

        // Only restore data if it's for the same flight, otherwise clear it
        if (savedFlightId && savedFlightId === currentFlightId) {
          // Restore seat selections
          if (
            parsedData.selectedSeats &&
            Object.keys(parsedData.selectedSeats).length > 0
          ) {
            setSelectedSeats(parsedData.selectedSeats);
          }
        } else {
          // Clear localStorage for different flight
          localStorage.removeItem("extrasData");
          // Reset all states to default
          setSelectedSeats({});
          setSelectedReturnSeats({});
          setMultiCitySeats({});
          setBaggage(
            formData.passengers.reduce(
              (acc, _, index) => ({
                ...acc,
                [`passenger${index + 1}`]: "NONE",
              }),
              {}
            )
          );
          setMultiCityBaggage({});
          setAdditionalServices({});
          return; // Exit early, don't restore old data
        }
        if (
          parsedData.selectedReturnSeats &&
          Object.keys(parsedData.selectedReturnSeats).length > 0
        ) {
          setSelectedReturnSeats(parsedData.selectedReturnSeats);
        }
        if (
          parsedData.multiCitySeats &&
          Object.keys(parsedData.multiCitySeats).length > 0
        ) {
          setMultiCitySeats(parsedData.multiCitySeats);
        }

        // Restore baggage selections
        if (parsedData.baggage && Object.keys(parsedData.baggage).length > 0) {
          setBaggage(parsedData.baggage);
        }
        if (
          parsedData.multiCityBaggage &&
          Object.keys(parsedData.multiCityBaggage).length > 0
        ) {
          setMultiCityBaggage(parsedData.multiCityBaggage);
        }

        // Restore services
        if (parsedData.additionalServices) {
          setAdditionalServices(parsedData.additionalServices);
        }
        if (
          parsedData.selectedAncillaryServices &&
          Object.keys(parsedData.selectedAncillaryServices).length > 0
        ) {
          // Check if the data structure is the old boolean format or new object format
          const ancillaryData = parsedData.selectedAncillaryServices;
          const isOldFormat = Object.values(ancillaryData).every(
            (val) => typeof val === "boolean"
          );

          if (isOldFormat) {
            // Convert old boolean format to new object format
            console.log(
              "Converting old ancillary services format to new format"
            );
            const convertedData = {};
            Object.entries(ancillaryData).forEach(
              ([serviceName, isSelected]) => {
                if (isSelected) {
                  // Map old service names to new service IDs (this is a temporary mapping)
                  // You may need to adjust this based on your actual service IDs
                  const serviceIdMap = {
                    inFlightMeal: 1,
                    priorityBoarding: 2,
                    travelInsurance: 3,
                  };
                  const serviceId = serviceIdMap[serviceName];
                  if (serviceId) {
                    convertedData[`${serviceId}_booking`] = {
                      serviceId: serviceId,
                      passengerId: null,
                      quantity: 1,
                      notes: "",
                    };
                  }
                }
              }
            );
            setSelectedServices(convertedData);
          } else {
            // Use new object format directly
            setSelectedServices(ancillaryData);
          }
        }

        // Restore UI states
        if (parsedData.showOutboundSeats !== undefined) {
          setShowOutboundSeats(parsedData.showOutboundSeats);
        }
        if (parsedData.showReturnSeats !== undefined) {
          setShowReturnSeats(parsedData.showReturnSeats);
        }
        if (
          parsedData.multiCityShowSeats &&
          Object.keys(parsedData.multiCityShowSeats).length > 0
        ) {
          setMultiCityShowSeats(parsedData.multiCityShowSeats);
        }
      } catch (error) {
        console.error("Error loading saved extras data:", error);
      }
    }
  }, []);

  // Clear localStorage when component unmounts or page is refreshed
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Don't clear on page refresh, only clear when navigating away
      if (performance.navigation?.type !== 1) {
        localStorage.removeItem("extrasData");
      }
    };

    // Clear localStorage when navigating to payment
    const handlePopState = (event) => {
      if (location.pathname.includes("payment")) {
        localStorage.removeItem("extrasData");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Initialize multi-city states based on flight type
  useEffect(() => {
    if (isMultiCity && flight.legs) {
      // Initialize seat selection state for each segment
      const initialSeats = {};
      const initialSeatData = {};
      const initialLoading = {};
      const initialShowSeats = {};
      const initialBaggage = {};

      flight.legs.forEach((_, segmentIndex) => {
        const segmentKey = `segment${segmentIndex}`;
        initialSeats[segmentKey] = {};
        initialSeatData[segmentKey] = [];
        initialLoading[segmentKey] = false;
        initialShowSeats[segmentKey] = true;

        // Initialize baggage for each segment and passenger
        initialBaggage[segmentKey] = formData.passengers.reduce(
          (acc, _, passengerIndex) => ({
            ...acc,
            [`passenger${passengerIndex + 1}`]: "NONE",
          }),
          {}
        );
      });

      setMultiCitySeats((prevSeats) =>
        Object.keys(prevSeats).length > 0 ? prevSeats : initialSeats
      );
      setMultiCitySeatData(initialSeatData);
      setMultiCityLoading(initialLoading);
      setMultiCityShowSeats((prevShow) =>
        Object.keys(prevShow).length > 0 ? prevShow : initialShowSeats
      );
      setMultiCityBaggage((prevBaggage) =>
        Object.keys(prevBaggage).length > 0 ? prevBaggage : initialBaggage
      );
    }
  }, [isMultiCity, flight.legs, formData.passengers]);
  const [additionalServices, setAdditionalServices] = useState({
    travelInsurance: false,
    inFlightMeal: false,
    priorityBoarding: false,
  });

  const [legacyAdditionalServices, setLegacyAdditionalServices] = useState({
    travelInsurance: false,
    inFlightMeal: false,
    priorityBoarding: false,
  });

  // New ancillary services state
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});
  const [loadingServices, setLoadingServices] = useState(true);

  // Fetch available ancillary services
  useEffect(() => {
    const fetchAncillaryServices = async () => {
      try {
        setLoadingServices(true);
        const response = await ancillaryServiceApi.getAllActiveServices();

        if (response.success) {
          console.log("Available ancillary services:", response.data);
          setAvailableServices(response.data || []);
        } else {
          console.error("Không thể tải dịch vụ đi kèm:", response.message);
          toast.error("Không thể tải danh sách dịch vụ đi kèm");
        }
      } catch (error) {
        console.error("Error fetching ancillary services:", error);
        toast.error("Có lỗi xảy ra khi tải dịch vụ đi kèm");
      } finally {
        setLoadingServices(false);
      }
    };

    fetchAncillaryServices();
  }, []);

  // Fetch seats for multi-city segments
  useEffect(() => {
    if (isMultiCity && flight.legs) {
      flight.legs.forEach((leg, segmentIndex) => {
        const segmentKey = `segment${segmentIndex}`;
        const flightId = leg.flightId || leg.id;

        if (flightId) {
          // Set loading for this segment
          setMultiCityLoading((prev) => ({ ...prev, [segmentKey]: true }));

          handleFetch({
            apiCall: () => flightApi.getSeatsByFlight(flightId),
            setData: (data) => {
              console.log(
                `🪑 Raw multi-city segment ${segmentIndex} seat data from API:`,
                data
              );
              // Load all seats without filtering by travel class
              const transformedSeats = data.map((seat) => {
                console.log(
                  `🪑 Individual multi-city segment ${segmentIndex} seat:`,
                  seat
                );
                // Try different field names for travel class ID, with fallback logic
                const travelClassId = getTravelClassIdFromSeat(seat);
                console.log(
                  `🪑 Multi-city segment ${segmentIndex} travel class ID extraction:`,
                  {
                    seatNumber: seat.seatNumber,
                    travelClassId: seat.travelClassId,
                    classId: seat.classId,
                    travelClassIdFromObject: seat.travelClass?.id,
                    classIdFromObject: seat.class?.id,
                    className: seat.className,
                    finalTravelClassId: travelClassId,
                  }
                );
                return {
                  seatId: seat.seatId,
                  seatNumber: seat.seatNumber,
                  className: seat.className,
                  status: seat.status, // Keep original API status
                  bookedByUserId: seat.bookedByUserId,
                  bookedByPassengerId: seat.bookedByPassengerId,
                  seatType: seat.seatType, // Use correct seatType field from API
                  flightId: seat.flightId,
                  travelClassId: travelClassId, // Use fallback logic
                  priceVND: seat.priceVND || 0, // Use price from API or 0
                };
              });

              setMultiCitySeatData((prev) => ({
                ...prev,
                [segmentKey]: transformedSeats,
              }));
            },
            setLoading: (loading) =>
              setMultiCityLoading((prev) => ({
                ...prev,
                [segmentKey]: loading,
              })),
            errorMessage: `Không thể lấy danh sách ghế cho chặng ${
              segmentIndex + 1
            }`,
          });
        }
      });
    } else if (isRoundTrip) {
      // Round-trip flights - load ALL seats for each flight, same as one-way
      console.log("🪑 Loading round-trip seats", { flight });

      // Get outbound flight ID - try multiple possible sources
      const outboundId = flight.outbound?.id || flight.outboundFlight?.id;
      const returnId = flight.return?.id || flight.returnFlight?.id;

      // Load ALL outbound seats (same approach as one-way)
      if (outboundId) {
        console.log("🪑 Loading ALL outbound seats for ID:", outboundId);
        handleFetch({
          apiCall: () => flightApi.getSeatsByFlight(outboundId),
          setData: (data) => {
            console.log("🪑 Raw outbound seat data from API:", data);
            // Load ALL seats without filtering by travel class (same as one-way)
            setSeats(
              data.map((seat) => {
                // Try different field names for travel class ID, with fallback logic
                const travelClassId = getTravelClassIdFromSeat(seat);
                return {
                  seatId: seat.seatId,
                  seatNumber: seat.seatNumber,
                  className: seat.className,
                  status: seat.status, // Keep original API status
                  bookedByUserId: seat.bookedByUserId,
                  bookedByPassengerId: seat.bookedByPassengerId,
                  seatType: seat.seatType, // Use correct seatType field from API
                  flightId: seat.flightId,
                  travelClassId: travelClassId, // Use fallback logic
                  priceVND: seat.priceVND || 0, // Use price from API
                };
              })
            );
          },
          setLoading,
          errorMessage: "Không thể lấy danh sách ghế chuyến đi",
        });
      }

      // Load ALL return seats (same approach as one-way)
      if (returnId) {
        console.log("🪑 Loading ALL return seats for ID:", returnId);
        handleFetch({
          apiCall: () => flightApi.getSeatsByFlight(returnId),
          setData: (data) => {
            console.log("🪑 Raw return seat data from API:", data);
            // Load ALL seats without filtering by travel class (same as one-way)
            setReturnSeats(
              data.map((seat) => {
                // Try different field names for travel class ID, with fallback logic
                const travelClassId = getTravelClassIdFromSeat(seat);
                return {
                  seatId: seat.seatId,
                  seatNumber: seat.seatNumber,
                  className: seat.className,
                  status: seat.status, // Keep original API status
                  bookedByUserId: seat.bookedByUserId,
                  bookedByPassengerId: seat.bookedByPassengerId,
                  seatType: seat.seatType, // Use correct seatType field from API
                  flightId: seat.flightId,
                  travelClassId: travelClassId, // Use fallback logic
                  priceVND: seat.priceVND || 0, // Use price from API
                };
              })
            );
          },
          setLoading: setReturnLoading,
          errorMessage: "Không thể lấy danh sách ghế chuyến về",
        });
      }
    } else {
      // For one-way flights
      const flightId = flight.flight?.id || flight.id;
      if (flightId) {
        handleFetch({
          apiCall: () => flightApi.getSeatsByFlight(flightId),
          setData: (data) => {
            console.log("🪑 Raw seat data from API:", data);
            // Load all seats without filtering by travel class
            setSeats(
              data.map((seat) => {
                // console.log("🪑 Individual seat:", seat);
                // Try different field names for travel class ID, with fallback logic
                const travelClassId = getTravelClassIdFromSeat(seat);
                // console.log("🪑 Travel class ID extraction:", {
                //   seatNumber: seat.seatNumber,
                //   travelClassId: seat.travelClassId,
                //   classId: seat.classId,
                //   travelClassIdFromObject: seat.travelClass?.id,
                //   classIdFromObject: seat.class?.id,
                //   className: seat.className,
                //   finalTravelClassId: travelClassId,
                // });
                return {
                  seatId: seat.seatId,
                  seatNumber: seat.seatNumber,
                  className: seat.className,
                  status: seat.status, // Keep original API status
                  bookedByUserId: seat.bookedByUserId,
                  bookedByPassengerId: seat.bookedByPassengerId,
                  seatType: seat.seatType, // Use correct seatType field from API
                  flightId: seat.flightId,
                  travelClassId: travelClassId, // Use fallback logic
                  priceVND: seat.priceVND || 0, // Use price from API
                };
              })
            );
          },
          setLoading,
          errorMessage: "Không thể lấy danh sách ghế",
        });
      }
    }
  }, [
    isMultiCity,
    flight?.legs,
    flight?.flightId,
    flight?.selectedClass?.id,
    isRoundTrip,
    flight.outbound?.id,
    flight.return?.id,
    flight.outboundFlight?.id,
    flight.returnFlight?.id,
    flight.outbound?.selectedClass?.id,
    flight.return?.selectedClass?.id,
    flight.outboundFlight?.selectedClass?.id,
    flight.returnFlight?.selectedClass?.id,
  ]);

  // Prepare seat legend - include both status and types (matching actual colors)
  const seatStatusLegend = [
    {
      status: "selected",
      color: "bg-blue-500",
      label: "Đã chọn",
      price: "Miễn phí",
      type: "status",
    },
    {
      status: "PENDING_PAYMENT",
      color: "bg-yellow-500",
      label: "Chờ thanh toán",
      price: "Miễn phí",
      type: "status",
    },
    {
      status: "OCCUPIED",
      color: "bg-red-500",
      label: "Đã được đặt",
      price: "Miễn phí",
      type: "status",
    },
    {
      status: "DISABLE",
      color: "bg-gray-300",
      label: "Không được chọn",
      price: "Miễn phí",
      type: "status",
    },
  ];

  // Get travel class info
  const selectedTravelClass =
    flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
      ? flight.outboundFlight?.selectedClass || flight.outbound?.selectedClass
      : flight?.flight?.selectedClass || flight?.selectedClass;

  // Get seat type pricing from API data
  const seatTypePricing = getSeatTypePricingFromApi(
    seats,
    selectedTravelClass?.travelClass,
    selectedTravelClass?.travelClass?.id
  );

  const seatTypeLegend = Object.entries(SEAT_TYPE_LABELS).map(
    ([seatType, config]) => {
      const pricing = seatTypePricing[seatType];
      return {
        status: seatType,
        color: "bg-gray-100 border-gray-300",
        label: config.label,
        price: pricing ? pricing.price : "Đang tải...",
        priceValue: pricing ? pricing.priceValue : 0,
        shortLabel: config.shortLabel,
        type: "seatType",
      };
    }
  );

  const seatLegend = [...seatStatusLegend, ...seatTypeLegend];

  // Multi-city price calculations
  const getMultiCitySeatPrice = () => {
    if (!isMultiCity) return 0;

    let total = 0;
    Object.entries(multiCitySeats).forEach(([segmentKey, segmentSeats]) => {
      const segmentSeatData = multiCitySeatData[segmentKey] || [];
      const segmentIndex = parseInt(segmentKey.replace("segment", ""));
      const segmentTravelClass = flight?.legs?.[segmentIndex]?.selectedClass;

      // Get seat type pricing for this segment
      const segmentSeatTypePricing = getSeatTypePricingFromApi(
        segmentSeatData,
        segmentTravelClass?.travelClass,
        segmentTravelClass?.travelClass?.id
      );

      Object.values(segmentSeats).forEach((seatInfo) => {
        // Handle both new format (object) and old format (string)
        let seatNumber, storedPrice;

        if (typeof seatInfo === "object" && seatInfo.seatNumber) {
          // New format - seat info already stored with pricing
          seatNumber = seatInfo.seatNumber;
          storedPrice = seatInfo.priceVND || 0;
          total += storedPrice;
          return;
        } else if (typeof seatInfo === "string") {
          // Old format - just seat number, need to calculate price
          seatNumber = seatInfo;
        } else {
          return;
        }

        const seat = segmentSeatData.find((s) => s.seatNumber === seatNumber);
        if (!seat) return;

        const baseSeatPrice = seat?.priceVND || 0;

        // Debug multi-city seat type determination
        console.log(
          `🪑 Multi-city seat ${seatNumber} (${segmentKey}) pricing debug:`,
          {
            seatNumber,
            segmentKey,
            seatFromAPI: seat,
            seatTypeFromAPI: seat?.seatType,
            basePriceFromAPI: seat?.priceVND,
          }
        );

        // ALWAYS use seatType from API - no fallback logic
        const seatType = seat?.seatType;

        if (!seatType) {
          console.error(
            `❌ No seatType from API for multi-city seat ${seatNumber}. API data must provide seatType.`
          );
          console.log(`🔍 Full multi-city seat object:`, seat);
          return; // Skip this seat if no seatType from API
        }

        // Get seat type price from segment's API pricing data
        const seatTypePrice = segmentSeatTypePricing[seatType]?.priceValue || 0;

        console.log(
          `✅ Using API seatType for multi-city seat ${seatNumber}: ${seatType} (price: ${seatTypePrice})`
        );
        console.log(
          `💰 Final pricing for multi-city seat ${seatNumber}: base=${baseSeatPrice} + type=${seatTypePrice} = ${
            baseSeatPrice + seatTypePrice
          }`
        );
        total += baseSeatPrice + seatTypePrice;
      });
    });
    return total;
  };

  const getMultiCityBaggagePrice = () => {
    if (!isMultiCity) return 0;

    // For multi-city: calculate baggage price per passenger per segment
    const passengersCount = formData.passengers.length;
    const segmentCount =
      flight.segments?.length || Object.keys(multiCityBaggage).length;

    let baggagePerPassengerTotal = 0;
    Object.values(multiCityBaggage).forEach((segmentBaggage) => {
      Object.values(segmentBaggage).forEach((packageKey) => {
        const packageInfo = BAGGAGE_PACKAGES[packageKey];
        baggagePerPassengerTotal += packageInfo ? packageInfo.price : 0;
      });
    });

    // Multi-city baggage is already calculated per segment, so just multiply by passengers
    const total = baggagePerPassengerTotal * passengersCount;

    console.log("✈️ Multi-City Baggage Price Calculation:", {
      baggagePerPassengerTotal,
      passengersCount,
      segmentCount,
      total,
      multiCityBaggage,
    });

    return total;
  };

  // Regular price calculations (round-trip and one-way)
  const getSeatPrice = () => {
    console.log("🧮 getSeatPrice called with:", {
      selectedSeats,
      seatsCount: seats.length,
      hasSelectedSeats: Object.keys(selectedSeats).length > 0,
    });

    const total = Object.values(selectedSeats).reduce((total, seatInfo) => {
      // Handle both new format (object) and old format (string)
      if (typeof seatInfo === "object" && seatInfo.priceVND !== undefined) {
        // New format - use stored price
        console.log(
          `✅ Using stored price for seat ${seatInfo.seatNumber}: ${seatInfo.priceVND} VND`
        );
        return total + seatInfo.priceVND;
      } else if (typeof seatInfo === "string") {
        // Old format - calculate price
        const seatNumber = seatInfo;
        const seat = seats.find((s) => s.seatNumber === seatNumber);

        if (!seat) {
          console.warn(`⚠️ Seat ${seatNumber} not found in seats array`);
          return total;
        }

        // Get seat type pricing from API data
        const seatTypePricing = getSeatTypePricingFromApi(
          seats,
          selectedTravelClass?.travelClass,
          selectedTravelClass?.travelClass?.id
        );
        const baseSeatPrice = seat?.priceVND || 0;
        const seatType = seat?.seatType;

        if (!seatType) {
          console.error(`❌ No seatType from API for seat ${seatNumber}`);
          return total;
        }

        const seatTypePrice = seatTypePricing[seatType]?.priceValue || 0;
        const totalForThisSeat = baseSeatPrice + seatTypePrice;

        console.log(
          `✅ Calculated price for seat ${seatNumber}: ${totalForThisSeat} VND`
        );
        return total + totalForThisSeat;
      }

      return total;
    }, 0);

    console.log(`💰 getSeatPrice final total: ${total} VND`);
    return total;
  };

  const getReturnSeatPrice = () => {
    console.log("🧮 getReturnSeatPrice called with:", {
      selectedReturnSeats,
      returnSeatsCount: returnSeats.length,
      hasSelectedReturnSeats: Object.keys(selectedReturnSeats).length > 0,
    });

    const total = Object.values(selectedReturnSeats).reduce(
      (total, seatInfo) => {
        // Handle both new format (object) and old format (string)
        if (typeof seatInfo === "object" && seatInfo.priceVND !== undefined) {
          // New format - use stored price
          console.log(
            `✅ Using stored price for return seat ${seatInfo.seatNumber}: ${seatInfo.priceVND} VND`
          );
          return total + seatInfo.priceVND;
        } else if (typeof seatInfo === "string") {
          // Old format - calculate price
          const seatNumber = seatInfo;
          const seat = returnSeats.find((s) => s.seatNumber === seatNumber);

          if (!seat) {
            console.warn(
              `⚠️ Return seat ${seatNumber} not found in returnSeats array`
            );
            return total;
          }

          // Get seat type pricing from return seats API data
          const returnTravelClass =
            flight?.returnFlight?.selectedClass ||
            flight?.return?.selectedClass;
          const returnSeatTypePricing = getSeatTypePricingFromApi(
            returnSeats,
            returnTravelClass?.travelClass,
            returnTravelClass?.travelClass?.id
          );
          const baseSeatPrice = seat?.priceVND || 0;
          const seatType = seat?.seatType;

          if (!seatType) {
            console.error(
              `❌ No seatType from API for return seat ${seatNumber}`
            );
            return total;
          }

          const seatTypePrice =
            returnSeatTypePricing[seatType]?.priceValue || 0;
          const totalForThisSeat = baseSeatPrice + seatTypePrice;

          console.log(
            `✅ Calculated price for return seat ${seatNumber}: ${totalForThisSeat} VND`
          );
          return total + totalForThisSeat;
        }

        return total;
      },
      0
    );

    console.log(`💰 getReturnSeatPrice final total: ${total} VND`);
    return total;
  };

  const getBaggagePrice = () => {
    if (isMultiCity) {
      return getMultiCityBaggagePrice();
    }

    // Baggage Logic: Per Passenger - mỗi hành khách chọn gói hành lý riêng
    // Tổng = (tổng baggage của tất cả passengers đã chọn) × số segments
    const segmentCount = isRoundTrip ? 2 : 1;

    // Tính tổng baggage từ tất cả passengers (mỗi passenger có thể chọn gói khác nhau)
    let totalBaggageAllPassengers = 0;

    // Duyệt qua từng passenger và cộng baggage họ đã chọn
    formData.passengers.forEach((passenger, passengerIndex) => {
      const passengerBaggageKey = baggage[`passenger_${passengerIndex}`];
      if (passengerBaggageKey) {
        const packageInfo = BAGGAGE_PACKAGES[passengerBaggageKey];
        if (packageInfo) {
          totalBaggageAllPassengers += packageInfo.price;
        }
      }
    });

    // Nhân với số segments (x2 cho roundtrip)
    const finalBaggagePrice = totalBaggageAllPassengers * segmentCount;

    console.log("💼 Baggage Price Calculation:", {
      totalBaggageAllPassengers,
      segmentCount,
      finalBaggagePrice,
      isRoundTrip,
      baggageSelections: baggage,
    });

    return finalBaggagePrice;
  };

  const getServicesPrice = () =>
    Object.entries(additionalServices).reduce(
      (total, [service, selected]) =>
        total + (selected ? SERVICE_PRICES[service] : 0),
      0
    );

  // Calculate ancillary services price based on API response properties
  const getAncillaryServicesPrice = () => {
    const passengersCount = formData.passengers.length;
    const segmentCount = isMultiCity
      ? flight.segments?.length || Object.keys(multiCityBaggage).length
      : isRoundTrip
      ? 2
      : 1;

    return Object.values(selectedServices).reduce((total, serviceSelection) => {
      const service = availableServices.find(
        (s) => s.serviceId === serviceSelection.serviceId
      );

      if (!service) return total;

      let serviceTotal = service.price * serviceSelection.quantity;

      // Logic chính xác:
      // 1. Nếu có passengerId (không null) → dịch vụ cho 1 hành khách cụ thể
      // 2. Nếu passengerId là null → dịch vụ cho toàn booking
      // 3. isPerPassenger = true → nhân với số hành khách
      // 4. isPerSegment = true → nhân với số chặng

      const hasSpecificPassenger =
        serviceSelection.passengerId !== null &&
        serviceSelection.passengerId !== undefined;

      if (hasSpecificPassenger) {
        // Dịch vụ cho 1 hành khách cụ thể - không nhân với số hành khách
        // Chỉ nhân với segment nếu isPerSegment = true
        if (service.isPerSegment) {
          serviceTotal *= segmentCount;
        }
      } else {
        // Dịch vụ cho toàn booking
        // Nhân với số hành khách nếu isPerPassenger = true
        if (service.isPerPassenger) {
          serviceTotal *= passengersCount;
        }

        // Nhân với số chặng nếu isPerSegment = true
        if (service.isPerSegment) {
          serviceTotal *= segmentCount;
        }
      }

      console.log("🛎️ Service Price Calculation:", {
        serviceName: service.serviceName,
        serviceId: service.serviceId,
        basePrice: service.price,
        quantity: serviceSelection.quantity,
        passengerId: serviceSelection.passengerId,
        hasSpecificPassenger,
        passengersCount,
        segmentCount,
        isPerPassenger: service.isPerPassenger,
        isPerSegment: service.isPerSegment,
        calculatedTotal: serviceTotal,
      });

      return total + serviceTotal;
    }, 0);
  };

  const calculateTotal = () => {
    let passengersTotal = 0;

    if (isMultiCity) {
      // Multi-city: flight.totalPrice is base adult price for all segments
      const baseAdultPrice = flight.totalPrice || 0;
      passengersTotal = formData.passengers.reduce((total, p) => {
        const multiplier = getPassengerMultiplier(p.type);
        return total + baseAdultPrice * multiplier;
      }, 0);
    } else if (isRoundTrip) {
      // Round trip: calculate from individual segment prices
      const outboundAdultPrice =
        flight.outboundFlight?.selectedClass?.price ||
        flight.outboundFlight?.selectedClass?.basePrice ||
        flight.outbound?.selectedClass?.price ||
        flight.outbound?.selectedClass?.basePrice ||
        0;
      const returnAdultPrice =
        flight.returnFlight?.selectedClass?.price ||
        flight.returnFlight?.selectedClass?.basePrice ||
        flight.return?.selectedClass?.price ||
        flight.return?.selectedClass?.basePrice ||
        0;
      const totalAdultPrice = outboundAdultPrice + returnAdultPrice;

      passengersTotal = formData.passengers.reduce((total, p) => {
        const multiplier = getPassengerMultiplier(p.type);
        return total + totalAdultPrice * multiplier;
      }, 0);
    } else {
      // Single flight: flight.totalPrice is base adult price
      const baseAdultPrice = flight.totalPrice || 0;
      passengersTotal = formData.passengers.reduce((total, p) => {
        const multiplier = getPassengerMultiplier(p.type);
        return total + baseAdultPrice * multiplier;
      }, 0);
    }

    // Calculate prices - all in VND
    let seatPrice = 0;
    let baggagePrice = 0;

    if (isMultiCity) {
      seatPrice = getMultiCitySeatPrice();
      baggagePrice = getMultiCityBaggagePrice();
    } else {
      seatPrice = getSeatPrice();
      const returnSeatPrice = isRoundTrip ? getReturnSeatPrice() : 0;
      seatPrice += returnSeatPrice;
      baggagePrice = getBaggagePrice();
    }

    const servicesPrice = getServicesPrice();
    const ancillaryServicesPrice = getAncillaryServicesPrice();

    // Return total
    return (
      passengersTotal +
      seatPrice +
      baggagePrice +
      servicesPrice +
      ancillaryServicesPrice
    );
  };

  // Update extras data and save to localStorage with flight tracking
  useEffect(() => {
    // Track current flight to prevent data mix-up
    const currentFlightId =
      flight?.id || flight?.outboundFlight?.id || flight?.flightId;

    const extrasData = {
      // Flight identifier to prevent data mix-up
      flightId: currentFlightId,
      timestamp: Date.now(), // Track when data was saved

      // Flight type flags
      isRoundTrip,
      isMultiCity,

      // Seat selections
      selectedSeats: isMultiCity ? {} : selectedSeats,
      selectedReturnSeats:
        isRoundTrip && !isMultiCity ? selectedReturnSeats : {},
      multiCitySeats: isMultiCity ? multiCitySeats : {},

      // Baggage selections
      baggage: isMultiCity ? {} : baggage,
      multiCityBaggage: isMultiCity ? multiCityBaggage : {},

      // Services (same for all flight types)
      additionalServices,
      selectedAncillaryServices: selectedServices,
      availableAncillaryServices: availableServices,

      // UI states for restoration
      showOutboundSeats,
      showReturnSeats,
      multiCityShowSeats,

      // Pricing
      total: calculateTotal(),
      seatTotal: isMultiCity ? getMultiCitySeatPrice() : getSeatPrice(),
      returnSeatTotal: isRoundTrip && !isMultiCity ? getReturnSeatPrice() : 0,
      baggageTotal: getBaggagePrice(),
      servicesTotal: getServicesPrice(),
      ancillaryServicesTotal: getAncillaryServicesPrice(),
    };

    // Save to localStorage for persistence with flight tracking
    localStorage.setItem("extrasData", JSON.stringify(extrasData));

    // Set loading to false after a short delay to ensure UI updates
    const timer = setTimeout(() => {
      setIsUpdating(false);
    }, 200); // 200ms delay

    setExtrasData(extrasData);
  }, [
    selectedSeats,
    selectedReturnSeats,
    multiCitySeats,
    baggage,
    multiCityBaggage,
    additionalServices,
    selectedServices,
    availableServices,
    showOutboundSeats,
    showReturnSeats,
    multiCityShowSeats,
    setExtrasData,
    formData.passengers.length,
    isRoundTrip,
    isMultiCity,
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700">
      <div className="relative max-w-7xl mx-auto py-8">
        {isUpdating && (
          <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Đang cập nhật...
              </p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
            Chọn Dịch Vụ Bổ Sung
            {isMultiCity && (
              <Badge variant="secondary" className="ml-3 text-sm">
                Multi-City ({flight.legs?.length || 0} chặng)
              </Badge>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isMultiCity
              ? "Chọn chỗ ngồi và dịch vụ cho từng chặng của chuyến bay multi-city"
              : "Nâng cao trải nghiệm chuyến bay với các dịch vụ thêm"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {isMultiCity ? (
              <MultiCitySeatSelectionCard
                flight={flight}
                formData={formData}
                multiCitySeats={multiCitySeats}
                setMultiCitySeats={setMultiCitySeats}
                multiCitySeatData={multiCitySeatData}
                multiCityLoading={multiCityLoading}
                multiCityShowSeats={multiCityShowSeats}
                setMultiCityShowSeats={setMultiCityShowSeats}
                seatLegend={seatLegend}
              />
            ) : (
              <SeatSelectionCard
                flight={flight}
                fare={fare}
                formData={formData}
                selectedSeats={selectedSeats}
                setSelectedSeats={setSelectedSeats}
                seats={seats}
                loading={loading}
                seatLegend={seatLegend}
                // Round-trip props
                isRoundTrip={isRoundTrip}
                returnSeats={returnSeats}
                returnLoading={returnLoading}
                selectedReturnSeats={selectedReturnSeats}
                setSelectedReturnSeats={setSelectedReturnSeats}
                // Collapsible state props
                showOutboundSeats={showOutboundSeats}
                setShowOutboundSeats={setShowOutboundSeats}
                setIsUpdating={setIsUpdating}
                showReturnSeats={showReturnSeats}
                setShowReturnSeats={setShowReturnSeats}
              />
            )}

            {isMultiCity ? (
              <MultiCityBaggageOptionsCard
                formData={formData}
                flight={flight}
                multiCityBaggage={multiCityBaggage}
                setMultiCityBaggage={setMultiCityBaggage}
              />
            ) : (
              <BaggageOptionsCard
                formData={formData}
                baggage={baggage}
                setBaggage={setBaggage}
                isRoundTrip={isRoundTrip}
                expandedSections={expandedSections}
                setExpandedSections={setExpandedSections}
              />
            )}

            <AncillaryServicesCard
              selectedServices={selectedServices}
              setSelectedServices={setSelectedServices}
              availableServices={availableServices}
              loadingServices={loadingServices}
              formData={formData}
              expandedSections={expandedSections}
              setExpandedSections={setExpandedSections}
            />
          </div>

          <BookingSummary
            formData={formData}
            getSeatPrice={isMultiCity ? getMultiCitySeatPrice : getSeatPrice}
            getBaggagePrice={getBaggagePrice}
            getServicesPrice={getServicesPrice}
            getAncillaryServicesPrice={getAncillaryServicesPrice}
            calculateTotal={calculateTotal}
            fare={fare}
            flight={flight}
            // Flight type props
            isRoundTrip={isRoundTrip}
            isMultiCity={isMultiCity}
            getReturnSeatPrice={getReturnSeatPrice}
          />
        </div>
      </div>
    </div>
  );
};

Extras.propTypes = {
  flight: PropTypes.shape({
    id: PropTypes.number,
  }).isRequired,
  fare: PropTypes.shape({
    travelClass: PropTypes.shape({
      classId: PropTypes.number,
    }),
  }).isRequired,
  formData: PropTypes.shape({
    passengers: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.oneOf(["ADULT", "CHILD", "INFANT"]),
      })
    ).isRequired,
  }).isRequired,
  setExtrasData: PropTypes.func.isRequired,
};

// Export both default and named exports for flexibility
export {
  autoAssignStandardSeats,
  processExtrasDataForBooking,
  getSeatStatusColor,
  SEAT_TYPE_LABELS,
  TRAVEL_CLASS_MAPPING,
  getTravelClassName,
  getTravelClassIdFromSeat,
};
export default Extras;
