"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plane,
  Armchair,
  Crown,
  Briefcase,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getSeatStatusColor,
  SEAT_TYPE_LABELS,
  TRAVEL_CLASS_MAPPING,
  getTravelClassName,
  getTravelClassIdFromSeat,
} from "./extras-section";
import { flightApi } from "@/apis/flight-api";
import { formatCurrencyVND } from "@/utils/currency-utils";

const SeatMap = ({
  seats = [],
  selectedSeats = [],
  onSeatSelect,
  disabled = false,
  showLegend = true,
  userTravelClassId = null, // Chỉ cho phép chọn ghế trong travelClassId này
  flightInfo = null,
}) => {
  const [seatLayout, setSeatLayout] = useState([]);
  const [seatsByPosition, setSeatsByPosition] = useState({});
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [completeSeats, setCompleteSeats] = useState(seats);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);

  // Load complete seat map from API when flightInfo.id is available
  useEffect(() => {
    const loadCompleteSeats = async () => {
      // Try different ways to get flightId
      const flightId =
        flightInfo?.id || flightInfo?.flightId || flightInfo?.flight?.id;
      console.log("🔍 SeatMap loading check:", {
        flightInfo,
        extractedFlightId: flightId,
      });

      if (!flightId) {
        console.log("❌ No flightId available, using provided seats");
        setCompleteSeats(seats);
        return;
      }

      setIsLoadingSeats(true);
      try {
        // Define travel class IDs
        const travelClassIds = [
          { id: 1, name: "Phổ thông", type: "ECONOMY" },
          { id: 2, name: "Thương gia", type: "BUSINESS" },
          { id: 3, name: "Hạng nhất", type: "FIRST" },
        ];

        console.log(`🔄 Loading complete seats for flight ${flightId}...`);

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
                `✅ Loaded ${seatsData.length} ${travelClass.name} seats`
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
            console.error(`❌ Error loading ${travelClass.name} seats:`, error);
            return [];
          }
        });

        const seatResults = await Promise.all(seatPromises);
        const allSeats = seatResults.flat();

        console.log(`🎯 Loaded ${allSeats.length} total seats`);
        setCompleteSeats(allSeats);
      } catch (error) {
        console.error("Error loading complete seats:", error);
        setCompleteSeats(seats); // Fallback to provided seats
      } finally {
        setIsLoadingSeats(false);
      }
    };

    loadCompleteSeats();
  }, [flightInfo?.id, flightInfo?.flightId, flightInfo?.flight?.id, seats]);

  // Generate seat layout based on complete seat data
  useEffect(() => {
    const generateSeatLayout = () => {
      const layout = [];

      // Group seats by physical position (row + column)
      const seatsByPosition = {};
      completeSeats.forEach((seat) => {
        const rowNum = seat.seatNumber.match(/\d+/)?.[0] || "1";
        const column = seat.seatNumber.match(/[A-Z]/)?.[0] || "A";
        const positionKey = `${rowNum}-${column}`;

        if (!seatsByPosition[positionKey]) {
          seatsByPosition[positionKey] = [];
        }
        seatsByPosition[positionKey].push(seat);
      });

      console.log("🔍 Seats by position analysis:");
      Object.entries(seatsByPosition).forEach(([position, positionSeats]) => {
        console.log(`Position ${position}: ${positionSeats.length} seats`);
        const seatNumbers = positionSeats.map((s) => s.seatNumber);
        const travelClasses = positionSeats.map((s) => s.travelClassId);
        console.log(`  Seat numbers: ${seatNumbers.join(", ")}`);
        console.log(`  Travel classes: ${travelClasses.join(", ")}`);
      });

      // Get all unique row numbers
      const allRows = [
        ...new Set(
          seats.map((seat) => seat.seatNumber.match(/\d+/)?.[0] || "1")
        ),
      ];
      const sortedRowNumbers = allRows.sort(
        (a, b) => parseInt(a) - parseInt(b)
      );

      // Create layout for each row
      sortedRowNumbers.forEach((rowNum) => {
        const rowSeats = [];

        // For each column A-F, collect all seats at that position
        ["A", "B", "C", "D", "E", "F"].forEach((column) => {
          const positionKey = `${rowNum}-${column}`;
          const positionSeats = seatsByPosition[positionKey] || [];

          // Add all seats at this position (could be multiple if different travel classes)
          positionSeats.forEach((seat) => {
            const fallbackTravelClassId = getTravelClassIdFromSeat(seat);
            const fallbackClassName = getTravelClassName(fallbackTravelClassId);

            rowSeats.push({
              seatId: seat.seatId,
              seatNumber: seat.seatNumber,
              seatType: seat.seatType || "N/A",
              className: seat.className || fallbackClassName || "N/A",
              status: seat.status || "N/A",
              price: seat.priceVND || seat.price || 0,
              travelClassId: seat.travelClassId || fallbackTravelClassId, // Use fallback if API doesn't provide
              section: parseInt(rowNum) <= 15 ? 1 : 2,
              row: parseInt(rowNum),
              column: column,
              bookedBy: seat.bookedBy,
              bookedByUserId: seat.bookedByUserId,
              bookedByPassengerId: seat.bookedByPassengerId,
            });
          });
        });

        layout.push({
          section: parseInt(rowNum) <= 15 ? 1 : 2,
          row: parseInt(rowNum),
          seats: rowSeats,
        });
      });

      console.log(`📊 Total layout rows: ${layout.length}`);
      console.log(
        `🎯 Total seats in layout: ${layout.reduce(
          (sum, row) => sum + row.seats.length,
          0
        )}`
      );

      setSeatLayout(layout);
      setSeatsByPosition(seatsByPosition);
    };

    generateSeatLayout();
  }, [completeSeats]);

  // Determine seat type based on row number
  const getSeatType = (row) => {
    if (row <= 2 || (row >= 16 && row <= 17)) return "FIRST_CLASS";
    if (row <= 5 || (row >= 18 && row <= 20)) return "BUSINESS";
    return "ECONOMY";
  };

  // Get seat type short label from imported SEAT_TYPE_LABELS
  const getSeatTypeShortLabel = (seatType) => {
    return SEAT_TYPE_LABELS[seatType]?.shortLabel || "";
  };

  const handleSeatClick = (seat) => {
    if (disabled || seat.status !== "AVAILABLE") return;

    if (onSeatSelect) {
      onSeatSelect(seat);
    }
  };

  const isSeatSelected = (seatNumber) => {
    return selectedSeats.includes(seatNumber);
  };

  const renderSeat = (seat) => {
    // Use travelClassId directly from API data - no fallback logic needed
    // The API already provides correct travelClassId for each seat
    console.log(`🪑 Seat ${seat.seatNumber} - API data:`, {
      travelClassId: seat.travelClassId,
      className: seat.className,
      seatType: seat.seatType,
      status: seat.status,
    });

    const isSelected = isSeatSelected(seat.seatNumber);

    // Check if seat is in user's travel class - only disable click, don't hide
    const isInUserTravelClass =
      userTravelClassId && seat.travelClassId === userTravelClassId;
    const isDisabledByClass =
      userTravelClassId && !isInUserTravelClass && seat.status === "AVAILABLE";
    const isDisabled =
      disabled || seat.status !== "AVAILABLE" || isDisabledByClass;

    // Get color based on travel class and status - use API travelClassId directly
    const seatColor = getSeatStatusColor(seat, isSelected, isDisabledByClass);
    const seatTypeShortLabel = getSeatTypeShortLabel(seat.seatType);

    // Get seat price for tooltip
    const getSeatPrice = () => {
      if (seat.price) return formatCurrencyVND(seat.price);
      if (seat.seatType && SEAT_TYPE_LABELS[seat.seatType]) {
        // Use the same pricing logic as extras-section
        const FIXED_SEAT_PRICING = {
          STANDARD: { price: "Miễn phí", priceValue: 0 },
          EXTRA_LEGROOM: { price: formatCurrencyVND(50000), priceValue: 50000 },
          EXIT_ROW: { price: formatCurrencyVND(100000), priceValue: 100000 },
          FRONT_ROW: { price: formatCurrencyVND(75000), priceValue: 75000 },
          ACCESSIBLE: { price: formatCurrencyVND(25000), priceValue: 25000 },
        };
        return FIXED_SEAT_PRICING[seat.seatType]?.price || formatCurrencyVND(0);
      }
      return formatCurrencyVND(0);
    };

    // Debug logging - only for debugging
    if (seat.seatNumber === "4D") {
      console.log(`🪑 Seat ${seat.seatNumber}:`, {
        travelClassId: seat.travelClassId,
        userTravelClassId,
        isInUserTravelClass,
        isDisabledByClass,
        status: seat.status,
        isDisabled,
        seatColor,
        className: seat.className,
      });
    }

    return (
      <TooltipProvider key={seat.seatId}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={`relative w-14 h-14 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 shadow-xl transform ${
                isSelected
                  ? "bg-gradient-to-b from-blue-400 to-blue-600 text-white scale-110 shadow-2xl border-blue-300 ring-4 ring-blue-200 transform rotate-1 -translate-y-1"
                  : isDisabledByClass
                  ? `${getSeatStatusColor(
                      seat,
                      false,
                      true
                    )} opacity-40 cursor-not-allowed border-gray-300 shadow-sm`
                  : seat.status === "BOOKED" || seat.status === "OCCUPIED"
                  ? `${getSeatStatusColor(
                      seat,
                      false,
                      false
                    )} cursor-not-allowed shadow-inner transform translate-y-0.5`
                  : seat.status === "PENDING_PAYMENT"
                  ? `${getSeatStatusColor(
                      seat,
                      false,
                      false
                    )} cursor-not-allowed shadow-inner transform translate-y-0.5`
                  : `${getSeatStatusColor(
                      seat,
                      false,
                      false
                    )} hover:scale-110 hover:shadow-2xl hover:brightness-110 hover:-translate-y-2 transition-all duration-300 cursor-pointer hover:rotate-1`
              }`}
              onClick={() => handleSeatClick(seat)}
              disabled={isDisabled}
              onMouseEnter={() => setHoveredSeat(seat.seatNumber)}
              onMouseLeave={() => setHoveredSeat(null)}
            >
              {/* Enhanced 3D Aircraft Seat Design */}
              <div
                className={`absolute inset-0 rounded-xl ${
                  isSelected
                    ? "bg-gradient-to-br from-white/40 via-white/20 to-blue-500/30 shadow-inner"
                    : seat.status === "BOOKED" ||
                      seat.status === "OCCUPIED" ||
                      seat.status === "PENDING_PAYMENT"
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
              {(seat.status === "BOOKED" ||
                seat.status === "OCCUPIED" ||
                seat.status === "PENDING_PAYMENT") && (
                <div
                  className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-xl border-2 border-white transform rotate-12 ${
                    seat.status === "PENDING_PAYMENT"
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
                    {getTravelClassName(seat.travelClassId)}
                  </span>
                </p>

                {seat.seatType && SEAT_TYPE_LABELS[seat.seatType] && (
                  <p className="text-sm font-medium">
                    <span className="text-gray-600">Loại ghế:</span>{" "}
                    <span className="text-purple-600 font-semibold">
                      {SEAT_TYPE_LABELS[seat.seatType]?.label || seat.seatType}
                      <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                        {SEAT_TYPE_LABELS[seat.seatType].shortLabel}
                      </span>
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

  const renderSection = (sectionNumber) => {
    const sectionTitle = sectionNumber === 1 ? "Front Section" : "Rear Section";

    // Get all rows for this section
    const sectionRows = Object.keys(seatsByPosition)
      .map((key) => key.split("-")[0])
      .filter((row, index, arr) => arr.indexOf(row) === index) // unique rows
      .filter((row) => {
        const rowNum = parseInt(row);
        return sectionNumber === 1 ? rowNum <= 15 : rowNum > 15;
      })
      .sort((a, b) => parseInt(a) - parseInt(b));

    return (
      <div key={sectionNumber} className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {sectionTitle}
          </h3>
          <p className="text-sm text-gray-600">
            Rows {sectionNumber === 1 ? "1-15" : "16-30"}
          </p>
        </div>

        {/* Column labels */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-10"></div>
          <div className="flex space-x-2">
            <div className="w-14 text-center text-sm font-bold text-gray-600">
              A
            </div>
            <div className="w-14 text-center text-sm font-bold text-gray-600">
              B
            </div>
            <div className="w-14 text-center text-sm font-bold text-gray-600">
              C
            </div>
            <div className="w-16"></div> {/* Aisle space */}
            <div className="w-14 text-center text-sm font-bold text-gray-600">
              D
            </div>
            <div className="w-14 text-center text-sm font-bold text-gray-600">
              E
            </div>
            <div className="w-14 text-center text-sm font-bold text-gray-600">
              F
            </div>
          </div>
          <div className="w-10"></div>
        </div>

        <div className="space-y-6">
          {sectionRows.map((rowNum) => {
            const rowNumber = parseInt(rowNum);

            // Define emergency exit rows (doors on both sides)
            const emergencyExitRows = [5, 6, 10, 11, 15, 16, 20, 21, 25, 26];
            const hasEmergencyExit = emergencyExitRows.includes(rowNumber);

            return (
              <div
                key={rowNumber}
                className="flex items-center justify-center space-x-3"
              >
                {/* Left emergency exit door */}
                {hasEmergencyExit && (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-16 bg-gradient-to-b from-red-600 to-red-700 border-2 border-red-800 rounded-lg shadow-lg flex items-center justify-center">
                      <div className="text-white text-xs font-bold transform -rotate-90 whitespace-nowrap">
                        🚪 EXIT
                      </div>
                    </div>
                  </div>
                )}

                {/* Seats arranged in 6 columns A-F */}
                <div className="flex space-x-2">
                  {/* Columns A, B, C (Left side) */}
                  {["A", "B", "C"].map((column) => {
                    const positionKey = `${rowNum}-${column}`;
                    const positionSeats = seatsByPosition[positionKey] || [];

                    return (
                      <div
                        key={`col-${column}`}
                        className="flex flex-col gap-1"
                      >
                        {positionSeats.length > 0 ? (
                          positionSeats.map((seat) => renderSeat(seat))
                        ) : (
                          // Empty seat placeholder
                          <div className="w-14 h-14 rounded-xl border-2 border-gray-200 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                            {rowNum}
                            {column}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Simple Aisle - Just a clean walkway */}
                  <div className="w-8 h-16 bg-gradient-to-b from-gray-100 to-gray-200 border-l-2 border-r-2 border-gray-300 shadow-inner rounded-sm mx-4"></div>

                  {/* Columns D, E, F (Right side) */}
                  {["D", "E", "F"].map((column) => {
                    const positionKey = `${rowNum}-${column}`;
                    const positionSeats = seatsByPosition[positionKey] || [];

                    return (
                      <div
                        key={`col-${column}`}
                        className="flex flex-col gap-1"
                      >
                        {positionSeats.length > 0 ? (
                          positionSeats.map((seat) => renderSeat(seat))
                        ) : (
                          // Empty seat placeholder
                          <div className="w-14 h-14 rounded-xl border-2 border-gray-200 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                            {rowNum}
                            {column}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right emergency exit door */}
                {hasEmergencyExit && (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-16 bg-gradient-to-b from-red-600 to-red-700 border-2 border-red-800 rounded-lg shadow-lg flex items-center justify-center">
                      <div className="text-white text-xs font-bold transform rotate-90 whitespace-nowrap">
                        EXIT 🚪
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Legend */}

      {/* Aircraft Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Plane className="w-6 h-6 text-blue-600" />
            Aircraft Seat Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSeats ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading seat map...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Front Section */}
              {renderSection(1)}

              {/* Aisle */}
              <div className="flex justify-center">
                <div className="w-full max-w-md h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm text-gray-600 font-medium">
                    AISLE
                  </span>
                </div>
              </div>

              {/* Rear Section */}
              {renderSection(2)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeatMap;
