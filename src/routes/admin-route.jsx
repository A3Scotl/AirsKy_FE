import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import LoadingPage from "@/pages/loading/loading-page";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    if (!loading && !user && !hasShownToast) {
      toast.error("Bạn cần đăng nhập để truy cập trang này");
      setHasShownToast(true);
    } else if (
      !loading &&
      user &&
      user.role !== "ADMIN" &&
      user.role !== "BUSINESS" &&
      !hasShownToast
    ) {
      toast.error("Truy cập bị từ chối. Cần quyền Admin hoặc Business.");
      setHasShownToast(true);
    }
  }, [user, loading, hasShownToast]);

  // Đang loading
  if (loading) {
    return <LoadingPage />;
  }

  // Chưa đăng nhập
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Người dùng thường
  if (user.role === "USER") {
    return <Navigate to="/auth" replace />;
  }

  // Admin hoặc Business → cho phép vào
  return children;
};

export default AdminRoute;
