"use client";

import React, { useState, useMemo } from "react";
import countries from "world-countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Transform country data for easier usage
const transformedCountries = countries
  .map((country) => ({
    code: country.cca2,
    name: country.name.common,
    nativeName: country.name.nativeName
      ? Object.values(country.name.nativeName)[0]?.common
      : country.name.common,
    callingCode: country.idd?.root
      ? `${country.idd.root}${country.idd.suffixes?.[0] || ""}`
      : "",
    flag: country.flag,
    emoji: country.flag,
  }))
  .sort((a, b) => {
    // Prioritize Vietnam
    if (a.code === "VN") return -1;
    if (b.code === "VN") return 1;
    return a.name.localeCompare(b.name);
  });

export const CountrySelect = ({
  value,
  onChange,
  onCallingCodeChange,
  error,
  disabled = false,
  className,
  placeholder = "Chọn quốc gia...",
  showFlag = true,
  showCallingCode = false,
  defaultCountry = "VN", // Default to Vietnam
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter countries based on search term
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return transformedCountries;

    return transformedCountries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Get selected country info
  const selectedCountry = transformedCountries.find(
    (country) => country.code === value || country.name === value
  );

  // Handle country selection
  const handleSelectCountry = (countryValue) => {
    const country = transformedCountries.find(
      (c) => c.code === countryValue || c.name === countryValue
    );

    if (country) {
      onChange(country.name); // Return country name for storage
      if (onCallingCodeChange && country.callingCode) {
        onCallingCodeChange(country.callingCode);
      }
    }
  };

  // Set default value on mount if not set
  React.useEffect(() => {
    if (!value && defaultCountry) {
      const defaultCountryData = transformedCountries.find(
        (c) => c.code === defaultCountry
      );
      if (defaultCountryData) {
        handleSelectCountry(defaultCountryData.code);
      }
    }
  }, [value, defaultCountry]);

  return (
    <Select
      value={selectedCountry?.code || value}
      onValueChange={handleSelectCountry}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "w-full",
          error && "border-red-500 focus:border-red-500",
          className
        )}
      >
        <SelectValue placeholder={placeholder}>
          {selectedCountry && (
            <div className="flex items-center gap-2">
              {showFlag && (
                <span className="text-lg">{selectedCountry.emoji}</span>
              )}
              <span>{selectedCountry.name}</span>
              {showCallingCode && selectedCountry.callingCode && (
                <span className="text-gray-500 text-sm">
                  ({selectedCountry.callingCode})
                </span>
              )}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[200px] sm:max-h-[250px] md:max-h-[300px] max-w-[80vw]">
        {/* Search Input */}
        <div className="p-2 border-b">
          <Input
            placeholder="Tìm kiếm quốc gia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* Country List */}
        <div className="max-h-[120px] sm:max-h-[150px] md:max-h-[200px] overflow-y-auto">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2 w-full">
                  {showFlag && <span className="text-lg">{country.emoji}</span>}
                  <div className="flex-1">
                    <span>{country.name}</span>
                    {country.nativeName !== country.name && (
                      <span className="text-gray-500 text-sm ml-1">
                        ({country.nativeName})
                      </span>
                    )}
                  </div>
                  {showCallingCode && country.callingCode && (
                    <span className="text-gray-500 text-sm">
                      {country.callingCode}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-center text-gray-500 text-sm">
              Không tìm thấy quốc gia nào
            </div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
};

// Helper function to get country by code
export const getCountryByCode = (code) => {
  return transformedCountries.find((country) => country.code === code);
};

// Helper function to get country by name
export const getCountryByName = (name) => {
  return transformedCountries.find((country) => country.name === name);
};

// Helper function to get Vietnam as default
export const getVietnamCountry = () => {
  return transformedCountries.find((country) => country.code === "VN");
};

export default CountrySelect;
