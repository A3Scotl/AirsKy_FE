"use client";

import { FlightSearchResults } from "../../components/section/flight/result-section";
import { SuggestionDestination } from "../../components/section/flight/suggestion-section";

export default function FlightPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <FlightSearchResults />

      <div className="mt-16">
        <SuggestionDestination />
      </div>
    </div>
  );
}
