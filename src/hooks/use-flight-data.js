import { useState, useEffect } from "react";
import { formatFlightDetails } from "@/utils/flight-utils";

export default function useFlightData(locationState) {
  const [flightData, setFlightData] = useState(null);
  const [selectedFare, setSelectedFare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFlightData(locationState);
  }, [locationState]);

  const loadFlightData = async (state) => {
    try {
      setLoading(true);
      setError(null);
      
      // Try location state first
      if (state?.flightData) {
        setFlightData(state.flightData);
        if (state.flightData.selectedFare) {
          setSelectedFare(state.flightData.selectedFare);
        }
        setLoading(false);
        return;
      }

      // Check for itinerary data
      if (state?.itineraryData) {
        const processedData = processItineraryData(state.itineraryData);
        setFlightData(processedData.flightData);
        setSelectedFare(processedData.selectedFare);
        setLoading(false);
        return;
      }

      // Fallback to localStorage
      const storedData = await loadFromLocalStorage();
      setFlightData(storedData.flightData);
      setSelectedFare(storedData.selectedFare);
      
    } catch (err) {
      setError(err.message);
      console.error("Error loading flight data:", err);
    } finally {
      setLoading(false);
    }
  };

  const processItineraryData = (itineraryData) => {
    if (!itineraryData) return { flightData: null, selectedFare: null };

    if (itineraryData.legs && Array.isArray(itineraryData.legs)) {
      // Multi-leg itinerary
      return {
        flightData: {
          itineraryId: itineraryData.itineraryId || `itinerary-${Date.now()}`,
          tripType: itineraryData.tripType || "ONE_WAY",
          legs: itineraryData.legs,
          ...itineraryData.legs[0],
          totalLegs: itineraryData.legs.length,
          isMultiCity: itineraryData.tripType === "MULTI_CITY" || itineraryData.legs.length > 1,
          originalItinerary: itineraryData,
        },
        selectedFare: itineraryData.selectedFare
      };
    }

    // Single flight
    if (itineraryData.flightNumber || itineraryData.flightId) {
      return {
        flightData: {
          ...itineraryData,
          itineraryId: itineraryData.flightId || `single-${Date.now()}`,
          tripType: "ONE_WAY",
          legs: [itineraryData],
          totalLegs: 1,
          isMultiCity: false,
          originalItinerary: itineraryData,
        },
        selectedFare: itineraryData.selectedFare
      };
    }

    return { flightData: null, selectedFare: null };
  };

  const loadFromLocalStorage = async () => {
    const storedItinerary = localStorage.getItem("selectedItinerary");
    const storedFlight = localStorage.getItem("selectedFlight");
    const storedFare = localStorage.getItem("selectedFare");

    // Priority: itinerary > flight > fare
    if (storedItinerary && storedItinerary !== "undefined" && storedItinerary !== "null") {
      try {
        const parsedItinerary = JSON.parse(storedItinerary);
        const processedData = processItineraryData(parsedItinerary);
        return {
          flightData: processedData.flightData,
          selectedFare: parsedItinerary.selectedFare || JSON.parse(storedFare || "{}")
        };
      } catch (error) {
        console.error("Error parsing itinerary from localStorage:", error);
      }
    }

    if (storedFlight && storedFlight !== "undefined" && storedFlight !== "null") {
      try {
        const parsedFlight = JSON.parse(storedFlight);
        return {
          flightData: parsedFlight,
          selectedFare: JSON.parse(storedFare || "{}")
        };
      } catch (error) {
        console.error("Error parsing flight from localStorage:", error);
      }
    }

    return { flightData: null, selectedFare: null };
  };

  return {
    flightData,
    selectedFare,
    formattedFlightDetails: flightData ? formatFlightDetails(flightData, selectedFare) : null,
    loading,
    error,
    refetch: () => loadFlightData(locationState)
  };
}