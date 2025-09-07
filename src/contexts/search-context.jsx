import { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";

const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [searchCriteria, setSearchCriteria] = useState(null);
  const [hasProcessedInitialCriteria, setHasProcessedInitialCriteria] =
    useState(false);

  // Process search criteria from URL params, location state, or localStorage
  useEffect(() => {
    // Skip if we've already processed initial criteria and no new location state
    if (hasProcessedInitialCriteria && !location.state?.searchCriteria) {
      return;
    }

    // Priority: URL params (from result page search) > Location state (destination click) > localStorage
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // If we have URL params (indicating a search from result page), use them first
    if (fromParam || toParam) {
      const departDateStr = searchParams.get("departDate");
      const returnDateStr = searchParams.get("returnDate");

      const urlCriteria = {
        from: fromParam,
        to: toParam,
        departDate: departDateStr ? new Date(departDateStr) : null,
        returnDate: returnDateStr ? new Date(returnDateStr) : null,
        tripType: searchParams.get("tripType") || "oneway",
        passengers: searchParams.get("passengers")
          ? JSON.parse(searchParams.get("passengers"))
          : { adults: 1, children: 0, infants: 0 },
        searchCombinations: [],
      };

      // Validate dates
      if (urlCriteria.departDate && isNaN(urlCriteria.departDate.getTime())) {
        console.warn("Invalid departDate from URL params:", departDateStr);
        urlCriteria.departDate = null;
      }
      if (urlCriteria.returnDate && isNaN(urlCriteria.returnDate.getTime())) {
        console.warn("Invalid returnDate from URL params:", returnDateStr);
        urlCriteria.returnDate = null;
      }

      console.log("🔗 Using search criteria from URL params:", urlCriteria);
      setSearchCriteria(urlCriteria);
      setHasProcessedInitialCriteria(true);
      return;
    }

    // If no URL params but we have location state (destination click), use it
    if (location.state?.searchCriteria) {
      console.log(
        "🎯 Using search criteria from destination click:",
        location.state.searchCriteria
      );
      setSearchCriteria(location.state.searchCriteria);
      setHasProcessedInitialCriteria(true);
      return;
    }

    // Finally, check localStorage as fallback
    const saved = localStorage.getItem("searchCriteria");
    if (saved && !hasProcessedInitialCriteria) {
      try {
        const parsedCriteria = JSON.parse(saved);
        console.log(
          "💾 Using search criteria from localStorage:",
          parsedCriteria
        );
        setSearchCriteria(parsedCriteria);
      } catch (error) {
        console.error("Error parsing saved search criteria:", error);
      }
    }

    setHasProcessedInitialCriteria(true);
  }, [searchParams, location.state, hasProcessedInitialCriteria]);

  const updateSearchCriteria = (criteria) => {
    console.log("🔄 Updating search criteria:", criteria);
    setSearchCriteria(criteria);
    setHasProcessedInitialCriteria(true);

    // Store in localStorage for persistence
    if (criteria) {
      localStorage.setItem("searchCriteria", JSON.stringify(criteria));
    } else {
      localStorage.removeItem("searchCriteria");
    }
  };

  const clearSearchCriteria = () => {
    console.log("🗑️ Clearing search criteria");
    setSearchCriteria(null);
    setHasProcessedInitialCriteria(false);
    localStorage.removeItem("searchCriteria");
    // Clear URL params
    window.history.replaceState({}, "", window.location.pathname);
  };

  return (
    <SearchContext.Provider
      value={{
        searchCriteria,
        updateSearchCriteria,
        clearSearchCriteria,
        searchParams: searchParams, // Expose searchParams for components that need it
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
