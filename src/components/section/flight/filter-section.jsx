"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, RotateCcw } from "lucide-react";

export function FlightFilters({ filters, onFiltersChange, onReset }) {
  const airlines = [
    "VietJet Air",
    "Vietnam Airlines",
    "Jetstar Pacific",
    "AirAsia",
    "Thai AirAsia",
    "Scoot",
    "Emirates",
    "Singapore Airlines",
    "Qatar Airways",
    "Bamboo Airways",
  ];

  const departureTimeSlots = [
    { value: "early-morning", label: "Sáng sớm (00:00 - 06:00)" },
    { value: "morning", label: "Buổi sáng (06:00 - 12:00)" },
    { value: "afternoon", label: "Buổi chiều (12:00 - 18:00)" },
    { value: "evening", label: "Buổi tối (18:00 - 24:00)" },
  ];

  const stopsOptions = [
    { value: "non-stop", label: "Không quá cảnh" },
    { value: "1-stop", label: "1 điểm dừng" },
    { value: "2-stops", label: "2+ điểm dừng" },
  ];

  const durationOptions = [
    { value: "short", label: "Ngắn (0-3 hours)" },
    { value: "medium", label: "Vừa (3-6 hours)" },
    { value: "long", label: "Dài (6+ hours)" },
  ];

  const aircraftOptions = [
    { value: "boeing", label: "Boeing" },
    { value: "airbus", label: "Airbus" },
    { value: "embraer", label: "Embraer" },
    { value: "other", label: "Other" },
  ];

  const sortOptions = [
    { value: "price-asc", label: "Gía thấp" },
    { value: "price-desc", label: "Gía cao" },
    { value: "departure-asc", label: "Khởi hành sớm nhất" },
    { value: "departure-desc", label: "Khởi hành muộn nhất" },
    { value: "duration-asc", label: "Thời gian bay ngắn nhất" },
    { value: "duration-desc", label: "Thời gian bay dài nhất" },
  ];

  const handleAirlineChange = (airline, checked) => {
    const newAirlines = checked
      ? [...filters.airlines, airline]
      : filters.airlines.filter((a) => a !== airline);
    onFiltersChange({ ...filters, airlines: newAirlines });
  };

  const handleDepartureTimeChange = (timeSlot, checked) => {
    const newDepartureTimes = checked
      ? [...filters.departureTime, timeSlot]
      : filters.departureTime.filter((t) => t !== timeSlot);
    onFiltersChange({ ...filters, departureTime: newDepartureTimes });
  };

  const handleStopsChange = (stop, checked) => {
    const newStops = checked
      ? [...(filters.stops || []), stop]
      : (filters.stops || []).filter((s) => s !== stop);
    onFiltersChange({ ...filters, stops: newStops });
  };

  const handleDurationChange = (duration, checked) => {
    const newDurations = checked
      ? [...(filters.duration || []), duration]
      : (filters.duration || []).filter((d) => d !== duration);
    onFiltersChange({ ...filters, duration: newDurations });
  };

  const handleAircraftChange = (aircraft, checked) => {
    const newAircraft = checked
      ? [...(filters.aircraft || []), aircraft]
      : (filters.aircraft || []).filter((a) => a !== aircraft);
    onFiltersChange({ ...filters, aircraft: newAircraft });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount); // Display as-is since prices are already in VND
  };

  return (
    <Card className="p-3 sm:p-4 h-fit">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
          <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
          Lọc chuyến bay
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-xs sm:text-sm"
        >
          <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          Đặt lại
        </Button>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Sort By */}
        <div>
          <Label className="text-xs sm:text-sm font-medium mb-2 block">
            Sắp xếp theo
          </Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, sortBy: value })
            }
          >
            <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-xs sm:text-sm"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block">
            Khoảng giá
          </Label>

          {/* Current Range Display */}
          <div className="bg-blue-50 rounded-lg p-3 mb-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(filters.priceRange[0])} -{" "}
                {formatCurrency(filters.priceRange[1])}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Kéo thanh trượt để điều chỉnh khoảng giá
              </div>
            </div>
          </div>

          {/* Price Slider */}
          <div className="px-2">
            <Slider
              value={filters.priceRange}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, priceRange: value })
              }
              max={10000000} // 10 triệu VND
              min={100000} // 100 nghìn VND
              step={50000} // bước 50 nghìn VND
              className="w-full"
            />
          </div>

          {/* Min/Max Labels */}
          <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
            <span>{formatCurrency(100000)}</span>
            <span>{formatCurrency(10000000)}</span>
          </div>

          {/* Quick Price Ranges */}
          <div className="mt-3 space-y-2">
            <Label className="text-xs font-medium text-gray-600">
              Chọn nhanh:
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() =>
                  onFiltersChange({ ...filters, priceRange: [100000, 1000000] })
                }
              >
                Dưới 1 triệu
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    priceRange: [1000000, 3000000],
                  })
                }
              >
                1-3 triệu
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    priceRange: [3000000, 5000000],
                  })
                }
              >
                3-5 triệu
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    priceRange: [5000000, 10000000],
                  })
                }
              >
                Trên 5 triệu
              </Button>
            </div>
          </div>

          {/* Price Input Fields */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-600">Từ</Label>
              <input
                type="number"
                value={filters.priceRange[0]}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 100000 && value <= filters.priceRange[1]) {
                    onFiltersChange({
                      ...filters,
                      priceRange: [value, filters.priceRange[1]],
                    });
                  }
                }}
                className="w-full px-2 py-1 text-xs border rounded"
                min="100000"
                max={filters.priceRange[1]}
                step="50000"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Đến</Label>
              <input
                type="number"
                value={filters.priceRange[1]}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= filters.priceRange[0] && value <= 10000000) {
                    onFiltersChange({
                      ...filters,
                      priceRange: [filters.priceRange[0], value],
                    });
                  }
                }}
                className="w-full px-2 py-1 text-xs border rounded"
                min={filters.priceRange[0]}
                max="10000000"
                step="50000"
              />
            </div>
          </div>
        </div>

        {/* Airlines */}
        <div>
          <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block">
            Hãng hàng không
          </Label>
          <div className="space-y-1 sm:space-y-2 max-h-32 sm:max-h-48 overflow-y-auto">
            {airlines.map((airline) => (
              <div key={airline} className="flex items-center space-x-2">
                <Checkbox
                  id={airline}
                  checked={filters.airlines.includes(airline)}
                  onCheckedChange={(checked) =>
                    handleAirlineChange(airline, checked)
                  }
                  className="h-3 w-3 sm:h-4 sm:w-4"
                />
                <Label
                  htmlFor={airline}
                  className="text-xs sm:text-sm font-normal"
                >
                  {airline}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Stops */}
        <div>
          <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block">
            Số điểm dừng
          </Label>
          <div className="space-y-1 sm:space-y-2">
            {stopsOptions.map((stop) => (
              <div key={stop.value} className="flex items-center space-x-2">
                <Checkbox
                  id={stop.value}
                  checked={(filters.stops || []).includes(stop.value)}
                  onCheckedChange={(checked) =>
                    handleStopsChange(stop.value, checked)
                  }
                  className="h-3 w-3 sm:h-4 sm:w-4"
                />
                <Label
                  htmlFor={stop.value}
                  className="text-xs sm:text-sm font-normal"
                >
                  {stop.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Departure Time */}
        <div>
          <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block">
            Thời gian khởi hành
          </Label>
          <div className="space-y-1 sm:space-y-2">
            {departureTimeSlots.map((slot) => (
              <div key={slot.value} className="flex items-center space-x-2">
                <Checkbox
                  id={slot.value}
                  checked={filters.departureTime.includes(slot.value)}
                  onCheckedChange={(checked) =>
                    handleDepartureTimeChange(slot.value, checked)
                  }
                  className="h-3 w-3 sm:h-4 sm:w-4"
                />
                <Label
                  htmlFor={slot.value}
                  className="text-xs sm:text-sm font-normal leading-tight"
                >
                  {slot.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Flight Duration */}
        <div>
          <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block">
            Thời gian bay
          </Label>
          <div className="space-y-1 sm:space-y-2">
            {durationOptions.map((duration) => (
              <div key={duration.value} className="flex items-center space-x-2">
                <Checkbox
                  id={duration.value}
                  checked={(filters.duration || []).includes(duration.value)}
                  onCheckedChange={(checked) =>
                    handleDurationChange(duration.value, checked)
                  }
                  className="h-3 w-3 sm:h-4 sm:w-4"
                />
                <Label
                  htmlFor={duration.value}
                  className="text-xs sm:text-sm font-normal"
                >
                  {duration.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Aircraft Type */}
        <div>
          <Label className="text-sm font-medium mb-2 sm:mb-3 block">
            Loại máy bay
          </Label>
          <div className="space-y-1 sm:space-y-2">
            {aircraftOptions.map((aircraft) => (
              <div key={aircraft.value} className="flex items-center space-x-2">
                <Checkbox
                  id={aircraft.value}
                  checked={(filters.aircraft || []).includes(aircraft.value)}
                  onCheckedChange={(checked) =>
                    handleAircraftChange(aircraft.value, checked)
                  }
                  className="h-3 w-3 sm:h-4 sm:w-4"
                />
                <Label
                  htmlFor={aircraft.value}
                  className="text-xs sm:text-sm font-normal"
                >
                  {aircraft.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
