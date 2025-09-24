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
    } else if (!loading && user && user.role !== "ADMIN" && !hasShownToast) {
      toast.error("Vui lớng đăng nhập với vai trò Admin nếu muốn truy cập");
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

  // Đã đăng nhập nhưng không phải admin
  if (user.role !== "ADMIN") {
    return <Navigate to="/auth" replace />;
  }

  // Là admin - cho phép truy cập
  return children;
};

export default AdminRoute;
