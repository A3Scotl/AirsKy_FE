"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DateTimePicker({
  date,
  onDateChange,
  placeholder = "Chọn ngày",
  className,
  disabled = false,
  minDate,
}) {
  const [selectedDate, setSelectedDate] = React.useState(date);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const handleDateSelect = (newDate) => {
    setSelectedDate(newDate);
    onDateChange?.(newDate);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "dd/MM/yyyy", { locale: vi })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
          locale={vi}
          disabled={minDate ? { before: minDate } : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}

export function TimePicker({
  value = "",
  onChange,
  placeholder = "Chọn giờ",
  className,
  disabled = false,
}) {
  const handleTimeChange = (e) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="relative">
      <input
        type="time"
        value={value}
        onChange={handleTimeChange}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}
