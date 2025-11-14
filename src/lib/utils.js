import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a Date object to local date string (YYYY-MM-DD) without timezone conversion
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string in YYYY-MM-DD format
 */
export function formatLocalDate(date) {
  if (!date || !(date instanceof Date) || isNaN(date)) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
