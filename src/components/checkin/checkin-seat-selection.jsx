import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plane,
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";

const CheckInSeatSelection = ({
  booking,
  onSelectSeat,
  onConfirm,
  onBack,
  selectedSeat,
}) => {
  const [hoveredSeat, setHoveredSeat] = useState(null);

  // Mock seat data - in real app, this would come from API
  const seatMap = {
    economy: {
      rows: 25,
      seatsPerRow: 6,
      layout: ["A", "B", "C", "D", "E", "F"],
      price: 0,
    },
    premium: {
      rows: 8,
      seatsPerRow: 4,
      layout: ["A", "B", "C", "D"],
      price: 50000,
    },
    business: {
      rows: 4,
      seatsPerRow: 4,
      layout: ["A", "B", "C", "D"],
      price: 150000,
    },
  };

  // Mock occupied seats - in real app, this would come from API
  const occupiedSeats = ["12A", "12B", "15C", "15D", "18F", "22A", "22B"];

  const getSeatClass = (seatNumber) => {
    if (occupiedSeats.includes(seatNumber)) return "occupied";
    if (selectedSeat === seatNumber) return "selected";
    if (hoveredSeat === seatNumber) return "hovered";
    return "available";
  };

  const getSeatPrice = (seatNumber) => {
    const row = parseInt(seatNumber.slice(0, -1));
    if (row <= 4) return seatMap.business.price;
    if (row <= 12) return seatMap.premium.price;
    return seatMap.economy.price;
  };

  const getSeatClassName = (seatNumber) => {
    const row = parseInt(seatNumber.slice(0, -1));
    if (row <= 4) return "business";
    if (row <= 12) return "premium";
    return "economy";
  };

  const renderSeat = (seatNumber) => {
    const seatClass = getSeatClass(seatNumber);
    const isOccupied = seatClass === "occupied";
    const isSelected = seatClass === "selected";

    return (
      <button
        key={seatNumber}
        className={`
          w-8 h-8 rounded border-2 text-xs font-medium transition-all duration-200
          ${
            isOccupied
              ? "bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed"
              : isSelected
              ? "bg-blue-600 border-blue-700 text-white"
              : "bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50"
          }
        `}
        onClick={() => !isOccupied && onSelectSeat(seatNumber)}
        onMouseEnter={() => !isOccupied && setHoveredSeat(seatNumber)}
        onMouseLeave={() => setHoveredSeat(null)}
        disabled={isOccupied}
      >
        {seatNumber.slice(-1)}
      </button>
    );
  };

  const renderSeatRow = (rowNumber, layout) => {
    return (
      <div key={rowNumber} className="flex items-center gap-2 mb-2">
        <span className="w-6 text-xs font-medium text-gray-600">
          {rowNumber}
        </span>
        <div className="flex gap-1">
          {layout.map((seat) => renderSeat(`${rowNumber}${seat}`))}
        </div>
      </div>
    );
  };

  const selectedSeatPrice = selectedSeat ? getSeatPrice(selectedSeat) : 0;
  const selectedSeatClass = selectedSeat ? getSeatClassName(selectedSeat) : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-500" />
            Chọn chỗ ngồi - {booking.flight}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Hành khách</p>
              <p className="font-medium">{booking.passenger}</p>
            </div>
            <div>
              <p className="text-gray-600">Chuyến bay</p>
              <p className="font-medium">
                {booking.flight} - {booking.from} → {booking.to}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seat Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            Sơ đồ chỗ ngồi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
              <span className="text-sm">Còn trống</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 border-2 border-blue-700 rounded"></div>
              <span className="text-sm">Đã chọn</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 border-2 border-gray-400 rounded"></div>
              <span className="text-sm">Đã đặt</span>
            </div>
          </div>

          {/* Seat Classes */}
          <div className="space-y-6">
            {/* Business Class */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200"
                >
                  Business Class
                </Badge>
                <span className="text-sm text-gray-600">
                  +{seatMap.business.price.toLocaleString()} VND
                </span>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex flex-col items-center">
                  {Array.from(
                    { length: seatMap.business.rows },
                    (_, i) => i + 1
                  )
                    .filter((row) => row <= 4)
                    .map((row) => renderSeatRow(row, seatMap.business.layout))}
                </div>
              </div>
            </div>

            {/* Premium Economy */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  Premium Economy
                </Badge>
                <span className="text-sm text-gray-600">
                  +{seatMap.premium.price.toLocaleString()} VND
                </span>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex flex-col items-center">
                  {Array.from({ length: seatMap.premium.rows }, (_, i) => i + 5)
                    .filter((row) => row <= 12)
                    .map((row) => renderSeatRow(row, seatMap.premium.layout))}
                </div>
              </div>
            </div>

            {/* Economy Class */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  Economy Class
                </Badge>
                <span className="text-sm text-gray-600">Miễn phí</span>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex flex-col items-center">
                  {Array.from(
                    { length: seatMap.economy.rows },
                    (_, i) => i + 13
                  )
                    .filter((row) => row <= 25)
                    .map((row) => renderSeatRow(row, seatMap.economy.layout))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Seat Info */}
      {selectedSeat && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-800">
                    Chỗ ngồi đã chọn: {selectedSeat}
                  </p>
                  <p className="text-sm text-blue-700">
                    Hạng:{" "}
                    {selectedSeatClass === "business"
                      ? "Business Class"
                      : selectedSeatClass === "premium"
                      ? "Premium Economy"
                      : "Economy Class"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-800">
                  {selectedSeatPrice > 0
                    ? `+${selectedSeatPrice.toLocaleString()} VND`
                    : "Miễn phí"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Lưu ý:</strong> Việc chọn chỗ ngồi có thể áp dụng phụ phí. Chỗ
          ngồi đã chọn sẽ được xác nhận sau khi hoàn tất check-in.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Quay lại
        </Button>
        <Button onClick={onConfirm} disabled={!selectedSeat} className="flex-1">
          Xác nhận check-in
        </Button>
      </div>
    </div>
  );
};

export default CheckInSeatSelection;
