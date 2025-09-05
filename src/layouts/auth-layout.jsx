import { Outlet } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ScrollToTop from "@/components/common/scroll-to-top";
const AuthLayout = () => {
  return (
    <div className=" flex flex-col min-h-screen bg-white ">
      <main className="flex-1 bg-gray-600">
        <Outlet />
      </main>
      <ScrollToTop />
    </div>
  );
};

export default AuthLayout;
