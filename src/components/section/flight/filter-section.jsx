"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, RotateCcw } from "lucide-react"

/**
 * @typedef {Object} FilterOptions
 * @property {[number, number]} priceRange
 * @property {string[]} airlines
 * @property {string[]} departureTime
 * @property {string[]} stops
 * @property {string[]} duration
 * @property {string[]} aircraft
 * @property {string} sortBy
 */

/**
 * @typedef {Object} FlightFiltersProps
 * @property {FilterOptions} filters
 * @property {(filters: FilterOptions) => void} onFiltersChange
 * @property {() => void} onReset
 */

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
    "Bamboo Airways"
  ]

  const departureTimeSlots = [
    { value: "early-morning", label: "Early Morning (00:00 - 06:00)" },
    { value: "morning", label: "Morning (06:00 - 12:00)" },
    { value: "afternoon", label: "Afternoon (12:00 - 18:00)" },
    { value: "evening", label: "Evening (18:00 - 24:00)" },
  ]

  const stopsOptions = [
    { value: "non-stop", label: "Non-stop" },
    { value: "1-stop", label: "1 Stop" },
    { value: "2-stops", label: "2+ Stops" },
  ]

  const durationOptions = [
    { value: "short", label: "Short (0-3 hours)" },
    { value: "medium", label: "Medium (3-6 hours)" },
    { value: "long", label: "Long (6+ hours)" },
  ]

  const aircraftOptions = [
    { value: "boeing", label: "Boeing" },
    { value: "airbus", label: "Airbus" },
    { value: "embraer", label: "Embraer" },
    { value: "other", label: "Other" },
  ]

  const sortOptions = [
    { value: "price-asc", label: "Lowest Price" },
    { value: "price-desc", label: "Highest Price" },
    { value: "departure-asc", label: "Earliest Departure" },
    { value: "departure-desc", label: "Latest Departure" },
    { value: "duration-asc", label: "Shortest Duration" },
    { value: "duration-desc", label: "Longest Duration" },
  ]

  const handleAirlineChange = (airline, checked) => {
    const newAirlines = checked ? [...filters.airlines, airline] : filters.airlines.filter((a) => a !== airline)
    onFiltersChange({ ...filters, airlines: newAirlines })
  }

  const handleDepartureTimeChange = (timeSlot, checked) => {
    const newDepartureTimes = checked
      ? [...filters.departureTime, timeSlot]
      : filters.departureTime.filter((t) => t !== timeSlot)
    onFiltersChange({ ...filters, departureTime: newDepartureTimes })
  }

  const handleStopsChange = (stop, checked) => {
    const newStops = checked 
      ? [...(filters.stops || []), stop] 
      : (filters.stops || []).filter((s) => s !== stop)
    onFiltersChange({ ...filters, stops: newStops })
  }

  const handleDurationChange = (duration, checked) => {
    const newDurations = checked 
      ? [...(filters.duration || []), duration] 
      : (filters.duration || []).filter((d) => d !== duration)
    onFiltersChange({ ...filters, duration: newDurations })
  }

  const handleAircraftChange = (aircraft, checked) => {
    const newAircraft = checked 
      ? [...(filters.aircraft || []), aircraft] 
      : (filters.aircraft || []).filter((a) => a !== aircraft)
    onFiltersChange({ ...filters, aircraft: newAircraft })
  }

  return (
    <Card className="p-4 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter Flights
        </h3>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-6">
        {/* Sort By */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Sort By</Label>
          <Select value={filters.sortBy} onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
          </Label>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => onFiltersChange({ ...filters, priceRange: value })}
            max={1000}
            min={20}
            step={10}
            className="w-full"
          />
        </div>

        {/* Airlines */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Airlines</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {airlines.map((airline) => (
              <div key={airline} className="flex items-center space-x-2">
                <Checkbox
                  id={airline}
                  checked={filters.airlines.includes(airline)}
                  onCheckedChange={(checked) => handleAirlineChange(airline, checked)}
                />
                <Label htmlFor={airline} className="text-sm font-normal">
                  {airline}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Stops */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Number of Stops</Label>
          <div className="space-y-2">
            {stopsOptions.map((stop) => (
              <div key={stop.value} className="flex items-center space-x-2">
                <Checkbox
                  id={stop.value}
                  checked={(filters.stops || []).includes(stop.value)}
                  onCheckedChange={(checked) => handleStopsChange(stop.value, checked)}
                />
                <Label htmlFor={stop.value} className="text-sm font-normal">
                  {stop.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Departure Time */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Departure Time</Label>
          <div className="space-y-2">
            {departureTimeSlots.map((slot) => (
              <div key={slot.value} className="flex items-center space-x-2">
                <Checkbox
                  id={slot.value}
                  checked={filters.departureTime.includes(slot.value)}
                  onCheckedChange={(checked) => handleDepartureTimeChange(slot.value, checked)}
                />
                <Label htmlFor={slot.value} className="text-sm font-normal">
                  {slot.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Flight Duration */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Flight Duration</Label>
          <div className="space-y-2">
            {durationOptions.map((duration) => (
              <div key={duration.value} className="flex items-center space-x-2">
                <Checkbox
                  id={duration.value}
                  checked={(filters.duration || []).includes(duration.value)}
                  onCheckedChange={(checked) => handleDurationChange(duration.value, checked)}
                />
                <Label htmlFor={duration.value} className="text-sm font-normal">
                  {duration.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Aircraft Type */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Aircraft Type</Label>
          <div className="space-y-2">
            {aircraftOptions.map((aircraft) => (
              <div key={aircraft.value} className="flex items-center space-x-2">
                <Checkbox
                  id={aircraft.value}
                  checked={(filters.aircraft || []).includes(aircraft.value)}
                  onCheckedChange={(checked) => handleAircraftChange(aircraft.value, checked)}
                />
                <Label htmlFor={aircraft.value} className="text-sm font-normal">
                  {aircraft.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
