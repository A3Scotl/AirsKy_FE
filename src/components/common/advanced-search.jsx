import React, { useState, useEffect } from "react";
import { Search, X, Filter, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";

const AdvancedSearch = ({
  onSearch,
  onFilterChange,
  placeholder = "Tìm kiếm...",
  filterConfigs = [],
  showFilters = true,
  className = "",
  debounceDelay = 300,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateFilters, setDateFilters] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchValue);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [searchValue, onSearch, debounceDelay]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...activeFilters };

    if (value === "all" || value === "" || value === null) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }

    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateFilterChange = (key, date) => {
    const newDateFilters = { ...dateFilters };
    const newActiveFilters = { ...activeFilters };

    if (date && date instanceof Date && !isNaN(date.getTime())) {
      newDateFilters[key] = date;
      newActiveFilters[key] = format(date, "yyyy-MM-dd");
    } else {
      delete newDateFilters[key];
      delete newActiveFilters[key];
    }

    setDateFilters(newDateFilters);
    setActiveFilters(newActiveFilters);
    onFilterChange(newActiveFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setDateFilters({});
    setSearchValue("");
    onFilterChange({});
    onSearch("");
  };

  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).length + (searchValue ? 1 : 0);
  };

  const renderFilter = (filterConfig) => {
    const { key, label, type, options, placeholder } = filterConfig;

    switch (type) {
      case "select":
        return (
          <div key={key} className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            <Select
              value={activeFilters[key] || "all"}
              onValueChange={(value) => handleFilterChange(key, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={placeholder || `Tất cả ${label}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả {label}</SelectItem>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "date":
        return (
          <div key={key} className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilters[key] &&
                  dateFilters[key] instanceof Date &&
                  !isNaN(dateFilters[key].getTime()) ? (
                    format(dateFilters[key], "PPP")
                  ) : (
                    <span>{placeholder || `Chọn ${label.toLowerCase()}`}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFilters[key]}
                  onSelect={(date) => handleDateFilterChange(key, date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case "number":
        return (
          <div key={key} className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            <Select
              value={activeFilters[key] || "all"}
              onValueChange={(value) => handleFilterChange(key, value)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={placeholder || `Bất kỳ ${label.toLowerCase()}`}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Bất kỳ {label}</SelectItem>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-gray-100"
              onClick={() => setSearchValue("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {showFilters && (
          <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative dark:text-white">
                <Filter className="h-4 w-4 mr-2" />
                Bộ lọc
                {getActiveFilterCount() > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Bộ lọc nâng cao</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-6 px-2 text-xs"
                  >
                    Xóa tất cả
                  </Button>
                </div>

                {filterConfigs.map((filterConfig) =>
                  renderFilter(filterConfig)
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearch;
