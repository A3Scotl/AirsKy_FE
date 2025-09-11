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
        departDate: departDateStr
          ? (() => {
              const [year, month, day] = departDateStr.split("-").map(Number);
              if (
                year &&
                month &&
                day &&
                month >= 1 &&
                month <= 12 &&
                day >= 1 &&
                day <= 31
              ) {
                const date = new Date(year, month - 1, day);
                return isNaN(date.getTime()) ? null : date;
              }
              return null;
            })()
          : null,
        returnDate: returnDateStr
          ? (() => {
              const [year, month, day] = returnDateStr.split("-").map(Number);
              if (
                year &&
                month &&
                day &&
                month >= 1 &&
                month <= 12 &&
                day >= 1 &&
                day <= 31
              ) {
                const date = new Date(year, month - 1, day);
                return isNaN(date.getTime()) ? null : date;
              }
              return null;
            })()
          : null,
        tripType: searchParams.get("tripType") || "oneway",
        passengers: searchParams.get("passengers")
          ? JSON.parse(searchParams.get("passengers"))
          : { adults: 1, children: 0, infants: 0 },
        searchCombinations: [],
      };

      // Validate dates (now handled in parsing logic above)
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

        // Convert date strings back to Date objects (local timezone)
        if (
          parsedCriteria.departDate &&
          typeof parsedCriteria.departDate === "string"
        ) {
          // Parse YYYY-MM-DD format and create date in local timezone
          const [year, month, day] = parsedCriteria.departDate
            .split("-")
            .map(Number);
          if (
            year &&
            month &&
            day &&
            month >= 1 &&
            month <= 12 &&
            day >= 1 &&
            day <= 31
          ) {
            parsedCriteria.departDate = new Date(year, month - 1, day);
            if (isNaN(parsedCriteria.departDate.getTime())) {
              console.warn(
                "Invalid departDate from localStorage:",
                parsedCriteria.departDate
              );
              parsedCriteria.departDate = null;
            }
          } else {
            console.warn(
              "Invalid departDate format from localStorage:",
              parsedCriteria.departDate
            );
            parsedCriteria.departDate = null;
          }
        }
        if (
          parsedCriteria.returnDate &&
          typeof parsedCriteria.returnDate === "string"
        ) {
          // Parse YYYY-MM-DD format and create date in local timezone
          const [year, month, day] = parsedCriteria.returnDate
            .split("-")
            .map(Number);
          if (
            year &&
            month &&
            day &&
            month >= 1 &&
            month <= 12 &&
            day >= 1 &&
            day <= 31
          ) {
            parsedCriteria.returnDate = new Date(year, month - 1, day);
            if (isNaN(parsedCriteria.returnDate.getTime())) {
              console.warn(
                "Invalid returnDate from localStorage:",
                parsedCriteria.returnDate
              );
              parsedCriteria.returnDate = null;
            }
          } else {
            console.warn(
              "Invalid returnDate format from localStorage:",
              parsedCriteria.returnDate
            );
            parsedCriteria.returnDate = null;
          }
        }

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

    // Ensure dates are Date objects before storing
    const processedCriteria = { ...criteria };
    if (
      processedCriteria.departDate &&
      typeof processedCriteria.departDate === "string"
    ) {
      // Parse YYYY-MM-DD format and create date in local timezone
      const [year, month, day] = processedCriteria.departDate
        .split("-")
        .map(Number);
      if (
        year &&
        month &&
        day &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31
      ) {
        processedCriteria.departDate = new Date(year, month - 1, day);
        if (isNaN(processedCriteria.departDate.getTime())) {
          console.warn(
            "Invalid departDate string:",
            processedCriteria.departDate
          );
          processedCriteria.departDate = null;
        }
      } else {
        console.warn(
          "Invalid departDate format:",
          processedCriteria.departDate
        );
        processedCriteria.departDate = null;
      }
    }
    if (
      processedCriteria.returnDate &&
      typeof processedCriteria.returnDate === "string"
    ) {
      // Parse YYYY-MM-DD format and create date in local timezone
      const [year, month, day] = processedCriteria.returnDate
        .split("-")
        .map(Number);
      if (
        year &&
        month &&
        day &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31
      ) {
        processedCriteria.returnDate = new Date(year, month - 1, day);
        if (isNaN(processedCriteria.returnDate.getTime())) {
          console.warn(
            "Invalid returnDate string:",
            processedCriteria.returnDate
          );
          processedCriteria.returnDate = null;
        }
      } else {
        console.warn(
          "Invalid returnDate format:",
          processedCriteria.returnDate
        );
        processedCriteria.returnDate = null;
      }
    }

    setSearchCriteria(processedCriteria);
    setHasProcessedInitialCriteria(true);

    // Store in localStorage for persistence (convert dates to local date strings)
    if (processedCriteria) {
      const storageCriteria = { ...processedCriteria };
      if (
        storageCriteria.departDate instanceof Date &&
        !isNaN(storageCriteria.departDate.getTime())
      ) {
        // Store date in YYYY-MM-DD format using local timezone
        const year = storageCriteria.departDate.getFullYear();
        const month = String(
          storageCriteria.departDate.getMonth() + 1
        ).padStart(2, "0");
        const day = String(storageCriteria.departDate.getDate()).padStart(
          2,
          "0"
        );
        storageCriteria.departDate = `${year}-${month}-${day}`;
      }
      if (
        storageCriteria.returnDate instanceof Date &&
        !isNaN(storageCriteria.returnDate.getTime())
      ) {
        // Store date in YYYY-MM-DD format using local timezone
        const year = storageCriteria.returnDate.getFullYear();
        const month = String(
          storageCriteria.returnDate.getMonth() + 1
        ).padStart(2, "0");
        const day = String(storageCriteria.returnDate.getDate()).padStart(
          2,
          "0"
        );
        storageCriteria.returnDate = `${year}-${month}-${day}`;
      }
      localStorage.setItem("searchCriteria", JSON.stringify(storageCriteria));
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
