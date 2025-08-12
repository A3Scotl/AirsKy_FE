"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

export function SearchForm() {
  const [tripType, setTripType] = useState("roundtrip");

  // Multi-city trips - minimum 2 trips required
  const [multiTrips, setMultiTrips] = useState([
    { from: "", to: "", date: "" },
    { from: "", to: "", date: "" },
  ]);

  const [passengerPopup, setPassengerPopup] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [travelClass, setTravelClass] = useState("Economy");

  const handleAddTrip = () =>
    setMultiTrips([...multiTrips, { from: "", to: "", date: "" }]);
  const handleRemoveTrip = (i) => {
    if (multiTrips.length > 2) {
      setMultiTrips(multiTrips.filter((_, idx) => idx !== i));
    }
  };

  const passengerSummary = `${adults} Adult${adults > 1 ? "s" : ""}${
    children > 0 ? `, ${children} Child${children > 1 ? "ren" : ""}` : ""
  }${
    infants > 0 ? `, ${infants} Infant${infants > 1 ? "s" : ""}` : ""
  } - ${travelClass}`;

  return (
    <Card className="bg-white/95 backdrop-blur-sm p-6 max-w-5xl mx-auto">
      <div className="space-y-6">
        {/* Tabs + Passenger Selector */}
        <div className="flex items-center">
          {[
            { key: "roundtrip", label: "Round Trip" },
            { key: "oneway", label: "One Way" },
            { key: "multicity", label: "Multi-city" },
          ].map((tab) => (
            <div
              key={tab.key}
              onClick={() => setTripType(tab.key)}
              className={`px-4 py-2 cursor-pointer transition-colors ${
                tripType === tab.key 
                  ? "bg-blue-500 text-white" 
                  : "hover:bg-blue-100 text-gray-700"
              }`}
            >
              {tab.label}
            </div>
          ))}

          {/* Passenger Button */}
          <div className="relative ml-4">
            <Button
              variant="outline"
              onClick={() => setPassengerPopup(!passengerPopup)}
              className="min-w-[220px] justify-between"
            >
              {passengerSummary}
              {/* icon chevron-down */}
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 10l5 5 5-5"
                />
              </svg>
            </Button>

            {passengerPopup && (
              <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72 z-50">
                {/* Adults */}
                {[
                  {
                    label: "Adults",
                    value: adults,
                    setter: setAdults,
                    sub: "12+ years",
                  },
                  {
                    label: "Children",
                    value: children,
                    setter: setChildren,
                    sub: "2–11 years",
                  },
                  {
                    label: "Infants",
                    value: infants,
                    setter: setInfants,
                    sub: "< 2 years",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center py-2"
                  >
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-sm text-gray-500">{item.sub}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => item.setter(Math.max(0, item.value - 1))}
                      >
                        –
                      </Button>
                      <span className="w-6 text-center">{item.value}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => item.setter(item.value + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Class Selection */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <select
                    value={travelClass}
                    onChange={(e) => setTravelClass(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                  >
                    <option>Economy</option>
                    <option>Premium Economy</option>
                    <option>Business</option>
                    <option>First</option>
                  </select>
                </div>

                {/* Done Button */}
                <Button
                  className="w-full mt-4 bg-blue-500 text-white"
                  onClick={() => setPassengerPopup(false)}
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Round Trip Form */}
        {tripType === "roundtrip" && (
          <div className="grid md:grid-cols-5 gap-4">
            <Input placeholder="From" />
            <Input placeholder="To" />
            <Input type="date" />
            <Input type="date" />
            <Button className="bg-blue-500 text-white">Search Flights</Button>
          </div>
        )}

        {/* One Way Form */}
        {tripType === "oneway" && (
          <div className="grid md:grid-cols-4 gap-4">
            <Input placeholder="From" />
            <Input placeholder="To" />
            <Input type="date" />
            <Button className="bg-blue-500 text-white">Search Flights</Button>
          </div>
        )}

        {/* Multi-city Form */}
        {tripType === "multicity" && (
          <div className="space-y-4">
            {multiTrips.map((trip, index) => (
              <div key={index} className="flex gap-4 items-center">
                <Input placeholder="From" />
                <Input placeholder="To" />
                <Input type="date" />
                {multiTrips.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTrip(index)}
                    className="text-red-500 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="link"
              onClick={handleAddTrip}
              className="text-blue-500"
            >
              + Add another flight
            </Button>
            <Button className="bg-blue-500 text-white">Search Flights</Button>
          </div>
        )}
      </div>
    </Card>
  );
}
