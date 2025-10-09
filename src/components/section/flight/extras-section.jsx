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

// Constants - Pricing by Seat Type
const SEAT_TYPE_PRICING = {
  ACCESSIBLE: {
    priceVND: 0,
    priceUSD: 0,
    label: "Ghế dành cho người khuyết tật",
    shortLabel: "AC",
    color: "bg-orange-500",
  },
  EXIT_ROW: {
    priceVND: 120000,
    priceUSD: 5,
    label: "Ghế hàng thoát hiểm",
    shortLabel: "ER",
    color: "bg-red-500",
  },
  EXTRA_LEGROOM: {
    priceVND: 96000,
    priceUSD: 4,
    label: "Chỗ để chân rộng",
    shortLabel: "EL",
    color: "bg-blue-500",
  },
  FRONT_ROW: {
    priceVND: 48000,
    priceUSD: 2,
    label: "Hàng đầu",
    shortLabel: "FR",
    color: "bg-purple-500",
  },
  STANDARD: {
    priceVND: 24000,
    priceUSD: 1,
    label: "Tiêu chuẩn",
    shortLabel: "ST",
    color: "bg-green-500",
  },
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
      <h4 className="font-semibold mb-3 text-gray-700">Chú Thích Ghế</h4>

      {/* Travel Classes */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-600 mb-2">Hạng vé</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-600 rounded border border-purple-700"></div>
            <div className="text-sm">
              <div className="font-medium text-gray-700">Hạng nhất</div>
              <div className="text-gray-500 text-xs">First Class</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded border border-blue-700"></div>
            <div className="text-sm">
              <div className="font-medium text-gray-700">Thương gia</div>
              <div className="text-gray-500 text-xs">Business Class</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded border border-green-700"></div>
            <div className="text-sm">
              <div className="font-medium text-gray-700">Phổ thông</div>
              <div className="text-gray-500 text-xs">Economy Class</div>
            </div>
          </div>
        </div>
      </div>

      {/* Seat Status */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-600 mb-2">
          Trạng thái ghế
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {statusLegend.map((legend) => (
            <div key={legend.status} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${legend.color} border`}></div>
              <div className="text-sm">
                <div className="font-medium text-gray-700">{legend.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seat Types */}
      <div>
        <h5 className="text-sm font-medium text-gray-600 mb-2">
          Loại ghế đặc biệt
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {typeLegend.map((legend) => (
            <div key={legend.status} className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium min-w-[28px] text-center">
                {legend.shortLabel}
              </span>
              <div className="text-sm">
                <div className="font-medium text-gray-700">{legend.label}</div>
                <div className="text-green-600 font-medium">{legend.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Get seat color based on travel class - CONSISTENT COLORS
const getSeatClassColor = (seat) => {
  // Use travelClassId for accuracy, fallback to className
  const classId = seat?.travelClassId || seat?.classId;
  const className = seat?.className || seat;

  // First Class (ID: 3) - Purple
  if (classId === 3 || className === "First" || className === "Hạng nhất") {
    return "bg-purple-600 border-purple-700 text-white";
  }
  // Business Class (ID: 2) - Blue
  else if (
    classId === 2 ||
    className === "Business" ||
    className === "Thương gia"
  ) {
    return "bg-blue-600 border-blue-700 text-white";
  }
  // Economy Class (ID: 1) - Green
  else if (
    classId === 1 ||
    className === "Economy" ||
    className === "Phổ thông"
  ) {
    return "bg-green-600 border-green-700 text-white";
  } else {
    return "bg-gray-600 border-gray-700 text-white";
  }
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

    console.log(
      `🔄 Loading seats for flight ${flightId} across ${travelClassIds.length} travel classes...`
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
          const seats = Array.isArray(response.data) ? response.data : [];
          console.log(
            `✅ Loaded ${seats.length} ${travelClass.name} seats (Travel Class ID: ${travelClass.id})`
          );

          // Debug first seat structure
          if (seats.length > 0) {
            console.log(`🪑 Sample ${travelClass.name} seat structure:`, {
              original: seats[0],
              travelClassId: travelClass.id,
              travelClassName: travelClass.name,
            });
          }

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

    console.log(`🎯 Total loaded seats: ${allSeats.length}`);
    console.log(`🔢 Unique seat numbers: ${uniqueSeatNumbers.length}`);
    console.log(`⚠️ Has overlapping seats: ${hasOverlaps}`);

    if (hasOverlaps) {
      console.log(
        "� Overlapping seats detected - same physical seats available in multiple travel classes"
      );

      // Group seats by seatNumber to see the overlap
      const seatGroups = allSeats.reduce((acc, seat) => {
        if (!acc[seat.seatNumber]) acc[seat.seatNumber] = [];
        acc[seat.seatNumber].push(seat);
        return acc;
      }, {});

      // Log overlapping seats for debugging
      Object.entries(seatGroups).forEach(([seatNum, seats]) => {
        if (seats.length > 1) {
          console.log(
            `🪑 Seat ${seatNum}:`,
            seats.map((s) => `${s.className}(ID:${s.travelClassId})`).join(", ")
          );
        }
      });

      // DISABLED: No longer creating unified seat map - keep all 50 seats
      // const unifiedSeats = Object.entries(seatGroups).map(([seatNum, seats]) => { ... });

      console.log(`✨ Keeping all ${allSeats.length} seats (not unifying)`);
      // allSeats.length = 0; // Clear array - DISABLED
      // allSeats.push(...unifiedSeats); // Replace with unified seats - DISABLED
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

    console.log("Seat distribution:", seatDistribution);
    console.log("📊 All 50 seats breakdown:");
    console.log(`- Economy seats: ${seatDistribution.economy}`);
    console.log(`- Business seats: ${seatDistribution.business}`);
    console.log(`- First class seats: ${seatDistribution.first}`);
    console.log(`- Total: ${seatDistribution.total}`);

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
}) => {
  const [completeSeatMap, setCompleteSeatMap] = useState(seats);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);

  // Load complete seat map from API when flightId is available
  useEffect(() => {
    const loadSeats = async () => {
      if (flightId && flightId !== "N/A") {
        setIsLoadingSeats(true);
        try {
          const apiSeats = await loadCompleteSeatMapFromApi(flightId);
          console.log(
            `🔄 AircraftLayout received ${apiSeats.length} seats from API`
          );
          if (apiSeats.length > 0) {
            setCompleteSeatMap(apiSeats);
            console.log(
              `✅ AircraftLayout set completeSeatMap to ${apiSeats.length} seats`
            );
          } else {
            // Fallback to provided seats if API returns empty
            setCompleteSeatMap(seats);
            console.log(
              `⚠️ AircraftLayout fallback to provided ${seats.length} seats`
            );
          }
        } catch (error) {
          console.error("Error loading seats from API:", error);
          setCompleteSeatMap(seats); // Fallback to provided seats
        } finally {
          setIsLoadingSeats(false);
        }
      } else {
        // No flightId, use provided seats
        console.log(
          `📄 AircraftLayout no flightId, using provided ${seats.length} seats`
        );
        setCompleteSeatMap(seats);
      }
    };

    loadSeats();
  }, [flightId, seats]);

  console.log("🛩️ AircraftLayout data:", {
    flightId,
    aircraftLayout,
    totalSeats,
    originalSeatsCount: seats.length,
    completeSeatMapCount: completeSeatMap.length,
    selectedTravelClass: selectedTravelClass?.travelClass?.className,
    isLoadingSeats,
    sampleSeats: completeSeatMap.slice(0, 5), // Show first 5 seats as sample
  });

  // Group seats by row number
  const seatsByRow = completeSeatMap.reduce((acc, seat) => {
    const rowNum = seat.seatNumber.match(/\d+/)?.[0] || "1";
    if (!acc[rowNum]) acc[rowNum] = [];
    acc[rowNum].push(seat);
    return acc;
  }, {});

  // Sort row numbers
  const sortedRowNumbers = Object.keys(seatsByRow).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );

  console.log("🔢 Seats by row debug:", {
    totalSeats: completeSeatMap.length,
    rowCount: sortedRowNumbers.length,
    rowNumbers: sortedRowNumbers,
    seatsPerRow: Object.entries(seatsByRow)
      .map(([row, seats]) => `${row}:${seats.length}`)
      .join(", "),
  });

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
  if (!completeSeatMap || completeSeatMap.length === 0) {
    return (
      <div className="aircraft-layout">
        <div className="flex justify-center items-center py-8">
          <span className="text-gray-600">Không có ghế nào có sẵn</span>
        </div>
      </div>
    );
  }

  return (
    <div className="aircraft-layout">
      {/* Aircraft nose */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-8 bg-gray-300 rounded-t-full flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600">✈️</span>
        </div>
      </div>

      {/* Seat rows */}
      {sortedRowNumbers.map((rowNum) => {
        const rowSeats = seatsByRow[rowNum].sort((a, b) => {
          const letterA = a.seatNumber.match(/[A-Z]/)?.[0] || "A";
          const letterB = b.seatNumber.match(/[A-Z]/)?.[0] || "A";
          return letterA.localeCompare(letterB);
        });

        return (
          <div
            key={rowNum}
            className="flex justify-center items-center gap-1 mb-2"
          >
            {/* Row number */}
            <div className="w-6 text-xs text-gray-500 text-center font-medium">
              {rowNum}
            </div>

            {/* Render seats with aircraft layout structure */}
            {seatSections.map((sectionLetters, sectionIndex) => (
              <div key={sectionIndex} className="flex items-center">
                {/* Seat section */}
                <div className="flex gap-1">
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
                        className="w-8 h-8"
                      ></div>
                    );
                  })}
                </div>

                {/* Aisle (not after last section) */}
                {sectionIndex < seatSections.length - 1 && (
                  <div className="w-6 border-l border-r border-gray-200 h-8 flex items-center justify-center mx-2">
                    <div className="w-full h-px bg-gray-300"></div>
                  </div>
                )}
              </div>
            ))}

            {/* Row number */}
            <div className="w-6 text-xs text-gray-500 text-center font-medium">
              {rowNum}
            </div>
          </div>
        );
      })}
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
  const isSelected = Object.values(selectedSeats).includes(seat.seatNumber);

  // Debug seat and travel class data
  if (seat.seatNumber === "1A") {
    // Debug only first seat to avoid spam
    console.log("🪑 Seat debug (1A):", {
      seat,
      seatClassName: seat.className,
      seatTravelClassName: seat.travelClassName,
      seatClassId: seat.classId,
      seatTravelClassId: seat.travelClassId,
      selectedTravelClass,
      selectedTravelClassName: selectedTravelClass?.travelClass?.className,
      selectedTravelClassId: selectedTravelClass?.travelClass?.id,
    });
  }

  // Check if seat belongs to selected travel class
  const getUserTravelClassId = () => {
    if (typeof selectedTravelClass === "string") return null;
    return selectedTravelClass?.travelClass?.id;
  };

  const userTravelClassId = getUserTravelClassId();

  const isAllowedClass = selectedTravelClass
    ? // Handle both string and object formats for selectedTravelClass
      typeof selectedTravelClass === "string"
      ? seat.className === selectedTravelClass ||
        seat.travelClassName === selectedTravelClass
      : // Compare seat's travel class with user's selected class
        seat.seatClassId === userTravelClassId ||
        seat.travelClassId === userTravelClassId ||
        seat.classId === userTravelClassId ||
        seat.className === selectedTravelClass?.travelClass?.className ||
        seat.travelClassName === selectedTravelClass?.travelClass?.className
    : true; // If no class selected, allow all seats

  const isDisabledByClass = selectedTravelClass && !isAllowedClass;

  return (
    <TooltipProvider key={uniqueKey || seat.seatNumber}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => {
              if (isDisabledByClass) {
                const userClassName =
                  typeof selectedTravelClass === "string"
                    ? selectedTravelClass
                    : selectedTravelClass?.travelClass?.className;
                toast.error(
                  `Ghế này thuộc hạng ${
                    seat.className || seat.travelClassName
                  }. Bạn chỉ có thể chọn ghế hạng ${userClassName}.`
                );
                return;
              }

              if (isSelected) {
                // If seat is already selected, find which passenger has it and unselect
                const passengerKey = Object.keys(selectedSeats).find(
                  (key) => selectedSeats[key] === seat.seatNumber
                );
                if (passengerKey) {
                  const passengerIndex =
                    parseInt(passengerKey.replace("passenger", "")) - 1;
                  handleSeatSelect(seat.seatNumber, passengerIndex);
                }
              } else {
                // Find first available passenger slot
                const availablePassengerIndex = passengers.findIndex(
                  (_, index) => !selectedSeats[`passenger${index + 1}`]
                );

                if (availablePassengerIndex !== -1) {
                  handleSeatSelect(seat.seatNumber, availablePassengerIndex);
                } else {
                  toast.error("Tất cả hành khách đã chọn ghế");
                }
              }
            }}
            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all duration-200 border ${
              isOccupied || isPending
                ? "bg-gray-400 text-gray-600 cursor-not-allowed border-gray-300"
                : isDisabledByClass
                ? `${getSeatClassColor(seat)} opacity-50 cursor-not-allowed`
                : isSelected
                ? "bg-yellow-500 text-black ring-2 ring-yellow-300 border-yellow-400"
                : `${getSeatClassColor(
                    seat
                  )} hover:opacity-90 hover:scale-105 transition-all duration-200`
            }`}
            disabled={isOccupied || isPending || isDisabledByClass}
            title={
              isOccupied
                ? `Ghế ${seat.seatNumber} - Đã được đặt${
                    seat.bookedBy ? ` bởi ${seat.bookedBy}` : ""
                  }`
                : isPending
                ? `Ghế ${seat.seatNumber} - Đang chờ thanh toán`
                : isDisabledByClass
                ? `Ghế ${seat.seatNumber} - ${seat.className} - Không thể chọn (vé của bạn là hạng ${selectedTravelClass?.travelClass?.className})`
                : `Ghế ${seat.seatNumber} - ${seat.className} - ${
                    SEAT_PRICING[seat.status]?.label || "Tiêu chuẩn"
                  }`
            }
          >
            <div className="flex flex-col items-center">
              <span className="font-bold">
                {seat.seatNumber.match(/[A-Z]/)?.[0] || seat.seatNumber}
              </span>
              {seat.seatType && (
                <span className="text-[8px] opacity-80">
                  {SEAT_TYPE_PRICING[seat.seatType]?.shortLabel ||
                    seat.seatType}
                </span>
              )}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-semibold">Ghế {seat.seatNumber}</p>
            <p className="text-sm">Hạng: {seat.className}</p>
            {seat.seatType && (
              <p className="text-sm">
                Loại ghế:{" "}
                {SEAT_TYPE_PRICING[seat.seatType]?.label || seat.seatType}
              </p>
            )}
            <p className="text-sm">
              Trạng thái: {SEAT_PRICING[seat.status]?.label || "Có sẵn"}
            </p>
            {seat.seatType && SEAT_TYPE_PRICING[seat.seatType] && (
              <p className="text-sm font-medium text-green-600">
                Phí:{" "}
                {formatCurrencyVND(SEAT_TYPE_PRICING[seat.seatType].priceVND)}
              </p>
            )}
            {isDisabledByClass && (
              <p className="text-sm text-orange-600 font-medium">
                ⚠️ Không thể chọn
              </p>
            )}
            {isDisabledByClass && selectedTravelClass && (
              <p className="text-xs text-gray-600">
                Vé của bạn:{" "}
                {typeof selectedTravelClass === "string"
                  ? selectedTravelClass
                  : selectedTravelClass?.travelClass?.className}
              </p>
            )}
            {!isOccupied && !isPending && !isDisabledByClass && (
              <p className="text-sm font-medium text-green-600">
                {formatCurrencyVND(SEAT_PRICING[seat.status]?.priceVND || 0)}
              </p>
            )}
            {seat.bookedBy && (
              <p className="text-sm text-red-500">Đã đặt: {seat.bookedBy}</p>
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
};

// Selected Seats Summary
const SelectedSeatsSummary = ({ selectedSeats, getSeatPrice }) =>
  Object.keys(selectedSeats).length > 0 && (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      {Object.entries(selectedSeats).map(([passenger, seatNumber]) => (
        <p key={passenger} className="text-sm font-medium text-blue-800">
          {passenger}: {seatNumber}
        </p>
      ))}
      <p className="text-xs text-blue-600 mt-1">
        Tổng chi phí ghế: {formatCurrencyVND(getSeatPrice())}
      </p>
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
          if (segmentSeats[key] === seatNumber && key !== passengerKey) {
            delete segmentSeats[key];
          }
        });

        // Toggle seat for current passenger
        if (segmentSeats[passengerKey] === seatNumber) {
          delete segmentSeats[passengerKey];
        } else {
          segmentSeats[passengerKey] = seatNumber;
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

    return Object.values(segmentSeats).reduce((total, seatNumber) => {
      const seat = segmentSeatData.find((s) => s.seatNumber === seatNumber);
      if (!seat) return total;

      const baseSeatPrice = seat?.priceVND || 0;

      // Debug seat type determination
      console.log(
        `🪑 Multi-city seat ${seatNumber} (segment ${segmentIndex}) pricing debug:`,
        {
          seatNumber,
          seatFromAPI: seat,
          seatTypeFromAPI: seat?.seatType,
          seatTypeType: typeof seat?.seatType,
          basePriceFromAPI: seat?.priceVND,
        }
      );

      // ALWAYS use seatType from API - no fallback logic
      const seatType = seat?.seatType;

      if (!seatType) {
        console.error(
          `❌ No seatType from API for segment seat ${seatNumber}. API data must provide seatType.`
        );
        console.log(`🔍 Full segment seat object:`, seat);
        return total; // Skip this seat if no seatType from API
      }

      console.log(
        `✅ Using API seatType for segment seat ${seatNumber}: ${seatType}`
      );
      const seatTypePrice = SEAT_TYPE_PRICING[seatType]?.priceVND || 0;
      console.log(
        `💰 Final pricing for ${seatNumber}: base=${baseSeatPrice} + type=${seatTypePrice} = ${
          baseSeatPrice + seatTypePrice
        }`
      );
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
                  {leg.aircraftName || leg.aircraft || "N/A"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSegmentSeats(segmentIndex)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {showSeats ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" /> Thu gọn
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" /> Mở rộng
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
                          <Badge variant="secondary">
                            Sơ đồ máy bay - Chặng {segmentIndex + 1} (
                            {leg.aircraftName || leg.aircraft || "N/A"})
                          </Badge>
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
                            passengers={passengers}
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
                            flightId={leg?.id}
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
  fare,
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
  // Collapsible state props
  showOutboundSeats,
  setShowOutboundSeats,
  showReturnSeats,
  setShowReturnSeats,
}) => {
  const passengers = formData.passengers;

  const handleSeatSelect = (seatNumber, passengerIndex, isReturn = false) => {
    const seatList = isReturn ? returnSeats : seats;
    const setSeats = isReturn ? setSelectedReturnSeats : setSelectedSeats;
    const prefix = isReturn ? "return_passenger" : "passenger";
    const passengerKey = `${prefix}${passengerIndex + 1}`;

    const seat = seatList.find((s) => s.seatNumber === seatNumber);
    if (seat?.status !== "occupied" && seat?.status !== "pending") {
      setSeats((prev) => {
        const newSeats = { ...prev };

        // Remove the seat from other passengers who might have it
        Object.keys(newSeats).forEach((key) => {
          if (newSeats[key] === seatNumber && key !== passengerKey) {
            delete newSeats[key];
          }
        });

        // Toggle seat selection for this passenger
        if (newSeats[passengerKey] === seatNumber) {
          // If clicking the same seat, deselect it
          delete newSeats[passengerKey];
        } else {
          // If clicking a different seat, select it (this automatically replaces the old selection)
          newSeats[passengerKey] = seatNumber;
        }

        return newSeats;
      });
    }
  };

  const getSeatPrice = (seatData, selectedSeatData) =>
    Object.values(selectedSeatData || {}).reduce((total, seatNumber) => {
      const seat = seatData.find((s) => s.seatNumber === seatNumber);
      if (!seat) return total;

      const baseSeatPrice = seat?.priceVND || 0;

      // Debug seat type determination
      console.log(`🪑 Seat ${seatNumber} pricing debug:`, {
        seatNumber,
        seatFromAPI: seat,
        seatTypeFromAPI: seat?.seatType,
        seatTypeType: typeof seat?.seatType,
        basePriceFromAPI: seat?.priceVND,
      });

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
        console.log(`🔄 Fallback seatType for ${seatNumber}: ${seatType}`);
      } else {
        console.log(`✅ Using API seatType for ${seatNumber}: ${seatType}`);
      }

      const seatTypePrice = SEAT_TYPE_PRICING[seatType]?.priceVND || 0;
      console.log(
        `💰 Final pricing for ${seatNumber}: base=${baseSeatPrice} + type=${seatTypePrice} = ${
          baseSeatPrice + seatTypePrice
        }`
      );
      return total + baseSeatPrice + seatTypePrice;
    }, 0);

  return (
    <div className="space-y-6">
      {/* Outbound Flight Seats */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {isRoundTrip ? "Chọn Chỗ Ngồi - Chuyến Đi" : "Chọn Chỗ Ngồi"} -{" "}
              {flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                ? flight.outbound?.aircraftName ||
                  flight.outbound?.aircraft ||
                  "N/A"
                : flight?.flight?.aircraftName ||
                  flight?.flight?.aircraft ||
                  flight?.aircraftName ||
                  flight?.aircraft ||
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
                  <ChevronUp className="w-4 h-4 mr-1" /> Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" /> Mở rộng
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
                  <div className="bg-white p-6 rounded-lg border max-h-[600px] overflow-y-auto">
                    {/* Aircraft Information */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-blue-800">
                            Loại máy bay
                          </div>
                          <div className="text-gray-700">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outbound?.aircraftInfo?.aircraftName ||
                                flight.outbound?.aircraftName ||
                                flight?.aircraftInfo?.aircraftName ||
                                flight?.aircraft ||
                                "N/A"
                              : flight?.flight?.aircraftInfo?.aircraftName ||
                                flight?.flight?.aircraftName ||
                                flight?.aircraftInfo?.aircraftName ||
                                flight?.aircraft ||
                                "N/A"}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-blue-800">
                            Cấu hình ghế
                          </div>
                          <div className="text-gray-700">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outbound?.aircraftInfo?.seatLayout ||
                                flight.outbound?.seatLayout ||
                                flight?.aircraftInfo?.seatLayout ||
                                flight?.seatLayout ||
                                "N/A"
                              : flight?.flight?.aircraftInfo?.seatLayout ||
                                flight?.flight?.seatLayout ||
                                flight?.aircraftInfo?.seatLayout ||
                                flight?.seatLayout ||
                                "N/A"}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-blue-800">
                            Tổng số ghế
                          </div>
                          <div className="text-gray-700">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outbound?.aircraftInfo?.totalSeats ||
                                flight.outbound?.totalSeats ||
                                flight?.aircraftInfo?.totalSeats ||
                                flight?.totalSeats ||
                                0
                              : flight?.flight?.aircraftInfo?.totalSeats ||
                                flight?.flight?.totalSeats ||
                                flight?.aircraftInfo?.totalSeats ||
                                flight?.totalSeats ||
                                0}{" "}
                            ghế
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center mb-4">
                      <Badge variant="secondary">
                        Sơ đồ máy bay (
                        {flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                          ? flight.outbound?.aircraftInfo?.aircraftName ||
                            flight.outbound?.aircraftName ||
                            flight?.aircraftInfo?.aircraftName ||
                            flight?.aircraft ||
                            "N/A"
                          : flight?.flight?.aircraftInfo?.aircraftName ||
                            flight?.flight?.aircraftName ||
                            flight?.aircraftInfo?.aircraftName ||
                            flight?.aircraft ||
                            "N/A"}
                        )
                      </Badge>
                      <p className="text-sm text-gray-500 mt-2">
                        Cuộn xuống để xem thêm hàng ghế
                      </p>
                    </div>
                    <div className="max-w-lg mx-auto">
                      <AircraftLayout
                        seats={seats}
                        selectedSeats={selectedSeats}
                        passengers={passengers}
                        handleSeatSelect={(seatNumber, passengerIndex) =>
                          handleSeatSelect(seatNumber, passengerIndex, false)
                        }
                        aircraftLayout={
                          flight.outbound?.seatLayout ||
                          flight.flight?.seatLayout ||
                          "N/A"
                        }
                        selectedTravelClass={
                          flight.outbound?.selectedClass ||
                          flight.flight?.selectedClass ||
                          flight?.selectedClass
                        }
                        totalSeats={
                          flight.outbound?.aircraftInfo?.totalSeats ||
                          flight.outbound?.totalSeats ||
                          flight?.aircraftInfo?.totalSeats ||
                          flight?.totalSeats ||
                          flight?.flight?.aircraftInfo?.totalSeats ||
                          flight?.flight?.totalSeats ||
                          flight?.aircraftInfo?.totalSeats ||
                          flight?.totalSeats ||
                          150
                        }
                        flight={flight.outbound || flight.flight}
                        flightId={
                          flight.outbound?.id || flight.flight?.id || flight?.id
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
                {flight.return?.aircraftName ||
                  flight.return?.aircraft ||
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
                    <ChevronUp className="w-4 h-4 mr-1" /> Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" /> Mở rộng
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
                    <div className="bg-white p-6 rounded-lg border max-h-[600px] overflow-y-auto">
                      <div className="text-center mb-4">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          Sơ đồ máy bay - Chuyến Về (
                          {flight.return?.aircraftName ||
                            flight.return?.aircraft ||
                            "N/A"}
                          )
                        </Badge>
                        <p className="text-sm text-gray-500 mt-2">
                          Cuộn xuống để xem thêm hàng ghế
                        </p>
                      </div>
                      <div className="max-w-lg mx-auto">
                        <AircraftLayout
                          seats={returnSeats}
                          selectedSeats={selectedReturnSeats}
                          passengers={passengers}
                          handleSeatSelect={(seatNumber, passengerIndex) =>
                            handleSeatSelect(seatNumber, passengerIndex, true)
                          }
                          aircraftLayout={flight.return?.seatLayout || "N/A"}
                          selectedTravelClass={flight.return?.selectedClass}
                          totalSeats={
                            flight.return?.aircraftInfo?.totalSeats ||
                            flight.return?.totalSeats ||
                            150
                          }
                          flight={flight.return}
                          flightId={flight.return?.id}
                        />
                      </div>
                      <SelectedSeatsSummary
                        selectedSeats={selectedReturnSeats}
                        getSeatPrice={() =>
                          getSeatPrice(returnSeats, selectedReturnSeats)
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
        onPackageChange(`passenger${passengerIndex + 1}`, value)
      }
      className="space-y-3"
    >
      {Object.entries(BAGGAGE_PACKAGES).map(([packageKey, packageInfo]) => (
        <div
          key={packageKey}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
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
          </div>
        </div>
      ))}
    </RadioGroup>
  </div>
);

// Baggage Options Card
const BaggageOptionsCard = ({ formData, baggage, setBaggage }) => {
  const handlePackageChange = (passenger, packageKey) => {
    setBaggage((prev) => ({
      ...prev,
      [passenger]: packageKey,
    }));
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Tùy Chọn Hành Lý
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-green-700 font-medium">
            ✅ Bao gồm: 1 túi xách tay (10kg) mỗi hành khách
          </p>
        </div>
        <div className="space-y-4">
          {formData.passengers.map((passenger, index) => (
            <BaggagePackageOption
              key={`passenger${index + 1}`}
              passengerIndex={index}
              passengerType={passenger.type}
              selectedPackage={baggage[`passenger${index + 1}`] || "NONE"}
              onPackageChange={handlePackageChange}
            />
          ))}
        </div>
      </CardContent>
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
}) => {
  const handleServiceChange = (
    serviceId,
    isSelected,
    passengerIndex = null
  ) => {
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

      return newServices;
    });
  };

  const isServiceSelected = (serviceId, passengerIndex = null) => {
    const serviceKey =
      passengerIndex !== null
        ? `${serviceId}_passenger${passengerIndex}`
        : `${serviceId}_booking`;
    return !!selectedServices[serviceKey];
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
        <CardTitle className="flex items-center gap-2">
          🛎️ Dịch Vụ Đi Kèm
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Chọn các dịch vụ bổ sung để nâng cao trải nghiệm bay của bạn
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(servicesByType).map(([type, services]) => {
            const typeInfo = getServiceTypeInfo(type);
            return (
              <div key={type} className="space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span>{typeInfo.icon}</span>
                  {typeInfo.vietnameseName}
                </h4>
                <div className="space-y-3 pl-4">
                  {services.map((service) => (
                    <AncillaryServiceOption
                      key={service.serviceId}
                      service={service}
                      passengers={formData.passengers}
                      onServiceChange={handleServiceChange}
                      isSelected={isServiceSelected}
                      selectedServices={selectedServices}
                      setSelectedServices={setSelectedServices}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {availableServices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Hiện tại không có dịch vụ nào khả dụng</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Component for individual ancillary service option
const AncillaryServiceOption = ({
  service,
  passengers,
  onServiceChange,
  isSelected,
  selectedServices,
  setSelectedServices,
}) => {
  const [expandedPassengers, setExpandedPassengers] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

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
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h5 className="font-medium text-gray-800">{service.serviceName}</h5>
            <Badge variant="outline" className="text-xs">
              {formatCurrencyVND(service.price)}
            </Badge>
          </div>
          {service.description && (
            <p className="text-sm text-gray-600 mb-3">{service.description}</p>
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
                          checked={isSelected(service.serviceId, index)}
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
                        </Label>
                      </div>
                      {isSelected(service.serviceId, index) && (
                        <div className="ml-6">
                          <textarea
                            placeholder="Ghi chú đặc biệt (tùy chọn)..."
                            className="w-full text-xs p-2 border rounded-md resize-none"
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
                  checked={isSelected(service.serviceId)}
                  onCheckedChange={(checked) =>
                    onServiceChange(service.serviceId, checked)
                  }
                />
                <Label
                  htmlFor={`service-${service.serviceId}-booking`}
                  className="text-sm"
                >
                  Áp dụng cho toàn bộ booking
                </Label>
              </div>
              {isSelected(service.serviceId) && (
                <div className="ml-6">
                  <textarea
                    placeholder="Ghi chú đặc biệt (tùy chọn)..."
                    className="w-full text-xs p-2 border rounded-md resize-none"
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
  const handleServiceChange = (service) => {
    setAdditionalServices((prev) => ({
      ...prev,
      [service]: !prev[service],
    }));
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
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center gap-2 text-blue-800">
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
                // For multi-city, use total price divided by passenger count
                const totalPerPassenger =
                  (flight.totalPrice || 0) / formData.passengers.length;
                const discountedPrice =
                  passenger.type === "CHILD"
                    ? totalPerPassenger * 0.75
                    : passenger.type === "INFANT"
                    ? totalPerPassenger * 0.1
                    : totalPerPassenger;

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
                const outboundPrice =
                  (flight.outbound?.selectedClass?.price ||
                    flight.outbound?.selectedClass?.basePrice ||
                    0) / formData.passengers.length;
                const returnPrice =
                  (flight.return?.selectedClass?.price ||
                    flight.return?.selectedClass?.basePrice ||
                    0) / formData.passengers.length;
                const totalPerPassenger = outboundPrice + returnPrice;

                const discountedPrice =
                  passenger.type === "CHILD"
                    ? totalPerPassenger * 0.75
                    : passenger.type === "INFANT"
                    ? totalPerPassenger * 0.1
                    : totalPerPassenger;

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
              const discountedPrice =
                passenger.type === "CHILD"
                  ? basePrice * 0.75
                  : passenger.type === "INFANT"
                  ? basePrice * 0.1
                  : basePrice;
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

          <div className="flex justify-between">
            <span className="text-gray-600">
              {isMultiCity ? "Hành lý (tất cả chặng)" : "Hành lý"}
            </span>
            <span className="font-medium">
              {formatCurrencyVND(getBaggagePrice())}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">🛎️ Dịch vụ đi kèm</span>
            <span className="font-medium">
              {formatCurrencyVND(
                getAncillaryServicesPrice ? getAncillaryServicesPrice() : 0
              )}
            </span>
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
  // Debug flight object structure
  console.log("🛫 Flight object for seat selection:", {
    flight,
    type: flight.type,
    outboundFlightId: flight.outbound?.id,
    flightFlightId: flight.flight?.id,
    flightId: flight.id,
    returnFlightId: flight.return?.id,
    // Fix: Different flight types have different structures
    roundTripData:
      flight.type === "ROUND_TRIP"
        ? {
            outbound: {
              id: flight.outbound?.id,
              flightId: flight.outbound?.flightId,
            },
            return: {
              id: flight.return?.id,
              flightId: flight.return?.flightId,
            },
          }
        : null,
    multiCityData:
      flight.type === "MULTI_CITY"
        ? {
            legs: flight.legs?.map((leg) => ({
              id: leg.id,
              flightId: leg.flightId,
            })),
            segmentCount: flight.segmentCount,
          }
        : null,
    oneWayData:
      flight.type === "ONE_WAY"
        ? {
            flight: {
              id: flight.flight?.id || flight.id,
              flightId: flight.flight?.flightId || flight.flightId,
            },
          }
        : null,
  });

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
  // Multi-city baggage state - per segment per passenger
  const [multiCityBaggage, setMultiCityBaggage] = useState({});

  // Regular baggage state (for round-trip and one-way)
  const [baggage, setBaggage] = useState(
    formData.passengers.reduce(
      (acc, _, index) => ({
        ...acc,
        [`passenger${index + 1}`]: "NONE",
      }),
      {}
    )
  );

  // Load saved extras data from localStorage
  useEffect(() => {
    const savedExtrasData = localStorage.getItem("extrasData");
    if (savedExtrasData) {
      try {
        const parsedData = JSON.parse(savedExtrasData);
        console.log("Loading saved extras data:", parsedData);

        // Restore seat selections
        if (
          parsedData.selectedSeats &&
          Object.keys(parsedData.selectedSeats).length > 0
        ) {
          setSelectedSeats(parsedData.selectedSeats);
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
          setSelectedServices(parsedData.selectedAncillaryServices);
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
          setAvailableServices(response.data || []);
        } else {
          console.error(
            "Failed to fetch ancillary services:",
            response.message
          );
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
              // Load all seats without filtering by travel class
              const transformedSeats = data.map((seat) => ({
                seatId: seat.seatId,
                seatNumber: seat.seatNumber,
                className: seat.className,
                status: seat.status, // Keep original API status
                bookedBy: seat.bookedBy,
                seatType: seat.seatType, // Use correct seatType field from API
                flightId: seat.flightId,
                travelClassId: seat.travelClassId,
                bookedById: seat.bookedById,
                priceVND: 0, // Base price from API (if needed) or 0 - we use SEAT_TYPE_PRICING
              }));

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
    } else if (isRoundTrip && flight.outbound && flight.return) {
      // Round-trip outbound logic
      if (flight.outbound.id) {
        handleFetch({
          apiCall: () => flightApi.getSeatsByFlight(flight.outbound.id),
          setData: (data) => {
            // Load all seats without filtering by travel class
            setSeats(
              data.map((seat) => ({
                seatId: seat.seatId,
                seatNumber: seat.seatNumber,
                className: seat.className,
                status: seat.status, // Keep original API status
                bookedBy: seat.bookedBy,
                seatType: seat.seatType, // Use correct seatType field from API
                flightId: seat.flightId,
                travelClassId: seat.travelClassId,
                bookedById: seat.bookedById,
                priceVND: 0, // Base price from API or 0 - we use SEAT_TYPE_PRICING
              }))
            );
          },
          setLoading,
          errorMessage: "Không thể lấy danh sách ghế chuyến đi",
        });
      }

      // Round-trip return logic
      if (flight.return.id) {
        handleFetch({
          apiCall: () => flightApi.getSeatsByFlight(flight.return.id),
          setData: (data) => {
            // Load all seats without filtering by travel class
            setReturnSeats(
              data.map((seat) => ({
                seatId: seat.seatId,
                seatNumber: seat.seatNumber,
                className: seat.className,
                status: seat.status, // Keep original API status
                bookedBy: seat.bookedBy,
                seatType: seat.seatType, // Use correct seatType field from API
                flightId: seat.flightId,
                travelClassId: seat.travelClassId,
                bookedById: seat.bookedById,
                priceVND: 0, // Base price from API or 0 - we use SEAT_TYPE_PRICING
              }))
            );
          },
          setLoading: setReturnLoading,
          errorMessage: "Không thể lấy danh sách ghế chuyến về",
        });
      }
    } else {
      // For one-way flights
      const flightId = flight.flight?.id || flight.flightId;
      if (flightId) {
        handleFetch({
          apiCall: () => flightApi.getSeatsByFlight(flightId),
          setData: (data) => {
            // Load all seats without filtering by travel class
            setSeats(
              data.map((seat) => ({
                seatId: seat.seatId,
                seatNumber: seat.seatNumber,
                className: seat.className,
                status: seat.status, // Keep original API status
                bookedBy: seat.bookedBy,
                seatType: seat.seatType, // Use correct seatType field from API
                flightId: seat.flightId,
                travelClassId: seat.travelClassId,
                bookedById: seat.bookedById,
                priceVND: 0, // Base price from API or 0 - we use SEAT_TYPE_PRICING
              }))
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
    flight.outbound?.selectedClass?.id,
    flight.return?.selectedClass?.id,
  ]);

  // Prepare seat legend - include both status and types
  const seatStatusLegend = Object.entries(SEAT_PRICING).map(
    ([status, config]) => ({
      status,
      color: config.color,
      label: config.label,
      price:
        config.priceVND > 0 ? formatCurrencyVND(config.priceVND) : "Miễn phí",
      type: "status",
    })
  );

  const seatTypeLegend = Object.entries(SEAT_TYPE_PRICING).map(
    ([seatType, config]) => ({
      status: seatType,
      color: "bg-gray-100 border-gray-300",
      label: config.label,
      price: formatCurrencyVND(config.priceVND),
      shortLabel: config.shortLabel,
      type: "seatType",
    })
  );

  const seatLegend = [...seatStatusLegend, ...seatTypeLegend];

  // Multi-city price calculations
  const getMultiCitySeatPrice = () => {
    if (!isMultiCity) return 0;

    let total = 0;
    Object.entries(multiCitySeats).forEach(([segmentKey, segmentSeats]) => {
      const segmentSeatData = multiCitySeatData[segmentKey] || [];
      Object.values(segmentSeats).forEach((seatNumber) => {
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
          return total; // Skip this seat if no seatType from API
        }

        console.log(
          `✅ Using API seatType for multi-city seat ${seatNumber}: ${seatType}`
        );
        const seatTypePrice = SEAT_TYPE_PRICING[seatType]?.priceVND || 0;
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

    let total = 0;
    Object.values(multiCityBaggage).forEach((segmentBaggage) => {
      Object.values(segmentBaggage).forEach((packageKey) => {
        const packageInfo = BAGGAGE_PACKAGES[packageKey];
        total += packageInfo ? packageInfo.price : 0;
      });
    });
    return total;
  };

  // Regular price calculations (round-trip and one-way)
  const getSeatPrice = () => {
    console.log("🧮 getSeatPrice Debug:", {
      selectedSeats,
      seatsCount: seats.length,
      sampleSeats: seats.slice(0, 3).map((s) => ({
        seatNumber: s.seatNumber,
        priceVND: s.priceVND,
        seatType: s.seatType,
        status: s.status,
      })),
    });

    return Object.values(selectedSeats).reduce((total, seatNumber) => {
      const seat = seats.find((s) => s.seatNumber === seatNumber);

      if (!seat) {
        console.warn(`⚠️ Seat ${seatNumber} not found in seats array`);
        return total;
      }

      const baseSeatPrice = seat?.priceVND || 0;

      // ALWAYS use seatType from API - no fallback logic
      const seatType = seat?.seatType;

      if (!seatType) {
        console.error(
          `❌ No seatType from API for seat ${seatNumber}. API data must provide seatType.`
        );
        console.log(`🔍 Full seat object:`, seat);
        return total; // Skip this seat if no seatType from API
      }

      console.log(`✅ Using API seatType for ${seatNumber}: ${seatType}`);
      const seatTypePrice = SEAT_TYPE_PRICING[seatType]?.priceVND || 0;

      console.log(`💺 Seat ${seatNumber} pricing:`, {
        found: !!seat,
        baseSeatPrice,
        seatType,
        seatTypeFromAPI: seat?.seatType,
        seatTypePrice,
        total: baseSeatPrice + seatTypePrice,
        seatData: seat,
      });

      // Additional detailed seat debug
      console.log(
        `🔍 Raw seat object for ${seatNumber}:`,
        JSON.stringify(seat, null, 2)
      );

      return total + baseSeatPrice + seatTypePrice;
    }, 0);
  };

  const getReturnSeatPrice = () =>
    Object.values(selectedReturnSeats).reduce((total, seatNumber) => {
      const seat = returnSeats.find((s) => s.seatNumber === seatNumber);
      if (!seat) return total;

      const baseSeatPrice = seat?.priceVND || 0;

      // Debug return seat type determination
      console.log(`🪑 Return seat ${seatNumber} pricing debug:`, {
        seatNumber,
        seatFromAPI: seat,
        seatTypeFromAPI: seat?.seatType,
        seatTypeType: typeof seat?.seatType,
        basePriceFromAPI: seat?.priceVND,
      });

      // ALWAYS use seatType from API - no fallback logic
      const seatType = seat?.seatType;

      if (!seatType) {
        console.error(
          `❌ No seatType from API for return seat ${seatNumber}. API data must provide seatType.`
        );
        console.log(`🔍 Full return seat object:`, seat);
        return total; // Skip this seat if no seatType from API
      }

      console.log(
        `✅ Using API seatType for return seat ${seatNumber}: ${seatType}`
      );
      const seatTypePrice = SEAT_TYPE_PRICING[seatType]?.priceVND || 0;
      console.log(
        `💰 Final pricing for return seat ${seatNumber}: base=${baseSeatPrice} + type=${seatTypePrice} = ${
          baseSeatPrice + seatTypePrice
        }`
      );
      return total + baseSeatPrice + seatTypePrice;
    }, 0);

  const getBaggagePrice = () => {
    if (isMultiCity) {
      return getMultiCityBaggagePrice();
    }
    return Object.values(baggage).reduce((total, packageKey) => {
      const packageInfo = BAGGAGE_PACKAGES[packageKey];
      return total + (packageInfo ? packageInfo.price : 0);
    }, 0);
  };

  const getServicesPrice = () =>
    Object.entries(additionalServices).reduce(
      (total, [service, selected]) =>
        total + (selected ? SERVICE_PRICES[service] : 0),
      0
    );

  // Calculate ancillary services price
  const getAncillaryServicesPrice = () => {
    return Object.values(selectedServices).reduce((total, serviceSelection) => {
      const service = availableServices.find(
        (s) => s.serviceId === serviceSelection.serviceId
      );
      if (service) {
        return total + service.price * serviceSelection.quantity;
      }
      return total;
    }, 0);
  };

  const calculateTotal = () => {
    let passengersTotal = 0;

    if (isMultiCity) {
      // Multi-city: use total price from flight data
      passengersTotal = flight.totalPrice || 0;
    } else if (isRoundTrip) {
      // Round trip: use total price from flight data
      passengersTotal = flight.totalPrice || 0;
    } else {
      // Single flight: calculate based on fare
      const basePrice = flight.totalPrice || 0;
      passengersTotal = formData.passengers.reduce((total, p) => {
        const discountedPrice =
          p.type === "CHILD"
            ? basePrice * 0.75
            : p.type === "INFANT"
            ? basePrice * 0.1
            : basePrice;
        return total + discountedPrice;
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

  // Update extras data and save to localStorage
  useEffect(() => {
    const extrasData = {
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

    // Save to localStorage for persistence
    localStorage.setItem("extrasData", JSON.stringify(extrasData));

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
      <div className="max-w-7xl mx-auto py-8">
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
              />
            )}

            <AncillaryServicesCard
              selectedServices={selectedServices}
              setSelectedServices={setSelectedServices}
              availableServices={availableServices}
              loadingServices={loadingServices}
              formData={formData}
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

export default Extras;
