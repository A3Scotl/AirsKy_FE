import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";

export const ThemeToggle = ({
  variant = "ghost",
  size = "sm",
  showText = false,
  className = "",
}) => {
  const { isDark, toggle } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggle}
      className={`${
        showText ? "flex items-center space-x-2" : ""
      } ${className}`}
      title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
    >
      {isDark ? (
        <Sun className={`${showText ? "w-4 h-4" : "w-5 h-5"}`} />
      ) : (
        <Moon className={`${showText ? "w-4 h-4" : "w-5 h-5"}`} />
      )}
      {showText && <span>{isDark ? "Chế độ sáng" : "Chế độ tối"}</span>}
    </Button>
  );
};
