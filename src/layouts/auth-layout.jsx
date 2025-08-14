import { Outlet } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const AuthLayout = () => {
  return (
    <div className=" flex flex-col min-h-screen bg-white ">
      <main className="flex-1 bg-gray-600">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
