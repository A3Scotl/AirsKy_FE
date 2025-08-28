import { createContext, useContext, useState, useEffect } from "react";

const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [searchCriteria, setSearchCriteria] = useState(null);

  const updateSearchCriteria = (criteria) => {
    setSearchCriteria(criteria);
    // Also store in localStorage for persistence
    if (criteria) {
      localStorage.setItem("searchCriteria", JSON.stringify(criteria));
    } else {
      localStorage.removeItem("searchCriteria");
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("searchCriteria");
    if (saved) {
      try {
        setSearchCriteria(JSON.parse(saved));
      } catch (error) {
        console.error("Error parsing saved search criteria:", error);
      }
    }
  }, []);

  return (
    <SearchContext.Provider value={{ searchCriteria, updateSearchCriteria }}>
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
