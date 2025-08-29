import { createContext, useContext } from "react";
import { useTheme as useThemeHook } from "@/hooks/use-theme";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const theme = useThemeHook();

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
