import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Hook để force update title khi route thay đổi
 */
export const useRouteTitle = (title, suffix = "AirSky") => {
  const location = useLocation();

  useEffect(() => {
    // Force update title mỗi khi route thay đổi
    const fullTitle = title ? `${title} | ${suffix}` : suffix;
    document.title = fullTitle;

    // Thêm timeout để đảm bảo title được cập nhật sau khi component render
    const timeoutId = setTimeout(() => {
      document.title = fullTitle;
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [title, suffix, location.pathname, location.search]);
};

export default useRouteTitle;
